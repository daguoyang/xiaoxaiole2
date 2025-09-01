import { _decorator, Component, Node, Vec3, Vec2, UITransform } from 'cc';
import { EventName } from '../../../const/eventName';
import { App } from '../../../core/app';
const { ccclass, property } = _decorator;

@ccclass('gridTargetCmpt')
export class gridTargetCmpt extends Component {
    private originPos: Vec3 = null;
    private isStart: boolean = false;
    onLoad() {
        App.event.on(EventName.Game.TouchStart, this.evtTouchStart, this);
        App.event.on(EventName.Game.TouchMove, this.evtTouchMove, this);
        App.event.on(EventName.Game.TouchEnd, this.evtTouchEnd, this);
    }
    onDestroy() {
        App.event.offAll(this);
    }
    evtTouchStart(p: Vec2) {
        if (this.isStart) return;
        let pos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        this.originPos = this.node.getPosition();
        let trans = this.node.getComponent(UITransform);
        if (Math.abs(pos.x - this.originPos.x) <= trans.width / 2 && Math.abs(pos.y - this.originPos.y) <= trans.height / 2) {
            App.audio.play('block_back');
            this.isStart = true;
            pos.y += 200;
            this.node.setPosition(pos);
            this.node.setScale(new Vec3(1, 1, 1));
        }
    }

    evtTouchMove(p: Vec2) {
        if (!this.isStart) return;
        let pos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1))
        pos.y += 200;
        this.node.setPosition(pos);
    }

    evtTouchEnd(p: Vec2) {
        if (!this.isStart) return;
        App.event.emit(EventName.Game.GuildEvent, new Vec3(p.x, p.y + 100, 1));
        console.log(this.node.position.x);
        console.log(this.node.position.y);
        if (Math.abs(this.node.position.x) < 35 && Math.abs(this.node.position.y) < 35) {
            this.node.setPosition(new Vec3(0, 0, 0));
        }
        else {
            this.node.setPosition(this.originPos);
            this.node.setScale(new Vec3(0.6, 0.6, 0.6));
        }
        this.isStart = false;
    }
}


