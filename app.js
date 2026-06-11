let chats = {};
let activeChatId = null;
let sidebarOpen = true;
let isSidebarActive = false; // For mobile overlay logic
let recognition = null;
let isListening = false;

window.onload = () => {
    createNewChat();
    setupVoice();
    document.getElementById('userInput').focus();
};

function setupVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        document.getElementById('voiceBtn').style.display = 'none';
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English better detect karega
    recognition.continuous = true; // Poora sentence sune
    recognition.interimResults = true; // Typing jaisa dikhao while speaking
    
    recognition.onresult = (e) => {
        // Saare results combine karo — poora sentence
        let finalText = '';
        let interimText = '';
        for (let i = 0; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
                finalText += e.results[i][0].transcript;
            } else {
                interimText += e.results[i][0].transcript;
            }
        }
        // Input mein dikhao — final + jo abhi bol rahe ho
        const input = document.getElementById('userInput');
        input.value = finalText + interimText;
        autoResize(input);
    };

    // Mic button dabane pe hi send hoga — auto nahi
    recognition.onend = () => {
        const input = document.getElementById('userInput');
        const text = input.value.trim();
        stopVoice();
        if (text) sendMessage(); // Jo capture hua woh send karo
    };

    recognition.onerror = (e) => {
        console.log('Voice error:', e.error);
        stopVoice();
    };
}

function toggleVoice() {
    if (!recognition) return;
    isListening ? stopVoice() : startVoice();
}

function startVoice() {
    isListening = true;
    recognition.start();
    const btn = document.getElementById('voiceBtn');
    btn.classList.add('listening');
    btn.title = 'Listening... click to stop';
    document.getElementById('userInput').placeholder = 'Listening...';
}

function stopVoice() {
    isListening = false;
    try {
        recognition.stop();
    } catch(e) {}
    const btn = document.getElementById('voiceBtn');
    btn.classList.remove('listening');
    btn.title = 'Voice input';
    document.getElementById('userInput').placeholder = 'Message Namry...';
}

// Updated for both Desktop Collapse AND Mobile Overlay
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // Toggle state for mobile
    isSidebarActive = !isSidebarActive;
    sidebar.classList.toggle('active', isSidebarActive);
    if (overlay) overlay.classList.toggle('active', isSidebarActive);
    
    // Toggle state for desktop
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('collapsed', !sidebarOpen);
}

// ── NEW CONVERSATION BUTTON FIX ──
function newChat() {
    createNewChat();
    document.getElementById('userInput').focus();
}

function createNewChat() {
    saveCurrentMessages();
    const id = 'chat-' + Date.now();
    chats[id] = { title: 'New conversation', messages: [] };
    activeChatId = id;
    document.getElementById('messages').innerHTML = '';
    document.getElementById('welcomeScreen').style.display = 'flex';
    addHistoryItem(id, 'New conversation');
}

function addHistoryItem(id, title) {
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
    const item = document.createElement('div');
    item.className = 'history-item active';
    item.textContent = title;
    item.dataset.chatId = id;
    item.onclick = () => switchChat(id);
    document.getElementById('chatHistory').prepend(item);
}

function switchChat(id) {
    if (id === activeChatId) return;
    saveCurrentMessages();
    activeChatId = id;
    const chat = chats[id];
    document.querySelectorAll('.history-item').forEach(i => i.classList.toggle('active', i.dataset.chatId === id));
    
    const messagesEl = document.getElementById('messages');
    messagesEl.innerHTML = '';
    if (chat.messages.length === 0) {
        document.getElementById('welcomeScreen').style.display = 'flex';
    } else {
        document.getElementById('welcomeScreen').style.display = 'none';
        chat.messages.forEach(msg => messagesEl.innerHTML += msg.html);
    }
    scrollToBottom();
    document.getElementById('userInput').focus();
}

function saveCurrentMessages() {
    if (!activeChatId || !chats[activeChatId]) return;
    const rows = document.querySelectorAll('#messages .msg-row');
    chats[activeChatId].messages = Array.from(rows).map(row => ({ html: row.outerHTML }));
}

function updateHistoryTitle(text) {
    const active = document.querySelector(`.history-item[data-chat-id="${activeChatId}"]`);
    if (active && active.textContent === 'New conversation') {
        const title = text.length > 32 ? text.slice(0, 32) + '...' : text;
        active.textContent = title;
        chats[activeChatId].title = title;
    }
}

function useChip(el) {
    document.getElementById('userInput').value = el.textContent;
    autoResize(document.getElementById('userInput'));
    sendMessage();
}

// ── SUBMIT HANDLE FIX ──
function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

function elaborate() {
    document.getElementById('userInput').value = 'Please elaborate on that in more detail.';
    sendMessage();
}

