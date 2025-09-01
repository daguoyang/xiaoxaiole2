/** 所有窗口名字 */
export namespace ViewName {
    /** 只能单独存在 */
    export enum Single {
        /** test */
        eTest = 'ui/testView',
        /** 跑马灯 */
        eMarquee = 'ui/marquee/marqueeView',
        /** 主界面 */
        eHomeView = 'ui/homeView',
        /** 游戏界面 */
        eGameView = 'ui/gameView',
        /** 结算界面 */
        eResultView = 'ui/resultView',
        /** 胜利界面 */
        eWinView = 'ui/winView',
        /** 设置界面 */
        eSettingView = 'ui/settingView',
        /** 暂停界面 */
        ePaurseView = 'ui/paurseView',
        /** 加载界面 */
        eLoadingView = 'ui/loadingView',
        /** 领取奖励界面 */
        eGoldRewrdView = 'ui/goldRewrdView',
        /** 分享界面 */
        eShareView = 'ui/shareView',
        /** 购买界面 */
        eBuyView = 'ui/buyView',
        /** 输了败北 */
        eloseView = 'ui/loseView',
        /** 目标提示 */
        eLevelTargetView = 'ui/levelTargetView',
        /** 游戏中的设置 */
        esettingGameView = 'ui/settingGameView',
        /**  模式选择 */
        eChallengeView = 'ui/challengeView',
        /** 新手引导 */
        eGuideView = 'ui/guideView',
        eAcrossView = 'ui/acrossView',
    }

    /** 可以多个同时存在 */
    export enum Multiple {
        /** 提示框 */
        eAlert = 'common/alertView',
        /** 飘字提示 */
        eMsg = 'ui/tipsView',
    }

    export enum Pieces {
        rocket = "rocket",
        particle = "particle",
        grid = "grid",
        score = "score",
        block = "block",
        map = "map",
    }

}
