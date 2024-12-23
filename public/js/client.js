const socket = io();
let currentUser = null;

// DOM 元素
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');

// 状态管理
let isBusy = false;
let isTyping = false;

// 上一条消息的时间戳
let lastMessageTime = null;

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (!currentUser) return;
    
    isBusy = document.hidden;
    socket.emit('statusChange', { status: isBusy ? 'busy' : 'online' });
});

function updateUserInterface(userData) {
    const { user, onlineUsers } = userData;
    currentUser = user;
    
    // 更新界面显示
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    messageInput.focus();
    
    // 更新所有用户状态
    updateAllUsersStatus(onlineUsers);
}

function updateAllUsersStatus(users) {
    users.forEach(user => {
        updateUserStatus(user.id, user.online);
    });
}

function updateUserStatus(userId, status) {
    const statusDot = document.getElementById(`${userId.toLowerCase()}Status`);
    const statusText = document.getElementById(`${userId.toLowerCase()}StatusText`);
    const avatar = document.getElementById(`${userId.toLowerCase()}Avatar`);
    
    if (statusDot) {
        statusDot.className = `status-dot ${status}`;
    }
    if (statusText) {
        let text = '离线';
        switch (status) {
            case 'online':
                text = '在线';
                break;
            case 'busy':
                text = '忙';
                break;
            case 'offline':
                text = '离线';
                break;
        }
        statusText.textContent = text;
    }
    if (avatar) {
        avatar.className = `avatar-img ${status !== 'offline' ? 'active' : ''}`;
    }
}

// 登录处理
function login(userId) {
    socket.emit('login', userId);
}

// 消息处理
function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
        socket.emit('message', {
            text,
            type: 'text'
        });
        messageInput.value = '';
        messageInput.focus();
        
        // 发送消息后清除输入状态
        if (isTyping) {
            socket.emit('typing', false);
            isTyping = false;
            clearTimeout(typingTimeout);
        }
    }
}

// 打字状态处理
let typingTimeout;
let lastTypingTime = 0;
const TYPING_TIMER_LENGTH = 3000; // 3秒后停止显示正在输入状态

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

// Socket 事件监听
socket.on('loginSuccess', updateUserInterface);

socket.on('userStatusUpdate', (data) => {
    data.users.forEach(user => {
        updateUserStatus(user.id, user.status);
    });
});

socket.on('message', (data) => {
    const messageElement = createMessageElement(data);
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});

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

// 创建消息元素
function createMessageElement(data) {
    const { id, text, user, timestamp, type, url, readBy, recalled, canRecall } = data;
    const messageTime = new Date(timestamp);
    const messageDiv = document.createElement('div');
    const isSent = user.id === currentUser.id;
    
    // 检查是否需要添加时间分割线
    if (shouldShowTimestamp(messageTime)) {
        const timeDiv = createTimeDivider(messageTime);
        messages.appendChild(timeDiv);
    }
    
    // 更新最后一条消息的时间戳
    lastMessageTime = messageTime;
    
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = id;
    messageDiv.dataset.messageType = type;
    messageDiv.dataset.messageText = type === 'text' ? text : '';
    
    if (recalled) {
        messageDiv.classList.add('recalled');
        const recalledDiv = document.createElement('div');
        recalledDiv.className = 'message-recalled';
        recalledDiv.textContent = '消息已撤回';
        messageDiv.appendChild(recalledDiv);
        return messageDiv;
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 添加消息内容
    if (type === 'text') {
        contentDiv.textContent = text;
    } else if (type === 'image' || type === 'video') {
        console.log('创建媒体消息元素:', { type, url });
        
        const mediaPreview = document.createElement('div');
        mediaPreview.className = 'media-preview';
        
        if (type === 'image') {
            const img = document.createElement('img');
            img.src = url;
            img.alt = '图片';
            img.loading = 'lazy';
            
            // 添加加载状态类
            mediaPreview.classList.add('loading');
            
            img.onload = () => {
                console.log('图片加载成功:', url);
                mediaPreview.classList.remove('loading');
                messages.scrollTop = messages.scrollHeight;
            };
            
            img.onerror = () => {
                console.error('图片加载失败:', url);
                mediaPreview.classList.remove('loading');
                mediaPreview.classList.add('error');
                img.src = '/images/error.png'; // 显示错误占位图
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
            
            // 添加加载状态类
            mediaPreview.classList.add('loading');
            
            video.onloadedmetadata = () => {
                console.log('视频元数据加载成功:', url);
                mediaPreview.classList.remove('loading');
            };
            
            video.onerror = () => {
                console.error('视频加载失败:', url);
                mediaPreview.classList.remove('loading');
                mediaPreview.classList.add('error');
                // 显示错误信息
                const errorText = document.createElement('div');
                errorText.className = 'error-text';
                errorText.textContent = '视频加载失败';
                mediaPreview.appendChild(errorText);
            };
            
            mediaPreview.appendChild(video);
            mediaPreview.onclick = () => {
                if (!mediaPreview.classList.contains('error')) {
                    showMediaPreview(url, 'video');
                }
            };
        }
        
        contentDiv.appendChild(mediaPreview);
    }
    
    // 添加已读状态
    const readStatusDiv = document.createElement('div');
    readStatusDiv.className = 'read-status';
    readStatusDiv.textContent = readBy.includes(getOtherUserId()) ? '已读' : '未读';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(timestamp);
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(readStatusDiv);
    messageDiv.appendChild(timeSpan);
    
    // 如果是接收到的消息，标记为已读
    if (!isSent && !readBy.includes(currentUser.id)) {
        socket.emit('messageRead', id);
    }
    
    // 添加长按和右键菜单事件
    let pressTimer;
    let isLongPress = false;
    
    // 长按事件（移动端）
    messageDiv.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            isLongPress = true;
            showMessageMenu(e, messageDiv, isSent, canRecall);
        }, 500);
    });
    
    messageDiv.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        setTimeout(() => {
            isLongPress = false;
        }, 100);
    });
    
    messageDiv.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });
    
    // 右键菜单（电脑端）
    messageDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMessageMenu(e, messageDiv, isSent, canRecall);
    });
    
    return messageDiv;
}

