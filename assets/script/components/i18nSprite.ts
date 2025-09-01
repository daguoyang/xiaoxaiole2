import { App } from "../core/app";
import { Component, JsonAsset, Label, Node, Sprite, SpriteFrame, _decorator } from "cc";
const { ccclass, property } = _decorator;
@ccclass
export default class i18nSprite extends Component {
    @property({ tooltip: '资源路径' })
    url: string = '';

    @property({ tooltip: '是否都合并到一起' })
    protected mergeI18n = false;

    get isMerge() {
        return this.mergeI18n;
    }

    onLoad() {
        App.i18n.register(this);
        this.reset();
        // 所有i18n图片合并到一起显示，当前的就需要屏蔽
        this.node.active = !this.isMerge;
    }

    onDestroy() {
        App.i18n.unregister(this);
    }

    setPath(url: string) {
        this.url = url;
        const sprite = this.getComponent(Sprite);
        sprite && App.i18n.setSprite(url, (frame: SpriteFrame) => {
            frame && (sprite.spriteFrame = frame);
        });
    }

    reset() {
        this.setPath(this.url);
    }
}