// import { ProtoMsgId } from "../../plugins/protoMsgId";
// import { DataOptions, Marqueetype, NtcDataOptions, RechargeReturn, RecommentType } from "../const/enumConst";
// import { EventName } from "../const/eventName";
// import { GlobalFuncHelper } from "../utils/globalFuncHelper";
// import { App } from "./app";
import { SingletonClass } from "./singletonClass";

/**
 * 推送数据管理
 */
export class NoticeManager extends SingletonClass<NoticeManager> {

    //     /** 邮件数据 */
    //     private _emailData: clientmsg.IMailDataNtc = null;
    //     set emailData(v: clientmsg.IMailDataNtc) {
    //         this._emailData = v;
    //     }
    //     get emailData(): clientmsg.IMailDataNtc {
    //         return this._emailData;
    //     }

    //     /** 登录成功，大厅推送消息监听 */
    //     public addNoticeEvent() {
    //         if (this.checkAddEventSuc()) return;
    //         //跑马灯
    //         App.net.addResponseHandler(ProtoMsgId.MarqueeMessageNtc, this.onHandlerMarqueeMessageNtc, this)
    //         //邮件
    //         App.net.addResponseHandler(ProtoMsgId.MailDataNtc, this.onHandleMailDataNtc, this);
    //         //同步玩家金币砖石
    //         App.net.addResponseHandler(ProtoMsgId.UpdateMoneyNtc, this.onHandleUpdateMoneyNotice, this);
    //         //VIP
    //         App.net.addResponseHandler(ProtoMsgId.UpdatePlayerVipNtc, this.onHandleUpdatePlayerVipNtc, this);
    //     }

    //     /** 检测推送监听是否添加成功 */
    //     checkAddEventSuc() {
    //         let list = App.net.getNetListener();
    //         if (list.get(ProtoMsgId.UpdateMoneyNtc)) {
    //             return true;
    //         }
    //         return false;
    //     }

    //     public removeNoticeEvent() {
    //         App.net.removeResponseHandler(ProtoMsgId.MarqueeMessageNtc)
    //         App.net.removeResponseHandler(ProtoMsgId.MailDataNtc);
    //     }

    //     /** 跑马灯 */
    //     onHandlerMarqueeMessageNtc(data: clientmsg.IMarqueeMessageNtc) {
    //         App.view.showMarquee(data);
    //     }

    //     /** 邮件*/
    //     onHandleMailDataNtc(data: clientmsg.IMailDataNtc) {
    //         if (!this.emailData) {
    //             this.emailData = data;
    //         }
    //         else {
    //             if (data.operationtype == NtcDataOptions.all) {
    //                 this.emailData = data;
    //             }
    //             else if (data.operationtype == NtcDataOptions.add) {
    //                 this.emailData.maildata = this.emailData.maildata.concat(data.maildata);
    //             }
    //             else if (data.operationtype == NtcDataOptions.delete) {
    //                 for (let i = 0; i < data.maildata.length; i++) {
    //                     this.refreshEmailItemData(data.maildata[i], DataOptions.delete);
    //                 }
    //             }
    //         }
    //         this.sortEmail();
    //         App.event.emit(EventName.Lobby.EMAIL_LIST_UPDATE);
    //     }

    //     sortEmail() {
    //         //按时间排序
    //         this.emailData.maildata.sort((a, b) => { return -a.timestamp + b.timestamp });
    //         //未领取>未查看>已查看
    //         let arr1 = [];
    //         let arr2 = [];
    //         let arr3 = [];
    //         this.emailData.maildata.forEach(item => {
    //             if (item.enclosureGoods.length > 0 && item.isGetEnclosure != 2) {
    //                 //未领取
    //                 arr1.push(item);
    //             }
    //             else if (item.issee != 2) {
    //                 //未查看
    //                 arr2.push(item);
    //             }
    //             else {
    //                 arr3.push(item);
    //             }
    //         });

    //         let arr = arr1.concat(arr2).concat(arr3);
    //         this.emailData.maildata = arr
    //     }

    //     /** 刷新单条邮件数据*/
    //     refreshEmailItemData(data: clientmsg.IMailData, option: number) {
    //         let list = this._emailData.maildata;
    //         for (let i = 0; i < list.length; i++) {
    //             if (list[i].mailid == data.mailid) {
    //                 if (option == DataOptions.update) {
    //                     list[i] = data;
    //                     App.event.emit(EventName.Lobby.EMAIL_SINGLE_UPDATE, data);
    //                 }
    //                 else if (option == DataOptions.delete) {
    //                     list.splice(i, 1);
    //                 }
    //                 break;
    //             }
    //         }
    //         this.sortEmail();
    //         App.event.emit(EventName.Lobby.EMAIL_LIST_UPDATE);
    //     }

    //     /** 同步玩家金币、钻石 */
    //     onHandleUpdateMoneyNotice(data: clientmsg.IUpdateMoneyNtc) {
    //         if (App.user.lobbyInfo) {
    //             App.user.lobbyInfo.baseinfo.coin = data.coin;
    //         }
    //         let isAddCoin = false;
    //         if (data.reason && (data.reason >= 2000 && data.reason <= 2006)) {
    //             if (data.addcoin > 0) {
    //                 isAddCoin = true;
    //             }
    //         }
    //         App.event.emit(EventName.Lobby.UPDATE_MONEY_NOTICE, data, isAddCoin);

    //         switch (data.reason) {
    //             case RechargeReturn.WalletInCus:
    //             case RechargeReturn.WalletInOnline:
    //                 App.view.showMsgTips("109");
    //                 return;
    //         }

    //         GlobalFuncHelper.checkShowRechargeRecommond(RecommentType.last);
    //     }

    //     /** 更新玩家VIP信息 */
    //     onHandleUpdatePlayerVipNtc(data: clientmsg.IUpdatePlayerVipNtc) {
    //         if (App.user.lobbyInfo) {
    //             App.user.lobbyInfo.baseinfo.vip = data.vip;
    //         }
    //         App.event.emit(EventName.Lobby.UPDATE_PLAYER_VIP, data);
    //     }

    //     /** 跑马灯测试 */
    //     marqueeTest() {
    //         let data: clientmsg.IMarqueeData = {
    //             sendername: "systerm",
    //             marqueetype: Marqueetype.once,
    //             marqueecontent: "Congratulations to user <color=#bd58ab>peter</color> for winning <color=#57d02d>8888</color> points in the VIP Lounger!",
    //         }
    //         let rand = Math.random() > 0.5;
    //         if (rand) {
    //             data = {
    //                 sendername: "enmy eamy",
    //                 marqueetype: Marqueetype.super,
    //                 marqueecontent: "99999",
    //             }
    //         }

    //         let dt: clientmsg.IMarqueeMessageNtc = {
    //             marqueedata: [data],
    //             operationtype: 1,
    //         }
    //         App.view.showMarquee(dt);
    //     }
}