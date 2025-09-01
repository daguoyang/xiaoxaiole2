import { BYTEDANCE, WECHAT } from "cc/env";

export class SdkManager {
    public static _instance: SdkManager = null

    public static get instance() {
        if (null == this._instance) {
            this._instance = new SdkManager();
        }
        return this._instance
    }

    // 激励视频
    videoId: string = ''
    private videoAd = null
    // 插屏
    interstitialId: string = ''
    private interstitialAd = null
    // 横幅
    bannerId: string = ''
    private bannerAd = null

    // 获取平台
    getPlatform() {
        let platform = null
        if (WECHAT) {
            platform = window['wx']
        } else if (BYTEDANCE) {
            platform = window['tt']
        }
        return platform
    }

    // 初始化横幅
    initBannerAd() {
        const platform = this.getPlatform()
        if (!platform) {
            console.log('banner ad init...')
            return
        }
        if (this.bannerId == '') {
            return
        }
        let winSize = platform.getSystemInfoSync();
        if (this.bannerAd == null) {
            this.bannerAd = platform.createBannerAd({
                adUnitId: this.bannerId,
                adIntervals: 30,
                style: {
                    height: winSize.windowHeight - 80,
                    left: 0,
                    top: 500,
                    width: winSize.windowWidth
                }
            });
            this.bannerAd.onResize((res: any) => {
                this.bannerAd.style.top = winSize.windowHeight - this.bannerAd.style.realHeight;
                this.bannerAd.style.left = winSize.windowWidth / 2 - this.bannerAd.style.realWidth / 2;
            });
            this.bannerAd.onError((err: any) => {
                console.log('初始化异常', err)
            });
        }
    }

    // 横幅展示
    toggleBannerAd(isShow: boolean) {
        const platform = this.getPlatform()
        if (!platform) {
            console.log(`【流量主横幅:${isShow}】`)
            return
        }
        if (this.bannerAd) {
            isShow ? this.bannerAd.show() : this.bannerAd.hide();
        }
    }

    // 初始化插屏
    initInterstitialAd() {
        const platform = this.getPlatform()
        if (!platform) {
            console.log('inter ad init...')
            return
        }
        if (this.interstitialId == '') {
            return
        }
        if (this.interstitialAd == null) {
            this.interstitialAd = platform.createInterstitialAd({
                adUnitId: this.interstitialId
            });
            this.interstitialAd.onError((err: any) => {
            });
        }
    }

    // 插屏展示
    showInterstitialAd() {
        const platform = this.getPlatform()
        if (!platform) {
            console.log('【流量主插屏】')
            return
        }
        if (this.interstitialAd) {
            this.interstitialAd.show().catch((err: any) => {
            });
        }
    }

    // 初始化激励
    initVideoAd() {
        const platform = this.getPlatform()
        if (!platform) {
            console.log('video ad init...')
            return
        }
        if (this.videoId == '') {
            return
        }
        if (this.videoAd == null) {
            this.videoAd = platform.createRewardedVideoAd({
                adUnitId: this.videoId
            });
            this.videoAd.onError((err: any) => {
            });
        }
    }
//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999

    // 激励展示
    showVideoAd(success: any, fail?: any) {
        const platform = this.getPlatform()
        if (!platform) {
            console.log('激励模拟成功')
            return success && success('模拟成功，激励奖励已发放')
        }
        if (this.videoAd) {
            this.videoAd.offClose();
            this.videoAd.onClose((res: any) => {
                this.videoAd.offClose();
                if (res && res.isEnded || res === undefined) {
                    return success && success('激励奖励已发放')
                } else {
                    return fail && fail('视频播放中断')
                }
            });
            this.videoAd.show().catch(() => {
                this.videoAd.load()
                    .then(() => this.videoAd.show())
                    .catch((err: any) => {
                        console.log('广告展示失败')
                    })
            });
        } else {
            // console.log('激励模拟成功')
            return fail && fail('该功能尚未开放')
        }
    }
}