// 显示消息菜单
function showMessageMenu(event, messageDiv, isSent, canRecall) {
    // 移除现有的菜单
    const existingMenu = document.querySelector('.message-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'message-menu';
    
    const menuItems = [];
    
    // 复制选项（仅文本消息）
    if (messageDiv.dataset.messageType === 'text') {
        menuItems.push({
            text: '复制',
            icon: '<i class="fas fa-copy"></i>',
            onClick: () => {
                const text = messageDiv.dataset.messageText;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('已复制');
                });
            }
        });
    }
    
    // 撤回选项（仅发送者且可撤回）
    if (isSent && canRecall) {
        menuItems.push({
            text: '撤回',
            icon: '<i class="fas fa-undo"></i>',
            onClick: () => {
                if (confirm('确定要撤回这条消息吗？')) {
                    socket.emit('recallMessage', messageDiv.dataset.messageId);
                }
            }
        });
    }
    
    // 创建菜单项
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `${item.icon}<span>${item.text}</span>`;
        menuItem.onclick = () => {
            item.onClick();
            menu.remove();
        };
        menu.appendChild(menuItem);
    });
    
    // 设置菜单位置
    if (event.touches) { // 移动端
        const touch = event.touches[0];
        menu.style.left = `${touch.clientX}px`;
        menu.style.top = `${touch.clientY}px`;
    } else { // 电脑端
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
    }
    
    document.body.appendChild(menu);
    
    // 确保菜单不超出屏幕边界
    const menuRect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (menuRect.right > windowWidth) {
        menu.style.left = `${windowWidth - menuRect.width - 5}px`;
    }
    if (menuRect.bottom > windowHeight) {
        menu.style.top = `${windowHeight - menuRect.height - 5}px`;
    }
    
    // 点击其他区域关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('touchstart', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
        document.addEventListener('touchstart', closeMenu);
    }, 0);
}

// 显示提示信息
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 1500);
    }, 0);
}

// 获取对方的用户ID
function getOtherUserId() {
    return currentUser.id === 'GG' ? 'MM' : 'GG';
}

// Socket 事件监听
socket.on('messageReadStatus', (data) => {
    const { messageId, readBy } = data;
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const readStatusDiv = messageElement.querySelector('.read-status');
        if (readStatusDiv) {
            readStatusDiv.textContent = readBy.includes(getOtherUserId()) ? '已读' : '未读';
        }
    }
});

socket.on('messageRecalled', (data) => {
    const { messageId } = data;
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.classList.add('recalled');
        messageElement.innerHTML = '<div class="message-recalled">消息已撤回</div>';
    }
});

socket.on('messageUpdateRecallStatus', (data) => {
    const { messageId, canRecall } = data;
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const recallButton = messageElement.querySelector('.recall-button');
        if (recallButton && !canRecall) {
            recallButton.remove();
        }
    }
});

