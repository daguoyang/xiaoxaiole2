import { _decorator, Node, v3, UITransform, instantiate, Vec3, tween, Prefab, Vec2, Sprite } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { Bomb, Constant, LevelData, PageIndex } from '../../const/enumConst';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { SoundType } from '../../core/audioManager';
import { CocosHelper } from '../../utils/cocosHelper';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { ResLoadHelper } from '../../utils/resLoadHelper';
import { ToolsHelper } from '../../utils/toolsHelper';
import { Advertise } from '../../wx/advertise';
import { gridManagerCmpt } from './gridManagerCmpt';
import { gridCmpt } from './item/gridCmpt';
import { rocketCmpt } from './item/rocketCmpt';
const { ccclass, property } = _decorator;

@ccclass('gameViewCmpt')
export class GameViewCmpt extends BaseViewCmpt {
    /**  ui */
    private gridMgr: gridManagerCmpt = null;
    private gridNode: Node = null;
    private effNode: Node = null;
    private target1: Node = null;
    private target2: Node = null;
    private targetBg: Node = null;
    private lbStep: Node = null;
    private spPro: Node = null;
    private star: Node = null;
    private lbTool1: Node = null;
    private lbTool2: Node = null;
    private lbTool3: Node = null;
    private lbTool4: Node = null;
    private addBtn1: Node = null;
    private addBtn2: Node = null;
    private addBtn3: Node = null;
    private addBtn4: Node = null;
    /**   */
    private gridPre: Prefab = null;
    private particlePre: Prefab = null;
    private rocketPre: Prefab = null;
    private blockArr: Node[][] = []
    private blockPosArr: Vec3[][] = [];
    private hideList = [];
    /** 行列数 */
    private H: number = Constant.layCount;
    private V: number = Constant.layCount;
    private isStartTouch: boolean = false;
    private curTwo: gridCmpt[] = [];
    private isStartChange: boolean = false;
    /** 关卡数据 */
    private level: number = 0;
    private stepCount: number = 0;
    private data: LevelData = null;
    private coutArr: any[] = [];
    private curScore: number = 0;
    private starCount: number = 0;
    private isWin: boolean = false;
    onLoad() {
        for (let i = 1; i < 5; i++) {
            this[`onClick_addBtn${i}`] = this.onClickAddButton.bind(this);
            this[`onClick_toolBtn${i}`] = this.onClickToolButton.bind(this);
        }
        super.onLoad();
        App.audio.play('background1', SoundType.Music, true);
        this.gridMgr = this.viewList.get('center/gridManager').getComponent(gridManagerCmpt);
        this.gridNode = this.viewList.get('center/gridNode');
        this.effNode = this.viewList.get('center/effNode');
        this.targetBg = this.viewList.get('top/content/targetBg');
        this.target1 = this.viewList.get('top/target1');
        this.target2 = this.viewList.get('top/target2');
        this.lbStep = this.viewList.get('top/lbStep');
        this.spPro = this.viewList.get('top/probg/spPro');
        this.star = this.viewList.get('top/star');
        this.lbTool1 = this.viewList.get('bottom/proppenal/tool1/prompt/lbTool1');
        this.lbTool2 = this.viewList.get('bottom/proppenal/tool2/prompt/lbTool2');
        this.lbTool3 = this.viewList.get('bottom/proppenal/tool3/prompt/lbTool3');
        this.lbTool4 = this.viewList.get('bottom/proppenal/tool4/prompt/lbTool4');
        this.addBtn1 = this.viewList.get('bottom/proppenal/tool1/addBtn1');
        this.addBtn2 = this.viewList.get('bottom/proppenal/tool2/addBtn2');
        this.addBtn3 = this.viewList.get('bottom/proppenal/tool3/addBtn3');
        this.addBtn4 = this.viewList.get('bottom/proppenal/tool4/addBtn4');
    }

