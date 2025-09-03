#!/usr/bin/env node

/**
 * Cocos Creator 构建后处理脚本
 * 用于删除微信小游戏中不需要的引擎文件以减小主包大小
 */

const fs = require('fs');
const path = require('path');

const BUILD_PATH = './build/wechatgame';
const COCOS_PATH = path.join(BUILD_PATH, 'cocos');
const COCOS_JS_PATH = path.join(BUILD_PATH, 'cocos-js');
const COCOS_JS_ASSETS_PATH = path.join(COCOS_JS_PATH, 'assets');

// 需要删除的文件列表
// 需要删除的模块列表
const MODULES_TO_DELETE = [
    'dragon-bones', 'spine', 'particle', 'terrain', 'tiled-map', 
    'gfx-webgl2', 'video', 'webview', 'profiler',
    'physics-2d-box2d', 'physics-ammo', 'physics-framework', 
    'physics-2d-framework', 'skeletal-animation', 'wait-for-ammo-instantiation'
];

const FILES_TO_DELETE = [
    // cocos 目录中的大文件
    path.join(COCOS_PATH, 'dragon-bones.js'),          // 255KB - 龙骨动画
    path.join(COCOS_PATH, 'spine.js'),                 // 69KB - spine动画  
    path.join(COCOS_PATH, 'particle.js'),              // 144KB - 3D粒子
    path.join(COCOS_PATH, 'terrain.js'),               // 43KB - 地形系统
    path.join(COCOS_PATH, 'tiled-map.js'),             // 59KB - tile地图
    path.join(COCOS_PATH, 'gfx-webgl2.js'),            // 113KB - WebGL2渲染
    path.join(COCOS_PATH, 'video.js'),                 // 视频模块
    path.join(COCOS_PATH, 'webview.js'),               // WebView模块
    path.join(COCOS_PATH, 'profiler.js'),              // 性能分析器
    
    // deprecated 文件
    path.join(COCOS_PATH, 'deprecated-1e41692e.js'),   // 44KB
    path.join(COCOS_PATH, 'deprecated-55844a0e.js'),   // 29KB  
    path.join(COCOS_PATH, 'deprecated-8cbcc834.js'),   // 25KB
    path.join(COCOS_PATH, 'deprecated-a7c6f62a.js'),   // 4KB
    path.join(COCOS_PATH, 'deprecated-c8756aed.js'),   // 12KB
    
    // cocos-js 目录中的物理引擎文件
    path.join(COCOS_JS_PATH, 'physics-2d-box2d.js'),         // 372KB - 2D物理引擎
    path.join(COCOS_JS_PATH, 'physics-ammo.js'),             // 79KB - 3D物理引擎  
    path.join(COCOS_JS_PATH, 'physics-framework.js'),        // 3KB - 物理框架
    path.join(COCOS_JS_PATH, 'physics-2d-framework.js'),     // 1KB - 2D物理框架
    path.join(COCOS_JS_PATH, 'bullet.release.wasm-d6c4a6fc.js'), // 26KB
    path.join(COCOS_JS_PATH, 'wait-for-ammo-instantiation.js'),  // 物理引擎相关
    path.join(COCOS_JS_PATH, 'skeletal-animation.js'),       // 9KB - 骨骼动画
    
    // WASM 文件 - 最大的文件
    path.join(COCOS_JS_ASSETS_PATH, 'bullet.release.wasm-10f8cbd4.wasm'),  // 468KB - 物理引擎
    path.join(COCOS_JS_ASSETS_PATH, 'spine-59f406dc.wasm'),                // 453KB - spine动画
];

function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            fs.unlinkSync(filePath);
            console.log(`✅ 删除: ${filePath} (${(stats.size / 1024).toFixed(1)}KB)`);
            return stats.size;
        } else {
            console.log(`⚠️  文件不存在: ${filePath}`);
            return 0;
        }
    } catch (error) {
        console.log(`❌ 删除失败: ${filePath} - ${error.message}`);
        return 0;
    }
}

