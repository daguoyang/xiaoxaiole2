import { assetManager, AssetManager, Node } from "cc";
import { App } from "../../core/app";
import { PrintError, PrintLog } from "../logHelper";
import { ToolsHelper } from "../toolsHelper";
import { BasePlatform } from "./basePlatform";

export class WebPlatform extends BasePlatform {
    getUUid(): string {
        return ToolsHelper.getUUid();
    }
    copyToClipboard(content: string): void {
        const el = document.createElement('textarea');
        el.value = content;
        // Prevent keyboard from showing on mobile
        el.setAttribute('readonly', '');
        //el.style.contain = 'strict';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.fontSize = '12pt'; // Prevent zooming on iOS

        const selection = getSelection()!;
        let originalRange;
        if (selection.rangeCount > 0) {
            originalRange = selection.getRangeAt(0);
        }
        document.body.appendChild(el);
        el.select();
        // Explicit selection workaround for iOS
        el.selectionStart = 0;
        el.selectionEnd = content.length;

        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) { }
        document.body.removeChild(el);
        if (originalRange) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }
        App.view.showMsgTips('复制成功');
    }
    async getClipboardContent(callback?: Function): Promise<string> {
        try {
            const clipboardItems = await window.navigator.clipboard.read();
            let text = '';
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    const item = await clipboardItem.getType(type);
                    if (item && item.type == 'text/plain') {
                        text = await item.text();
                    }
                }
            }
            callback && callback(text);
            return text;
        } catch (error) {
            callback && callback(null);
        }
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
    receiveNativeMsg(operation: string) {
        throw new Error("Method not implemented.");
    }
    loadGame(subGame: number): Promise<AssetManager.Bundle> {
        let gameID = `${subGame}`;
        return new Promise((resolve: (ret: any) => void) => {
            let bundle = assetManager.getBundle(gameID);
            if (bundle) {
                resolve(bundle);
                return;
            }
            assetManager.loadBundle(`${subGame}`, {
                onFileProgress: function (e) {
                    PrintLog(` load game progress = ${e.progress}`);
                }
            }, (err: Error, bundle: AssetManager.Bundle) => {
                if (err) {
                    PrintError(err);
                    resolve(null);
                    return;
                }
                resolve(bundle);
            })
        });
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

    // let spriteTexture = new Texture2D();
    // // @ts-ignore
    // spriteTexture.initWithData(picData, Texture2D.RGBA8888, w, h);
    // let spriteFrame = new SpriteFrame();
    // spriteFrame.setTexture(spriteTexture);
    // let tempNode = new Node();
    // let sprite = tempNode.addComponent(Sprite);
    // sprite.spriteFrame = spriteFrame;
    // tempNode.zIndex = macro.MAX_ZINDEX;
    // tempNode.parent = parentNode;
    // tempNode.x = winSize.width / 2;
    // tempNode.y = winSize.height / 2;
    // }
    savePicture(parentNode: Node): void {

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

    faceBookShare() {
        return false;
    }

    whatsAppShare(url: string) {
        return false;
    }
}