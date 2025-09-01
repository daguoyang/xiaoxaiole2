import { _decorator, Component, Node } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { PageIndex } from '../../const/enumConst';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { App } from '../../core/app';
import { CocosHelper } from '../../utils/cocosHelper';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { StorageHelper, StorageHelperKey } from '../../utils/storageHelper';
import { WxManager, WxMgr } from '../../wx/wxManager';
const { ccclass, property } = _decorator;

@ccclass('settingViewCmpt')
export class settingViewCmpt extends BaseViewCmpt {
    private lbName: Node = null;
    private lbHeart: Node = null;
    private head: Node = null;
    private content: Node = null;
    onLoad() {
        for (let i = 1; i < 10; i++) {
            this[`onClick_head${i}`] = this.onClickHead.bind(this);
        }
        super.onLoad();
        this.lbName = this.viewList.get('lbName');
        this.lbHeart = this.viewList.get('animNode/content/p/lbHeart');
        this.content = this.viewList.get('scrollview/view/content');
        this.head = this.viewList.get('bg/head');
        this.updateOperateStatus();
    }

    updateOperateStatus() {
        if (this.viewList.get('bg/btnSound/off')) {
            this.viewList.get('bg/btnSound/off').active = !StorageHelper.getBooleanData(StorageHelperKey.Music_Eff_Status);
            this.viewList.get('bg/btnMusic/off').active = !StorageHelper.getBooleanData(StorageHelperKey.Music_Status);
        } else {
            this.viewList.get('animNode/content/btnSound/off').active = !StorageHelper.getBooleanData(StorageHelperKey.Music_Eff_Status);
            this.viewList.get('animNode/content/btnMusic/off').active = !StorageHelper.getBooleanData(StorageHelperKey.Music_Status);
        }
        if (this.lbHeart) {
            CocosHelper.updateLabelText(this.lbHeart, "x" + GlobalFuncHelper.getHeart());
        }
        if (!this.lbName) return;
        CocosHelper.updateLabelText(this.lbName, App.user.rankData.name);
        this.updateHead();
        this.updateHeadInfo(`head${App.user.rankData.icon}`)
    }

    loadExtraData() {
        App.audio.play('UI_PopUp');
    }

    updateHead() {
        if (this.head) {
            CocosHelper.updateUserHeadSpriteAsync(this.head, App.user.rankData.icon);
        }
    }

    onClick_btnSound() {
        App.audio.play('button_click');
        StorageHelper.setBooleanData(StorageHelperKey.Music_Eff_Status, !StorageHelper.getBooleanData(StorageHelperKey.Music_Eff_Status))
        this.updateOperateStatus();
    }

    onClick_btnMusic() {
        App.audio.play('button_click');
        StorageHelper.setBooleanData(StorageHelperKey.Music_Status, !StorageHelper.getBooleanData(StorageHelperKey.Music_Status))
        this.updateOperateStatus();
    }

    onClickHead(btn: Node) {
        App.audio.play('button_click');
        this.updateHeadInfo(btn.name);
        let icon = +btn.name.substring(btn.name.length - 1, btn.name.length);
        App.user.rankData.icon = icon;
        GlobalFuncHelper.setIcon(icon);
        this.updateHead();
        
        // 触发头像更新事件，通知其他页面更新头像
        App.event.emit(EventName.Game.UpdateUserIcon, icon);
    }

    updateHeadInfo(name: string) {
        if (!this.head) return;
        this.content.children.forEach(item => {
            item.getChildByName('s').active = item.name == name;
        });
    }

    onClick_replayBtn() {
        App.audio.play('button_click');
        
        // 检查体力是否足够
        if (!App.heart.canStartGame()) {
            // 体力不足时通过广告获取体力并重新开始
            App.heart.showHeartInsufficientTipsWithAd(() => {
                // 广告观看完成后，消耗刚获得的体力并重新开始游戏
                if (App.heart.consumeHeart(1)) {
                    this.onClick_closeBtn();
                    App.event.emit(EventName.Game.Restart);
                } else {
                    App.view.showMsgTips('❌ 体力消耗失败，请重试');
                }
            });
            return;
        }
        
        // 消耗1点体力
        if (!App.heart.consumeHeart(1)) {
            // 体力不足时通过广告获取体力并重新开始
            App.heart.showHeartInsufficientTipsWithAd(() => {
                // 广告观看完成后，消耗刚获得的体力并重新开始游戏
                if (App.heart.consumeHeart(1)) {
                    this.onClick_closeBtn();
                    App.event.emit(EventName.Game.Restart);
                } else {
                    App.view.showMsgTips('❌ 体力消耗失败，请重试');
                }
            });
            return;
        }
        
        this.onClick_closeBtn();
        App.event.emit(EventName.Game.Restart);
    }

    onClick_homeBtn() {
        App.audio.play('button_click');
        this.onClick_closeBtn();
        App.backHome();
    }
}