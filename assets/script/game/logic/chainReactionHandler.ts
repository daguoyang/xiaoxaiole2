import { SingletonClass } from "../../core/singletonClass";
import { GameStateManager, GameState, GamePhase } from "./gameStateManager";
import { MatchEngine, MatchResult } from "./matchEngine";
import { EliminationProcessor } from "./eliminationProcessor";
import { gridCmpt } from "../ui/item/gridCmpt";
import { ToolsHelper } from "../../utils/toolsHelper";
import { App } from "../../core/app";
import { EventName } from "../../const/eventName";

/**
 * 连锁反应配置
 */
export interface ChainReactionConfig {
    maxDepth: number;           // 最大连锁深度
    delayBetweenChains: number; // 连锁间延迟（毫秒）
    enableComboBonus: number;   // 连击奖励倍数
    fallAnimationDelay: number; // 下落动画延迟
}

/**
 * 连锁反应结果
 */
export interface ChainReactionResult {
    totalMatches: number;
    totalScore: number;
    maxCombo: number;
    chainDepth: number;
    hasMoreMatches: boolean;
}

/**
 * 全新的连锁反应处理器 - 替代原有的checkAgain递归机制
 * 使用迭代式处理和状态机管理，避免无限递归风险
 */
export class ChainReactionHandler extends SingletonClass<ChainReactionHandler> {
    private config: ChainReactionConfig = {
        maxDepth: 15,
        delayBetweenChains: 200,
        enableComboBonus: 1.2,
        fallAnimationDelay: 100
    };
    
    private gameStateManager: GameStateManager = null;
    private matchEngine: MatchEngine = null;
    private eliminationProcessor: EliminationProcessor = null;
    
    // 处理状态
    private isProcessing: boolean = false;
    private shouldContinue: boolean = true;
    private currentDepth: number = 0;
    
    // 回调函数
    private onScoreUpdate: (score: number) => void = null;
    private onMoveDown: () => Promise<void> = null;
    private onResultCheck: () => void = null;
    private onAnimationComplete: () => Promise<void> = null;

    protected async onInit(...args: any[]) {
        console.log('[ChainReactionHandler] 连锁反应处理器初始化');
        this.gameStateManager = GameStateManager.instance;
        await this.gameStateManager.init();
    }

    /**
     * 设置引擎依赖
     */
    setEngines(matchEngine: MatchEngine, eliminationProcessor: EliminationProcessor): void {
        this.matchEngine = matchEngine;
        this.eliminationProcessor = eliminationProcessor;
    }

    /**
     * 设置回调函数
     */
    setCallbacks(callbacks: {
        onScoreUpdate: (score: number) => void;
        onMoveDown: () => Promise<void>;
        onResultCheck: () => void;
        onAnimationComplete: () => Promise<void>;
    }): void {
        this.onScoreUpdate = callbacks.onScoreUpdate;
        this.onMoveDown = callbacks.onMoveDown;
        this.onResultCheck = callbacks.onResultCheck;
        this.onAnimationComplete = callbacks.onAnimationComplete;
    }

    /**
     * 开始连锁反应处理 - 新的主要入口点
     */
    async startChainReaction(board: (gridCmpt | null)[][], isFromPlayerAction: boolean = false): Promise<ChainReactionResult> {
        if (this.isProcessing) {
            console.warn('[ChainReactionHandler] 连锁反应正在处理中，忽略新的请求');
            return this.createEmptyResult();
        }

        console.log(`[ChainReactionHandler] 开始连锁反应处理 (玩家操作: ${isFromPlayerAction})`);
        
        this.isProcessing = true;
        this.shouldContinue = true;
        this.currentDepth = 0;
        
        // 设置游戏状态
        this.gameStateManager.setState(GameState.PROCESSING);
        
        const result: ChainReactionResult = {
            totalMatches: 0,
            totalScore: 0,
            maxCombo: 0,
            chainDepth: 0,
            hasMoreMatches: false
        };

        try {
            // 主循环 - 使用迭代而非递归
            while (this.shouldContinue && this.currentDepth < this.config.maxDepth) {
                const cycleResult = await this.processSingleCycle(board);
                
                if (!cycleResult.hasMatches) {
                    console.log(`[ChainReactionHandler] 第 ${this.currentDepth} 轮无匹配，结束连锁`);
                    break;
                }
                
                // 累加结果
                result.totalMatches += cycleResult.matchCount;
                result.totalScore += cycleResult.score;
                result.chainDepth = this.currentDepth;
                
                // 更新连击计数
                if (!this.gameStateManager.startChainReaction()) {
                    console.warn('[ChainReactionHandler] 达到最大连锁深度，强制结束');
                    break;
                }
                
                // 延迟以提供视觉反馈
                if (this.config.delayBetweenChains > 0) {
                    await ToolsHelper.delayTime(this.config.delayBetweenChains / 1000);
                }
                
                this.currentDepth++;
            }
            
            // 更新最大连击数
            const currentCombo = this.gameStateManager.getStats().currentCombo;
            result.maxCombo = currentCombo;
            
            console.log(`[ChainReactionHandler] 连锁反应完成 - 深度: ${result.chainDepth}, 匹配: ${result.totalMatches}, 分数: ${result.totalScore}, 连击: ${result.maxCombo}`);
            
        } catch (error) {
            console.error('[ChainReactionHandler] 连锁反应处理出错:', error);
        } finally {
            await this.finalizeCycle();
        }

        return result;
    }

