
import { instantiate, Prefab, Node, director, Label, isValid, UITransform, Vec3 } from "cc";
import { BaseViewCmpt } from "../components/baseViewCmpt";
import { PrefabPool } from "../components/prefabPool";
import { WindowOpenType, WindowType } from "../const/enumConst";
import { ViewName } from "../const/viewNameConst";
import { tipsViewCmpt } from "../game/ui/tipsViewCmpt";
import { PrintError, PrintLog } from "../utils/logHelper";
import { ResLoadHelper } from "../utils/resLoadHelper";
import { App } from "./app";
import { SingletonClass } from "./singletonClass";

interface IMultiViewData {
    cmpt: BaseViewCmpt,
    data: any,
}

interface IWaitViewData {
    name: string,
    data: any,
}

const MSG_ZINDEX = 100;
const NETWORK_ZINDEX = MSG_ZINDEX * 10;

/**
 * 窗口管理
 */
export class ViewManager extends SingletonClass<ViewManager> {
    private sceneNode: Node;
    /** 所有独立窗口 */
    private allView: Map<string, BaseViewCmpt> = new Map();
    /** 能同时存在的多个窗口 */
    private multiView: IMultiViewData[] = [];
    private curMultiView: BaseViewCmpt;
    private isExistMultiView = false;

    /** 窗口加载中,防止连续打开 */
    private isViewOpening = false;
    private waitOpenViewList: IWaitViewData[] = [];

    /** 消息框对象池 */
    private msgPool: PrefabPool;
    private msgCmptArr: tipsViewCmpt[] = [];

    /** 遮罩层 */
    private isShowMask: boolean;
    private netMaskTips: Node;

    //大厅常驻节点
    private foreverNodeArr: string[] = [
        ViewName.Single.eMarquee,
    ];

    constructor() {
        super();
        this.msgPool = new PrefabPool();
        this.msgPool.initPool(`${ViewName.Multiple.eMsg}`, 10);
    }

    protected onInit(canvas: Node): void {
        this.sceneNode = canvas;
    }

    /** 打开窗口 */
    async openView(viewName: string, ...args) {
        // 防止连续打开多个Single窗口
        if (this.isViewOpening) {
            this.waitOpenViewList.push({ name: viewName, data: args });
            return;
        }

        let viewCmpt: BaseViewCmpt;
        // 要打开的窗口是否已存在
        if (!this.getViewByName(viewName)) {
            this.isViewOpening = true;
            let prefabView = await ResLoadHelper.loadPrefabSync(`${viewName}`);
            if (!prefabView) {
                prefabView = await ResLoadHelper.loadCommonAssetSync(`${viewName}`, Prefab);
                if (!prefabView) {
                    PrintError(`ViewManager openView not prefab = ${viewName}`);
                    this.isViewOpening = false;
                    this.openWaitView();
                    return;
                }
            }
            let viewNode: Node = instantiate(prefabView);
            viewCmpt = viewNode.getComponent(BaseViewCmpt);
        } else {
            viewCmpt = this.getViewByName(viewName);
            // 暂时去掉置顶操作
            // viewCmpt.node.zIndex = this.allView.size;
        }

        if (!viewCmpt) {
            PrintError(`ViewManager openView not Cmpt = ${viewName}`);
            return;
        }

        // 判断是立即打开，还是加入待打开窗口列表
        if (viewCmpt.viewOpenType == WindowOpenType.eSingle) {
            if (!this.getViewByName(viewName)) {
                let root = this.getRootView(viewCmpt.viewType)
                root.addChild(viewCmpt.node);
                viewCmpt.node.attr({ viewName });
                this.allView.set(viewName, viewCmpt);
            } else {
                PrintLog(' open repeat view !!!');
            }
            viewCmpt.loadExtraData(...args);
        } else {
            viewCmpt.node.attr({ viewName });
            this.setMultiView(viewCmpt, ...args);
        }
        PrintLog(` openView = ${viewName}`);

        this.isViewOpening = false;
        this.openWaitView();
        return viewCmpt.node;
    }

