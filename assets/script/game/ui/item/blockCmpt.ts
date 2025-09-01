import { _decorator, Component, Label, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('blockCmpt')
export class blockCmpt extends Component {
    public h: number = 0;
    public v: number = 0;
    initData(h: number, v: number) {
        this.node.getChildByName("single").children.forEach(item => item.active = false);
        this.node.getChildByName("corner").children.forEach(item => item.active = false);
        this.h = h;
        this.v = v;
        // this.node.getChildByName("lb").getComponent(Label).string = `(${h},${v})`;
    }
    isInside(pos: Vec3): boolean {
        let width = this.node.getComponent(UITransform).width;
        let curPos = this.node.position;
        if (Math.abs(pos.x - curPos.x) <= width / 2 && Math.abs(pos.y - curPos.y) <= width / 2) return true;
        return false;
    }

    handleBorders(top: Node, down: Node, left: Node, right: Node) {
        this.node.getChildByName("single").getChildByName("top").active = !top;
        this.node.getChildByName("single").getChildByName("down").active = !down;
        this.node.getChildByName("single").getChildByName("left").active = !left;
        this.node.getChildByName("single").getChildByName("right").active = !right;

        this.node.getChildByName("corner").getChildByName("left_top").active = !top && !left;
        this.node.getChildByName("corner").getChildByName("left_down").active = !down && !left;
        this.node.getChildByName("corner").getChildByName("right_top").active = !top && !right;
        this.node.getChildByName("corner").getChildByName("right_down").active = !down && !right;
    }

}