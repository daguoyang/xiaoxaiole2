import { _decorator, Node, tween, v3 } from 'cc';
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

    onLoad() {
        super.onLoad();
        this.star = this.viewList.get('animNode/win/star');
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
            LevelConfig.setLevelStar(lv, starCount);
            this.handleWin(coutArr);
        }
        else {
            this.handleLose();
        }
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
    }

    playStarAnim() {
        this.star.active = this.isWin;
        let count = this.starCount;
        if (this.isWin) {
            this.star.children.forEach((item, idx) => {
                item.getChildByName('s').active = idx + 1 <= count;
                item.setScale(0, 0, 0);
                tween(item).to(0.3 * (idx + 1), { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
            });
        }
    }
    /** 下一关 */
    onClick_nextBtn() {
        App.audio.play('button_click');
        GlobalFuncHelper.setGold(App.gameLogic.rewardGold);
        if (this.level == LevelConfig.getCurLevel()) {
            LevelConfig.nextLevel();
        }
        App.view.closeView(ViewName.Single.eGameView);
        App.view.openView(ViewName.Single.eHomeView, true);
        this.onClick_closeBtn();
    }
    /** 分享 */
    onClick_shareBtn() {
        App.audio.play('button_click');
        App.event.emit(EventName.Game.Share, App.gameLogic.curLevel);
        Advertise.showVideoAds();
        App.backHome();
    }
    /** 购买次数继续游戏 */
    onClick_continueBtn() {
        App.audio.play('button_click');
        let count = +GlobalFuncHelper.getGold();
        if (count < 200) {
            let lv = LevelConfig.getCurLevel();
            App.event.emit(EventName.Game.Share, lv);
            App.view.showMsgTips("金币不足")
            Advertise.showVideoAds();
            return;
        }
        GlobalFuncHelper.setGold(-200);
        App.event.emit(EventName.Game.UpdataGold);
        App.event.emit(EventName.Game.ContinueGame);
        this.onClick_closeBtn();
    }

    onClick_guanbiBtn() {
        if (this.isWin) {
            if (this.level == LevelConfig.getCurLevel()) {
                LevelConfig.nextLevel();
            }
        }
        App.backHome(true);
        super.onClick_closeBtn()
    }
}