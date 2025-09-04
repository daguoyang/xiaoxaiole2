import { _decorator, Node, Label, tween, v3 } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { Advertise } from '../../wx/advertise';
import { gridCmpt } from './item/gridCmpt';
const { ccclass, property } = _decorator;

@ccclass('resultViewCmpt')
export class ResultViewCmpt extends BaseViewCmpt {
    private isWin: boolean = false;
    private level: number = 0;
    private starCount: number = 0;
    private star: Node = null;
    
    public rewardGold: number = 100; // 闯关成功固定奖励金币数量

    onLoad() {
        super.onLoad();
        this.star = this.viewList.get('animNode/win/star');
        this.updateButtonTexts();
    }

    updateButtonTexts() {
        // 修改分享按钮文本为"看广告"
        let shareBtn = this.viewList.get('animNode/lose/shareBtn') || this.viewList.get('animNode/win/shareBtn');
        if (shareBtn) {
            let label = shareBtn.getComponentInChildren(Label);
            if (label) {
                label.string = "看广告";
            }
        }
        
        // 修改继续按钮文本为"购买"（当金币充足时）或"看广告"（当金币不足时）
        let continueBtn = this.viewList.get('animNode/lose/continueBtn');
        if (continueBtn) {
            let label = continueBtn.getComponentInChildren(Label);
            if (label) {
                label.string = "购买";
            }
        }
    }

    async loadExtraData(lv: number, isWin: boolean, coutArr: any[], starCount: number) {
        if (isWin) {
            App.audio.play('win');
        }
        else {
            App.audio.play('lose');
        }
        this.level = lv;
        this.starCount = starCount;
        this.isWin = isWin;
        this.viewList.get('animNode/win').active = isWin;
        this.viewList.get('animNode/lose').active = !isWin;
        if (isWin) {
            this.handleWin(coutArr);
        }
        else {
            this.handleLose();
        }
        
        // 更新按钮文本
        this.updateContinueButtonText();
    }

    handleLose() {

    }

    handleWin(coutArr: any[]) {
        let target = this.viewList.get('animNode/win/target');
        target.children.forEach((item, idx) => {
            if (!coutArr) return;
            item.active = idx < coutArr.length;
            if (idx < coutArr.length) {
                item.getComponent(gridCmpt).setType(coutArr[idx][0]);
                let count = coutArr[idx][1]
                if (count == 0) {
                    item.getComponent(gridCmpt).showGou(true);
                }
                else {
                    item.getComponent(gridCmpt).setCount(count);
                }
            }
        });
        this.playStarAnim();
        
        // 胜利时直接增加体力
        console.log('挑战胜利，增加体力+1');
        App.heart.addHeart(1);
    }

