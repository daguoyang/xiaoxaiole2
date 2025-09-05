#!/bin/bash
# 构建后修复脚本 - 解决主包大小超限和文件hash问题

echo "🔧 开始修复构建问题..."

cd "$(dirname "$0")"

# 1. 修复主包大小问题 - 将start-scene移动到分包
echo "📦 修复主包大小问题..."
if [ -d "build/wechatgame/assets/start-scene" ]; then
    echo "   发现start-scene在主包中，移动到分包..."
    # 确保分包目录存在
    mkdir -p build/wechatgame/subpackages/start-scene-resources
    
    # 移动start-scene到分包
    mv build/wechatgame/assets/start-scene build/wechatgame/subpackages/start-scene-resources/
    
    # 添加分包配置到game.json
    if ! grep -q "start-scene-resources" build/wechatgame/game.json; then
        echo "   添加start-scene-resources分包配置..."
        # 在最后一个分包后添加新的分包配置
        sed -i '' 's/        }/        },\
        {\
            "name": "start-scene-resources",\
            "root": "subpackages\/start-scene-resources\/"\
        }/2' build/wechatgame/game.json
    fi
    
    # 修复settings文件中的subpackages配置
    settings_file="build/wechatgame/src/settings.*.json"
    if ls $settings_file 1> /dev/null 2>&1; then
        settings=$(ls $settings_file | head -1)
        if ! grep -q '"start-scene-resources"' "$settings"; then
            echo "   修复settings文件中的subpackages配置..."
            sed -i '' 's/"audio-resources"]/"audio-resources","start-scene-resources"]/' "$settings"
        fi
    fi
    
    echo "   ✅ start-scene已移动到分包并添加配置"
else
    echo "   ✅ start-scene已在分包中"
fi


# 2. 修复MD5 hash文件名问题 - 创建软链接
echo "🔗 修复MD5 hash文件名问题..."
link_count=0
find build/wechatgame -name "*.*.json" -type f | while read file; do
    dir=$(dirname "$file")
    basename=$(basename "$file")
    # 提取没有hash的文件名 (例如: file.abc12.json -> file.json)
    clean_name=$(echo "$basename" | sed -E 's/\.[a-f0-9]+\.json$/.json/')
    if [[ "$clean_name" != "$basename" && ! -e "$dir/$clean_name" ]]; then
        ln -sf "$basename" "$dir/$clean_name"
        ((link_count++))
    fi
done

# 3. 修复适配器文件
echo "⚙️ 修复适配器文件..."
cd build/wechatgame
if ls web-adapter.*.js 1> /dev/null 2>&1 && [ ! -f "web-adapter.js" ]; then
    web_adapter=$(ls web-adapter.*.js | head -1)
    cp "$web_adapter" web-adapter.js
    echo "   ✅ 创建web-adapter.js文件"
fi

if ls engine-adapter.*.js 1> /dev/null 2>&1 && [ ! -f "engine-adapter.js" ]; then
    engine_adapter=$(ls engine-adapter.*.js | head -1)
    cp "$engine_adapter" engine-adapter.js
    echo "   ✅ 创建engine-adapter.js文件"
fi

cd ../..

# 4. 检查最终结果
echo "📊 检查修复结果..."
main_size_kb=$(du -sk build/wechatgame/* | grep -v subpackages | awk '{sum+=$1} END {print sum}')
main_size_mb=$(echo "scale=2; $main_size_kb/1024" | bc -l)

echo "   主包大小: ${main_size_kb}KB (${main_size_mb}MB)"
if [ "$main_size_kb" -lt 4096 ]; then
    echo "   ✅ 主包大小符合4MB限制"
else
    echo "   ❌ 主包大小仍然超过4MB限制"
fi

echo "🎉 修复完成! 现在可以上传到微信开发者工具了"