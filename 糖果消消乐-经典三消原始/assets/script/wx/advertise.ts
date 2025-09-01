import { sys } from "cc";
import { EventName } from "../const/eventName";
import { App } from "../core/app";
import { WxMgr } from "./wxManager";

export class Ads {
    public bannerAdv = null;//banner广告
    public videoAdv = null;//激励式视频广告
    public interstitialAd = null;//插屏广告

    private bannerId: string = "";// banner广告id
    private videoId: string = "";// 激励式视频广告id
    private interstitialId: string = "";// 插屏r广告id
    constructor() {
        this.init();
    }

    init() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log('--------------init ads-----------------');
        // @ts-ignore
        let winSize = wx.getSystemInfoSync();//获取像素size
        // 创建 Banner 广告实例，提前初始化
        let bannerWidth = 300
        let bannerHeight = 80
        // @ts-ignore
        let bannerAdv = wx.createBannerAd({
            adUnitId: this.bannerId,//传入自己的id，此处为banner广告位ID
            adIntervals: 30,//定时刷新，最低30S
            style: {
                left: (winSize.windowWidth - bannerWidth) / 2,
                top: winSize.windowHeight - bannerHeight,
                width: bannerWidth,
            },
        })
        this.bannerAdv = bannerAdv;
        //重新定banner位置
        bannerAdv.onResize((res) => {
            bannerAdv.style.top = winSize.windowHeight - bannerAdv.style.realHeight - 1;
        })
        // // 在适合的场景显示 Banner 广告
        // bannerAdv.show();//不建议直接显示
        //拉取失败处理
        bannerAdv.onError((err) => {
            console.log(err);
        })

        // @ts-ignore 创建激励视频广告实例，提前初始化
        let videoAdv = wx.createRewardedVideoAd({
            adUnitId: this.videoId//传入自己的id，此处为视频广告位ID
        })
        videoAdv.onError((err) => {
            console.log(err);
        })
        this.videoAdv = videoAdv;
        // 创建插屏广告实例，提前初始化
        // @ts-ignore
        if (wx.createInterstitialAd) {
            // @ts-ignore
            let interstitialAd = wx.createInterstitialAd({
                adUnitId: this.interstitialId//传入自己的id，此处为插屏广告位ID
            })
            this.interstitialAd = interstitialAd;
        }
    }
    //显示banner广告
    showBannerAds() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        // 在适合的场景显示 Banner 广告
        // @ts-ignore
        this.bannerAdv.show();
    }

    // 隐藏banner广告
    hideBannerAds() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        // @ts-ignore
        this.bannerAdv.hide();
    }

    //显示视频广告
    showVideoAds() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        // 在适合的场景显示 Video 广告
        // @ts-ignore
        let videoAdv = this.videoAdv;
        // 用户触发广告后，显示激励视频广告
        // @ts-ignore
        videoAdv.show().catch(() => {
            // 失败重试
            // @ts-ignore
            videoAdv.load()
                // @ts-ignore
                .then(() => videoAdv.show())
                .catch(err => {
                    console.log('激励视频 广告显示失败')
                })
        })
        // @ts-ignore
        //拉取异常处理
        videoAdv.onError((err) => {
            console.log(err);
        })

        // @ts-ignore
        videoAdv.onClose((res) => {
            if (!videoAdv) return;
            // @ts-ignore
            videoAdv.offClose();//需要清除回调，否则第N次广告会一次性给N个奖励
            //关闭
            if (res && res.isEnded || res === undefined) {
                //正常播放结束，需要下发奖励
                WxMgr.addReward();
            } else {
                //播放退出，不下发奖励
            }
        })
    }

    // 显示插件广告
    showInterstitialAds() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        let interstitialAd = this.interstitialAd;
        // 在适合的场景显示插屏广告
        if (interstitialAd) {
            // @ts-ignore
            interstitialAd.show().catch((err) => {
                console.error(err)
            })
        }

    }
}

export let Advertise = new Ads();