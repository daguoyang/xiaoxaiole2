import DataViewUtils from "./dataviewUtils";
import { Router } from "./routers";
import { Head, ModelAny } from "./globalUtils";
import { getIp, IpType } from "./util";
import { sys } from "cc";
import { App } from "../core/app";
import { EventName } from "../const/eventName";

export default class LLKNet {
    private socket: WebSocket = null as unknown as WebSocket;
    private id: number = 0;
    private serverType: number = 0;
    public isConnected: boolean = false;
    private _isConnecting: boolean = false;

    /**
     * 初始化连接服务器
     * @param cb 
     */
    init(cb?: any) {
        return;
        if (this.isConnected) {
            return;
        }
        let ip = getIp(IpType.local);
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            ip = getIp(IpType.remote);
        }
        ip = getIp(IpType.remote);
        console.log(ip)


        if (this._isConnecting) return;//正在链接中，忽略其他链接请求
        this._isConnecting = true;
        this.socket = new WebSocket(ip);
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = () => {
            this.isConnected = true;
            this._isConnecting = false;
            App.event.emit(EventName.Game.Connected);
            console.log("--------connect success---------");
            if (cb) { cb(); }
        };
        this.socket.onclose = () => { console.log("----- close server -----"); this.isConnected = false; };
        this.socket.onerror = () => { console.log("onerror") };
        this.socket.onmessage = (req) => {
            let message = req.data;
            let buf = new Uint8Array(message).buffer;
            let dtView = new DataView(buf);
            let head = DataViewUtils.getHeadData(dtView);
            let body = DataViewUtils.decoding(dtView, buf.byteLength);

            console.log("------------------receiveData------------------");
            console.log("router:" + head.router + " body:" + JSON.stringify(body));
            this.handleRecvdate(head, body);
        };
    }

    /**
     * 主动断开与服务器间的链接
     */
    breakConnect() {
        // this.socket.close();
    }

    /**
     * 接收数据，将数据派发出去
     * @param head 
     * @param body 
     */
    handleRecvdate(head: Head, body: ModelAny) {
        App.event.emit(head.router, body);
    }

    /**
     * 向服务器发送数据
     * @param data 
     * @param router 
     */
    sendMsg(data: any, router: string) {
        console.log("------------------sendData------------------");
        console.log(data, router);
        let dt = DataViewUtils.encoding(this.id, this.serverType, Number(router), data);
        this.socket.send(dt);
    }

    /**
     * 断线重连
     */
    public reconnect(cb?: Function) {
        this.init(() => {
            let data = { name: App.user.rankData.name };
            Net.sendMsg(data, Router.rut_login);
        });
    }
}

export const Net = new LLKNet();