    /** 切换场景 */
    async runScene(sceneName: string, callback?: Function) {
        if (sceneName == director.getScene().name) {
            PrintError(" runScene same Scene ");
            return;
        }
        await new Promise(r => { director.preloadScene(sceneName, r) });

        // 先移除掉目前场景内的任何界面
        for (const [key] of this.allView) {
            this.closeView(key);
        }
        this.allView.clear();
        this.netMaskTips && this.netMaskTips.removeFromParent();
        this.netMaskTips = null;

        director.loadScene(sceneName);
    }

    /** 显示提示框 */
    showAlertText(text: string, confirmText: string, cancelText: string, isRich: boolean, okCb: Function, cancelCb: Function = null) {
        // let data: AlertArgs = {
        //     text: text,
        //     confirmText: confirmText,
        //     cancelText: cancelText,
        //     confirmCb: okCb,
        //     cancelCb: cancelCb,
        // }
        // this.openView(ViewName.Multiple.eAlert, data);
    }


    /** 显示消息 */
    async showMsgTips(text: string) {
        let msgNode = await this.msgPool.getNode();
        msgNode.setPosition(new Vec3());
        this.sceneNode.getChildByName('toast').addChild(msgNode);
        // this.getRootView(WindowType.eToast).addChild(msgNode);
        let msgCmpt = msgNode.getComponent(tipsViewCmpt);
        msgCmpt.setTips(text);
        msgCmpt.setCloseFunc(() => {
            this.msgCmptArr.shift();
            this.msgPool.putNode(msgNode);
        })

        // 将之前的消息都往上移动点
        for (let i = 0; i < this.msgCmptArr.length; i++) {
            const cmpt = this.msgCmptArr[i];
            cmpt.upMove();
        }
        this.msgCmptArr.push(msgCmpt);
    }

    // /** 网络连接遮罩 */
    // async showNetworkMask(text: string) {
    //     if (!this.sceneNode) return;
    //     if (this.isShowMask) return;
    //     this.isShowMask = true;
    //     if (!this.netMaskTips) {
    //         let prefab = await ResLoadHelper.loadCommonAssetSync(`${ViewName.Single.eNetwork}`, Prefab);
    //         let tips = instantiate(prefab);
    //         this.getRootView(WindowType.eNetwork).addChild(tips);
    //         tips.zIndex = NETWORK_ZINDEX;
    //         this.netMaskTips = tips;
    //         if (text) {
    //             let lb = tips.getChildByName("text").getComponent(Label);
    //             CocosHelper.updateLabelText(lb, text, false);
    //         }
    //     }
    //     this.netMaskTips.active = this.isShowMask;
    // }
    // hideNetworkMask() {
    //     this.isShowMask = false;
    //     this.netMaskTips && (this.netMaskTips.active = false);
    // }

    /** 关闭窗口 */
    closeView(viewName: string) {
        let viewCmpt = this.getViewByName(viewName);
        if (!viewCmpt) {
            PrintLog(`closeView not found = ${viewName}`)
            return;
        }
        PrintLog(` closeView = ${viewName}`);
        this.delViewByName(viewName);
        viewCmpt.onClose();
    }

    /** 关闭最上层的窗口 */
    closeTopView() {
        let count = 0;
        for (const [key, cmpt] of this.allView) {
            count += 1;
            if (count == this.allView.size) {
                this.closeView(key);
            }
        }
    }

    private isForeverNode(viewName: string): boolean {
        let idx = this.foreverNodeArr.indexOf(viewName);
        return idx > -1 ? true : false;
    }
//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999

    /** 返回大厅 */
    backLobbyView() {
        this.allView.forEach(cmpt => {
            let vName = cmpt.node["viewName"];
            if (!this.isForeverNode(vName)) {
                this.closeView(vName);

            }
        })
        this.multiView.length = 0;
        this.multiView = [];
    }

    /** 获取当前窗口名字 */
    getCurName() {
        let viewCount = 0;
        for (const [key, cmpt] of this.allView) {
            viewCount += 1;
            if (viewCount == this.allView.size) {
                return key;
            }
        }
        return null;
    }

