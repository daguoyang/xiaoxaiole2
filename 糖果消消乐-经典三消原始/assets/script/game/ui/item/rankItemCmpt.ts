import { _decorator, Component, Node } from 'cc';
import ScrollItemCmpt from '../../../components/scrollItemCmpt';
import { RankData } from '../../../const/enumConst';
import { App } from '../../../core/app';
import { CocosHelper } from '../../../utils/cocosHelper';
const { ccclass, property } = _decorator;

@ccclass('rankItemCmpt')
export class rankItemCmpt extends ScrollItemCmpt {
    private head: Node = null;
    private lbName: Node = null;
    private lbLevel: Node = null;
    private lbRank: Node = null;
    private lbBei: Node = null;
    onLoad() {
        super.onLoad();
        this.head = this.viewList.get('head');
        this.lbName = this.viewList.get('lbName');
        this.lbRank = this.viewList.get('lbRank');
        this.lbLevel = this.viewList.get('lbLevel');
        this.lbBei = this.viewList.get('lbBei');
    }
    initData(data: RankData) {
        this.viewList.get('self').active = data.name == App.user.rankData.name;
        //头像
        CocosHelper.updateLabelText(this.lbBei, data.level);
        CocosHelper.updateLabelText(this.lbName, data.name);
        CocosHelper.updateLabelText(this.lbLevel, data.level);
        CocosHelper.updateLabelText(this.lbRank, data.rank);
        this.viewList.get('1').active = data.rank == 1;
        this.viewList.get('2').active = data.rank == 2;
        this.viewList.get('3').active = data.rank == 3;
        this.viewList.get('lbRank').active = data.rank > 3;
        CocosHelper.updateUserHeadSpriteAsync(this.head, data.icon);
    }
}


