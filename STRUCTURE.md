# 项目结构说明

## 目录结构

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

## 模块说明

### 服务端 (src/server.js)

- WebSocket 服务器配置
- Express 服务器配置
- 文件上传处理
- 消息广播逻辑
- 用户状态管理
- 错误处理机制

### 客户端 (public/js/client.js)

- Socket.IO 客户端配置
- 消息发送和接收
- 文件上传处理
- UI 交互逻辑
- 状态管理
- 错误处理

### 样式表 (public/css/style.css)

- 基础样式定义
- 布局结构样式
- 消息气泡样式
- 媒体消息样式
- 响应式适配
- 动画效果

### 主页面 (public/index.html)

- 页面结构
- UI 组件
- 资源引用
- Meta 配置

## 核心功能实现

### 消息系统

1. 消息发送
   - 文本消息
   - 图片消息
   - 视频消息
   - 状态消息

2. 消息接收
   - 实时接收
   - 消息解析
   - 消息渲染
   - 状态更新

3. 消息操作
   - 消息撤回
   - 已读状态
   - 复制功能
   - 预览功能

### 文件系统

1. 上传功能
   - 文件选择
   - 大小限制
   - 格式验证
   - 进度显示

2. 预览功能
   - 图片预览
   - 视频预览
   - 缩放控制
   - 全屏显示

### 用户系统

1. 状态管理
   - 在线状态
   - 输入状态
   - 已读状态
   - 离线检测

2. 交互功能
   - 长按菜单
   - 右键菜单
   - 触摸操作
   - 键盘操作

## 代码规范

1. 命名规范
   - 驼峰命名法
   - 语义化命名
   - 常量大写
   - 私有变量下划线

2. 注释规范
   - 函数注释
   - 模块注释
   - 关键逻辑注释
   - TODO 标记

3. 格式规范
   - 2空格缩进
   - UTF-8编码
   - LF换行
   - 分号结尾

## 依赖管理

### 生产依赖

```json
{
  "express": "^4.18.2",
  "socket.io": "^4.7.4",
  "multer": "^1.4.5-lts.1",
  "mongodb": "^6.3.0"
}
```

### 开发依赖

```json
{
  "nodemon": "^3.0.3",
  "eslint": "^8.56.0",
  "prettier": "^3.2.5"
}
``` 