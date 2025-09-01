import { sys } from 'cc';
import { IRewardedAd, AdConfig } from './IRewardedAd';
import { FakeRewardedAd } from './FakeRewardedAd';
import { WxRewardedAd } from './WxRewardedAd';

/**
 * 广告管理器
 * 统一封装广告逻辑，开发和上线使用同一套API
 */
export class AdManager {
    private static _instance: AdManager;
    private rewardedAd: IRewardedAd | null = null;
    private config: AdConfig = {};
    private isInitialized: boolean = false;
    
    private constructor() {}
    
    public static get instance(): AdManager {
        if (!AdManager._instance) {
            AdManager._instance = new AdManager();
        }
        return AdManager._instance;
    }
    
    /**
     * 初始化广告管理器
     * @param config 广告配置
     * @param useFakeAd 是否使用模拟广告（开发阶段为true，上线后改为false）
     */
    public init(config: AdConfig, useFakeAd: boolean = true): void {
        this.config = { ...config };
        
        // 清理之前的广告实例
        if (this.rewardedAd && this.rewardedAd.destroy) {
            this.rewardedAd.destroy();
        }
        
        try {
            if (useFakeAd || sys.platform !== sys.Platform.WECHAT_GAME) {
                // 开发阶段或非微信环境，使用模拟广告
                this.rewardedAd = new FakeRewardedAd(this.config);
                console.log('🎮 [AdManager] 使用模拟广告系统');
            } else {
                // 生产环境，使用微信真实广告
                if (!this.config.adUnitId) {
                    throw new Error('生产环境需要提供 adUnitId');
                }
                this.rewardedAd = new WxRewardedAd(this.config);
                console.log('📱 [AdManager] 使用微信真实广告系统');
            }
            
            this.isInitialized = true;
            
            // 预加载广告（可选）
            if (this.rewardedAd.preload) {
                this.rewardedAd.preload().catch(err => {
                    console.log('⚠️ [AdManager] 预加载广告失败:', err);
                });
            }
            
        } catch (error) {
            console.error('❌ [AdManager] 初始化失败:', error);
            // 初始化失败时，回退到模拟广告
            this.rewardedAd = new FakeRewardedAd(this.config);
            this.isInitialized = true;
            console.log('🔄 [AdManager] 回退到模拟广告系统');
        }
    }
    
    /**
     * 显示激励视频广告
     * 业务层统一调用此方法，无需关心内部实现
     * @returns Promise<广告结果>
     */
    public async showRewardedAd(): Promise<'completed' | 'aborted' | 'error'> {
        if (!this.isInitialized) {
            console.error('❌ [AdManager] 未初始化，请先调用 init() 方法');
            return 'error';
        }
        
        if (!this.rewardedAd) {
            console.error('❌ [AdManager] 广告实例不存在');
            return 'error';
        }
        
        console.log('🎬 [AdManager] 开始显示激励视频广告');
        
        try {
            const result = await this.rewardedAd.show();
            console.log('📺 [AdManager] 广告播放结果:', result);
            return result;
        } catch (error) {
            console.error('❌ [AdManager] 广告播放异常:', error);
            return 'error';
        }
    }
    
    /**
     * 预加载广告
     * 提前加载广告资源，提升用户体验
     */
    public async preloadAd(): Promise<void> {
        if (!this.isInitialized || !this.rewardedAd || !this.rewardedAd.preload) {
            return;
        }
        
        try {
            await this.rewardedAd.preload();
            console.log('✅ [AdManager] 广告预加载成功');
        } catch (error) {
            console.log('⚠️ [AdManager] 广告预加载失败:', error);
        }
    }
    
    /**
     * 切换广告模式
     * @param useFakeAd 是否使用模拟广告
     */
    public switchAdMode(useFakeAd: boolean): void {
        console.log(`🔄 [AdManager] 切换广告模式: ${useFakeAd ? '模拟广告' : '真实广告'}`);
        this.init(this.config, useFakeAd);
    }
    
    /**
     * 获取当前配置
     */
    public getConfig(): AdConfig {
        return { ...this.config };
    }
    
    /**
     * 检查是否已初始化
     */
    public isReady(): boolean {
        return this.isInitialized && this.rewardedAd !== null;
    }
    
    /**
     * 销毁广告管理器
     */
    public destroy(): void {
        if (this.rewardedAd && this.rewardedAd.destroy) {
            this.rewardedAd.destroy();
        }
        this.rewardedAd = null;
        this.isInitialized = false;
        console.log('🗑️ [AdManager] 已销毁');
    }
}

// 导出单例实例，方便业务层使用
export const adManager = AdManager.instance;