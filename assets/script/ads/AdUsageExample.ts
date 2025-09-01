/**
 * 广告系统使用示例
 * 展示如何在业务代码中使用新的广告管理系统
 */

import { adManager } from './AdManager';
import { App } from '../core/app';

/**
 * 游戏启动时初始化广告系统
 */
export function initAdSystem(): void {
    // 广告配置
    const adConfig = {
        // 🚨 上线前需要填入真实的广告位ID
        adUnitId: "adunit-xxxxxxxxxx", // 微信广告位ID
        mockDuration: 15,              // 模拟广告时长
        mockSkipDelay: 5,              // 5秒后允许跳过
        enableDebugLog: true           // 开启调试日志
    };
    
    // 🚨 开发阶段设置为 true，上线后改为 false
    const isDevelopment = true;
    
    // 初始化广告管理器
    adManager.init(adConfig, isDevelopment);
    
    console.log('🎮 广告系统初始化完成');
}

/**
 * 业务代码示例：道具获取
 */
export class GameUI {
    
    /**
     * 点击获取道具按钮
     */
    async onWatchAdForItemButtonClicked(): Promise<void> {
        console.log('🔘 用户点击获取道具按钮');
        
        // 检查广告系统是否就绪
        if (!adManager.isReady()) {
            App.view.showMsgTips('广告系统未就绪，请稍后再试');
            return;
        }
        
        try {
            // 调用广告系统 - 业务层完全不需要知道是真实广告还是模拟广告
            const result = await adManager.showRewardedAd();
            
            // 根据广告结果处理业务逻辑
            switch (result) {
                case 'completed':
                    // 广告播放完成，给予奖励
                    this.grantItemReward();
                    App.view.showMsgTips('🎉 广告观看完成！获得道具奖励！');
                    break;
                    
                case 'aborted':
                    // 用户中途关闭广告，不给奖励
                    App.view.showMsgTips('⚠️ 观看未完成，未获得奖励');
                    break;
                    
                case 'error':
                    // 广告播放失败
                    App.view.showMsgTips('❌ 广告暂不可用，请稍后再试');
                    break;
            }
        } catch (error) {
            console.error('广告播放异常:', error);
            App.view.showMsgTips('❌ 广告播放异常，请稍后再试');
        }
    }
    
    /**
     * 点击复活按钮
     */
    async onWatchAdForReviveButtonClicked(): Promise<void> {
        console.log('🔘 用户点击复活按钮');
        
        const result = await adManager.showRewardedAd();
        
        if (result === 'completed') {
            this.revivePlayer();
            App.view.showMsgTips('🎉 复活成功！');
        } else if (result === 'aborted') {
            App.view.showMsgTips('⚠️ 复活失败，观看未完成');
            // 可以选择显示其他复活方式，比如花费金币
        } else {
            App.view.showMsgTips('❌ 广告暂不可用');
        }
    }
    
    /**
     * 获得额外步数
     */
    async onWatchAdForExtraMovesButtonClicked(): Promise<void> {
        console.log('🔘 用户点击获得额外步数按钮');
        
        const result = await adManager.showRewardedAd();
        
        if (result === 'completed') {
            this.addExtraMoves(5); // 增加5步
            App.view.showMsgTips('🎉 获得5步额外移动！');
        } else if (result === 'aborted') {
            App.view.showMsgTips('⚠️ 观看未完成，未获得额外步数');
        } else {
            App.view.showMsgTips('❌ 广告暂不可用');
        }
    }
    
    // 业务逻辑方法（示例）
    private grantItemReward(): void {
        // 这里实现具体的道具奖励逻辑
        console.log('✅ 发放道具奖励');
        // 例如：增加炸弹道具
        // GlobalFuncHelper.setBomb(Bomb.bomb, 1);
        // App.event.emit(EventName.Game.ToolCountRefresh);
    }
    
    private revivePlayer(): void {
        console.log('✅ 玩家复活');
        // 实现复活逻辑
    }
    
    private addExtraMoves(moves: number): void {
        console.log(`✅ 增加${moves}步额外移动`);
        // 实现增加步数逻辑
    }
}

/**
 * 上线部署时的切换示例
 */
export function switchToProduction(): void {
    // 🚨 上线时调用此方法，切换到真实广告
    const productionConfig = {
        adUnitId: "adunit-真实广告位ID", // 填入真实广告位ID
        enableDebugLog: false           // 关闭调试日志
    };
    
    // 切换到生产模式（使用真实广告）
    adManager.init(productionConfig, false);
    
    console.log('🚀 已切换到生产模式，使用真实广告');
}

/**
 * 开发调试功能
 */
export function debugAdSystem(): void {
    console.log('🔧 广告系统调试信息');
    console.log('- 是否就绪:', adManager.isReady());
    console.log('- 当前配置:', adManager.getConfig());
    
    // 手动切换广告模式（用于开发调试）
    // adManager.switchAdMode(true);  // 切换到模拟广告
    // adManager.switchAdMode(false); // 切换到真实广告
}