
import { instantiate, Node, ScrollView, size, UITransform, Vec3, Widget, _decorator } from "cc";
import { EventName } from "../const/eventName";
import { App } from "../core/app";
import ScrollItemCmpt from "./scrollItemCmpt";
const { ccclass, property } = _decorator;

export interface InitData {
    list: any[],
    target?: any
}

@ccclass("scrollViewCmpt")
export class ScrollViewCmpt extends ScrollView {

    @property(Node)
    scrollItem: Node = null;

    @property
    gap: number = 5;

    private loopCount: number = 0;
    private itemArr: any[] = [];
    private posArr: any[] = [];
    private bottomY: number = -100000;
    private m_data: any = null;

    start(): void {
        super.start();
        this.node.on("scrolling", this.scrolling, this);
        this.scrollItem.active = false;
    }

    resetContentSize(datalist: any[]) {
        let widget = this.node.getComponent(Widget);
        if (widget) {
            widget.updateAlignment();
        }
        let itemH = this.scrollItem.getComponent(UITransform).height;
        let height = datalist.length * (itemH + this.gap);
        this.content.getComponent(UITransform).setContentSize(size(this.node.getComponent(UITransform).width, height))
        let len1 = Math.ceil(this.node.getComponent(UITransform).height / (itemH + this.gap));
        let len2 = datalist.length;
        this.loopCount = len2 > len1 ? len1 : len2;
    }

    initData(dataObj: InitData) {

        let datalist = dataObj.list;
        this.m_data = dataObj;
        this.resetContentSize(datalist);
        if (this.itemArr.length > 0) {
            this.itemArr.forEach(item => { item.active = false });
        }
        let itemH = this.scrollItem.getComponent(UITransform).height;
        this.posArr = [];
        for (let i = 0; i < datalist.length; i++) {
            let posY = -(itemH + this.gap) * i - (itemH / 2 + this.gap);
            this.posArr.push(posY);
            if (i <= this.loopCount) {
                let node: Node = this.itemArr[i];
                if (!node) {
                    node = instantiate(this.scrollItem);
                    this.content.addChild(node);
                    this.itemArr.push(node);
                }
                let script: ScrollItemCmpt = node.getComponent(ScrollItemCmpt);
                node.active = true;
                if (script) {
                    script.initData(datalist[i], this.m_data.target)
                }
                node.setPosition(new Vec3(0, posY, 0));
            }
        }
    }

    updateItemInfo(item, idx) {
        if (!item) return;
        let script: ScrollItemCmpt = item.getComponent(ScrollItemCmpt);
        if (script && this.m_data.list[idx]) {
            script.initData(this.m_data.list[idx], this.m_data.target)
        }
    }

    scrolling() {
        if (!this.itemArr[0]) return;
        App.event.emit(EventName.Game.Scrolling, this.node);
        for (let i = 0; i < this.itemArr.length; i++) {
            let item: Node = this.itemArr[i];
            let pos = item.getPosition();
            let worldPos = item.parent.getComponent(UITransform).convertToWorldSpaceAR(pos);
            let thisPos = this.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.node.getPosition());
            let gap = this.node.getComponent(UITransform).height / 2;
            if (worldPos.y >= thisPos.y + gap + this.scrollItem.getComponent(UITransform).height) {
                let index = this.posArr.indexOf(pos.y);
                if (index + this.loopCount + 1 > this.posArr.length - 1) return;
                let newPos = item.getPosition();
                newPos.y = this.posArr[index + this.loopCount + 1];
                item.setPosition(newPos);
                this.updateItemInfo(item, index + this.loopCount + 1)
            }
            if (worldPos.y < this.bottomY) {
                let index = this.posArr.indexOf(pos.y);
                if (index - this.loopCount - 1 >= 0) {
                    let newPos = item.getPosition();
                    newPos.y = this.posArr[index - this.loopCount - 1];
                    item.setPosition(newPos);
                    this.updateItemInfo(item, index - this.loopCount - 1)
                }
            }

            item = this.itemArr[this.itemArr.length - 1];
            pos = item.getPosition();
            worldPos = item.parent.getComponent(UITransform).convertToWorldSpaceAR(pos);
            if (this.bottomY == -100000) {
                this.bottomY = thisPos.y - gap - this.scrollItem.getComponent(UITransform).height
            }
        }
    }
}
