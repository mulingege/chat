# 项目文件详细说明

## 核心文件

### 1. package.json
```json
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
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "google-translate-api": "^2.3.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.3"
  }
}
```
- 项目配置文件
- 定义了项目依赖和脚本
- 包含开发和生产依赖
- 指定了主入口文件

### 2. src/server.js
服务器端核心文件，包含：
- Express 服务器配置
- Socket.IO 实时通信
- 文件上传处理
- 用户状态管理
- 消息处理系统
- 错误处理机制

主要功能：
```javascript
// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, uniqueId + ext);
    }
});

// 用户状态管理
const users = {
    GG: {
        id: 'GG',
        avatar: '/images/GG.png',
        online: false,
        status: 'offline',
        socketId: null
    },
    MM: {
        id: 'MM',
        avatar: '/images/MM.png',
        online: false,
        status: 'offline',
        socketId: null
    }
};

// Socket.IO 事件处理
io.on('connection', (socket) => {
    // 登录处理
    // 消息处理
    // 状态更新
    // 媒体消息
    // 断开连接
});
```

### 3. public/index.html
主页面文件，包含：
- 页面结构定义
- 元数据配置
- 外部资源引用
- 用户界面组件

关键部分：
```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>聊天</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- 登录界面 -->
    <div class="login-screen" id="loginScreen">
        <!-- 头像选择 -->
    </div>

    <!-- 聊天界面 -->
    <div class="chat-screen hidden" id="chatScreen">
        <!-- 顶部模块 -->
        <!-- 消息区域 -->
        <!-- 输入模块 -->
    </div>
</body>
</html>
```

### 4. public/css/style.css
样式表文件，定义：
- 全局样式变量
- 布局结构
- 组件样式
- 动画效果
- 响应式设计

主要部分：
```css
:root {
    --primary-color: #7F5AF0;
    --secondary-color: #2CB67D;
    --background-color: #16161A;
    --surface-color: #242629;
    --text-color: #FFFFFE;
    --gradient-start: #7F5AF0;
    --gradient-end: #2CB67D;
}

/* 布局样式 */
.container {
    height: 100vh;
    background: rgba(28, 28, 30, 0.95);
    position: relative;
    overflow: hidden;
}

/* 消息样式 */
.message {
    max-width: 80%;
    margin-bottom: 15px;
    clear: both;
}

/* 媒体预览 */
.media-preview {
    position: relative;
    max-width: 300px;
    border-radius: 10px;
    overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
    /* 移动端适配 */
}
```

### 5. public/js/client.js
客户端脚本文件，包含：
- Socket.IO 客户端
- UI 交互处理
- 消息处理
- 文件上传
- 媒体预览

核心功能：
```javascript
// Socket 连接
const socket = io();

// 消息处理
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
        socket.emit('message', {
            text,
            type: 'text'
        });
    }
}

// 媒体处理
async function handleFileUpload(file, type) {
    // 文件上传逻辑
}

// 预览功能
function showMediaPreview(url, type) {
    // 媒体预览逻辑
}
```

### 6. setup.sh
安装脚本，包含：
```bash
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

# 安装依赖
echo "正在安装项目依赖..."
npm install

# 启动应用
echo "启动应用..."
npm start
```

### 7. init.sh
初始化脚本，包含：
```bash
#!/bin/bash

# 确保脚本在出错时停止执行
set -e

echo "开始初始化项目..."

# 创建目录结构
mkdir -p src/{controllers,services,models,translations}
mkdir -p public/{css,js,images}
mkdir -p config
mkdir -p tests

# 创建配置文件
echo "创建配置文件..."
# 配置文件内容

# 安装依赖
echo "安装项目依赖..."
npm install
```

## 文档文件

### 1. README.md
- 项目概述
- 安装说明
- 使用指南
- 功能特点
- 贡献指南

### 2. DEVELOPMENT.md
- 开发进度
- 功能清单
- 技术债务
- 测试记录
- 部署信息

### 3. STRUCTURE.md
- 目录结构
- 文件说明
- 功能模块
- 事件流程
- 注意事项

### 4. FILES.md (本文件)
- 详细的文件说明
- 代码示例
- 功能解释
- 配置说明

## 资源文件

### 1. public/images/
- GG.png - 男性用户头像
- MM.png - 女性用户头像
- error.png - 错误占位图

### 2. public/uploads/
- images/ - 上传的图片文件
- videos/ - 上传的视频文件

## 配置文件

### 1. .env
```env
PORT=3000
NODE_ENV=development
UPLOAD_LIMIT=10mb
```

### 2. config/default.js
```javascript
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
```

## 测试文件

### 1. tests/
- 单元测试
- 集成测试
- 端到端测试
- 性能测试

## 注意事项

1. 文件编码
   - 所有文件使用 UTF-8 编码
   - 换行符使用 LF
   - 文本文件末尾保留一个空行

2. 命名规范
   - 文件名使用小写字母
   - 使用连字符分隔单词
   - 类文件使用大驼峰命名
   - 配置文件使用小写

3. 文件权限
   - 脚本文件需要可执行权限
   - 上传目录需要写入权限
   - 配置文件需要适当的访问限制

4. 版本控制
   - 忽略 node_modules
   - 忽略 .env 文件
   - 忽略上传的媒体文件
   - 保留空目录的 .gitkeep
``` 