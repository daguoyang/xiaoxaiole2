import { ResLoadHelper } from "../utils/resLoadHelper";

import { _decorator, Component, Node, NodePool, Prefab, instantiate, } from 'cc';
const { ccclass, property } = _decorator;
/**
 * 预制体对象池
 */
@ccclass
export class PrefabPool {
    // 是否启用组件事件
    protected cmpt: { prototype: Component } | string;

    private _poolSize: number = 10;
    private _pool: NodePool;

    private _preUrl: string;
    private _preNode: Prefab;
    private _nodeName: string;

    private _init: boolean = false;

    async initPool(preUrl: string, size?: number, cmpt?: { prototype: Component } | string) {
        this.clean();

        this._preUrl = preUrl;
        let prefab = await ResLoadHelper.loadPrefabSync(preUrl);
        if (!prefab) {
            // PrintError(`initPool fail = ${preUrl}`);
            return;
        }
        prefab.addRef();
        this._preNode = prefab;
        this._nodeName = prefab.name;
        cmpt && (this.cmpt = cmpt);
        this.initPoolSize(size);
        this._init = true;
    }

    /**
     * 初始化对象池
     * @param size 数量
     */
    private initPoolSize(size?: number) {
        if (size > 0) {
            this._poolSize = size;
        }
        //对象池
        if (this.cmpt) {
            this._pool = new NodePool(this.cmpt as string);
        } else {
            this._pool = new NodePool();
        }
        for (let i = 0; i < this._poolSize; i++) {
            let obj = this.buildNode();
            this._pool.put(obj);
        }
    }

    /**
     * 获取
     */
    async getNode(...args) {
        if (!this._init) {
            await ResLoadHelper.loadPrefabSync(this._preUrl);
        }
        return this.syncGetNode();
    }

    /** 同步获取 */
    syncGetNode(...args) {
        let obj: Node;

        if (this._pool.size() <= 0) {
            let newObj = this.buildNode();
            this.putNode(newObj);
        }

        if (this._pool.size() > 0) {
            obj = this._pool.get(...args);
            // 会调用cmpt中reuse方法,参数args
            // PrintLog(` 直接获取，size :${this._pool.size()}`);
        }

        if (!obj) {
            // PrintError(" 获取失败 ");
            return null;
        }
        return obj;
    }

    /**
     * 回收
     * @param obj 回收对象
     */
    putNode(obj: Node) {
        this._pool.put(obj);
        // 会调用cmpt中unuse方法
        // PrintLog(` 回收成功，size:${this._pool.size()}`);
    }

    poolSize() {
        return this._pool.size();
    }

    /**
     * 清空对象池
     */
    clean() {
        if (this._pool) {
            this._pool.clear();
        }
        //释放资源
        if (this._preNode) {
            this._preNode.decRef();
            this._preNode = null;
        }
    }

    /**
     * 生成Node
     */
    private buildNode(): Node {
        let node: Node = instantiate(this._preNode);
        return node;
    }

    /**
     * 获取组件名字
     */
    getNodeName(): string {
        return this._nodeName;
    }
}