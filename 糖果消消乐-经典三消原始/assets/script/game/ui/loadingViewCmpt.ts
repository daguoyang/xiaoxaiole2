import { _decorator, Node, UITransform, AssetManager } from 'cc';
import { BaseViewCmpt } from '../../components/baseViewCmpt';
import { ViewName } from '../../const/viewNameConst';
import { App } from '../../core/app';
import { SoundType } from '../../core/audioManager';
import { CocosHelper } from '../../utils/cocosHelper';
import { ResLoadHelper } from '../../utils/resLoadHelper';
const { ccclass } = _decorator;

@ccclass('loadingViewCmpt')
export class loadingViewCmpt extends BaseViewCmpt {
    private spPro: Node = null;
    private spProWidth: number = 0;
    private lbPro: Node = null;
    onLoad() {
        super.onLoad();
        this.lbPro = this.viewList.get('lbPro');
        this.spPro = this.viewList.get('spPro');
        this.spProWidth = this.spPro.getComponent(UITransform).width;
        this.spPro.getComponent(UITransform).width = 0;
        CocosHelper.updateLabelText(this.lbPro, "Loading... 0.00%", false);
        this.startLoadResources();
        App.audio.play('background', SoundType.Music, true);
    }

    startLoadResources() {
        let url = [
            "./prefab/ui/acrossView",
            "./prefab/ui/homeView",
            "./prefab/ui/gameView",
        ];
        ResLoadHelper.preloadPath(url, (finish: number, total: number, item: AssetManager.RequestItem) => {
            let per = `${(finish / total * 100).toFixed(2)}%`;
            if (this.spPro) {
                this.spPro.getComponent(UITransform).width = (finish / total) * this.spProWidth;
                CocosHelper.updateLabelText(this.lbPro, "Loading... " + per, false);
            }
        }, async () => {
            this.scheduleOnce(() => {
                // App.view.openView(ViewName.Single.eHomeView);
                App.view.openView(ViewName.Single.eAcrossView);
                // this.onClick_closeBtn();
            }, 1)
        }, async (err) => {
            // 加载出错
        });
    }
}


