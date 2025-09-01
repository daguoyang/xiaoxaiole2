/**
 * 广告配置文件
 * 用于集中管理广告相关配置
 */

export interface AdConfig {
    // 是否启用模拟广告（开发阶段为true，上线后改为false）
    enableMockAds: boolean;
    
    // 模拟广告配置
    mockAdSettings: {
        videoDuration: number;        // 激励视频时长（秒）
        interstitialDuration: number; // 插屏广告时长（秒）
        skipDelay: number;           // 多少秒后允许跳过
    };
    
    // 真实广告ID配置（上线时填入真实ID）
    realAdIds: {
        bannerId: string;      // 横幅广告位ID
        videoId: string;       // 激励视频广告位ID
        interstitialId: string; // 插屏广告位ID
    };
    
    // 广告展示策略
    adStrategy: {
        interstitialInterval: number; // 插屏广告间隔（关卡数）
        bannerShowPages: string[];    // 显示横幅广告的页面
    };
}

// 默认配置
export const DEFAULT_AD_CONFIG: AdConfig = {
    // 🚨 上线前改为 false
    enableMockAds: true,
    
    mockAdSettings: {
        videoDuration: 15,        // 15秒激励视频
        interstitialDuration: 3,  // 3秒插屏广告
        skipDelay: 5,            // 5秒后允许跳过
    },
    
    realAdIds: {
        // 🚨 上线前填入真实广告位ID
        bannerId: "",
        videoId: "",
        interstitialId: "",
    },
    
    adStrategy: {
        interstitialInterval: 3,  // 每3关显示一次插屏广告
        bannerShowPages: ["home", "game"], // 在首页和游戏页显示横幅
    }
};

/**
 * 广告配置管理器
 */
export class AdConfigManager {
    private static instance: AdConfigManager;
    private config: AdConfig;
    
    private constructor() {
        this.config = { ...DEFAULT_AD_CONFIG };
    }
    
    public static getInstance(): AdConfigManager {
        if (!AdConfigManager.instance) {
            AdConfigManager.instance = new AdConfigManager();
        }
        return AdConfigManager.instance;
    }
    
    // 获取当前配置
    public getConfig(): AdConfig {
        return this.config;
    }
    
    // 更新配置
    public updateConfig(newConfig: Partial<AdConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('广告配置已更新:', this.config);
    }
    
    // 切换广告模式
    public setMockMode(enabled: boolean): void {
        this.config.enableMockAds = enabled;
        console.log(`广告模式切换为: ${enabled ? '模拟模式' : '真实模式'}`);
    }
    
    // 设置真实广告ID
    public setRealAdIds(ids: Partial<AdConfig['realAdIds']>): void {
        this.config.realAdIds = { ...this.config.realAdIds, ...ids };
        console.log('真实广告ID已设置:', this.config.realAdIds);
    }
    
    // 检查是否为生产环境（可根据实际情况调整判断逻辑）
    public isProduction(): boolean {
        // 可以根据域名、构建标志等判断
        return !this.config.enableMockAds && 
               this.config.realAdIds.videoId !== "";
    }
    
    // 获取当前应该使用的广告模式
    public shouldUseMockAds(): boolean {
        return this.config.enableMockAds;
    }
}

// 导出单例实例
export const adConfigManager = AdConfigManager.getInstance();