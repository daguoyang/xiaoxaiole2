import { js, Node, Sprite, sys } from "cc";
import { App } from "../core/app";
import { StorageHelper, StorageHelperKey } from "./storageHelper";

class Helper {
    /** 数组内随机一个 */
    arrayRandomItem<T>(array: T[]): T {
        if (!Array.isArray(array)) {
            return array;
        }
        return array[Math.ceil(Math.random() * array.length) - 1];
    }

    /** 获取随机字符 */
    getRandomCode() {
        let random = ToolsHelper.getRandom(0, 10);
        let code;
        if (random < 3) {
            /** a-z */
            code = String.fromCodePoint(ToolsHelper.getRandom(97, 122));
        } else if (random < 6) {
            /** A-Z */
            code = String.fromCodePoint(ToolsHelper.getRandom(65, 90));
        } else {
            /** 0~9 */
            code = String.fromCodePoint(ToolsHelper.getRandom(48, 57))
        }
        return code;
    }

    weightedRandom<T>(weights: number[], values: T[]): T | null {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const randomValue = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulativeWeight += weights[i];
            if (randomValue <= cumulativeWeight) {
                return values[i];
            }
        }

        return null;
    }

    /**
     * 根据金额获取对应的筹码金额集合
     * @param money 金额
     * @param chipsRange 筹码金额范围
     * @returns 
     */
    getChipsByMoney(money: number, chipsRange: number[]) {
        let chips: number[] = [];
        for (let i = chipsRange.length - 1; i >= 0; i--) {
            let tempChips = chipsRange[i];
            if (tempChips > money) {
                continue;
            }
            let count = Math.floor(money / tempChips);
            if (count < 1) {
                continue;
            }
            while (count-- > 0) {
                chips.push(chipsRange[i]);
            }
            money = money % tempChips;
            if (money === 0) {
                break;
            }
        }
        return chips;
    }

    /**
     * 获取随机区间
     * @param min 
     * @param max 
     * @param isClosed 是否闭区间 [min, max]
     * @returns 
     */
    getRandom(min: number, max: number, isClosed = true) {
        let differ = isClosed ? max - min + 1 : max - min;
        let random = Math.random() * differ
        return Math.floor(random + min)
    }

    /** 随机小数 */
    getRandf(min: number, max: number): number {
        let r = Math.random()
        let a = r * (Math.round(Math.random()) ? -1 : 1)
        return (a / 2 + 0.5) * (max - min) + min
    }

    /** 将时间转位时分秒 00:00:00*/
    toSecBySeconds(s: number) {
        if (s <= 0) {
            return "00:00:00";
        }
        let t = this.toMinBySeconds(s);
        t += ":"
        let sec = Math.floor(s % 60);
        if (sec < 10) {
            t += "0"
        }
        t += sec.toFixed(0)
        return t;
    }

    /** 将时间转位时分 00:00*/
    toMinBySeconds(s: number) {
        if (s <= 0) {
            return "00:00";
        }
        let t = '';
        let hour = Math.floor(s / 3600);
        let min = Math.floor(s / 60) % 60;
        if (hour < 10) {
            if (hour > 0) {
                t = '0' + hour + ":";
            } else {
                t = '00:';
            }
        } else {
            t = hour + ":";
        }
        if (min < 10) {
            t += "0"
        }
        t += min;
        return t;
    }
    /** 将时间转位时分 00:00*/
    toMinBySeconds2(s: number) {
        if (s <= 0) {
            return "00:00";
        }
        let t = '';
        let hour = Math.floor(s / 3600);
        let min = Math.floor(s / 60) % 60;
        if (min < 10) {
            if (min > 0) {
                t = '0' + min + ":";
            } else {
                t = '00:';
            }
        } else {
            t = min + ":";
        }
        let sec = Math.floor(s % 60);
        if (sec < 10) {
            t += "0"
        }
        t += sec.toFixed(0);
        return t;
    }

    /** 得到时间的天/时/分/秒 */
    toDayHourBySeconds(seconds: number): any {
        let res = { day: 0, h: 0, m: 0, s: 0 }
        if (seconds < 0) return res;
        let days = Math.floor(seconds / 86400);
        seconds %= 86400;
        let hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        seconds %= 60;

        res = { day: days, h: hours, m: minutes, s: seconds }
        return res;
    }

    /** 年月日时分秒 */
    toFullTimeData(seconds: number) {
        let dt: Date = new Date(seconds * 1000);
        return {
            y: dt.getFullYear(),
            m1: dt.getMonth() + 1,
            d: dt.getDate(),
            h: dt.getHours(),
            m2: dt.getMinutes(),
            s: dt.getSeconds(),
        }
    }

    /** 复制Map */
    cloneMap<T, K>(oldMap: Map<T, K>) {
        if (!(oldMap instanceof Map)) return null;
        let newMap: Map<T, K> = new Map();
        for (const [k, v] of oldMap) {
            let newV: any;
            if (v instanceof Map) {
                newV = this.cloneMap(v);
            } else {
                newV = v;
            }
            newMap.set(k, newV);
        }
        return newMap;
    }

    /** 复制对象 */
    cloneObject<T>(oldObj: T) {
        return JSON.parse(JSON.stringify(oldObj));
    }

    /**
     * 金额显示千分位格式化
     * @param num 金额需要除以100转成元
     * @returns 
     */
    moneyToThousands(num: number): string {
        num = num / 100;
        let numStr = parseFloat((num + "").replace(/[^\d\.-]/g, "")).toFixed(2) + "";
        let l = numStr.split(".")[0].split("").reverse();
        let r = numStr.split(".")[1];
        let t = "";
        for (let i = 0; i < l.length; i++) {
            t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
        }
        return t.split("").reverse().join("") + "." + r;
    }
    /**
     * 金额显示万分位格式化
     * @param num 金额需要除以10000转成元
     * @returns 
     */
    moneyToMillion(num: number): string {
        num = num / 10000;
        let numStr = parseFloat((num + "").replace(/[^\d\.-]/g, "")).toFixed(2) + "";
        let l = numStr.split(".")[0].split("").reverse();
        let r = numStr.split(".")[1];
        let t = "";
        for (let i = 0; i < l.length; i++) {
            t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
        }
        return t.split("").reverse().join("") + "." + r;
    }

    getCurTime() {
        var date = new Date();
        var Y = date.getFullYear() + '-';
        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        var D = date.getDate() + ' ';
        var h = date.getHours() + ':';
        var m = date.getMinutes() + ':';
        var s = date.getSeconds();
        return Y + M + D + h + m + s + ":>>";
    }

    /** 计时器管理 */
    _timeoutIdTab: Map<number, number[]> = new Map();;
    /** 延迟执行 */
    async delayTime(time: number = 0, cmptID = 0) {
        if (!this._timeoutIdTab.has(cmptID)) {
            this._timeoutIdTab.set(cmptID, []);
        }
        let idArr = this._timeoutIdTab.get(cmptID);
        let timeoutId;
        await new Promise(r => {
            timeoutId = setTimeout(r, time * 1000);
            idArr.push(timeoutId);
        })
        // 清除计时器
        let idx = idArr.indexOf(timeoutId)
        ~idx && idArr.splice(idx, 1)
    }

    clearDelayTime(cmptID = 0) {
        if (!this._timeoutIdTab.has(cmptID)) return;
        let idArr = this._timeoutIdTab.get(cmptID);
        idArr.forEach(timeId => { clearTimeout(timeId) });
    }

    /** 创建唯一token */
    getUUid(): string {
        // let uuid: string = StorageHelper.getData(StorageHelperKey.DeviceUUID);
        // if (uuid) return uuid;
        // return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        //     let r = Math.random() * 16 | 0;
        //     return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        // });
        return "";
    }

    /** 匹配汉字 */
    matchChinese(str: string): boolean {
        var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
        return reg.test(str);
    }

    /** 匹配字符串中的字母和数字 */
    matchLetterNumber(str: string): string[] {
        let reg = /[a-zA-Z0-9]*/g;
        let arr = str.match(reg);
        return arr;
    }

    /** 匹配html元素，<开头，>结尾 的所有内容 */
    matchHtmlElement(str: string): string[] {
        let reg1 = /<([^>]+)>/g
        let arr = str.match(reg1)
        return arr;
    }

    /** 检查账号是否存在 */
    checkAccountExist(): { account: string, pwd: string } {
        // let data: { account: string, pwd: string } = StorageHelper.getData(StorageHelperKey.Account_Password);
        // if (data && !js.isEmptyObject(data)) {
        //     return data;
        // }
        return null;
    }

    /** 匹配字符串中的html元素 */
    matchHtmlContent(str: string) {
        const regex = /<([a-zA-Z]+)[^>]*>([^<]*)<\/\1>/g;
        let m = str;
        return m.match(regex) ? true : false;
    }


    /** 显示/隐藏清除按钮 */
    showClearEditContentBtn(str: string, btn: Node) {
        if (str.trim() != "") {
            btn.active = true;
        }
        else {
            btn.active = false;
        }
    }

    /** 匹配剪贴板中的特定内容 */
    matchClipboardContent(str: string): string {
        let reg = /Nuggets-Share=.*?/
        if (reg.test(str)) {
            return str;
        }
        return "";
    }

    /** 匹配数字 */
    matchNumber(str: string): string[] {
        let reg = /\d+/g;
        return str.match(reg);
    }

    /** 格式化时间，返回格式 2023/06/19  12:25:20 */
    getFullTime(time: number) {
        let fullDate = this.toFullTimeData(time);
        let m1 = fullDate.m1 > 9 ? fullDate.m1 : "0" + fullDate.m1;
        let d = fullDate.d > 9 ? fullDate.d : "0" + fullDate.d;
        let h = fullDate.h > 9 ? fullDate.h : "0" + fullDate.h;
        let m2 = fullDate.m2 > 9 ? fullDate.m2 : "0" + fullDate.m2;
        let s = fullDate.s > 9 ? fullDate.s : "0" + fullDate.s;
        let timeStr = fullDate.y + "/" + m1 + "/" + d + " " + h + ":" + m2 + ":" + s;
        return timeStr;
    }

    /** 多语言货币单位 */
    getMoneyByContry(gold: number): string {
        let money = ToolsHelper.moneyToThousands(gold)
        let moneyType = this.getMoneyType();
        return moneyType + money;
    }

    /** 获取货币单位 */
    getMoneyType(): string {
        let moneyType = "R$";
        // switch (App.i18n.getLanguage()) {
        //     case LanguageKey['0']:
        //         moneyType = "R$";
        //         break
        //     case LanguageKey['1']:
        //         moneyType = "$";
        //         break
        //     case LanguageKey['2']:
        //         moneyType = "￥";
        //         break
        // }
        return moneyType;
    }

    /** 打开外部网页链接 */
    openUrl(url: string) {
        sys.openURL(url);
    }

    /** 转化角色名称，4个字符以后显示*** */
    convertRoleName(name: string) {
        let prefixStr: string = '';
        let prefixLen = 4;
        if (name.length > prefixLen) {
            prefixStr = name.substring(0, prefixLen);
        } else {
            prefixStr = name.substring(0, Math.floor(name.length * 0.5));
        }
        return `${prefixStr}***`;
    }
    /** 转化角色名称，指定个字符以后显示*** */
    convertRoleName2(name: string, count: number = 4) {
        let prefixStr: string = name;
        let prefixLen = count;
        if (name.length > prefixLen) {
            prefixStr = name.substring(0, prefixLen) + "***";
        }
        return prefixStr;
    }

    /** 检查2维数组 */
    reSet2DArray(arr) {
        let res = arr;
        if (!Array.isArray(arr[0])) {
            let temp = arr[0];
            res = [temp];
        }
        return res;
    }

    setNodeGray(node: Node, isGray: boolean) {
        let sp = node.getComponent(Sprite);
        if (sp) {
            sp.grayscale = isGray;
        }
        for (let i = 0; i < node.children.length; i++) {
            this.setNodeGray(node.children[i], isGray);
        }
    }

}
export let ToolsHelper = new Helper();