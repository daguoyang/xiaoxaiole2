# 🌐 远程资源托管部署指南

## 📋 概述
通过远程资源托管，可以将大部分资源文件放到CDN上，大幅减少微信小游戏主包大小。

## ⚙️ 配置步骤

### 1. 修改构建配置
已完成配置 `settings/v2/packages/builder.json`:
```json
{
  "wechatgame": {
    "remoteBundleUrl": "https://your-cdn-domain.com/remote-assets/",
    "md5Cache": true,
    "remoteServerAddress": "https://your-cdn-domain.com"
  },
  "bundleConfig": {
    // 所有分包的 wechatgame 配置都设置为:
    "wechatgame": {
      "compressionType": "subpackage",
      "isRemote": true  // ✅ 已启用远程托管
    }
  }
}
```

### 2. CDN 部署方案

#### 选项A: 阿里云 OSS + CDN
```bash
# 1. 创建OSS存储桶
# 2. 配置CDN域名
# 3. 上传资源文件结构:
www.zheliyo.com/minigame/remote-assets/
├── prefab-resources/
│   ├── project.manifest
│   ├── version.manifest
│   └── ... (分包文件)
├── audio-resources/
├── level-configs/
└── ui-resources/
```

#### 选项B: 腾讯云 COS + CDN
```bash
# 1. 创建COS存储桶
# 2. 配置CDN加速域名
# 3. 设置跨域CORS配置
```

#### 选项C: 七牛云对象存储
```bash
# 1. 创建存储空间
# 2. 配置融合CDN
# 3. 设置访问权限
```

### 3. 构建和部署流程

#### 步骤1: 构建项目
```bash
# 在 Cocos Creator 中构建微信小游戏
# 选择 "MD5 Cache" 选项
# 构建完成后运行后处理脚本
npm run post-build
```

#### 步骤2: 分离资源文件
构建完成后，`build/wechatgame/` 目录结构:
```
build/wechatgame/
├── 主包文件 (保留在本地，上传到微信)
│   ├── game.js
│   ├── cocos/
│   ├── cocos-js/
│   └── assets/
└── 分包文件 (上传到CDN)
    └── subpackages/
        ├── prefab-resources/
        ├── audio-resources/
        ├── level-configs/
        └── ui-resources/
```

#### 步骤3: 上传到CDN
```bash
# 假设使用阿里云 OSS CLI
ossutil cp -r build/wechatgame/subpackages/ oss://your-bucket/remote-assets/ --update

# 或使用腾讯云 COS CLI  
coscli cp -r build/wechatgame/subpackages/ cos://your-bucket/remote-assets/ --sync
```

### 4. 域名配置要求

#### 微信小游戏域名白名单
在微信公众平台 -> 开发 -> 开发管理 -> 开发设置 中配置:
```
request合法域名: https://www.zheliyo.com
downloadFile合法域名: https://www.zheliyo.com
```

#### HTTPS要求
- 必须使用 HTTPS 协议
- SSL证书必须有效
- 支持 TLS 1.2 及以上版本

### 5. 版本管理和更新

#### Manifest文件示例
每个分包需要 `project.manifest`:
```json
{
  "version": "1.0.1",
  "remoteManifestUrl": "https://your-cdn-domain.com/remote-assets/prefab-resources/project.manifest",
  "remoteVersionUrl": "https://your-cdn-domain.com/remote-assets/prefab-resources/version.manifest", 
  "assets": {
    "prefab/ui/homeView.prefab": {
      "md5": "abc123...",
      "size": 1024
    }
  }
}
```

#### 自动化部署脚本
```bash
#!/bin/bash
# deploy-remote-assets.sh

# 1. 构建项目
echo "构建微信小游戏..."
# 在 Cocos Creator 中手动构建，或使用命令行

# 2. 运行后处理
echo "运行后处理脚本..."
npm run post-build

# 3. 上传分包到CDN  
echo "上传远程资源到CDN..."
ossutil cp -r build/wechatgame/subpackages/ oss://your-bucket/remote-assets/ --update

# 4. 验证上传
echo "验证远程资源..."
curl -I https://your-cdn-domain.com/remote-assets/prefab-resources/project.manifest

echo "部署完成!"
```

### 6. 本地开发和测试

#### 修改CDN地址
在 `remoteAssetsManager.ts` 中设置:
```typescript
// 开发环境
const DEV_CDN = 'http://localhost:8080/remote-assets/';
// 生产环境  
const PROD_CDN = 'https://your-cdn-domain.com/remote-assets/';

remoteAssetsManager.init(__DEV__ ? DEV_CDN : PROD_CDN);
```

#### 本地测试服务器
```bash
# 启动本地静态服务器测试
cd build/wechatgame
python -m http.server 8080
# 访问 http://localhost:8080/subpackages/
```

## ⚠️ 注意事项

1. **首次加载**: 远程资源首次下载会较慢，需要做好加载提示
2. **网络异常**: 实现本地资源回退机制 
3. **缓存管理**: 合理设置CDN缓存时间，资源更新时清理缓存
4. **文件大小**: 单个分包不应超过20MB
5. **并发限制**: 微信小游戏同时下载数有限制，避免过多并发

## 📊 效果预期

- **主包大小**: 从5.7MB减少到约2MB
- **加载速度**: 首次启动略慢，后续缓存加载很快  
- **用户体验**: 能够顺利发布到微信小游戏平台

## 🔧 故障排查

### 常见问题
1. **远程资源加载失败**: 检查域名白名单配置
2. **CORS错误**: 配置CDN跨域访问
3. **SSL证书问题**: 确保HTTPS证书有效
4. **缓存不更新**: 清理CDN缓存或修改文件版本号

### 调试工具
- 微信开发者工具网络面板
- Console输出的详细日志
- CDN提供商的访问日志分析