    /**
     * 处理单个连锁循环
     */
    private async processSingleCycle(board: (gridCmpt | null)[][]): Promise<{hasMatches: boolean, matchCount: number, score: number}> {
        console.log(`[ChainReactionHandler] 处理第 ${this.currentDepth + 1} 轮连锁`);
        
        // 阶段1: 匹配检测
        this.gameStateManager.setPhase(GamePhase.MATCH_DETECTION);
        const matchResult = this.matchEngine.findMatches(board);
        
        if (!matchResult.hasMatches) {
            return { hasMatches: false, matchCount: 0, score: 0 };
        }
        
        // 阶段2: 消除处理
        this.gameStateManager.setPhase(GamePhase.ELIMINATION);
        await this.eliminationProcessor.processMatchResult(
            matchResult,
            board,
            (score: number) => {
                if (this.onScoreUpdate) {
                    // 应用连击奖励
                    const comboMultiplier = Math.pow(this.config.enableComboBonus, this.currentDepth);
                    const finalScore = Math.floor(score * comboMultiplier);
                    this.onScoreUpdate(finalScore);
                }
            }
        );
        
        // 阶段3: 重力下落
        this.gameStateManager.setPhase(GamePhase.GRAVITY_FALL);
        if (this.onMoveDown) {
            await this.onMoveDown();
        }
        
        // 等待下落动画完成
        if (this.config.fallAnimationDelay > 0) {
            await ToolsHelper.delayTime(this.config.fallAnimationDelay / 1000);
        }
        
        // 阶段4: 等待所有动画完成
        if (this.onAnimationComplete) {
            await this.onAnimationComplete();
        }
        
        return {
            hasMatches: true,
            matchCount: matchResult.matches.length,
            score: matchResult.totalScore
        };
    }

    /**
     * 完成连锁循环的清理工作
     */
    private async finalizeCycle(): Promise<void> {
        this.isProcessing = false;
        
        // 结束连锁反应
        this.gameStateManager.endChainReaction();
        
        // 设置状态为检查结果
        this.gameStateManager.setState(GameState.CHECKING);
        
        // 执行结果检查
        if (this.onResultCheck) {
            this.onResultCheck();
        }
        
        // 如果游戏未结束，返回等待输入状态
        if (!this.gameStateManager.isGameEnded()) {
            this.gameStateManager.setState(GameState.PLAYER_INPUT);
        }
        
        console.log('[ChainReactionHandler] 连锁反应处理完成，等待下一步操作');
    }

    /**
     * 强制停止连锁反应
     */
    forceStop(): void {
        console.log('[ChainReactionHandler] 强制停止连锁反应');
        this.shouldContinue = false;
        this.isProcessing = false;
        this.gameStateManager.forceStop();
    }

    /**
     * 检查是否可以开始新的连锁反应
     */
    canStartNewChain(): boolean {
        return !this.isProcessing && 
               this.gameStateManager.canAcceptInput() &&
               !this.gameStateManager.isGameEnded();
    }

    /**
     * 设置连锁反应配置
     */
    setConfig(config: Partial<ChainReactionConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('[ChainReactionHandler] 配置已更新:', this.config);
    }

    /**
     * 获取当前处理状态
     */
    getProcessingState(): {
        isProcessing: boolean;
        currentDepth: number;
        gameState: GameState;
        gamePhase: GamePhase;
    } {
        return {
            isProcessing: this.isProcessing,
            currentDepth: this.currentDepth,
            gameState: this.gameStateManager.getCurrentState(),
            gamePhase: this.gameStateManager.getCurrentPhase()
        };
    }

    /**
     * 创建空结果
     */
    private createEmptyResult(): ChainReactionResult {
        return {
            totalMatches: 0,
            totalScore: 0,
            maxCombo: 0,
            chainDepth: 0,
            hasMoreMatches: false
        };
    }

    /**
     * 简化的单次匹配检查 - 用于替换原有的简单检查场景
     */
    async quickMatchCheck(board: (gridCmpt | null)[][]): Promise<boolean> {
        if (!this.matchEngine) {
            console.warn('[ChainReactionHandler] 匹配引擎未设置');
            return false;
        }
        
        const matchResult = this.matchEngine.findMatches(board);
        
        if (matchResult.hasMatches) {
            console.log(`[ChainReactionHandler] 快速检查发现 ${matchResult.matches.length} 个匹配`);
            
            // 处理匹配但不启动完整连锁
            await this.eliminationProcessor.processMatchResult(
                matchResult,
                board,
                this.onScoreUpdate
            );
            
            return true;
        }
        
        return false;
    }
}