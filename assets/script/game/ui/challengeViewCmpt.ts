import { _decorator, Node, Vec3, UITransform, instantiate, tween, v3, Sprite, SpriteFrame, resources, Label, Color } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { Bomb, LevelData } from '../../const/enumConst';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { CocosHelper } from '../../utils/cocosHelper';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { gridCmpt } from './item/gridCmpt';
import { adManager } from '../../ads/AdManager';
const { ccclass, property } = _decorator;

@ccclass('challengeViewCmpt')
export class challengeViewCmpt extends BaseViewCmpt {
    private lv: number = 0;
    private lbTool1: Node = null;
    private lbTool2: Node = null;
    private lbTool3: Node = null;

    private tCount1: number = 0;
    private tCount2: number = 0;
    private tCount3: number = 0;
    onLoad() {
        for (let i = 1; i < 4; i++) {
            this[`onClick_toolBtn${i}`] = this.onClickToolBtn.bind(this);
        }
        super.onLoad();
        this.lbTool1 = this.viewList.get('animNode/content/bg/toolBtn1/prompt/lbTool1');
        this.lbTool2 = this.viewList.get('animNode/content/bg/toolBtn2/prompt/lbTool2');
        this.lbTool3 = this.viewList.get('animNode/content/bg/toolBtn3/prompt/lbTool3');
        this.tCount1 = GlobalFuncHelper.getBomb(Bomb.hor) //+ GlobalFuncHelper.getBomb(Bomb.ver);
        this.tCount2 = GlobalFuncHelper.getBomb(Bomb.bomb);
        this.tCount3 = GlobalFuncHelper.getBomb(Bomb.allSame);
    }

    async loadExtraData(lv: number) {
        this.lv = lv;
        CocosHelper.updateLabelText(this.viewList.get('animNode/content/lb/title'), `第${lv}关`);
        let data: LevelData = await LevelConfig.getLevelData(lv);
        let target = this.viewList.get('animNode/content/target');
        let idArr = data.mapData[0].m_id;
        let ctArr = data.mapData[0].m_ct;

        // 先计算映射后的显示类型和叠加数量
        let displayTargets = new Map<number, {originalIds: number[], totalCount: number}>();
        
        for (let i = 0; i < idArr.length; i++) {
            let targetId = idArr[i];
            let targetCount = ctArr[i];
            
            // 计算显示类型
            let displayType = targetId;
            if (targetId >= 200) {
                displayType = (targetId - 200) % App.gameLogic.blockCount;
            } else if (targetId >= App.gameLogic.blockCount) {
                displayType = targetId % App.gameLogic.blockCount;
            }
            
            // 计算目标数量
            let count = targetCount + 10;
            if (targetCount < 10) {
                count = targetCount + 30;
            }
            
            // 叠加相同显示类型的数量
            if (displayTargets.has(displayType)) {
                let existing = displayTargets.get(displayType);
                existing.originalIds.push(targetId);
                existing.totalCount += count;
            } else {
                displayTargets.set(displayType, {
                    originalIds: [targetId],
                    totalCount: count
                });
            }
        }
        
        // 显示去重后的目标
        let displayIndex = 0;
        target.children.forEach((item, idx) => {
            if (displayIndex < displayTargets.size) {
                let displayType = Array.from(displayTargets.keys())[displayIndex];
                let targetInfo = displayTargets.get(displayType);
                
                item.active = true;
                item.getComponent(gridCmpt).setType(displayType);
                item.getComponent(gridCmpt).setCount(targetInfo.totalCount);
                
                console.log(`目标${displayIndex}: 显示类型${displayType}, 原始IDs[${targetInfo.originalIds.join(',')}], 总数量${targetInfo.totalCount}`);
                displayIndex++;
            } else {
                item.active = false;
            }
        });

        CocosHelper.updateLabelText(this.lbTool3, this.tCount3);
        CocosHelper.updateLabelText(this.lbTool2, this.tCount2);
        CocosHelper.updateLabelText(this.lbTool1, this.tCount1);
        this.setAddStatus();
    }

