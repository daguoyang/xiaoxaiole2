import { AudioClip, AudioSource, game, js, JsonAsset, Node } from "cc";
import { PrintError, PrintLog } from "../utils/logHelper";
import { ResLoadHelper } from "../utils/resLoadHelper";
import { StorageHelper, StorageHelperKey } from "../utils/storageHelper";
import { App } from "./app";
import { SingletonClass } from "./singletonClass";

/** 配置属性 */
interface Configure {
    ID: number,
    name: string,
    /** 音乐1,音效2 */
    type: number,
    isLoop: number,
    isCommon: number,
}

/** 声音类型 */
export enum SoundType {
    Music = 1,
    Effect = 2,
}

/**
 * 声音管理
 */
export class AudioManager extends SingletonClass<AudioManager> {
    private _audioVol: number = 1.0;
    private _isHide: boolean = false;

    // 储存AudioClip
    private _commonClipCache: Record<number, AudioClip> = js.createMap();

    private _bgAudio: AudioSource = undefined;
    private _effectCtrlAudio: AudioSource = undefined;              // 灵活控制音效

    protected onInit(bindNode: Node) {
        this._audioVol = StorageHelper.getData(StorageHelperKey.Audio_Volume, 1.0);
        this._isHide = !this._audioVol;

        this._bgAudio = (bindNode.getComponent(AudioSource) || bindNode.addComponent(AudioSource));
        this._bgAudio.volume = this._audioVol;
        this._effectCtrlAudio = bindNode.addComponent(AudioSource);

        App.event.on('hide', () => {
            this._isHide = true;
            this._bgAudio.stop();
        }, this);
        App.event.on('show', () => {
            this._isHide = false;
            this._audioVol > 0 && this._bgAudio.play();
        }, this);

    }

    protected onDestroy() {
        this._bgAudio.destroy();
        delete this._bgAudio;

        this._effectCtrlAudio.destroy();
        delete this._effectCtrlAudio;
    }

    public keepPlay(): void {
        if (this._bgAudio) {
            this._audioVol > 0 && !this._bgAudio.playing && this._bgAudio.play();
        }
    }

    /**
     * 播放声音
     * @param soundKey 
     * @param isInterrupt 是否可中断
     * @returns 
     */
    async play(soundKey: string, type: number = SoundType.Effect, isLoop: boolean = false, isInterrupt = false) {
        // if (this._isHide) return;
        let clip: AudioClip = this._commonClipCache[soundKey];
        if (!clip) {
            clip = await ResLoadHelper.loadCommonAudioClip(soundKey);
            this._commonClipCache[soundKey] = clip;
        }
        if (!clip) {
            return;
        }
        this.playClip(soundKey, type, clip, isLoop, isInterrupt);
    }

    private playClip(soundCfg: string, type: number, clip: AudioClip, isLoop: boolean, isInterrupt = false) {
        // 背景音乐先保存下来
        if (isLoop) {
            this._bgAudio.stop();
            this._bgAudio.clip = clip;
            this._bgAudio.loop = true;
        }

        // 音乐开关
        let isOpenMusic = StorageHelper.getBooleanData(StorageHelperKey.Music_Status);
        if (type == SoundType.Music && !isOpenMusic) {
            return;
        }
        let isOpenEff = StorageHelper.getBooleanData(StorageHelperKey.Music_Eff_Status);
        if (type == SoundType.Effect && !isOpenEff) {
            return;
        }

        PrintLog("  播放声音 = " + soundCfg);
        if (isLoop) {
            this._bgAudio.play();
        } else {
            // 可随时中断的音效
            this._effectCtrlAudio.clip = clip;
            this._effectCtrlAudio.loop = false;
            this._effectCtrlAudio.play();
        }
    }

    /**
     * 设置声音是否启用
     */
    private setMusicOpen(isOpen: boolean) {
        let vol = isOpen ? 1 : 0;
        this.setVolume(vol);
    }

    resumeMusic() {
        this.setMusicOpen(true)
        this._bgAudio.play();
    }

    stopMusic() {
        this.setMusicOpen(false)
        this._bgAudio.stop();
        this.stopEffect();
    }

    /**
     * 需要及时停止的音效单独处理
     */
    stopEffect() {
        this._effectCtrlAudio.stop();
    }//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999


    public get isOpen(): boolean { return this._audioVol > 0; }


    /**
     * 设置音乐（效）音量
     * @param vol 音量
     */
    public setVolume(vol: number): void {
        this._bgAudio.volume = vol;
        this._audioVol = vol;
        StorageHelper.setData(StorageHelperKey.Audio_Volume, this._audioVol);
    };

    /**
     * 获取音量，包括音乐和音效
     */
    public get volumes(): number { return this._audioVol; }
}