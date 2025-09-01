import { _decorator, Node, Sprite, UITransform, v3, instantiate, Color, SpriteFrame, resources } from 'cc';
import ScrollItemCmpt from '../../../components/scrollItemCmpt';
import { EventName } from '../../../const/eventName';
import { LevelConfig } from '../../../const/levelConfig';
import { ViewName } from '../../../const/viewNameConst';
import { App } from '../../../core/app';
import { CocosHelper } from '../../../utils/cocosHelper';
import { ResLoadHelper } from '../../../utils/resLoadHelper';
const { ccclass, property } = _decorator;

@ccclass('mapCmpt')
export class mapCmpt extends ScrollItemCmpt {
    private index: number = 0;
    private local: Node = null;
    private localHead: Node = null;
    private headBorder: Node = null;
    onLoad() {
        for (let i = 1; i < 9; i++) {
            this[`onClick_${i}`] = this.onClick_Item.bind(this);
        }
        super.onLoad();
        this.local = this.viewList.get('local');
        // local节点本身就是头像显示节点，直接使用它
        this.localHead = this.local;
        console.log('使用local节点作为头像显示节点');
        
        // 添加头像更新事件监听
        App.event.on(EventName.Game.UpdateUserIcon, this.updateLocalHeadIcon, this);
    }

    initData(i: number) {
        let curMap: Node = null;
        this.node.children.forEach(item => {
            let idx = i % 8;
            if (idx == 0) idx = 8;
            item.active = item.name == `map${idx}`;
            if (item.active) {
                curMap = item;
            }
        });
        let lv = App.gameLogic.curLevel;
        this.index = i;
        for (let m = 1; m < 9; m++) {
            let item = curMap.getChildByName(`${m}`);
            let idx = (i - 1) * 8 + m;
            CocosHelper.updateLabelText(item.getChildByName("lv"), (i - 1) * 8 + m);
            item.getComponent(Sprite).grayscale = idx > lv;
            this.handleStar(item, idx);
        }
    }

    handleStar(starNode: Node, idx: number) {
        let lv = App.gameLogic.curLevel;
        let starNum = +LevelConfig.getLevelStar(idx) || 0;
        let bool = idx <= lv && starNum > 0;
        for (let n = 1; n < 4; n++) {
            starNode.getChildByName(`star${n}`).active = bool;
        }
        if (bool) {
            for (let n = 1; n < 4; n++) {
                starNode.getChildByName(`star${n}`).getChildByName('s').active = n <= starNum;
            }
        }
        if (idx == lv) {
            let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(starNode.worldPosition);
            this.local.active = true;
            this.local.setPosition(v3(pos.x, pos.y + 60, 1));
            
            // 初始化当前关卡位置的头像
            this.initLocalHeadIcon();
        }
    }

    /** 初始化当前关卡位置的头像 */
    initLocalHeadIcon() {
        if (this.localHead) {
            console.log('正在初始化关卡头像，用户头像ID:', App.user.rankData.icon);
            
            // 确保头像节点有足够的尺寸显示完整的头像
            let headTransform = this.localHead.getComponent(UITransform);
            if (headTransform) {
                headTransform.setContentSize(100, 100);
                console.log('头像节点尺寸已设置为:', headTransform.contentSize);
            }
            
            CocosHelper.updateUserHeadSpriteAsync(this.localHead, App.user.rankData.icon);
            console.log('关卡头像初始化完成');
        } else {
            console.log('localHead节点不存在，无法初始化头像');
        }
    }




    /** 获取当前激活的地图 */
    getCurrentActiveMap(): Node | null {
        for (let child of this.node.children) {
            if (child.active) {
                return child;
            }
        }
        return null;
    }

    /** 更新当前关卡位置的头像 */
    updateLocalHeadIcon(icon: number) {
        if (this.localHead) {
            console.log('接收到关卡头像更新事件，新头像ID:', icon);
            App.user.rankData.icon = icon;
            CocosHelper.updateUserHeadSpriteAsync(this.localHead, icon);
            console.log('关卡头像更新完成');
        } else {
            console.log('localHead节点不存在，无法更新关卡头像');
        }
    }

    onClick_Item(item: Node) {
        App.audio.play('button_click');
        let lv = App.gameLogic.curLevel;
        let idx = (this.index - 1) * 8 + +item.name;
        if (idx > lv) {
            App.view.showMsgTips("请先完成前面的关卡");
            return;
        }
        App.view.openView(ViewName.Single.eChallengeView, idx);
    }

    onDestroy() {
        // 清理事件监听器
        if (App.event) {
            App.event.off(EventName.Game.UpdateUserIcon, this.updateLocalHeadIcon, this);
        }
        super.onDestroy && super.onDestroy();
    }
}