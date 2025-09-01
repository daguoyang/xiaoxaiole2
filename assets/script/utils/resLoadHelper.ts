import { Asset, assetManager, AssetManager, AudioClip, error, ImageAsset, Prefab, resources, SpriteFrame, Texture2D } from "cc";
import { PrintError, PrintLog } from "./logHelper";

/**
 * 加载资源
 */
class Helper {
    private resBundle: AssetManager.Bundle = resources;
    setBundle(bundle?: AssetManager.Bundle) {
        this.resBundle = bundle || resources;
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
            url = type == Prefab ? `prefab/${url}` : url;
            if (type == SpriteFrame) {
                url += "/spriteFrame"
            }
            resources.load(url, type, (err, assets) => {
                if (err) {
                    PrintError(`loadCommonAssetSync 加载asset失败, url:${url}, err: ${err}`);
                    resolve(null);
                } else {
                    PrintLog(url)
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
        return this.loadAssetSync(`prefab/${url}`, Prefab);
    }

    /** 加载声音文件 */
    async loadAudioClipSync(soundFile: string): Promise<AudioClip> {
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