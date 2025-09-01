import { EventName } from "../const/eventName";
import { GlobalFuncHelper } from "../utils/globalFuncHelper";
import { StorageHelper, StorageHelperKey } from "../utils/storageHelper";
import { App } from "./app";
import { SingletonClass } from "./singletonClass";

/**
 * 体力管理器
 * 负责体力的恢复、消耗和相关逻辑
 */
export class HeartManager extends SingletonClass<HeartManager> {
    /** 最大体力值 */
    private readonly MAX_HEART = 5;
    /** 体力恢复间隔（毫秒）- 2分钟 */
    private readonly HEART_RECOVER_INTERVAL = 2 * 60 * 1000;
    
    protected onInit(): void {
        // 启动时检查体力恢复
        this.checkHeartRecover();
        
        // 每分钟检查一次体力恢复
        setInterval(() => {
            this.checkHeartRecover();
        }, 60 * 1000);
    }
    
    /**
     * 检查并执行体力恢复
     */
    checkHeartRecover(): void {
        const currentHeart = GlobalFuncHelper.getHeart();
        
        // 如果体力已满，不需要恢复
        if (currentHeart >= this.MAX_HEART) {
            return;
        }
        
        const lastRecoverTime = +StorageHelper.getData(StorageHelperKey.HeartRecoverTime, Date.now());
        const currentTime = Date.now();
        const timeDiff = currentTime - lastRecoverTime;
        
        // 计算应该恢复多少体力
        const recoverCount = Math.floor(timeDiff / this.HEART_RECOVER_INTERVAL);
        
        if (recoverCount > 0) {
            // 恢复体力，但不超过最大值
            const newHeart = Math.min(currentHeart + recoverCount, this.MAX_HEART);
            const actualRecover = newHeart - currentHeart;
            
            if (actualRecover > 0) {
                GlobalFuncHelper.setHeart(actualRecover);
                
                // 更新恢复时间戳
                const newRecoverTime = lastRecoverTime + (recoverCount * this.HEART_RECOVER_INTERVAL);
                StorageHelper.setData(StorageHelperKey.HeartRecoverTime, newRecoverTime);
                
                console.log(`体力恢复：+${actualRecover}，当前体力：${newHeart}`);
                
                // 通知界面更新
                App.event.emit(EventName.Game.HeartUpdate);
            }
        }
    }
    
    /**
     * 消耗体力
     * @param count 消耗数量，默认1点
     * @returns 是否消耗成功
     */
    consumeHeart(count: number = 1): boolean {
        const currentHeart = GlobalFuncHelper.getHeart();
        
        if (currentHeart < count) {
            console.log(`体力不足：当前${currentHeart}，需要${count}`);
            return false;
        }
        
        // 如果当前是满体力状态，消耗后需要设置恢复时间戳
        const wasFullHeart = (currentHeart >= this.MAX_HEART);
        
        GlobalFuncHelper.setHeart(-count);
        console.log(`消耗体力：-${count}，当前体力：${currentHeart - count}`);
        
        // 如果从满体力变为不满，设置恢复时间戳
        if (wasFullHeart && (currentHeart - count) < this.MAX_HEART) {
            const currentTime = Date.now();
            StorageHelper.setData(StorageHelperKey.HeartRecoverTime, currentTime);
            console.log(`设置体力恢复时间戳：${new Date(currentTime).toLocaleString()}`);
        }
        
        // 通知界面更新
        App.event.emit(EventName.Game.HeartUpdate);
        
        return true;
    }
    
    /**
     * 增加体力
     * @param count 增加数量
     */
    addHeart(count: number): void {
        const currentHeart = GlobalFuncHelper.getHeart();
        const newHeart = Math.min(currentHeart + count, this.MAX_HEART);
        const actualAdd = newHeart - currentHeart;
        
        if (actualAdd > 0) {
            GlobalFuncHelper.setHeart(actualAdd);
            console.log(`增加体力：+${actualAdd}，当前体力：${newHeart}`);
            
            // 通知界面更新
            App.event.emit(EventName.Game.HeartUpdate);
        }
    }
    
    /**
     * 获取当前体力
     */
    getCurrentHeart(): number {
        return GlobalFuncHelper.getHeart();
    }
    
    /**
     * 获取最大体力
     */
    getMaxHeart(): number {
        return this.MAX_HEART;
    }
    
