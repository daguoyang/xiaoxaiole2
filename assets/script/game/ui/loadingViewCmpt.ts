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
        
        // 智能播放背景音乐，如果音频分包未加载也不会报错
        this.tryPlayBackgroundMusic();
    }

    startLoadResources() {
        // 核心分包已经在App启动时加载，直接开始预制体加载
        this.updateProgress(0, "准备加载游戏资源...");
        this.loadPrefabs();
    }
    
    private loadPrefabs() {
        let url = [
            "./prefab/ui/acrossView",
            "./prefab/ui/homeView", 
            "./prefab/ui/gameView",
        ];
        
        ResLoadHelper.preloadPath(url, (finish: number, total: number, item: AssetManager.RequestItem) => {
            // 预制体加载进度从0%到100%
            const progress = finish / total;
            const per = `${(progress * 100).toFixed(1)}%`;
            this.updateProgress(progress, "Loading... " + per);
        }, () => {
            // 加载完成，短暂停留让用户看到100%
            this.updateProgress(1, "完成!");
            this.scheduleOnce(() => {
                App.view.openView(ViewName.Single.eAcrossView);
            }, 0.3); // 快速进入下一页面
        }, (err) => {
            console.error('预制体加载失败:', err);
            // 即使加载失败也继续，避免卡死
            this.scheduleOnce(() => {
                App.view.openView(ViewName.Single.eAcrossView);
            }, 0.5);
        });
    }
    
    private updateProgress(progress: number, text: string) {
        if (this.spPro) {
            this.spPro.getComponent(UITransform).width = progress * this.spProWidth;
            CocosHelper.updateLabelText(this.lbPro, text, false);
        }
    }
    
    private tryPlayBackgroundMusic() {
        // 立即尝试播放，如果失败会自动延迟加载
        App.audio.play('background', SoundType.Music, true);
        
        // 如果第一次失败，1秒后重试
        this.scheduleOnce(() => {
            App.audio.play('background', SoundType.Music, true);
        }, 1);
    }
}