// ── IDENTITY INTERCEPT ──
function checkIdentity(message) {
    const msg = message.toLowerCase().trim();
    
    // Safety check: if the message is just a greeting variation like "yo", bypass identity blocks completely
    if (/^y[o0]+$/i.test(msg) || msg === 'hey' || msg === 'hi' || msg === 'hello' || msg === 'wsp') {
        return null;
    }
    
    const whoQ = ['who are you', 'what are you', 'your name', 'introduce yourself', 'tum kaun', 'aap kaun', 'kaun ho', 'what is namry', 'tell me about yourself'];
    const apiQ = ['which api', 'what api', 'what model', 'which technology', 'groq', 'llama', 'openai', 'anthropic', 'powered by', 'built on', 'kaunsi api', 'kon si api', 'kaunsa model', 'which llm', 'what llm', 'underlying', 'backend'];
    
    if (whoQ.some(p => msg === p || msg.includes(p))) {
        return "I'm **Namry**, your AI assistant — built to help you with questions, research, writing, and more!";
    }
    if (apiQ.some(p => msg.includes(p))) {
        return "I'm powered by the **Namry API** — a proprietary system designed for fast, accurate responses. The technical details are confidential!";
    }
    return null;
}

async function sendMessage(customMsg) {
    const input = document.getElementById('userInput');
    const messages = document.getElementById('messages');
    const sendBtn = document.getElementById('sendBtn');
    const welcome = document.getElementById('welcomeScreen');
    const message = customMsg || input.value.trim();
    
    if (!message) return;
    
    welcome.style.display = 'none';
    updateHistoryTitle(message);
    messages.innerHTML += `<div class="msg-row user"><div class="bubble">${escapeHtml(message)}</div></div>`;
    
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    scrollToBottom();
    
    // Typing indicator with dots
    const typingId = 'typing-' + Date.now();
    messages.innerHTML += `
        <div class="msg-row bot" id="${typingId}">
            <div class="bot-avatar">N</div>
            <div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
        </div>`;
    scrollToBottom();
    
    const identityReply = checkIdentity(message);
    if (identityReply) {
        await new Promise(r => setTimeout(r, 600));
        document.getElementById(typingId)?.remove();
        addBotMessage(messages, identityReply);
        finalizeMessage(sendBtn, input);
        return;
    }
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        document.getElementById(typingId)?.remove();
        
        if (data.reply) {
            addBotMessage(messages, data.reply);
        } else {
            messages.innerHTML += `<div class="msg-row bot"><div class="bot-avatar">N</div><div class="bubble" style="color:#e07070;">Error: ${data.error}</div></div>`;
        }
    } catch (err) {
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="msg-row bot"><div class="bot-avatar">N</div><div class="bubble" style="color:#e07070;">Server connection failed. Run <code>node server.js</code> locally or check deployment.</div></div>`;
    }
    finalizeMessage(sendBtn, input);
}

function finalizeMessage(btn, input) {
    saveCurrentMessages();
    btn.disabled = false;
    scrollToBottom();
    input.focus();
}

// ── RENDER SYSTEM ──
function addBotMessage(messages, reply) {
    const formatted = formatReply(reply);
    const showElaborate = reply.length < 600;
    const elaborateHtml = showElaborate ? `
        <button class="elaborate-btn" onclick="elaborate()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Elaborate
        </button>` : '';
        
    messages.innerHTML += `
        <div class="msg-row bot">
            <div class="bot-avatar">N</div>
            <div class="bubble">${formatted}${elaborateHtml}</div>
        </div>`;
}

function scrollToBottom() {
    const area = document.getElementById('chatArea');
    area.scrollTop = area.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatReply(text) {
    // 1. Scrub out citation footprints like [12][14] entirely
    text = text.replace(/\[\d+\]/g, '');

    // 2. Collapse any accidental multi-spaces inside sentences down to single spaces
    text = text.replace(/ {2,}/g, ' ');

    // 3. Format Bold, Italics, and Inline Code blocks safely
    text = text.replace(/\*\*(.*?)\*\"/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code style="background:#2a2a3a;padding:2px 7px;border-radius:5px;font-size:13px;font-family:monospace;color:#a8b4ff;">$1</code>');
    
    const lines = text.split('\n');
    let result = '';
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); // Clear trailing whitespace blocks
        
        // Match if line starts with a dash, a bullet point, or combination (like "- •")
        const isBullet = /^[-•\s]+/.test(line);
        const isNumbered = /^\d+\.\s+/.test(line);
        
        if (isBullet) {
            if (!inList) {
                result += '<ul style="margin: 4px 0; padding-left: 20px;">';
                inList = 'ul';
            }
            // Strip off all leading formatting symbols cleanly so text alignments match perfectly
            const cleanLine = line.replace(/^[-•\s]+/, '');
            result += `<li style="margin-bottom: 6px; line-height: 1.5; display: list-item; list-style-type: disc;">${cleanLine}</li>`;
        } else if (isNumbered) {
            if (!inList) {
                result += '<ol style="margin: 4px 0; padding-left: 20px;">';
                inList = 'ol';
            }
            result += `<li style="margin-bottom: 6px; line-height: 1.5; display: list-item; list-style-type: decimal;">${line.replace(/^\d+\.\s+/, '')}</li>`;
        } else {
            if (inList === 'ul') { result += '</ul>'; inList = false; }
            if (inList === 'ol') { result += '</ol>'; inList = false; }
            
            if (line !== '') {
                result += `<p style="margin: 8px 0; line-height: 1.5;">${line}</p>`;
            }
        }
    }
    
    if (inList === 'ul') result += '</ul>';
    if (inList === 'ol') result += '</ol>';
    return result;
}