function fixModuleReferences() {
    console.log('🔧 修复模块引用...');
    
    // 修复 cc.js 文件
    const ccJsPath = path.join(COCOS_JS_PATH, 'cc.js');
    if (fs.existsSync(ccJsPath)) {
        try {
            let content = fs.readFileSync(ccJsPath, 'utf8');
            
            // 移除已删除模块的引用
            MODULES_TO_DELETE.forEach(module => {
                // 移除 import 引用
                const importRegex = new RegExp(`, "([^"]*/)?(${module})\\.js"`, 'g');
                const pathImportRegex = new RegExp(`"\\.\\/([^"]*/)?(${module})\\.js", `, 'g');
                const pluginImportRegex = new RegExp(`"plugin:cocos\\/(${module})\\.js", `, 'g');
                
                content = content.replace(importRegex, '');
                content = content.replace(pathImportRegex, '');
                content = content.replace(pluginImportRegex, '');
            });
            
            // 清理多余的逗号和空格
            content = content.replace(/,\s*,/g, ',');
            content = content.replace(/,\s*\]/g, ']');
            content = content.replace(/\[\s*,/g, '[');
            
            fs.writeFileSync(ccJsPath, content, 'utf8');
            console.log(`✅ 修复: ${ccJsPath}`);
        } catch (error) {
            console.log(`❌ 修复失败: ${ccJsPath} - ${error.message}`);
        }
    }
    
    // 修复 import-map.js 文件
    const importMapPath = path.join(BUILD_PATH, 'src', 'import-map.js');
    if (fs.existsSync(importMapPath)) {
        try {
            let content = fs.readFileSync(importMapPath, 'utf8');
            
            // 移除已删除模块的引用
            MODULES_TO_DELETE.forEach(module => {
                const mapRegex = new RegExp(`\\s*"[^"]*\\/${module}\\.js":\\s*"[^"]*",?\\n?`, 'g');
                content = content.replace(mapRegex, '');
            });
            
            // 清理多余的逗号
            content = content.replace(/,(\s*\})/g, '$1');
            content = content.replace(/,(\s*,)/g, '$1');
            
            fs.writeFileSync(importMapPath, content, 'utf8');
            console.log(`✅ 修复: ${importMapPath}`);
        } catch (error) {
            console.log(`❌ 修复失败: ${importMapPath} - ${error.message}`);
        }
    }
}

function main() {
    console.log('🚀 开始执行构建后处理...');
    console.log('📍 目标路径:', BUILD_PATH);
    
    if (!fs.existsSync(BUILD_PATH)) {
        console.log('❌ 构建目录不存在:', BUILD_PATH);
        process.exit(1);
    }
    
    let totalSaved = 0;
    let deletedCount = 0;
    
    FILES_TO_DELETE.forEach(filePath => {
        const saved = deleteFile(filePath);
        if (saved > 0) {
            totalSaved += saved;
            deletedCount++;
        }
    });
    
    // 修复模块引用
    fixModuleReferences();
    
    console.log('\n📊 处理结果:');
    console.log(`🗑️  删除文件数: ${deletedCount}`);
    console.log(`💾 节省空间: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
    
    // 检查处理后的大小
    const execSync = require('child_process').execSync;
    try {
        const cocosSize = execSync(`du -sk "${COCOS_PATH}"`, {encoding: 'utf8'}).split('\t')[0];
        const cocosJsSize = execSync(`du -sk "${COCOS_JS_PATH}"`, {encoding: 'utf8'}).split('\t')[0];
        const assetsSize = execSync(`du -sk "${path.join(BUILD_PATH, 'assets')}"`, {encoding: 'utf8'}).split('\t')[0];
        
        const totalMainPackageSize = (parseInt(cocosSize) + parseInt(cocosJsSize) + parseInt(assetsSize) + 500); // +500KB for other files
        
        console.log('\n📏 处理后主包大小估算:');
        console.log(`   cocos: ${(cocosSize/1024).toFixed(1)}MB`);
        console.log(`   cocos-js: ${(cocosJsSize/1024).toFixed(1)}MB`);
        console.log(`   assets: ${(assetsSize/1024).toFixed(1)}MB`);
        console.log(`   其他文件: ~0.5MB`);
        console.log(`   预估总计: ${(totalMainPackageSize/1024).toFixed(1)}MB`);
        
        if (totalMainPackageSize/1024 < 4) {
            console.log('✅ 预估主包大小小于4MB限制！');
        } else {
            console.log('⚠️  预估主包大小仍然超过4MB限制');
        }
        
    } catch (error) {
        console.log('⚠️  无法计算处理后大小:', error.message);
    }
    
    console.log('\n🎉 构建后处理完成！');
}

if (require.main === module) {
    main();
}

module.exports = { main, FILES_TO_DELETE };