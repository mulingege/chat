# 实时聊天应用

一个基于 Node.js 和 Socket.IO 的现代化实时聊天应用。

## 功能特性

- 实时消息收发
- 图片和视频消息支持
- 消息已读状态显示
- 消息撤回功能(2分钟内)
- 实时输入状态提示
- 长按/右键菜单操作
- 移动端完全适配
- iOS 安全区域支持

## 技术栈

- 前端: HTML5, CSS3, JavaScript
- 后端: Node.js, Express
- 实时通信: Socket.IO
- 文件处理: Multer
- 数据存储: MongoDB

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- MongoDB >= 4.0.0

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd [项目目录]
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置必要参数
```

4. 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## 项目结构

```
project/
├── src/
│   └── server.js          # 服务器入口文件
├── public/
│   ├── css/
│   │   └── style.css      # 样式文件
│   ├── js/
│   │   └── client.js      # 客户端脚本
│   ├── images/            # 图片资源
│   ├── uploads/           # 上传文件目录
│   └── index.html         # 主页面
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 使用说明

1. 消息发送
   - 文本消息: 直接输入并发送
   - 图片消息: 点击图片图标上传
   - 视频消息: 点击视频图标上传

2. 消息操作
   - 移动端: 长按消息显示菜单
   - 桌面端: 右键点击消息显示菜单
   - 撤回: 2分钟内可撤回消息

3. 媒体文件限制
   - 图片: 最大 10MB
   - 视频: 最大 100MB
   - 支持格式: jpg, png, gif, mp4, webm

## 浏览器支持

- Chrome >= 80
- Firefox >= 75
- Safari >= 13
- Edge >= 80
- iOS Safari >= 13
- Android Chrome >= 80

## 开发说明

详细的开发文档请参考:
- [开发文档](./DEVELOPMENT.md)
- [项目结构](./STRUCTURE.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 发起 Pull Request

## 许可证

MIT License