    /** 当前窗口是否存在 */
    isExistView(name: string) {
        for (const [key, cmpt] of this.allView) {
            let vName = cmpt.node["viewName"];
            if (vName == name) {
                return true;
            }
        }
        return false;
    }

    getViews() {
        return this.allView.keys;
    }

    getViewByName(viewName: string) {
        if (this.curMultiView && isValid(this.curMultiView.node)) {
            // 先判断最上层的共存窗口
            if (viewName == this.curMultiView.node["viewName"]) {
                return this.curMultiView;
            }
        }

        if (this.allView.has(viewName)) {
            return this.allView.get(viewName);
        }
        return null;
    }

    protected delViewByName(viewName: string) {
        let view = this.getViewByName(viewName);
        view && this.allView.delete(viewName);
    }

    /** 打开正在等待的窗口 */
    protected openWaitView() {
        if (!this.waitOpenViewList || !this.waitOpenViewList.length) {
            // PrintLog(` openWaitView not `);
            return;
        }
        let waitView = this.waitOpenViewList.shift();
        this.openView(waitView.name, ...waitView.data);
    }

    protected getRootView(viewType: WindowType) {
        if (!this.sceneNode) {
            return director.getScene().getChildByName('Canvas') || director.getScene();;
        }

        let root: Node;
        switch (viewType) {
            case WindowType.eMap:
                root = this.sceneNode.getChildByName('map');
                break;
            case WindowType.eView:
                root = this.sceneNode.getChildByName('view');
                break;
            case WindowType.eTips:
                root = this.sceneNode.getChildByName('tips');
                break;
            case WindowType.eMarquee:
                root = this.sceneNode.getChildByName('marquee');
                break;
            case WindowType.eToast:
                root = this.sceneNode.getChildByName('toast');
                break;
            case WindowType.eNetwork:
                root = this.sceneNode.getChildByName('network');
                break;
        }
        !root && (root = director.getScene().getChildByName('Canvas')) || director.getScene();
        return root;
    }

    addChildToTipsLayer(node: Node, pos) {
        let parent = this.getRootView(WindowType.eTips);
        let tempPos = new Vec3();
        // App.gameLogic.cameraCp.convertToUINode(pos, parent, tempPos)
        console.log(tempPos);
        node.setPosition(tempPos);
        parent.addChild(node);
    }

    /** 设置多个窗口打开先后顺序 */
    protected setMultiView(viewCmpt: BaseViewCmpt, ...args) {
        if (!this.multiView.length && !this.isExistMultiView) {
            this.multiView.push({ cmpt: viewCmpt, data: args });
            this.nextMultiView();
        } else {
            this.multiView.push({ cmpt: viewCmpt, data: args });
            // 按层级升序
            this.multiView.sort((a, b) => { return a.cmpt.viewType - b.cmpt.viewType });
        }
    }

    /** 展示下一个窗口 */
    protected async nextMultiView() {
        if (!this.multiView.length) {
            // PrintLog(" nextMultiView 多个窗口也全部关闭 ");
            this.isExistMultiView = false;
            return;
        }
        this.isExistMultiView = true;
        let cmptData = this.multiView.shift();
        this.curMultiView = cmptData.cmpt;
        let root = this.getRootView(cmptData.cmpt.viewType);
        root.addChild(cmptData.cmpt.node);
        cmptData.cmpt.loadExtraData(...cmptData.data);
        // 关闭当前就立即打开下一个
        await new Promise(r => { cmptData.cmpt.setCloseFunc(r) });
        this.nextMultiView();
    }

    /** 跑马灯 */
    showMarquee(info: any) {
        let hrView = this.getViewByName(ViewName.Single.eMarquee)
        if (!hrView) {
            this.openView(ViewName.Single.eMarquee, info);
            return;
        }
        if (info) {
            hrView.getComponent(BaseViewCmpt).loadExtraData(info);
        }
    }

    /** 获取通用物品道具 */
    async getCommonGoodsItem(data: any): Promise<Node> {
        let prefabItem = await ResLoadHelper.loadCommonAssetSync("common/goodsItem", Prefab);
        if (prefabItem) {
            return instantiate(prefabItem);
        }
    }
}