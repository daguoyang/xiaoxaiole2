import { AssetManager, Camera, director, game, macro, Material, Rect, RenderTexture, Node, size, Sprite, SpriteFrame, view, ResolutionPolicy, UITransform } from "cc";
import { ShareInfo } from "../../const/enumConst";

export interface IPlatform {
    /** 加载子游戏 */
    loadGame(subGame: number): Promise<AssetManager.Bundle>;
    /** 获取唯一标识 */
    getUUid(): string;
    /** 切换屏幕 */
    changeOrientation(isPortrait: boolean): void;
    /** 保存图片 */
    savePicture(parentNode: Node): any;
    shootBackground(parentNode: Node, material: Material, targetNode: Node): any;
    /** 复制到剪切板 */
    copyToClipboard(content: string): void;
    /** 获取剪切板 */
    getClipboardContent(callback?: Function): Promise<string>;
    /** 获取包名 */
    getPackageName(): Promise<string>;
    /** 获取包版本号 */
    getAppVersion(): string;
    /** 判断是否模拟器 */
    checkIsEmulator(): boolean;
    /** Facebook登录 */
    faceBookLogin(): string;
    /** Facebook退出登录 */
    faceBookLoginOut(): boolean;
    /** Facebook分享 */
    faceBookShare(content: ShareInfo): boolean;
    /** whatsApp分享 */
    whatsAppShare(url: string): boolean;
    /** Google登录 */
    loginGoogle(): string;
    /** Google退出登录 */
    loginOutGoogle(): boolean;
    /**
     * 调用原生方法
     * @param operation 操作内容
     * @param args 参数
     */
    sendNativeMsg(operation: string, args: string);
    /**
     * 接受原生返回消息 
     * @param operation 
     */
    receiveNativeMsg(operation: string, data: string);
}

export abstract class BasePlatform implements IPlatform {
    abstract loadGame(subGame: number): Promise<AssetManager.Bundle>;
    abstract getUUid(): string;
    abstract savePicture(parentNode: Node): void;
    abstract copyToClipboard(content: string): void;
    abstract getClipboardContent(): Promise<string>;
    abstract getPackageName(): Promise<string>;
    abstract getAppVersion(): string;
    abstract checkIsEmulator(): boolean;
    abstract sendNativeMsg(operation: string, args: string);
    abstract receiveNativeMsg(operation: string, data: string);
    abstract faceBookLogin(): string;
    abstract faceBookLoginOut(): boolean;
    abstract faceBookShare(content: ShareInfo): boolean;
    abstract whatsAppShare(url: string): boolean;
    abstract loginGoogle(): string;
    abstract loginOutGoogle(): boolean;

    /**
     * 切换屏幕
     * @param isPortrait 竖屏
     */
    changeOrientation(isPortrait: boolean) {
        let curFrameSize = size(view.getVisibleSize())
        let w = curFrameSize.width;
        let h = curFrameSize.height;

        if (isPortrait && w < h) {
            return;
        } else if (!isPortrait && w > h) {
            return;
        }

        let maxLen = w > h ? w : h;
        let minLen = w > h ? h : w;
        if (isPortrait) {
            view.setFrameSize(minLen, maxLen);
            view.setOrientation(macro.ORIENTATION_PORTRAIT);
        } else {
            view.setFrameSize(maxLen, minLen);
            view.setOrientation(macro.ORIENTATION_LANDSCAPE);
        }

        if (isPortrait) {
            let height = w * (720 / 1443);
            view.setDesignResolutionSize(1443, height, ResolutionPolicy.FIXED_WIDTH);
        } else {
            let width = h * (720 / 1443);
            view.setDesignResolutionSize(width, 1443, ResolutionPolicy.FIXED_HEIGHT);
        }
    }

    /** 截图当弹窗背景 */
    shootBackground(parentNode: Node = null, material: Material = null, targetNode: Node = null) {
        // //获取当前场景Camera
        // let camera = director.getScene().getComponentInChildren(Camera);
        // //创建新的texture
        // let texture = new RenderTexture();
        // texture.initWithSize(screen.width, screen.height, (game as any)._renderContext.STENCIL_INDEX8);
        // //创建新的spriteFrame
        // let spriteFrame = new SpriteFrame();
        // if (targetNode == null) {
        //     spriteFrame.texture = (texture);
        // } else {
        //     let nodeX = screen.width / 2 + targetNode.getPosition().x - targetNode.getComponent(UITransform).width / 2;
        //     let nodeY = screen.height / 2 + targetNode.getPosition().y - targetNode.getComponent(UITransform).height / 2;
        //     let nodeWidth = targetNode.getComponent(UITransform).width;
        //     let nodeHeight = targetNode.getComponent(UITransform).height;
        //     //只显示node部分的图片
        //     spriteFrame.setTexture(texture, new Rect(nodeX, nodeY, nodeWidth, nodeHeight));
        // }
        // //创建新的node
        let node = new Node();
        let sprite = node.addComponent(Sprite);
        // sprite.spriteFrame = spriteFrame;
        // //截图是反的，这里将截图scaleY取反，这样就是正的了
        // sprite.node.scaleY = - Math.abs(sprite.node.scaleY);
        // //手动渲染camera
        // camera.cullingMask = 0xffffffff;
        // camera.targetTexture = texture;
        // camera.render();
        // camera.targetTexture = null;

        // if (material) {
        //     sprite.setMaterial(0, material);
        // }

        // if (parentNode) {
        //     node.parent = parentNode;
        // }

        return node;
    }
}