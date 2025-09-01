import { App } from "../core/app";
import { Component, JsonAsset, Label, Node, Sprite, SpriteFrame, _decorator } from "cc";
import { BaseNodeCmpt } from "./baseNodeCmpt";
const { ccclass, property } = _decorator;
@ccclass("scrollItemCmpt")
export default class ScrollItemCmpt extends BaseNodeCmpt {

    protected onLoad(): void {
        super.onLoad();
        this.addEvent();
    }

    initData(...args: any) {

    }

    protected addEvent() {

    }

    protected delEvent() {

    }
}
