import { _decorator, Node, Vec3, Prefab, instantiate, v2, ScrollView, PageView } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { ScrollViewCmpt } from '../../components/scrollViewCmpt';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { CocosHelper } from '../../utils/cocosHelper';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { ResLoadHelper } from '../../utils/resLoadHelper';
import { StorageHelper, StorageHelperKey } from '../../utils/storageHelper';
import { ToolsHelper } from '../../utils/toolsHelper';
import { Advertise } from '../../wx/advertise';
import { adManager } from '../../ads/AdManager';
const { ccclass, property } = _decorator;

enum Pages {
    shop = 0,
    rank = 1,
    home = 2,
    share = 3,
    setting = 4
}


@ccclass('homeViewCmpt')
export class homeViewCmpt extends BaseViewCmpt {
    private scrollview: ScrollViewCmpt = null;
    private btnNode: Node = null;
    private localBtn: Node = null;
    private home: Node = null;
    private pageView: PageView = null;
    private isStart: boolean = false;
    private pageTime: number = 0.5;
    private head: Node = null;
    private lbCoin: Node = null;
    private lbLife: Node = null;
    private indicator: Node = null;
    private heartCountdownTimer: number = null;
    private PagesName = {
        "0": "shopBtn",
        "1": "rankBtn",
        "2": "homeBtn",
        "3": "shareBtn",
        "4": "settingBtn"
    }
    onLoad() {
        super.onLoad();
        this.btnNode = this.viewList.get("bottom/btn");
        this.pageView = this.viewList.get("page").getComponent(PageView);
        this.home = this.viewList.get("page/view/content/home");
        this.lbLife = this.viewList.get("page/view/content/home/top/life/lbLife");
        this.lbCoin = this.viewList.get("page/view/content/home/top/coin/lbCoin");
        this.head = this.viewList.get("page/view/content/home/top/head");
        this.indicator = this.viewList.get("indicator");
        this.localBtn = this.viewList.get("page/view/content/home/localBtn");
        this.localBtn.active = false;
        this.scrollview = this.viewList.get('page/view/content/home/scrollview').getComponent(ScrollViewCmpt);
        this.scrollview.node.on("scroll-to-top", this.scrollingToTop, this);
        
        // 隐藏商店按钮
        let shopBtn = this.btnNode.getChildByName('shopBtn');
        if (shopBtn) {
            shopBtn.active = false;
        }
        
        // 设置默认显示home页面
        this.scheduleOnce(() => {
            this.setDefaultPage();
        }, 0.1);
        
        App.event.on(EventName.Game.UpdataGold, this.initData, this);
        App.event.on(EventName.Game.Scrolling, this.evtScrolling, this);
        App.event.on(EventName.Game.Scrolling, this.evtScrolling, this);
        App.event.on(EventName.Game.UpdateUserIcon, this.updateUserIcon, this);
        App.event.on(EventName.Game.HeartUpdate, this.updateHeartInfo, this);
        this.pageView.node.on('page-turning', this.evtPageView, this);
    }

