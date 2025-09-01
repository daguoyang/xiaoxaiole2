import { js, JsonAsset } from "cc";
import { App } from "../core/app";
import { ResLoadHelper } from "../utils/resLoadHelper";
import { StorageHelper, StorageHelperKey } from "../utils/storageHelper";
import { LevelData } from "./enumConst";

class config {
    /** 下一关，并本地缓存已通过关卡 */
    nextLevel() {
        let lv = +this.getCurLevel();
        StorageHelper.setData(StorageHelperKey.Level, lv + 1);
        App.gameLogic.curLevel = lv + 1;
    }

    getCurLevel() {
        return +StorageHelper.getData(StorageHelperKey.Level, 1);
    }

    async getLevelData(id: number | string): Promise<LevelData> {
        let data = await this.getGridData(id);
        // 直接返回原始数据，让视图层处理ID映射
        return data;
    }

    handleIdArr(id: number) {
        let numObj = {
            "50": 0,
            "51": 1,
            "100": 2,
            "201": 3,
            "208": 4,
            "420": 0,
            "400": 1,
            "404": 2,
            "409": 3,
            "410": 4,
            "411": 0,
            "412": 1,
            "413": 2,
            "415": 3,
            "416": 4,
            "417": 0,
            "418": 1,
            "423": 2,
        }
        return numObj[`${id}`] || 0;
    }

    async getGridData(id: number | string): Promise<LevelData> {
        if (id > 1700) id = 1700;
        let json: JsonAsset = await ResLoadHelper.loadCommonAssetSync(`config/${id}`, JsonAsset);
        let loadData = json['json'] as LevelData;
        return loadData;
    }

    setLevelStar(lv: number, num: number) {
        StorageHelper.setData(StorageHelperKey.Star + lv, num)
    }
    getLevelStar(lv: number) {
        return +StorageHelper.getData(StorageHelperKey.Star + lv)
    }

    /**
     * 统一的目标数量计算方法（使用正确的游戏逻辑）
     * @param targetId 原始目标元素ID
     * @param targetCount 原始目标数量
     * @returns [修正后的ID, 修正后的数量]
     */
    calculateTargetInfo(targetId: number, targetCount: number): [number, number] {
        // 修复元素ID超出范围的问题
        let finalId = targetId;
        if (targetId >= 200) {
            finalId = (targetId - 200) % App.gameLogic.blockCount;
        } else if (targetId >= App.gameLogic.blockCount) {
            finalId = targetId % App.gameLogic.blockCount;
        }
        
        // 使用正确的目标数量计算逻辑（与挑战界面一致）
        let finalCount = targetCount + 10;
        if (targetCount < 10) {
            finalCount = targetCount + 30;
        }
        
        return [finalId, finalCount];
    }
}

export let LevelConfig = new config();