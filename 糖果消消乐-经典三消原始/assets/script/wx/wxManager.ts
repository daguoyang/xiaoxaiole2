/**
 * 微信接口  wx92a00da0fc2944c6
 */
import { _decorator, sys } from 'cc';
import { Bomb } from '../const/enumConst';
import { EventName } from '../const/eventName';
import { App } from '../core/app';
import { GlobalFuncHelper } from '../utils/globalFuncHelper';
import { Advertise } from './advertise';
export var IsGetInfo = false;
export class WxManager {
    private wxCode = '';
    public init() {
        App.event.on(EventName.Game.Share, this._evtShareToOthers, this);
        this._wxLogin();
    }

    /**
     * 登录接口
     */
    _wxLogin() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log('start_login');
        let self = this;
        // @ts-ignore
        wx.login({
            success: function (res) {
                console.log('loginSuccess');
                self.wxCode = res.code
                self._wxGetUserState()
            }.bind(this)
        })
    }

    /**
     * 用户状态
     */
    private _wxGetUserState() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log('_wxGetUserState');
        let self = this;
        // @ts-ignore
        wx.getSetting({
            fail: function (res) {
                console.log('_wxGetUserState1');
                self._wxPrivacy()
            }.bind(this),

            success: function (res) {
                console.log('_wxGetUserState2');
                if (res.authSetting['scope.userInfo']) {
                    console.log('获取用户状态成功');
                    self._requirePrivaceAuthorize();
                }
                else {
                    self._wxPrivacy();
                }
            }.bind(this)
        })
    }


    /** 新版隐私权限请求 */
    private _wxPrivacy() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        let self = this;
        self._requirePrivaceAuthorize();
    }

    private _requirePrivaceAuthorize() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        let self = this;
        // @ts-ignore
        wx.requirePrivacyAuthorize({
            success: function (res) {
                console.log("-------- privacy --------")
                console.log(res);
                // 非标准API的方式处理用户个人信息
                self._wxGetUserInfo();
            },
            fail: function () {
            },
            complete: function () { }
        })
    }

    /**
     * 授权获取玩家信息
     */
    private _wxGetUserInfo() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log('手动授权 wxgetuserInfo');
        let self = this;
        // @ts-ignore
        let WXInfoButton = wx.createUserInfoButton({
            type: 'text',
            text: 'click',
            style: {
                left: 0,
                top: 0,
                width: 750,
                height: 1443,
                backgroundColor: '',
                borderColor: '#FFFFFF',
                borderWidth: 0,
                borderRadius: 0,
                color: '#FFFFFF',
                textAlign: 'center',
                fontSize: 1,
                lineHeight: 1400,
            }
        })
        WXInfoButton.onTap((res) => {
            if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
                // 处理用户拒绝授权的情况
                self._guideActive();
            } else {
                self._setUserData(res)
            }
            WXInfoButton.hide();
        })
        WXInfoButton.show();
    }

//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999

    _guideActive() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        let self = this;
        // @ts-ignore
        wx.showModal({
            title: '警告',
            content: '拒绝授权将无法正常游戏',
            cancelText: '取消',
            showCancel: true,
            confirmText: '设置',
            success: (function (res) {
                if (res.confirm) {
                    // @ts-ignore
                    wx.openSetting({
                        success: (function (res) {
                            if (res.authSetting['scope.userInfo'] === true) {
                                self.getUserInfo()
                            }
                        }).bind(this)
                    })
                } else {
                }
            }).bind(this)
        })
    }

    /**
     * 获取用户数据
     */
    getUserInfo() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log('getUserInfo1');
        let self = this;
        // @ts-ignore
        wx.getUserProfile({
            fail: function (res) {
                console.log('getUserInfo3');
                console.log(res);
                if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
                    // 处理用户拒绝授权的情况
                    self._guideActive();
                }
            }.bind(this),
            success: function (res) {
                console.log('getUserInfo2');
                self._setUserData(res);
            }.bind(this)
        })
    }

    /**
     * 被动分享
     */
    private _shareFunc() {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        // @ts-ignore
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });
        // @ts-ignore
        let imgUrl = canvas.toTempFilePathSync({
            x: 10,
            y: 10,
            width: 700,
            height: 1100,
            destWidth: 400,
            destHeight: 300
        });
        // @ts-ignore
        wx.onShareAppMessage(function () {
            return {
                title: '小姐姐在糖果世界挑战闯关，快来救救小姐姐',
                imageUrl: imgUrl,
            }
        });
        // @ts-ignore
        wx.onShareTimeline(function () {
            return {
                title: '小姐姐在糖果世界挑战，快来救救小姐姐', //分享标题
                imageUrl: imgUrl,
            }
        })
    }

    /**
    * 主动拉起分享
    */
    private _evtShareToOthers(lv: number, isAdd: boolean = true) {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            // @ts-ignore
            let tempFilePath = canvas.toTempFilePathSync({
                x: 10,
                y: 10,
                width: 700,
                height: 1100,
                destWidth: 400,
                destHeight: 300
            })
            // @ts-ignore
            wx.shareAppMessage({
                title: `小姐姐在糖果世界挑战已经闯过${lv}关，快来挑战小姐姐吧`,
                imageUrl: tempFilePath
            })
        } else {
            App.view.showMsgTips("请在小程序中测试");
            return;
        }
        if (isAdd) {
            this.addReward();
        }
    }

    public ShareToOthers(lv: number) {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            // @ts-ignore
            let tempFilePath = canvas.toTempFilePathSync({
                x: 10,
                y: 10,
                width: 700,
                height: 1100,
                destWidth: 400,
                destHeight: 300
            })
            // @ts-ignore
            wx.shareAppMessage({
                title: `我以闯过${lv}关，邀您来挑战`,
                imageUrl: tempFilePath
            })
        }
        this.addReward();
    }

    public addReward() {
        //主动拉起分享每天限制送三次金币，一次一百
        setTimeout(() => {
            GlobalFuncHelper.setGold(App.gameLogic.rewardGold);
            GlobalFuncHelper.setBomb(Bomb.hor, 1);
            GlobalFuncHelper.setBomb(Bomb.ver, 1);
            GlobalFuncHelper.setBomb(Bomb.bomb, 1);
            GlobalFuncHelper.setBomb(Bomb.allSame, 1);
            App.event.emit(EventName.Game.ToolCountRefresh);
            App.event.emit(EventName.Game.UpdataGold);
            App.event.emit(EventName.Game.ContinueGame);
        }, 2000);
    }

    private _setUserData(res) {
        if (sys.platform != sys.Platform.WECHAT_GAME) return;
        console.log("------------------res------------");
        console.log(res);
        let self = this;
        let info = res.userInfo;
        /* 初始化右上角分享 */
        self._shareFunc();
        if (info && info.nickName) {
            let data = { name: info.nickName, icon: info.avatarUrl };
            console.log(data);
            App.user.rankData.name = info.nickName;
        }
        Advertise.init();
    }

    public setWxCloudRankData(lv: number) {
        // @ts-ignore
        wx.setUserCloudStorage({
            KVDataList: [{ key: 'level', value: lv }], //KVDataList: K表示Key V表示Value DateList表示用户数据列表 用户要修改的 KV 数据列表 , 即存入用户信息到//微信云存储上 , 在下面的子域中将获取这个值进行排序，
            success: () => {
                console.log('setwxcloudrankdata success');
            }
        })
    }
}


export let WxMgr = new WxManager();
