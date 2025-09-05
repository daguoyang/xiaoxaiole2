import { instantiate, Node, Prefab, tween, v3 } from 'cc';
import { SingletonClass } from "../../core/singletonClass";
import { gridCmpt } from "../ui/item/gridCmpt";
import { MatchGroup, MatchType, MatchResult } from './matchEngine';
import { ToolsHelper } from '../../utils/toolsHelper';
import { App } from '../../core/app';
import { Bomb } from '../../const/enumConst';

/**
 * 消除效果处理器 - 全新的消除动画和效果系统
 * 创新的动画序列和视觉效果
 */
export class EliminationProcessor extends SingletonClass<EliminationProcessor> {
    private particlePrefab: Prefab = null;
    private effectContainer: Node = null;
    private eliminationQueue: MatchGroup[] = [];
    private isProcessing: boolean = false;

    protected async onInit(...args: any[]) {
        console.log('[EliminationProcessor] 消除效果处理器初始化完成');
    }

    /**
     * 设置效果容器和粒子预制体
     */
    setup(effectContainer: Node, particlePrefab: Prefab) {
        this.effectContainer = effectContainer;
        this.particlePrefab = particlePrefab;
    }

    /**
     * 处理匹配结果 - 创新的分阶段消除处理
     */
    async processMatchResult(matchResult: MatchResult, board: (gridCmpt | null)[][], onScoreAdd: (score: number) => void): Promise<void> {
        if (!matchResult.hasMatches || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        
        try {
            // 第一阶段：预处理和排序
            const sortedMatches = this.prioritizeMatches(matchResult.matches);
            
            // 第二阶段：执行消除动画
            await this.executeEliminationSequence(sortedMatches, board, onScoreAdd);
            
            // 第三阶段：生成特效元素
            await this.generateSpecialElements(sortedMatches, board);
            
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 匹配优先级排序 - 特殊形状优先
     */
    private prioritizeMatches(matches: MatchGroup[]): MatchGroup[] {
        return matches.sort((a, b) => {
            const priorityA = this.getMatchPriority(a.matchType);
            const priorityB = this.getMatchPriority(b.matchType);
            return priorityB - priorityA; // 高优先级在前
        });
    }

    /**
     * 获取匹配优先级
     */
    private getMatchPriority(matchType: MatchType): number {
        switch (matchType) {
            case MatchType.CROSS_SHAPE: return 5;
            case MatchType.T_SHAPE: return 4;
            case MatchType.L_SHAPE: return 3;
            case MatchType.FIVE: return 2;
            case MatchType.FOUR: return 1;
            case MatchType.THREE: return 0;
            default: return -1;
        }
    }

    /**
     * 执行消除序列 - 创新的波浪式消除动画
     */
    private async executeEliminationSequence(matches: MatchGroup[], board: (gridCmpt | null)[][], onScoreAdd: (score: number) => void): Promise<void> {
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            
            // 播放匹配音效
            this.playMatchSound(match.matchType);
            
            // 创建消除动画
            await this.createEliminationAnimation(match);
            
            // 更新分数
            const score = this.calculateMatchScore(match);
            onScoreAdd(score);
            
            // 从棋盘上移除元素
            this.removeElementsFromBoard(match.elements, board);
            
            // 添加延迟，创造节奏感
            if (i < matches.length - 1) {
                await ToolsHelper.delayTime(0.1);
            }
        }
    }

    /**
     * 创建消除动画 - 创新的扩散动画效果
     */
    private async createEliminationAnimation(match: MatchGroup): Promise<void> {
        return new Promise<void>((resolve) => {
            const animationPromises: Promise<void>[] = [];
            
            // 根据匹配类型选择不同的动画效果
            switch (match.matchType) {
                case MatchType.CROSS_SHAPE:
                    animationPromises.push(...this.createCrossExplosionEffect(match.elements));
                    break;
                case MatchType.T_SHAPE:
                case MatchType.L_SHAPE:
                    animationPromises.push(...this.createShapeCollapseEffect(match.elements));
                    break;
                default:
                    animationPromises.push(...this.createWaveEliminationEffect(match.elements));
            }
            
            Promise.all(animationPromises).then(() => resolve());
        });
    }

    /**
     * 十字爆炸效果
     */
    private createCrossExplosionEffect(elements: gridCmpt[]): Promise<void>[] {
        const promises: Promise<void>[] = [];
        const centerElement = elements[0];
        
        // 找到中心点
        const centerPos = centerElement.node.worldPosition;
        
        elements.forEach((element, index) => {
            promises.push(new Promise<void>((resolve) => {
                // 创建粒子效果
                this.createParticleEffect(element);
                
                // 向中心收缩然后爆炸
                const originalPos = element.node.position;
                const delay = index * 0.05; // 错开时间
                
                tween(element.node)
                    .delay(delay)
                    .to(0.2, { scale: v3(1.5, 1.5, 1) })
                    .to(0.1, { scale: v3(0.1, 0.1, 1) })
                    .call(() => {
                        if (element.node && element.node.isValid) {
                            element.node.destroy();
                        }
                        resolve();
                    })
                    .start();
            }));
        });
        
        return promises;
    }

    /**
     * 形状坍塌效果
     */
    private createShapeCollapseEffect(elements: gridCmpt[]): Promise<void>[] {
        const promises: Promise<void>[] = [];
        
        elements.forEach((element, index) => {
            promises.push(new Promise<void>((resolve) => {
                this.createParticleEffect(element);
                
                const delay = index * 0.08;
                const randomRotation = (Math.random() - 0.5) * 720; // 随机旋转
                
                tween(element.node)
                    .delay(delay)
                    .parallel(
                        tween().to(0.3, { scale: v3(0, 0, 1) }),
                        tween().to(0.3, { angle: randomRotation }),
                        tween().to(0.3, { position: v3(element.node.position.x, element.node.position.y - 50, 0) })
                    )
                    .call(() => {
                        if (element.node && element.node.isValid) {
                            element.node.destroy();
                        }
                        resolve();
                    })
                    .start();
            }));
        });
        
        return promises;
    }

    /**
     * 波浪消除效果
     */
    private createWaveEliminationEffect(elements: gridCmpt[]): Promise<void>[] {
        const promises: Promise<void>[] = [];
        
        elements.forEach((element, index) => {
            promises.push(new Promise<void>((resolve) => {
                this.createParticleEffect(element);
                
                const delay = index * 0.06;
                const waveOffset = Math.sin(index * 0.5) * 20; // 波浪偏移
                
                tween(element.node)
                    .delay(delay)
                    .to(0.15, { scale: v3(1.3, 1.3, 1) })
                    .parallel(
                        tween().to(0.2, { scale: v3(0, 0, 1) }),
                        tween().to(0.2, { position: v3(element.node.position.x + waveOffset, element.node.position.y, 0) })
                    )
                    .call(() => {
                        if (element.node && element.node.isValid) {
                            element.node.destroy();
                        }
                        resolve();
                    })
                    .start();
            }));
        });
        
        return promises;
    }

    /**
     * 创建粒子效果
     */
    private createParticleEffect(element: gridCmpt): void {
        if (!this.particlePrefab || !this.effectContainer) return;
        
        const particle = instantiate(this.particlePrefab);
        this.effectContainer.addChild(particle);
        
        // 设置粒子类型
        particle.children.forEach(child => {
            child.active = +child.name === element.type;
        });
        
        // 设置粒子位置
        const worldPos = element.node.worldPosition;
        particle.setWorldPosition(worldPos);
        
        // 粒子自动销毁
        tween(particle)
            .delay(1.0)
            .call(() => {
                if (particle && particle.isValid) {
                    particle.destroy();
                }
            })
            .start();
    }

    /**
     * 播放匹配音效
     */
    private playMatchSound(matchType: MatchType): void {
        const soundMap = {
            [MatchType.THREE]: 'combo',
            [MatchType.FOUR]: 'combo_good',
            [MatchType.FIVE]: 'combo_great',
            [MatchType.L_SHAPE]: 'combo_excellent',
            [MatchType.T_SHAPE]: 'combo_excellent',
            [MatchType.CROSS_SHAPE]: 'combo_perfect'
        };
        
        const soundName = soundMap[matchType] || 'combo';
        App.audio.play(soundName);
    }

    /**
     * 计算匹配分数
     */
    private calculateMatchScore(match: MatchGroup): number {
        const baseScore = match.elements.length * 100;
        const typeMultiplier = this.getScoreMultiplier(match.matchType);
        return baseScore * typeMultiplier;
    }

    /**
     * 获取分数倍数
     */
    private getScoreMultiplier(matchType: MatchType): number {
        switch (matchType) {
            case MatchType.THREE: return 1;
            case MatchType.FOUR: return 2;
            case MatchType.FIVE: return 4;
            case MatchType.L_SHAPE: return 3;
            case MatchType.T_SHAPE: return 3;
            case MatchType.CROSS_SHAPE: return 6;
            default: return 1;
        }
    }

    /**
     * 从棋盘移除元素
     */
    private removeElementsFromBoard(elements: gridCmpt[], board: (gridCmpt | null)[][]): void {
        for (const element of elements) {
            if (element.data) {
                const row = element.data.v;
                const col = element.data.h;
                if (board[row] && board[row][col] === element) {
                    board[row][col] = null;
                }
            }
        }
    }

    /**
     * 生成特效元素
     */
    private async generateSpecialElements(matches: MatchGroup[], board: (gridCmpt | null)[][]): Promise<void> {
        for (const match of matches) {
            if (match.matchType === MatchType.FOUR) {
                // 四消生成条状炸弹
                await this.createSpecialBomb(match, board, Bomb.hor);
            } else if (match.matchType === MatchType.FIVE) {
                // 五消生成彩虹糖
                await this.createSpecialBomb(match, board, Bomb.allSame);
            } else if (match.matchType === MatchType.L_SHAPE || match.matchType === MatchType.T_SHAPE) {
                // L型/T型生成炸弹
                await this.createSpecialBomb(match, board, Bomb.bomb);
            } else if (match.matchType === MatchType.CROSS_SHAPE) {
                // 十字型生成超级炸弹
                await this.createSpecialBomb(match, board, Bomb.bomb);
            }
        }
    }

    /**
     * 创建特效炸弹
     */
    private async createSpecialBomb(match: MatchGroup, board: (gridCmpt | null)[][], bombType: Bomb): Promise<void> {
        // 在匹配组的中心位置生成特效元素
        const centerElement = match.elements[Math.floor(match.elements.length / 2)];
        if (centerElement && centerElement.data) {
            const row = centerElement.data.v;
            const col = centerElement.data.h;
            
            // 这里可以添加生成特效元素的逻辑
            console.log(`在位置 (${row}, ${col}) 生成特效炸弹，类型: ${bombType}`);
        }
    }
}