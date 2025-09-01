import { Asset, assetManager, AssetManager, AudioClip, error, ImageAsset, JsonAsset, Prefab, resources, SpriteFrame, Texture2D } from "cc";
import { PrintError, PrintLog } from "./logHelper";

/**
 * 加载资源
 */
class Helper {
    private resBundle: AssetManager.Bundle = resources;
    private prefabBundle: AssetManager.Bundle | null = null;
    private audioBundle: AssetManager.Bundle | null = null;
    private configBundle: AssetManager.Bundle | null = null;
    private uiBundle: AssetManager.Bundle | null = null;

    setBundle(bundle?: AssetManager.Bundle) {
        this.resBundle = bundle || resources;
    }

    /** 初始化分包bundle */
    async initBundles() {
        try {
            // 加载预制体分包
            this.prefabBundle = await this.loadBundle('prefab-resources');
            // 加载音频分包  
            this.audioBundle = await this.loadBundle('audio-resources');
            // 加载配置分包
            this.configBundle = await this.loadBundle('level-configs');
            // 加载UI分包
            this.uiBundle = await this.loadBundle('ui-resources');
            PrintLog('All bundles loaded successfully');
        } catch (error) {
            PrintError(`Failed to load bundles: ${error}`);
        }
    }

    /** 加载bundle */
    private loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    PrintError(`Failed to load bundle ${bundleName}: ${err}`);
                    reject(err);
                } else {
                    PrintLog(`Bundle ${bundleName} loaded successfully`);
                    resolve(bundle);
                }
            });
        });
    }

    /** 预加载资源 */
    preloadAsset(url: string, type: typeof Asset) {
        this.resBundle.preload(url, type);
    }

    /** 预加载文件夹 */
    preloadDir(url: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, call: (items: AssetManager.RequestItem[]) => void) {
        this.resBundle.preloadDir(url, (finish: number, total: number, item: AssetManager.RequestItem) => {
            onProgress && onProgress(finish, total, item);
        }, (err: Error, items: AssetManager.RequestItem[]) => {
            if (err) {
                error(`preloadDir 加载asset失败, url:${url}, err: ${err}`);
                return null;
            }
            call && call(items);
        });
    }
    /** 预加载文件 */
    preloadPath(url: string[], onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, call: (items: AssetManager.RequestItem[]) => void, faild: Function) {
        this.resBundle.preload(url, (finish: number, total: number, item: AssetManager.RequestItem) => {
            onProgress && onProgress(finish, total, item);
        }, (err: Error, items: AssetManager.RequestItem[]) => {
            if (err) {
                faild && faild(err);
                error(`preload 加载asset失败, url:${url}, err: ${err}`);
                return null;
            }
            call && call(items);
        });
    }

    /** 加载3D模型 */
    async loadModle(name: string) {
        return await this.loadCommonAssetSync(`modle/${name}`, Prefab);
    }
    /** 加载3D模型 */
    async loadPieces(name: string) {
        return await this.loadCommonAssetSync(`pieces/${name}`, Prefab);
    }

    // 加载通用资源
    async loadCommonAssetSync(url: string, type: typeof Asset) {
        return new Promise((resolve: (ret: any) => void) => {
            let bundle = resources;
            let finalUrl = url;

            // 根据资源类型和路径确定使用哪个bundle
            if (type == Prefab) {
                if (url.startsWith('ui/') && this.prefabBundle) {
                    bundle = this.prefabBundle;
                    finalUrl = `prefab/${url}`;
                } else {
                    finalUrl = `prefab/${url}`;
                }
            } else if (url.startsWith('config/') && this.configBundle) {
                bundle = this.configBundle;
            } else if (url.startsWith('sound/') && this.audioBundle) {
                bundle = this.audioBundle;
            } else if (type == SpriteFrame) {
                finalUrl += "/spriteFrame";
            }

            bundle.load(finalUrl, type, (err, assets) => {
                if (err) {
                    PrintError(`loadCommonAssetSync 加载asset失败, url:${finalUrl}, bundle:${bundle === resources ? 'resources' : 'custom'}, err: ${err}`);
                    resolve(null);
                } else {
                    PrintLog(`Successfully loaded: ${finalUrl} from bundle: ${bundle === resources ? 'resources' : 'custom'}`);
                    resolve(assets);
                }
            });
        });
    }

    /** 同步加载资源 */
    loadAssetSync(url: string, type: typeof Asset) {
        return new Promise((resolve: (ret: any) => void) => {
            this.resBundle.load(url, type, (err, assets) => {
                if (err) {
                    PrintError(`loadAssetSync 加载asset失败, url:${url}, err: ${err}`);
                    resolve(null);
                } else {
                    resolve(assets);
                }
            });
        });
    }

    /** 异步加载资源 */
    loadAssetAsync(url: string, type: typeof Asset, call: (res: Asset) => void, isRemote: boolean = false, isCommon = false) {
        if (isRemote) {
            assetManager.loadRemote(url, { ext: '.png' }, (err, texture: ImageAsset) => {
                if (err) {
                    PrintError(`loadAssetAsync remote png 加载asset失败, url:${url}, err: ${err}`);
                    assetManager.loadRemote(url, { ext: '.jpg' }, (err, texture: ImageAsset) => {
                        if (err) {
                            PrintError(`loadAssetAsync remote jpg 加载asset失败, url:${url}, err: ${err}`);
                            return null;
                        }
                        let spr = new SpriteFrame();
                        let texture2d = new Texture2D();
                        texture2d.image = texture;
                        spr.texture = texture2d
                        call && call(spr);
                    })
                    return null;
                }
                let spr = new SpriteFrame();
                let texture2d = new Texture2D();
                texture2d.image = texture;
                spr.texture = texture2d
                call && call(spr);
            })
        }
        else {
            // let bundle = isCommon ? resources : this.resBundle;
            let bundle = this.resBundle;
            bundle.load(url, type, (err: Error, asset: Asset) => {
                if (err) {
                    PrintError(`loadAssetAsync 加载asset失败, url:${url}, err: ${err}`);
                    return null;
                }
                call && call(asset);
            });
        }
    }

    /** 同步加载prefab文件 */
    async loadPrefabSync(url: string): Promise<Prefab> {
        // 使用预制体分包来加载UI预制体
        if (url.startsWith('ui/') && this.prefabBundle) {
            return new Promise((resolve: (ret: any) => void) => {
                this.prefabBundle!.load(`prefab/${url}`, Prefab, (err, assets) => {
                    if (err) {
                        PrintError(`loadPrefabSync 加载prefab失败, url:prefab/${url}, err: ${err}`);
                        resolve(null);
                    } else {
                        PrintLog(`Successfully loaded prefab: ${url} from prefab-resources bundle`);
                        resolve(assets);
                    }
                });
            });
        }
        return this.loadAssetSync(`prefab/${url}`, Prefab);
    }

    /** 加载声音文件 */
    async loadAudioClipSync(soundFile: string): Promise<AudioClip> {
        // 优先从音频分包加载
        if (this.audioBundle) {
            return new Promise((resolve: (ret: any) => void) => {
                this.audioBundle!.load(`sound/${soundFile}`, AudioClip, (err, assets) => {
                    if (err) {
                        PrintError(`loadAudioClipSync 加载audio失败, url:sound/${soundFile}, err: ${err}`);
                        resolve(null);
                    } else {
                        PrintLog(`Successfully loaded audio: ${soundFile} from audio-resources bundle`);
                        resolve(assets);
                    }
                });
            });
        }
        return this.loadAssetSync(`sound/${soundFile}`, AudioClip);
    }

    /** 加载通用声音文件 */
    async loadCommonAudioClip(soundFile: string): Promise<AudioClip> {
        return this.loadCommonAssetSync(`sound/${soundFile}`, AudioClip);
    }

    /** 释放资源 */
    releaseAsset(url: string, type?: typeof Asset) {
        this.resBundle.release(url, type);
    }
}

export let ResLoadHelper: Helper = new Helper();