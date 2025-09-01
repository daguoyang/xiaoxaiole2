# 🎯 统一广告管理系统

## 📋 概述

这是一个符合微信小游戏规范的统一广告管理系统，支持开发阶段的模拟广告和上线后的真实广告，业务层无需关心内部实现细节。

## 🏗️ 架构设计

```
业务层 (GameUI)
    ↓ 调用统一接口
广告管理器 (AdManager)
    ↓ 根据环境选择
模拟广告 (FakeRewardedAd) ←→ 微信广告 (WxRewardedAd)
```

## 📁 文件结构

```
ads/
├── IRewardedAd.ts      # 广告接口定义
├── AdManager.ts        # 广告管理器（单例）
├── FakeRewardedAd.ts   # 模拟广告实现（支持自定义UI）
├── WxRewardedAd.ts     # 微信广告实现
├── AdUsageExample.ts   # 使用示例
└── README.md           # 使用说明

resources/
└── images/
    └── ads/
        ├── ad_ui.jpg      # 模拟广告界面图片
        └── ad_ui.jpg.meta # Cocos Creator 资源配置
```

## 🚀 快速开始

### 1. 初始化（已在 App.ts 中完成）

```typescript
import { adManager } from './ads/AdManager';

// 在 App.onInit() 中初始化
const adConfig = {
    adUnitId: "adunit-xxxxxxxxxx", // 🚨 上线前填入真实广告位ID
    mockDuration: 15,              // 模拟广告时长
    mockSkipDelay: 5,              // 5秒后允许跳过
    enableDebugLog: true           // 开启调试日志
};

const isDevelopment = true; // 🚨 开发阶段为 true，上线后改为 false
adManager.init(adConfig, isDevelopment);
```

### 2. 业务层调用

```typescript
import { adManager } from '../ads/AdManager';

class GameUI {
    async onWatchAdButtonClicked(): Promise<void> {
        // 统一的广告调用接口
        const result = await adManager.showRewardedAd();
        
        switch (result) {
            case 'completed':
                // 广告播放完成，给奖励
                this.grantReward();
                break;
            case 'aborted':
                // 用户中途关闭，不给奖励
                this.showMessage('观看未完成');
                break;
            case 'error':
                // 广告播放失败
                this.showMessage('广告暂不可用');
                break;
        }
    }
}
```

## 📱 开发与上线切换

### 开发阶段
```typescript
// 使用模拟广告
adManager.init(config, true);
```

**特点：**
- ✅ 完整的广告UI界面（使用自定义广告图片）
- ✅ 15秒倒计时模拟播放
- ✅ 5秒后显示跳过按钮
- ✅ 可视化进度条显示
- ✅ 半透明背景遮罩
- ✅ 调试日志

### 上线阶段
```typescript
// 切换到真实广告（只需改一行代码！）
adManager.init({
    adUnitId: "adunit-真实广告位ID", // 🚨 填入真实ID
    enableDebugLog: false
}, false);
```

**特点：**
- ✅ 调用微信官方 `wx.createRewardedVideoAd`
- ✅ 自动重试机制
- ✅ 完整的错误处理
- ✅ 相同的返回值格式

## 🎮 当前游戏中的应用

已经在以下场景中使用新的广告系统：

### 1. 道具获取（gameViewCmpt.ts）
```typescript
// 点击获取道具按钮
private async watchAdForTool(toolType: number, toolName: string): Promise<void> {
    const result = await adManager.showRewardedAd();
    
    if (result === 'completed') {
        GlobalFuncHelper.setBomb(toolType, 1);
        App.event.emit(EventName.Game.ToolCountRefresh);
        App.view.showMsgTips(`🎉 获得 ${toolName} x1！`);
    }
}
```

### 2. 可扩展到其他场景
- 复活功能
- 额外步数
- 金币获取
- 特殊奖励

## 🔧 配置参数

| 参数 | 类型 | 说明 | 开发值 | 生产值 |
|------|------|------|--------|--------|
| `adUnitId` | string | 微信广告位ID | 可选 | 必需 |
| `mockDuration` | number | 模拟广告时长（秒） | 15 | - |
| `mockSkipDelay` | number | 跳过延迟（秒） | 5 | - |
| `enableDebugLog` | boolean | 调试日志 | true | false |

## 📊 广告结果类型

```typescript
type AdResult = 'completed' | 'aborted' | 'error';
```

- **`completed`**: 广告播放完成，应给奖励
- **`aborted`**: 用户中途关闭，不给奖励  
- **`error`**: 广告加载/播放失败

## 🛡️ 错误处理

系统包含完整的错误处理机制：

1. **重复调用保护** - 防止同时播放多个广告
2. **自动重试机制** - 微信广告失败时自动重试
3. **降级处理** - 真实广告失败时回退到模拟广告
4. **资源清理** - 自动清理事件监听器和广告实例

## 🎯 优势

### ✅ 符合微信规范
- 点击直接播放广告，无二次确认弹窗
- 统一的调用方式和回调处理

### ✅ 开发友好
- 模拟广告提供完整的开发体验
- 丰富的调试信息和状态提示

### ✅ 上线简单
- 只需修改一个配置参数
- 业务逻辑完全不用改动

### ✅ 可维护性强
- 统一的接口设计
- 单例模式，全局可用
- 完整的类型定义

## 🔄 迁移指南

### 从旧的 Advertise 系统迁移：

**旧代码：**
```typescript
Advertise.showVideoAds((success: boolean) => {
    if (success) {
        // 给奖励
    }
});
```

**新代码：**
```typescript
const result = await adManager.showRewardedAd();
if (result === 'completed') {
    // 给奖励
}
```

## 🚨 上线前检查清单

- [ ] 修改 `isDevelopment = false`
- [ ] 填入真实的 `adUnitId`  
- [ ] 设置 `enableDebugLog = false`
- [ ] 测试真实广告功能
- [ ] 验证奖励发放逻辑

## 🆘 常见问题

**Q: 广告不显示怎么办？**  
A: 检查控制台日志，确认广告管理器是否正确初始化。

**Q: 如何切换广告模式？**  
A: 调用 `adManager.switchAdMode(true/false)` 或重新初始化。

**Q: 可以同时播放多个广告吗？**  
A: 不可以，系统有防重复调用保护机制。

**Q: 模拟广告和真实广告的行为一致吗？**  
A: 是的，返回值和调用方式完全一致，只是播放体验不同。

**Q: 如何更换模拟广告的UI图片？**  
A: 将新的图片放在 `assets/resources/images/ads/` 目录下，命名为 `ad_ui.jpg`，系统会自动加载。

**Q: 模拟广告界面包含哪些元素？**  
A: 
- 半透明黑色背景遮罩
- 自定义广告图片（350x200像素）
- 倒计时文字显示
- 绿色进度条
- 跳过按钮（5秒后显示）