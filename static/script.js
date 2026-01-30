document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const systemInput = document.getElementById('systemMessage');
    const humanInput = document.getElementById('humanMessage');
    const systemCharCount = document.getElementById('systemCharCount');
    const humanCharCount = document.getElementById('humanCharCount');
    const sendButton = document.getElementById('sendButton');
    const responseContent = document.getElementById('responseContent');

    // Auto-resize function
    function autoResize(element) {
        element.style.height = 'auto'; // Reset height
        element.style.height = element.scrollHeight + 'px'; // Set to scroll height
    }

    // Update character counts and auto-resize
    function updateCharCount(input, counter) {
        const count = input.value.length;
        counter.textContent = `${count} 字符`;
        autoResize(input);
    }

    systemInput.addEventListener('input', () => updateCharCount(systemInput, systemCharCount));
    humanInput.addEventListener('input', () => updateCharCount(humanInput, humanCharCount));

    // Initialize counts and size
    updateCharCount(systemInput, systemCharCount);
    updateCharCount(humanInput, humanCharCount);

    // Initial simple Markdown parser (very basic, can be improved or replaced with a library)
    function parseMarkdown(text) {
        if (!text) return '';
        
        // Escape HTML
        let html = text.replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;");
                       
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Newlines to breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    // Handle Send Button Click
    sendButton.addEventListener('click', async () => {
        const systemMessage = systemInput.value.trim();
        const humanMessage = humanInput.value.trim();

        if (!humanMessage) {
            alert('请输入用户消息！');
            humanInput.focus();
            return;
        }

        // Show loading state
        sendButton.classList.add('loading');
        sendButton.querySelector('span').textContent = '发送中...';
        
        // Show thinking indicator in response area
        responseContent.style.opacity = '1';
        responseContent.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <p style="color: var(--text-light); font-size: 0.9em;">AI 正在思考中...</p>
        `;
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    system_message: systemMessage,
                    human_message: humanMessage
                })
            });

            const data = await response.json();

            if (data.success) {
                // Animate response appear
                responseContent.style.opacity = '0';
                responseContent.innerHTML = parseMarkdown(data.response);
                
                // Fade in animation
                requestAnimationFrame(() => {
                    responseContent.style.transition = 'opacity 0.5s ease';
                    responseContent.style.opacity = '1';
                });
            } else {
                responseContent.innerHTML = `<div style="color: #ef4444; padding: 1rem; border-radius: 0.5rem; background: rgba(239, 68, 68, 0.1);">
                    <strong>出错啦:</strong> ${data.error || '未知错误'}
                </div>`;
            }
        } catch (error) {
            console.error('Error:', error);
            responseContent.innerHTML = `<div style="color: #ef4444; padding: 1rem; border-radius: 0.5rem; background: rgba(239, 68, 68, 0.1);">
                <strong>网络错误:</strong> 无法连接到服务器。
            </div>`;
        } finally {
            // Restore button state
            sendButton.classList.remove('loading');
            sendButton.querySelector('span').textContent = '发送消息';
            
            // Scroll to response
            document.getElementById('responseCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Allow Ctrl+Enter to send
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Fetch configuration
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            const modelNameDisplay = document.getElementById('modelNameDisplay');
            if (modelNameDisplay && data.model_name) {
                modelNameDisplay.textContent = data.model_name;
            }
        })
        .catch(err => console.error('Failed to load config:', err));
});
