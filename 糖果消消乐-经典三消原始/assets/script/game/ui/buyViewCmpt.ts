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
const { ccclass, property } = _decorator;

@ccclass('buyViewCmpt')
export class BuyViewCmpt extends BaseViewCmpt {
    private lbGold: Node = null;
    private content: Node = null;
    onLoad() {
        for (let i = 1; i < 8; i++) {
            this[`onClick_itemBtn${i}`] = this.handleBtnEvent.bind(this);
        }
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
        let gold = GlobalFuncHelper.getGold();
        let bool = gold < 888;
        let item1 = this.content.getChildByName('itemBtn1');
        ToolsHelper.setNodeGray(item1, bool);

        bool = gold < 200;
        item1 = this.content.getChildByName('itemBtn4');
        ToolsHelper.setNodeGray(item1, bool);
        item1 = this.content.getChildByName('itemBtn5');
        ToolsHelper.setNodeGray(item1, bool);
        item1 = this.content.getChildByName('itemBtn7');
        ToolsHelper.setNodeGray(item1, bool);
        bool = gold < 600;
        item1 = this.content.getChildByName('itemBtn6');
        ToolsHelper.setNodeGray(item1, bool);
    }

    handleBtnEvent(btn: Node) {
        App.audio.play('button_click');
        let gold = GlobalFuncHelper.getGold();
        let bool = gold < 888;
        let lv = LevelConfig.getCurLevel();
        switch (btn.name) {
            case 'itemBtn1':
                if (bool) {
                    App.view.showMsgTips("金币不足");
                    return;
                }
                GlobalFuncHelper.setGold(-888);
                App.event.emit(EventName.Game.UpdataGold);
                App.view.showMsgTips("购买成功");
                GlobalFuncHelper.setBomb(Bomb.hor, 1)
                GlobalFuncHelper.setBomb(Bomb.allSame, 1)
                GlobalFuncHelper.setBomb(Bomb.bomb, 1)
                break;
            case 'itemBtn2':
                App.event.emit(EventName.Game.Share, lv, false);
                GlobalFuncHelper.setGold(1000);
                App.event.emit(EventName.Game.UpdataGold);
                break;
            case 'itemBtn3':
                App.event.emit(EventName.Game.Share, lv, false);
                GlobalFuncHelper.setGold(5000);
                App.event.emit(EventName.Game.UpdataGold);
                break;
            case 'itemBtn4':
                bool = gold < 200;
                if (bool) {
                    App.view.showMsgTips("金币不足");
                    return;
                }
                GlobalFuncHelper.setGold(-200);
                App.event.emit(EventName.Game.UpdataGold);
                App.view.showMsgTips("购买成功");
                GlobalFuncHelper.setBomb(Bomb.bomb, 1)
                break;
            case 'itemBtn5':
                bool = gold < 200;
                if (bool) {
                    App.view.showMsgTips("金币不足");
                    return;
                }
                GlobalFuncHelper.setGold(-200);
                App.event.emit(EventName.Game.UpdataGold);
                App.view.showMsgTips("购买成功");
                GlobalFuncHelper.setBomb(Bomb.hor, 1);
                break;
            case 'itemBtn6':
                bool = gold < 600;
                if (bool) {
                    App.view.showMsgTips("金币不足");
                    return;
                }
                GlobalFuncHelper.setGold(-600);
                App.event.emit(EventName.Game.UpdataGold);
                App.view.showMsgTips("购买成功");
                GlobalFuncHelper.setBomb(Bomb.allSame, 1)
                break;
            case 'itemBtn7':
                bool = gold < 200;
                if (bool) {
                    App.view.showMsgTips("金币不足");
                    return;
                }
                GlobalFuncHelper.setGold(-200);
                App.event.emit(EventName.Game.UpdataGold);
                App.view.showMsgTips("购买成功");
                GlobalFuncHelper.setHeart(1)
                break;
        }
        this.updateItemStatus();
    }
}