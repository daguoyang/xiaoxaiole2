import { _decorator, Node, v3, UITransform, instantiate, Vec3, tween, Prefab, Vec2, Sprite, UIOpacity } from 'cc';
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
import { adManager } from '../../ads/AdManager';
import { gridManagerCmpt } from './gridManagerCmpt';
import { gridCmpt } from './item/gridCmpt';
import { rocketCmpt } from './item/rocketCmpt';
// 新的匹配引擎系统
import { MatchEngine } from '../logic/matchEngine';
import { EliminationProcessor } from '../logic/eliminationProcessor';
import { GameStateManager, GameState } from '../logic/gameStateManager';
import { ChainReactionHandler } from '../logic/chainReactionHandler';
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
    private userHead: Node = null;
    private lbHeart: Node = null;
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
    /** 提示系统相关 */
    private hintTimer: number = 0;
    private hintInterval: number = 30; // 30秒无操作提示
    private isShowingHint: boolean = false;
    private hintPair: gridCmpt[] = [];
    private flyingItemPromises: Promise<void>[] = [];
    /** 防止无限递归 */
    private checkAgainCount: number = 0;
    /** 新的匹配引擎系统 */
    private matchEngine: MatchEngine = null;
    private eliminationProcessor: EliminationProcessor = null;
    private gameStateManager: GameStateManager = null;
    private chainReactionHandler: ChainReactionHandler = null;
    onLoad() {
        // 移除动态绑定，改为直接定义onClick方法
        // 确保关键数组被正确初始化
        this.curTwo = [];
        this.hintPair = [];
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
        this.userHead = this.viewList.get('top/head6');
        // 尝试获取体力显示节点（可能的路径）
        const heartPaths = [
            'top/life/lbLife', 'top/heart/lbHeart', 'top/lbHeart', 'top/lbLife',
            'top/content/life/lbLife', 'top/content/heart/lbHeart', 
            'top/content/lbLife', 'top/content/lbHeart',
            'top/head6/lbLife', 'top/head6/lbHeart'
        ];
        
        for (let path of heartPaths) {
            this.lbHeart = this.viewList.get(path);
            if (this.lbHeart) {
                console.log(`游戏页面找到体力节点，路径: ${path}`);
                break;
            }
        }
        
        if (!this.lbHeart) {
            console.log('游戏页面未找到体力显示节点，可能需要检查UI结构');
        }
        
        // 立即初始化用户头像，避免显示默认头像再切换的闪烁
        if (this.userHead) {
            CocosHelper.updateUserHeadSpriteAsync(this.userHead, App.user.rankData.icon);
        }
        
        // 初始化体力显示
        this.updateHeartDisplay();
    }

    addEvents() {
        super.addEvents();
        App.event.on(EventName.Game.TouchStart, this.evtTouchStart, this);
        App.event.on(EventName.Game.TouchMove, this.evtTouchMove, this);
        App.event.on(EventName.Game.TouchEnd, this.evtTouchEnd, this);
        App.event.on(EventName.Game.ContinueGame, this.evtContinueGame, this);
        App.event.on(EventName.Game.Restart, this.evtRestart, this);
        App.event.on(EventName.Game.AddSteps, this.evtAddSteps, this);
        App.event.on(EventName.Game.ToolCountRefresh, this.updateToolsInfo, this);
        App.event.on(EventName.Game.UpdateUserIcon, this.updateUserIcon, this);
        App.event.on(EventName.Game.HeartUpdate, this.updateHeartDisplay, this);
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
        
        // 初始化新的匹配引擎系统
        await this.initNewMatchSystem();
        
        this.startHintTimer();
        
        // 确保体力显示是最新的
        this.updateHeartDisplay();
    }
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/
    /** 设置关卡信息 */
    setLevelInfo() {
        let data = this.data;
        let idArr = data.mapData[0].m_id;
        let ctArr = data.mapData[0].m_ct;

        // 先计算映射后的显示类型和叠加数量
        let displayTargets = new Map<number, {originalIds: number[], totalCount: number}>();
        
        for (let i = 0; i < idArr.length; i++) {
            let targetId = idArr[i];
            let targetCount = ctArr[i];
            
            // 计算显示类型
            let displayType = targetId;
            if (targetId >= 200) {
                displayType = (targetId - 200) % App.gameLogic.blockCount;
            } else if (targetId >= App.gameLogic.blockCount) {
                displayType = targetId % App.gameLogic.blockCount;
            }
            
            // 计算目标数量
            let finalCount = targetCount + 10;
            if (targetCount < 10) {
                finalCount = targetCount + 30;
            }
            
            // 叠加相同显示类型的数量
            if (displayTargets.has(displayType)) {
                let existing = displayTargets.get(displayType);
                existing.originalIds.push(targetId);
                existing.totalCount += finalCount;
            } else {
                displayTargets.set(displayType, {
                    originalIds: [targetId],
                    totalCount: finalCount
                });
            }
        }

        // 生成去重后的目标数组
        this.coutArr = [];
        displayTargets.forEach((targetInfo, displayType) => {
            this.coutArr.push([displayType, targetInfo.totalCount]);
            console.log(`游戏目标: 显示类型${displayType}, 原始IDs[${targetInfo.originalIds.join(',')}], 总数量${targetInfo.totalCount}`);
        });

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
        // 不在这里立即检查结果，等待动画完成后再检查
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

    /** 更新用户头像 */
    updateUserIcon(icon: number) {
        App.user.rankData.icon = icon;
        if (this.userHead) {
            CocosHelper.updateUserHeadSpriteAsync(this.userHead, icon);
        }
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
                    // 关卡胜利时显示插屏广告
                    Advertise.showInterstitialAds();
                    App.view.openView(ViewName.Single.eResultView, this.level, true, this.coutArr, this.starCount);
                }
            }
        }
        else if (this.stepCount <= 0 && count != this.coutArr.length) {
            // 检查是否还有飞行动画在进行中，如果有则延迟判定失败
            if (this.flyingItemPromises.length > 0) {
                console.log('等待飞行动画完成后再判定结果...');
                // 等待所有飞行动画完成后再次检查结果
                Promise.all(this.flyingItemPromises).then(() => {
                    this.flyingItemPromises = [];
                    // 延迟一小段时间确保目标计数更新完成
                    this.scheduleOnce(() => {
                        this.checkResult();
                    }, 0.1);
                });
                return;
            }
            
            //lose
            // 游戏失败时显示插屏广告
            Advertise.showInterstitialAds();
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
        
        // 目标完成后，引爆所有剩余的特效元素
        await this.checkAllBomb();
    }
    
    /** 计算场上剩余元素的最终分数 */
    async calculateFinalScore() {
        let bonusScore = 0;
        
        // 统计场上所有普通元素（非炸弹）的分数
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let item = this.blockArr[i][j];
                if (item) {
                    let gc = item.getComponent(gridCmpt);
                    // 只统计普通元素的分数，不引爆炸弹
                    if (gc && gc.type < 8) { // 普通元素类型 < 8
                        let score = this.data.blockRatio[gc.type] || 10;
                        bonusScore += score;
                    } else if (gc && gc.type >= 8) {
                        // 炸弹给予固定的高分奖励，但不引爆
                        bonusScore += 100;
                    }
                }
            }
        }
        
        // 剩余步数奖励
        let stepBonus = this.stepCount * 50; // 每剩余步数50分
        bonusScore += stepBonus;
        
        this.curScore += bonusScore;
        this.updateScorePercent();
        
        console.log(`最终奖励分数: ${bonusScore} (步数奖励: ${stepBonus})`);
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
        
        // 炸弹引爆后计算最终分数
        await this.calculateFinalScore();
        
        let view = App.view.getViewByName(ViewName.Single.eResultView);
        console.log("炸弹处理完毕，游戏结束，最终分数:", this.curScore);
        if (!view) {
            // 关卡胜利时显示插屏广告
            Advertise.showInterstitialAds();
            App.view.openView(ViewName.Single.eResultView, this.level, true, this.coutArr, this.starCount);
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
        this.resetHintTimer();
    }

    /** 通过观看广告增加步数 */
    evtAddSteps(steps: number) {
        this.stepCount += steps;
        this.isStartChange = false;
        this.isStartTouch = false;
        this.updateStep();
        this.resetHintTimer();
        // 显示步数增加提示
        App.view.showMsgTips(`获得 ${steps} 步！`);
    }

    /*********************************************  gameLogic *********************************************/
    /*********************************************  gameLogic *********************************************/
    /*********************************************  gameLogic *********************************************/
    /** 触控事件（开始） */
    async evtTouchStart(p: Vec2) {
        console.log('TouchStart - Level:', this.level, 'isStartTouch:', this.isStartTouch, 'isStartChange:', this.isStartChange, 'isRecording:', this.isRecording, 'isWin:', this.isWin, 'stepCount:', this.stepCount);
        this.resetHintTimer();
        this.handleProtected();
        if (this.isStartChange) {
            console.log('TouchStart blocked by isStartChange');
            return;
        }
        if (this.isStartTouch) {
            console.log('TouchStart blocked by isStartTouch');
            return;
        }
        // 如果目标已完成，忽略玩家操作
        if (this.isWin) {
            console.log('TouchStart blocked - target completed, ignoring player input');
            return;
        }
        if (this.stepCount <= 0) {
            App.view.showMsgTips("步数不足");
            App.view.openView(ViewName.Single.eResultView, this.level, false);
            return;
        }
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        // 确保curTwo总是数组
        if (!this.curTwo || !Array.isArray(this.curTwo)) {
            this.curTwo = [];
        } else {
            this.curTwo = [];
        }
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
        // 如果目标已完成，忽略玩家操作
        if (this.isWin) return;
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        if (bc && this.curTwo && this.curTwo.length > 0 && App.gameLogic.isNeighbor(bc, this.curTwo[0])) {
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
        // 如果目标已完成，忽略玩家操作
        if (this.isWin) return;
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        /** 点到炸弹 */
        if (bc && (this.isBomb(bc)) && this.curTwo && this.curTwo.length == 1) {
            // 点击特效元素也需要扣除步数
            this.stepCount--;
            this.updateStep();
            // 等待炸弹处理完成，这里面会调用checkAgain来检查结果
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
        console.log(`handleBomb called - type: ${bc.type}, isResult: ${isResult}, position: [${bc.h}, ${bc.v}]`);
        console.trace('handleBomb call stack');
        if (this.isBomb(bc)) {
            let bombList = [];
            let list2 = [];
            let list: gridCmpt[] = await this.getBombList(bc);
            bombList.push(list);
            for (let i = 0; i < list.length; i++) {
                if (list[i] && list[i].h == bc.h && list[i].v == bc.v) continue;
                if (list[i] && this.isBomb(list[i])) {
                    try {
                        let subBombList = await this.getBombList(list[i]);
                        if (subBombList) {
                            bombList.push(subBombList);
                        }
                    } catch (error) {
                        console.error('Error in recursive getBombList call:', error);
                    }
                }
            }
            // 使用Set进行更高效的去重，防止同一位置元素被多次处理
            let uniqueElements = new Map<string, gridCmpt>();
            
            for (let i = 0; i < bombList.length; i++) {
                for (let j = 0; j < bombList[i].length; j++) {
                    let item = bombList[i][j];
                    if (item) {
                        let posKey = `${item.h}-${item.v}`;
                        if (!uniqueElements.has(posKey)) {
                            uniqueElements.set(posKey, item);
                        }
                    }
                }
            }
            
            // 转换为数组
            list2 = Array.from(uniqueElements.values());
            console.log(`handleBomb: 去重后要处理的元素数量: ${list2.length}`);

            // 判断是否是直接特效交换：只有当curTwo存在且包含相同特效时才跳过波及处理
            let isDirectExchange = this.curTwo && this.curTwo.length > 0 && 
                                  this.curTwo.some(bombItem => bombItem && bombItem.h === bc.h && bombItem.v === bc.v);
            
            await this.handleSamelistBomb(list2, 0, isDirectExchange);
            await this.checkAgain(isResult);
            return true;
        }
        return false;
    }

    /** 检测特效元素交换类型 */
    getBombExchangeType(): { type: 'double-allSame' | 'allSame-line' | 'double-line' | 'none', fourLineBombType: number } {
        if (!this.curTwo || !Array.isArray(this.curTwo) || this.curTwo.length !== 2) {
            return { type: 'none', fourLineBombType: -1 };
        }
        
        let allSameCount = 0;
        let fourLineBombTypes = [];
        
        for (let i = 0; i < this.curTwo.length; i++) {
            if (this.curTwo[i] && typeof this.curTwo[i].type === 'number') {
                if (this.curTwo[i].type === Bomb.allSame) {
                    allSameCount++;
                } else if (this.curTwo[i].type === Bomb.hor || this.curTwo[i].type === Bomb.ver || this.curTwo[i].type === Bomb.bomb) {
                    // 拐弯五消(Bomb.bomb)也按四消特效处理
                    fourLineBombTypes.push(this.curTwo[i].type);
                }
            }
        }
        
        if (allSameCount === 2) {
            // 五消 + 五消：全屏消除
            return { type: 'double-allSame', fourLineBombType: -1 };
        } else if (allSameCount === 1 && fourLineBombTypes.length === 1) {
            // 五消 + 四消：选择目标转换
            return { type: 'allSame-line', fourLineBombType: fourLineBombTypes[0] };
        } else if (fourLineBombTypes.length === 2) {
            // 四消 + 四消：特效叠加
            return { type: 'double-line', fourLineBombType: fourLineBombTypes[0] }; // 选择第一个作为主效果
        }
        
        return { type: 'none', fourLineBombType: -1 };
    }

    /** 获取炸弹炸掉的糖果列表 */
    async getBombList(bc: gridCmpt): Promise<gridCmpt[]> {
        let list: gridCmpt[] = [];
        
        // 安全检查：确保bc存在且有效
        if (!bc) {
            console.error('getBombList: bc 参数为 null 或 undefined');
            return list;
        }
        
        // 注意：不检查bc.node是否有效，因为在特效炸弹被炸时，
        // 元素可能已经被销毁，但我们仍需要根据其类型和位置信息获取爆炸范围
        
        switch (bc.type) {
            case Bomb.hor:
                // 横向四消炸弹本身也要被消除（已经包含在行清除中，但为了清晰起见还是明确添加）
                for (let i = 0; i < this.H; i++) {
                    let item = this.blockArr[i][bc.v];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                App.audio.play("prop_line")
                let rocket1 = instantiate(this.rocketPre);
                this.effNode.addChild(rocket1);
                if (bc.node && bc.node.isValid) {
                    rocket1.setPosition(bc.node.position);
                } else {
                    rocket1.setPosition(this.blockPosArr[bc.h][bc.v]);
                }
                rocket1.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.ver:
                // 纵向四消炸弹本身也要被消除（已经包含在列清除中，但为了清晰起见还是明确添加）
                for (let i = 0; i < this.V; i++) {
                    let item = this.blockArr[bc.h][i];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                App.audio.play("prop_line")
                let rocket = instantiate(this.rocketPre);
                this.effNode.addChild(rocket);
                if (bc.node && bc.node.isValid) {
                    rocket.setPosition(bc.node.position);
                } else {
                    rocket.setPosition(this.blockPosArr[bc.h][bc.v]);
                }
                rocket.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.bomb:
                // 首先将炸弹本身加入消除列表
                list.push(bc);
                
                // 然后添加爆炸范围内的其他元素（排除自身避免重复）
                for (let i = bc.h - 2; i < bc.h + 2 && i < this.V; i++) {
                    for (let j = bc.v - 2; j < bc.v + 2 && j < this.V; j++) {
                        if (i < 0 || j < 0) continue;
                        // 排除炸弹自身的位置，避免重复添加
                        if (i === bc.h && j === bc.v) continue;
                        let item = this.blockArr[i][j];
                        if (item) {
                            list.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                App.audio.play("prop_bomb")
                break;
            case Bomb.allSame:
                // 检测特效交换类型
                let exchangeInfo = this.getBombExchangeType();
                
                if (exchangeInfo.type === 'double-allSame') {
                    // 双五消交换：清除全屏所有元素
                    console.log('检测到双五消交换，执行全屏清除');
                    
                    // 安全检查节点是否存在
                    if (bc.node && bc.node.isValid) {
                        let iconNode = bc.node.getChildByName('icon');
                        if (iconNode) {
                            let match11Node = iconNode.getChildByName('Match11');
                            if (match11Node) {
                                let spriteComp = match11Node.getComponent(Sprite);
                                if (spriteComp) {
                                    spriteComp.enabled = false;
                                }
                                let aNode = match11Node.getChildByName('a');
                                if (aNode) {
                                    aNode.active = true;
                                }
                            }
                        }
                    }
                    
                    App.audio.play("prop_missle");
                    
                    // 清除全屏所有元素
                    for (let i = 0; i < this.H; i++) {
                        for (let j = 0; j < this.V; j++) {
                            let item = this.blockArr[i][j];
                            if (item) {
                                let gridComponent = item.getComponent(gridCmpt);
                                list.push(gridComponent);
                                
                                // 添加华丽的清屏特效
                                let particle = instantiate(this.particlePre);
                                this.effNode.addChild(particle);
                                
                                // 安全获取粒子起始位置
                                let startPos = v3(0, 0, 0);
                                if (bc.node && bc.node.isValid) {
                                    startPos = bc.node.position;
                                } else if (bc.h >= 0 && bc.v >= 0 && bc.h < this.H && bc.v < this.V) {
                                    startPos = this.blockPosArr[bc.h][bc.v];
                                } else {
                                    // 如果bc位置无效，使用屏幕中心作为起始位置
                                    startPos = v3(0, 0, 0);
                                }
                                particle.setPosition(startPos);
                                particle.children.forEach(item => {
                                    item.active = item.name == "move";
                                });
                                
                                // 延迟飞向目标，创造波纹效果
                                let distance = Math.abs(i - bc.h) + Math.abs(j - bc.v);
                                let delay = distance * 0.05;
                                tween(particle).delay(delay).to(0.3, { position: item.position }).call(async (particle) => {
                                    await ToolsHelper.delayTime(0.1);
                                    if (particle && particle.isValid) {
                                        particle.destroy();
                                    }
                                }).start();
                            }
                        }
                    }
                    
                    console.log(`双五消清除：清除了全屏 ${list.length} 个元素`);
                    // 减少双五消的等待时间，提高流畅度
                    await ToolsHelper.delayTime(0.8); // 等待所有动画完成
                    
                } else if (exchangeInfo.type === 'double-line') {
                    // 四消 + 四消交换：特效叠加，一起触发
                    console.log('检测到四消+四消交换，执行特效叠加');
                    
                    // 获取两个四消特效的爆炸范围并合并
                    let allEffects = new Set<gridCmpt>();
                    
                    for (let bomb of this.curTwo) {
                        if (bomb && (bomb.type === Bomb.hor || bomb.type === Bomb.ver || bomb.type === Bomb.bomb)) {
                            // 根据炸弹类型获取影响范围
                            if (bomb.type === Bomb.hor) {
                                // 横向四消：清除整行
                                for (let i = 0; i < this.H; i++) {
                                    let item = this.blockArr[i][bomb.v];
                                    if (item) {
                                        allEffects.add(item.getComponent(gridCmpt));
                                    }
                                }
                            } else if (bomb.type === Bomb.ver) {
                                // 纵向四消：清除整列
                                for (let i = 0; i < this.V; i++) {
                                    let item = this.blockArr[bomb.h][i];
                                    if (item) {
                                        allEffects.add(item.getComponent(gridCmpt));
                                    }
                                }
                            } else if (bomb.type === Bomb.bomb) {
                                // 拐弯五消：清除5x5区域
                                for (let i = bomb.h - 2; i <= bomb.h + 2 && i < this.H; i++) {
                                    for (let j = bomb.v - 2; j <= bomb.v + 2 && j < this.V; j++) {
                                        if (i < 0 || j < 0) continue;
                                        let item = this.blockArr[i][j];
                                        if (item) {
                                            allEffects.add(item.getComponent(gridCmpt));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // 转换Set为数组
                    list = Array.from(allEffects);
                    
                    // 播放特效音效（根据特效类型选择合适的音效）
                    let hasBomb = this.curTwo.some(bomb => bomb && bomb.type === Bomb.bomb);
                    if (hasBomb) {
                        App.audio.play("prop_bomb"); // 如果有拐弯五消，播放炸弹音效
                    } else {
                        App.audio.play("prop_line"); // 否则播放线性音效
                    }
                    
                    // 为两个特效都创建对应的效果
                    for (let bomb of this.curTwo) {
                        if (bomb && (bomb.type === Bomb.hor || bomb.type === Bomb.ver)) {
                            // 线性特效：创建火箭
                            let rocket = instantiate(this.rocketPre);
                            this.effNode.addChild(rocket);
                            if (bomb.node && bomb.node.isValid) {
                                rocket.setPosition(bomb.node.position);
                            } else {
                                rocket.setPosition(this.blockPosArr[bomb.h][bomb.v]);
                            }
                            rocket.getComponent(rocketCmpt).initData(bomb.type);
                        } else if (bomb && bomb.type === Bomb.bomb) {
                            // 拐弯五消：不需要创建火箭，已有爆炸效果
                            console.log('拐弯五消特效叠加，使用范围爆炸效果');
                        }
                    }
                    
                    console.log(`四消+四消叠加：清除了 ${list.length} 个元素`);
                    
                } else if (exchangeInfo.type === 'allSame-line') {
                    // 五消与四消特效交换：随机选择一个元素类型，将全屏该类型变成四消特效，并立即触发
                    console.log('检测到五消与四消特效交换，执行转换逻辑');
                    
                    // 随机选择一个元素类型（0到blockCount-1）
                    let randomType = Math.floor(Math.random() * App.gameLogic.blockCount);
                    console.log(`随机选择元素类型: ${randomType}`);
                    
                    // 安全检查节点是否存在
                    if (bc.node && bc.node.isValid) {
                        let iconNode = bc.node.getChildByName('icon');
                        if (iconNode) {
                            let match11Node = iconNode.getChildByName('Match11');
                            if (match11Node) {
                                let spriteComp = match11Node.getComponent(Sprite);
                                if (spriteComp) {
                                    spriteComp.enabled = false;
                                }
                                let aNode = match11Node.getChildByName('a');
                                if (aNode) {
                                    aNode.active = true;
                                }
                            }
                        }
                    }
                    
                    App.audio.play("prop_missle");
                    
                    // 将五消特效本身加入消除列表
                    list.push(bc);
                    
                    // 将所有该类型的普通元素转换为四消特效，并立即计算它们的影响范围
                    let allAffectedElements = new Set<gridCmpt>();
                    
                    for (let i = 0; i < this.H; i++) {
                        for (let j = 0; j < this.V; j++) {
                            let item = this.blockArr[i][j];
                            if (item) {
                                let gridComponent = item.getComponent(gridCmpt);
                                if (gridComponent.type == randomType && gridComponent.type < 8) {
                                    // 普通元素：转换为四消特效并计算其影响范围
                                    console.log(`转换位置[${i}, ${j}]的元素为四消特效类型${exchangeInfo.fourLineBombType}`);
                                    
                                    // 添加转换特效
                                    let particle = instantiate(this.particlePre);
                                    this.effNode.addChild(particle);
                                    if (bc.node && bc.node.isValid) {
                                        particle.setPosition(bc.node.position);
                                    } else {
                                        particle.setPosition(this.blockPosArr[bc.h][bc.v]);
                                    }
                                    particle.children.forEach(subItem => {
                                        subItem.active = subItem.name == "move";
                                    });
                                    tween(particle).to(0.3, { position: item.position }).call(async (particle) => {
                                        await ToolsHelper.delayTime(0.1);
                                        if (particle && particle.isValid) {
                                            particle.destroy();
                                        }
                                    }).start();
                                    
                                    // 直接计算该位置四消特效的影响范围
                                    let effectRange = this.calculateBombEffectAtPosition(i, j, exchangeInfo.fourLineBombType);
                                    effectRange.forEach(elem => allAffectedElements.add(elem));
                                    
                                } else if (gridComponent.type == randomType && gridComponent.type >= 8) {
                                    // 已有的同类型特效元素：直接加入消除列表
                                    allAffectedElements.add(gridComponent);
                                }
                            }
                        }
                    }
                    
                    // 将所有受影响的元素加入消除列表
                    list.push(...Array.from(allAffectedElements));
                    
                    console.log(`五消+四消交换：转换并影响了 ${allAffectedElements.size} 个元素`);
                    
                    // 减少等待时间
                    await ToolsHelper.delayTime(0.1);
                    
                } else {
                    // 原有的五消特效逻辑
                    let curType: number = -1;
                    if (this.curTwo && Array.isArray(this.curTwo)) {
                        for (let i = 0; i < this.curTwo.length; i++) {
                            if (this.curTwo[i] && this.curTwo[i].type != bc.type) {
                                curType = this.curTwo[i].type;
                            }
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
                    let iconNode = bc.node.getChildByName('icon');
                    if (iconNode) {
                        let match11Node = iconNode.getChildByName('Match11');
                        if (match11Node) {
                            let spriteComponent = match11Node.getComponent(Sprite);
                            if (spriteComponent) {
                                spriteComponent.enabled = false;
                            }
                            let aNode = match11Node.getChildByName('a');
                            if (aNode) {
                                aNode.active = true;
                            }
                        }
                    }
                    if (curType < 0) curType = Math.floor(Math.random() * App.gameLogic.blockCount);
                    App.audio.play("prop_missle")
                    for (let i = 0; i < this.H; i++) {
                        for (let j = 0; j < this.V; j++) {
                            let item = this.blockArr[i][j];
                            if (item && item.getComponent(gridCmpt).type == curType) {
                                list.push(item.getComponent(gridCmpt));
                                let particle = instantiate(this.particlePre);
                                this.effNode.addChild(particle);
                                if (bc.node && bc.node.isValid) {
                                    particle.setPosition(bc.node.position);
                                } else {
                                    particle.setPosition(this.blockPosArr[bc.h][bc.v]);
                                }
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
                    // 减少五消特效等待时间
                    await ToolsHelper.delayTime(0.1);
                }
                break;
        }
        return list;
    }

    /** 选中状态还原 */
    resetSelected() {
        if (!this.isValid) {
            return;
        }
        if (this.curTwo && Array.isArray(this.curTwo)) {
            this.curTwo.forEach(item => {
                if (item && item.node && item.node.isValid) {
                    item.setSelected(false);
                }
            })
        }
    }

    /** 开始交换连个选中的方块 */
    async startChangeCurTwoPos(isBack: boolean = false) {
        // 安全检查
        if (!this.curTwo || !Array.isArray(this.curTwo) || this.curTwo.length < 2) {
            console.log('startChangeCurTwoPos failed: invalid curTwo array');
            this.isStartChange = false;
            this.isStartTouch = false;
            return;
        }
        
        let time = Constant.changeTime;
        let one = this.curTwo[0], two = this.curTwo[1];
        
        // 进一步检查元素有效性
        if (!one || !two || !one.node || !two.node || !one.node.isValid || !two.node.isValid) {
            console.log('startChangeCurTwoPos failed: invalid grid components');
            this.isStartChange = false;
            this.isStartTouch = false;
            this.resetSelected();
            return;
        }
        
        if (!isBack) {
            App.audio.play("ui_banner_down_show")
        }
        else {
            App.audio.play("ui_banner_up_hide")
        }
        tween(one.node).to(time, { position: this.blockPosArr[two.h][two.v] }).start();
        tween(two.node).to(time, { position: this.blockPosArr[one.h][one.v] }).call(async () => {
            if (!isBack) {
                this.changeData(one, two);
                
                // 记住原始元素类型
                let oneOriginalType = one.type;
                let twoOriginalType = two.type;
                
                // 先检查三消组合，确保能正常生成特效元素
                let bool = await this.newMatchDetection((bl) => {
                    if (bl) {
                        this.stepCount--;
                        this.updateStep();
                    }
                });
                
                // 处理交换位置上的炸弹
                let isbomb1 = false;
                let isbomb2 = false;
                
                // 检查是否是特效交换（两个都是特效元素）
                let bothBombs = (oneOriginalType >= 8 && this.isBomb(one)) && (twoOriginalType >= 8 && this.isBomb(two));
                
                if (bothBombs) {
                    // 特效交换：只处理一次，让getBombList中的交换逻辑统一处理
                    console.log('检测到特效交换，统一处理避免重复');
                    isbomb1 = await this.handleBomb(one); // 只处理第一个，交换逻辑会处理两个
                } else {
                    // 非交换情况：分别处理
                    if (oneOriginalType >= 8 && this.isBomb(one)) {
                        isbomb1 = await this.handleBomb(one);
                    }
                    if (twoOriginalType >= 8 && this.isBomb(two)) {
                        isbomb2 = await this.handleBomb(two);
                    }
                }
                
                // 特效消除也需要扣除步数
                if ((isbomb1 || isbomb2) && !bool) {
                    // 如果没有三消但有特效引爆，扣除步数
                    this.stepCount--;
                    this.updateStep();
                }
                
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
    /** 新的连锁反应检查方法 - 替换原有的checkAgain递归 */
    async newChainReactionCheck(isFromPlayerAction: boolean = false): Promise<void> {
        if (!this.chainReactionHandler) {
            console.warn('[GameViewCmpt] 连锁反应处理器未初始化，使用原有逻辑');
            return this.legacyCheckAgain();
        }

        console.log(`[GameViewCmpt] 开始新连锁反应检查 (玩家操作: ${isFromPlayerAction})`);
        
        // 设置游戏状态
        if (this.gameStateManager) {
            this.gameStateManager.setState(GameState.PROCESSING);
        }
        
        try {
            // 启动连锁反应处理
            const result = await this.chainReactionHandler.startChainReaction(this.blockArr, isFromPlayerAction);
            
            console.log(`[GameViewCmpt] 连锁反应完成 - 匹配: ${result.totalMatches}, 分数: ${result.totalScore}, 连击: ${result.maxCombo}`);
            
            // 重置UI状态
            this.resetSelected();
            this.isStartChange = false;
            this.isStartTouch = false;
            this.checkAgainCount = 0;
            this.resetHintTimer();
            
            // 检查是否需要洗牌
            this.checkBoardAndShuffle();
            
        } catch (error) {
            console.error('[GameViewCmpt] 连锁反应处理出错:', error);
            // 出错时回退到原有逻辑
            this.legacyCheckAgain();
        }
    }

    /** 保留原有checkAgain逻辑作为回退方案 */
    private async legacyCheckAgain(isResult: boolean = false): Promise<void> {
        this.checkAgainCount++;
        console.log('Legacy checkAgain called, count:', this.checkAgainCount);

        // 防止无限递归，最多递归10次
        if (this.checkAgainCount > 10) {
            console.log('checkAgain reached max recursion, force stopping');
            this.resetSelected();
            this.isStartChange = false;
            this.isStartTouch = false;
            this.checkAgainCount = 0;
            this.resetHintTimer();
            return;
        }

        let bool = await this.newMatchDetection();
        if (bool) {
            this.legacyCheckAgain(isResult);
        }
        else {
            console.log('checkAgain completed, waiting for animations...');
            
            // Wait for all pending fly animations to complete
            await Promise.all(this.flyingItemPromises);
            this.flyingItemPromises = []; // Clear the array for the next turn

            console.log('Animations complete. Resetting states.');
            this.resetSelected();
            this.isStartChange = false;
            this.isStartTouch = false;
            this.checkAgainCount = 0;
            this.resetHintTimer();
            
            // All animations and logic are done, now check for the result.
            this.checkResult();

            // Then, check if the board needs shuffling for the next move.
            this.checkBoardAndShuffle();
        }
    }

    /** 兼容性方法 - 保持原有接口 */
    async checkAgain(isResult: boolean = false): Promise<void> {
        await this.newChainReactionCheck(false);
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
                    await this.synthesisBomb(item);
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
                    if (ele.node && ele.node.isValid) {
                        let worldPosition = ele.node.worldPosition
                        this.flyItem(tp, worldPosition);
                    }
                    this.addScoreByType(tp);
                    // 目标计数由flyItem动画完成时处理，避免重复计数
                    particle.setPosition(this.blockPosArr[ele.h][ele.v]);
                    this.blockArr[ele.h][ele.v] = null;
                    if (ele.node && ele.node.isValid) {
                        ele.node.destroy();
                    }
                }
            }
            await ToolsHelper.delayTime(0.2);
            await this.checkMoveDown();
            resolve("");
        });
    }

    /** 炸弹消除 */
    private async handleSamelistBomb(samelist: any[], depth: number = 0, isDirectBombTrigger: boolean = false) {
        return new Promise(async resolve => {
            if (samelist.length < 1) {
                resolve("");
                return;
            }
            
            // 调整递归深度限制，允许更深的连锁反应但防止无限循环
            if (depth > 10) {
                console.warn('handleSamelistBomb: 递归深度过深，停止处理以防无限循环');
                resolve("");
                return;
            }
            
            console.log(`handleSamelistBomb: 处理 ${samelist.length} 个元素，递归深度: ${depth}, 直接交换: ${isDirectBombTrigger}`);
            
            // 播放连锁音效
            let soundList = ['combo_cool', 'combo_excellent', 'combo_good', 'combo_great', 'combo_perfect'];
            let rand = Math.floor(Math.random() * soundList.length);
            this.scheduleOnce(() => {
                if (this.isValid) {
                    App.audio.play(soundList[rand])
                }
            }, 0.2);
            
            // 收集所有被波及的特效炸弹信息（在销毁之前记录）
            // 使用Set防止重复处理同一位置的特效元素
            let triggeredBombs = [];
            let processedPositions = new Set<string>();
            
            // 处理被波及的特效元素
            // 只有在直接特效交换时，才跳过原本参与交换的特效元素的波及处理
            // 其他情况（包括连锁波及）都需要处理
            for (let i = 0; i < samelist.length; i++) {
                let ele: gridCmpt = samelist[i];
                if (!ele) continue;
                
                // 生成位置标识，防止重复处理
                let posKey = `${ele.h}-${ele.v}`;
                
                // 如果是直接交换，检查这个元素是否参与了交换
                let isExchangeParticipant = false;
                if (isDirectBombTrigger && this.curTwo && this.curTwo.length > 0) {
                    isExchangeParticipant = this.curTwo.some(bombItem => 
                        bombItem && bombItem.h === ele.h && bombItem.v === ele.v
                    );
                }
                
                // 按照规则处理被波及的特效元素
                if (ele.type === Bomb.allSame && !isExchangeParticipant) {
                    // 五消被波及：随机选择一种元素并全清
                    console.log('检测到五消被波及，将随机选择元素全清');
                    if (!processedPositions.has(posKey)) {
                        processedPositions.add(posKey);
                        triggeredBombs.push({
                            type: 'allSame-triggered',
                            originalElement: ele
                        });
                    }
                } else if ((ele.type === Bomb.hor || ele.type === Bomb.ver || ele.type === Bomb.bomb) && !isExchangeParticipant) {
                    // 四消被波及：在原地触发效果（包括拐弯五消）
                    console.log(`检测到特效炸弹被波及，将在原地触发，类型：${ele.type}，位置：[${ele.h}, ${ele.v}]`);
                    if (!processedPositions.has(posKey)) {
                        processedPositions.add(posKey);
                        triggeredBombs.push({
                            type: 'bomb-triggered',
                            bombType: ele.type,
                            originalElement: ele
                        });
                    } else {
                        console.log(`位置 [${ele.h}, ${ele.v}] 的特效元素已处理，跳过重复触发`);
                    }
                } else if (isExchangeParticipant) {
                    console.log(`位置 [${ele.h}, ${ele.v}] 的特效元素参与了直接交换，跳过波及处理`);
                }
            }
            
            // 并发处理所有元素的消除，提高流畅度
            let eliminationPromises = [];
            
            for (let i = 0; i < samelist.length; i++) {
                let ele: gridCmpt = samelist[i];
                if (!ele) continue;
                
                // 为每个元素创建独立的消除处理
                let eliminationPromise = new Promise<void>((resolve) => {
                    // 创建消除粒子效果
                    let particle = instantiate(this.particlePre);
                    this.effNode.addChild(particle);
                    particle.children.forEach(item => {
                        item.active = +item.name == ele.type;
                    })
                    
                    let tp = ele.type;
                    if (ele.node && ele.node.isValid) {
                        let worldPosition = ele.node.worldPosition;
                        this.flyItem(tp, worldPosition);
                        particle.setPosition(ele.node.position);
                    } else {
                        particle.setPosition(this.blockPosArr[ele.h][ele.v]);
                    }
                    
                    this.addScoreByType(tp);
                    this.blockArr[ele.h][ele.v] = null;
                    
                    if (ele.node && ele.node.isValid) {
                        // 添加一个简短的消失动画，让消除更生动
                        tween(ele.node)
                            .to(0.1, { scale: v3(1.2, 1.2, 1.2) })
                            .to(0.1, { scale: v3(0, 0, 0) })
                            .call(() => {
                                if (ele.node && ele.node.isValid) {
                                    ele.node.destroy();
                                }
                                resolve();
                            })
                            .start();
                    } else {
                        resolve();
                    }
                });
                
                eliminationPromises.push(eliminationPromise);
            }
            
            // 等待所有消除动画完成
            await Promise.all(eliminationPromises);
            
            // 稍等一下让用户看到消除效果
            await ToolsHelper.delayTime(0.1);
            
            // 处理被波及的特效炸弹的触发效果
            let allTriggeredElements = [];
            
            // 限制每种类型的波及触发次数，避免无限循环
            let triggerCounts = { allSame: 0, bomb: 0 };
            
            for (let bombInfo of triggeredBombs) {
                if (bombInfo.type === 'allSame-triggered' && triggerCounts.allSame < 1) {
                    // 五消被波及：随机选择一种元素并全清（每轮最多触发1次）
                    triggerCounts.allSame++;
                    let randomType = Math.floor(Math.random() * App.gameLogic.blockCount);
                    console.log(`五消被波及效果：随机选择清除类型 ${randomType}`);
                    
                    for (let h = 0; h < this.H; h++) {
                        for (let v = 0; v < this.V; v++) {
                            let item = this.blockArr[h][v];
                            if (item) {
                                let gc = item.getComponent(gridCmpt);
                                if (gc.type === randomType) {
                                    allTriggeredElements.push(gc);
                                }
                            }
                        }
                    }
                    
                    if (allTriggeredElements.length > 0) {
                        App.audio.play("prop_missle");
                        console.log(`五消被波及：清除 ${allTriggeredElements.length} 个类型${randomType}的元素`);
                    }
                    
                } else if (bombInfo.type === 'bomb-triggered' && triggerCounts.bomb < 5) {
                    // 四消被波及：在原地触发效果（每轮最多触发5次，防止过多）
                    triggerCounts.bomb++;
                    console.log(`特效炸弹被波及，在原地触发效果，类型：${bombInfo.bombType}`);
                    
                    try {
                        // 直接根据炸弹类型和位置计算影响范围
                        let bombEffectElements = this.calculateBombEffect(bombInfo.originalElement, bombInfo.bombType);
                        
                        // 过滤掉已经被处理的元素，避免重复
                        let newElements = bombEffectElements.filter(elem => {
                            return elem && elem.node && elem.node.isValid && this.blockArr[elem.h] && this.blockArr[elem.h][elem.v];
                        });
                        
                        if (newElements.length > 0) {
                            allTriggeredElements.push(...newElements);
                            
                            // 播放对应音效
                            if (bombInfo.bombType === Bomb.bomb) {
                                App.audio.play("prop_bomb");
                            } else {
                                App.audio.play("prop_line");
                            }
                            
                            console.log(`特效炸弹被波及：影响 ${newElements.length} 个元素`);
                        } else {
                            console.log(`特效炸弹被波及：影响 0 个元素（可能已被清除）`);
                        }
                    } catch (error) {
                        console.error('特效炸弹被波及触发失败:', error);
                    }
                }
            }
            
            // 如果有连锁触发的元素，递归处理
            if (allTriggeredElements.length > 0) {
                // 去重，避免同一个元素被多次处理
                let uniqueElements = [];
                let seen = new Set();
                
                for (let element of allTriggeredElements) {
                    let key = `${element.h}-${element.v}`;
                    if (!seen.has(key) && element.node && element.node.isValid) {
                        seen.add(key);
                        uniqueElements.push(element);
                    }
                }
                
                if (uniqueElements.length > 0) {
                    console.log(`连锁触发：处理 ${uniqueElements.length} 个元素`);
                    // 减少连锁触发的延迟，让连锁反应更快
                    await ToolsHelper.delayTime(0.1);
                    await this.handleSamelistBomb(uniqueElements, depth + 1, false); // 连锁反应，允许波及处理
                }
            }

            // 减少最终延迟时间
            await ToolsHelper.delayTime(0.1);
            await this.checkMoveDown();
            resolve("");
        });
    }
    
    /** 计算特效炸弹的影响范围（不依赖node，用于被波及时的触发） */
    private calculateBombEffect(bombElement: gridCmpt, bombType: number): gridCmpt[] {
        let affectedElements: gridCmpt[] = [];
        
        switch (bombType) {
            case Bomb.hor:
                // 横向四消：清除整行
                for (let i = 0; i < this.H; i++) {
                    let item = this.blockArr[i][bombElement.v];
                    if (item) {
                        affectedElements.push(item.getComponent(gridCmpt));
                    }
                }
                break;
                
            case Bomb.ver:
                // 纵向四消：清除整列
                for (let i = 0; i < this.V; i++) {
                    let item = this.blockArr[bombElement.h][i];
                    if (item) {
                        affectedElements.push(item.getComponent(gridCmpt));
                    }
                }
                break;
                
            case Bomb.bomb:
                // 范围炸弹：清除周围5x5区域（排除自身位置）
                for (let i = bombElement.h - 2; i <= bombElement.h + 2 && i < this.H; i++) {
                    for (let j = bombElement.v - 2; j <= bombElement.v + 2 && j < this.V; j++) {
                        if (i < 0 || j < 0) continue;
                        // 排除炸弹自身的位置，避免自己炸自己
                        if (i === bombElement.h && j === bombElement.v) continue;
                        let item = this.blockArr[i][j];
                        if (item) {
                            affectedElements.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                break;
        }
        
        return affectedElements;
    }
    
    /** 计算指定位置指定类型炸弹的影响范围 */
    private calculateBombEffectAtPosition(h: number, v: number, bombType: number): gridCmpt[] {
        let affectedElements: gridCmpt[] = [];
        
        switch (bombType) {
            case Bomb.hor:
                // 横向四消：清除整行
                for (let i = 0; i < this.H; i++) {
                    let item = this.blockArr[i][v];
                    if (item) {
                        affectedElements.push(item.getComponent(gridCmpt));
                    }
                }
                break;
                
            case Bomb.ver:
                // 纵向四消：清除整列
                for (let i = 0; i < this.V; i++) {
                    let item = this.blockArr[h][i];
                    if (item) {
                        affectedElements.push(item.getComponent(gridCmpt));
                    }
                }
                break;
                
            case Bomb.bomb:
                // 拐弯五消：清除5x5区域（排除中心位置）
                for (let i = h - 2; i <= h + 2 && i < this.H; i++) {
                    for (let j = v - 2; j <= v + 2 && j < this.V; j++) {
                        if (i < 0 || j < 0) continue;
                        // 排除中心位置，避免重复
                        if (i === h && j === v) continue;
                        let item = this.blockArr[i][j];
                        if (item) {
                            affectedElements.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                break;
        }
        
        return affectedElements;
    }
    
    /** 合成炸弹 */
    async synthesisBomb(item: gridCmpt[]): Promise<void> {
        console.log(`synthesisBomb called - creating bomb from ${item.length} elements`);
        /** 先找当前item中是否包含curTwo,包含就以curTwo为中心合成 */
        let center: gridCmpt = null;
        if (this.curTwo && Array.isArray(this.curTwo)) {
            for (let j = 0; j < item.length; j++) {
                for (let m = 0; m < this.curTwo.length; m++) {
                    if (this.curTwo[m] && item[j].h == this.curTwo[m].h && item[j].v == this.curTwo[m].v) {
                        center = item[j];
                        break;
                    }
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
            if (ele.node && ele.node.isValid) {
                let worldPosition = ele.node.worldPosition
                this.flyItem(tp, worldPosition);
            }
            this.addScoreByType(tp);
            // 目标计数由flyItem动画完成时处理，避免重复计数
            tween(ele.node).to(0.1, { position: this.blockPosArr[center.h][center.v] }).call((target) => {
                let gt = target.getComponent(gridCmpt);
                console.log(gt.h, gt.v)
                if (gt.h == center.h && gt.v == center.v) {
                    gt.setType(bombType);
                }
                else {
                    this.blockArr[gt.h][gt.v] = null;
                    if (gt.node && gt.node.isValid) {
                        gt.node.destroy();
                    }
                }
            }).start();

        }
        
        // 等待炸弹生成动画完成
        await ToolsHelper.delayTime(0.1);
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
            if (!this.blockArr[i] || !this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || ele.getMoveState()) break;
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
            if (!this.blockArr[i] || !this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || ele.getMoveState()) break;
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
            if (!this.blockArr[startX] || !this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || ele.getMoveState()) break;
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
            if (!this.blockArr[startX] || !this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || ele.getMoveState()) break;
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
            let movePromises = [];
            
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
                        
                        // 创建并发的下落动画
                        let movePromise = new Promise<void>((resolveMove) => {
                            tween(block).to(0.4, { position: this.blockPosArr[i][j - count1] }, { easing: 'backOut' })
                                .call(() => resolveMove())
                                .start();
                        });
                        movePromises.push(movePromise);
                    }
                }
            }
            
            // 等待所有下落动画完成
            if (movePromises.length > 0) {
                await Promise.all(movePromises);
            }
            
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
            let replenishPromises = [];
            
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    let block = this.blockArr[i][j];
                    let isHide = App.gameLogic.checkInHideList(i, j);
                    if (!block && !isHide) {
                        let pos = this.blockPosArr[i][this.V - 1]
                        let newBlock = this.addBlock(i, j, v3(pos.x, pos.y + Constant.Width + 20, 1));
                        this.blockArr[i][j] = newBlock;
                        
                        // 创建并发的新方块下落动画
                        let replenishPromise = new Promise<void>((resolveReplenish) => {
                            tween(newBlock).to(0.25, { position: this.blockPosArr[i][j] }, { easing: 'backOut' })
                                .call(() => resolveReplenish())
                                .start();
                        });
                        replenishPromises.push(replenishPromise);
                    }
                }
            }
            
            // 等待所有新方块下落动画完成
            if (replenishPromises.length > 0) {
                await Promise.all(replenishPromises);
            }
            
            // 减少补充方块后的等待时间
            await ToolsHelper.delayTime(0.1);
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
        this.checkAgain();
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
        
        // 强制重置所有状态
        this.forceReset();
        
        // 清理所有方块
        if (this.blockArr.length >= 1) {
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    let block = this.blockArr[i][j];
                    if (block && block.isValid) {
                        block.destroy();
                    }
                }
            }
        }
        this.blockArr = [];
        this.blockPosArr = [];
        this.curScore = 0;
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

    /** 新的分数添加方法 - 直接添加分数值 */
    addScoreByValue(score: number) {
        this.curScore += score;
        this.updateScorePercent();
    }
    /** 飞舞动画 */
    async flyItem(type: number, pos: Vec3) {
        const promise = new Promise<void>(resolve => {
            // 将原始type映射到显示类型
            let displayType = type;
            if (type >= 200) {
                displayType = (type - 200) % App.gameLogic.blockCount;
            } else if (type >= App.gameLogic.blockCount) {
                displayType = type % App.gameLogic.blockCount;
            }
            
            // 在目标数组中查找是否有这种显示类型的目标
            let hasTarget = false;
            for (let i = 0; i < this.coutArr.length; i++) {
                if (displayType == this.coutArr[i][0] && this.coutArr[i][1] > 0) {
                    hasTarget = true;
                    break;
                }
            }
            
            if (!hasTarget) {
                resolve();
                return;
            }
            let item = instantiate(this.gridPre);
            let tempPos = new Vec3();
            let targetPos = new Vec3();
            /** 空间坐标转节点坐标 */
            this.node.getComponent(UITransform).convertToNodeSpaceAR(pos, tempPos)
            this.node.getComponent(UITransform).convertToNodeSpaceAR(this.targetBg.worldPosition, targetPos)
            item.setPosition(tempPos);
            this.node.addChild(item);
            item.getComponent(gridCmpt).setType(type);

            let time = 0.5 + Math.random() * 0.5; // Shorten animation for faster gameplay
            item.setScale(0.5, 0.5, 0.5);
            tween(item).to(time, { position: targetPos }, { easing: 'backIn' }).call(() => {
                this.handleLevelTarget(type);
                item.destroy();
                resolve();
            }).start();
        });
        this.flyingItemPromises.push(promise);
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
        console.log('接收到重新开始事件');
        
        // 检查体力是否足够
        if (!App.heart.canStartGame()) {
            // 体力不足时通过广告获取体力并重新开始
            App.heart.showHeartInsufficientTipsWithAd(() => {
                // 广告观看完成后，消耗刚获得的体力并重新开始游戏
                if (App.heart.consumeHeart(1)) {
                    this.restartGame();
                } else {
                    App.view.showMsgTips('❌ 体力消耗失败，请重试');
                }
            });
            return;
        }
        
        // 消耗1点体力
        if (!App.heart.consumeHeart(1)) {
            // 体力不足时通过广告获取体力并重新开始
            App.heart.showHeartInsufficientTipsWithAd(() => {
                // 广告观看完成后，消耗刚获得的体力并重新开始游戏
                if (App.heart.consumeHeart(1)) {
                    this.restartGame();
                } else {
                    App.view.showMsgTips('❌ 体力消耗失败，请重试');
                }
            });
            return;
        }
        
        // 重新开始游戏逻辑
        this.restartGame();
    }

    /** 执行重新开始游戏的具体逻辑 */
    private async restartGame() {
        // 重置游戏状态
        this.isWin = false;
        this.curScore = 0;
        this.starCount = 0;
        this.checkAgainCount = 0;
        
        // 强制重置所有状态
        this.forceReset();
        
        // 重新加载关卡数据
        this.data = await LevelConfig.getLevelData(this.level);
        this.setLevelInfo();
        
        // 重新初始化布局
        await this.initLayout();
        
        // 重新开始提示计时器
        this.startHintTimer();
        
        console.log('游戏重新开始完成');
    }

    /** 强制重置所有状态 */
    forceReset() {
        console.log('Force reset called');
        
        // 停止所有定时器
        this.unscheduleAllCallbacks();
        
        // 重置所有状态变量
        this.isStartChange = false;
        this.isStartTouch = false;
        this.isRecording = false;
        this.isWin = false;
        this.curTwo = []; // 确保是空数组而不是null
        this.checkAgainCount = 0;
        
        // 重置提示系统
        this.stopHintTimer();
        this.isShowingHint = false;
        this.hintPair = [];
        this.hintTimer = 0;
        
        // 重置选中状态
        this.resetSelected();
        
        console.log('Force reset completed');
    }

    /** 紧急解锁（调试用） */
    emergencyUnlock() {
        console.log('Emergency unlock triggered');
        this.forceReset();
        console.log('After emergency unlock - isStartTouch:', this.isStartTouch, 'isStartChange:', this.isStartChange);
    }
    onClick_testBtn() {
        this.loadExtraData(this.level);
        // this.handleLastSteps();
    }

    /** 设置 */
    onClick_setBtn() {
        App.view.openView(ViewName.Single.esettingGameView);
    }


    /** 暂停 */
    async onClick_pauseBtn() {
        App.audio.play('button_click');
        App.view.openView(ViewName.Single.esettingGameView);
    }

    /** 添加道具，广告位 */
    onClickAddButton(btnNode: Node) {
        console.log('🔘 道具获取按钮被点击:', btnNode.name);
        App.audio.play('button_click');
        let type: number = -1;
        let toolName = "";
        
        switch (btnNode.name) {
            case "addBtn1":
                type = Bomb.bomb;
                toolName = "炸弹道具";
                break;
            case "addBtn2":
                type = Bomb.hor;
                toolName = "横向消除道具";
                break;
            case "addBtn3":
                type = Bomb.ver;
                toolName = "纵向消除道具";
                break;
            case "addBtn4":
                type = Bomb.allSame;
                toolName = "同色消除道具";
                break;
        }
        
        // 使用新的广告管理系统
        this.watchAdForTool(type, toolName);
    }
    private isUsingBomb: boolean = false;
    /** 道具 */
    onClickToolButton(btnNode: Node) {
        App.audio.play('button_click');
        // 如果目标已完成，忽略道具操作
        if (this.isWin) {
            console.log('Tool button click blocked - target completed, ignoring player input');
            return;
        }
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
            // 统一使用新的广告系统获取道具
            let toolName = "";
            switch (type) {
                case Bomb.bomb:
                    toolName = "炸弹道具";
                    break;
                case Bomb.hor:
                    toolName = "横向消除道具";
                    break;
                case Bomb.ver:
                    toolName = "纵向消除道具";
                    break;
                case Bomb.allSame:
                    toolName = "同色消除道具";
                    break;
            }
            console.log('🔘 道具不足，调用广告系统获取:', toolName);
            this.watchAdForTool(type, toolName);
            return;
        }
        GlobalFuncHelper.setBomb(type, -1);
        let pos = btnNode.worldPosition;
        this.throwTools(type, pos);
        this.updateToolsInfo();
    }

    /** 显示道具获取确认对话框 */
    showToolAcquisitionDialog(toolType: number) {
        let toolName = "";
        switch (toolType) {
            case Bomb.bomb:
                toolName = "炸弹道具";
                break;
            case Bomb.hor:
                toolName = "横向消除道具";
                break;
            case Bomb.ver:
                toolName = "纵向消除道具";
                break;
            case Bomb.allSame:
                toolName = "同色消除道具";
                break;
        }

        // 创建确认对话框
        this.createConfirmDialog(
            `${toolName}数量不足，是否通过观看广告获取道具？`,
            () => {
                // 点击确认 - 观看广告
                App.view.showMsgTips(`观看广告获取${toolName}`);
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        GlobalFuncHelper.setBomb(toolType, 1);
                        App.event.emit(EventName.Game.ToolCountRefresh);
                        App.view.showMsgTips(`获得 ${toolName} x1！`);
                    }
                });
            },
            () => {
                // 点击取消 - 关闭对话框继续游戏
                App.view.showMsgTips("已取消道具获取");
            }
        );
    }

    /** 创建确认对话框 */
    createConfirmDialog(message: string, onConfirm: () => void, onCancel: () => void) {
        // 检查是否支持DOM
        if (typeof document !== 'undefined') {
            try {
                this.createDOMConfirmDialog(message, onConfirm, onCancel);
                return;
            } catch (error) {
                console.error('DOM对话框创建失败，使用简化版本');
            }
        }
        
        // 降级方案：使用简单的提示+延时
        App.view.showMsgTips(`${message}\n3秒后自动观看广告，点击任意处取消`);
        
        let isCancelled = false;
        const timeout = setTimeout(() => {
            if (!isCancelled) {
                onConfirm();
            }
        }, 3000);
        
        // 简化的取消机制（实际项目中可以添加更好的UI交互）
        const cancelTimeout = setTimeout(() => {
            isCancelled = true;
            clearTimeout(timeout);
            onCancel();
        }, 8000); // 8秒后自动取消
    }

    /** 创建DOM确认对话框 */
    createDOMConfirmDialog(message: string, onConfirm: () => void, onCancel: () => void) {
        // 创建遮罩层
        const dialogContainer = document.createElement('div');
        dialogContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
        `;

        // 对话框内容
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 350px;
            width: 80%;
            text-align: center;
        `;

        // 消息文本
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            margin: 0 0 25px 0;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
        `;

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
        `;

        // 确认按钮
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '观看广告';
        confirmButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        confirmButton.onmouseover = () => confirmButton.style.background = '#45a049';
        confirmButton.onmouseout = () => confirmButton.style.background = '#4CAF50';
        confirmButton.onclick = () => {
            document.body.removeChild(dialogContainer);
            onConfirm();
        };

        // 取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        cancelButton.onmouseover = () => cancelButton.style.background = '#da190b';
        cancelButton.onmouseout = () => cancelButton.style.background = '#f44336';
        cancelButton.onclick = () => {
            document.body.removeChild(dialogContainer);
            onCancel();
        };

        // 组装对话框
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        dialog.appendChild(messageElement);
        dialog.appendChild(buttonContainer);
        dialogContainer.appendChild(dialog);
        document.body.appendChild(dialogContainer);
    }

    /*********************************************  提示系统 *********************************************/
    /*********************************************  提示系统 *********************************************/
    /*********************************************  提示系统 *********************************************/
    
    /** 开始提示计时器 */
    startHintTimer() {
        this.hintTimer = 0;
        this.schedule(this.updateHintTimer, 1);
    }

    /** 重置提示计时器 */
    resetHintTimer() {
        this.hintTimer = 0;
        this.stopHint();
    }

    /** 停止提示计时器 */
    stopHintTimer() {
        this.unschedule(this.updateHintTimer);
        this.stopHint();
    }

    /** 更新计时器 */
    updateHintTimer() {
        if (this.isWin || this.isStartChange || this.isStartTouch) {
            return;
        }
        
        this.hintTimer++;
        if (this.hintTimer >= this.hintInterval && !this.isShowingHint) {
            this.showHint();
        }
    }

    /** 显示提示 */
    async showHint() {
        let hintPair = this.findHintPair();
        if (hintPair.length === 2) {
            this.isShowingHint = true;
            this.hintPair = hintPair;
            this.startHintAnimation();
        } else {
            // 如果没有找到可提示的组合，重新开始计时
            this.hintTimer = 0;
        }
    }

    /** 停止提示 */
    stopHint() {
        if (this.isShowingHint) {
            this.isShowingHint = false;
            this.stopHintAnimation();
            this.hintPair = [];
        }
    }

    /** 寻找可以提示的交换组合 */
    findHintPair(): gridCmpt[] {
        // 遍历所有可能的交换组合
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block1 = this.blockArr[i][j];
                if (!block1) continue;
                
                let gc1 = block1.getComponent(gridCmpt);
                if (this.isBomb(gc1)) continue; // 跳过炸弹元素
                
                // 检查右边的元素
                if (i + 1 < this.H) {
                    let block2 = this.blockArr[i + 1][j];
                    if (block2) {
                        let gc2 = block2.getComponent(gridCmpt);
                        if (!this.isBomb(gc2) && this.canFormMatch(gc1, gc2)) {
                            return [gc1, gc2];
                        }
                    }
                }
                
                // 检查下方的元素
                if (j + 1 < this.V) {
                    let block2 = this.blockArr[i][j + 1];
                    if (block2) {
                        let gc2 = block2.getComponent(gridCmpt);
                        if (!this.isBomb(gc2) && this.canFormMatch(gc1, gc2)) {
                            return [gc1, gc2];
                        }
                    }
                }
            }
        }
        return [];
    }

    /**
     * 洗牌
     */
    async shuffleBoard() {
        console.log("Shuffling board...");
        // 1. Extract all movable blocks
        let movableBlocks: gridCmpt[] = [];
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                if (this.blockArr[i][j]) {
                    let gc = this.blockArr[i][j].getComponent(gridCmpt);
                    if (gc && !this.isBomb(gc)) {
                        movableBlocks.push(gc);
                    }
                }
            }
        }

        // 2. Shuffle the blocks (Fisher-Yates shuffle)
        for (let i = movableBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [movableBlocks[i], movableBlocks[j]] = [movableBlocks[j], movableBlocks[i]];
        }

        // 3. Place the shuffled blocks back on the board
        let blockIndex = 0;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                if (this.blockArr[i][j]) {
                    let gc = this.blockArr[i][j].getComponent(gridCmpt);
                    if (gc && !this.isBomb(gc)) {
                        if (blockIndex < movableBlocks.length) {
                            // Swap types
                            let oldType = gc.type;
                            let newType = movableBlocks[blockIndex].type;
                            gc.setType(newType);
                            movableBlocks[blockIndex].setType(oldType); // Keep the types consistent in the temp array
                            blockIndex++;
                        }
                    }
                }
            }
        }
        
        // Add a visual effect for shuffling
        this.gridNode.children.forEach(child => {
            tween(child)
                .to(0.1, { scale: v3(1.2, 1.2, 1) })
                .to(0.1, { scale: v3(1, 1, 1) })
                .start();
        });

        await ToolsHelper.delayTime(0.1);
        console.log("Board shuffled.");
    }

    /**
     * 检查并洗牌
     */
    async checkBoardAndShuffle() {
        if (this.findHintPair().length === 0) {
            console.log("No moves available. Shuffling...");
            App.view.showMsgTips("没有可移动的了，正在重新洗牌");
            await this.shuffleBoard();

            // After shuffling, check again. If still no moves, or if the shuffle created a match, reshuffle.
            while (this.findHintPair().length === 0 || await this.newMatchDetection()) {
                console.log("Reshuffling...");
                await this.shuffleBoard();
            }
            // After a valid shuffle, re-check for eliminations
            await this.checkAgain();
        }
    }

    /** 检查两个元素交换后是否能形成三消 */
    canFormMatch(gc1: gridCmpt, gc2: gridCmpt): boolean {
        // 优先使用新的匹配引擎
        if (this.matchEngine) {
            return this.matchEngine.canFormMatchAfterSwap(
                this.blockArr,
                { row: gc1.v, col: gc1.h },
                { row: gc2.v, col: gc2.h }
            );
        }
        
        // 回退到原有算法
        return this.simulateSwapAndCheck(gc1, gc2);
    }

    /** 模拟交换并检查是否有匹配 */
    private simulateSwapAndCheck(gc1: gridCmpt, gc2: gridCmpt): boolean {
        // 获取两个元素的当前类型和位置
        let type1 = gc1.type;
        let type2 = gc2.type;
        let pos1 = { h: gc1.h, v: gc1.v };
        let pos2 = { h: gc2.h, v: gc2.v };
        
        // 检查type1放到pos2位置是否能形成匹配
        if (this.checkMatchAtPos(pos2.h, pos2.v, type1, pos1)) {
            return true;
        }
        
        // 检查type2放到pos1位置是否能形成匹配
        if (this.checkMatchAtPos(pos1.h, pos1.v, type2, pos2)) {
            return true;
        }
        
        return false;
    }

    /** 检查在指定位置放置指定类型是否能形成匹配，忽略指定排除位置 */
    private checkMatchAtPos(h: number, v: number, type: number, excludePos: {h: number, v: number}): boolean {
        // 辅助函数：获取指定位置的元素类型，如果是排除位置则返回null
        const getTypeAt = (x: number, y: number) => {
            if (x === excludePos.h && y === excludePos.v) return null;
            if (!this.blockArr[x] || !this.blockArr[x][y]) return null;
            let gc = this.blockArr[x][y].getComponent(gridCmpt);
            return gc ? gc.type : null;
        };
        
        // 检查水平匹配
        let leftCount = 0;
        let rightCount = 0;
        
        // 向左计数
        for (let i = h - 1; i >= 0; i--) {
            let t = getTypeAt(i, v);
            if (t === type) leftCount++;
            else break;
        }
        
        // 向右计数
        for (let i = h + 1; i < this.H; i++) {
            let t = getTypeAt(i, v);
            if (t === type) rightCount++;
            else break;
        }
        
        // 水平匹配检查：当前位置 + 左边 + 右边 >= 3
        if (1 + leftCount + rightCount >= 3) {
            return true;
        }
        
        // 检查垂直匹配
        let upCount = 0;
        let downCount = 0;
        
        // 向上计数
        for (let j = v + 1; j < this.V; j++) {
            let t = getTypeAt(h, j);
            if (t === type) upCount++;
            else break;
        }
        
        // 向下计数
        for (let j = v - 1; j >= 0; j--) {
            let t = getTypeAt(h, j);
            if (t === type) downCount++;
            else break;
        }
        
        // 垂直匹配检查：当前位置 + 上边 + 下边 >= 3
        if (1 + upCount + downCount >= 3) {
            return true;
        }
        
        return false;
    }

    /** 开始提示动画 */
    startHintAnimation() {
        if (this.hintPair.length !== 2) return;
        
        let count = 0;
        let maxCycles = 2; // 总共2个循环（每个循环：闪烁3次 + 停顿3秒）
        
        let animationCycle = () => {
            if (count >= maxCycles || !this.isShowingHint) {
                this.stopHint();
                return;
            }
            
            // 闪烁3次
            let blinkCount = 0;
            let blinkInterval = setInterval(() => {
                if (!this.isShowingHint) {
                    clearInterval(blinkInterval);
                    return;
                }
                
                let isVisible = blinkCount % 2 === 0;
                this.setHintVisibility(isVisible);
                blinkCount++;
                
                if (blinkCount >= 6) { // 3次闪烁 = 6次状态切换
                    clearInterval(blinkInterval);
                    this.setHintVisibility(true); // 确保最后是可见状态
                    
                    // 停顿3秒后继续下一个循环
                    setTimeout(() => {
                        if (this.isShowingHint) {
                            count++;
                            animationCycle();
                        }
                    }, 3000);
                }
            }, 300); // 每300ms切换一次
        };
        
        animationCycle();
    }

    /** 停止提示动画 */
    stopHintAnimation() {
        if (this.hintPair && Array.isArray(this.hintPair) && this.hintPair.length > 0) {
            // 恢复所有元素的正常状态
            this.hintPair.forEach(gc => {
                if (gc && gc.node && gc.node.isValid) {
                    let icon = gc.node.getChildByName('icon');
                    if (icon) {
                        // 恢复正常缩放
                        tween(icon).to(0.2, { scale: v3(1, 1, 1) }).start();
                    }
                    
                    // 恢复正常透明度
                    let uiOpacity = gc.node.getComponent(UIOpacity);
                    if (uiOpacity) {
                        tween(uiOpacity).to(0.2, { opacity: 255 }).start();
                    }
                }
            });
        }
    }

    /** 设置提示元素的可见性 */
    setHintVisibility(visible: boolean) {
        if (!this.hintPair || !Array.isArray(this.hintPair)) {
            return;
        }
        this.hintPair.forEach(gc => {
            if (gc && gc.node && gc.node.isValid) {
                let icon = gc.node.getChildByName('icon');
                if (icon) {
                    // 使用缩放来实现闪烁效果，保持节点可交互
                    let scale = visible ? 1.0 : 0.8;
                    tween(icon).to(0.1, { scale: v3(scale, scale, scale) }).start();
                }
                
                // 同时添加透明度效果增强视觉效果
                let uiOpacity = gc.node.getComponent(UIOpacity);
                if (uiOpacity) {
                    let opacity = visible ? 255 : 150;
                    tween(uiOpacity).to(0.1, { opacity: opacity }).start();
                } else {
                    // 如果没有UIOpacity组件，动态添加一个
                    uiOpacity = gc.node.addComponent(UIOpacity);
                    let opacity = visible ? 255 : 150;
                    tween(uiOpacity).to(0.1, { opacity: opacity }).start();
                }
            }
        });
    }

    // 道具获取按钮点击事件
    onClick_addBtn1() {
        console.log('🔘 addBtn1按钮被点击');
        const btn = { name: 'addBtn1' } as Node;
        this.onClickAddButton(btn);
    }

    onClick_addBtn2() {
        console.log('🔘 addBtn2按钮被点击');
        const btn = { name: 'addBtn2' } as Node;
        this.onClickAddButton(btn);
    }

    onClick_addBtn3() {
        console.log('🔘 addBtn3按钮被点击');
        const btn = { name: 'addBtn3' } as Node;
        this.onClickAddButton(btn);
    }

    onClick_addBtn4() {
        console.log('🔘 addBtn4按钮被点击');
        const btn = { name: 'addBtn4' } as Node;
        this.onClickAddButton(btn);
    }

    // 道具使用按钮点击事件
    onClick_toolBtn1() {
        console.log('🔘 toolBtn1按钮被点击');
        const btn = { name: 'toolBtn1' } as Node;
        this.onClickToolButton(btn);
    }

    onClick_toolBtn2() {
        console.log('🔘 toolBtn2按钮被点击');
        const btn = { name: 'toolBtn2' } as Node;
        this.onClickToolButton(btn);
    }

    onClick_toolBtn3() {
        console.log('🔘 toolBtn3按钮被点击');
        const btn = { name: 'toolBtn3' } as Node;
        this.onClickToolButton(btn);
    }

    onClick_toolBtn4() {
        console.log('🔘 toolBtn4按钮被点击');
        const btn = { name: 'toolBtn4' } as Node;
        this.onClickToolButton(btn);
    }

    /**
     * 观看广告获取道具 - 使用新的广告管理系统
     * @param toolType 道具类型
     * @param toolName 道具名称
     */
    private async watchAdForTool(toolType: number, toolName: string): Promise<void> {
        console.log('🎬 准备调用新广告系统，道具类型:', toolType, '道具名称:', toolName);
        
        // 检查广告系统是否就绪
        if (!adManager.isReady()) {
            App.view.showMsgTips('广告系统未就绪，请稍后再试');
            console.warn('⚠️ 广告管理器未就绪');
            return;
        }
        
        try {
            // 调用新的广告管理系统
            const result = await adManager.showRewardedAd();
            console.log('📺 新广告系统播放结果:', result);
            
            // 根据广告结果处理业务逻辑
            switch (result) {
                case 'completed':
                    // 广告播放完成，给予奖励
                    GlobalFuncHelper.setBomb(toolType, 1);
                    App.event.emit(EventName.Game.ToolCountRefresh);
                    App.view.showMsgTips(`🎉 获得 ${toolName} x1！`);
                    console.log('✅ 道具已添加，触发界面刷新');
                    break;
                    
                case 'aborted':
                    // 用户中途关闭广告，不给奖励
                    App.view.showMsgTips('⚠️ 观看未完成，未获得道具');
                    console.log('❌ 用户中途关闭广告');
                    break;
                    
                case 'error':
                    // 广告播放失败
                    App.view.showMsgTips('❌ 广告暂不可用，请稍后再试');
                    console.error('❌ 广告播放失败');
                    break;
            }
        } catch (error) {
            console.error('广告播放异常:', error);
            App.view.showMsgTips('❌ 广告播放异常，请稍后再试');
        }
    }


    /** 更新体力显示 */
    updateHeartDisplay() {
        if (this.lbHeart) {
            const currentHeart = App.heart.getCurrentHeart();
            const maxHeart = App.heart.getMaxHeart();
            CocosHelper.updateLabelText(this.lbHeart, `${currentHeart}/${maxHeart}`);
            console.log(`游戏页面体力更新: ${currentHeart}/${maxHeart}`);
        } else {
            console.log('游戏页面未找到体力显示节点，可能路径不正确');
        }
    }

    /**
     * 初始化新的匹配引擎系统
     */
    private async initNewMatchSystem(): Promise<void> {
        console.log('[GameViewCmpt] 初始化新匹配引擎系统');
        
        // 初始化匹配引擎
        this.matchEngine = MatchEngine.instance;
        await this.matchEngine.init();
        this.matchEngine.setBoardSize(this.H, this.V);
        
        // 初始化消除处理器
        this.eliminationProcessor = EliminationProcessor.instance;
        await this.eliminationProcessor.init();
        this.eliminationProcessor.setup(this.effNode, this.particlePre);
        
        // 初始化游戏状态管理器
        this.gameStateManager = GameStateManager.instance;
        await this.gameStateManager.init();
        
        // 初始化连锁反应处理器
        this.chainReactionHandler = ChainReactionHandler.instance;
        await this.chainReactionHandler.init();
        this.chainReactionHandler.setEngines(this.matchEngine, this.eliminationProcessor);
        
        // 设置连锁反应回调
        this.chainReactionHandler.setCallbacks({
            onScoreUpdate: (score: number) => this.addScoreByValue(score),
            onMoveDown: () => this.checkMoveDown(),
            onResultCheck: () => this.checkResult(),
            onAnimationComplete: () => Promise.all(this.flyingItemPromises).then(() => {
                this.flyingItemPromises = [];
            })
        });
        
        console.log('[GameViewCmpt] 新匹配引擎系统初始化完成');
    }

    /**
     * 新的匹配检测方法 - 替换原有的startCheckThree方法
     */
    private async newMatchDetection(callback?: Function): Promise<boolean> {
        if (!this.matchEngine || !this.eliminationProcessor) {
            console.warn('[GameViewCmpt] 匹配引擎未初始化，使用原有算法');
            return false;
        }
        
        // 使用新的匹配引擎检测匹配
        const matchResult = this.matchEngine.findMatches(this.blockArr);
        
        if (matchResult.hasMatches) {
            console.log(`[GameViewCmpt] 检测到 ${matchResult.matches.length} 个匹配组`);
            
            // 调用回调函数
            if (callback) {
                callback(true);
            }
            
            // 处理匹配结果
            await this.eliminationProcessor.processMatchResult(
                matchResult,
                this.blockArr,
                (score: number) => {
                    this.addScoreByValue(score);
                }
            );
            
            return true;
        }
        
        if (callback) {
            callback(false);
        }
        return false;
    }

    onDestroy() {
        // 清理事件监听器
        if (App.event) {
            App.event.off(EventName.Game.UpdateUserIcon, this.updateUserIcon, this);
            App.event.off(EventName.Game.HeartUpdate, this.updateHeartDisplay, this);
        }
        super.onDestroy && super.onDestroy();
    }
}