    onClick_playBtn() {
        App.audio.play('button_click');
        
        // 检查体力是否足够
        if (!App.heart.canStartGame()) {
            // 体力不足时通过广告获取体力并开始游戏
            App.heart.showHeartInsufficientTipsWithAd(() => {
                // 广告观看完成后，消耗刚获得的体力并开始游戏
                if (App.heart.consumeHeart(1)) {
                    this.startGameLogic();
                } else {
                    App.view.showMsgTips('❌ 体力消耗失败，请重试');
                }
            });
            return;
        }
        
        // 消耗1点体力
        if (!App.heart.consumeHeart(1)) {
            // 体力不足时通过广告获取体力并开始游戏
            App.heart.showHeartInsufficientTipsWithAd(() => {
                // 广告观看完成后，消耗刚获得的体力并开始游戏
                if (App.heart.consumeHeart(1)) {
                    this.startGameLogic();
                } else {
                    App.view.showMsgTips('❌ 体力消耗失败，请重试');
                }
            });
            return;
        }
        
        this.startGameLogic();
    }

    /** 执行开始游戏的具体逻辑 */
    private async startGameLogic() {
        // 播放体力消耗动画（从开始按钮位置开始）
        let playBtn = this.viewList.get('animNode/content/bg/playBtn');
        if (playBtn) {
            console.log('播放体力消耗动画...');
            await this.playHeartConsumeAnimation(playBtn.worldPosition);
            console.log('体力消耗动画完成');
        }
        
        App.gameLogic.toolsArr = [];
        for (let i = 1; i < 4; i++) {
            let s = this.viewList.get(`animNode/content/bg/toolBtn${i}`).getChildByName('s');
            if (s.active) {
                App.gameLogic.toolsArr.push(i + 8);
                switch (i + 8) {
                    case Bomb.allSame:
                        GlobalFuncHelper.setBomb(Bomb.allSame, -1);
                        break;;
                    case Bomb.hor:
                        GlobalFuncHelper.setBomb(Bomb.hor, -1);
                        break;;
                    case Bomb.ver:
                        GlobalFuncHelper.setBomb(Bomb.ver, -1);
                        break;;
                    case Bomb.bomb:
                        GlobalFuncHelper.setBomb(Bomb.bomb, -1);
                        break;;
                }
            }
        }
        
        console.log('准备进入游戏...');
        // App.view.closeView(ViewName.Single.eHomeView);
        this.onClick_closeBtn();
        App.view.openView(ViewName.Single.eGameView, this.lv);
    }

    async onClickToolBtn(btn: Node) {
        App.audio.play('button_click');
        let idx = +btn.name.substring(btn.name.length - 1, btn.name.length);
        if (this[`tCount${idx}`] <= 0) {
            // 道具不足时播放广告获取
            console.log(`道具${idx}不足，播放广告获取`);
            const result = await adManager.showRewardedAd();
            
            if (result === 'completed') {
                // 广告观看完成，增加对应道具数量
                let bombType: number;
                switch (idx) {
                    case 1:
                        bombType = Bomb.hor;
                        break;
                    case 2:
                        bombType = Bomb.bomb;
                        break;
                    case 3:
                        bombType = Bomb.allSame;
                        break;
                    default:
                        bombType = Bomb.hor;
                }
                
                // 增加道具数量
                GlobalFuncHelper.setBomb(bombType, 1);
                this[`tCount${idx}`] = GlobalFuncHelper.getBomb(bombType);
                
                // 更新UI显示
                CocosHelper.updateLabelText(this[`lbTool${idx}`], this[`tCount${idx}`]);
                this.setAddStatus();
                
                console.log(`广告观看完成，获得道具${idx}，当前数量: ${this[`tCount${idx}`]}`);
                App.view.showMsgTips("观看广告成功！获得道具 +1");
                
                // 自动选中该道具
                let ac = btn.getChildByName("s").active;
                btn.getChildByName("s").active = true;
                btn.getChildByName("s1").active = true;
            } else {
                console.log('广告未完整观看或出现错误');
                App.view.showMsgTips("需要完整观看广告才能获得道具");
            }
            return;
        }
        let ac = btn.getChildByName("s").active;
        btn.getChildByName("s").active = !ac;
        btn.getChildByName("s1").active = !ac;
    }

