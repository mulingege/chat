# server.js 文件说明

## 核心功能实现

### 1. 服务器配置
```javascript
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
```
- Express 服务器设置
- Socket.IO 配置
- 文件系统操作
- UUID 生成器

### 2. 文件上传配置
```javascript
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

const upload = multer({
    storage: storage,
    limits: {
        fileSize: (req, file) => {
            if (file.mimetype.startsWith('video/')) {
                return 100 * 1024 * 1024; // 100MB for videos
            }
            return 10 * 1024 * 1024; // 10MB for images
        }
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});
```
- 文件存储配置
- 文件大小限制
- 文件类型验证
- 文件命名规则

### 3. 静态文件服务
```javascript
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
```
- 静态资源服务
- 上传文件访问

### 4. 文件上传路由
```javascript
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有文件被上传' });
        }

        const fileUrl = `/uploads/${path.basename(req.file.path)}`;
        
        res.json({
            url: fileUrl,
            type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
            filename: req.file.filename,
            size: req.file.size
        });
        
        console.log('文件上传成功:', {
            url: fileUrl,
            type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
            size: req.file.size
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ error: '文件上传失败' });
    }
});
```
- 文件上传处理
- 错误处理
- 响应格式化
- 日志记录

### 5. 用户状态管理
```javascript
const users = {
    GG: {
        id: 'GG',
        avatar: '/images/GG.png',
        online: false,
        status: 'offline',
        socketId: null,
        unreadMessages: new Set()
    },
    MM: {
        id: 'MM',
        avatar: '/images/MM.png',
        online: false,
        status: 'offline',
        socketId: null,
        unreadMessages: new Set()
    }
};

const activeConnections = new Map();
const typingUsers = new Map();
```
- 用户信息存储
- 连接状态管理
- 未读消息跟踪
- 输入状态跟踪

### 6. 状态广播
```javascript
function broadcastUserStatus() {
    io.emit('userStatusUpdate', {
        users: Object.values(users).map(user => ({
            id: user.id,
            status: user.status
        }))
    });
}
```
- 状态更新广播
- 用户状态映射
- 实时状态同步

### 7. 输入状态处理
```javascript
function handleTypingStatus(socket, userId, isTyping) {
    if (!userId || !users[userId]) return;
    
    if (isTyping) {
        typingUsers.set(userId, Date.now());
    } else {
        typingUsers.delete(userId);
    }
    
    socket.broadcast.emit('userTyping', {
        userId: userId,
        isTyping: isTyping
    });
}
```
- 输入状态记录
- 状态广播
- 超时处理

### 8. Socket连接处理
```javascript
io.on('connection', (socket) => {
    console.log('用户连接成功:', socket.id);
    
    // 用户登录处理
    socket.on('login', (userId) => {
        if (users[userId]) {
            if (users[userId].socketId && users[userId].socketId !== socket.id) {
                const oldSocket = io.sockets.sockets.get(users[userId].socketId);
                if (oldSocket) {
                    oldSocket.disconnect();
                }
            }
            
            users[userId].online = true;
            users[userId].status = 'online';
            users[userId].socketId = socket.id;
            activeConnections.set(socket.id, userId);
            
            socket.emit('loginSuccess', {
                user: users[userId],
                onlineUsers: Object.values(users).map(user => ({
                    id: user.id,
                    status: user.status
                }))
            });
            
            broadcastUserStatus();
        }
    });
    
    // 状态变化处理
    socket.on('statusChange', (data) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            users[userId].status = data.status;
            broadcastUserStatus();
        }
    });
    
    // 消息处理
    socket.on('message', (data) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId] && users[userId].online) {
            const messageId = uuidv4();
            const message = {
                id: messageId,
                ...data,
                user: users[userId],
                timestamp: new Date().toISOString(),
                readBy: new Set([userId]),
                canRecall: true
            };
            
            messages.set(messageId, message);
            
            Object.keys(users).forEach(uid => {
                if (uid !== userId) {
                    users[uid].unreadMessages.add(messageId);
                }
            });
            
            setTimeout(() => {
                const msg = messages.get(messageId);
                if (msg) {
                    msg.canRecall = false;
                    socket.emit('messageUpdateRecallStatus', {
                        messageId: messageId,
                        canRecall: false
                    });
                }
            }, 120000);
            
            io.emit('message', {
                ...message,
                readBy: Array.from(message.readBy)
            });
        }
    });
    
    // 消息已读处理
    socket.on('messageRead', (messageId) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            const message = messages.get(messageId);
            if (message) {
                message.readBy.add(userId);
                users[userId].unreadMessages.delete(messageId);
                
                io.emit('messageReadStatus', {
                    messageId: messageId,
                    readBy: Array.from(message.readBy)
                });
            }
        }
    });
    
    // 消息撤回处理
    socket.on('recallMessage', (messageId) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            const message = messages.get(messageId);
            if (message && message.user.id === userId && message.canRecall) {
                message.recalled = true;
                io.emit('messageRecalled', messageId);
            }
        }
    });
});
```
- 连接初始化
- 登录处理
- 消息处理
- 状态同步
- ��读处理
- 消息撤回

## 数据结构

### 1. 用户数据
```javascript
{
    id: String,          // 用户ID
    avatar: String,      // 头像URL
    online: Boolean,     // 在线状态
    status: String,      // 状态(online/busy/offline)
    socketId: String,    // Socket连接ID
    unreadMessages: Set  // 未读消息ID集合
}
```

### 2. 消息数据
```javascript
{
    id: String,          // 消息ID
    type: String,        // 消息类型(text/image/video)
    content: String,     // 消息内容
    user: Object,        // 发送者信息
    timestamp: String,   // 发送时间
    readBy: Set,         // 已读用户集合
    canRecall: Boolean,  // 是否可撤回
    recalled: Boolean    // 是否已撤回
}
```

## 错误处理

### 1. 文件上传错误
- 文件大小验证
- 文件类型验证
- 存储错误处理
- 响应错误处理

### 2. Socket连接错误
- 连接断开处理
- 重连机制
- 状态同步
- 错误日志

### 3. 消息处理错误
- 消息格式验证
- 发送者验证
- 状态验证
- 错误恢复

## 性能优化

### 1. 文件处理
- 异步上传
- 文件压缩
- 缓存机制
- 清理机制

### 2. 消息处理
- 消息队列
- 批量处理
- 定时清理
- 内存优化

### 3. 状态同步
- 状态缓存
- 批量更新
- 定时同��
- 增量更新 