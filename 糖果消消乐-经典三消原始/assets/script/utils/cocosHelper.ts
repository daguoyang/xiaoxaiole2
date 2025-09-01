// import { HeadIcon } from "../const/enumConst";
// import { LobbyConfig } from "../const/lobbyConfig";
// import { App } from "../core/app";
// import { PrintError, PrintLog } from "./logHelper";
// import { ResLoadHelper } from "./resLoadHelper";
// import { ToolsHelper } from "./toolsHelper";
import { _decorator, Component, Node, isValid, Sprite, SpriteFrame, Label, EditBox, RichText, UITransform, Vec2, Vec3, Camera, tween, } from 'cc';
import { App } from '../core/app';
import { PrintError } from './logHelper';
import { ResLoadHelper } from './resLoadHelper';
import { ToolsHelper } from './toolsHelper';
// /**
//  * cocos相关方法
//  */
class Helper {
    /** 添加按钮点击事件 */
    addButtonLister(n: Node, event: string, callback: Function, target: any, waitTimeSec = 0, ...args) {
        n.off(event);
        n.on(event, () => {
            if (waitTimeSec) {
                // 防止连点，冷却时间
                let clickTime = n['clickTime'] || new Date().getTime();
                let nowTime = new Date().getTime();
                let offsetTime = (nowTime - clickTime) / 1000;
                if (offsetTime && offsetTime < waitTimeSec) return;
                n.attr({ clickTime: nowTime });
            }
            //需要自定义音效的按钮，末尾加入Audio字符串
            if (n.name.indexOf('Audio') < 0) {
                // App.audio.play(1000002);
            }
            callback.call(target, n, ...args);
        })
    }

    /** 添加输入框回调事件 */
    addEditBoxLister(n: Node, callback: Function, target: any, waitTimeSec = 0, eventName: string = "editing-did-ended", ...args) {
        n.off(eventName);
        n.on(eventName, () => {
            if (waitTimeSec) {
                // 防止连点，冷却时间
                let clickTime = n['clickTime'] || new Date().getTime();
                let nowTime = new Date().getTime();
                let offsetTime = (nowTime - clickTime) / 1000;
                if (offsetTime && offsetTime < waitTimeSec) return;
                n.attr({ clickTime: nowTime });
            }
            callback.call(target, n, ...args);
        })
    }

    /** 动态添加事件 */
    addEventHandler(n: Node, className: string, callFuncName: string, customData = '') {
        let handler = new Component.EventHandler();
        handler.target = n;
        handler.component = className;
        handler.handler = callFuncName;
        handler.customEventData = customData;
        return handler;
    }

    /** 更新通用资源 */
    async updateCommonSpriteSync(node: Node, url: string) {
        if (!isValid(node)) {
            PrintError(`updateCommonSpriteSync not node = ${url}`);
            return;
        }

        let sprite: Sprite = node.getComponent(Sprite);
        if (!sprite) {
            PrintError(`updateCommonSpriteSync not sprite = ${url}`);
            return;
        }

        let sf: SpriteFrame = await ResLoadHelper.loadCommonAssetSync(url, SpriteFrame);
        if (!sf) {
            PrintError(`updateCommonSpriteSync not SpriteFrame = ${url}`);
            return;
        }
        sprite.spriteFrame = sf;
    }

    /**
    * 更新label文字
    * **/
    updateLabelText(node: Node | Label, strKey: string | number, isI18n = false) {
        if (!isValid(node)) {
            PrintError(`LabelText not node = ${strKey}`);
            return;
        }
        let label: Label = node instanceof Node ? node.getComponent(Label) : node
        if (!label) {
            PrintError(`LabelText not label = ${strKey}`);
            return;
        }
        strKey = strKey + "";
        let newText = isI18n ? App.i18n.getString(strKey) : strKey;
        label.string = newText;
    }

    /**
    * 更新EditBox文字
    * **/
    updateEditBoxText(node: Node | EditBox, strKey: string, isI18n = true) {
        if (!isValid(node)) {
            PrintError(`LabelText not node = ${strKey}`);
            return;
        }
        let label: EditBox = node instanceof Node ? node.getComponent(EditBox) : node
        if (!label) {
            PrintError(`LabelText not label = ${strKey}`);
            return;
        }
        let newText = isI18n ? App.i18n.getString(strKey) : strKey;
        label.string = newText;
    }

