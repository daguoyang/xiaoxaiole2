import { IRewardedAd, AdConfig } from './IRewardedAd';
import { App } from '../core/app';
import { Node, Canvas, UITransform, Sprite, Label, Button, Color, Widget, director, ImageAsset, SpriteFrame, Texture2D, resources } from 'cc';

/**
 * 模拟激励视频广告类
 * 开发阶段使用，模拟真实广告的行为和体验
 */
export class FakeRewardedAd implements IRewardedAd {
    private config: AdConfig;
    private isShowing: boolean = false;
    
    constructor(config: AdConfig = {}) {
        this.config = {
            mockDuration: 15,
            mockSkipDelay: 5,
            enableDebugLog: true,
            ...config
        };
    }
    
    async show(): Promise<'completed' | 'aborted' | 'error'> {
        if (this.isShowing) {
            this.log('⚠️ 广告正在播放中，忽略重复调用');
            return 'error';
        }
        
        this.isShowing = true;
        this.log('🎬 开始显示模拟激励视频广告');
        
        try {
            const result = await this.playMockAd();
            return result;
        } catch (error) {
            this.log('❌ 模拟广告播放失败:', error);
            return 'error';
        } finally {
            this.isShowing = false;
        }
    }
    
    private playMockAd(): Promise<'completed' | 'aborted' | 'error'> {
        return new Promise((resolve) => {
            let remainingTime = this.config.mockDuration || 15;
            let canSkip = false;
            let isCompleted = false;
            
            this.log('📺 模拟广告开始播放，时长:', remainingTime, '秒');
            
            // 创建广告UI界面
            this.createAdUI(
                remainingTime,
                (skipped: boolean) => {
                    if (!isCompleted) {
                        isCompleted = true;
                        if (skipped) {
                            this.log('⚠️ 用户跳过了广告');
                            resolve('aborted');
                        } else {
                            this.log('✅ 模拟广告播放完成');
                            resolve('completed');
                        }
                    }
                },
                () => canSkip = true
            );
        });
    }

    /**
     * 创建广告UI界面 - 智能选择环境
     */
    private createAdUI(
        duration: number, 
        onComplete: (skipped: boolean) => void,
        onSkipEnabled: () => void
    ): void {
        // 检测运行环境
        const isWxMiniGame = typeof wx !== 'undefined';
        const hasDocument = typeof document !== 'undefined';
        
        this.log('🔍 检测运行环境:');
        this.log('  - 微信小游戏:', isWxMiniGame);
        this.log('  - 支持DOM:', hasDocument);
        
        if (isWxMiniGame || !hasDocument) {
            // 在小游戏环境或无DOM环境，使用Cocos节点
            this.log('🎮 使用Cocos节点创建广告界面');
            this.createCocosAdUI(duration, onComplete, onSkipEnabled);
        } else {
            // 在浏览器环境，使用DOM
            this.log('🌐 使用DOM创建广告界面');
            this.createDomAdUI(duration, onComplete, onSkipEnabled);
        }
    }

