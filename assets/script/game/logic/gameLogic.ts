import { Node, } from "cc";
import { Bomb } from "../../const/enumConst";
import { SingletonClass } from "../../core/singletonClass"
import { gridCmpt } from "../ui/item/gridCmpt";

export class GameLogic extends SingletonClass<GameLogic> {
    public rewardGold: number = 100;
    public curLevel: number = 1;
    public blockCount: number = 5;
    /** 开始游戏选择的的道具 */
    public toolsArr: number[] = [];
    /** 空位 */
    public hideFullList: any = [];
    public hideList = [];

    protected async onInit(...args: any[]) {
    }

    checkInHideList(i: number, j: number) {
        for (let m = 0; m < this.hideList.length; m++) {
            if (this.hideList[m][0] == i && this.hideList[m][1] == j) {
                return true;
            }
        }
        return false;
    }

    checkAllInHideList(i: number, j: number) {
        let bool = true;
        for (let m = j; m >= 0; m--) {
            let isInHide = this.checkInHideList(i, m);
            if (!isInHide) {
                bool = false;
                break;
            }
        }
        return bool;
    }

    resetHdeList(lv: number) {
        if (this.defaultHidelist[lv - 1]) {
            this.hideList = this.defaultHidelist[lv - 1];
            return;
        }
        if (this.hideFullList.length == 0) {
            this.hideList = this.defaultHidelist[0];
            return;
        }
        this.hideList = [];
        let rand = Math.floor(Math.random() * 25);
        for (let i = 0; i < rand; i++) {
            let idx = Math.floor(Math.random() * this.hideFullList.length);
            this.hideList.push(this.hideFullList[idx])
        }
    }
    /** 是否相邻 */
    isNeighbor(gc1: gridCmpt, gc2: gridCmpt) {
        if (gc1.h == gc2.h && Math.abs(gc1.v - gc2.v) == 1) {
            return true;
        }
        if (gc1.v == gc2.v && Math.abs(gc1.h - gc2.h) == 1) {
            return true;
        }
        return false;
    }

    isSameGrid(gc1: gridCmpt, gc2: gridCmpt) {
        return gc1.v == gc2.v && gc1.h == gc2.h;
    }

    /** 同一行 */
    private isSameHorizental(list: gridCmpt[]) {
        let first = list[0].v;
        for (let i = 0; i < list.length; i++) {
            if (list[i].v != first) return false;
        }
        return true;
    }
    /** 同一列 */
    private isSameVertical(list: gridCmpt[]) {
        let first = list[0].h;
        for (let i = 0; i < list.length; i++) {
            if (list[i].h != first) return false;
        }
        return true;
    }

    /** 获取炸弹编号 */
    getBombType(list: gridCmpt[]) {
        let len = list.length;
        if (len == 4) {
            if (this.isSameHorizental(list)) return Bomb.ver;
            if (this.isSameVertical(list)) return Bomb.hor;
        } else {
            if (this.isSameHorizental(list) || this.isSameVertical(list)) return Bomb.allSame;
            return Bomb.bomb;
        }

    }

    /** 默认地图固定格式 */
    private defaultHidelist = [
        [[0, 0], [0, 1], [1, 0], [0, 8], [0, 7], [1, 8], [8, 0], [8, 1], [7, 0], [8, 8], [8, 7], [7, 8]],
        [
            [0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [1, 1], [0, 8], [8, 8],
            [6, 0], [7, 1], [8, 2], [7, 0], [8, 0], [8, 1],
        ],
        [[4, 5], [4, 6], [4, 7], [4, 8], [4, 0], [4, 1], [4, 2], [4, 3]],
        [
            [2, 8], [3, 8], [4, 8], [5, 8], [6, 8],
            [3, 7], [5, 7], [4, 7], [4, 6]
        ],
        [[0, 4], [1, 4], [2, 4], [3, 4], [5, 4], [6, 4], [7, 4], [8, 4]],
        [
            [0, 4], [1, 4], [2, 4], [3, 4], [5, 4], [6, 4], [7, 4], [8, 4],
            [4, 5], [4, 6], [4, 7], [4, 8], [4, 0], [4, 1], [4, 2], [4, 3]
        ],
        [
            [3, 8], [4, 8], [5, 8], [3, 1], [4, 1], [5, 1],
            [3, 7], [4, 7], [5, 7], [3, 0], [4, 0], [5, 0],
            [0, 5], [1, 5], [2, 5], [6, 5], [7, 5], [8, 5],
            [0, 4], [1, 4], [2, 4], [6, 4], [7, 4], [8, 4],
            [0, 3], [1, 3], [2, 3], [6, 3], [7, 3], [8, 3]
        ],
        [
            [0, 2], [1, 2], [2, 2], [6, 2], [7, 2], [8, 2], [0, 8], [1, 8], [2, 8], [6, 8], [7, 8], [8, 8],
            [0, 1], [1, 1], [2, 1], [6, 1], [7, 1], [8, 1], [0, 7], [1, 7], [2, 7], [6, 7], [7, 7], [8, 7],
            [0, 0], [1, 0], [2, 0], [6, 0], [7, 0], [8, 0], [0, 6], [1, 6], [2, 6], [6, 6], [7, 6], [8, 6]
        ],
        [
            [0, 5], [1, 5], [2, 5], [6, 5], [7, 5], [8, 5],
            [0, 4], [1, 4], [2, 4], [6, 4], [7, 4], [8, 4],
            [0, 3], [1, 3], [2, 3], [6, 3], [7, 3], [8, 3]
        ],
        [
            [0, 0], [1, 0], [2, 1], [3, 1], [4, 2], [5, 2], [6, 3], [7, 3], [8, 4], [6, 5], [7, 5], [4, 6], [5, 6], [2, 7], [3, 7], [0, 8], [1, 8]
        ],
    ]
}

