import { EventKeyboard, Input, Node, input, instantiate, _decorator, Slider, EventTouch, sys } from 'cc';
import { BaseNodeCmpt } from '../components/baseNodeCmpt';
import { Direction } from '../const/enumConst';
import { EventName } from '../const/eventName';
import { LevelConfig } from '../const/levelConfig';
import { ModleNameConst } from '../const/modleNameConst';
import { ViewName } from '../const/viewNameConst';
import { App } from '../core/app';
import { Net } from '../net/net';
import { Router } from '../net/routers';
import { ResLoadHelper } from '../utils/resLoadHelper';
const { ccclass, property } = _decorator;

@ccclass('mainCmpt')
export class mainCmpt extends BaseNodeCmpt {
    @property(Node)
    canvase: Node = null;
    onLoad() {
        super.onLoad();
        App.init(this.canvase);
        this.initView();
        this.connectServer();
    }

    addEvent() {
        input.on(Input.EventType.KEY_DOWN, this.evtKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.evtKeyUp, this);
    }

    initView() {
        App.gameLogic.curLevel = LevelConfig.getCurLevel();
        // App.view.openView(ViewName.Single.eHomeView);
        // App.view.openView(ViewName.Single.eGameView);
        App.view.openView(ViewName.Single.eLoadingView);
    }

    evtKeyDown(key: EventKeyboard) {
        key.keyCode == 68 && App.event.emit(EventName.Game.Move, Direction.right);
        key.keyCode == 65 && App.event.emit(EventName.Game.Move, Direction.left);
        key.keyCode == 87 && App.event.emit(EventName.Game.Move, Direction.up);
        key.keyCode == 83 && App.event.emit(EventName.Game.Move, Direction.down);
    }

    evtKeyUp(key: EventKeyboard) {
        App.event.emit(EventName.Game.EndMove);
    }

    connectServer() {
        // if (sys.platform != sys.Platform.WECHAT_GAME) {
        //     Net.init(() => {
        //         let data = { name: "大胜", icon: "https://s1.aigei.com/src/img/jpg/93/931733ea940d4128a094cba710545805.jpg?imageMogr2/auto-orient/thumbnail/!160x201r/gravity/Center/crop/160x201/quality/85/&e=1735488000&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:b8vgKEpgaD7X1HtBVvsv8KF0IMM=" };
        //         Net.sendMsg(data, Router.rut_login);
        //         App.user.rankData.name = data.name
        //         App.user.rankData.icon = data.icon;
        //     });
        // }
    }

}
