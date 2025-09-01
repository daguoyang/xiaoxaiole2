import { sys } from "cc";
import { EventName } from "../const/eventName";
import { App } from "../core/app";
import { WxMgr } from "./wxManager";
import { adConfigManager } from "../config/adConfig";

export class Ads {
    public bannerAdv = null;//banner广告
    public videoAdv = null;//激励式视频广告
    public interstitialAd = null;//插屏广告

    private bannerId: string = "";// banner广告id
    private videoId: string = "";// 激励式视频广告id
    private interstitialId: string = "";// 插屏r广告id
    constructor() {
        this.init();
    }

    init() {
        // 从配置中获取广告ID
        const config = adConfigManager.getConfig();
        this.bannerId = config.realAdIds.bannerId;
        this.videoId = config.realAdIds.videoId;
        this.interstitialId = config.realAdIds.interstitialId;
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log('--------------init ads-----------------');
        // @ts-ignore
        let winSize = wx.getSystemInfoSync();//获取像素size
        // 创建 Banner 广告实例，提前初始化
        let bannerWidth = 300
        let bannerHeight = 80
        // @ts-ignore
        let bannerAdv = wx.createBannerAd({
            adUnitId: this.bannerId,//传入自己的id，此处为banner广告位ID
            adIntervals: 30,//定时刷新，最低30S
            style: {
                left: (winSize.windowWidth - bannerWidth) / 2,
                top: winSize.windowHeight - bannerHeight,
                width: bannerWidth,
            },
        })
        this.bannerAdv = bannerAdv;
        //重新定banner位置
        bannerAdv.onResize((res) => {
            bannerAdv.style.top = winSize.windowHeight - bannerAdv.style.realHeight - 1;
        })
        // // 在适合的场景显示 Banner 广告
        // bannerAdv.show();//不建议直接显示
        //拉取失败处理
        bannerAdv.onError((err) => {
            console.log(err);
        })

        // @ts-ignore 创建激励视频广告实例，提前初始化
        let videoAdv = wx.createRewardedVideoAd({
            adUnitId: this.videoId//传入自己的id，此处为视频广告位ID
        })
        videoAdv.onError((err) => {
            console.log(err);
        })
        this.videoAdv = videoAdv;
        // 创建插屏广告实例，提前初始化
        // @ts-ignore
        if (wx.createInterstitialAd) {
            // @ts-ignore
            let interstitialAd = wx.createInterstitialAd({
                adUnitId: this.interstitialId//传入自己的id，此处为插屏广告位ID
            })
            this.interstitialAd = interstitialAd;
        }
    }
    //显示banner广告
    showBannerAds() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        // 在适合的场景显示 Banner 广告
        // @ts-ignore
        this.bannerAdv.show();
    }

    // 隐藏banner广告
    hideBannerAds() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        // @ts-ignore
        this.bannerAdv.hide();
    }

    // 防止重复调用的锁
    private isShowingAd: boolean = false;

    //显示视频广告
    showVideoAds(onComplete?: (success: boolean) => void) {
        // 防止重复调用
        if (this.isShowingAd) {
            console.log('⚠️ 广告正在播放中，忽略重复调用');
            return;
        }
        
        console.log('🎬 开始显示激励视频广告');
        console.log('shouldUseMockAds:', adConfigManager.shouldUseMockAds());
        console.log('platform:', sys.platform);
        
        this.isShowingAd = true;
        
        // 符合微信小游戏规范：点击直接播放广告，不做二次确认
        if (adConfigManager.shouldUseMockAds()) {
            if (sys.platform === sys.Platform.WECHAT_GAME) {
                console.log('🎮 微信小程序环境，使用游戏内广告界面');
                this.createInGameAdUI((success: boolean) => {
                    this.isShowingAd = false; // 释放锁
                    // 广告结束后显示结果弹窗
                    if (success) {
                        App.view.showMsgTips("🎉 广告观看完成！获得奖励！");
                    } else {
                        App.view.showMsgTips("⚠️ 广告未完整观看，未获得奖励");
                    }
                    if (onComplete) onComplete(success);
                });
                return;
            } else {
                console.log('🌐 非微信环境，使用DOM广告界面');
                this.showMockVideoAd((success: boolean) => {
                    this.isShowingAd = false; // 释放锁
                    if (onComplete) onComplete(success);
                });
                return;
            }
        }
        
        // 原始真实广告逻辑
        // @ts-ignore
        let videoAdv = this.videoAdv;
        if (videoAdv) {
            // 用户触发广告后，显示激励视频广告
            // @ts-ignore
            videoAdv.show().catch(() => {
                // 失败重试
                // @ts-ignore
                videoAdv.load()
                    // @ts-ignore
                    .then(() => videoAdv.show())
                    .catch(err => {
                        console.log('激励视频 广告显示失败，切换到模拟广告')
                        this.createInGameAdUI((success: boolean) => {
                            this.isShowingAd = false; // 释放锁
                            if (onComplete) onComplete(success);
                        });
                    })
            })
            
            // @ts-ignore
            //拉取异常处理
            videoAdv.onError((err) => {
                console.log(err);
                console.log('真实广告出错，切换到模拟广告');
                this.createInGameAdUI((success: boolean) => {
                    this.isShowingAd = false; // 释放锁
                    if (onComplete) onComplete(success);
                });
            })

            // @ts-ignore
            videoAdv.onClose((res) => {
                if (!videoAdv) return;
                // @ts-ignore
                videoAdv.offClose();//需要清除回调，否则第N次广告会一次性给N个奖励
                //关闭
                this.isShowingAd = false; // 释放锁
                if (res && res.isEnded || res === undefined) {
                    //正常播放结束，需要下发奖励
                    App.view.showMsgTips("🎉 广告观看完成！获得奖励！");
                    if (onComplete) {
                        onComplete(true);
                    } else {
                        WxMgr.addReward();
                    }
                } else {
                    //播放退出，不下发奖励
                    App.view.showMsgTips("⚠️ 广告未完整观看，未获得奖励");
                    if (onComplete) {
                        onComplete(false);
                    }
                }
            })
        } else {
            console.log('真实广告未初始化，使用模拟广告');
            this.createInGameAdUI((success: boolean) => {
                this.isShowingAd = false; // 释放锁
                if (onComplete) onComplete(success);
            });
        }
    }

    // 已移除确认弹窗相关方法，符合微信小游戏规范

    // 模拟激励视频广告
    private showMockVideoAd(customCallback?: (success: boolean) => void) {
        console.log('🎬 开始显示模拟激励视频广告');
        console.log('shouldUseMockAds:', adConfigManager.shouldUseMockAds());
        console.log('platform:', sys.platform);
        
        // 显示广告提示
        App.view.showMsgTips("正在加载广告...");
        
        // 延迟一下模拟加载时间，然后显示广告
        setTimeout(() => {
            console.log('🎬 开始创建模拟广告UI');
            this.createMockAdUI((completed: boolean) => {
                if (completed) {
                    console.log('✅ 模拟广告观看完成，发放奖励');
                    App.view.showMsgTips("广告观看完成！获得奖励");
                    
                    if (customCallback) {
                        // 如果有自定义回调，执行自定义逻辑
                        customCallback(true);
                    } else {
                        // 默认奖励逻辑
                        WxMgr.addReward();
                    }
                } else {
                    console.log('❌ 模拟广告被中途关闭，不发放奖励');
                    App.view.showMsgTips("广告未看完，未获得奖励");
                    
                    if (customCallback) {
                        customCallback(false);
                    }
                }
            });
        }, 1000); // 模拟1秒加载时间
    }

    // 创建模拟广告UI
    private createMockAdUI(callback: (completed: boolean) => void) {
        console.log('🎨 开始创建模拟广告DOM元素');
        
        // 检查DOM环境
        if (typeof document === 'undefined') {
            console.error('❌ Document对象不存在，使用游戏内广告界面');
            this.createInGameAdUI(callback);
            return;
        }
        
        try {
            // 创建遮罩层
            const mockAdContainer = document.createElement('div');
        mockAdContainer.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.9) !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            font-family: Arial, sans-serif !important;
            color: white !important;
            text-align: center !important;
            pointer-events: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;

        // 广告内容区域
        const adContent = document.createElement('div');
        adContent.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 80%;
            position: relative;
        `;

        // 广告标题
        const title = document.createElement('h2');
        title.textContent = '🎮 模拟广告体验';
        title.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 24px;
            color: white;
        `;

        // 广告图片区域
        const adImageContainer = document.createElement('div');
        adImageContainer.style.cssText = `
            width: 100%;
            height: 200px;
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4);
            background-size: 400% 400%;
            border-radius: 15px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: gradientShift 3s ease infinite;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);

        const adImageText = document.createElement('div');
        adImageText.textContent = '🎁 精彩广告内容';
        adImageText.style.cssText = `
            font-size: 20px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        adImageContainer.appendChild(adImageText);

        // 广告图片点击效果
        adImageContainer.addEventListener('click', () => {
            console.log('模拟广告被点击');
            adImageContainer.style.transform = 'scale(0.95)';
            setTimeout(() => {
                adImageContainer.style.transform = 'scale(1)';
            }, 150);
        });

        adImageContainer.addEventListener('mouseenter', () => {
            adImageContainer.style.transform = 'scale(1.02)';
        });

        adImageContainer.addEventListener('mouseleave', () => {
            adImageContainer.style.transform = 'scale(1)';
        });

        // 广告描述
        const description = document.createElement('p');
        description.textContent = '感谢您的耐心等待！观看完整广告可获得丰厚奖励';
        description.style.cssText = `
            margin: 20px 0;
            font-size: 16px;
            line-height: 1.5;
            color: rgba(255,255,255,0.9);
        `;

        // 倒计时显示
        const countdown = document.createElement('div');
        countdown.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            margin: 30px 0;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;

        // 进度条
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            height: 8px;
            background: rgba(255,255,255,0.3);
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 0;
        `;

        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            width: 0%;
            transition: width 1s ease;
            border-radius: 4px;
        `;
        progressBar.appendChild(progressFill);

        // 关闭按钮（5秒后显示）
        const closeButton = document.createElement('button');
        closeButton.textContent = '× 关闭';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 15px;
            border-radius: 15px;
            cursor: pointer;
            font-size: 14px;
            display: none;
        `;
        closeButton.onclick = () => {
            document.body.removeChild(mockAdContainer);
            callback(false);
        };

        // 组装UI
        adContent.appendChild(title);
        adContent.appendChild(adImageContainer);
        adContent.appendChild(description);
        adContent.appendChild(countdown);
        adContent.appendChild(progressBar);
        adContent.appendChild(closeButton);
        mockAdContainer.appendChild(adContent);
        document.body.appendChild(mockAdContainer);
        
        // 强制显示和调试
        setTimeout(() => {
            try {
                const rect = mockAdContainer.getBoundingClientRect();
                console.log('📐 广告容器尺寸:', rect);
                console.log('🔍 document.body.children数量:', document.body.children.length);
                
                // 检查样式（微信小程序环境兼容）
                try {
                    if (typeof window !== 'undefined' && window.getComputedStyle) {
                        console.log('👀 广告容器样式:', window.getComputedStyle(mockAdContainer));
                    } else {
                        console.log('📱 微信小程序环境，跳过getComputedStyle');
                    }
                } catch (styleError) {
                    console.log('📱 样式检查跳过，小程序环境');
                }
                
                // 强制聚焦（小程序环境兼容）
                try {
                    if (mockAdContainer.focus) {
                        mockAdContainer.focus();
                    }
                    if (mockAdContainer.scrollIntoView) {
                        mockAdContainer.scrollIntoView();
                    }
                } catch (focusError) {
                    console.log('📱 聚焦方法不可用，小程序环境');
                }
                
                // 添加醒目的边框用于调试
                mockAdContainer.style.border = '5px solid red';
                mockAdContainer.style.outline = '5px solid yellow';
                
                console.log('✅ 模拟广告DOM已添加到页面，强制显示完成');
                
                // 如果尺寸为0或在小程序环境中遇到问题，使用备用方案
                if (rect.width === 0 || rect.height === 0) {
                    console.warn('⚠️ 广告容器尺寸为0，可能被隐藏');
                    console.log('🔄 启动备用游戏内广告方案');
                    this.createInGameAdUI(callback);
                    try {
                        document.body.removeChild(mockAdContainer);
                    } catch (removeError) {
                        console.log('📱 移除DOM失败，小程序环境');
                    }
                    return;
                }
                
                // 在小程序环境中，DOM可能创建成功但不可见，添加额外检查
                console.log('🎮 DOM创建成功，尺寸正常，开始倒计时');
                
            } catch (debugError) {
                console.error('❌ 调试过程出错:', debugError);
                console.log('🔄 切换到备用游戏内广告方案');
                this.createInGameAdUI(callback);
                try {
                    document.body.removeChild(mockAdContainer);
                } catch (removeError) {
                    console.log('📱 移除DOM失败');
                }
                return;
            }
        }, 100);

        // 倒计时逻辑 - 添加额外的可见性检查
        const config = adConfigManager.getConfig();
        let remainingTime = config.mockAdSettings.videoDuration;
        countdown.textContent = remainingTime.toString();
        
        // 在微信小程序环境中，添加额外的DOM可见性检查
        let domVisibilityChecked = false;
        
        const timer = setInterval(() => {
            remainingTime--;
            countdown.textContent = remainingTime.toString();
            
            // 更新进度条
            const progress = ((config.mockAdSettings.videoDuration - remainingTime) / config.mockAdSettings.videoDuration) * 100;
            progressFill.style.width = progress + '%';

            // 在倒计时开始2秒后检查DOM是否真的可见
            if (!domVisibilityChecked && remainingTime <= config.mockAdSettings.videoDuration - 2) {
                domVisibilityChecked = true;
                try {
                    const rect = mockAdContainer.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 && 
                                     mockAdContainer.offsetParent !== null;
                    
                    if (!isVisible) {
                        console.warn('⚠️ DOM广告在小程序中不可见，切换到游戏内模式');
                        clearInterval(timer);
                        this.createInGameAdUI(callback);
                        try {
                            document.body.removeChild(mockAdContainer);
                        } catch (e) {
                            console.log('📱 移除DOM失败');
                        }
                        return;
                    } else {
                        console.log('✅ DOM广告在小程序中正常显示');
                    }
                } catch (e) {
                    console.warn('⚠️ DOM可见性检查失败，切换到游戏内模式');
                    clearInterval(timer);
                    this.createInGameAdUI(callback);
                    try {
                        document.body.removeChild(mockAdContainer);
                    } catch (removeE) {
                        console.log('📱 移除DOM失败');
                    }
                    return;
                }
            }

            // 跳过延迟后显示关闭按钮
            if (remainingTime <= config.mockAdSettings.videoDuration - config.mockAdSettings.skipDelay) {
                closeButton.style.display = 'block';
            }

            // 倒计时结束
            if (remainingTime <= 0) {
                clearInterval(timer);
                try {
                    document.body.removeChild(mockAdContainer);
                } catch (e) {
                    console.log('📱 移除DOM失败');
                }
                callback(true);
            }
        }, 1000);
        
        } catch (error) {
            console.error('❌ 创建模拟广告失败:', error);
            console.log('🎮 降级到游戏内广告界面');
            this.createInGameAdUI(callback);
        }
    }

    // 创建游戏内广告UI（符合微信小游戏规范的简化版本）
    private createInGameAdUI(callback: (completed: boolean) => void) {
        console.log('🎮 创建游戏内模拟广告界面');
        
        const config = adConfigManager.getConfig();
        let remainingTime = config.mockAdSettings.videoDuration;
        let isCompleted = false;
        
        // 显示广告开始
        App.view.showMsgTips("🎬 广告开始播放...");
        
        // 简化的倒计时显示（符合微信规范）
        const showProgress = () => {
            if (remainingTime > 0 && !isCompleted) {
                const progressBar = "●".repeat(15 - remainingTime) + "○".repeat(remainingTime);
                App.view.showMsgTips(`🎮 广告播放中 ${remainingTime}s\n${progressBar}`);
                remainingTime--;
                setTimeout(showProgress, 1000);
            } else if (!isCompleted) {
                isCompleted = true;
                console.log('✅ 模拟广告播放完成');
                setTimeout(() => {
                    callback(true);
                }, 500);
            }
        };
        
        // 开始播放
        setTimeout(showProgress, 500);
        
        // 可选：5秒后允许跳过（但在微信环境中通常不建议）
        if (sys.platform !== sys.Platform.WECHAT_GAME) {
            setTimeout(() => {
                if (!isCompleted) {
                    console.log('⏭️ 5秒后允许跳过（仅非微信环境）');
                    const skipHandler = () => {
                        if (!isCompleted) {
                            isCompleted = true;
                            console.log('⚠️ 用户跳过了广告');
                            try {
                                document.removeEventListener('click', skipHandler);
                            } catch (e) {}
                            setTimeout(() => callback(false), 300);
                        }
                    };
                    
                    try {
                        document.addEventListener('click', skipHandler);
                        setTimeout(() => {
                            try {
                                document.removeEventListener('click', skipHandler);
                            } catch (e) {}
                        }, (remainingTime - 5) * 1000);
                    } catch (e) {
                        console.log('📱 无法添加跳过监听器');
                    }
                }
            }, config.mockAdSettings.skipDelay * 1000);
        }
    }

    // 显示插件广告
    showInterstitialAds() {
        // 如果启用模拟广告或不在微信平台，显示模拟广告
        if (adConfigManager.shouldUseMockAds() || sys.platform != sys.Platform.WECHAT_GAME) {
            this.showMockInterstitialAd();
            return;
        }
        
        let interstitialAd = this.interstitialAd;
        // 在适合的场景显示插屏广告
        if (interstitialAd) {
            // @ts-ignore
            interstitialAd.show().catch((err) => {
                console.error(err);
                console.log('插屏广告显示失败，切换到模拟广告');
                this.showMockInterstitialAd();
            })
        } else {
            this.showMockInterstitialAd();
        }
    }

    // 模拟插屏广告
    private showMockInterstitialAd() {
        console.log('显示模拟插屏广告');
        
        // 创建插屏广告遮罩
        const mockAdContainer = document.createElement('div');
        mockAdContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
        `;

        // 插屏广告内容
        const adContent = document.createElement('div');
        adContent.style.cssText = `
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            color: white;
            max-width: 350px;
            width: 80%;
            position: relative;
            animation: slideIn 0.3s ease-out;
        `;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // 广告内容
        adContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 22px;">🎯 模拟插屏广告</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5;">
                这是一个模拟的插屏广告<br>
                真实环境下将显示实际广告内容
            </p>
            <div id="mockInterstitialCountdown" style="font-size: 36px; color: #FFD700; margin: 20px 0;">3</div>
            <button id="mockInterstitialClose" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 10px;
            ">跳过广告</button>
        `;

        mockAdContainer.appendChild(adContent);
        document.body.appendChild(mockAdContainer);

        // 倒计时和关闭逻辑
        const config = adConfigManager.getConfig();
        let countdown = config.mockAdSettings.interstitialDuration;
        const countdownElement = document.getElementById('mockInterstitialCountdown');
        const closeButton = document.getElementById('mockInterstitialClose');

        const timer = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown.toString();
            }
            
            if (countdown <= 0) {
                clearInterval(timer);
                document.body.removeChild(mockAdContainer);
                document.head.removeChild(style);
            }
        }, 1000);

        // 关闭按钮事件
        if (closeButton) {
            closeButton.onclick = () => {
                clearInterval(timer);
                document.body.removeChild(mockAdContainer);
                document.head.removeChild(style);
            };
        }
    }

    // 添加切换广告模式的方法
    public setMockAdMode(enabled: boolean) {
        adConfigManager.setMockMode(enabled);
    }

    // 添加设置模拟广告时长的方法
    public setMockAdDuration(seconds: number) {
        const duration = Math.max(5, Math.min(30, seconds)); // 限制在5-30秒之间
        adConfigManager.updateConfig({
            mockAdSettings: {
                ...adConfigManager.getConfig().mockAdSettings,
                videoDuration: duration
            }
        });
        console.log(`模拟广告时长设置为: ${duration}秒`);
    }

    // 设置真实广告ID
    public setRealAdIds(bannerId: string, videoId: string, interstitialId: string) {
        adConfigManager.setRealAdIds({
            bannerId,
            videoId,
            interstitialId
        });
        // 重新初始化广告
        this.init();
    }
}

export let Advertise = new Ads();

// ==================== 模拟广告使用说明 ====================
/*
使用方法：

1. 开发阶段（使用模拟广告）：
   import { adConfigManager } from "../config/adConfig";
   
   // 方式1：通过配置管理器
   adConfigManager.setMockMode(true);
   adConfigManager.updateConfig({
       mockAdSettings: {
           videoDuration: 15,      // 激励视频15秒
           interstitialDuration: 3, // 插屏广告3秒
           skipDelay: 5            // 5秒后可跳过
       }
   });

   // 方式2：直接调用广告接口
   Advertise.setMockAdMode(true);
   Advertise.setMockAdDuration(15);

2. 上线阶段（切换真实广告）：
   // 在 config/adConfig.ts 中设置：
   // enableMockAds: false
   // realAdIds: { bannerId: "真实ID", videoId: "真实ID", interstitialId: "真实ID" }
   
   // 或运行时设置：
   Advertise.setRealAdIds("banner_id", "video_id", "interstitial_id");
   Advertise.setMockAdMode(false);

3. 调用广告：
   - 激励视频：Advertise.showVideoAds();
   - 插屏广告：Advertise.showInterstitialAds();
   - 横幅广告：Advertise.showBannerAds() / Advertise.hideBannerAds();

特点：
- 🎯 配置集中管理：所有广告设置在 adConfig.ts 中统一管理
- 🔄 自动降级：真实广告失败时自动切换到模拟广告
- 🎮 完整体验：模拟广告包含倒计时、进度条、关闭按钮等
- 🎁 奖励机制：模拟广告看完同样发放奖励
- ⚡ 易于切换：一行代码即可切换真实/模拟模式
- 📱 适配性好：支持微信小程序和其他平台
*/