    /**
    * 更新RichText文字
    * **/
    updateRichText(node: Node | RichText, strKey: string, isI18n = true) {
        if (!isValid(node)) {
            PrintError(`LabelText not node = ${strKey}`);
            return;
        }
        let label: RichText = node instanceof Node ? node.getComponent(RichText) : node
        if (!label) {
            PrintError(`LabelText not label = ${strKey}`);
            return;
        }
        let newText = isI18n ? App.i18n.getString(strKey) : strKey;
        label.string = newText;
        // @ts-ignore
        // label._forceUpdateRenderData(true);
    }

    /** 更新金额相关的label */
    updateMoneyLab(node: Node, num: number) {
        let moneyStr = ToolsHelper.moneyToThousands(num);
        this.updateLabelText(node, moneyStr, false);
    }

    /** 同步更新图片 */
    async updateSpriteSync(node: Node, url: string) {
        if (!isValid(node)) {
            PrintError(`updateSpriteSync not node = ${url}`);
            return;
        }

        let sprite: Sprite = node.getComponent(Sprite);
        if (!sprite) {
            PrintError(`updateSpriteSync not sprite = ${url}`);
            return;
        }

        let sf: SpriteFrame = await ResLoadHelper.loadAssetSync(url, SpriteFrame);
        if (!sf) {
            PrintError(`updateSpriteSync not SpriteFrame = ${url}`);
            return;
        }
        sprite.spriteFrame = sf;
    }

    /** 异步更新图片 */
    updateSpriteAsync(node: Node, url: string, isRemote: boolean = false) {
        if (!isValid(node)) {
            PrintError(`updateSpriteAsync not node = ${url}`);
            return;
        }
        let sprite: Sprite = node.getComponent(Sprite);
        if (!sprite) {
            PrintError(`updateSpriteAsync not sprite = ${url}`);
            return;
        }
        ResLoadHelper.loadAssetAsync(url, SpriteFrame, (sf: SpriteFrame) => {
            if (sf && isValid(node)) {
                sprite.spriteFrame = sf;
            }
        }, isRemote)
    }
    /** 异步更新头像图片 */
    async updateUserHeadSpriteAsync(node: Node, logo: string | number) {
        if (!isValid(node)) {
            PrintError(`updateUserHeadSpriteAsync not node = ${logo}`);
            return;
        }
        let sprite: Sprite = node.getComponent(Sprite);
        if (!sprite) {
            PrintError(`updateUserHeadSpriteAsync not sprite = ${logo}`);
            return;
        }

        let defaultLogo = '1';
        if (!logo) logo = defaultLogo;
        let url = `head/head${logo}`;
        let spr = await ResLoadHelper.loadCommonAssetSync(url, SpriteFrame);
        node.getComponent(Sprite).spriteFrame = spr;
    }

    //     /** 更新骨骼动画 */
    //     updateSpineSync(node: Node, url: string, animName: string, isLoop = false, callback?: Function) {
    //         if (!isValid(node)) {
    //             PrintError(`updateSpineSync not node = ${url}`);
    //             return;
    //         }
    //         let spine: sp.Skeleton = node.getComponent(sp.Skeleton);
    //         if (!spine) {
    //             PrintError(`updateSpineSync not spine = ${url}`);
    //             return;
    //         }
    //         ResLoadHelper.loadAssetAsync(url, sp.SkeletonData, (skeletonData: sp.SkeletonData) => {
    //             if (!skeletonData || !isValid(node)) {
    //                 PrintError(`updateSpineSync not SkeletonData = ${url}`);
    //                 return;
    //             }
    //             spine.skeletonData = skeletonData;
    //             this.chgSpineAction(spine, animName, isLoop, callback);
    //         })
    //     }

    //     /** 切换动作 */
    //     chgSpineAction(spine: sp.Skeleton, actionName: string, isLoop = false, callback?: Function) {
    //         if (!spine.findAnimation(actionName)) {
    //             PrintError(` chgSpineAc not action =${actionName}`);
    //             callback && callback();
    //             return;
    //         }
    //         spine.setAnimation(0, actionName, isLoop);
    //         if (callback) {
    //             // 注册动画的结束回调
    //             spine.setCompleteListener((track, loop) => {
    //                 callback && callback(spine.node, track);
    //             });
    //         }
    //     }

