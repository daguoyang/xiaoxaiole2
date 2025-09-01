import { ImageAsset, Node, SpriteComponent, SpriteFrame, sys, Texture2D, Vec3 } from 'cc';

export enum IpType {
    local = 0,
    remote = 1
}

export enum ServerType {
    connectorServer = 100,
    gameServer = 101,
    userServer = 102,
}

export enum ServerPort {
    gameServer = 9000,
    userServer = 9001,
    connector = 8999,
}

export function getIp(type: number): string {
    let port = 9988;
    if (sys.platform == sys.Platform.WECHAT_GAME) {//微信平台
        port = 9988;
    }
    else if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {//字节跳动平台
        port = 9889;
    }


    return "";
}

/**
 * 将V3 Math.floor
 * @param v3 
 */
export function unitVec3(v3: Vec3): Vec3 {
    let re: Vec3 = new Vec3(Math.floor(v3.x), Math.floor(v3.y), Math.floor(v3.z));
    return re;
}


/**
 * 复制Vec3数组
 * @param arr 
 * @returns Vec3[]
 */
export function copyVec3Array(arr: any[]) {
    let copy: any[] = [];
    for (let i = 0; i < arr.length; i++) {
        let v3 = new Vec3(arr[i].x, arr[i].y, arr[i].z);
        copy.push(v3);
    }
    return copy;
}

/**
 * 数组乱序
 * @param arr 
 */
export function shuffle(arr: any[]) {
    for (let i = 1; i < arr.length; i++) {
        var rand = Math.floor(Math.random() * (i + 1));
        let t = arr[rand];
        arr[rand] = arr[i];
        arr[i] = t;
    }
    return arr;
}

/**
 * 获取当天是一年中的第几天
 */
export function getDay(): number {
    const currentYear = new Date().getFullYear().toString();
    // 今天减今年的第一天（xxxx年01月01日）
    const hasTimestamp = new Date().getTime() - new Date(currentYear).getTime();
    // 86400000 = 24 * 60 * 60 * 1000
    const hasDays = Math.ceil(hasTimestamp / 86400000) + 1;
    console.log('今天是%s年中的第%s天', currentYear, hasDays);
    return hasDays;
}

/**
 * 图片转base64
 */
export async function getBase64Data(sp: SpriteComponent): Promise<string> {
    return new Promise(resolve => {
        let texture = sp.spriteFrame.texture;
        var base64 = "";
        var img: any = new Image();
        img.src = texture;
        img.onload = () => {
            //图片转base64编码
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, img.width, img.height);
            base64 = canvas.toDataURL("image/png");
            console.log(base64);
            resolve(base64);
        }
    });
}

/**
 * base64转图片
 */
export async function getBase64SpriteFrame(base64: string): Promise<SpriteFrame> {
    return new Promise(resolve => {
        let texture = new Texture2D();
        let img = new Image();
        img.src = base64;
        img.onload = () => {
            texture.image = new ImageAsset(img);
            const spFrame = new SpriteFrame();
            spFrame.texture = texture;
            resolve(spFrame);
        }
    });
}