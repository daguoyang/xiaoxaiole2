import { Component, isValid, JsonAsset, Label, Node, RichText, SpriteFrame } from "cc";
import i18nLabel from "../components/i18nLabel";
import i18nSprite from "../components/i18nSprite";
import { PrintError, PrintLog } from "../utils/logHelper";
import { ResLoadHelper } from "../utils/resLoadHelper";
import { SingletonClass } from "./singletonClass";

/**
 * 多语言管理
 */
export class I18nManager extends SingletonClass<I18nManager> {
    private curLang: string = 'cn'; // 这里初始化,这个值编辑器里面使用，可以设置任意值，实际不会影响游戏运行时的语言，

    private textComponent: Component[] = [];
    private imgComponent: Component[] = [];
    private textConfig: Map<string, { en?: string }> = null;;   // 文字配置
    /** 多语言，字符串替换参数数组，策划配置的参数按照这个顺序来逐个替换 
     * eg:str = "aaaaaaadata1bbbbbdata2ccccc"
     * m = getString(str,999,888)
     * m =  aaaaaaa999bbbbb888ccccc
     * */
    private replaceArr = ["data1", "data2", "data3", "data4", "data5", "data6", "data7", "data8"]

    protected async onInit(lang: string) {
        // this.loadLuanguageCfg();
        // this.updateLanguage();
    }

    setLanguage(lan: string) {
        this.curLang = lan;
        this.updateLanguage();
    }

    /** 多语言测试调通，先留着 */
    async loadLuanguageCfg() {
        return new Promise(async resolve => {
            let language = await ResLoadHelper.loadCommonAssetSync("config/language", JsonAsset);
            PrintLog(language.json);
            this.textConfig = new Map(language.json);
            this.updateLanguage();
            resolve("");
        });
    }

    protected onDestroy(): void {
        this.textComponent.length = 0;
        this.imgComponent.length = 0;
        this.textConfig.clear();
    }

    updateLanguage() {
        for (let it of this.textComponent) {
            const cmpt = it.getComponent(i18nLabel);
            (isValid(cmpt) && isValid(cmpt.node)) && cmpt.reset();
        }
        for (let it of this.imgComponent) {
            const cmpt = it.getComponent(i18nSprite);
            (isValid(cmpt) && isValid(cmpt.node)) && cmpt.reset();
        }
    }

    register(target: Component) {
        if (!isValid(target)) return;
        const arr: Component[] = !!target.getComponent(Label) ? this.textComponent : this.imgComponent;
        arr.indexOf(target) === -1 && arr.push(target);
    }

    unregister(target: Component) {
        if (!isValid(target)) return;
        const arr: Component[] = target instanceof Label ? this.textComponent : this.imgComponent;
        let idx = arr.indexOf(target);
        idx !== -1 && arr.splice(idx, 1);
    }

    getString(key: string, ...args): string {
        if (!this.textConfig) return '';

        const obj = this.textConfig.get(key);
        if (!obj) {
            console.warn(`i18nMgr.getString(${key}) is error.`);
            return '';
        }
        let text = obj[this.curLang];
        args.forEach((param, i) => {
            text = text.replace(this.replaceArr[i], param);
        })
        return text;
    }

    async setText(component: Label | RichText, key: string) {
        if (!this.textConfig) {
            await this.loadLuanguageCfg();
        }
        component && (component.string = this.getString(key));
    }

    async setSprite(url: string, cb: (spriteFrame: SpriteFrame) => void) {
        let path = `i18n/${url}`;
        let sf: SpriteFrame = await ResLoadHelper.loadCommonAssetSync(path, SpriteFrame);
        if (!sf) {
            PrintError(`i18n not SpriteFrame = ${path}`);
            return;
        }
        cb(sf);
    }

    getLanguage() {
        return this.curLang;
    }
}