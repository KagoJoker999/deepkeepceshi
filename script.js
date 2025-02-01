let messages = [];

document.getElementById('sendButton').addEventListener('click', sendMessage);
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 页面加载时从localStorage获取API Key
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('deepseekApiKey');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
    }
});

async function sendMessage() {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }

    // 保存API Key到localStorage
    localStorage.setItem('deepseekApiKey', apiKey);

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

    } catch (error) {
        alert('错误：' + error.message);
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