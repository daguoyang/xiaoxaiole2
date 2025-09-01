import { Component, Node } from "cc";
import { SingletonClass } from "./singletonClass";

interface Listener {
    handler: (...args: any) => void,
    target: Object
}

/**
 * 事件管理
 */
export class EventManager extends SingletonClass<EventManager> {
    private _mapListener: Map<string, Listener[]> = new Map<string, Listener[]>();

    protected onDestroy() {
        this._mapListener.clear();
    }

    public on(eventName: string, handler: (...args: any) => void, target: Object): number {
        if (this._isNull(target)) return;

        const it: Listener = { handler: handler, target: target };
        let listener: Listener[] = this._mapListener.get(eventName) || [];
        if (listener.length < 1) {
            this._mapListener.set(eventName, [it]);
            return 1;
        }

        this._mapListener.set(eventName, listener.filter((it: Listener) => {
            if (it.target instanceof Component) {
                return !this._isNull(it.target.node.parent);
            } else if (it.target instanceof Node) {
                return !this._isNull(it.target["parent"]);
            } else {
                return it.target;
            }
        }));

        this._mapListener.get(eventName).push(it);
        return this._mapListener.get(eventName).length;
    }

    public emit(eventName: string, ...args: any) {
        const listener: Listener[] = this._mapListener.get(eventName) || [];
        if (listener.length < 1) return;

        this._mapListener.set(eventName, listener.filter((it: Listener) => {
            if (it.target instanceof Component) {
                return !this._isNull(it.target.node.parent);
            } else if (it.target instanceof Node) {
                return !this._isNull(it.target["parent"]);
            } else {
                return it.target;
            }
        }));

        this._mapListener.get(eventName).forEach((it: Listener) => {
            it.handler.apply(it.target, args);
        });
    }

    public off(eventName: string, target: Object) {
        const list: Listener[] = this._mapListener.get(eventName) || [];
        this._mapListener.set(eventName, list.filter((it: Listener) => {
            return it.target !== target;
        }))
    }

    public offAll(target: Object) {
        if (this._isNull(target)) return;
        for (let [key, list] of this._mapListener) {
            this._mapListener.set(key, list.filter((it: Listener) => { return it.target !== target; }))
        }
    }

    private _isNull(obj: Object): boolean { return obj === undefined || obj === null; }
}