    /**
     * 创建Cocos节点广告界面（小游戏专用）
     */
    private createCocosAdUI(
        duration: number, 
        onComplete: (skipped: boolean) => void,
        onSkipEnabled: () => void
    ): void {
        // 获取Canvas
        const scene = director.getScene();
        if (!scene) {
            this.log('❌ 无法获取场景');
            this.createSimpleAdUI(duration, onComplete, onSkipEnabled);
            return;
        }
        
        // 尝试多种方式找Canvas
        let canvas = scene.getChildByName('Canvas');
        if (!canvas && scene.children.length > 0) {
            canvas = scene.children[0];
        }
        
        if (!canvas) {
            this.log('❌ 无法找到Canvas，尝试直接使用scene');
            // 最后的备用方案：直接在scene上创建
            canvas = scene;
        }
        
        this.log('✅ 找到Canvas:', canvas.name);
        
        // 创建全屏遮罩
        const overlay = new Node('AdOverlay');
        const overlayTransform = overlay.addComponent(UITransform);
        
        // 获取Canvas尺寸
        const canvasTransform = canvas.getComponent(UITransform);
        const canvasSize = canvasTransform ? canvasTransform.contentSize : { width: 750, height: 1334 };
        overlayTransform.setContentSize(canvasSize.width, canvasSize.height);
        overlay.setPosition(0, 0, 0);
        
        // 半透明黑色背景
        const bgSprite = overlay.addComponent(Sprite);
        bgSprite.color = new Color(0, 0, 0, 220);
        
        // 广告内容卡片
        const adCard = new Node('AdCard');
        const cardTransform = adCard.addComponent(UITransform);
        cardTransform.setContentSize(500, 600);
        adCard.setPosition(0, 0, 0);
        
        // 白色卡片背景
        const cardBg = adCard.addComponent(Sprite);
        cardBg.color = new Color(255, 255, 255, 255);
        
        // 标题
        const titleNode = new Node('Title');
        titleNode.addComponent(UITransform);
        titleNode.setPosition(0, 220, 0);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = '🎬 广告播放中';
        titleLabel.fontSize = 32;
        titleLabel.color = new Color(51, 51, 51, 255);
        
        // 广告内容区域（模拟图片）
        const adContent = new Node('AdContent');
        const contentTransform = adContent.addComponent(UITransform);
        contentTransform.setContentSize(400, 200);
        adContent.setPosition(0, 50, 0);
        const contentSprite = adContent.addComponent(Sprite);
        contentSprite.color = new Color(255, 182, 193, 255); // 粉色背景模拟广告
        
        // 广告内容文字
        const contentText = new Node('ContentText');
        contentText.addComponent(UITransform);
        contentText.setPosition(0, 0, 0);
        const contentLabel = contentText.addComponent(Label);
        contentLabel.string = '广告内容展示区域';
        contentLabel.fontSize = 18;
        contentLabel.color = new Color(102, 102, 102, 255);
        adContent.addChild(contentText);
        
        // 倒计时
        const countdownNode = new Node('Countdown');
        countdownNode.addComponent(UITransform);
        countdownNode.setPosition(0, -80, 0);
        const countdownLabel = countdownNode.addComponent(Label);
        countdownLabel.string = `剩余时间: ${duration} 秒`;
        countdownLabel.fontSize = 24;
        countdownLabel.color = new Color(102, 102, 102, 255);
        
        // 进度条背景
        const progressBg = new Node('ProgressBg');
        const progressBgTransform = progressBg.addComponent(UITransform);
        progressBgTransform.setContentSize(350, 12);
        progressBg.setPosition(0, -130, 0);
        const progressBgSprite = progressBg.addComponent(Sprite);
        progressBgSprite.color = new Color(238, 238, 238, 255);
        
        // 进度条
        const progressFill = new Node('ProgressFill');
        const progressFillTransform = progressFill.addComponent(UITransform);
        progressFillTransform.setContentSize(0, 12);
        progressFill.setPosition(-175, 0, 0); // 左对齐
        const progressFillSprite = progressFill.addComponent(Sprite);
        progressFillSprite.color = new Color(76, 175, 80, 255);
        progressBg.addChild(progressFill);
        
        // 跳过按钮
        const skipBtn = new Node('SkipBtn');
        const skipBtnTransform = skipBtn.addComponent(UITransform);
        skipBtnTransform.setContentSize(120, 45);
        skipBtn.setPosition(0, -200, 0);
        skipBtn.active = false; // 初始隐藏
        
        const skipBtnSprite = skipBtn.addComponent(Sprite);
        skipBtnSprite.color = new Color(255, 71, 87, 255);
        
        const skipBtnText = new Node('SkipText');
        skipBtnText.addComponent(UITransform);
        skipBtnText.setPosition(0, 0, 0);
        const skipBtnLabel = skipBtnText.addComponent(Label);
        skipBtnLabel.string = '跳过广告';
        skipBtnLabel.fontSize = 18;
        skipBtnLabel.color = new Color(255, 255, 255, 255);
        skipBtn.addChild(skipBtnText);
        
        // 跳过按钮点击事件
        const skipButton = skipBtn.addComponent(Button);
        skipButton.node.on(Button.EventType.CLICK, () => {
            this.log('🎯 用户点击跳过按钮');
            canvas!.removeChild(overlay);
            onComplete(true);
        });
        
        // 组装UI
        adCard.addChild(titleNode);
        adCard.addChild(adContent);
        adCard.addChild(countdownNode);
        adCard.addChild(progressBg);
        adCard.addChild(skipBtn);
        overlay.addChild(adCard);
        
        // 添加到Canvas
        canvas.addChild(overlay);
        overlay.setSiblingIndex(canvas.children.length - 1); // 置顶
        
        this.log('✅ Cocos广告界面创建完成');
        
        // 倒计时逻辑
        let remaining = duration;
        const updateUI = () => {
            if (remaining > 0) {
                countdownLabel.string = `剩余时间: ${remaining} 秒`;
                const progress = (duration - remaining) / duration;
                progressFillTransform.setContentSize(350 * progress, 12);
                
                this.log('⏰ 广告倒计时:', remaining);
                remaining--;
                setTimeout(updateUI, 1000);
            } else {
                this.log('⏰ 广告播放结束');
                canvas!.removeChild(overlay);
                onComplete(false);
            }
        };
        
        // 5秒后显示跳过按钮
        setTimeout(() => {
            if (remaining > 0) {
                skipBtn.active = true;
                onSkipEnabled();
                this.log('⏭️ 跳过按钮已显示');
            }
        }, (this.config.mockSkipDelay || 5) * 1000);
        
        // 开始倒计时
        setTimeout(updateUI, 1000);
    }

