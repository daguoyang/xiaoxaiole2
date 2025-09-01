import { _decorator, Node, Enum, v3, tween, Widget, Sprite, BlockInputEvents, Color, UITransform, EventTouch, Material, Component, Button, TweenAction, easing, EditBox, Layers, director, view, } from 'cc';
import { WindowOpenType, WindowType } from '../const/enumConst';
import { App } from '../core/app';
import { CocosHelper } from '../utils/cocosHelper';
import { PrintLog } from '../utils/logHelper';
const { ccclass, property } = _decorator;

/** 点击按钮等待时间 */
const CLICK_WAIT_TIME = 0;
/**
 * 处理基本窗口
 */
@ccclass("baseViewCmpt")
export class BaseViewCmpt extends Component {
    @property({ displayName: '是否遍历所有节点' })
    protected isSelectNode: boolean = true;

    /** 当前所有的节点 */
    protected viewList: Map<string, Node> = new Map<string, Node>();

    @property({ type: Enum(WindowType), displayName: '窗口类型' })
    viewType = WindowType.eView;

    @property({ type: Enum(WindowOpenType), displayName: '打开类型' })
    viewOpenType = WindowOpenType.eSingle;

    @property({ displayName: '是否添加全屏Widget' })
    protected isAddFullWidget = false;

    @property({ displayName: '是否遮罩' })
    protected isMask = false;

    @property({ displayName: '点击空白地方是否关闭窗口' })
    protected isTouchSpaceClose = false;

    @property({ displayName: '是否播放打开界面动画,animNode为播放动画的节点' })
    protected isPlayOpenAnim = false;

    @property({ displayName: '是否截屏模糊背景' })
    protected isScreeShoot = false;

    private maskPanel: Node;
    private closeCallBack: Function;
    protected extraData: any;

    /** 是否在小游戏中 */
    protected isInGame: boolean = false;

    protected onLoad() {
        // 如果需要遍历所有节点，则调用 selectChild 方法
        if (this.isSelectNode) {
            this.selectChild(this.node);
        }

        if (this.isPlayOpenAnim) {
            this.openAnim();
        }
        this.addEvents();
        if (this.isAddFullWidget) {
            // 适配
            let widget = this.node.addComponent(Widget);
            widget.isAlignTop = true;
            widget.top = 0;
            widget.isAlignBottom = true;
            widget.bottom = 0;
            widget.isAlignLeft = true;
            widget.left = 0;
            widget.isAlignRight = true;
            widget.right = 0;
        }

        if (this.isMask) {
            // 添加遮罩
            this.addMask();
        }

        if (this.isTouchSpaceClose) {
            this.addSpaceEvent();
        }

        if (this.isScreeShoot) {
            this.screeShot();
        }
    }

    /** 加载额外的数据 */
    loadExtraData(...args) {
        this.extraData = args
    }

    protected addEvents() {
    }

    /** 设置屏蔽层显示 */
    protected setMaskVis(visible: boolean) {
        if (!this.maskPanel) return
        this.maskPanel.active = visible;
    }

    /** 取消屏蔽事件 */
    cancelBlockInput() {
        if (!this.maskPanel) return
        this.maskPanel.getComponent(BlockInputEvents)
            && this.maskPanel.removeComponent(BlockInputEvents);
    }

    /** 设置关闭回调 */
    setCloseFunc(callback: Function) {
        this.closeCallBack = callback;
    }

    onClose() {
        this.closeCallBack && this.closeCallBack.bind(this)(this);
        if (this.node) {
            this.node.removeFromParent();
            console.log("distroy")
            console.log(this.node.name);
            this.node.destroy();
        }
    }

