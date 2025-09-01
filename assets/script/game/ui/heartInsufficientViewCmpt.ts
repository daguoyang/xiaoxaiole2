import { _decorator, Node, Label } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { App } from '../../core/app';
import { adManager } from '../../ads/AdManager';
const { ccclass, property } = _decorator;

/**
 * 体力不足提示界面
 */
@ccclass('heartInsufficientViewCmpt')
export class HeartInsufficientViewCmpt extends BaseViewCmpt {
    private countdownLabel: Node = null;
    private watchAdBtn: Node = null;
    private waitBtn: Node = null;
    private countdownTimer: number = null;
    
    onLoad() {
        super.onLoad();
        this.countdownLabel = this.viewList.get('animNode/content/countdownLabel');
        this.watchAdBtn = this.viewList.get('animNode/content/watchAdBtn');
        this.waitBtn = this.viewList.get('animNode/content/waitBtn');
        
        // 开始倒计时
        this.startCountdown();
    }
    
    onDestroy() {
        super.onDestroy();
        // 清理定时器
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }
    
    /**
     * 开始实时倒计时
     */
    startCountdown() {
        this.updateCountdown();
        
        // 每秒更新倒计时
        this.countdownTimer = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }
    
    /**
     * 更新倒计时显示
     */
    updateCountdown() {
        if (!this.countdownLabel) return;
        
        const recoverTime = App.heart.formatRecoverTime();
        const label = this.countdownLabel.getComponent(Label);
        if (label) {
            label.string = recoverTime;
        }
        
        // 如果体力已满，关闭界面
        if (App.heart.getCurrentHeart() > 0) {
            this.onClick_closeBtn();
        }
    }
    
    /**
     * 观看广告获取体力
     */
    async onClick_watchAdBtn() {
        App.audio.play('button_click');
        
        const result = await adManager.showRewardedAd();
        
        if (result === 'completed') {
            // 观看广告成功，增加1点体力
            App.heart.addHeart(1);
            App.view.showMsgTips("观看广告成功！获得体力 +1");
            this.onClick_closeBtn();
        } else {
            App.view.showMsgTips("需要完整观看广告才能获得体力");
        }
    }
    
    /**
     * 等待恢复
     */
    onClick_waitBtn() {
        App.audio.play('button_click');
        this.onClick_closeBtn();
    }
}