
import { EventName } from "../const/eventName";
import { App } from "./app";
import { SingletonClass } from "./singletonClass";

/**
 * 全局定时器管理
 */
export default class TimeManager extends SingletonClass<TimeManager> {
    /** 客户聊天，时间间隔60秒 */
    public TimeDownConst: number = 60;
    public TimeDown: number = 0;


    private _isDoing: boolean = true;

    constructor() {
        super();
    }

    protected onInit(): void {
        setInterval(this.updateSecound.bind(this), 1000);
    }

    /** 全局计时器，每秒一次,只执行加、减，不加多余逻辑 */
    updateSecound() {
        if (!this._isDoing) return;
        if (!App.gameLogic.isFrezenTime) {
            this.TimeDown--;
        }
        App.event.emit(EventName.Game.TIMER_DOWN);
    }

    public stopAll() {
        this._isDoing = false;
    }

    public reStart() {
        this._isDoing = true;
    }
}
