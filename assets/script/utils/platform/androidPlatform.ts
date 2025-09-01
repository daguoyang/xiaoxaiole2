import { game } from "cc";
import { ShareInfo } from "../../const/enumConst";
import { EventName } from "../../const/eventName";
import { App } from "../../core/app";
import { PrintLog } from "../logHelper";
import { NativePlatform, Native_Operation } from "./nativePlatform";

export class AndroidPlatform extends NativePlatform {

    private callback: Function = null;

    getUUid(): string {
        return this.sendNativeMsg(Native_Operation.GetUUid);
    }

    changeOrientation(isPortrait: boolean) {
        if (isPortrait == this.isPortrait) {
            return;
        }
        this.isPortrait = isPortrait;

        let direStr = isPortrait ? "V" : "H";
        this.sendNativeMsg(Native_Operation.ChangeOrientation, direStr);
        super.changeOrientation(isPortrait);
    }

    savePictureToAlbum(data: string) {
        this.sendNativeMsg(Native_Operation.SavePicture, data);
    }

    copyToClipboard(content: string): void {
        this.sendNativeMsg(Native_Operation.CopyToClipboard, content);
    }

    getClipboardContent(callback?: Function): Promise<string> {
        this.callback = callback;
        return this.sendNativeMsg(Native_Operation.GetClipboardContent);
    }

    getPackageName(): Promise<string> {
        this.sendNativeMsg(Native_Operation.GetPackageName);
        return new Promise((r) => {
            App.event.on(EventName.Lobby.GETPACKAGENAME, r, this)
        })

    }
    getAppVersion(): string {
        return this.sendNativeMsg(Native_Operation.GetAppVersion);
    }
    checkIsEmulator(): boolean {
        let str = this.sendNativeMsg(Native_Operation.CheckIsEmulator);
        return !!str;
    }

    faceBookLogin(): string {
        return this.sendNativeMsg(Native_Operation.FaceBookLogin);
    }

    faceBookLoginOut(): boolean {
        return this.sendNativeMsg(Native_Operation.FaceBookOut);
    }

    loginGoogle() {
        return this.sendNativeMsg(Native_Operation.LoginGoogle);
    }

    loginOutGoogle() {
        return this.sendNativeMsg(Native_Operation.LoginOutGoogle);
    }

    faceBookShare(content: ShareInfo) {
        return this.sendNativeMsg(Native_Operation.FaceBookShare, JSON.stringify(content));
    }

    whatsAppShare(url: string) {
        return this.sendNativeMsg(Native_Operation.WhatsAppShare);
    }

    sendNativeMsg(operation: string, args: string = '') {
        PrintLog(` sendJavaMsg opt = ${operation} , args = ${args}`);
        // return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "revJsMessage",
        //     "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", operation, args);
        return null;
    }

    receiveNativeMsg(operation: string, data: string) {
        PrintLog(" receiveNativeMsg opt = " + operation + "   data = " + data);
        switch (operation) {
            case Native_Operation.SavePicture:
            case Native_Operation.CopyToClipboard:
                App.view.showMsgTips(data);
                break;

            case Native_Operation.FaceBookLogin:
                App.event.emit(EventName.Login.LOGIN_THIRD_WAY, data);
                PrintLog(data);
                break;

            case Native_Operation.FaceBookOut:
                PrintLog(data);
                break;

            case Native_Operation.LoginGoogle:
                App.event.emit(EventName.Login.LOGIN_THIRD_WAY, data);
                break;

            case Native_Operation.LoginOutGoogle:
                PrintLog(data);
                break;

            case Native_Operation.GetClipboardContent:
                this.callback && this.callback(data);
                break;

            case Native_Operation.GetPackageName://android包名
                PrintLog(data);
                App.event.emit(EventName.Lobby.GETPACKAGENAME, data);
                break;

            case Native_Operation.GetAppVersion://android APP 版本号
                PrintLog(data);
                App.event.emit(EventName.Lobby.GETAPPVERSION, data);
                break;

            case Native_Operation.CheckIsEmulator://是否是模拟器
                if (!+data) {//禁止在模拟器上运行
                    game.end();
                }
                break;
            default:
                break;
        }
    };

}