    addEvents() {
        super.addEvents();
        App.event.on(EventName.Game.TouchStart, this.evtTouchStart, this);
        App.event.on(EventName.Game.TouchMove, this.evtTouchMove, this);
        App.event.on(EventName.Game.TouchEnd, this.evtTouchEnd, this);
        App.event.on(EventName.Game.ContinueGame, this.evtContinueGame, this);
        App.event.on(EventName.Game.Restart, this.evtRestart, this);
    }
    /** 初始化 */
    async loadExtraData(lv: number) {
        App.view.closeView(ViewName.Single.eHomeView);
        Advertise.showInterstitialAds();
        this.level = lv;
        this.data = await LevelConfig.getLevelData(lv);
        App.gameLogic.blockCount = this.data.blockCount;
        this.setLevelInfo();
        if (!this.gridPre) {
            this.gridPre = await ResLoadHelper.loadPieces(ViewName.Pieces.grid);
            this.particlePre = await ResLoadHelper.loadPieces(ViewName.Pieces.particle);
            this.rocketPre = await ResLoadHelper.loadPieces(ViewName.Pieces.rocket);
        }
        await this.initLayout();
    }
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/
    /** 设置关卡信息 */
    setLevelInfo() {
        let data = this.data;
        let idArr = data.mapData[0].m_id;
        let ctArr = data.mapData[0].m_ct;
        this.coutArr = [];
        for (let i = 0; i < idArr.length; i++) {
            let temp = [idArr[i], ctArr[i] + 10];
            if (ctArr[i] < 10) {
                temp = [idArr[i], ctArr[i] + 30];
            }
            this.coutArr.push(temp);
        }
        let steps = this.data.moveCount - 10 > 0 ? this.data.moveCount - 10 : this.data.moveCount;
        this.stepCount = steps;
        this.updateTargetCount();
        this.updateStep();
        this.updateScorePercent();
        this.updateToolsInfo();
    }
    /** 道具信息 */
    updateToolsInfo() {
        let bombCount = GlobalFuncHelper.getBomb(Bomb.bomb);
        let horCount = GlobalFuncHelper.getBomb(Bomb.hor);
        let verCount = GlobalFuncHelper.getBomb(Bomb.ver);
        let allCount = GlobalFuncHelper.getBomb(Bomb.allSame);
        CocosHelper.updateLabelText(this.lbTool1, bombCount);
        CocosHelper.updateLabelText(this.lbTool2, horCount);
        CocosHelper.updateLabelText(this.lbTool3, verCount);
        CocosHelper.updateLabelText(this.lbTool4, allCount);
        this.addBtn1.active = bombCount <= 0;
        this.addBtn2.active = horCount <= 0;
        this.addBtn3.active = verCount <= 0;
        this.addBtn4.active = allCount <= 0;
    }

    /** 更新消除目标数量 */
    updateTargetCount() {
        let arr = this.coutArr;
        this.target1.active = arr.length <= 2;
        this.target2.active = arr.length > 2;
        let target = arr.length <= 2 ? this.target1 : this.target2;
        target.children.forEach((item, idx) => {
            item.active = idx < arr.length;
            if (idx < arr.length) {
                item.getComponent(gridCmpt).setType(arr[idx][0]);
                item.getComponent(gridCmpt).setCount(arr[idx][1]);
            }
        });
        this.checkResult();
    }
    /** 更新星级进度和积分 */
    updateScorePercent() {
        let arr = this.data.scores;
        let percent = this.curScore / arr[arr.length - 1] < 1 ? this.curScore / arr[arr.length - 1] : 1;
        let width = 190 * percent;
        this.spPro.getComponent(UITransform).width = width;
        this.star.children.forEach((item, idx) => {
            let per = arr[idx] / arr[arr.length - 1];
            item.setPosition(v3(per * 180, 0, 1));
            item.getChildByName('s').active = this.curScore >= arr[idx];
            if (this.curScore >= arr[idx]) {
                this.starCount = idx + 1;
            }
        });
    }

    /** 更新步数 */
    updateStep() {
        if (this.stepCount < 0) this.stepCount = 0;
        CocosHelper.updateLabelText(this.lbStep, this.stepCount);
    }
    /** 结束检测 */
    checkResult() {
        if (this.isWin) return;
        let count = 0;
        for (let i = 0; i < this.coutArr.length; i++) {
            if (this.coutArr[i][1] == 0) {
                count++;
            }
        }
        if (count == this.coutArr.length) {
            // win
            this.isWin = true;
            if (this.stepCount > 0) {
                //丢炸弹
                this.handleLastSteps();
            }
            else {
                let view = App.view.getViewByName(ViewName.Single.eResultView);
                if (!view) {
                    App.view.openView(ViewName.Single.eResultView, this.level, true, this.coutArr, this.starCount);
                }
            }
        }
        else if (this.stepCount <= 0 && count != this.coutArr.length) {
            //lose
            App.view.openView(ViewName.Single.eResultView, this.level, false);
        }
    }

    /** 过关，处理剩余步数 */
    async handleLastSteps() {
        let step = this.stepCount;
        for (let i = 0; i < step; i++) {
            await ToolsHelper.delayTime(0.1);
            this.stepCount--;
            this.updateStep();
            this.throwTools();
        }
        await ToolsHelper.delayTime(1);
        this.checkAllBomb();
    }

