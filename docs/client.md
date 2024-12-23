# client.js 文件说明

## 核心功能实现

### 1. Socket.IO 连接管理
```javascript
const socket = io();
let currentUser = null;
```
- 建立与服务器的WebSocket连接
- 维护当前用户状态

### 2. 状态管理
```javascript
let isBusy = false;
let isTyping = false;
let lastMessageTime = null;
```
- `isBusy`: 用户是否处于忙碌状态
- `isTyping`: 用户是否正在输入
- `lastMessageTime`: 上一条消息的时间戳

### 3. 页面可见性监听
```javascript
document.addEventListener('visibilitychange', () => {
    if (!currentUser) return;
    isBusy = document.hidden;
    socket.emit('statusChange', { status: isBusy ? 'busy' : 'online' });
});
```
- 监听页面切换事件
- 自动更新用户状态
- 发送状态变更通知

### 4. 用户界面更新
```javascript
function updateUserInterface(userData) {
    const { user, onlineUsers } = userData;
    currentUser = user;
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    messageInput.focus();
    updateAllUsersStatus(onlineUsers);
}
```
- 处理登录成功后的界面切换
- 更新用户状���显示
- 设置输入框焦点

### 5. 用户状态管理
```javascript
function updateUserStatus(userId, status) {
    const statusDot = document.getElementById(`${userId.toLowerCase()}Status`);
    const statusText = document.getElementById(`${userId.toLowerCase()}StatusText`);
    const avatar = document.getElementById(`${userId.toLowerCase()}Avatar`);
    
    // 状态样式更新
    if (statusDot) {
        statusDot.className = `status-dot ${status}`;
    }
    // 状态文本更新
    if (statusText) {
        let text = '离线';
        switch (status) {
            case 'online': text = '在线'; break;
            case 'busy': text = '忙'; break;
            case 'offline': text = '离线'; break;
        }
        statusText.textContent = text;
    }
    // 头像状态更新
    if (avatar) {
        avatar.className = `avatar-img ${status !== 'offline' ? 'active' : ''}`;
    }
}
```
- 更新状态指示点
- 更新状态文本
- 更新头像样式

### 6. 消息发送处理
```javascript
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
        socket.emit('message', {
            text,
            type: 'text'
        });
        messageInput.value = '';
        messageInput.focus();
        
        // 清除输入状态
        if (isTyping) {
            socket.emit('typing', false);
            isTyping = false;
            clearTimeout(typingTimeout);
        }
    }
}
```
- 消息内容验证
- 发送消息事件
- 清空输入框
- 重置输入状态

### 7. 输入状态处理
```javascript
let typingTimeout;
let lastTypingTime = 0;
const TYPING_TIMER_LENGTH = 3000;

function handleTyping() {
    if (!currentUser) return;
    const now = Date.now();
    
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', true);
        lastTypingTime = now;
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        if (now - lastTypingTime >= TYPING_TIMER_LENGTH && isTyping) {
            socket.emit('typing', false);
            isTyping = false;
        }
    }, TYPING_TIMER_LENGTH);
}
```
- 输入状态防抖
- 自动清除状态
- 实时状态广播

### 8. Socket事件监听
```javascript
// 登录成功
socket.on('loginSuccess', updateUserInterface);

// 用户状态更新
socket.on('userStatusUpdate', (data) => {
    data.users.forEach(user => {
        updateUserStatus(user.id, user.status);
    });
});

// 消息接收
socket.on('message', (data) => {
    const messageElement = createMessageElement(data);
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});

// 输入状态
socket.on('userTyping', (data) => {
    const { userId, isTyping } = data;
    const typingIndicator = document.getElementById(`${userId.toLowerCase()}Typing`);
    if (typingIndicator) {
        if (isTyping) {
            typingIndicator.textContent = '正在输入...';
            typingIndicator.classList.add('active');
        } else {
            typingIndicator.classList.remove('active');
            setTimeout(() => {
                if (!typingIndicator.classList.contains('active')) {
                    typingIndicator.textContent = '';
                }
            }, 300);
        }
    }
});
```
- 登录状态处理
- 用户状态同步
- 消息接收显示
- 输入状态显示

