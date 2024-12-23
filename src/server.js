const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 使用绝对路径
        const uploadPath = path.join(__dirname, '../public/uploads');
        // 确保目录存在
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

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 文件上传路由
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有文件被上传' });
        }

        // 构建相对URL路径
        const fileUrl = `/uploads/${path.basename(req.file.path)}`;
        
        // 返回文件信息
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

// 消息存储
const messages = new Map();

// 用户状态管理
const users = {
    GG: {
        id: 'GG',
        avatar: '/images/GG.png',
        online: false,
        status: 'offline',
        socketId: null,
        unreadMessages: new Set() // 未读消息ID集合
    },
    MM: {
        id: 'MM',
        avatar: '/images/MM.png',
        online: false,
        status: 'offline',
        socketId: null,
        unreadMessages: new Set() // 未读消息ID集合
    }
};

// 活跃连接和状态管理
const activeConnections = new Map();
const typingUsers = new Map();

// 广播用户状态更新
function broadcastUserStatus() {
    io.emit('userStatusUpdate', {
        users: Object.values(users).map(user => ({
            id: user.id,
            status: user.status
        }))
    });
}

// 处理打字状态
function handleTypingStatus(socket, userId, isTyping) {
    if (!userId || !users[userId]) return;
    
    if (isTyping) {
        typingUsers.set(userId, Date.now());
    } else {
        typingUsers.delete(userId);
    }
    
    // 广播给其他用户
    socket.broadcast.emit('userTyping', {
        userId: userId,
        isTyping: isTyping
    });
}

io.on('connection', (socket) => {
    console.log('用户连接成功:', socket.id);
    
    // 用户登录处理
    socket.on('login', (userId) => {
        console.log('用户登录:', userId, socket.id);
        
        if (users[userId]) {
            // 如果用户已经在其他地方登录，先处理之前的连接
            if (users[userId].socketId && users[userId].socketId !== socket.id) {
                const oldSocket = io.sockets.sockets.get(users[userId].socketId);
                if (oldSocket) {
                    oldSocket.disconnect();
                }
            }
            
            // 更新用户状态
            users[userId].online = true;
            users[userId].status = 'online';
            users[userId].socketId = socket.id;
            activeConnections.set(socket.id, userId);
            
            // 发送登录成功响应
            socket.emit('loginSuccess', {
                user: users[userId],
                onlineUsers: Object.values(users).map(user => ({
                    id: user.id,
                    status: user.status
                }))
            });
            
            // 广播用户状态更新
            broadcastUserStatus();
        }
    });
    
    // 处理状态变化
    socket.on('statusChange', (data) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            users[userId].status = data.status;
            broadcastUserStatus();
        }
    });
    
    // 处理消息
    socket.on('message', (data) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId] && users[userId].online) {
            const messageId = uuidv4();
            const message = {
                id: messageId,
                ...data,
                user: users[userId],
                timestamp: new Date().toISOString(),
                readBy: new Set([userId]), // 发送者默认已读
                canRecall: true // 是否可以撤回
            };
            
            // 存储消息
            messages.set(messageId, message);
            
            // 为其他用户添加未读状态
            Object.keys(users).forEach(uid => {
                if (uid !== userId) {
                    users[uid].unreadMessages.add(messageId);
                }
            });
            
            // 2分钟后禁止撤回
            setTimeout(() => {
                const msg = messages.get(messageId);
                if (msg) {
                    msg.canRecall = false;
                    socket.emit('messageUpdateRecallStatus', {
                        messageId: messageId,
                        canRecall: false
                    });
                }
            }, 120000); // 2分钟
            
            // 发送消息给所有用户
            io.emit('message', {
                ...message,
                readBy: Array.from(message.readBy)
            });
        }
    });
    
    // 处理消息已读
    socket.on('messageRead', (messageId) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            const message = messages.get(messageId);
            if (message) {
                message.readBy.add(userId);
                users[userId].unreadMessages.delete(messageId);
                
                // 广播消息已读状态
                io.emit('messageReadStatus', {
                    messageId: messageId,
                    readBy: Array.from(message.readBy)
                });
            }
        }
    });
    
    // 处理消息撤回
    socket.on('recallMessage', (messageId) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            const message = messages.get(messageId);
            if (message && message.user.id === userId && message.canRecall) {
                // 标记消息为已撤回
                message.recalled = true;
                
                // 广播消息撤回
                io.emit('messageRecalled', {
                    messageId: messageId,
                    userId: userId
                });
            }
        }
    });
    
    // 处理打字状态
    socket.on('typing', (isTyping) => {
        const userId = activeConnections.get(socket.id);
        handleTypingStatus(socket, userId, isTyping);
    });
    
    // 处理断开连接
    socket.on('disconnect', () => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            // 只有当断开的是当前活跃的连接时才更新状态
            if (users[userId].socketId === socket.id) {
                users[userId].online = false;
                users[userId].status = 'offline';
                users[userId].socketId = null;
                activeConnections.delete(socket.id);
                typingUsers.delete(userId);
                
                // 广播用户状态更新
                broadcastUserStatus();
            }
        }
        console.log('用户断开连接:', socket.id);
    });
    
    // 定期检查连接状态
    socket.on('heartbeat', () => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            users[userId].lastActive = Date.now();
        }
    });
    
    // 处理媒体消息
    socket.on('mediaMessage', (data) => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId] && users[userId].online) {
            const messageId = uuidv4();
            // 确保包含所有必要的字段
            const mediaMessage = {
                id: messageId,
                type: data.type,  // 'image' 或 'video'
                url: data.url,    // 文件URL
                user: users[userId],
                timestamp: new Date().toISOString(),
                readBy: new Set([userId]), // 发送者默认已读
                canRecall: true // 是否可以撤回
            };
            
            // 存储消息
            messages.set(messageId, mediaMessage);
            
            // 为其他用户添加未读状态
            Object.keys(users).forEach(uid => {
                if (uid !== userId) {
                    users[uid].unreadMessages.add(messageId);
                }
            });
            
            // 2分钟后禁止撤回
            setTimeout(() => {
                const msg = messages.get(messageId);
                if (msg) {
                    msg.canRecall = false;
                    socket.emit('messageUpdateRecallStatus', {
                        messageId: messageId,
                        canRecall: false
                    });
                }
            }, 120000); // 2分钟
            
            // 广播媒体消息给所有用户
            io.emit('message', {
                ...mediaMessage,
                readBy: Array.from(mediaMessage.readBy)
            });
            
            console.log('发送媒体消息:', {
                type: data.type,
                url: data.url,
                userId: userId
            });
        }
    });
    
    // 获取未读消息数量
    socket.on('getUnreadCount', () => {
        const userId = activeConnections.get(socket.id);
        if (userId && users[userId]) {
            socket.emit('unreadCount', {
                count: users[userId].unreadMessages.size
            });
        }
    });
});

// 定期清理断开的连接
setInterval(() => {
    const now = Date.now();
    Object.values(users).forEach(user => {
        if (user.online && user.lastActive && now - user.lastActive > 30000) {
            user.online = false;
            user.socketId = null;
            if (user.socketId) {
                activeConnections.delete(user.socketId);
            }
        }
    });
    broadcastUserStatus();
}, 30000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 