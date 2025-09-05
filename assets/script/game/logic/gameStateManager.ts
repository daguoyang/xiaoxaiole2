import { SingletonClass } from "../../core/singletonClass";
import { App } from "../../core/app";
import { EventName } from "../../const/eventName";

/**
 * 游戏状态枚举
 */
export enum GameState {
    IDLE = 'idle',                    // 空闲状态
    PLAYER_INPUT = 'player_input',    // 等待玩家输入
    PROCESSING = 'processing',        // 处理中（动画、匹配等）
    CHECKING = 'checking',            // 检查匹配状态
    ANIMATING = 'animating',          // 播放动画
    FALLING = 'falling',              // 方块下落
    SHUFFLING = 'shuffling',          // 洗牌中
    GAME_OVER = 'game_over',          // 游戏结束
    LEVEL_WIN = 'level_win',          // 关卡胜利
    PAUSED = 'paused'                 // 暂停状态
}

/**
 * 游戏循环阶段
 */
export enum GamePhase {
    MATCH_DETECTION = 'match_detection',
    ELIMINATION = 'elimination',
    GRAVITY_FALL = 'gravity_fall',
    REFILL = 'refill',
    COMBO_CHECK = 'combo_check',
    RESULT_CHECK = 'result_check'
}

/**
 * 游戏统计数据
 */
export interface GameStats {
    totalMatches: number;
    totalScore: number;
    maxCombo: number;
    currentCombo: number;
    stepsRemaining: number;
    targetProgress: number[];
}

/**
 * 全新的游戏状态管理器 - 替代原有的分散状态管理
 * 使用状态机模式和事件驱动架构
 */
export class GameStateManager extends SingletonClass<GameStateManager> {
    private currentState: GameState = GameState.IDLE;
    private currentPhase: GamePhase = GamePhase.MATCH_DETECTION;
    private previousState: GameState = GameState.IDLE;
    
    // 游戏数据
    private gameStats: GameStats = {
        totalMatches: 0,
        totalScore: 0,
        maxCombo: 0,
        currentCombo: 0,
        stepsRemaining: 0,
        targetProgress: []
    };
    
    // 状态控制
    private isProcessingChain: boolean = false;
    private chainDepth: number = 0;
    private maxChainDepth: number = 20; // 防止无限循环
    private stateHistory: GameState[] = [];
    
    protected async onInit(...args: any[]) {
        console.log('[GameStateManager] 游戏状态管理器初始化');
        this.resetState();
    }

    /**
     * 重置游戏状态
     */
    resetState(): void {
        this.currentState = GameState.IDLE;
        this.currentPhase = GamePhase.MATCH_DETECTION;
        this.previousState = GameState.IDLE;
        this.isProcessingChain = false;
        this.chainDepth = 0;
        this.stateHistory = [];
        
        this.gameStats = {
            totalMatches: 0,
            totalScore: 0,
            maxCombo: 0,
            currentCombo: 0,
            stepsRemaining: 0,
            targetProgress: []
        };
        
        console.log('[GameStateManager] 状态已重置');
    }

    /**
     * 设置游戏状态
     */
    setState(newState: GameState): void {
        if (this.currentState === newState) {
            return;
        }
        
        const oldState = this.currentState;
        this.previousState = oldState;
        this.currentState = newState;
        
        // 添加到历史记录
        this.stateHistory.push(oldState);
        if (this.stateHistory.length > 50) {
            this.stateHistory.shift(); // 保持历史记录在合理范围内
        }
        
        console.log(`[GameStateManager] 状态变更: ${oldState} → ${newState}`);
        
        // 发送状态变更事件
        App.event.emit(EventName.Game.StateChanged, oldState, newState);
        
        // 执行状态进入逻辑
        this.onStateEnter(newState, oldState);
    }

    /**
     * 状态进入处理
     */
    private onStateEnter(newState: GameState, oldState: GameState): void {
        switch (newState) {
            case GameState.PLAYER_INPUT:
                this.onEnterPlayerInput();
                break;
            case GameState.PROCESSING:
                this.onEnterProcessing();
                break;
            case GameState.CHECKING:
                this.onEnterChecking();
                break;
            case GameState.LEVEL_WIN:
                this.onEnterLevelWin();
                break;
            case GameState.GAME_OVER:
                this.onEnterGameOver();
                break;
        }
    }

    private onEnterPlayerInput(): void {
        console.log('[GameStateManager] 等待玩家输入...');
        // 重置连击计数
        this.gameStats.currentCombo = 0;
        this.chainDepth = 0;
        this.isProcessingChain = false;
    }

    private onEnterProcessing(): void {
        console.log('[GameStateManager] 开始处理游戏逻辑...');
        this.isProcessingChain = true;
    }

    private onEnterChecking(): void {
        console.log('[GameStateManager] 检查匹配状态...');
    }

    private onEnterLevelWin(): void {
        console.log('[GameStateManager] 关卡胜利！');
        this.isProcessingChain = false;
    }