### 9. 消息元素创建
```javascript
function createMessageElement(data) {
    const { id, text, user, timestamp, type, url, readBy, recalled, canRecall } = data;
    const messageTime = new Date(timestamp);
    const messageDiv = document.createElement('div');
    const isSent = user.id === currentUser.id;
    
    // 时间分割线
    if (shouldShowTimestamp(messageTime)) {
        const timeDiv = createTimeDivider(messageTime);
        messages.appendChild(timeDiv);
    }
    
    // 消息样式
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = id;
    messageDiv.dataset.messageType = type;
    messageDiv.dataset.messageText = type === 'text' ? text : '';
    
    // 撤回消息处理
    if (recalled) {
        messageDiv.classList.add('recalled');
        const recalledDiv = document.createElement('div');
        recalledDiv.className = 'message-recalled';
        recalledDiv.textContent = '消息已撤回';
        messageDiv.appendChild(recalledDiv);
        return messageDiv;
    }
    
    // 消息内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 根据类型创建内容
    if (type === 'text') {
        contentDiv.textContent = text;
    } else if (type === 'image' || type === 'video') {
        // 创建媒体预览
        const mediaPreview = createMediaPreview(type, url);
        contentDiv.appendChild(mediaPreview);
    }
    
    messageDiv.appendChild(contentDiv);
    return messageDiv;
}
```
- 消息类型判断
- 时间分割线处理
- 撤回状态处理
- 媒体消息处理

### 10. 媒体消息处理
```javascript
function createMediaPreview(type, url) {
    const mediaPreview = document.createElement('div');
    mediaPreview.className = 'media-preview';
    
    if (type === 'image') {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '图片';
        img.loading = 'lazy';
        
        mediaPreview.classList.add('loading');
        
        img.onload = () => {
            mediaPreview.classList.remove('loading');
            messages.scrollTop = messages.scrollHeight;
        };
        
        img.onerror = () => {
            mediaPreview.classList.remove('loading');
            mediaPreview.classList.add('error');
            img.src = '/images/error.png';
        };
        
        mediaPreview.appendChild(img);
        mediaPreview.onclick = () => {
            if (!mediaPreview.classList.contains('error')) {
                showMediaPreview(url, 'image');
            }
        };
    } else {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        
        mediaPreview.classList.add('loading');
        
        video.onloadedmetadata = () => {
            mediaPreview.classList.remove('loading');
        };
        
        video.onerror = () => {
            mediaPreview.classList.remove('loading');
            mediaPreview.classList.add('error');
            const errorText = document.createElement('div');
            errorText.className = 'error-text';
            errorText.textContent = '视频加载失败';
            mediaPreview.appendChild(errorText);
        };
        
        mediaPreview.appendChild(video);
    }
    
    return mediaPreview;
}
```
- 图片预览创建
- 视频预览创建
- 加载状态处理
- 错误状态处理

## 事件处理流程

### 1. 消息发送流程
1. 用户输入内容
2. 触发发送事件
3. 清空输入框
4. 重置输入状态
5. 等待服务器响应
6. 显示发送的消息

### 2. 媒体上传流程
1. 选择文件
2. 创建上传请求
3. 显示上传进度
4. 处理上传结果
5. 发送媒体消息
6. 显示媒体预览

### 3. 状态更新流程
1. 检测状态变化
2. 发送状态事件
3. 等待服务器确认
4. 更新界面显示
5. 处理其他用户状态

## 错误处理机制

### 1. 连接错误
- 自动重连机制
- 错误状态显示
- 重连次数限制

### 2. 媒体加载错误
- 显示错误占位图
- 错误信息提示
- 重试机制

### 3. 消息发送错误
- 发送状态提示
- 重发机制
- 错误提示

## 性能优化

### 1. 消息列表
- 虚拟滚动
- 消息缓存
- DOM 复用

### 2. 媒体处理
- 懒加载
- 预加载
- 压缩优化

### 3. 状态更新
- 防抖处理
- 批量更新
- 状态缓存 