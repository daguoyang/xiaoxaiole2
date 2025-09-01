
/**
 * 消息格式
 */
export interface ModelAny {
    code?: number,
    msg?: any,
    err?: any,
}

/**
 * 协议头信息
 */
export interface Head {
    /* 唯一标示id */
    id: number,
    /* 服务器类型 */
    serverType: number,
    router: string,
}

export interface elementData {
    x: number,//列
    y: number,//行
}

export interface userData {
    gold: number,//金币
    level: number,//关卡
    sign: number,//签到天数
    signDay: number,//签到当天
    toolBomb: number,//炸弹道具数量
    toolTime: number,//延时道具数量
    toolRefresh: number,//刷新道具数量
    RefreshTools: number,//提示道具数量
}

export interface LoginData {
    pid?: number,
    sex?: number,
    level: number,
    gold?: number,
    icon: string,
    name: string,
    time?: string,
}