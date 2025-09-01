import { CocosHelper } from "../utils/cocosHelper";


import { _decorator, Component, Node, Button, EditBox } from 'cc';
import { App } from "../core/app";
const { ccclass, property } = _decorator;

/** 点击按钮等待时间 */
const CLICK_WAIT_TIME = 0;
/**
 * 处理基本节点
 */
@ccclass("baseNodeCmpt")
export class BaseNodeCmpt extends Component {
    @property({ displayName: '是否遍历所有节点' })
    protected isSelectNode: boolean = true;

    /** 当前所有的节点 */
    protected viewList: Map<string, Node> = new Map<string, Node>();

    /**
     * 组件加载时调用
     */
    protected onLoad(): void {
        // 如果需要遍历所有节点，则调用 selectChild 方法
        if (this.isSelectNode) {
            this.selectChild(this.node);
        }
        this.addEvent();
    }

    protected addEvent() {

    }

    onDestroy() {
        this.node.destroy();
    }

    /**
     * 根据节点名称获取节点
     * @param name 节点名称
     * @returns 返回指定名称的节点，如果不存在则返回 null
     */
    protected getNodeByName(name: string): Node | null {
        return this.viewList.get(name) || null;
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
        // App.audio.play('button_click')
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
