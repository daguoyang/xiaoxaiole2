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
        let list = [];
        for (let i = 0; i < data.mapData[0].m_id.length; i++) {
            let item = data.mapData[0].m_id[i];
            if (item > 5) {
                data.mapData[0].m_id[i] = this.handleIdArr(item);
            }
            let idx = list.indexOf(data.mapData[0].m_id[i]);
            if (idx < 0) {
                list.push(data.mapData[0].m_id[i])
            }
        };
        data.mapData[0].m_id = list;
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
}

export let LevelConfig = new config();