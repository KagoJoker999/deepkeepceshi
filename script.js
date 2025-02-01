let messages = [];

// 状态更新函数
function updateStatus(type, status, message = '') {
    const apiStatus = document.getElementById('apiStatus');
    const modelStatus = document.getElementById('modelStatus');
    const errorMessage = document.getElementById('errorMessage');

    if (type === 'api') {
        apiStatus.textContent = status;
        apiStatus.className = 'status-value ' + (status === '已连接' ? 'connected' : status === '测试中' ? 'testing' : 'disconnected');
    } else if (type === 'model') {
        modelStatus.textContent = status;
        modelStatus.className = 'status-value ' + (status === '可用' ? 'connected' : status === '测试中' ? 'testing' : 'disconnected');
    }

    if (message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none';
    }
}

// 测试API连接
async function testConnection() {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        updateStatus('api', '未连接', '请输入API Key');
        return;
    }

    updateStatus('api', '测试中');
    updateStatus('model', '测试中');

    try {
        // 测试简单问题
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-reasoner",
                messages: [{
                    role: "user",
                    content: "Hello, this is a test message."
                }],
                max_tokens: 100
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || '请求失败');
        }

        // 检查响应中是否包含reasoning_content
        if (data.choices && data.choices[0].message.reasoning_content) {
            updateStatus('api', '已连接');
            updateStatus('model', '可用');
            localStorage.setItem('deepseekApiKey', apiKey);
        } else {
            updateStatus('api', '已连接');
            updateStatus('model', '不可用', '模型响应格式不正确，可能不支持推理功能');
        }

    } catch (error) {
        updateStatus('api', '连接失败');
        updateStatus('model', '不可用', `错误：${error.message}`);
    }
}

// 页面加载时从localStorage获取API Key
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('deepseekApiKey');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
        testConnection(); // 自动测试保存的API Key
    }
});

// 添加测试按钮事件监听
document.getElementById('testConnection').addEventListener('click', testConnection);

// 发送消息相关代码
document.getElementById('sendButton').addEventListener('click', sendMessage);
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        updateStatus('api', '未连接', '请输入API Key');
        return;
    }

    const userInput = document.getElementById('userInput');
    const userMessage = userInput.value.trim();
    
    if (!userMessage) return;

    // 添加用户消息到聊天界面
    appendMessage('user', userMessage);
    userInput.value = '';

    // 添加消息到messages数组
    messages.push({
        role: "user",
        content: userMessage
    });

    try {
        updateStatus('api', '请求中');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-reasoner",
                messages: messages,
                max_tokens: 4000
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || '请求失败');
        }

        const reasoningContent = data.choices[0].message.reasoning_content;
        const content = data.choices[0].message.content;

        // 显示推理过程
        document.getElementById('reasoningContent').textContent = reasoningContent;

        // 添加助手回复到聊天界面
        appendMessage('assistant', content);

        // 更新messages数组
        messages.push({
            role: "assistant",
            content: content
        });

        updateStatus('api', '已连接');
        updateStatus('model', '可用');

    } catch (error) {
        updateStatus('api', '请求失败', `错误：${error.message}`);
    }
}

function appendMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
} 