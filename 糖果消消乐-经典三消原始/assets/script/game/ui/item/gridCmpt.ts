import { _decorator, Component, Node, Vec3, UITransform, Label } from 'cc';
import { App } from '../../../core/app';
const { ccclass, property } = _decorator;

@ccclass('gridCmpt')
export class gridCmpt extends Component {
    /** 横纵轴编号 */
    public h: number = 0;
    public v: number = 0;
    public type: number = -1;
    public obstacleValue: number = 0;
    public data: { h: number, v: number }

    public initData(h: number, v: number) {
        this.h = h;
        this.v = v;
        this.data = { h: h, v: v }
        if (this.type == -1) {
            this.type = Math.floor(Math.random() * App.gameLogic.blockCount);
            // this.type = Math.floor(Math.random() * 6);
        }
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
            if (item.name == `Match${this.type}`) {
                item.active = true;
            }
        });
        this.showPos(h, v);
    }

    showPos(h: number = this.h, v: number = this.v) {
        let lb = this.node.getChildByName('lb');
        // lb.getComponent(Label).string = `(${h},${v})`;
        lb.active = false;
    }

    isInside(pos: Vec3): boolean {
        let width = this.node.getComponent(UITransform).width;
        let curPos = this.node.position;
        if (Math.abs(pos.x - curPos.x) <= width / 2 && Math.abs(pos.y - curPos.y) <= width / 2) return true;
        return false;
    }

    /** 选中状态 */
    setSelected(bool: boolean) {
        if (!this.isValid) return;
        this.node.getChildByName('icon').children.forEach(item => {
            if (item.active && item.getChildByName('s')) {
                item.getChildByName('s').active = bool;
            }
        })
    }

    getMoveState() {
        return false;
    }

    setType(type: number) {
        if (!this.isValid) return;
        this.type = type;
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
            if (item.name == `Match${this.type}`) {
                item.active = true;
            }
        });
    }
    setCount(count: number) {
        let lb = this.node.getChildByName('lb');
        lb.getComponent(Label).string = `${count}`;
        if (count == 0) {
            this.node.getChildByName('ok').active = true;
        }
    }
    showGou(bool: boolean) {
        this.node.getChildByName('gou').active = bool;
    }
}