# style.css 文件说明

## 基础设置

### 1. 重置样式
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
```
- 清除默认边距
- 设置盒模型

### 2. 变量定义
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
```
- 主题颜色
- 背景颜色
- 文本颜色
- 渐变颜色

### 3. 基础布局
```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #000;
    height: 100vh;
    height: -webkit-fill-available;
    color: var(--text-color);
    overflow: hidden;
}

.container {
    height: 100vh;
    height: -webkit-fill-available;
    margin: 0;
    background: rgba(28, 28, 30, 0.95);
    position: relative;
    overflow: hidden;
}
```
- 字体设置
- 视口高度
- 背景颜色
- 溢出处理

## 登录界面

### 1. 登录屏幕
```css
.login-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #000;
}

.login-screen h2 {
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: var(--text-color);
    font-weight: 600;
}
```
- 居中布局
- 标题样式
- 背景设置

### 2. 头像选择
```css
.avatar-selection {
    display: flex;
    gap: 40px;
}

.login-avatar {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.login-avatar img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}
```
- 头像布局
- 交互效果
- 过渡动画

## 聊天界面

### 1. 顶部模块
```css
.top-module {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: 70px;
    background: transparent;
}

.top-bar {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: env(safe-area-inset-top) 15px 10px;
    background: transparent;
}
```
- 固定定位
- 布局结构
- iOS适配

### 2. 用户状态
```css
.user-avatar {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 44px;
    height: 44px;
}

.status-dot {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.3);
    z-index: 1;
    transition: all 0.3s ease;
}

.status-dot.online {
    background-color: #2CB67D;
    box-shadow: 0 0 0 2px rgba(44, 182, 125, 0.2);
    animation: pulse-status 2s infinite;
}
```
- 头像布局
- 状态指示
- 动画效果

### 3. 消息区域
```css
.message-module {
    position: fixed;
    top: 70px;
    bottom: 74px;
    left: 0;
    right: 0;
    overflow: hidden;
    z-index: 1;
}

.messages {
    height: 100%;
    padding: 20px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
```
- 区域定位
- 滚动处理
- 触摸优化

### 4. 消息气泡
```css
.message {
    max-width: 70%;
    margin-bottom: 15px;
    clear: both;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.3s forwards;
}

.message.sent {
    float: right;
}

.message.received {
    float: left;
}

.message-content {
    padding: 12px 16px;
    border-radius: 20px;
    font-size: 16px;
    line-height: 1.4;
    word-break: break-word;
    position: relative;
}
```
- 气泡布局
- 动画效果
- 文本处理

### 5. 媒体消息
```css
.media-preview {
    position: relative;
    display: inline-block;
    max-width: 300px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.1);
}

.media-preview img,
.media-preview video {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.3s ease;
}
```
- 预览布局
- 图片视频样式
- 交互效果

### 6. 输入区域
```css
.input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 15px;
    background: rgba(28, 28, 30, 0.98);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 100;
}

.input-area input {
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 20px;
    border-radius: 22px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-color);
    font-size: 16px;
    transition: all 0.3s ease;
}
```
- 固定定位
- 毛玻璃效果
- 输入框样式

## 响应式设计

### 1. 移动端适配
```css
@media (max-width: 768px) {
    .message {
        max-width: 85%;
    }
    
    .messages {
        padding: 15px;
    }
    
    .input-area {
        padding: 10px;
    }
}
```
- 消息宽度
- 内边距调整
- 布局优化

### 2. 大屏幕适配
```css
@media (min-width: 1024px) {
    .chat-screen {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .media-preview {
        max-width: 400px;
    }
}
```
- 最大宽度
- 居中布局
- 媒体尺寸

## 动画效果

### 1. 消息动画
```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```
- 淡入效果
- 位移效果

### 2. 状态动画
```css
@keyframes pulse-status {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
}
```
- 脉冲效果
- 透明度变化

## 性能优化

### 1. 硬件加速
```css
.message {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
}
```
- GPU加速
- 3D变换
- 渲染优化

### 2. 动画性能
```css
.transition-all {
    transition-property: transform, opacity;
    transition-duration: 0.3s;
    transition-timing-function: ease;
}
```
- 属性分离
- 时间控制
- 缓动函数

### 3. 滚动优化
```css
.messages {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
}
```
- 滚动体验
- 平滑滚动
- 滚动边界 