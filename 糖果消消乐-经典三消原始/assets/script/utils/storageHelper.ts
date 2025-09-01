import { sys } from "cc";
import { App } from "../core/app";
import { Net } from "../net/net";
import { Router } from "../net/routers";
import { PrintError } from "./logHelper";

/** 本地储存key */
class StorageKey {
    Icon = 'Icon';
    Audio_Open = 'Audio_Open';
    Audio_Volume = 'Audio_Volume';
    /** 背景音乐开关 */
    Music_Status = "Music_Status";
    /** 音效开关 */
    Music_Eff_Status = "Music_Eff_Status";
    /** 震动开关 */
    Zhen_Dong_Status = "Zhen_Dong_Status";
    /** 记录 */
    Level = "Level";
    /** 星数 */
    StarScore = "StarScore";
    /** 星数奖励 */
    StarReward = "StarReward";
    /** 等级奖励 */
    LevelReward = "LevelReward";
    /** 金币 */
    Gold = "Gold";
    /** 刷新道具  */
    RefreshTools = "RefreshTools";
    /** 时间道具 */
    ToolTime = "ToolTime";
    /** 撤回道具 */
    ToolReturn = "ToolReturn";
    /** 星级宝箱索引 */
    StarBoxIndex = "StarBoxIndex";
    Guide = "Guide";
    /** 星级 */
    Star = "Star";
    /** 炸弹 */
    BombHor = "BombHor";
    BombVer = "BomVerr";
    BombBomb = "BombBomb";
    BombAllSame = "BombAllSame";
    Heart = "Heart";
}

class Helper {
    /** 初始化一些必要的设置 */
    initData() {
        if (!this.getData(StorageHelperKey.Icon)) {
            this.setData(StorageHelperKey.Icon, 1)
        }
        //背景音乐
        if (!this.getData(StorageHelperKey.Music_Status)) {
            this.setBooleanData(StorageHelperKey.Music_Status, true)
        }
        //音效
        if (!this.getData(StorageHelperKey.Music_Eff_Status)) {
            this.setBooleanData(StorageHelperKey.Music_Eff_Status, true)
        }
        //震动
        if (!this.getData(StorageHelperKey.Zhen_Dong_Status)) {
            this.setBooleanData(StorageHelperKey.Zhen_Dong_Status, true)
        }
        // 关卡
        if (!this.getData(StorageHelperKey.Level)) {
            this.setData(StorageHelperKey.Level, 1)
            App.gameLogic.curLevel = 1;
        }
        // 金币
        if (!this.getData(StorageHelperKey.Gold)) {
            this.setData(StorageHelperKey.Gold, 500)
        }
        // 提示道具
        if (!this.getData(StorageHelperKey.RefreshTools)) {
            this.setData(StorageHelperKey.RefreshTools, 4)
        }
        // 时间道具
        if (!this.getData(StorageHelperKey.ToolTime)) {
            this.setData(StorageHelperKey.ToolTime, 4)
        }
        // 撤回道具
        if (!this.getData(StorageHelperKey.ToolReturn)) {
            this.setData(StorageHelperKey.ToolReturn, 4)
        }
        // 星级宝箱索引
        if (!this.getData(StorageHelperKey.StarBoxIndex)) {
            this.setData(StorageHelperKey.StarBoxIndex, 0)
        }
        /** 炸弹 */
        if (!this.getData(StorageHelperKey.BombHor)) {
            this.setData(StorageHelperKey.BombHor, 3)
        }
        if (!this.getData(StorageHelperKey.BombVer)) {
            this.setData(StorageHelperKey.BombVer, 3)
        }
        if (!this.getData(StorageHelperKey.BombBomb)) {
            this.setData(StorageHelperKey.BombBomb, 3)
        }
        if (!this.getData(StorageHelperKey.BombAllSame)) {
            this.setData(StorageHelperKey.BombAllSame, 3)
        }
        if (!this.getData(StorageHelperKey.Heart)) {
            this.setData(StorageHelperKey.Heart, 3)
        }

    }

    getBooleanData(key: string, defData?: any) {
        let data = this.getData(key, defData);
        if (!data) {
            return false;
        }
        return !!+data;
    }

    setBooleanData(key: string, defData: boolean) {
        // '1'表示true, '0'表示false
        let data = defData ? '1' : '0';
        this.setData(key, data);
        if (key == StorageHelperKey.Music_Status) {
            if (defData) {
                App.audio.resumeMusic();
            }
            else {
                App.audio.stopMusic();
            }
        }
    }

    getData<T>(key: string, defData?: T): any {
        if (!key) {
            PrintError("StorageHelper 存储的key不能为空");
            return;
        }

        let data = sys.localStorage.getItem(key);
        if (!data) {
            return defData;
        }

        let pObject: T;
        try {
            pObject = JSON.parse(data);
        } catch (e) {
            PrintError(`解析失败, data=${data}`);
            pObject = null;
        }
        if (pObject) {
            return pObject
        }
        return data;
    }

    setData(key: string, data: any) {
        if (!key) {
            PrintError("StorageHelper 存储的key不能为空");
            return;
        }
        if (!data && data != 0) {
            PrintError("StorageHelper not data");
            return;
        }

        let dataStr: string = '';
        try {
            dataStr = JSON.stringify(data);
        } catch (e) {
            PrintError(`解析失败, data=${data}`);
            dataStr = null;
        }
        if (dataStr) {
            data = dataStr;
        }
        sys.localStorage.setItem(key, data);
    }
}

export let StorageHelper = new Helper();
export let StorageHelperKey = new StorageKey();