    //     /** 同步切换动作 等待结束 */
    //     chgSpineActionSync(spine: sp.Skeleton, actionName: string, isLoop = false) {
    //         return new Promise((resolve, reject) => {
    //             this.chgSpineAction(spine, actionName, isLoop, resolve)
    //         })
    //     }

    //     /** 播放动画 */
    //     playAnimation(node: Node, clipName: string, isReverse = false) {
    //         if (!isValid(node)) {
    //             PrintError(`playAnimation not node`);
    //             return;
    //         }
    //         let anim = node.getComponent(Animation);
    //         if (!anim) {
    //             PrintError(`playAnimation not animation `);
    //             return;
    //         }
    //         let animState = anim.play(clipName);
    //         animState.speed = isReverse ? -1 : 1;
    //     }

    //     /** 设置图片灰度 */
    //     setSpriteGray(node: Node, isGray: boolean) {
    //         if (!isValid(node)) {
    //             return;
    //         }

    //         if (node.getComponent(Sprite)) {
    //             let material = Material.getBuiltinMaterial((isGray ? Material.BUILTIN_NAME.GRAY_SPRITE : Material.BUILTIN_NAME.SPRITE).toString())
    //             node.getComponent(Sprite).setMaterial(0, material);
    //         }
    //         // 子节点都设置灰度
    //         if (node.childrenCount) {
    //             node.children.forEach(child => {
    //                 this.setSpriteGray(child, isGray)
    //             });
    //         }
    //     }

    //     /**
    //      * Q弹动画
    //      * @param node
    //      * @param times 次数
    //      * @param time 时间
    //      * @param rate 幅度
    //      * @param normalX X原始大小
    //      * @param normalY Y原始大小
    //      * @returns
    //      */
    //     getTweenQ(node: Node, times = 2, time = 0.1, rate = 0.05, normalX = 1, normalY = 1) {
    //         if (!isValid(node)) {
    //             return;
    //         }
    //         let maxTimesX = normalX / rate < times ? normalX / rate : times;
    //         let maxTimesY = normalY / rate < times ? normalY / rate : times;
    //         let maxTime = maxTimesX < maxTimesY ? maxTimesX : maxTimesY;
    //         let t = tween(node)
    //         for (let i = maxTime; i > 0; i--) {
    //             t.then(tween().to(time, { scaleX: normalX + rate * i, scaleY: normalY - rate * i }))
    //                 .then(tween().to(time, { scaleX: normalX - rate * i, scaleY: normalY + rate * i }))
    //         }
    //         t.then(tween().to(0.1, { scaleX: normalX, scaleY: normalY }))
    //         return t;
    //     }

    //     /**
    //      * 抖动效果
    //      * @param node
    //      * @param duration 持续时间
    //      * @param rate 幅度
    //      */
    //     async shake(node: Node, duration: number = 0, rate: number = 5) {
    //         this.repeatShake(node, rate);
    //         if (duration) {
    //             await ToolsHelper.delayTime(duration);
    //             this.stopShake(node);
    //         }
    //     }

    //     /** 重复抖动 */
    //     private repeatShake(node: Node, rate: number) {
    //         let originalPos: Vec3 = Vec3.ZERO;
    //         if (node["originalPos"]) {
    //             originalPos = node["originalPos"];
    //         } else {
    //             node.getPosition(originalPos);
    //             node.attr({ originalPos });
    //         }
    //         node.setPosition(originalPos);

    //         let rangeX = ToolsHelper.getRandom(-rate, rate);
    //         let rangeY = ToolsHelper.getRandom(-rate, rate);
    //         tween(node)
    //             .to(0.1, { position: originalPos.add(v3(rangeX, rangeY, 0)) })
    //             .call(this.repeatShake.bind(this, node, rate))
    //             .start()
    //     }

    // stopShake(node: Node) {
    //     tween.stopAllByTarget(node);
    //     if (node["originalPos"]) {
    //         let originalPos = node["originalPos"];
    //         node.setPosition(originalPos);
    //     }
    // }

