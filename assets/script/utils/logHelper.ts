import { js } from "cc";
import { GlobalFuncHelper } from "./globalFuncHelper";


class Helper {
    Is_Print_Log = true;
    printLog(...args) {
        let info = "log:  " + JSON.stringify([...arguments])
        GlobalFuncHelper.pushDebugInfo(info);
        if (!LogHelper.Is_Print_Log) return;
        let log = console.log || print
        log.call(this, "%c%s" + JSON.stringify([...arguments]), "color:#857F7F;", Helper.stack(2));
    }

    printNet(...args) {
        let info: string = "<color=#ff00ff>net:  " + JSON.stringify([...arguments]) + "</c>"
        GlobalFuncHelper.pushDebugInfo(info);
        if (!LogHelper.Is_Print_Log) return;
        let log = console.log || print
        log.call(this, "%c%s" + JSON.stringify([...arguments]), "color:#00D1FF;", Helper.stack(2));
    }

    printError(...args) {
        let info = `<color=#ff0000>err:  ${args}</c>`
        GlobalFuncHelper.pushDebugInfo(info);
        if (!LogHelper.Is_Print_Log) return;
        let log = console.log || print
        log.call(this, "%c%s" + js.formatStr.apply(cc, arguments), "color:red", Helper.stack(2));
        console.error("error trace");
    }

    /**
    * 获取打印这条日志的事件
    * @returns {string} 返回[年-月-日 时:分:秒]格式
    */
    getDateString(): string {
        let d = new Date();
        let timeStr = "";
        let str = String(d.getFullYear());
        timeStr += str + "-";
        str = String(d.getMonth());
        timeStr += str + "-";
        str = String(d.getDay());
        timeStr += str + " ";
        str = String(d.getHours());
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = String(d.getMinutes());
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = String(d.getSeconds());
        timeStr += (str.length == 1 ? "0" + str : str) + "";
        timeStr = "[" + timeStr + "]";
        return timeStr;
    }

    /**
     * 在堆栈中定位错误或者信息
     * @param index 定位的第几处错误
     * @returns 将定位的位置以类名+错误所在的位置输出
     * */
    static stack(index): string {
        let e = new Error();
        let lines = e.stack.split("\n");
        lines.shift();
        let result = [];
        lines.forEach(function (line) {
            line = line.substring(7);
            let lineBreak = line.split(" ");
            if (lineBreak.length < 2) {
                result.push(lineBreak[0]);
            } else {
                result.push({ [lineBreak[0]]: lineBreak[1] });
            }
        });

        let list = [];
        if (index < result.length - 1) {
            for (let a in result[index]) {
                list.push(a);
            }
        }
        let splitList = list[0].split(".");
        return (splitList[0] + "->" + splitList[1] + ": ");
    }
}

let LogHelper = new Helper();
export let PrintLog = LogHelper.printLog;
export let PrintNet = LogHelper.printNet;
export let PrintError = LogHelper.printError;