/**
 * 广告系统使用示例
 * 展示如何在游戏中集成模拟广告系统
 */

import { Advertise } from "../wx/advertise";
import { adConfigManager } from "../config/adConfig";

export class AdUsageExample {
    
    /**
     * 游戏初始化时的广告配置
     */
    public static initializeAds() {
        console.log("🎮 初始化广告系统...");
        
        // 检查是否为开发环境
        const isDevelopment = true; // 根据实际情况判断
        
        if (isDevelopment) {
            // 开发环境：使用模拟广告
            console.log("📱 开发环境：启用模拟广告");
            adConfigManager.setMockMode(true);
            adConfigManager.updateConfig({
                mockAdSettings: {
                    videoDuration: 15,        // 激励视频15秒
                    interstitialDuration: 3,  // 插屏广告3秒
                    skipDelay: 5             // 5秒后可跳过
                }
            });
        } else {
            // 生产环境：使用真实广告
            console.log("🚀 生产环境：启用真实广告");
            adConfigManager.setMockMode(false);
            adConfigManager.setRealAdIds({
                bannerId: "adunit-xxxxxxxxxxxxxx",      // 替换为真实的横幅广告ID
                videoId: "adunit-yyyyyyyyyyyyyy",       // 替换为真实的激励视频ID
                interstitialId: "adunit-zzzzzzzzzzzz"   // 替换为真实的插屏广告ID
            });
        }
    }
    
    /**
     * 场景1：闯关失败，用户选择看广告获得额外步数
     */
    public static showRewardVideoForExtraSteps() {
        console.log("💔 闯关失败，用户请求额外步数");
        
        // 显示激励视频广告
        Advertise.showVideoAds();
        
        // 奖励逻辑在 WxMgr.addReward() 中处理
        // 包括：金币、炸弹道具、继续游戏等
    }
    
    /**
     * 场景2：关卡间显示插屏广告
     */
    public static showInterstitialBetweenLevels(currentLevel: number) {
        // 每3关显示一次插屏广告
        const config = adConfigManager.getConfig();
        if (currentLevel % config.adStrategy.interstitialInterval === 0) {
            console.log(`🎯 第${currentLevel}关完成，显示插屏广告`);
            Advertise.showInterstitialAds();
        }
    }
    
    /**
     * 场景3：用户分享获得奖励
     */
    public static showRewardVideoForSharing() {
        console.log("📤 用户选择分享获得奖励");
        
        // 可以结合分享和广告
        // 1. 先分享
        // 2. 再看广告获得额外奖励
        Advertise.showVideoAds();
    }
    
    /**
     * 场景4：商店页面显示横幅广告
     */
    public static showBannerInShop() {
        const config = adConfigManager.getConfig();
        if (config.adStrategy.bannerShowPages.includes("shop")) {
            console.log("🛒 商店页面显示横幅广告");
            Advertise.showBannerAds();
        }
    }
    
    /**
     * 场景5：离开商店页面隐藏横幅广告
     */
    public static hideBannerFromShop() {
        console.log("🚪 离开商店页面，隐藏横幅广告");
        Advertise.hideBannerAds();
    }
    
    /**
     * 场景6：运行时切换广告模式（测试用）
     */
    public static toggleAdMode() {
        const currentMode = adConfigManager.shouldUseMockAds();
        const newMode = !currentMode;
        
        console.log(`🔄 切换广告模式: ${currentMode ? '模拟' : '真实'} → ${newMode ? '模拟' : '真实'}`);
        adConfigManager.setMockMode(newMode);
    }
    
    /**
     * 场景7：调试用 - 快速测试所有广告类型
     */
    public static testAllAdTypes() {
        console.log("🧪 测试所有广告类型...");
        
        // 测试激励视频
        setTimeout(() => {
            console.log("测试激励视频广告");
            Advertise.showVideoAds();
        }, 1000);
        
        // 测试插屏广告
        setTimeout(() => {
            console.log("测试插屏广告");
            Advertise.showInterstitialAds();
        }, 3000);
        
        // 测试横幅广告
        setTimeout(() => {
            console.log("测试横幅广告");
            Advertise.showBannerAds();
            
            // 5秒后隐藏
            setTimeout(() => {
                Advertise.hideBannerAds();
            }, 5000);
        }, 5000);
    }
}

// 使用示例：
// 在游戏启动时调用
// AdUsageExample.initializeAds();

// 在闯关失败时调用
// AdUsageExample.showRewardVideoForExtraSteps();

// 在关卡切换时调用
// AdUsageExample.showInterstitialBetweenLevels(currentLevel);