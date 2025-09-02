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
        PrintLog('开始初始化分包bundles...');
        try {
            // 加载预制体分包
            this.prefabBundle = await this.loadBundle('prefab-resources');
            PrintLog(`prefab-resources bundle loaded: ${this.prefabBundle ? 'success' : 'failed'}`);
            
            // 加载音频分包  
            this.audioBundle = await this.loadBundle('audio-resources');
            PrintLog(`audio-resources bundle loaded: ${this.audioBundle ? 'success' : 'failed'}`);
            
            // 加载配置分包
            this.configBundle = await this.loadBundle('level-configs');
            PrintLog(`level-configs bundle loaded: ${this.configBundle ? 'success' : 'failed'}`);
            
            // 加载UI分包
            this.uiBundle = await this.loadBundle('ui-resources');
            PrintLog(`ui-resources bundle loaded: ${this.uiBundle ? 'success' : 'failed'}`);
            
            PrintLog('所有分包bundles加载完成!');
        } catch (error) {
            PrintError(`Failed to load bundles: ${error}`);
        }
    }

    /** 加载bundle */
    private loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            // 尝试多种方式加载bundle
            PrintLog(`正在尝试加载bundle: ${bundleName}`);
            
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    PrintError(`Failed to load bundle ${bundleName}: ${err}`);
                    PrintError(`Bundle error details: ${JSON.stringify(err)}`);
                    
                    // 列出所有可用的bundles进行调试
                    PrintLog('当前可用的bundles:');
                    const allBundles = assetManager.bundles;
                    allBundles.forEach((bundle, name) => {
                        PrintLog(`- Bundle: ${name}`);
                    });
                    
                    reject(err);
                } else {
                    PrintLog(`Bundle ${bundleName} loaded successfully`);
                    PrintLog(`Bundle内容数量: ${Object.keys(bundle._config.paths).length} 个资源`);
                    resolve(bundle);
                }
            });
        });
    }

    /** 预加载资源 */
    preloadAsset(url: string, type: typeof Asset) {
        // 检查是否是UI预制体，如果是则使用prefab-resources bundle
        if (type === Prefab && url.startsWith('ui/') && this.prefabBundle) {
            const convertedUrl = `prefab/${url}`;
            console.log(`[ResLoadHelper] 使用prefab-resources bundle预加载单个UI预制体: ${convertedUrl}`);
            this.prefabBundle.preload(convertedUrl, type);
        } else {
            this.resBundle.preload(url, type);
        }
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
        // 检查是否是UI预制体，如果是则使用prefab-resources bundle
        const isUIPrefab = url.some(path => path.includes('./prefab/ui/'));
        
        if (isUIPrefab && this.prefabBundle) {
            // 转换URL路径以匹配prefab-resources bundle的结构
            const convertedUrls = url.map(path => {
                if (path.startsWith('./prefab/ui/')) {
                    return path.replace('./prefab/ui/', 'prefab/ui/');
                }
                return path;
            });
            
            console.log(`[ResLoadHelper] 使用prefab-resources bundle预加载UI预制体: ${convertedUrls.join(', ')}`);
            
            this.prefabBundle.preload(convertedUrls, (finish: number, total: number, item: AssetManager.RequestItem) => {
                onProgress && onProgress(finish, total, item);
            }, (err: Error, items: AssetManager.RequestItem[]) => {
                if (err) {
                    faild && faild(err);
                    error(`preload 加载asset失败, url:${convertedUrls.join(',')}, err: ${err}`);
                    return null;
                }
                console.log(`[ResLoadHelper] UI预制体预加载成功: ${convertedUrls.join(', ')}`);
                call && call(items);
            });
        } else {
            // 使用默认的resources bundle
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
            let bundleName = 'resources';

            // 根据资源类型和路径确定使用哪个bundle
            if (type == Prefab) {
                // UI预制体和游戏预制体都需要从prefab-resources bundle加载
                if (url.startsWith('ui/') || url.startsWith('pieces/')) {
                    if (this.prefabBundle) {
                        bundle = this.prefabBundle;
                        bundleName = 'prefab-resources';
                        finalUrl = `prefab/${url}`;
                        PrintLog(`使用prefab-resources bundle加载: ${finalUrl}`);
                    } else {
                        PrintError(`prefab-resources bundle 未加载，回退到resources bundle`);
                        finalUrl = `prefab/${url}`;
                    }
                } else {
                    finalUrl = `prefab/${url}`;
                }
            } else if (url.startsWith('config/')) {
                if (this.configBundle) {
                    bundle = this.configBundle;
                    bundleName = 'level-configs';
                    PrintLog(`使用level-configs bundle加载: ${finalUrl}`);
                } else {
                    PrintError(`level-configs bundle 未加载，回退到resources bundle`);
                }
            } else if (url.startsWith('sound/')) {
                if (this.audioBundle) {
                    bundle = this.audioBundle;
                    bundleName = 'audio-resources';
                    PrintLog(`使用audio-resources bundle加载: ${finalUrl}`);
                } else {
                    PrintError(`audio-resources bundle 未加载，回退到resources bundle`);
                }
            } else if (url.startsWith('head/') || url.startsWith('images/')) {
                // 头像和广告图片已移动到ui-resources分包
                if (this.uiBundle) {
                    bundle = this.uiBundle;
                    bundleName = 'ui-resources';
                    PrintLog(`使用ui-resources bundle加载: ${finalUrl}`);
                } else {
                    PrintError(`ui-resources bundle 未加载，回退到resources bundle`);
                }
            } else if (type == SpriteFrame) {
                finalUrl += "/spriteFrame";
            }

            PrintLog(`正在从 ${bundleName} bundle 加载资源: ${finalUrl}`);
            bundle.load(finalUrl, type, (err, assets) => {
                if (err) {
                    PrintError(`loadCommonAssetSync 加载asset失败, url:${finalUrl}, bundle:${bundleName}, err: ${err}`);
                    resolve(null);
                } else {
                    PrintLog(`Successfully loaded: ${finalUrl} from bundle: ${bundleName}`);
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
        if (url.startsWith('ui/')) {
            if (this.prefabBundle) {
                PrintLog(`loadPrefabSync: 使用prefab-resources bundle加载UI预制体: ${url}`);
                return new Promise((resolve: (ret: any) => void) => {
                    this.prefabBundle!.load(`prefab/${url}`, Prefab, (err, assets) => {
                        if (err) {
                            PrintError(`loadPrefabSync 加载prefab失败, url:prefab/${url}, bundle: prefab-resources, err: ${err}`);
                            resolve(null);
                        } else {
                            PrintLog(`Successfully loaded prefab: ${url} from prefab-resources bundle`);
                            resolve(assets);
                        }
                    });
                });
            } else {
                PrintError(`loadPrefabSync: prefab-resources bundle未加载，无法加载UI预制体: ${url}`);
                return null;
            }
        }
        
        PrintLog(`loadPrefabSync: 使用默认bundle加载预制体: ${url}`);
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

    /** 检查bundle状态 */
    checkBundleStatus() {
        PrintLog(`Bundle状态检查:`);
        PrintLog(`- prefab-resources: ${this.prefabBundle ? '已加载' : '未加载'}`);
        PrintLog(`- audio-resources: ${this.audioBundle ? '已加载' : '未加载'}`);
        PrintLog(`- level-configs: ${this.configBundle ? '已加载' : '未加载'}`);
        PrintLog(`- ui-resources: ${this.uiBundle ? '已加载' : '未加载'}`);
    }

    /** 等待bundles加载完成 */
    async waitForBundles(): Promise<void> {
        let retries = 0;
        const maxRetries = 50; // 5秒超时
        
        while (retries < maxRetries) {
            if (this.prefabBundle && this.audioBundle && this.configBundle && this.uiBundle) {
                PrintLog('所有bundles已就绪');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        PrintError('等待bundles加载超时');
        this.checkBundleStatus();
    }

    /** 释放资源 */
    releaseAsset(url: string, type?: typeof Asset) {
        this.resBundle.release(url, type);
    }
}

export let ResLoadHelper: Helper = new Helper();