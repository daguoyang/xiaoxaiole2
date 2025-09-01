import { _decorator, Component, Node, tween, v3 } from 'cc';
import { BaseNodeCmpt } from '../../../components/baseNodeCmpt';
import { Bomb } from '../../../const/enumConst';
const { ccclass, property } = _decorator;

@ccclass('rocketCmpt')
export class rocketCmpt extends BaseNodeCmpt {
    onLoad() {
        super.onLoad();
    }

    initData(type: Bomb) {
        this.viewList.get('down').active = type == Bomb.ver;
        this.viewList.get('up').active = type == Bomb.ver;
        this.viewList.get('right').active = type == Bomb.hor;
        this.viewList.get('left').active = type == Bomb.hor;
        let time = 0.6;
        if (type == Bomb.ver) {
            tween(this.viewList.get('down')).to(time, { position: v3(0, -800, 1) }).start();
            tween(this.viewList.get('up')).to(time, { position: v3(0, 800, 1) }).call(() => {
                this.node.destroy();
            }).start();
        }
        else if (type == Bomb.hor) {
            tween(this.viewList.get('right')).to(time, { position: v3(720, 0, 1) }).start();
            tween(this.viewList.get('left')).to(time, { position: v3(-720, 0, 1) }).call(() => {
                this.node.destroy();
            }).start();
        }
    }
}


