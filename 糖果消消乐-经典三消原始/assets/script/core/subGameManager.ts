// import { ProtoMsgId } from "../../plugins/protoMsgId";
// import { EventName } from "../const/eventName";
// import { PrintError } from "../utils/logHelper";
// import { ResLoadHelper } from "../utils/resLoadHelper";
// import { ToolsHelper } from "../utils/toolsHelper";
// import { App } from "./app";
import { SingletonClass } from "./singletonClass"

// /** 游戏配置 */
// export interface ISubGameConfig {
//     isPortrait: boolean;
//     name: string;
//     isHundred: boolean;
// }

// /** 游戏分类 */
// export enum GameType {
//     eSlots,
//     eHundred,
// }

// /** 子游戏管理 */
export class SubGameManager extends SingletonClass<SubGameManager> {
    //     private gameId: number;
    //     private curBundle: cc.AssetManager.Bundle;
    //     private isWatchGame: boolean = false;
    //     private watchGameMsg: clientmsg.IGameInfo;
    //     private normalGameMsg: clientmsg.IEnterGameRes;

    //     private isJoinGaming: boolean = false;
    //     /** 进入小游戏超时倒计时 */
    //     private _joinTime: number = 0;

    //     /** 是否处在游戏中,观看录像时区别是大厅入口还是本游戏入口 */
    //     private isPlay: boolean = false;

    //     /** 子游戏配置 */
    //     private _subGameConfig: { [gameId: string]: ISubGameConfig };
    //     public get subGameConfig() {
    //         return this._subGameConfig;
    //     }

    //     get subGameId() {
    //         return this.gameId;
    //     }

    //     /** 是否正在游戏 */
    //     set isPlayGame(v: boolean) {
    //         this.isPlay = v;
    //     }
    //     get isPlayGame() {
    //         return this.isPlay;
    //     }

    //     /** 初始化 */
    //     protected async onInit(...args: any[]) {
    //         await this.loadConfig();
    //         this.addEvent();
    //     }

    //     addEvent() {
    //         App.event.on(EventName.Lobby.TIMER_DOWN, this.evtTimeDown, this);
    //         App.event.on(EventName.Lobby.NET_ERR, this.evtNetError, this);
    //     }

    //     /** 加载配置 */
    //     public async loadConfig() {
    //         let res: cc.JsonAsset = await ResLoadHelper.loadCommonAssetSync("config/subgame", cc.JsonAsset);
    //         this._subGameConfig = res.json;
    //     }

    //     addNoticeEvent() {
    //         App.net.addResponseHandler(ProtoMsgId.LeaveGameRes, this.onHandlerLeaveGameNtc, this);
    //     }

    //     private onHandlerLeaveGameNtc(msg: clientmsg.ILeaveGameRes) {
    //         if (!msg.errcode) {
    //             App.joinLobby(true);
    //         }
    //     }

    //     /** 准备进入游戏 */
    //     async joinGame(gameInfo: clientmsg.IGameInfo) {
    //         if (this.isJoinGaming) {
    //             App.view.showMsgTips("110")
    //             return false;
    //         }
    //         this._joinTime = App.timer.timeJoinGameConst;
    //         this.isJoinGaming = true;
    //         // 联网
    //         let isConnect = await this.connectGame(gameInfo);
    //         if (!isConnect) {
    //             PrintError(` joinGame fail not connectGame id=${gameInfo.gameId} `);
    //             App.user.lobbyInfo.gameId = 0;
    //             App.joinLobby();
    //             return false;
    //         }
    //         // 加载子游戏资源
    //         let gameBundle = await this.loadGame(gameInfo.gameId);
    //         this.isJoinGaming = false;
    //         if (!gameBundle) {
    //             PrintError(` joinGame fail not bundle id=${gameInfo.gameId} `);
    //             App.user.lobbyInfo.gameId = 0;
    //             App.joinLobby();
    //             return false;
    //         }
    //         ResLoadHelper.setBundle(gameBundle);
    //         this.isWatchGame = false;
    //         return true;
    //     }

