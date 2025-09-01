import { App } from "../core/app";
import { Component, JsonAsset, Label, Node, _decorator } from "cc";
const { ccclass, property } = _decorator;
@ccclass
export default class i18nLabel extends Component {
    @property({ tooltip: '语言文件中的key' })
    i18nKey: string = '';

    onLoad() {
        App.i18n.register(this);
        this.reset();
    }

    onDestroy() {
        App.i18n.unregister(this);
    }

    setText(value: string) {
        this.i18nKey = value;
        App.i18n.setText(this.getComponent(Label), this.i18nKey);
    }

    reset() {
        this.setText(this.i18nKey);
    }
}