    setAddStatus() {
        for (let i = 1; i < 4; i++) {
            let add = this.viewList.get(`animNode/content/bg/toolBtn${i}`).getChildByName('add');
            add.active = this[`tCount${i}`] <= 0;
        }
    }

    /** 体力消耗飞行动画（从顶部飞向按钮，表示消耗） */
    async playHeartConsumeAnimation(startPos: Vec3) {
        console.log('开始播放体力消耗飞行动画，起始位置:', startPos);
        return new Promise<void>((resolve) => {
            // 直接使用resources.load加载体力图标 - 使用正确的life.png UUID
            resources.load('285eb5fa-ad1a-4991-8637-094326a6cb2d@f9941', SpriteFrame, (err, heartSpriteFrame) => {
                if (err || !heartSpriteFrame) {
                    console.warn('体力图标资源加载失败，使用备用方案:', err);
                    // 备用方案：显示提示，延迟一点时间模拟动画
                    setTimeout(() => {
                        App.view.showMsgTips('体力 -1');
                        resolve();
                    }, 500);
                    return;
                }
                
                console.log('体力图标资源加载成功，开始创建动画');
                try {
                    // 创建飞行的体力图标
                    let flyingHeart = new Node('flyingHeartConsume');
                    let sprite = flyingHeart.addComponent(Sprite);
                    sprite.spriteFrame = heartSpriteFrame;
                    
                    // 设置初始位置和大小
                    let startAnimPos = new Vec3();
                    let targetPos = new Vec3();
                    
                    // 起始位置为屏幕顶部中央（体力显示区域）
                    startAnimPos.set(0, 500, 0); // 从更高的位置开始
                    
                    // 将按钮世界位置转换为当前节点的本地坐标
                    if (this.node && this.node.getComponent(UITransform)) {
                        this.node.getComponent(UITransform).convertToNodeSpaceAR(startPos, targetPos);
                    } else {
                        // 如果转换失败，使用屏幕下方作为目标
                        targetPos.set(0, -200, 0);
                    }
                    
                    console.log(`动画路径: 从 ${startAnimPos} 到 ${targetPos}`);
                    
                    flyingHeart.setPosition(startAnimPos);
                    flyingHeart.setScale(1.2, 1.2, 1.2);
                    this.node.addChild(flyingHeart);
                    
                    // 添加一个"-1"文字标签
                    let textNode = new Node('heartText');
                    let label = textNode.addComponent(Label);
                    label.string = '-1';
                    label.fontSize = 36;
                    label.color = new Color(255, 50, 50, 255); // 红色
                    textNode.setPosition(35, 0, 0); // 相对于体力图标的位置
                    flyingHeart.addChild(textNode);
                    
                    // 创建飞行动画（从体力区域飞向按钮，表示消耗体力）
                    let flyTime = 1.2; // 增加飞行时间，让用户能看清楚动画
                    
                    console.log('开始播放飞行动画，持续时间:', flyTime);
                    
                    tween(flyingHeart)
                        .to(flyTime, { 
                            position: targetPos,
                            scale: v3(0.9, 0.9, 0.9)
                        }, { easing: 'sineIn' })
                        // 到达按钮后有一个撞击效果
                        .to(0.15, { 
                            scale: v3(1.3, 1.3, 1.3)
                        })
                        .to(0.15, { 
                            scale: v3(0, 0, 0)
                        })
                        .call(() => {
                            console.log('体力消耗动画完成');
                            // 动画完成后销毁节点
                            if (flyingHeart && flyingHeart.isValid) {
                                flyingHeart.destroy();
                            }
                            
                            // 显示提示文字
                            App.view.showMsgTips('体力 -1');
                            
                            // 额外延迟一点，确保用户看到效果
                            setTimeout(() => {
                                resolve();
                            }, 300);
                        })
                        .start();
                        
                } catch (error) {
                    console.error('体力消耗动画错误:', error);
                    // 出错时也给个延迟
                    setTimeout(() => {
                        App.view.showMsgTips('体力 -1');
                        resolve();
                    }, 800);
                }
            });
        });
    }
}