    /** 检测网格中是否还有炸弹 */
    async checkAllBomb() {
        if (!this.isValid) return;
        let isHaveBomb: boolean = false;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let item = this.blockArr[i][j];
                if (item && this.isBomb(item.getComponent(gridCmpt))) {
                    isHaveBomb = true;
                    this.handleBomb(item.getComponent(gridCmpt), true);
                }
            }
        }
        await ToolsHelper.delayTime(1);
        if (!isHaveBomb) {
            let view = App.view.getViewByName(ViewName.Single.eResultView);
            console.log("没有炸弹了，一切都结束了")
            if (!view) {
                App.view.openView(ViewName.Single.eResultView, this.level, true, this.coutArr, this.starCount);
            }
        }
    }

    throwTools(bombType: number = -1, worldPosition: Vec3 = null) {
        App.audio.play("prop_missle")
        let originPos = worldPosition || this.lbStep.worldPosition;
        let p1 = this.effNode.getComponent(UITransform).convertToNodeSpaceAR(originPos);
        let particle = instantiate(this.particlePre);
        this.effNode.addChild(particle);
        particle.setPosition(p1);
        particle.children.forEach(item => {
            item.active = item.name == "move";
        });
        let item: gridCmpt = this.getRandomBlock();
        if (item) {
            let p2 = this.effNode.getComponent(UITransform).convertToNodeSpaceAR(item.node.worldPosition);
            tween(particle).to(1, { position: p2 }).call(() => {
                particle.destroy();
                let rand = bombType == -1 ? Math.floor(Math.random() * 3) + 8 : bombType;
                item && item.setType(rand);
            }).start();
        }
    }

    getRandomBlock() {
        let h = Math.floor(Math.random() * this.H);
        let v = Math.floor(Math.random() * this.V);
        if (this.blockArr[h][v] && this.blockArr[h][v].getComponent(gridCmpt).type < 7) {
            return this.blockArr[h][v].getComponent(gridCmpt);
        }
        else {
            return this.getRandomBlock();
        }
    }

    evtContinueGame() {
        this.stepCount += 5;
        this.isStartChange = false;
        this.isStartTouch = false;
        this.updateStep();
    }

    /*********************************************  gameLogic *********************************************/
    /*********************************************  gameLogic *********************************************/
    /*********************************************  gameLogic *********************************************/
    /** 触控事件（开始） */
    async evtTouchStart(p: Vec2) {
        console.log(this.isStartTouch, this.isStartChange)
        this.handleProtected();
        if (this.isStartChange) return;
        if (this.isStartTouch) return;
        if (this.stepCount <= 0) {
            App.view.showMsgTips("步数不足");
            App.view.openView(ViewName.Single.eResultView, this.level, false);
            return;
        }
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        this.curTwo = [];
        if (bc) {
            bc.setSelected(true);
            this.curTwo.push(bc);
            console.log(bc.data);
            this.isStartTouch = true;
        }
        // await this.checkMoveDown();
    }
    /** 触控事件（滑动） */
    evtTouchMove(p: Vec2) {
        if (this.isStartChange) return;
        if (!this.isStartTouch) return;
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        if (bc && App.gameLogic.isNeighbor(bc, this.curTwo[0])) {
            bc.setSelected(true);
            this.curTwo.push(bc);
            this.isStartChange = true;
            this.startChangeCurTwoPos();
        }
    }
    /** 触控事件（结束 ） */
    async evtTouchEnd(p: Vec2) {
        if (this.isStartChange) return;
        if (!this.isStartTouch) return;
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        /** 点到炸弹 */
        if (bc && (this.isBomb(bc)) && this.curTwo.length == 1) {
            await this.handleBomb(bc);
        }
        this.isStartTouch = false;
        this.isStartChange = false;
        this.resetSelected();
    }

    private isRecording: boolean = false;
    /** 这里做一层保护措施，以防玩家预料之外的骚操作引起的游戏中断 */
    handleProtected() {
        if ((this.isStartChange || this.isStartTouch) && !this.isRecording) {
            this.isRecording = true;
            this.scheduleOnce(() => {
                if (this.isValid) {
                    this.isRecording = false;
                    this.isStartChange = false;
                    this.isStartTouch = false;
                }
            }, 5)
        }
    }
    /** 是否是炸弹 */
    isBomb(bc: gridCmpt) {
        return bc.type >= 8 && bc.type <= 11
    }

    /** 是否是炸弹 */
    async handleBomb(bc: gridCmpt, isResult: boolean = false) {
        if (this.isBomb(bc)) {
            let bombList = [];
            let list2 = [];
            let list: gridCmpt[] = await this.getBombList(bc);
            bombList.push(list);
            for (let i = 0; i < list.length; i++) {
                if (list[i].h == bc.h && list[i].v == bc.v) continue;
                if (this.isBomb(list[i])) {
                    bombList.push(await this.getBombList(list[i]));
                }
            }
            let func = (pc: gridCmpt) => {
                for (let i = 0; i < list2.length; i++) {
                    if (list2[i].h == pc.h && list2[i].v == pc.v) {
                        return true;
                    }
                }
                return false;
            }
            for (let i = 0; i < bombList.length; i++) {
                for (let j = 0; j < bombList[i].length; j++) {
                    let item = bombList[i][j];
                    if (!func(item)) {
                        list2.push(item);
                    }
                }
            }

            await this.handleSamelistBomb(list2);
            await this.checkAgain(isResult);
            return true;
        }
        return false;
    }

    /** 获取炸弹炸掉的糖果列表 */
    async getBombList(bc: gridCmpt): Promise<gridCmpt[]> {
        let list: gridCmpt[] = [];
        switch (bc.type) {
            case Bomb.hor:
                for (let i = 0; i < this.H; i++) {
                    let item = this.blockArr[i][bc.v];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                App.audio.play("prop_line")
                let rocket1 = instantiate(this.rocketPre);
                this.effNode.addChild(rocket1);
                rocket1.setPosition(bc.node.position);
                rocket1.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.ver:
                for (let i = 0; i < this.V; i++) {
                    let item = this.blockArr[bc.h][i];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                App.audio.play("prop_line")
                let rocket = instantiate(this.rocketPre);
                this.effNode.addChild(rocket);
                rocket.setPosition(bc.node.position);
                rocket.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.bomb:
                for (let i = bc.h - 2; i < bc.h + 2 && i < this.V; i++) {
                    for (let j = bc.v - 2; j < bc.v + 2 && j < this.V; j++) {
                        if (i < 0 || j < 0) continue;
                        let item = this.blockArr[i][j];
                        if (item) {
                            list.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                App.audio.play("prop_bomb")
                break;
            case Bomb.allSame:
                let curType: number = -1;
                for (let i = 0; i < this.curTwo.length; i++) {
                    if (this.curTwo[i].type != bc.type) {
                        curType = this.curTwo[i].type;
                    }
                }
                if (curType < 0) {//炸弹四周随机找一个
                    for (let i = bc.h - 1; i < bc.h + 1 && i < this.V; i++) {
                        for (let j = bc.v - 1; j < bc.v + 1 && j < this.V; j++) {
                            if (i < 0 || j < 0) continue;
                            let item = this.blockArr[i][j];
                            if (item && curType < 0) {
                                curType = item.getComponent(gridCmpt).type;
                                break;
                            }
                        }
                    }
                }
                let node = bc.node.getChildByName('icon').getChildByName('Match11');
                node.getComponent(Sprite).enabled = false;
                node.getChildByName('a').active = true;
                if (curType < 0) curType = Math.floor(Math.random() * App.gameLogic.blockCount);
                App.audio.play("prop_missle")
                for (let i = 0; i < this.H; i++) {
                    for (let j = 0; j < this.V; j++) {
                        let item = this.blockArr[i][j];
                        if (item && item.getComponent(gridCmpt).type == curType) {
                            list.push(item.getComponent(gridCmpt));
                            let particle = instantiate(this.particlePre);
                            this.effNode.addChild(particle);
                            particle.setPosition(bc.node.position);
                            particle.children.forEach(item => {
                                item.active = item.name == "move";
                            });
                            tween(particle).to(0.5, { position: item.position }).call(async (particle) => {
                                await ToolsHelper.delayTime(0.2);
                                particle.destroy();
                            }).start();
                        }
                    }
                }
                list.push(bc);
                await ToolsHelper.delayTime(0.7);
                break;
        }
        return list;
    }

    /** 选中状态还原 */
    resetSelected() {
        if (!this.isValid) {
            return;
        }
        this.curTwo.forEach(item => {
            if (item) {
                item.setSelected(false);
            }
        })
    }

    /** 开始交换连个选中的方块 */
    async startChangeCurTwoPos(isBack: boolean = false) {
        let time = Constant.changeTime;
        let one = this.curTwo[0], two = this.curTwo[1];
        if (!isBack) {
            App.audio.play("ui_banner_down_show")
        }
        else {
            App.audio.play("ui_banner_up_hide")
        }
        if (!one || !two) return;
        tween(one.node).to(time, { position: this.blockPosArr[two.h][two.v] }).start();
        tween(two.node).to(time, { position: this.blockPosArr[one.h][one.v] }).call(async () => {
            if (!isBack) {
                this.changeData(one, two);
                let isbomb1 = await this.handleBomb(one);
                let isbomb2 = await this.handleBomb(two);
                let bool = await this.startCheckThree((bl) => {
                    if (bl) {
                        this.stepCount--;
                        this.updateStep();
                    }
                });
                if (bool || (isbomb1 || isbomb2)) {
                    this.checkAgain()
                }
                else {
                    console.log(this.curTwo);
                    this.startChangeCurTwoPos(true);
                }
            }
            else {
                this.changeData(one, two);
                this.isStartChange = false;
                this.isStartTouch = false;
                this.resetSelected();
            }
        }).start();
    }

    /**
     * 是否已经加入到列表中了
     */
    private checkExist(item: gridCmpt, samelist: any[]) {
        for (let i = 0; i < samelist.length; i++) {
            for (let j = 0; j < samelist[i].length; j++) {
                let ele: gridCmpt = samelist[i][j];
                if (ele.data.h == item.data.h && ele.data.v == item.data.v) {
                    return true;
                }
            }
        }
        return false;
    }
    /** 反复检查 */
    async checkAgain(isResult: boolean = false) {
        let bool = await this.startCheckThree();
        if (bool) {
            this.checkAgain(isResult);
        }
        else {
            this.resetSelected();
            this.isStartChange = false;
            this.isStartTouch = false;
            if (isResult) {
                console.log(isResult);
                this.checkAllBomb();
            }
        }
    }
    /**
     * 开始检测是否有满足消除条件的存在
     * @returns bool
     */
    async startCheckThree(cb: Function = null): Promise<boolean> {
        return new Promise(async resolve => {
            let samelist = [];
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    if (!this.isValid) {
                        resolve(false);
                        return;
                    }
                    let item = this.blockArr[i][j];
                    if (!item || item.getComponent(gridCmpt).getMoveState()) continue;
                    if (this.checkExist(item.getComponent(gridCmpt), samelist)) continue;
                    let hor: gridCmpt[] = this._checkHorizontal(item.getComponent(gridCmpt));
                    let ver: gridCmpt[] = this._checkVertical(item.getComponent(gridCmpt));
                    if (hor.length >= 3 && ver.length >= 3) {
                        hor = hor.slice(1, hor.length);//将自己去掉一个（重复）
                        hor = hor.concat(ver);
                        samelist.push(hor);
                    }
                }
            }
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    let item = this.blockArr[i][j];
                    if (!item || item.getComponent(gridCmpt).getMoveState()) continue;
                    if (this.checkExist(item.getComponent(gridCmpt), samelist)) continue;
                    let hor: gridCmpt[] = this._checkHorizontal(item.getComponent(gridCmpt));
                    let ver: gridCmpt[] = this._checkVertical(item.getComponent(gridCmpt));
                    if (hor.length >= 3) {
                        samelist.push(hor);
                    }
                    else if (ver.length >= 3) {
                        samelist.push(ver);
                    }
                }
            }
            cb && cb(!!samelist.length);
            await this.handleSamelist(samelist);
            let bool = !!samelist.length;
            resolve(bool);
        })
    }

    /**
     * 结果列表，进一步判断每一组元素是否合法
     * @param samelist [Element[]]
     * @returns 
     */
    private async handleSamelist(samelist: any[]) {
        return new Promise(async resolve => {
            if (samelist.length < 1) {
                resolve("");
                return;
            }
            this._deleteDuplicates(samelist);
            //0:去掉不合法的
            samelist = this.jugetLegitimate(samelist);
            let soundList = ['combo_cool', 'combo_excellent', 'combo_good', 'combo_great', 'combo_perfect'];
            let rand = Math.floor(Math.random() * soundList.length);
            //1:移除
            for (let i = 0; i < samelist.length; i++) {
                let item = samelist[i];
                if (item.length < 3) continue;
                if (item.length > 3) {
                    this.synthesisBomb(item);
                    continue;
                }
                if (item.length > 3) {
                    App.audio.play(soundList[rand])
                } else {
                    App.audio.play('combo');
                }
                for (let j = 0; j < item.length; j++) {
                    let ele: gridCmpt = item[j];
                    let particle = instantiate(this.particlePre);
                    this.effNode.addChild(particle);
                    particle.children.forEach(item => {
                        item.active = +item.name == ele.type;
                    })
                    let tp = ele.type;
                    let worldPosition = ele.node.worldPosition
                    this.flyItem(tp, worldPosition);
                    this.addScoreByType(tp);
                    particle.setPosition(this.blockPosArr[ele.h][ele.v]);
                    this.blockArr[ele.h][ele.v] = null;
                    ele.node.destroy();
                }
            }
            await ToolsHelper.delayTime(0.2);
            await this.checkMoveDown();
            resolve("");
        });
    }

    /** 炸弹消除 */
    private async handleSamelistBomb(samelist: any[]) {
        return new Promise(async resolve => {
            if (samelist.length < 1) {
                resolve("");
                return;
            }
            let soundList = ['combo_cool', 'combo_excellent', 'combo_good', 'combo_great', 'combo_perfect'];
            let rand = Math.floor(Math.random() * soundList.length);
            this.scheduleOnce(() => {
                if (this.isValid) {
                    App.audio.play(soundList[rand])
                }
            }, 0.2);
            // 移除
            for (let i = 0; i < samelist.length; i++) {
                let ele: gridCmpt = samelist[i];
                if (!ele) continue;
                let particle = instantiate(this.particlePre);
                this.effNode.addChild(particle);
                particle.children.forEach(item => {
                    item.active = +item.name == ele.type;
                })
                let tp = ele.type;
                if (!ele || !ele.node) continue;
                let worldPosition = ele.node.worldPosition
                this.flyItem(tp, worldPosition);
                this.addScoreByType(tp);
                particle.setPosition(this.blockPosArr[ele.h][ele.v]);
                this.blockArr[ele.h][ele.v] = null;
                if (ele.node)
                    ele.node.destroy();
            }

            await ToolsHelper.delayTime(0.2);
            await this.checkMoveDown();
            resolve("");
        });
    }
    /** 合成炸弹 */
    synthesisBomb(item: gridCmpt[]) {
        /** 先找当前item中是否包含curTwo,包含就以curTwo为中心合成 */
        let center: gridCmpt = null;
        for (let j = 0; j < item.length; j++) {
            for (let m = 0; m < this.curTwo.length; m++) {
                if (item[j].h == this.curTwo[m].h && item[j].v == this.curTwo[m].v) {
                    center = item[j];
                    break;
                }
            }
        }
        if (!center) {
            center = item[Math.floor(item.length / 2)];
        }
        let bombType = App.gameLogic.getBombType(item);
        App.audio.play("ui_banner_up_hide");
        for (let j = 0; j < item.length; j++) {
            let ele: gridCmpt = item[j];
            let tp = ele.type;
            let worldPosition = ele.node.worldPosition
            // this.flyItem(tp, worldPosition);
            this.addScoreByType(tp);
            tween(ele.node).to(0.1, { position: this.blockPosArr[center.h][center.v] }).call((target) => {
                let gt = target.getComponent(gridCmpt);
                console.log(gt.h, gt.v)
                if (gt.h == center.h && gt.v == center.v) {
                    gt.setType(bombType);
                }
                else {
                    this.blockArr[gt.h][gt.v] = null;
                    gt.node.destroy();
                }
            }).start();

        }
    }
    /**
     * 去掉不合法的
     * @param samelist  [Element[]]
     */
    private jugetLegitimate(samelist: any[]) {
        let arr: any[] = [];
        for (let i = 0; i < samelist.length; i++) {
            let itemlist = samelist[i];
            let bool: boolean = this.startJuge(itemlist);
            if (bool) {
                arr.push(itemlist);
            }
        }
        return arr;
    }

    private startJuge(list: gridCmpt[]): boolean {
        let bool = false;
        let len = list.length;
        switch (len) {
            case 3:
                bool = this._atTheSameHorOrVer(list);
                break;

            case 4:
                bool = this._atTheSameHorOrVer(list);
                break;

            case 5:
                bool = this._atTheSameHorOrVer(list);
                if (!bool) {
                    bool = this._atLeastThreeSameHorAndVer(list);
                }
                break;

            case 6:
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

            case 7:
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

            default://全在行或者列
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

        }
        return bool;
    }

    /**
     * 至少有三个同行且三个同列
     * @param list 
     * @returns 
     */
    private _atLeastThreeSameHorAndVer(list: gridCmpt[]): boolean {
        let bool = false;
        let count = 0;
        //同一列
        for (let i = 0; i < list.length; i++) {
            let item1 = list[i];
            for (let j = 0; j < list.length; j++) {
                let item2 = list[j];
                if (item1.data.h == item2.data.h) {
                    count++;
                    break;
                }
            }
        }
        if (count < 3) return bool;
        count = 0;
        //同一行
        for (let i = 0; i < list.length; i++) {
            let item1 = list[i];
            for (let j = 0; j < list.length; j++) {
                let item2 = list[j];
                if (item1.data.v == item2.data.v) {
                    count++;
                    break;
                }
            }
        }
        if (count < 3) return bool;
        return true;
    }

    /**
     * 处在同一行/或者同一列
     * @param list 
     * @returns 
     */
    private _atTheSameHorOrVer(list: gridCmpt[]): boolean {
        let item = list[0];
        let bool = true;
        //同一列
        for (let i = 0; i < list.length; i++) {
            if (item.data.h != list[i].data.h) {
                bool = false;
                break;
            }
        }
        if (bool) return bool;
        bool = true;
        //同一行
        for (let i = 0; i < list.length; i++) {
            if (item.data.v != list[i].data.v) {
                bool = false;
                break;
            }
        }
        return bool;
    }
    /**
     * 去重复
     */
    private _deleteDuplicates(samelist: any[]) {
        for (let i = 0; i < samelist.length; i++) {
            let itemlist = samelist[i];
            let bool = true;
            do {
                let count = 0;
                for (let m = 0; m < itemlist.length - 1; m++) {
                    for (let n = m + 1; n < itemlist.length; n++) {
                        if (itemlist[m].data.h == itemlist[n].data.h && itemlist[m].data.v == itemlist[n].data.v) {
                            samelist[i].splice(i, 1);
                            count++;
                            console.log('------------repeat----------');
                            break;
                        }
                    }
                }
                bool = count > 0 ? true : false;
            } while (bool);
        }
    }
    /**
     * 以当前滑块为中心沿水平方向检查
     * @param {gridCmpt} item 
     */
    private _checkHorizontal(item: gridCmpt): gridCmpt[] {
        let arr: gridCmpt[] = [item];
        let startX = item.data.h;
        let startY = item.data.v;
        // 右边
        for (let i = startX + 1; i < this.H; i++) {
            if (!this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        // 左边
        for (let i = startX - 1; i >= 0; i--) {
            if (i < 0) break;
            if (!this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        if (arr.length < 3) return [];
        return arr;
    }

    /**
     * 以当前滑块为中心沿竖直方向检查
     * @param {gridCmpt} item 
     */
    private _checkVertical(item: gridCmpt): gridCmpt[] {
        let arr: gridCmpt[] = [item];
        let startX = item.data.h;
        let startY = item.data.v;
        // 上边
        for (let i = startY + 1; i < this.V; i++) {
            if (!this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        // 下边
        for (let i = startY - 1; i >= 0; i--) {
            if (i < 0) break;
            if (!this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        if (arr.length < 3) return [];
        return arr;
    }

    /** 数据交换，网格位置交换 */
    changeData(item1: gridCmpt, item2: gridCmpt) {
        /** 数据交换 */
        let temp = item1.data;
        item1.data = item2.data;
        item2.data = temp;

        /** 位置交换 */
        let x1 = item1.data.h;
        let y1 = item1.data.v;
        let x2 = item2.data.h;
        let y2 = item2.data.v;
        let pTemp = this.blockArr[x1][y1];
        this.blockArr[x1][y1] = this.blockArr[x2][y2]
        this.blockArr[x2][y2] = pTemp;
        this.blockArr[x1][y1].getComponent(gridCmpt).initData(this.blockArr[x1][y1].getComponent(gridCmpt).data.h, this.blockArr[x1][y1].getComponent(gridCmpt).data.v);
        this.blockArr[x2][y2].getComponent(gridCmpt).initData(this.blockArr[x2][y2].getComponent(gridCmpt).data.h, this.blockArr[x2][y2].getComponent(gridCmpt).data.v);
    }

    /** 是否点击在方块上 */
    checkClickOnBlock(pos: Vec3): gridCmpt {
        if (!this.isValid) return;
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    if (block.getComponent(gridCmpt).isInside(pos)) {
                        return block.getComponent(gridCmpt);
                    }
                }
            }
        }
        return null;
    }

    /** 消除后向下滑动 */
    async checkMoveDown() {
        return new Promise(async resolve => {
            for (let i = 0; i < this.H; i++) {
                let count = 0;
                for (let j = 0; j < this.V; j++) {
                    if (!this.isValid) return;
                    let block = this.blockArr[i][j];
                    let isHide = App.gameLogic.checkInHideList(i, j);
                    if (!block) {
                        if (!isHide) {
                            count++;
                        } else {
                            //当前格子以下是不是全是边界空的，是边界空的就忽略，否则就+1
                            let bool = App.gameLogic.checkAllInHideList(i, j);
                            if (!bool && count > 0) {
                                count++;
                            }
                        }
                    }
                    else if (block && count > 0) {
                        let count1 = await this.getDownLastCount(i, j, count);
                        this.blockArr[i][j] = null;
                        this.blockArr[i][j - count1] = block;
                        block.getComponent(gridCmpt).initData(i, j - count1);
                        tween(block).to(0.5, { position: this.blockPosArr[i][j - count1] }, { easing: 'backOut' }).call(resolve).start();
                    }
                }
            }
            // await ToolsHelper.delayTime(0.2);
            await this.checkReplenishBlock();
            resolve("");
        });
    }

    /** 获取最终下落的格子数 */
    async getDownLastCount(i, j, count): Promise<number> {
        return new Promise(resolve => {
            let tempCount = 0;
            let func = (i, j, count) => {
                tempCount = count;
                let bool = App.gameLogic.checkInHideList(i, j - count);
                if (bool || this.blockArr[i][j - count]) {
                    func(i, j, count - 1);
                }
            }
            func(i, j, count);
            resolve(tempCount);
        })
    }

    /** 补充新方块填补空缺 */
    async checkReplenishBlock() {
        return new Promise(async resolve => {
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    let block = this.blockArr[i][j];
                    let isHide = App.gameLogic.checkInHideList(i, j);
                    if (!block && !isHide) {
                        let pos = this.blockPosArr[i][this.V - 1]
                        let block = this.addBlock(i, j, v3(pos.x, pos.y + Constant.Width + 20, 1));
                        this.blockArr[i][j] = block;
                        tween(block).to(0.5, { position: this.blockPosArr[i][j] }, { easing: 'backOut' }).call(resolve).start();
                    }
                }
            }
            await ToolsHelper.delayTime(0.5);
            resolve("");
        });
    }

    async initLayout() {
        this.clearData();
        await this.gridMgr.initGrid();
        this.hideList = App.gameLogic.hideList;
        let gap = 0;
        let width = Constant.Width;
        let count = 0;
        for (let i = 0; i < this.H; i++) {
            this.blockArr.push([]);
            this.blockPosArr.push([]);
            for (let j = 0; j < this.V; j++) {
                if (App.gameLogic.hideFullList.length < this.H * this.V) {
                    App.gameLogic.hideFullList.push([i, j]);
                }
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                if (App.gameLogic.checkInHideList(i, j)) {
                    this.blockArr[i][j] = null;
                    continue;
                }
                count++;
                let block = this.addBlock(i, j, pos);
                block.setScale(v3(0, 0, 0));
                tween(block).to(count / 100, { scale: v3(1, 1, 1) }).start();
                this.blockArr[i][j] = block;
            }
        }
        await ToolsHelper.delayTime(0.8);
        // this.checkAgain();
        /** 进入游戏选择的道具炸弹 */
        let list = App.gameLogic.toolsArr;
        for (let i = 0; i < list.length; i++) {
            this.throwTools(list[i]);
        }
        App.gameLogic.toolsArr = [];
    }

    addBlock(i: number, j: number, pos: Vec3 = null) {
        let block = instantiate(this.gridPre);
        this.gridNode.addChild(block);
        block.getComponent(gridCmpt).initData(i, j);
        if (pos) {
            block.setPosition(pos);
        }
        return block;
    }

    clearData() {
        App.gameLogic.resetHdeList(this.level);
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    block.destroy();
                }
            }
        }
        this.blockArr = [];
        this.blockPosArr = [];
        this.isStartChange = false;
        this.isStartTouch = false;
        this.curScore = 0;
        this.isWin = false;
    }
    /** 加积分 */
    addScoreByType(type: number) {
        if (type > this.data.blockRatio.length - 1) {
            type = this.data.blockRatio.length - 1;
        }
        let score = this.data.blockRatio[type];
        this.curScore += score;
        this.updateScorePercent();
    }
    /** 飞舞动画 */
    async flyItem(type: number, pos: Vec3) {
        let idx = this.data.mapData[0].m_id.indexOf(type);
        if (idx < 0) return;
        let item = instantiate(this.gridPre);
        let tempPos = new Vec3();
        let targetPos = new Vec3();
        /** 空间坐标转节点坐标 */
        this.node.getComponent(UITransform).convertToNodeSpaceAR(pos, tempPos)
        this.node.getComponent(UITransform).convertToNodeSpaceAR(this.targetBg.worldPosition, targetPos)
        item.setPosition(tempPos);
        this.node.addChild(item);
        item.getComponent(gridCmpt).setType(type);

        let time = 0.5 + Math.random() * 1;
        item.setScale(0.5, 0.5, 0.5);
        tween(item).to(time, { position: targetPos }, { easing: 'backIn' }).call(() => {
            this.handleLevelTarget(type);
            item.destroy();
            // App.audio.play('Full');
        }).start();
    }

    handleLevelTarget(type: number) {
        for (let i = 0; i < this.coutArr.length; i++) {
            if (type == this.coutArr[i][0]) {
                this.coutArr[i][1]--
                if (this.coutArr[i][1] < 0) {
                    this.coutArr[i][1] = 0;
                }
            }
        }
        this.updateTargetCount();
    }

    /*********************************************  btn *********************************************/
    /*********************************************  btn *********************************************/
    /*********************************************  btn *********************************************/
    evtRestart() {
        this.loadExtraData(this.level);
    }
    onClick_testBtn() {
        this.loadExtraData(this.level);
        // this.handleLastSteps();
    }

    /** 设置 */
    onClick_setBtn() {
        App.view.openView(ViewName.Single.esettingGameView);
    }

    /** 购买金币 */
    onClick_buyBtn() {
        App.audio.play('button_click');
        App.view.openView(ViewName.Single.eBuyView);
    }

    /** 暂停 */
    async onClick_pauseBtn() {
        App.audio.play('button_click');
        App.view.openView(ViewName.Single.esettingGameView);
    }

    /** 添加道具，广告位 */
    onClickAddButton(btnNode: Node) {
        App.audio.play('button_click');
        let type: number = -1;
        switch (btnNode.name) {
            case "addBtn1":
                type = Bomb.bomb;
                break;
            case "addBtn2":
                type = Bomb.hor;
                break;
            case "addBtn3":
                type = Bomb.ver;
                break;
            case "addBtn4":
                type = Bomb.allSame;
                break;
        }
        App.backHome(false, PageIndex.shop);
        // GlobalFuncHelper.setBomb(type,1);
    }
    private isUsingBomb: boolean = false;
    /** 道具 */
    onClickToolButton(btnNode: Node) {
        App.audio.play('button_click');
        if (this.isUsingBomb) return;
        this.isUsingBomb = true;
        this.scheduleOnce(() => {
            this.isUsingBomb = false;
            this.isStartChange = false;
            this.isStartTouch = false;
        }, 1);
        let type: number = -1;
        switch (btnNode.name) {
            case "toolBtn1":
                type = Bomb.bomb;
                break;
            case "toolBtn2":
                type = Bomb.hor;
                break;
            case "toolBtn3":
                type = Bomb.ver;
                break;
            case "toolBtn4":
                type = Bomb.allSame;
                break;
        }
        let bombCount = GlobalFuncHelper.getBomb(type);
        if (bombCount <= 0) {
            App.view.showMsgTips("道具数量不足");
            return;
        }
        GlobalFuncHelper.setBomb(type, -1);
        let pos = btnNode.worldPosition;
        this.throwTools(type, pos);
        this.updateToolsInfo();
    }
}