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
import { Prefab, sys, Node } from "cc";
import { ResLoadHelper } from "../utils/resLoadHelper";
import { ViewName } from "../const/viewNameConst";
import { adManager } from "../ads/AdManager";
import { HeartManager } from "./heartManager";
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
    get heart() { return HeartManager.getInstance<HeartManager>(HeartManager); }

    protected async onInit(canvas: Node) {
        console.log('[App] 🚀 开始快速启动初始化...');
        
        // 立即初始化基础系统
        App.user.init();
        this.audio.init(canvas);
        this.timer.init();
        this.gameLogic.init();
        StorageHelper.initData();
        this.heart.init();
        WxMgr.init();
        
        // 初始化广告管理系统
        this.initAdManager();
        
        // ⚡ 快速初始化：只加载核心分包，让用户尽快看到界面
        console.log('[App] ⚡ 快速加载核心资源...');
        await ResLoadHelper.initCoreBundle();
        
        // 现在可以安全地初始化视图管理器
        this.view.init(canvas);
        
        console.log('[App] ✅ 快速启动完成，UI可以显示了');
        
        // 立即在后台加载剩余的关键分包（level-configs），这是游戏核心功能必需的
        console.log('[App] 🔄 开始后台加载关键分包...');
        ResLoadHelper.loadRemainingBundles().then(() => {
            console.log('[App] ✅ 关键分包加载完成');
        }).catch(err => {
            console.error('[App] ❌ 关键分包加载失败:', err);
        });
    }

    /**
     * 初始化广告管理器
     */
    private initAdManager(): void {
        // 广告配置
        const adConfig = {
            // 🚨 上线前需要填入真实的广告位ID
            adUnitId: "adunit-7fc34b1dba8ed852", // 微信广告位ID
            mockDuration: 15,              // 模拟广告时长
            mockSkipDelay: 5,              // 5秒后允许跳过
            enableDebugLog: true           // 开启调试日志
        };
        
        // 🚨 开发阶段设置为 true，上线后改为 false
        const isDevelopment = false;
        
        // 初始化广告管理器
        adManager.init(adConfig, isDevelopment);
        
        console.log('🎮 [App] 广告系统初始化完成');
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



