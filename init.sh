#!/bin/bash

# 确保脚本在出错时停止执行
set -e

echo "开始初始化项目..."

# 创建目录结构
echo "创建目录结构..."
mkdir -p src/{controllers,services,models,translations}
mkdir -p public/{css,js,images}
mkdir -p config
mkdir -p tests

# 更新 package.json
echo "更新 package.json..."
cat > package.json << 'EOF'
{
  "name": "private-chat",
  "version": "1.0.0",
  "description": "Bilingual private chat system",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.4",
    "dotenv": "^16.3.1",
    "google-translate-api": "^2.3.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.3",
    "jest": "^29.7.0"
  }
}
EOF

# 创建环境配置文件
echo "创建环境配置文件..."
cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
UPLOAD_LIMIT=10mb
EOF

# 移动现有服务器文件到 src 目录
echo "移动服��器文件..."
mv server.js src/ 2>/dev/null || true

# 创建配置文件
echo "创建配置文件..."
cat > config/default.js << 'EOF'
module.exports = {
  server: {
    port: process.env.PORT || 3000
  },
  upload: {
    maxSize: process.env.UPLOAD_LIMIT || '10mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
  },
  languages: ['zh', 'vi']
};
EOF

# 安装依赖
echo "安装项目依赖..."
npm install

echo "项目初始化完成！"
echo "你可以通过以下命令启动项目："
echo "npm run dev (开发模式)"
echo "npm start (生产模式)" 