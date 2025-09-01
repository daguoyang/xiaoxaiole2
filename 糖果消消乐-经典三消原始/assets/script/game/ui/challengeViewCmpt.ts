import { _decorator, Node } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { Bomb, LevelData } from '../../const/enumConst';
import { EventName } from '../../const/eventName';
import { LevelConfig } from '../../const/levelConfig';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { CocosHelper } from '../../utils/cocosHelper';
import { GlobalFuncHelper } from '../../utils/globalFuncHelper';
import { gridCmpt } from './item/gridCmpt';
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

        target.children.forEach((item, idx) => {
            item.active = idx < idArr.length;
            if (idx < idArr.length) {
                item.getComponent(gridCmpt).setType(idArr[idx]);
                let count = ctArr[idx] + 10;
                if (ctArr[idx] < 10) {
                    count = ctArr[idx] + 30;
                }
                item.getComponent(gridCmpt).setCount(count);
            }
        });

        CocosHelper.updateLabelText(this.lbTool3, this.tCount3);
        CocosHelper.updateLabelText(this.lbTool2, this.tCount2);
        CocosHelper.updateLabelText(this.lbTool1, this.tCount1);
        this.setAddStatus();
    }

    onClick_playBtn() {
        App.audio.play('button_click');
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
        // App.view.closeView(ViewName.Single.eHomeView);
        this.onClick_closeBtn();
        App.view.openView(ViewName.Single.eGameView, this.lv);
    }

    onClickToolBtn(btn: Node) {
        App.audio.play('button_click');
        let idx = +btn.name.substring(btn.name.length - 1, btn.name.length);
        if (this[`tCount${idx}`] <= 0) {
            App.event.emit(EventName.Game.GotoShop);
            this.onClick_closeBtn();
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
}
