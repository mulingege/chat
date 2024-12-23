#!/bin/bash

# 确保脚本在出错时停止执行
set -e

echo "开始安装私人聊天网站..."

# 检查并安装 Node.js
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 检查并安装 npm
if ! command -v npm &> /dev/null; then
    echo "正在安装 npm..."
    sudo apt-get install -y npm
fi

# 安装项目依赖
echo "正在安装项目依赖..."
npm install

# 启动应用
echo "启动应用..."
npm start 