    /** 添加空白点击事件 */
    protected addSpaceEvent() {
        let maskNode = new Node();
        maskNode.layer = Layers.Enum.UI_2D
        maskNode.addComponent(UITransform);
        let trans = maskNode.getComponent(UITransform);

        trans.setContentSize(view.getVisibleSize());
        this.node.addChild(maskNode);
        maskNode.setSiblingIndex(-1);

        maskNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.target == maskNode && this.onTouchSpace();
        })
    }

    /** 点击空白地方 */
    protected onTouchSpace() {
        this.onClick_closeBtn();
    }

    /** 默认关闭按钮 */
    protected onClick_closeBtn() {
        let viewName = this.node["viewName"];
        if (viewName) {
            App.view.closeView(viewName);
        } else {
            this.onClose();
        }
    }

    protected onDestroy() {
        App.event.offAll(this);
    }

    protected openAnim(cb?: Function) {
        let animNode = this.viewList.get('animNode')
        if (animNode) {
            animNode.scale = v3(0, 0, 0)
            tween(animNode).to(0.2, { scale: v3(1, 1, 1) }, { easing: easing.backOut }).call(() => { cb && cb() }).start();
            // const scaleTo = scaleTo(0.2, 1).easing(easeBackOut());
            // tween(animNode).then(scaleTo).call(() => { cb && cb() }).start();
        }
    }

    /** 截屏模糊遮罩 */
    protected async screeShot() {
        // if (App.subGame.isPlayGame) {
        //     if (!this.isMask) {
        //         this.addMask();
        //     }
        //     return;
        // }
        // let material = await ResLoadHelper.loadCommonAssetSync("materials/Blur", Material);
        // if (material) {
        //     let node = App.platform.shootBackground(null, material);
        //     this.node.addChild(node);
        //     node.setSiblingIndex(-10);
        //     App.event.emit(EventName.Lobby.GAME_LOADING, true, null);
        // }
    }

    addMask() {
        let maskNode = new Node();
        maskNode.layer = Layers.Enum.UI_2D
        maskNode.addComponent(UITransform);
        let maskSprite: Sprite = maskNode.addComponent(Sprite)
        maskSprite.type = Sprite.Type.SLICED;
        maskSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        let trans = maskNode.getComponent(UITransform);

        trans.setContentSize(view.getVisibleSize());
        maskSprite.color = new Color(0, 0, 0, 180);
        this.node.addChild(maskNode);
        maskNode.setSiblingIndex(-2);
        this.maskPanel = maskNode;

        CocosHelper.updateCommonSpriteSync(maskNode, 'popbg/common');
        maskNode.addComponent(BlockInputEvents)
    }

    /**
     * 遍历所有子节点，将节点存储到 viewList 中
     * @param node 当前节点
     * @param pName 当前节点的路径
     */
    private selectChild(node: Node, pName = '') {
        // 使用一个栈来遍历所有节点，避免递归调用带来的性能问题。
        const stack: [Node, string][] = [[node, pName]];
        while (stack.length > 0) {
            const [curNode, curPath] = stack.pop()!;
            // 将节点存储到 viewList 中，以当前节点的路径作为键
            this.viewList.set(curPath, curNode);
            // 绑定按钮事件
            this._bingButton(curNode);
            // 绑定输入框事件
            this._bingEditBox(curNode);

            const children = curNode.children;
            // 遍历当前节点的所有子节点，并将其添加到栈中
            for (let i = children.length - 1; i >= 0; i--) {
                const childNode = children[i];
                const childPath = curPath ? `${curPath}/${childNode.name}` : childNode.name;
                // 将子节点添加到栈中
                stack.push([childNode, childPath]);
            }
        }
    }

    /**
     * 为按钮绑定事件
     * @param node 节点
     * @returns 
     */
    private _bingButton(node: Node) {
        if (!node.getComponent(Button)) return
        let btn = node.getComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.95;
        if (this['onClick_' + node.name + "_Start"]) {
            CocosHelper.addButtonLister(node, Node.EventType.TOUCH_START, this['onClick_' + node.name + "_Start"].bind(this, node), this, CLICK_WAIT_TIME);
        }
        if (this['onClick_' + node.name + "_End"]) {
            CocosHelper.addButtonLister(node, Node.EventType.TOUCH_END, this['onClick_' + node.name + "_End"].bind(this, node), this, CLICK_WAIT_TIME);
        }
        if (this['onClick_' + node.name]) {
            CocosHelper.addButtonLister(node, Node.EventType.TOUCH_END, this['onClick_' + node.name].bind(this, node), this, CLICK_WAIT_TIME);
        }

    }

    /**
     * 为输入框绑定回调事件
     * @param node 节点
     * @returns 
     */
    private _bingEditBox(node: Node) {
        if (!node.getComponent(EditBox)) return

        if (this['onEditEnd_' + node.name]) {
            CocosHelper.addEditBoxLister(node, this['onEditEnd_' + node.name].bind(this, node.getComponent(EditBox)), this, CLICK_WAIT_TIME, "editing-did-ended");
        }
        if (this['onEditChange_' + node.name]) {
            CocosHelper.addEditBoxLister(node, this['onEditChange_' + node.name].bind(this, node.getComponent(EditBox)), this, CLICK_WAIT_TIME, "text-changed");
        }
    }
}

