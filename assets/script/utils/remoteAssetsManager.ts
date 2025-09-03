import { assetManager, sys } from 'cc';
import { PrintLog, PrintError } from './logHelper';

/**
 * 远程资源管理器
 * 处理远程分包的加载和缓存
 */
export class RemoteAssetsManager {
    private static instance: RemoteAssetsManager;
    private remoteUrl: string = '';
    private isInitialized: boolean = false;

    public static getInstance(): RemoteAssetsManager {
        if (!RemoteAssetsManager.instance) {
            RemoteAssetsManager.instance = new RemoteAssetsManager();
        }
        return RemoteAssetsManager.instance;
    }

    /**
     * 初始化远程资源管理器
     * @param remoteUrl CDN基础URL
     */
    init(remoteUrl: string) {
        this.remoteUrl = remoteUrl;
        this.isInitialized = true;
        
        // 配置远程资源下载选项
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            // 微信小游戏平台特殊配置
            assetManager.downloader.maxConcurrency = 6; // 最大并发下载数
            assetManager.downloader.maxRequestsPerFrame = 2; // 每帧最大请求数
        }
        
        PrintLog(`[RemoteAssets] 初始化完成，远程URL: ${remoteUrl}`);
    }

    /**
     * 加载远程分包
     * @param bundleName 分包名称
     * @param options 加载选项
     */
    async loadRemoteBundle(bundleName: string, options: any = {}) {
        if (!this.isInitialized) {
            throw new Error('RemoteAssetsManager 未初始化');
        }

        const bundleUrl = `${this.remoteUrl}${bundleName}`;
        PrintLog(`[RemoteAssets] 开始加载远程分包: ${bundleUrl}`);

        return new Promise((resolve, reject) => {
            const loadOptions = {
                version: options.version || '',
                ...options
            };

            assetManager.loadBundle(bundleUrl, loadOptions, (err, bundle) => {
                if (err) {
                    PrintError(`[RemoteAssets] 远程分包加载失败: ${bundleName}, ${err.message}`);
                    reject(err);
                } else {
                    PrintLog(`[RemoteAssets] 远程分包加载成功: ${bundleName}`);
                    resolve(bundle);
                }
            });
        });
    }

    /**
     * 预加载远程资源
     * @param bundleName 分包名称
     * @param assetUrls 资源URL列表
     * @param progressCallback 进度回调
     */
    async preloadRemoteAssets(
        bundleName: string, 
        assetUrls: string[], 
        progressCallback?: (loaded: number, total: number) => void
    ) {
        try {
            const bundle = await this.loadRemoteBundle(bundleName);
            
            return new Promise((resolve, reject) => {
                bundle.preload(assetUrls, (finished: number, total: number) => {
                    if (progressCallback) {
                        progressCallback(finished, total);
                    }
                }, (err) => {
                    if (err) {
                        PrintError(`[RemoteAssets] 预加载失败: ${err.message}`);
                        reject(err);
                    } else {
                        PrintLog(`[RemoteAssets] 预加载完成: ${bundleName}`);
                        resolve(bundle);
                    }
                });
            });
        } catch (error) {
            PrintError(`[RemoteAssets] 预加载远程资源失败: ${error}`);
            throw error;
        }
    }

    /**
     * 检查远程资源是否需要更新
     * @param bundleName 分包名称
     * @param localVersion 本地版本号
     */
    async checkForUpdates(bundleName: string, localVersion: string): Promise<boolean> {
        try {
            const manifestUrl = `${this.remoteUrl}${bundleName}/project.manifest`;
            
            // 获取远程版本信息
            const response = await fetch(manifestUrl);
            const manifest = await response.json();
            
            const remoteVersion = manifest.version || '1.0.0';
            const needUpdate = remoteVersion !== localVersion;
            
            PrintLog(`[RemoteAssets] 版本检查 ${bundleName}: 本地=${localVersion}, 远程=${remoteVersion}, 需要更新=${needUpdate}`);
            return needUpdate;
        } catch (error) {
            PrintError(`[RemoteAssets] 版本检查失败: ${error}`);
            return false;
        }
    }

    /**
     * 清理本地缓存
     * @param bundleName 分包名称
     */
    clearCache(bundleName: string) {
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            // 微信小游戏清理缓存
            const cacheManager = (assetManager as any).cacheManager;
            if (cacheManager && cacheManager.removeCache) {
                cacheManager.removeCache(bundleName);
                PrintLog(`[RemoteAssets] 清理缓存: ${bundleName}`);
            }
        }
    }

    /**
     * 获取远程资源下载进度
     */
    getDownloadProgress(): { loaded: number; total: number } {
        const downloader = assetManager.downloader;
        return {
            loaded: (downloader as any)._totalFinished || 0,
            total: (downloader as any)._totalToDownload || 0
        };
    }
}

export const remoteAssetsManager = RemoteAssetsManager.getInstance();