    /**
     * 创建DOM广告界面（浏览器专用）
     */
    private createDomAdUI(
        duration: number, 
        onComplete: (skipped: boolean) => void,
        onSkipEnabled: () => void
    ): void {
        // DOM版本的实现（保持原来的代码）
        const adContainer = document.createElement('div');
        adContainer.id = 'fake-ad-container';
        adContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
            color: white;
        `;
        
        const adCard = document.createElement('div');
        adCard.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        const title = document.createElement('h2');
        title.textContent = '🎬 广告播放中';
        title.style.cssText = `color: #333; margin: 0 0 20px 0; font-size: 24px;`;
        
        const adImage = document.createElement('div');
        adImage.style.cssText = `
            width: 300px; height: 200px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 10px; margin: 0 auto 20px; display: flex;
            align-items: center; justify-content: center; font-size: 18px; color: white;
        `;
        adImage.textContent = '广告内容区域';
        
        const countdown = document.createElement('div');
        countdown.style.cssText = `font-size: 20px; color: #666; margin: 15px 0;`;
        countdown.textContent = `剩余时间: ${duration}秒`;
        
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 100%; height: 8px; background: #eee; border-radius: 4px;
            margin: 15px 0; overflow: hidden;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            height: 100%; background: #4caf50; width: 0%;
            transition: width 0.3s ease; border-radius: 4px;
        `;
        progressContainer.appendChild(progressBar);
        
        const skipButton = document.createElement('button');
        skipButton.textContent = '跳过广告';
        skipButton.style.cssText = `
            background: #ff4757; color: white; border: none; padding: 12px 24px;
            border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 15px; display: none;
        `;
        
        skipButton.onclick = () => {
            this.log('🎯 用户点击跳过按钮');
            document.body.removeChild(adContainer);
            onComplete(true);
        };
        
        // 组装DOM
        adCard.appendChild(title);
        adCard.appendChild(adImage);
        adCard.appendChild(countdown);
        adCard.appendChild(progressContainer);
        adCard.appendChild(skipButton);
        adContainer.appendChild(adCard);
        
        document.body.appendChild(adContainer);
        this.log('✅ DOM广告界面创建完成');
        
        // 倒计时逻辑
        let remaining = duration;
        const updateTimer = () => {
            if (remaining > 0) {
                countdown.textContent = `剩余时间: ${remaining}秒`;
                const progress = ((duration - remaining) / duration) * 100;
                progressBar.style.width = `${progress}%`;
                remaining--;
                setTimeout(updateTimer, 1000);
            } else {
                document.body.removeChild(adContainer);
                onComplete(false);
            }
        };
        
        setTimeout(() => {
            if (remaining > 0) {
                skipButton.style.display = 'block';
                onSkipEnabled();
            }
        }, (this.config.mockSkipDelay || 5) * 1000);
        
        setTimeout(updateTimer, 1000);
    }
    
    /**
     * 简化广告UI（降级方案）
     */
    private createSimpleAdUI(duration: number, onComplete: (skipped: boolean) => void, onSkipEnabled: () => void): void {
        this.log('📱 使用简化广告UI模式');
        App.view.showMsgTips("🎬 广告播放中...");
        
        let remaining = duration;
        let skipAllowed = false;
        
        const countdownInterval = setInterval(() => {
            if (remaining > 0) {
                const skipText = skipAllowed ? ' (点击跳过)' : '';
                App.view.showMsgTips(`🎬 广告播放中 ${remaining}s${skipText}`);
                remaining--;
            } else {
                clearInterval(countdownInterval);
                App.view.showMsgTips("✅ 广告播放完成！获得道具奖励！");
                setTimeout(() => onComplete(false), 1500);
            }
        }, 1000);
        
        // 5秒后允许跳过
        setTimeout(() => {
            if (remaining > 0) {
                skipAllowed = true;
                onSkipEnabled();
                this.log('⏭️ 现在可以跳过广告了（简化模式）');
            }
        }, (this.config.mockSkipDelay || 5) * 1000);
    }

    /**
     * 创建测试用的超级简单广告界面
     */
    private createTestAdUI(duration: number, onComplete: (skipped: boolean) => void, onSkipEnabled: () => void): void {
        this.log('🧪 创建测试广告界面');
        
        // 只用最基础的App.view.showMsgTips，但更频繁更新
        let remaining = duration;
        
        const showAd = () => {
            if (remaining > 5) {
                App.view.showMsgTips(`🎬 广告播放中... ${remaining}秒`);
            } else if (remaining > 0) {
                App.view.showMsgTips(`🎬 广告播放中... ${remaining}秒 (可跳过)`);
            } else {
                App.view.showMsgTips("✅ 广告完成！获得奖励！");
                setTimeout(() => onComplete(false), 1000);
                return;
            }
            
            remaining--;
            setTimeout(showAd, 1000);
        };
        
        // 5秒后允许跳过
        setTimeout(() => {
            if (remaining > 0) {
                onSkipEnabled();
                this.log('⏭️ 测试广告现在可以跳过');
            }
        }, 5000);
        
        showAd();
    }

    
    async preload(): Promise<void> {
        this.log('🔄 模拟广告预加载（无需实际操作）');
        // 模拟加载延迟
        return new Promise(resolve => setTimeout(resolve, 100));
    }
    
    destroy(): void {
        this.log('🗑️ 销毁模拟广告实例');
        this.isShowing = false;
    }
    
    private log(...args: any[]): void {
        if (this.config.enableDebugLog) {
            console.log('[FakeRewardedAd]', ...args);
        }
    }
}