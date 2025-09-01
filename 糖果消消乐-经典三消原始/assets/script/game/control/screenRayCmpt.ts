import { _decorator, input, Input, EventTouch } from 'cc';
import { BaseNodeCmpt } from '../../components/baseNodeCmpt';
import { EventName } from '../../const/eventName';
import { App } from '../../core/app';
const { ccclass, property } = _decorator;
/**
 * 射线碰撞检测
 */
@ccclass('screenRayCmpt')
export class screenRayCmpt extends BaseNodeCmpt {
    private isCanDo: boolean = false;
    onLoad() {
        super.onLoad();
    }
    start() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        if (this.isCanDo) return;
        this.isCanDo = true;
        App.event.emit(EventName.Game.TouchStart, event.getUILocation());
    }

    onTouchMove(event: EventTouch) {
        if (!this.isCanDo) {
            this.isCanDo = true;
            return;
        }
        App.event.emit(EventName.Game.TouchMove, event.getUILocation());
    }

    onTouchEnd(event: EventTouch) {
        this.isCanDo = false;
        App.event.emit(EventName.Game.TouchEnd, event.getUILocation());
    }

}