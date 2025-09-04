import { _decorator, Node, tween, v3, Label, instantiate, Vec3, UITransform, Sprite, SpriteFrame, resources, Color, director } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { Advertise } from '../../wx/advertise';
import { gridCmpt } from './item/gridCmpt';
const { ccclass, property } = _decorator;

@ccclass('resultViewCmpt')
export class ResultViewCmpt extends BaseViewCmpt {
    private isWin: boolean = false;
    private level: number = 0;
    private starCount: number = 0;
    private star: Node = null;

    onLoad() {
        super.onLoad();
        this.star = this.viewList.get('animNode/win/star');
        this.updateButtonTexts();
    }

    updateButtonTexts() {
        // 修改分享按钮文本为"看广告"
        let shareBtn = this.viewList.get('animNode/lose/shareBtn') || this.viewList.get('animNode/win/shareBtn');
        if (shareBtn) {
            let label = shareBtn.getComponentInChildren(Label);
            if (label) {
                label.string = "看广告";
            }
        }
        
        // 修改继续按钮文本为"购买"（当金币充足时）或"看广告"（当金币不足时）
        let continueBtn = this.viewList.get('animNode/lose/continueBtn');
        if (continueBtn) {
            let label = continueBtn.getComponentInChildren(Label);
            if (label) {
                label.string = "购买";
            }
        }
    }

    async loadExtraData(lv: number, isWin: boolean, coutArr: any[], starCount: number) {
        if (isWin) {
            App.audio.play('win');
        }
        else {
            App.audio.play('lose');
        }
        this.level = lv;
        this.starCount = starCount;
        this.isWin = isWin;
        this.viewList.get('animNode/win').active = isWin;
        this.viewList.get('animNode/lose').active = !isWin;
        if (isWin) {
            LevelConfig.setLevelStar(lv, starCount);
            this.handleWin(coutArr);
        }
        else {
            this.handleLose();
        }
        
        // 更新按钮文本
        this.updateContinueButtonText();
    }

    handleLose() {

    }

    handleWin(coutArr: any[]) {
        let target = this.viewList.get('animNode/win/target');
        target.children.forEach((item, idx) => {
            if (!coutArr) return;
            item.active = idx < coutArr.length;
            if (idx < coutArr.length) {
                item.getComponent(gridCmpt).setType(coutArr[idx][0]);
                let count = coutArr[idx][1]
                if (count == 0) {
                    item.getComponent(gridCmpt).showGou(true);
                }
                else {
                    item.getComponent(gridCmpt).setCount(count);
                }
            }
        });
        this.playStarAnim();
        
        // 胜利时直接增加体力
        console.log('挑战胜利，增加体力+1');
        App.heart.addHeart(1);
    }

