import { assetManager, AssetManager, Node } from "cc";
import { PrintError, PrintLog } from "../logHelper";
import { BasePlatform } from "./basePlatform";

/** 原生操作方法 */
export enum Native_Operation {
    /** 获取唯一标识 */
    GetUUid = 'GetUUid',
    /** 旋转屏幕 */
    ChangeOrientation = 'ChangeOrientation',
    /** 保存截图 */
    SavePicture = 'SavePicture',
    /** 复制到剪切板 */
    CopyToClipboard = 'CopyToClipboard',
    /** 获取剪切板内容 */
    GetClipboardContent = 'GetClipboardContent',
    /** 获取包名 */
    GetPackageName = 'GetPackageName',
    /** 获取包版本号 */
    GetAppVersion = 'GetAppVersion',
    /** 判断是否模拟器 */
    CheckIsEmulator = 'CheckIsEmulator',
    /** Facebook登录 */
    FaceBookLogin = 'FaceBookLogin',
    /** Facebook退出登录 */
    FaceBookOut = 'FaceBookOut',
    /** Facebook分享 */
    FaceBookShare = 'FaceBookShare',
    /** whatsApp分享 */
    WhatsAppShare = 'WhatsAppShare',
    /** Google登录 */
    LoginGoogle = 'LoginGoogle',
    /** Google退出登录 */
    LoginOutGoogle = 'LoginOutGoogle',
}

export abstract class NativePlatform extends BasePlatform {

    protected isPortrait: boolean = false;

    /** 保存图片到相册 */
    abstract savePictureToAlbum(data: string);

    loadGame(subGame: number): Promise<AssetManager.Bundle> {
        return new Promise((resolve: (ret: any) => void) => {
            // let gamePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + `update/${LobbyConfig.Update_Game_Path}/${subGame}`
            // assetManager.loadBundle(gamePath, {
            //     onFileProgress: function (e) {
            //         PrintLog(` load game progress = ${e.progress}`);
            //     }
            // }, (err: Error, bundle: AssetManager.Bundle) => {
            //     if (err) {
            //         PrintError(err);
            //         resolve(null);
            //         return;
            //     }
            //     resolve(bundle);
            // })
            resolve("");
        });
    }

    savePicture(parentNode: Node): void {

    }

    // savePicture(parentNode: Node) {
    // let node = new Node();
    // node.parent = parentNode;
    // let cam = node.addComponent(Camera);
    // // 设置你想要的截图内容的 cullingMask
    // cam.cullingMask = 0xffffffff;

    // // 新建一个 RenderTexture，并且设置 camera 的 targetTexture 为新建的 RenderTexture，这样camera的内容将会渲染到新建的 RenderTexture 中。
    // let texture = new RenderTexture();
    // // @ts-ignore
    // let gl = game._renderContext;

    // // 如果截图内容中不包含 Mask 组件，可以不用传递第三个参数
    // texture.initWithSize(visibleRect.width, visibleRect.height, gl.STENCIL_INDEX8);
    // cam.targetTexture = texture;

    // // 渲染一次摄像机，即更新一次内容到 RenderTexture 中
    // cam.render();
    // // 这样我们就能从 RenderTexture 中获取到数据了
    // let data = texture.readPixels();

    // let w = texture.width;
    // let h = texture.height;

    // //翻转图片
    // let picData = new Uint8Array(w * h * 4);
    // let rowBytes = w * 4;
    // for (let row = 0; row < h; row++) {
    //     let srow = h - 1 - row;
    //     let start = srow * w * 4;
    //     let reStart = row * w * 4;
    //     // save the piexls data
    //     for (let i = 0; i < rowBytes; i++) {
    //         picData[reStart + i] = data[start + i];
    //     }
    // }

    // let fileName = 'screenshot_image.png';
    // let path = jsb.fileUtils.getWritablePath() + fileName;
    // // @ts-ignore
    // let success = jsb.saveImageData(picData, w, h, path)
    // if (success) {
    //     let args = {};
    //     args["path"] = path;
    //     args["filename"] = fileName;
    //     let json = JSON.stringify(args);
    //     this.savePictureToAlbum(json);
    //     return;
    // }
    // PrintError(" SavePicture Fail ")
    // }
}