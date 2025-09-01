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
const { ccclass, property } = _decorator;

enum Pages {
    shop = 0,
    rank,
    home,
    share,
    setting
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
        this.localBtn = this.viewList.get("page/view/content/home/localBtn");
        this.localBtn.active = false;
        this.scrollview = this.viewList.get('page/view/content/home/scrollview').getComponent(ScrollViewCmpt);
        this.scrollview.node.on("scroll-to-top", this.scrollingToTop, this);
        App.event.on(EventName.Game.UpdataGold, this.initData, this);
        App.event.on(EventName.Game.Scrolling, this.evtScrolling, this);
        App.event.on(EventName.Game.Scrolling, this.evtScrolling, this);
        App.event.on(EventName.Game.GotoShop, this.evtGotoShop, this);
        this.pageView.node.on('page-turning', this.evtPageView, this);
    }

    onDestroy() {
        super.onDestroy();
        App.event.off(EventName.Game.UpdataGold, this);
    }
    async loadExtraData(isStart: boolean, pageIndex: number = 2) {
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
        CocosHelper.updateLabelText(this.lbLife, GlobalFuncHelper.getHeart());
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

    evtGotoShop() {
        this.showSelectedBtn('shopBtn');
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.shop;
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
    onClick_shopBtn(node: Node) {
        App.audio.play('button_click');
        this.showSelectedBtn(node.name);
        this.pageView.getPages().forEach((item, idx) => {
            item.active = idx == Pages.shop;
        });
        this.pageView.scrollToPage(Pages.shop, this.pageTime);
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
        if (pageIndex == 2) {
            this.setHomeInfo();
        }
    }

    onClick_sharePageBtn() {
        App.audio.play('button_click');
        App.event.emit(EventName.Game.Share, LevelConfig.getCurLevel());
    }

}