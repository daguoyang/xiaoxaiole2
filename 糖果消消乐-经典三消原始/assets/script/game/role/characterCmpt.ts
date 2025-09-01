import { _decorator, Component, Node } from 'cc';
import { BaseNodeCmpt } from '../../components/baseNodeCmpt';
import { Direction } from '../../const/enumConst';
import { EventName } from '../../const/eventName';
import { App } from '../../core/app';
const { ccclass, property } = _decorator;

@ccclass('roleCmpt')
export class roleCmpt extends BaseNodeCmpt {
    private isMoving: boolean = false;
    private direction: Direction = Direction.left;

    onLoad() {
        super.onLoad();
    }

    addEvent() {
        App.event.on(EventName.Game.Move, this.evtMove, this);
        App.event.on(EventName.Game.EndMove, this.evtEndMove, this);
    }

    evtMove(direction: Direction) {
        this.direction = direction;
        this.isMoving = true;
    }

    evtEndMove() {
        this.isMoving = false;
    }

    update(dt) {
        if (!this.isMoving) return;
        dt *= 10;
        let pos = this.node.getPosition();
        switch (this.direction) {
            case Direction.left:
                pos.x += dt;
                break;

            case Direction.right:
                pos.x -= dt;
                break;

            case Direction.up:
                pos.z += dt;
                break;

            case Direction.down:
                pos.z -= dt;
                break;
        }

        this.node.setPosition(pos);
    }

    onDestroy() {
        super.onDestroy()
        App.event.off(EventName.Game.Move, this);
        App.event.off(EventName.Game.EndMove, this);
    }
}