// 显示媒体预览
function showMediaPreview(url, type) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'media-modal';
    
    // 创建关闭按钮
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // 创建缩放控制按钮
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    
    const zoomInBtn = document.createElement('div');
    zoomInBtn.className = 'zoom-btn';
    zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
    
    const zoomOutBtn = document.createElement('div');
    zoomOutBtn.className = 'zoom-btn';
    zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
    
    const resetZoomBtn = document.createElement('div');
    resetZoomBtn.className = 'zoom-btn';
    resetZoomBtn.innerHTML = '<i class="fas fa-undo"></i>';
    
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(resetZoomBtn);
    
    // 创建媒体元素
    let mediaElement;
    let currentScale = 1;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    
    if (type === 'image') {
        mediaElement = document.createElement('img');
        mediaElement.src = url;
        mediaElement.alt = '预览图片';
        mediaElement.className = 'zoomable';
        
        // 缩放功能
        zoomInBtn.onclick = (e) => {
            e.stopPropagation();
            currentScale = Math.min(currentScale * 1.2, 5);
            updateTransform();
        };
        
        zoomOutBtn.onclick = (e) => {
            e.stopPropagation();
            currentScale = Math.max(currentScale / 1.2, 0.5);
            updateTransform();
        };
        
        resetZoomBtn.onclick = (e) => {
            e.stopPropagation();
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
        };
        
        // 鼠标滚轮缩放
        mediaElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY;
            if (delta > 0) {
                currentScale = Math.max(currentScale / 1.1, 0.5);
            } else {
                currentScale = Math.min(currentScale * 1.1, 5);
            }
            updateTransform();
        });
        
        // 拖动功能
        mediaElement.addEventListener('mousedown', (e) => {
            if (currentScale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                mediaElement.style.cursor = 'grabbing';
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateTransform();
            }
        });
        
        window.addEventListener('mouseup', () => {
            isDragging = false;
            mediaElement.style.cursor = 'grab';
        });
        
        // 触摸设备支持
        let initialDistance = 0;
        let initialScale = 1;
        
        mediaElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = getTouchDistance(e.touches);
                initialScale = currentScale;
            } else if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }
        });
        
        mediaElement.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const distance = getTouchDistance(e.touches);
                currentScale = Math.min(Math.max(initialScale * (distance / initialDistance), 0.5), 5);
                updateTransform();
            } else if (e.touches.length === 1 && isDragging) {
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                updateTransform();
            }
        });
        
        mediaElement.addEventListener('touchend', () => {
            isDragging = false;
            initialDistance = 0;
        });
        
    } else if (type === 'video') {
        mediaElement = document.createElement('video');
        mediaElement.src = url;
        mediaElement.controls = true;
        mediaElement.autoplay = true;
    }
    
    function updateTransform() {
        mediaElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }
    
    function getTouchDistance(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }
    
    // 添加到模态框
    modal.appendChild(mediaElement);
    if (type === 'image') {
        modal.appendChild(zoomControls);
    }
    modal.appendChild(closeBtn);
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 显示动画
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // 关闭功能
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
            // 清理事件监听
            window.removeEventListener('mousemove', null);
            window.removeEventListener('mouseup', null);
        }, 300);
    };
    
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeModal();
    };
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// 文件上传处理
async function handleFileUpload(file, type) {
    if (!file || !currentUser) return;
    
    // 检查文件大小
    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert(type === 'video' ? '视频大小不能超过100MB' : '图片大小不能超过10MB');
        return;
    }
    
    // 检查文件类型
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm'];
    
    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
        alert('只支持 JPG、PNG、GIF 格式的图片');
        return;
    }
    
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
        alert('��支持 MP4、WebM 格式的视频');
        return;
    }
    
    try {
        // 创建预览
        const previewUrl = await createFilePreview(file);
        
        // 显示上传进度和预览
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="upload-preview">
                    <img src="${previewUrl}" alt="预览" class="preview-image">
                    <div class="upload-status">
                        <div class="progress-text">准备上传...</div>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="upload-speed"></div>
                        <div class="upload-remaining"></div>
                    </div>
                </div>
            </div>
        `;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
        
        const progressFill = messageDiv.querySelector('.progress-fill');
        const progressText = messageDiv.querySelector('.progress-text');
        const speedText = messageDiv.querySelector('.upload-speed');
        const remainingText = messageDiv.querySelector('.upload-remaining');
        
        const formData = new FormData();
        formData.append('file', file);
        
        // 使用 XMLHttpRequest 来获取上传进度
        const xhr = new XMLHttpRequest();
        let startTime = Date.now();
        let lastLoaded = 0;
        
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                progressFill.style.width = percent + '%';
                
                // 计算上传速度
                const currentTime = Date.now();
                const timeElapsed = (currentTime - startTime) / 1000; // 秒
                const loadedDiff = event.loaded - lastLoaded;
                const speed = loadedDiff / timeElapsed; // bytes per second
                
                // 更新显示
                speedText.textContent = `${formatSpeed(speed)}`;
                
                // 估算剩余时间
                const remaining = (event.total - event.loaded) / speed;
                remainingText.textContent = `剩余时间: ${formatTime(remaining)}`;
                
                // 更新进度文本
                progressText.textContent = `上传中 ${Math.round(percent)}%`;
                
                // 重置计数器
                startTime = currentTime;
                lastLoaded = event.loaded;
            }
        });
        
        // 处理上传完成
        xhr.addEventListener('load', async () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log('文件上传成功:', data);
                
                progressText.textContent = '处理中...';
                
                // 预加载媒体文��
                if (data.type === 'image') {
                    const img = new Image();
                    img.src = data.url;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                }
                
                // 发送媒体消息
                socket.emit('mediaMessage', {
                    type: data.type,
                    url: data.url
                });
                
                // 移除进度显示
                messages.removeChild(messageDiv);
            } else {
                throw new Error('上传失败');
            }
        });
        
        // 处理错误
        xhr.addEventListener('error', () => {
            progressText.textContent = '上传失败';
            setTimeout(() => {
                messages.removeChild(messageDiv);
            }, 3000);
        });
        
        // 开始上传
        xhr.open('POST', '/upload');
        xhr.send(formData);
        
    } catch (error) {
        console.error('文件上传错误:', error);
        alert('上传失败，请重试');
    }
}

// 创建文件预览
async function createFilePreview(file) {
    return new Promise((resolve) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.playsInline = true;
            video.muted = true;
            
            video.onloadedmetadata = () => {
                // 创建 canvas 来生成视频缩略图
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // 在 canvas 上绘制视频帧
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 转换为 base64
                resolve(canvas.toDataURL('image/jpeg'));
            };
            
            video.src = URL.createObjectURL(file);
        }
    });
}

// 格式化速度显示
function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond >= 1024 * 1024) {
        return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    } else if (bytesPerSecond >= 1024) {
        return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
        return `${Math.round(bytesPerSecond)} B/s`;
    }
}

// 格式化时间显示
function formatTime(seconds) {
    if (seconds < 60) {
        return `${Math.round(seconds)}秒`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}分${remainingSeconds}秒`;
    }
}

