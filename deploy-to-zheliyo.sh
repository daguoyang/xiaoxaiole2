#!/bin/bash
# 部署远程资源到 www.zheliyo.com

echo "🚀 开始部署糖果消消乐远程资源..."

# 检查构建目录是否存在
if [ ! -d "build/wechatgame" ]; then
    echo "❌ 构建目录不存在，请先在 Cocos Creator 中构建项目"
    exit 1
fi

# 运行后处理脚本
echo "🔧 运行构建后处理..."
npm run post-build

if [ $? -ne 0 ]; then
    echo "❌ 后处理脚本执行失败"
    exit 1
fi

# 检查分包目录
SUBPACKAGES_DIR="build/wechatgame/subpackages"
if [ ! -d "$SUBPACKAGES_DIR" ]; then
    echo "❌ 分包目录不存在: $SUBPACKAGES_DIR"
    exit 1
fi

echo "📦 准备上传的分包:"
ls -la "$SUBPACKAGES_DIR"

echo ""
echo "📋 部署信息:"
echo "   目标域名: www.zheliyo.com"
echo "   远程路径: /minigame/remote-assets/"
echo "   本地路径: $SUBPACKAGES_DIR"

echo ""
echo "⚠️  接下来需要手动操作:"
echo "1. 将 $SUBPACKAGES_DIR 目录中的所有文件上传到你的服务器"
echo "2. 确保文件可以通过以下URL访问:"
echo "   https://www.zheliyo.com/minigame/remote-assets/prefab-resources/"
echo "   https://www.zheliyo.com/minigame/remote-assets/audio-resources/"
echo "   https://www.zheliyo.com/minigame/remote-assets/level-configs/"
echo "   https://www.zheliyo.com/minigame/remote-assets/ui-resources/"

echo ""
echo "🔧 上传方式建议:"
echo "• 使用 FTP/SFTP 客户端"
echo "• 使用 rsync: rsync -avz $SUBPACKAGES_DIR/ user@your-server:/path/to/website/minigame/remote-assets/"
echo "• 使用 scp: scp -r $SUBPACKAGES_DIR/* user@your-server:/path/to/website/minigame/remote-assets/"

echo ""
echo "3. 在微信公众平台配置域名白名单:"
echo "   request合法域名: https://www.zheliyo.com"
echo "   downloadFile合法域名: https://www.zheliyo.com"

echo ""
echo "✅ 预处理完成，请按照上述提示完成服务器部署"