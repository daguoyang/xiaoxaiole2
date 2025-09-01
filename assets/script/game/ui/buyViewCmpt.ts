import { _decorator, Component, Node, Button, Sprite } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { Bomb } from '../../const/enumConst';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { App } from '../../core/app';
import { CocosHelper } from '../../utils/cocosHelper';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { StorageHelper, StorageHelperKey } from '../../utils/storageHelper';
import { ToolsHelper } from '../../utils/toolsHelper';
import { WxManager } from '../../wx/wxManager';
import { Advertise } from '../../wx/advertise';
const { ccclass, property } = _decorator;

@ccclass('buyViewCmpt')
export class BuyViewCmpt extends BaseViewCmpt {
    private lbGold: Node = null;
    private content: Node = null;
    onLoad() {
        super.onLoad();
        this.lbGold = this.viewList.get('top/lbGold');
        this.content = this.viewList.get('s/view/content');
        App.event.on(EventName.Game.UpdataGold, this.evtUpdateGold, this);
        this.evtUpdateGold();
        this.updateItemStatus();
    }

    loadExtraData() {
        App.audio.play('UI_PopUp');
    }

    evtUpdateGold() {
        let gold = GlobalFuncHelper.getGold();
        CocosHelper.updateLabelText(this.lbGold, gold);
    }

    updateItemStatus() {
        // 由于现在所有道具都是看广告获取，所有按钮都保持可用状态
        // 不再需要根据金币数量设置灰色状态
        for (let i = 1; i <= 7; i++) {
            let item = this.content.getChildByName(`itemBtn${i}`);
            if (item) {
                ToolsHelper.setNodeGray(item, false); // 所有按钮都不置灰
            }
        }
    }

    handleBtnEvent(btnName: string) {
        console.log('🔘 道具按钮被点击:', btnName);
        App.audio.play('button_click');
        let lv = LevelConfig.getCurLevel();
        
        switch (btnName) {
            case 'itemBtn1':
                // 礼包：观看广告获得多种道具
                console.log('🎁 点击礼包按钮');
                App.view.showMsgTips("观看广告获取豪华礼包");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setBomb(Bomb.hor, 1);
                        GlobalFuncHelper.setBomb(Bomb.allSame, 1);
                        GlobalFuncHelper.setBomb(Bomb.bomb, 1);
                        App.event.emit(EventName.Game.ToolCountRefresh);
                        App.view.showMsgTips("获得豪华礼包：横向+同色+炸弹道具各1个！");
                    }
                });
                break;
            case 'itemBtn2':
                // 获取1000金币
                App.view.showMsgTips("观看广告获取金币");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setGold(1000);
                        App.event.emit(EventName.Game.UpdataGold);
                        App.view.showMsgTips("获得 1000 金币！");
                    }
                });
                break;
            case 'itemBtn3':
                // 获取5000金币
                App.view.showMsgTips("观看广告获取大量金币");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setGold(5000);
                        App.event.emit(EventName.Game.UpdataGold);
                        App.view.showMsgTips("获得 5000 金币！");
                    }
                });
                break;
            case 'itemBtn4':
                // 炸弹道具
                App.view.showMsgTips("观看广告获取炸弹道具");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setBomb(Bomb.bomb, 1);
                        App.event.emit(EventName.Game.ToolCountRefresh);
                        App.view.showMsgTips("获得 炸弹道具 x1！");
                    }
                });
                break;
            case 'itemBtn5':
                // 横向消除道具
                App.view.showMsgTips("观看广告获取横向消除道具");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setBomb(Bomb.hor, 1);
                        App.event.emit(EventName.Game.ToolCountRefresh);
                        App.view.showMsgTips("获得 横向消除道具 x1！");
                    }
                });
                break;
            case 'itemBtn6':
                // 同色消除道具
                App.view.showMsgTips("观看广告获取同色消除道具");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setBomb(Bomb.allSame, 1);
                        App.event.emit(EventName.Game.ToolCountRefresh);
                        App.view.showMsgTips("获得 同色消除道具 x1！");
                    }
                });
                break;
            case 'itemBtn7':
                // 爱心/生命值
                App.view.showMsgTips("观看广告获取爱心");
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        App.heart.addHeart(1);
                        App.view.showMsgTips("获得 爱心 x1！");
                    }
                });
                break;
        }
        // 由于现在都是看广告获取，不需要更新金币状态
    }

    // 道具按钮点击事件
    onClick_itemBtn1() {
        console.log('🔘 礼包按钮被点击');
        this.handleBtnEvent('itemBtn1');
    }

    onClick_itemBtn2() {
        console.log('🔘 1000金币按钮被点击');
        this.handleBtnEvent('itemBtn2');
    }

    onClick_itemBtn3() {
        console.log('🔘 5000金币按钮被点击');
        this.handleBtnEvent('itemBtn3');
    }

    onClick_itemBtn4() {
        console.log('🔘 炸弹道具按钮被点击');
        this.handleBtnEvent('itemBtn4');
    }

    onClick_itemBtn5() {
        console.log('🔘 横向消除道具按钮被点击');
        this.handleBtnEvent('itemBtn5');
    }

    onClick_itemBtn6() {
        console.log('🔘 同色消除道具按钮被点击');
        this.handleBtnEvent('itemBtn6');
    }

    onClick_itemBtn7() {
        console.log('🔘 爱心按钮被点击');
        this.handleBtnEvent('itemBtn7');
    }
}