    private onEnterGameOver(): void {
        console.log('[GameStateManager] 游戏结束');
        this.isProcessingChain = false;
    }

    /**
     * 获取当前状态
     */
    getCurrentState(): GameState {
        return this.currentState;
    }

    /**
     * 获取当前阶段
     */
    getCurrentPhase(): GamePhase {
        return this.currentPhase;
    }

    /**
     * 设置当前阶段
     */
    setPhase(phase: GamePhase): void {
        if (this.currentPhase !== phase) {
            console.log(`[GameStateManager] 阶段变更: ${this.currentPhase} → ${phase}`);
            this.currentPhase = phase;
        }
    }

    /**
     * 检查是否可以接收玩家输入
     */
    canAcceptInput(): boolean {
        return this.currentState === GameState.PLAYER_INPUT || 
               this.currentState === GameState.IDLE;
    }

    /**
     * 检查是否正在处理连锁反应
     */
    isInChainReaction(): boolean {
        return this.isProcessingChain && this.chainDepth > 0;
    }

    /**
     * 开始连锁反应处理
     */
    startChainReaction(): boolean {
        if (this.chainDepth >= this.maxChainDepth) {
            console.warn('[GameStateManager] 达到最大连锁深度，停止处理');
            this.endChainReaction();
            return false;
        }
        
        this.isProcessingChain = true;
        this.chainDepth++;
        this.gameStats.currentCombo++;
        
        // 更新最大连击数
        if (this.gameStats.currentCombo > this.gameStats.maxCombo) {
            this.gameStats.maxCombo = this.gameStats.currentCombo;
        }
        
        console.log(`[GameStateManager] 连锁反应第 ${this.chainDepth} 层，连击数: ${this.gameStats.currentCombo}`);
        return true;
    }

    /**
     * 结束连锁反应
     */
    endChainReaction(): void {
        console.log(`[GameStateManager] 连锁反应结束，总深度: ${this.chainDepth}，最终连击: ${this.gameStats.currentCombo}`);
        this.isProcessingChain = false;
        this.chainDepth = 0;
        
        // 发送连击结束事件
        if (this.gameStats.currentCombo > 1) {
            App.event.emit(EventName.Game.ComboEnd, this.gameStats.currentCombo);
        }
    }

    /**
     * 更新游戏统计
     */
    updateStats(matches: number, score: number): void {
        this.gameStats.totalMatches += matches;
        this.gameStats.totalScore += score;
        
        console.log(`[GameStateManager] 统计更新 - 匹配: +${matches} (总计: ${this.gameStats.totalMatches}), 分数: +${score} (总计: ${this.gameStats.totalScore})`);
    }

    /**
     * 设置剩余步数
     */
    setStepsRemaining(steps: number): void {
        this.gameStats.stepsRemaining = steps;
    }

    /**
     * 获取游戏统计
     */
    getStats(): Readonly<GameStats> {
        return { ...this.gameStats };
    }

    /**
     * 检查是否可以继续处理
     */
    canContinueProcessing(): boolean {
        return this.currentState === GameState.PROCESSING || 
               this.currentState === GameState.CHECKING;
    }

    /**
     * 强制停止所有处理
     */
    forceStop(): void {
        console.log('[GameStateManager] 强制停止所有处理');
        this.isProcessingChain = false;
        this.chainDepth = 0;
        this.setState(GameState.IDLE);
    }

    /**
     * 获取状态历史（用于调试）
     */
    getStateHistory(): ReadonlyArray<GameState> {
        return [...this.stateHistory];
    }

    /**
     * 是否处于游戏结束状态
     */
    isGameEnded(): boolean {
        return this.currentState === GameState.GAME_OVER || 
               this.currentState === GameState.LEVEL_WIN;
    }

    /**
     * 检查状态转换是否合法
     */
    isValidTransition(fromState: GameState, toState: GameState): boolean {
        // 定义合法的状态转换规则
        const validTransitions: Record<GameState, GameState[]> = {
            [GameState.IDLE]: [GameState.PLAYER_INPUT, GameState.PROCESSING],
            [GameState.PLAYER_INPUT]: [GameState.PROCESSING, GameState.PAUSED, GameState.GAME_OVER],
            [GameState.PROCESSING]: [GameState.CHECKING, GameState.ANIMATING, GameState.FALLING],
            [GameState.CHECKING]: [GameState.PROCESSING, GameState.PLAYER_INPUT, GameState.LEVEL_WIN, GameState.GAME_OVER],
            [GameState.ANIMATING]: [GameState.CHECKING, GameState.FALLING],
            [GameState.FALLING]: [GameState.CHECKING, GameState.SHUFFLING],
            [GameState.SHUFFLING]: [GameState.CHECKING],
            [GameState.LEVEL_WIN]: [GameState.IDLE],
            [GameState.GAME_OVER]: [GameState.IDLE],
            [GameState.PAUSED]: [GameState.PLAYER_INPUT, GameState.PROCESSING]
        };

        return validTransitions[fromState]?.includes(toState) ?? false;
    }
}