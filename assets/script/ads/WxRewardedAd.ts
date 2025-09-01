import { IRewardedAd, AdConfig } from './IRewardedAd';

/**
 * 微信激励视频广告类
 * 上线后使用，封装微信官方广告API
 */
export class WxRewardedAd implements IRewardedAd {
    private config: AdConfig;
    private wxAd: any = null; // 微信广告实例
    private isShowing: boolean = false;
    
    constructor(config: AdConfig) {
        this.config = {
            enableDebugLog: false,
            ...config
        };
        
        if (!this.config.adUnitId) {
            throw new Error('WxRewardedAd 需要提供 adUnitId');
        }
        
        this.initWxAd();
    }
    
    private initWxAd(): void {
        try {
            // @ts-ignore
            if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
                // @ts-ignore
                this.wxAd = wx.createRewardedVideoAd({
                    adUnitId: this.config.adUnitId
                });
                
                this.log('✅ 微信激励视频广告初始化成功');
            } else {
                this.log('⚠️ 微信API不可用，可能不在微信环境中');
            }
        } catch (error) {
            this.log('❌ 初始化微信广告失败:', error);
        }
    }
    
    async show(): Promise<'completed' | 'aborted' | 'error'> {
        if (this.isShowing) {
            this.log('⚠️ 广告正在播放中，忽略重复调用');
            return 'error';
        }
        
        if (!this.wxAd) {
            this.log('❌ 微信广告实例未初始化');
            return 'error';
        }
        
        this.isShowing = true;
        this.log('🎬 开始显示微信激励视频广告');
        
        return new Promise((resolve) => {
            // 设置广告关闭回调
            this.wxAd.onClose((res: any) => {
                this.isShowing = false;
                this.wxAd.offClose(); // 清除回调，防止重复触发
                
                if (res && res.isEnded) {
                    // 广告播放完成
                    this.log('✅ 广告播放完成，用户获得奖励');
                    resolve('completed');
                } else {
                    // 广告被中途关闭
                    this.log('⚠️ 广告被用户中途关闭，未获得奖励');
                    resolve('aborted');
                }
            });
            
            // 设置广告错误回调
            this.wxAd.onError((err: any) => {
                this.isShowing = false;
                this.wxAd.offError(); // 清除回调
                this.log('❌ 广告播放出错:', err);
                resolve('error');
            });
            
            // 显示广告
            this.wxAd.show().catch((error: any) => {
                this.isShowing = false;
                this.log('❌ 广告显示失败:', error);
                
                // 如果是广告未准备好，尝试重新加载
                if (error.errCode === 1004) {
                    this.log('🔄 广告未准备好，尝试重新加载...');
                    this.wxAd.load()
                        .then(() => {
                            return this.wxAd.show();
                        })
                        .catch((retryError: any) => {
                            this.log('❌ 重新加载广告失败:', retryError);
                            resolve('error');
                        });
                } else {
                    resolve('error');
                }
            });
        });
    }
    
    async preload(): Promise<void> {
        if (!this.wxAd) {
            throw new Error('微信广告实例未初始化');
        }
        
        this.log('🔄 预加载微信广告');
        return this.wxAd.load();
    }
    
    destroy(): void {
        if (this.wxAd) {
            this.log('🗑️ 销毁微信广告实例');
            try {
                this.wxAd.offClose();
                this.wxAd.offError();
            } catch (e) {
                this.log('⚠️ 清理广告回调失败:', e);
            }
            this.wxAd = null;
        }
        this.isShowing = false;
    }
    
    private log(...args: any[]): void {
        if (this.config.enableDebugLog) {
            console.log('[WxRewardedAd]', ...args);
        }
    }
}