    //     async watchGame(gameID: number, gameInfo: any) {
    //         this.watchGameMsg = gameInfo;
    //         let gameBundle = await this.loadGame(gameID);
    //         if (!gameBundle) {
    //             PrintError(` watchGame fail not bundle id=${gameID} `);
    //             return false;
    //         }
    //         ResLoadHelper.setBundle(gameBundle);
    //         this.isWatchGame = true;
    //         return true;
    //     }

    //     /** 连接游戏服 */
    //     async connectGame(gameInfo: clientmsg.IGameInfo) {
    //         let resData = await this.connectSlots(gameInfo);
    //         if (!resData || resData.errcode) {
    //             return false;
    //         }
    //         this.normalGameMsg = resData;
    //         return true;
    //     }

    //     /** 加载子游戏 */
    //     async loadGame(subGame: number) {
    //         let bundle = await App.platform.loadGame(subGame);
    //         if (!bundle) {
    //             return null;
    //         }

    //         this.gameId = subGame;
    //         this.curBundle = bundle;
    //         return bundle;
    //     }

    //     /** 启动子游戏 */
    //     async openGame() {
    //         let cfg = this.subGameConfig[this.gameId.toString()];
    //         if (!cfg) {
    //             PrintError(` openGame not cfg id=${this.gameId}`);
    //             return;
    //         }

    //         let msg = this.isWatchGame ? this.watchGameMsg : this.normalGameMsg;
    //         App.view.openView(`game${this.gameId}`, this.gameId, msg, this.isWatchGame);
    //         // 字游戏显示出来完在隐藏大厅
    //         App.event.emit(EventName.Lobby.GAME_LOADING, true, this.gameId);
    //     }

    //     /** 预加载游戏 */
    //     preloadGame() {
    //         ResLoadHelper.preloadAsset(`game${this.gameId}`, cc.Prefab);
    //     }

    //     /** 关闭游戏 */
    //     closeGame() {
    //         if (!this.gameId) return;
    //         ResLoadHelper.setBundle();
    //         App.view.closeView(`game${this.gameId}`);
    //         this.releaseGame();
    //         this.gameId = null;
    //         this.isPlay = false;
    //     }

    //     /** 玩家离开游戏 */
    //     async leaveGame() {
    //         // 不同游戏类型对应不同的路由接口
    //         this.disconnectSlots();
    //     }

    //     async releaseGame() {
    //         if (!this.curBundle) return;
    //         await ToolsHelper.delayTime(0.1);
    //         this.curBundle.releaseAll();
    //         cc.assetManager.removeBundle(this.curBundle);
    //     }

    //     /** 进入游戏 */
    //     private connectSlots(gameInfo: clientmsg.IGameInfo): Promise<clientmsg.IEnterGameRes> {
    //         let slotInfo: clientmsg.IEnterGameReq = {
    //             rid: App.user.loginInfo.rid,
    //             roomid: 1,
    //             gameid: gameInfo.gameId,
    //         }
    //         return new Promise(r => App.net.sendToResponse(ProtoMsgId.EnterGameReq, ProtoMsgId.EnterGameRes,
    //             slotInfo, { handler: r, target: this }));
    //     }

    //     /** 离开游戏 */
    //     private disconnectSlots() {
    //         let slotInfo: clientmsg.ILeaveGameReq = {
    //             rid: App.user.loginInfo.rid,
    //             gameid: this.gameId,
    //         }
    //         App.net.send(ProtoMsgId.LeaveGameReq, null, slotInfo);
    //     }

    //     /** 进入小游戏超时 */
    //     evtTimeDown() {
    //         this._joinTime--;
    //         if (this._joinTime < 0 && this.isJoinGaming) {
    //             this.closeGame();
    //             App.view.showMsgTips("111")
    //             this.isJoinGaming = false;
    //         }
    //     }

    //     /** 请求消息异常监听 */
    //     evtNetError(cmd: string) {
    //         if (cmd == ProtoMsgId.EnterGameRes) {
    //             this._joinTime = 0;
    //             this.isJoinGaming = false;
    //         }
    //     }

}