    onDestroy() {
        super.onDestroy();
        App.event.off(EventName.Game.UpdataGold, this.initData, this);
        App.event.off(EventName.Game.Scrolling, this.evtScrolling, this);
        App.event.off(EventName.Game.UpdateUserIcon, this.updateUserIcon, this);
        App.event.off(EventName.Game.HeartUpdate, this.updateHeartInfo, this);
        
        // 清理体力倒计时定时器
        if (this.heartCountdownTimer) {
            clearInterval(this.heartCountdownTimer);
            this.heartCountdownTimer = null;
        }
        
        // 清理滚动视图事件监听
        if (this.scrollview && this.scrollview.node && this.scrollview.node.isValid) {
            this.scrollview.node.off("scroll-to-top", this.scrollingToTop, this);
        }
        
        // 清理页面视图事件监听
        if (this.pageView && this.pageView.node && this.pageView.node.isValid) {
            this.pageView.node.off('page-turning', this.evtPageView, this);
        }
    }
    async loadExtraData(isStart: boolean, pageIndex: number = Pages.home) {
        App.view.closeView(ViewName.Single.eLoadingView);
        App.view.closeView(ViewName.Single.eGameView);
        App.view.closeView(ViewName.Single.eAcrossView);

        this.isStart = isStart;
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == pageIndex;
        });
        console.log("this.PagesName[`${pageIndex}`]   " + this.PagesName[`${pageIndex}`])
        this.showSelectedBtn(this.PagesName[`${pageIndex}`]);
        this.initData();//shetting里面初始化事件触发
        Advertise.showBannerAds();
    }
    
    setDefaultPage() {
        console.log('设置默认显示home页面');
        let pages = this.pageView.getPages();
        console.log('当前页面数量:', pages.length);
        
        // 隐藏商店页面内容，但保留在PageView中
        if (pages[0]) {
            pages[0].active = false; // 商店页面永远不显示
        }
        
        // 设置home页面为默认显示
        pages.forEach((item, idx) => {
            if (idx === Pages.home) {
                item.active = true;
                console.log(`页面${idx}(home) active: true`);
            } else if (idx !== Pages.shop) {
                item.active = false;
                console.log(`页面${idx} active: false`);
            }
        });
        
        this.showSelectedBtn('homeBtn');
        this.pageView.scrollToPage(Pages.home, 0);
        
        // 为体力区域添加点击事件
        if (this.lbLife && this.lbLife.parent) {
            this.lbLife.parent.on(Node.EventType.TOUCH_END, this.onClickHeart, this);
        }
        
        // 开始体力倒计时显示
        this.startHeartCountdown();
        
        // 初始化定位头像按钮的头像
        this.updateLocalBtnIcon();
    }

    async initData() {
        if (!this.home.active) return;
        let list = [];
        let lv = LevelConfig.getCurLevel();
        let index = Math.ceil(lv / 8) + 4;
        for (let i = index; i >= 1; i--) {
            list.push(i);
        }
        this.scrollview.content.removeAllChildren();
        this.scrollview.initData({ list: list, target: this });
        let offsetY = this.scrollview.getMaxScrollOffset().y;
        this.scrollview.scrollToOffset(v2(0, offsetY - Math.floor(lv / 8) * 1024), 1);
        this.continueGame();
        this.setHomeInfo();
    }

    setHomeInfo() {
        CocosHelper.updateUserHeadSpriteAsync(this.head, App.user.rankData.icon);
        CocosHelper.updateLabelText(this.lbCoin, GlobalFuncHelper.getGold());
        this.updateHeartInfo();
        this.hideIndicator();
        // 更新定位头像按钮
        this.updateLocalBtnIcon();
    }

    /** 更新体力信息 */
    updateHeartInfo() {
        // 直接调用倒计时更新方法
        this.updateHeartCountdown();
    }

    /** 开始体力倒计时显示 */
    startHeartCountdown() {
        // 立即更新一次
        this.updateHeartCountdown();
        
        // 每秒更新倒计时
        this.heartCountdownTimer = setInterval(() => {
            this.updateHeartCountdown();
        }, 1000);
    }

    /** 更新体力倒计时显示 */
    updateHeartCountdown() {
        const currentHeart = App.heart.getCurrentHeart();
        const maxHeart = App.heart.getMaxHeart();
        
        if (currentHeart >= maxHeart) {
            // 体力已满
            CocosHelper.updateLabelText(this.lbLife, `${currentHeart}/${maxHeart}`);
        } else {
            // 体力未满，显示当前体力和倒计时
            const recoverTime = App.heart.formatRecoverTime();
            CocosHelper.updateLabelText(this.lbLife, `${currentHeart}/${maxHeart}\n${recoverTime}`);
        }
    }

    /** 隐藏红色感叹号指示器 */
    hideIndicator() {
        if (this.indicator) {
            this.indicator.active = false;
            console.log('红色感叹号已隐藏');
        }
    }

    /** 更新用户头像 */
    updateUserIcon(icon: number) {
        App.user.rankData.icon = icon;
        CocosHelper.updateUserHeadSpriteAsync(this.head, icon);
        // 同步更新定位头像按钮
        this.updateLocalBtnIcon();
    }
    
    /** 更新定位头像按钮的头像 */
    updateLocalBtnIcon() {
        if (this.localBtn) {
            CocosHelper.updateUserHeadSpriteAsync(this.localBtn, App.user.rankData.icon);
        }
    }

    continueGame() {
        if (!this.isStart) return;
        this.scheduleOnce(() => {
            let lv = App.gameLogic.curLevel;
            App.view.openView(ViewName.Single.eChallengeView, lv);
        }, 1);
    }

    evtScrolling(node: Node) {
        let off1 = this.scrollview.getScrollOffset().y;
        let offsetY = this.scrollview.getMaxScrollOffset().y;
        let lv = App.gameLogic.curLevel;
        let off2 = offsetY - Math.floor(lv / 8) * 1024;
        let gap = Math.abs(off1 - off2);
        this.localBtn.active = gap > 1300;
    }

    /** 滚动到顶端了，给个解锁更多的提示 */
    async scrollingToTop() {
        App.view.showMsgTips("先完成前面关卡即可解锁更多关卡");
    }

    onClick_localBtn() {
        App.audio.play('button_click');
        let offsetY = this.scrollview.getMaxScrollOffset().y;
        let lv = App.gameLogic.curLevel;
        this.scrollview.scrollToOffset(v2(0, offsetY - Math.floor(lv / 8) * 1024), 1);
        this.localBtn.active = false;
    }

    onClick_head() {
        App.audio.play('button_click');
        this.showSelectedBtn('settingBtn');
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.setting;
        });
    }


    onClick_settingBtn(node: Node) {
        App.audio.play('button_click');
        this.showSelectedBtn(node.name);
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.setting;
        });
        this.pageView.scrollToPage(Pages.setting, this.pageTime);
    }
    
    // 商店按钮点击事件（禁用）
    onClick_shopBtn(node: Node) {
        console.log('商店功能已禁用');
        // 不执行任何操作，商店功能已移除
    }
    onClick_homeBtn(node: Node) {
        App.audio.play('button_click');
        this.showSelectedBtn(node.name);
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.home;
        });
        this.pageView.scrollToPage(Pages.home, this.pageTime);
        if (this.scrollview.content.children.length < 1) {
            this.initData();
        }
    }
    onClick_rankBtn(node: Node) {
        App.audio.play('button_click');
        this.showSelectedBtn(node.name);
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.rank;
        });
        this.pageView.scrollToPage(Pages.rank, this.pageTime);
    }
    onClick_shareBtn(node: Node) {
        App.audio.play('button_click');
        this.showSelectedBtn(node.name);
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.share;
        });
        this.pageView.scrollToPage(Pages.share, this.pageTime);
    }

    showSelectedBtn(n: string) {
        this.btnNode.children.forEach(item => {
            item.getChildByName("s").active = n == item.name;
            item.getChildByName("n").active = n != item.name;
        })
    }

    evtPageView(pv: PageView) {
        let pageIndex = pv.getCurrentPageIndex();
        
        // 阻止访问商店页面，自动跳转到home页面
        if (pageIndex == Pages.shop) {
            console.log('阻止访问商店页面，跳转到home页面');
            pv.scrollToPage(Pages.home, 0.2);
            this.showSelectedBtn('homeBtn');
            return;
        }
        
        // 更新按钮选中状态
        this.showSelectedBtn(this.PagesName[`${pageIndex}`]);
        
        if (pageIndex == Pages.home) {
            this.setHomeInfo();
        }
    }

    onClick_sharePageBtn() {
        App.audio.play('button_click');
        App.event.emit(EventName.Game.Share, LevelConfig.getCurLevel());
    }

    /** 点击体力区域 */
    async onClickHeart() {
        App.audio.play('button_click');
        
        const currentHeart = App.heart.getCurrentHeart();
        const maxHeart = App.heart.getMaxHeart();
        
        if (currentHeart >= maxHeart) {
            App.view.showMsgTips("体力已满！");
            return;
        }
        
        // 显示体力恢复时间和广告获取选项
        const recoverTime = App.heart.formatRecoverTime();
        const result = await adManager.showRewardedAd();
        
        if (result === 'completed') {
            // 观看广告成功，增加1点体力
            App.heart.addHeart(1);
            App.view.showMsgTips("观看广告成功！获得体力 +1");
        } else {
            // 广告未完整观看，显示恢复时间提示
            App.view.showMsgTips(`${recoverTime}`);
        }
    }

}