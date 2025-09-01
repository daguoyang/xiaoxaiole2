import { _decorator, Component, Node } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { ScrollViewCmpt } from '../../components/scrollViewCmpt';
import { RankData } from '../../const/enumConst';
import { LevelConfig } from '../../const/levelConfig';
import { RankConfig } from '../../const/rankConfig';
import { App } from '../../core/app';
import { Net } from '../../net/net';
import { Router } from '../../net/routers';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { StorageHelper, StorageHelperKey } from '../../utils/storageHelper';
import { rankItemCmpt } from './item/rankItemCmpt';
const { ccclass, property } = _decorator;

@ccclass('rankCmpt')
export class RankCmpt extends BaseViewCmpt {
    private scrollView: ScrollViewCmpt = null;
    onLoad() {
        super.onLoad();
        this.scrollView = this.viewList.get('rankScroll').getComponent(ScrollViewCmpt);
        this.initData();
    }

    initData() {
        this.evtRankList(null);
    }

    evtRankList(data) {
        let list: RankData[] = [];
        let rdt: RankData = {
            star: GlobalFuncHelper.getGold(),
            id: 0,
            level: LevelConfig.getCurLevel(),
            icon: GlobalFuncHelper.getIcon(),
            name: App.user.rankData.name,
            time: "",
            rank: 0,
        }
        list.push(rdt);
        this.setRankList(list);
    }

    setRankList(list?: RankData[]) {
        let arr = RankConfig.data;
        if (list) {
            arr = arr.concat(list);
        }
        arr.sort((a, b) => { return -a.level + b.level });
        for (let i = 0; i < arr.length; i++) {
            arr[i].rank = i + 1;
        }

        if (!this.scrollView) {
            this.scrollView = this.viewList.get('rankScroll').getComponent(ScrollViewCmpt);
        }
        this.scrollView.initData({ list: arr, target: this });
        this.scrollView.scrollToTop(1);
    }
}