    /**
     * 获取下次体力恢复的倒计时（毫秒）
     */
    getNextRecoverTime(): number {
        const currentHeart = GlobalFuncHelper.getHeart();
        
        // 如果体力已满，返回0
        if (currentHeart >= this.MAX_HEART) {
            return 0;
        }
        
        const lastRecoverTime = +StorageHelper.getData(StorageHelperKey.HeartRecoverTime, Date.now());
        const currentTime = Date.now();
        const nextRecoverTime = lastRecoverTime + this.HEART_RECOVER_INTERVAL;
        
        return Math.max(0, nextRecoverTime - currentTime);
    }
    
    /**
     * 格式化倒计时显示
     */
    formatRecoverTime(): string {
        const remainTime = this.getNextRecoverTime();
        
        if (remainTime <= 0) {
            // 倒计时结束时，先检查并执行体力恢复
            const beforeRecoverHeart = GlobalFuncHelper.getHeart();
            this.checkHeartRecover();
            const afterRecoverHeart = GlobalFuncHelper.getHeart();
            
            // 如果体力发生了变化，触发界面更新
            if (beforeRecoverHeart !== afterRecoverHeart) {
                console.log(`体力恢复触发：${beforeRecoverHeart} -> ${afterRecoverHeart}`);
                // 延迟一点点触发更新，确保界面能收到事件
                setTimeout(() => {
                    App.event.emit(EventName.Game.HeartUpdate);
                }, 50);
            }
            
            // 重新获取当前体力
            const currentHeart = GlobalFuncHelper.getHeart();
            if (currentHeart >= this.MAX_HEART) {
                return "体力已满";
            } else {
                // 如果体力还没满，重新计算倒计时
                const newRemainTime = this.getNextRecoverTime();
                if (newRemainTime <= 0) {
                    return `${currentHeart}/${this.MAX_HEART}`;
                } else {
                    const totalSeconds = Math.ceil(newRemainTime / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    
                    if (minutes >= 60) {
                        const hours = Math.floor(minutes / 60);
                        const remainMinutes = minutes % 60;
                        return `${hours.toString().padStart(2, '0')}:${remainMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 后恢复 1 点`;
                    } else {
                        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 后恢复 1 点`;
                    }
                }
            }
        }
        
        const totalSeconds = Math.ceil(remainTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainMinutes = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${remainMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 后恢复 1 点`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 后恢复 1 点`;
        }
    }
    
    /**
     * 检查是否可以开始游戏
     */
    canStartGame(): boolean {
        return this.getCurrentHeart() > 0;
    }
    
    /**
     * 显示体力不足提示
     */
    showHeartInsufficientTips(): void {
        // 先显示简单提示
        const recoverTime = this.formatRecoverTime();
        App.view.showMsgTips(`体力不足！${recoverTime}`);
        
        // 延迟显示详细的体力不足界面（如果存在的话）
        setTimeout(() => {
            try {
                // 尝试打开体力不足提示界面，如果界面存在的话
                // App.view.openView('heartInsufficientView');
            } catch (error) {
                console.log('体力不足界面不存在，使用简单提示');
            }
        }, 500);
    }

    /**
     * 显示体力不足提示并提供通过广告获取体力的选项
     * @param onSuccess 获取体力成功后的回调
     */
    showHeartInsufficientTipsWithAd(onSuccess?: () => void): void {
        App.view.showMsgTips('体力不足，正在获取...');
        
        // 延迟一下再播放广告，让用户看到提示
        setTimeout(() => {
            import('../wx/advertise').then(({ Advertise }) => {
                Advertise.showVideoAds((success: boolean) => {
                    if (success) {
                        // 广告观看完成，增加1点体力
                        this.addHeart(1);
                        App.view.showMsgTips('🎉 获得1点体力！');
                        
                        // 触发体力更新事件
                        App.event.emit(EventName.Game.HeartUpdate);
                        
                        // 执行成功回调
                        if (onSuccess) {
                            onSuccess();
                        }
                    } else {
                        App.view.showMsgTips('❌ 广告未完整观看，未获得体力');
                    }
                });
            }).catch(error => {
                console.error('广告模块加载失败:', error);
                App.view.showMsgTips('❌ 广告加载失败，请稍后再试');
            });
        }, 500);
    }
}