// 图片上传处理
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        await handleFileUpload(file, 'image');
    }
    event.target.value = ''; // 清除选择的文件
}

// 视频上传处理
async function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
        await handleFileUpload(file, 'video');
    }
    event.target.value = ''; // 清除选择的文件
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 事件监听
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener('input', handleTyping);

// 检测窗口大小变化，调整界面
function handleResize() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

window.addEventListener('resize', handleResize);
handleResize();

// 心跳检测
setInterval(() => {
    if (currentUser) {
        socket.emit('heartbeat');
    }
}, 15000);

// 事件监听
document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
document.getElementById('videoUpload').addEventListener('change', handleVideoUpload);

// 判断是否需要显示时间戳
function shouldShowTimestamp(currentTime) {
    if (!lastMessageTime) return true;
    
    // 计算时间差（分钟）
    const timeDiff = Math.abs(currentTime - lastMessageTime) / (1000 * 60);
    return timeDiff >= 15; // 只有间隔超过15分钟才显示分割线
}

// 创建时间分割线
function createTimeDivider(time) {
    const timeDiv = document.createElement('div');
    timeDiv.className = 'time-divider';
    timeDiv.textContent = formatTimeDivider(time);
    return timeDiv;
}

// 格式化时间分割线文本
function formatTimeDivider(time) {
    const month = (time.getMonth() + 1).toString().padStart(2, '0');
    const day = time.getDate().toString().padStart(2, '0');
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
}

// 格式化消息时间
function formatTime(timestamp) {
    const time = new Date(timestamp);
    const month = (time.getMonth() + 1).toString().padStart(2, '0');
    const day = time.getDate().toString().padStart(2, '0');
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
} 