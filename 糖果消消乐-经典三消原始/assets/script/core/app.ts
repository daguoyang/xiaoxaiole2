// import { NetManager } from "../network/netManager";
import { SingletonClass } from "./singletonClass";
import { I18nManager } from "./i18nManager";
import { EventManager } from "./eventManager";
import { ViewManager } from "./viewManager";
import { AudioManager, SoundType } from "./audioManager";
import { SubGameManager } from "./subGameManager";
import { PlatformManager } from "./platformManager";
import { UserInfo } from "./userInfo";
import { NoticeManager } from "./noticeManager";
import { StorageHelper } from "../utils/storageHelper";
import TimeManager from "./timeManager";
import { GameLogic } from "../game/logic/gameLogic";
import { WxMgr } from "../wx/wxManager";
import { Prefab, sys } from "cc";
import { ResLoadHelper } from "../utils/resLoadHelper";
import { ViewName } from "../const/viewNameConst";
/**
 * App管理
 */
class GameApp extends SingletonClass<GameApp> {
    get user() { return UserInfo.getInstance<UserInfo>(UserInfo); }
    get platform() { return PlatformManager.getInstance<PlatformManager>(PlatformManager); }
    get subGame() { return SubGameManager.getInstance<SubGameManager>(SubGameManager); }
    get view() { return ViewManager.getInstance<ViewManager>(ViewManager); }
    get event() { return EventManager.getInstance<EventManager>(EventManager); }
    // get net() { return NetManager.getInstance<NetManager>(NetManager); }
    get audio() { return AudioManager.getInstance<AudioManager>(AudioManager); }
    get i18n() { return I18nManager.getInstance<I18nManager>(I18nManager); }
    get notice() { return NoticeManager.getInstance<NoticeManager>(NoticeManager); }
    get timer() { return TimeManager.getInstance<TimeManager>(TimeManager); }
    get gameLogic() { return GameLogic.getInstance<GameLogic>(GameLogic); }

    protected async onInit(canvas: Node) {
        // this.net.init();
        // this.i18n.init();
        // this.subGame.init();
        // this.platform.init();
        App.user.init();
        this.audio.init(canvas);
        this.view.init(canvas);
        this.timer.init();
        this.gameLogic.init();
        StorageHelper.initData();
        WxMgr.init();
    }

    addEvent() {
        // view.setResizeCallback(this.evtResizeCallback.bind(this));
    }

    backHome(isStart: boolean = false, pageIdx: number = 2) {
        // App.view.closeView(ViewName.Single.eGameView);
        App.view.openView(ViewName.Single.eHomeView, isStart, pageIdx);
        App.audio.play('background', SoundType.Music, true);
    }

    setBackLobby() {
        // this.subGame.closeGame();
        this.platform.changeOrientation(false);
    }

    //窗口大小变化监听
    evtResizeCallback() {
        // App.event.emit(EventName.Lobby.SCROLLING);
    }

    // async showTips(str: string) {
    //     let pre = await ResLoadHelper.loadCommonAssetSync('ui/tipsView', Prefab);

    // }
}

export const App: GameApp = GameApp.getInstance<GameApp>(GameApp);
// 原生调js需要
window["JsApp"] = App;



