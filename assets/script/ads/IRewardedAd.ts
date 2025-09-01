/**
 * 激励视频广告统一接口
 * 开发阶段和上线后都实现这个接口，保持调用方式一致
 */
export interface IRewardedAd {
    /**
     * 显示激励视频广告
     * @returns Promise<广告结果>
     * - 'completed': 广告播放完成，应该给奖励
     * - 'aborted': 用户中途关闭，不给奖励
     * - 'error': 广告加载失败或其他错误
     */
    show(): Promise<'completed' | 'aborted' | 'error'>;
    
    /**
     * 预加载广告（可选）
     * 提前加载广告资源，提升用户体验
     */
    preload?(): Promise<void>;
    
    /**
     * 销毁广告实例（可选）
     * 释放资源
     */
    destroy?(): void;
}

/**
 * 广告配置接口
 */
export interface AdConfig {
    /** 广告单元ID（真实环境使用） */
    adUnitId?: string;
    /** 模拟广告时长（秒） */
    mockDuration?: number;
    /** 模拟广告允许跳过的延迟时间（秒） */
    mockSkipDelay?: number;
    /** 是否启用调试日志 */
    enableDebugLog?: boolean;
}