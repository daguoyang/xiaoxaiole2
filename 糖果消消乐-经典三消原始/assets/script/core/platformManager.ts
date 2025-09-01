import { SingletonClass } from "./singletonClass";
import { IPlatform } from "../utils/platform/basePlatform";
import { AndroidPlatform } from "../utils/platform/androidPlatform";
import { IosPlatform } from "../utils/platform/iosPlatform";
import { WebPlatform } from "../utils/platform/webPlatform";
import { PrintError } from "../utils/logHelper";
import { ToolsHelper } from "../utils/toolsHelper";
import { App } from "./app";
import { PlatFormType, ShareInfo } from "../const/enumConst";
import { AssetManager, Material, Node, sys } from "cc";

/**
 * 平台管理
 */
export class PlatformManager extends SingletonClass<PlatformManager> implements IPlatform {

    private curPlatform: IPlatform;     // 当前平台

    public async onInit() {
        // if (sys.isNative) {
        //     if (sys.os === sys.OS_ANDROID) {
        //         this.curPlatform = new AndroidPlatform();
        //     } else if (sys.os === sys.OS_IOS) {
        //         this.curPlatform = new IosPlatform();
        //     }
        // } else {
        //     this.curPlatform = new WebPlatform();
        // }
        // if (!this.curPlatform) {
        //     PrintError(' PlatformManager not curPlatform');
        //     return;
        // }
    }

    /** 获取当期运行环境 */
    public getPlatform() {
        // let type = 0;
        // if (sys.isNative) {
        //     if (sys.os === sys.OS_ANDROID) {
        //         type = PlatFormType.android;
        //     } else if (sys.os === sys.OS_IOS) {
        //         type = PlatFormType.ios;
        //     }
        // } else {
        //     type = PlatFormType.web
        // }
        // return PlatFormType.android;
        // return type;
    }

    loadGame(subGame: number): Promise<AssetManager.Bundle> {
        return this.curPlatform.loadGame(subGame);
    }

    getUUid(): string {
        return this.curPlatform.getUUid();
    }

    changeOrientation(isPortrait: boolean) {
        return this.curPlatform.changeOrientation(isPortrait);
    }

    savePicture(parentNode: Node): any {
        // return this.curPlatform.savePicture(parentNode);
    }

    shootBackground(parentNode: Node, material: Material, targetNode: Node) {
        return this.curPlatform.shootBackground(parentNode, material, targetNode);

    }

    copyToClipboard(content: string): void {
        return this.curPlatform.copyToClipboard(content);
    }

    async getClipboardContent(callback?: Function): Promise<string> {
        let res = await this.curPlatform.getClipboardContent(callback);
        res = ToolsHelper.matchClipboardContent(res);
        return res;
    }

    getPackageName(): Promise<string> {
        return this.curPlatform.getPackageName();
    }

    getAppVersion(): string {
        return this.curPlatform.getAppVersion();
    }

    checkIsEmulator(): boolean {
        return this.curPlatform && this.curPlatform.checkIsEmulator();
    }

    sendNativeMsg(operation: string, args: string) {
        return this.curPlatform.sendNativeMsg(operation, args);
    }

    receiveNativeMsg(operation: string, data: string) {
        return this.curPlatform.receiveNativeMsg(operation, data);
    }

    faceBookLogin() {
        return this.curPlatform.faceBookLogin();
    }

    faceBookLoginOut() {
        return this.curPlatform.faceBookLoginOut();
    }

    loginGoogle() {
        return this.curPlatform.loginGoogle();
    }

    faceBookShare(content: ShareInfo): boolean {
        return this.curPlatform.faceBookShare(content);
    }

    whatsAppShare(url: string): boolean {
        // let phone = App.user.lobbyInfo.baseinfo.phone;
        // let opUrl = `https://wa.me/?text=${url}`
        // if (phone) {
        //     opUrl = `https://wa.me/${phone}?text=${url}`
        // }
        // ToolsHelper.openUrl(opUrl)
        return this.curPlatform.whatsAppShare(url);
    }

    loginOutGoogle() {
        return this.curPlatform.loginOutGoogle();
    }
}