#!/bin/bash

# UniApp Demo 快速启动脚本
# 用于快速启动不同平台的开发环境

echo "======================================"
echo "   UniApp Demo 快速启动工具"
echo "======================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请先安装 Node.js (>= 14.18)"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

# 显示 Node 和 npm 版本
echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 显示菜单
echo "请选择要启动的平台："
echo "1) H5 网页版"
echo "2) 微信小程序"
echo "3) 支付宝小程序"
echo "4) Android APP"
echo "5) 构建 H5 生产版本"
echo "6) 构建所有平台"
echo "0) 退出"
echo ""

read -p "请输入选项 (0-6): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动 H5 开发服务器..."
        echo "访问地址: http://localhost:3000"
        npm run dev:h5
        ;;
    2)
        echo ""
        echo "🚀 构建微信小程序开发版..."
        npm run dev:mp-weixin
        echo ""
        echo "✅ 构建完成！"
        echo "📁 输出目录: dist/dev/mp-weixin"
        echo "请使用微信开发者工具打开该目录"
        ;;
    3)
        echo ""
        echo "🚀 构建支付宝小程序开发版..."
        npm run dev:mp-alipay
        echo ""
        echo "✅ 构建完成！"
        echo "📁 输出目录: dist/dev/mp-alipay"
        echo "请使用支付宝小程序开发者工具打开该目录"
        ;;
    4)
        echo ""
        echo "🚀 构建 Android APP 开发版..."
        npm run dev:app
        echo ""
        echo "✅ 构建完成！"
        echo "📁 输出目录: dist/dev/app"
        echo "请使用 HBuilderX 进行云打包或本地打包"
        ;;
    5)
        echo ""
        echo "🚀 构建 H5 生产版本..."
        npm run build:h5
        echo ""
        echo "✅ 构建完成！"
        echo "📁 输出目录: dist/build/h5"
        echo "可以部署到任何静态文件服务器"
        ;;
    6)
        echo ""
        echo "🚀 构建所有平台生产版本..."
        echo ""
        echo "构建 H5..."
        npm run build:h5
        echo "✅ H5 构建完成"
        echo ""
        echo "构建微信小程序..."
        npm run build:mp-weixin
        echo "✅ 微信小程序构建完成"
        echo ""
        echo "构建支付宝小程序..."
        npm run build:mp-alipay
        echo "✅ 支付宝小程序构建完成"
        echo ""
        echo "构建 APP..."
        npm run build:app
        echo "✅ APP 构建完成"
        echo ""
        echo "🎉 所有平台构建完成！"
        echo "📁 输出目录: dist/build/"
        ;;
    0)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效的选项"
        exit 1
        ;;
esac