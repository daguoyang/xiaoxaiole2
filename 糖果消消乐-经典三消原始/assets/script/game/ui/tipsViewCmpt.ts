import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import { BaseNodeCmpt } from '../../components/baseNodeCmpt';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { CocosHelper } from '../../utils/cocosHelper';
import { ToolsHelper } from '../../utils/toolsHelper';
const { ccclass, property } = _decorator;

@ccclass('tipsViewCmpt')
export class tipsViewCmpt extends BaseViewCmpt {
    onLoad() {
        super.onLoad();
    }

    setTips(str: string) {
        CocosHelper.updateLabelText(this.viewList.get('animNode/lb'), str, false);
    }

    async setCloseFunc(cb: Function) {
        await ToolsHelper.delayTime(2);
        tween(this.node).to(0.5, { position: new Vec3(0, 1000) }).call(() => {
            cb && cb();
        }).start()
    }

    upMove() {
        let pos = this.node.position;
        let v3p = new Vec3(pos.x, pos.y + 100, pos.z);
        this.node.setPosition(v3p);
    }

}