    playStarAnim() {
        this.star.active = this.isWin;
        let count = this.starCount;
        if (this.isWin) {
            this.star.children.forEach((item, idx) => {
                let sChild = item.getChildByName('s');
                if (sChild) {
                    sChild.active = idx + 1 <= count;
                }
                item.setScale(0, 0, 0);
                tween(item).to(0.3 * (idx + 1), { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
            });
        }
    }

    /** 体力飞行动画 */
    async playHeartFlyAnimation(startPos: Vec3, isAdd: boolean = true, actuallyAdd: boolean = true) {
        console.log(`开始播放体力飞行动画，起始位置: ${startPos}, 是否增加: ${isAdd}`);
        return new Promise<void>((resolve) => {
            // 直接使用resources.load加载体力图标 - 使用正确的life.png UUID
            resources.load('285eb5fa-ad1a-4991-8637-094326a6cb2d@f9941', SpriteFrame, (err, heartSpriteFrame) => {
                if (err || !heartSpriteFrame) {
                    console.warn('体力图标资源加载失败，使用备用方案:', err);
                    // 备用方案：直接增加体力，不播放动画
                    if (isAdd && actuallyAdd) {
                        App.heart.addHeart(1);
                        let tipText = isAdd ? '+1' : '-1';
                        App.view.showMsgTips(`体力 ${tipText}`);
                    } else if (isAdd && !actuallyAdd) {
                        console.log('资源加载失败，但体力已在胜利时增加，跳过');
                    }
                    resolve();
                    return;
                }
                
                console.log('体力图标资源加载成功，开始创建动画节点');
                
                try {
                    // 创建飞行的体力图标
                    let flyingHeart = new Node('flyingHeart');
                    let sprite = flyingHeart.addComponent(Sprite);
                    sprite.spriteFrame = heartSpriteFrame;
                    
                    // 设置初始位置和大小
                    flyingHeart.setPosition(startPos);
                    flyingHeart.setScale(1.2, 1.2, 1.2);
                    this.node.addChild(flyingHeart);
                    
                    // 获取体力显示位置
                    let heartPos = this.getHeartDisplayPosition();
                    console.log('体力显示位置:', heartPos);
                    
                    // 创建飞行动画
                    let flyTime = 1.2;
                    
                    tween(flyingHeart)
                        .to(flyTime, { 
                            position: heartPos,
                            scale: v3(0.8, 0.8, 0.8)
                        }, { easing: 'sineOut' })
                        .call(() => {
                            console.log('体力飞行动画完成');
                            
                            if (flyingHeart && flyingHeart.isValid) {
                                flyingHeart.destroy();
                            }
                            
                            // 实际增加体力（如果需要）
                            if (isAdd && actuallyAdd) {
                                App.heart.addHeart(1);
                                App.view.showMsgTips('体力 +1');
                            } else if (isAdd && !actuallyAdd) {
                                console.log('体力已在胜利时增加，跳过重复添加');
                            }
                            
                            resolve();
                        })
                        .start();
                        
                } catch (error) {
                    console.error('体力飞行动画错误:', error);
                    resolve();
                }
            });
        });
    }

    /** 获取体力显示位置 */
    private getHeartDisplayPosition(): Vec3 {
        // 尝试获取体力显示的位置，如果找不到就使用屏幕顶部
        return v3(0, 300, 0); // 屏幕顶部中央
    }

    /** 更新继续按钮文本 */
    updateContinueButtonText() {
        // 根据金币数量决定继续按钮文本
        let continueBtn = this.viewList.get('animNode/lose/continueBtn');
        if (continueBtn) {
            let label = continueBtn.getComponentInChildren(Label);
            if (label) {
                const costGold = 200;
                const currentGold = GlobalFuncHelper.getGold();
                
                if (currentGold >= costGold) {
                    label.string = `${costGold}金币继续`;
                } else {
                    label.string = `${costGold}金币继续\n(金币不足)`;
                }
            }
        }
    }

    /** 点击继续游戏按钮 */
    onClick_nextBtn() {
        console.log('点击继续游戏按钮');
        App.audio.play('button_click');
        
        // 重要：胜利时进入下一关
        if (this.isWin) {
            console.log('关卡胜利，保存进度并进入下一关');
            LevelConfig.nextLevel();
        }
        
        // 播放体力飞行动画（但不实际增加体力，因为已在胜利时增加）
        let btnPos = this.viewList.get('animNode/win/nextBtn').worldPosition;
        this.playHeartFlyAnimation(btnPos, true, false);
        
        // 延迟关闭界面
        this.scheduleOnce(() => {
            this.onClick_closeBtn();
        }, 1.5);
    }

    /** 点击分享按钮（看广告）*/
    onClick_shareBtn() {
        App.audio.play('button_click');
        console.log('点击分享按钮（看广告）');
        
        // 使用正确的广告API
        Advertise.showVideoAds((success: boolean) => {
            if (success) {
                console.log('广告播放成功');
                // 广告播放成功后的奖励逻辑 - 增加体力
                App.heart.addHeart(1);
                App.view.showMsgTips('观看广告成功！获得体力 +1');
            } else {
                console.log('广告播放失败或未完整观看');
                App.view.showMsgTips('广告未完整观看，请重试');
            }
        });
    }

    /** 点击继续按钮（失败界面）*/
    onClick_continueBtn() {
        App.audio.play('button_click');
        console.log('点击继续按钮（200金币继续）');
        
        const costGold = 200;
        const currentGold = GlobalFuncHelper.getGold();
        
        console.log(`当前金币: ${currentGold}, 需要金币: ${costGold}`);
        
        // 检查金币是否足够
        if (currentGold >= costGold) {
            // 金币足够，扣除金币并继续游戏
            GlobalFuncHelper.setGold(-costGold);
            App.view.showMsgTips(`花费${costGold}金币继续游戏！`);
            
            console.log('金币继续游戏成功，重新开始关卡');
            
            // 延迟一下关闭结果界面，重新开始游戏
            this.scheduleOnce(() => {
                this.onClick_closeBtn();
                // 重新打开挑战界面
                App.view.openView(ViewName.Single.eChallengeView, this.level);
            }, 1.0);
            
        } else {
            // 金币不足，提示看广告获取体力
            const needGold = costGold - currentGold;
            App.view.showMsgTips(`金币不足！还需要${needGold}金币。试试看广告获取体力吧！`);
            
            console.log('金币不足，建议观看广告获取体力');
            
            // 可以选择自动播放广告，或者让用户手动点击看广告按钮
            // 这里选择让用户手动点击，符合用户预期
        }
    }

    onClick_closeBtn() {
        App.view.closeView(ViewName.Single.eResultView);
        App.view.openView(ViewName.Single.eHomeView);
    }
}