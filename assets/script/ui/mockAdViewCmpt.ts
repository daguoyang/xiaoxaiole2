import { _decorator, Node, Label, ProgressBar, Button } from 'cc';
import { BaseViewCmpt } from '../components/baseViewCmpt';
import { App } from '../core/app';

const { ccclass, property } = _decorator;

@ccclass('MockAdViewCmpt')
export class MockAdViewCmpt extends BaseViewCmpt {
    private timeLabel: Label = null;
    private progressBar: ProgressBar = null;
    private skipBtn: Button = null;
    private adImage: Node = null;
    
    private countdown: number = 15;
    private callback: (completed: boolean) => void = null;
    private timer: any = null;
    
    onLoad() {
        super.onLoad();
        this.timeLabel = this.viewList.get('content/timeLabel')?.getComponent(Label);
        this.progressBar = this.viewList.get('content/progressBar')?.getComponent(ProgressBar);
        this.skipBtn = this.viewList.get('content/skipBtn')?.getComponent(Button);
        this.adImage = this.viewList.get('content/adImage');
        
        // 初始状态：跳过按钮不可见
        if (this.skipBtn) {
            this.skipBtn.node.active = false;
        }
    }
    
    /** 初始化广告 */
    initAd(callback: (completed: boolean) => void, duration: number = 15) {
        this.callback = callback;
        this.countdown = duration;
        this.startCountdown();
        
        // 5秒后显示跳过按钮
        this.scheduleOnce(() => {
            if (this.skipBtn) {
                this.skipBtn.node.active = true;
            }
        }, 5);
    }
    
    private startCountdown() {
        this.updateDisplay();
        
        this.timer = setInterval(() => {
            this.countdown--;
            this.updateDisplay();
            
            if (this.countdown <= 0) {
                this.onAdCompleted(true);
            }
        }, 1000);
    }
    
    private updateDisplay() {
        if (this.timeLabel) {
            this.timeLabel.string = `${this.countdown}s`;
        }
        
        if (this.progressBar) {
            const progress = (15 - this.countdown) / 15;
            this.progressBar.progress = progress;
        }
    }
    
    /** 跳过广告 */
    onClick_skipBtn() {
        App.audio.play('button_click');
        this.onAdCompleted(false);
    }
    
    /** 点击广告区域 */
    onClick_adImage() {
        App.audio.play('button_click');
        // 这里可以添加点击广告的逻辑
        console.log('广告被点击');
    }
    
    private onAdCompleted(completed: boolean) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.callback) {
            this.callback(completed);
        }
        
        // 关闭广告界面
        this.onClick_closeBtn();
    }
    
    onDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        super.onDestroy();
    }
}