    playStarAnim() {
        this.star.active = this.isWin;
        let count = this.starCount;
        console.log(`播放星星动画: 是否胜利=${this.isWin}, 星星数量=${count}, 星星子节点数=${this.star.children.length}`);
        
        if (this.isWin) {
            this.star.children.forEach((item, idx) => {
                let sChild = item.getChildByName('s');
                let shouldShow = idx + 1 <= count;
                console.log(`星星${idx + 1}: 节点名=${item.name}, 有s子节点=${!!sChild}, 应该显示=${shouldShow}`);
                
                if (sChild) {
                    sChild.active = shouldShow;
                } else {
                    console.warn(`星星${idx + 1}没有找到's'子节点`);
                }
                item.setScale(0, 0, 0);
                tween(item).to(0.3 * (idx + 1), { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
            });
        }
    }


    /** 更新继续按钮文本 */
    updateContinueButtonText() {
        // 根据金币数量决定继续按钮文本
        let continueBtn = this.viewList.get('animNode/lose/continueBtn');
        if (continueBtn) {
            let label = continueBtn.getComponentInChildren(Label);
            if (label) {
                const costGold = 200;
                const currentGold = GlobalFuncHelper.getGold();
                
                if (currentGold >= costGold) {
                    label.string = `${costGold}金币继续`;
                } else {
                    label.string = `${costGold}金币继续\n(金币不足)`;
                }
            }
        }
    }

    /** 点击继续游戏按钮 */
    onClick_nextBtn() {
        console.log('点击继续游戏按钮');
        App.audio.play('button_click');
        
        // 重要：胜利时进入下一关
        if (this.isWin) {
            console.log('关卡胜利，保存进度并进入下一关');
            
            // 保存星星数据（重要：在用户确认进入下一关时才保存）
            LevelConfig.setLevelStar(this.level, this.starCount);
            console.log(`保存关卡${this.level}的星星数据: ${this.starCount}星`);
            
            // 闯关成功奖励金币
            GlobalFuncHelper.setGold(this.rewardGold);
            console.log(`闯关成功！获得${this.rewardGold}金币`);
            
            // 触发金币更新事件
            App.event.emit(EventName.Game.UpdataGold);
            
            // 只有当前关卡等于或超过最高解锁关卡时，才解锁下一关
            let maxLevel = LevelConfig.getCurLevel();
            console.log(`当前通过关卡: ${this.level}, 最高解锁关卡: ${maxLevel}`);
            
            if (this.level >= maxLevel) {
                console.log('首次通过此关卡，解锁下一关');
                LevelConfig.nextLevel();
            } else {
                console.log('重新通过已解锁的关卡，不影响关卡解锁进度');
            }
        }
        
        // 延迟关闭界面（移除体力飞行动画，避免资源加载问题）
        this.scheduleOnce(() => {
            this.onClick_closeBtn();
        }, 0.5);
    }

    /** 点击分享按钮（看广告）*/
    onClick_shareBtn() {
        App.audio.play('button_click');
        console.log('点击分享按钮（看广告）');
        
        // 使用正确的广告API
        Advertise.showVideoAds((success: boolean) => {
            if (success) {
                console.log('广告播放成功');
                // 广告播放成功后的奖励逻辑 - 增加体力
                App.heart.addHeart(1);
                App.view.showMsgTips('观看广告成功！获得体力 +1');
            } else {
                console.log('广告播放失败或未完整观看');
                App.view.showMsgTips('广告未完整观看，请重试');
            }
        });
    }

    /** 点击继续按钮（失败界面）*/
    onClick_continueBtn() {
        App.audio.play('button_click');
        console.log('点击继续按钮（200金币继续）');
        
        const costGold = 200;
        const currentGold = GlobalFuncHelper.getGold();
        
        console.log(`当前金币: ${currentGold}, 需要金币: ${costGold}`);
        
        // 检查金币是否足够
        if (currentGold >= costGold) {
            // 金币足够，扣除金币并继续游戏
            GlobalFuncHelper.setGold(-costGold);
            App.view.showMsgTips(`花费${costGold}金币，增加5步！`);
            
            console.log('金币继续游戏成功，增加5步数');
            
            // 发送事件给游戏界面，增加5步
            App.event.emit(EventName.Game.AddSteps, 5);
            
            // 延迟关闭失败界面，直接关闭不跳转
            this.scheduleOnce(() => {
                App.view.closeView(ViewName.Single.eResultView);
            }, 1.0);
            
        } else {
            // 金币不足，提示看广告获取体力
            const needGold = costGold - currentGold;
            App.view.showMsgTips(`金币不足！还需要${needGold}金币。试试看广告获取体力吧！`);
            
            console.log('金币不足，建议观看广告获取体力');
            
            // 可以选择自动播放广告，或者让用户手动点击看广告按钮
            // 这里选择让用户手动点击，符合用户预期
        }
    }

    onClick_closeBtn() {
        console.log('点击关闭按钮，闯关状态:', this.isWin ? '成功' : '失败');
        
        if (this.isWin) {
            // 闯关成功时，与继续游戏功能保持一致
            console.log('闯关成功，保存进度并进入地图页面');
            
            // 保存星星数据（重要：在用户确认关闭时才保存）
            LevelConfig.setLevelStar(this.level, this.starCount);
            console.log(`保存关卡${this.level}的星星数据: ${this.starCount}星`);
            
            // 闯关成功奖励金币
            GlobalFuncHelper.setGold(this.rewardGold);
            console.log(`闯关成功！获得${this.rewardGold}金币`);
            
            // 触发金币更新事件
            App.event.emit(EventName.Game.UpdataGold);
            
            // 只有当前关卡等于或超过最高解锁关卡时，才解锁下一关
            let maxLevel = LevelConfig.getCurLevel();
            console.log(`当前通过关卡: ${this.level}, 最高解锁关卡: ${maxLevel}`);
            
            if (this.level >= maxLevel) {
                console.log('首次通过此关卡，解锁下一关');
                LevelConfig.nextLevel();
            } else {
                console.log('重新通过已解锁的关卡，不影响关卡解锁进度');
            }
        } else {
            // 闯关失败时，直接回到主页面
            console.log('闯关失败，直接回到主页面');
        }
        
        // 关闭结果界面并打开主页面
        App.view.closeView(ViewName.Single.eResultView);
        App.view.openView(ViewName.Single.eHomeView);
    }

    /** 处理预制体中名为 closeBtn-001 的关闭按钮 */
    ['onClick_closeBtn-001']() {
        console.log('点击 closeBtn-001 关闭按钮');
        this.onClick_closeBtn();
    }

    /** 处理预制体中名为 guanbiBtn 的关闭按钮 */
    onClick_guanbiBtn() {
        console.log('点击 guanbiBtn 关闭按钮');
        this.onClick_closeBtn();
    }
}