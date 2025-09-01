import { Bomb } from "../const/enumConst";
import { ViewName } from "../const/viewNameConst";
import { App } from "../core/app";
import { StorageHelper, StorageHelperKey } from "./storageHelper";

/**
 * 全局函数，复用多的功能函数独立出来
 */
class Helper {
    private debugInfo: string[] = [];
    private index: number = 0;

    /** debug info */
    pushDebugInfo(str: string) {
        this.debugInfo.push(str);
        if (this.debugInfo.length > 10000) {
            this.debugInfo.shift();
        }
    }

    getDebugInfo(): string[] {
        return this.debugInfo;
    }

    clearDebugInfo() {
        this.debugInfo.splice(0);
    }


    /** create and get index */
    public getTileIndex() {
        return this.index++;
    }

    /** 获取指定等级的星数 */
    getStarScore(lv?: number) {
        return +StorageHelper.getData(StorageHelperKey.StarScore, 0);

    }

    /** 设置指定等级的星数 */
    setStarScore(lv: number, score: number) {
        let cur = this.getStarScore();
        score += cur;
        return StorageHelper.setData(StorageHelperKey.StarScore, score);
    }
//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999

    /** 是否已领星级宝箱 */
    getStarReward(lv: number): boolean {
        return StorageHelper.getBooleanData(StorageHelperKey.StarReward + lv, false);

    }

    /** 设置已领取星级宝箱 */
    setStarReward(lv: number) {
        return StorageHelper.setBooleanData(StorageHelperKey.StarReward + lv, true);
    }

    /** 是否已领等级宝箱 */
    getLevelReward(lv: number): boolean {
        return false
    }

    /** 设置已领取等级宝箱 */
    setStLevelward(lv: number) {
    }

    getGold() {
        return +StorageHelper.getData(StorageHelperKey.Gold);
    }

    setGold(gold: number) {
        let curent = +this.getGold();
        StorageHelper.setData(StorageHelperKey.Gold, (gold + curent) + "");
    }

    getIcon() {
        return +StorageHelper.getData(StorageHelperKey.Icon, 1);
    }

    setIcon(icon: number) {
        StorageHelper.setData(StorageHelperKey.Icon, icon + "");
    }
    getHeart() {
        let hert = +StorageHelper.getData(StorageHelperKey.Heart, 1);
        if (hert < 0) hert = 0;
        return hert;
    }

    setHeart(heart: number) {
        let num = this.getHeart() + heart
        StorageHelper.setData(StorageHelperKey.Heart, num + "");
    }

    getBomb(type: Bomb) {
        switch (type) {
            case Bomb.hor:
                return +StorageHelper.getData(StorageHelperKey.BombHor);
            case Bomb.ver:
                return +StorageHelper.getData(StorageHelperKey.BombVer);
            case Bomb.bomb:
                return +StorageHelper.getData(StorageHelperKey.BombBomb);
            case Bomb.allSame:
                return +StorageHelper.getData(StorageHelperKey.BombAllSame);
        }
    }

    setBomb(type: Bomb, count: number) {
        let baseNum = this.getBomb(type);
        let ct = baseNum + count >= 0 ? baseNum + count : 0;
        switch (type) {
            case Bomb.hor:
                StorageHelper.setData(StorageHelperKey.BombHor, ct + "");
                break;
            case Bomb.ver:
                StorageHelper.setData(StorageHelperKey.BombVer, ct + "");
                break;
            case Bomb.bomb:
                StorageHelper.setData(StorageHelperKey.BombBomb, ct + "");
                break;
            case Bomb.allSame:
                StorageHelper.setData(StorageHelperKey.BombAllSame, ct + "");
                break;
        }
    }

    /** 显示失败界面 */
    showLoseView() {
        App.view.openView(ViewName.Single.eloseView);
    }

}

export let GlobalFuncHelper = new Helper();




