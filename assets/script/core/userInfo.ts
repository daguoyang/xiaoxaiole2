import { sys } from "cc";
import { RankData } from "../const/enumConst";
import { EventName } from "../const/eventName";
import { Router } from "../net/routers";
import { GlobalFuncHelper } from "../utils/globalFuncHelper";
import { StorageHelper, StorageHelperKey } from "../utils/storageHelper";
import { App } from "./app";
import { SingletonClass } from "./singletonClass";

/**
 * 用户管理
 */
export class UserInfo extends SingletonClass<UserInfo> implements UserInfo {
    /** 排行数据 */
    public rankData: RankData = {
        star: 0,
        id: 0,
        level: 0,
        icon: GlobalFuncHelper.getIcon(),
        name: "",
        gold: 0,
        rank: 0,
        time: "",
    }

    public pid: number = 0;

    public updateRankData(data: RankData) {
        this.rankData = data;
    }

    init(...args: any[]): void {
        this.rankData.name = "Happy Barry";
        App.event.on(Router.rut_login, this.evtLogin, this)
    }

    evtLogin(data) {
        this.pid = data.msg.user.pid;
        console.log('-------------------- pid -------------------');
        console.log('-------------------- pid -------------------');
        console.log('-------------------- pid -------------------');
        console.log(this.pid);
    }
}//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999
