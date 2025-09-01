import { ShareInfo } from "../../const/enumConst";
import { NativePlatform } from "./nativePlatform";

export class IosPlatform extends NativePlatform {
    getUUid(): string {
        return '';
    }
    changeOrientation(isPortrait: boolean) {
        super.changeOrientation(isPortrait);
        // jsb.reflection.callStaticMethod("JsClass", "changeOrientation:", isPortrait);
    }

    savePictureToAlbum(data: string) {
    }
    copyToClipboard(content: string): void {
    }
    getClipboardContent(): Promise<string> {
        return new Promise(r => { r('') });
    }
    getPackageName(): Promise<string> {
        return new Promise(r => { r('') });
    }
    getAppVersion(): string {
        return '';
    }
    checkIsEmulator(): boolean {
        return false;
    }

    sendNativeMsg(operation: string, args: string) {
        throw new Error("Method not implemented.");
    }
    receiveNativeMsg(operation: string, data: string) {
        throw new Error("Method not implemented.");
    }
    faceBookLogin(): string {
        return "";
    }

    faceBookLoginOut(): boolean {
        return false;
    }

    loginGoogle(): string {
        return ""
    }

    loginOutGoogle(): boolean {
        return false
    }

    faceBookShare(content: ShareInfo) {
        return false;
    }

    whatsAppShare(url: string) {
        return false;
    }
}