    /**
    * 坐标转换
    * @param curNode 当前节点
    * @param targetNode 目标节点
    * @returns
    */
    convertToNodeSpaceAR(curNode: Node, targetNode: Node) {
        return targetNode.getComponent(UITransform).convertToNodeSpaceAR(curNode.parent.getComponent(UITransform).convertToWorldSpaceAR(curNode.getPosition()));
    }

    /**
     * 通过当前坐标转化为目标节点坐标
     * @param nodePos 节点当前坐标
     * @param nodeParent 节点父亲
     * @param targetNode 目标节点
     * @returns
     */
    convertToPosSpaceAR(nodePos: Vec2, nodeParent: Node, targetNode: Node) {
        return targetNode.getComponent(UITransform).convertToNodeSpaceAR(nodeParent.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(nodePos.x, nodePos.y, 0)));
    }

    /** 空间坐标转屏幕坐标
     * 
     */
    wordToScree(camera: Camera, wordPos: Vec3) {
        return camera.worldToScreen(wordPos);
    }

    //     /**
    //      * 延迟时间
    //      * @param cmpt
    //      * @param time (0表示下一帧执行)
    //      */
    //     async delayTime(cmpt: Component, time: number) {
    //         await new Promise(t => cmpt.scheduleOnce(t, time));
    //     }

    //     /** slot开始时回弹 */
    //     async playBeginScrollBack(node: Node) {
    //         Tween.stopAllByTarget(node);
    //         let costTime = 0.2
    //         let dis = 40
    //         return new Promise(r => {
    //             tween(node)
    //                 .by(costTime, { position: new Vec3(0, dis, 0) }, { easing: "sineOut" })
    //                 .call(r)
    //                 .start();
    //         })
    //     }

    //     /** 滚动回弹效果 */
    //     async playScrollBack(node: Node, isBegin: boolean) {
    //         if (isBegin) {
    //             await this.playBeginScrollBack(node);
    //         } else {
    //             await this.playEndScrollBack(node);
    //         }
    //     }

    //     /** slot结束时回弹 */
    //     async playEndScrollBack(node: Node) {
    //         Tween.stopAllByTarget(node);
    //         let costTime = 0.1
    //         let dis = 20
    //         return new Promise(r => {
    //             tween(node)
    //                 .by(costTime, { position: new Vec3(0, -dis, 0) })
    //                 .by(costTime * 0.5, { position: new Vec3(0, dis, 0) })
    //                 .call(r)
    //                 .start();
    //         })
    //     }

    //     playScaleBack(node: Node) {
    //         Tween.stopAllByTarget(node);
    //         node.setScale(1, 1, 1);
    //         tween(node)
    //             .to(0.5, { scale: 1.2 }, { easing: "elasticOut" })
    //             .to(0.2, { scale: 1 })
    //             .start();
    //     }

    //     /**
    //      * 设置按钮是否可以点击
    //      * @param node 按钮所在节点
    //      * @param isOn 是否启用
    //      * @returns
    //      */
    //     setBtnInteract(node: Node, isOn: boolean) {
    //         if (!node) return;
    //         let btn = node.getComponent(Button);
    //         if (!btn) return;
    //         btn.interactable = isOn;
    //         CocosHelper.setSpriteGray(node, !isOn);
    //         node.children.forEach(child => {
    //             CocosHelper.setSpriteGray(child, !isOn);
    //         });
    //     }

    //     /** 筹码飞入下注区域动作 */
    //     flyAreaAction(chips: Node, areaPos: Vec2, callback?: Function) {
    //         tween(chips)
    //             .to(0.5, { position: v3(areaPos.x, areaPos.y, 0), scale: 1.1 }, { easing: "sineOut" })
    //             .call(() => {
    //                 chips.scale = 1;
    //                 callback && callback();
    //             })
    //             .start();
    //     }

    //     /** 筹码飞向玩家的动作 */
    //     flyPlayerAction(chips: Node, playerPos: Vec2, callback?: Function) {
    //         tween(chips)
    //             .to(0.1, { scale: 1.2 })
    //             .to(0.8, { position: v3(playerPos.x, playerPos.y,), scale: 1, opacity: 200 }, { easing: "backIn" })
    //             .delay(0.08)
    //             .removeSelf()
    //             .call(() => {
    //                 chips.opacity = 255;
    //                 callback && callback();
    //             })
    //             .start();
    //     }
}

export let CocosHelper = new Helper();