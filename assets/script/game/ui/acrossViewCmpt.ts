import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
@ccclass('acrossViewCmpt')
export class acrossViewCmpt extends BaseViewCmpt {
    onLoad() {
        super.onLoad();
    }

    loadExtraData() {
        App.view.closeView(ViewName.Single.eLoadingView);

    }
    onClick_startBtn() {
        App.view.openView(ViewName.Single.eHomeView);
    }
}


