/**
 * 单件基类，所有单件对象（一般管理器类使用）
 */
export class SingletonClass<T>{
    private _instance: T = null;
    private _isValid: boolean = false;

    // 该对象是否有效
    get valid(): boolean { return this._isValid; }

    public static getInstance<T>(o: { new(): T }): T {
        if (this.prototype._instance == null) {
            this.prototype._instance = new o();
        }
        return this.prototype._instance as T;
    }

    init(...args: any[]) {
        this.onInit(...args);
        this._isValid = true;
    }

    public destroy() {
        if (!this._isValid) return;
        this.onDestroy();
        this._isValid = false;
        this._instance = null;
        let self = this;
        self = null;
    }

    // 子类实现
    protected onInit(...args: any[]) {
    }

    // 子类实现
    protected onDestroy() {
    }
}