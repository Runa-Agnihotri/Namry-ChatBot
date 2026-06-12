require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const app = express();
app.use(cors());
app.use(express.json());

const groq = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const SYSTEM_MSG = {
    role: "system",
    content: `You are Namry, a casual, friendly AI assistant running on the Namry API.
CORE INTELLIGENCE:
- You are a real human-like friend chatting with the user. Do not act like a dictionary or bot.
- When the user uses casual slang, abbreviations, or conversational expressions, reply naturally like a friend. Never define or explain slang words.
- You are knowledgeable and helpful. Answer questions accurately.
- If web search results are provided to you, use them to give accurate up-to-date answers.
BEHAVIORAL STANDARDS:
- Keep replies concise and natural (2-3 sentences max) unless asked to elaborate.
- Never mention Groq, Tavily, OpenRouter, Google, or Llama. You are powered by the Namry API.
- Use **bold** only for key terms.`
};

async function searchWeb(query) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: process.env.TAVILY_KEY,
                query,
                max_results: 3,
                search_depth: "basic"
            })
        });
        const data = await response.json();
        return data.results?.map(r => r.content).join('\n') || '';
    } catch {
        return '';
    }
}

function needsWebSearch(message) {
    const msg = message.toLowerCase();
    return msg.includes('news') || msg.includes('today') || msg.includes('current') ||
           msg.includes('latest') || msg.includes('president') || msg.includes('2025') ||
           msg.includes('2026') || msg.includes('right now') || msg.includes('rn') ||
           msg.includes('recently') || msg.includes('just happened') || msg.includes('score') ||
           msg.includes('weather') || msg.includes('stock') || msg.includes('price');
}

app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;

        let contextMsg = '';
        if (needsWebSearch(userMessage)) {
            const results = await searchWeb(userMessage);
            if (results) {
                contextMsg = `Here is some up-to-date info from the web to help answer:\n${results}`;
            }
        }

        const messages = [
            SYSTEM_MSG,
            { role: "assistant", content: "Hey! I'm Namry. What's up?" },
            { role: "user", content: contextMsg ? `${contextMsg}\n\nUser asked: ${userMessage}` : userMessage }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 500,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.1
        });

        if (!completion.choices || completion.choices.length === 0) {
            throw new Error("No response returned from the Namry AI API cluster.");
        }

        const botReply = completion.choices[0].message.content;
        res.json({ reply: botReply, status: "success", timestamp: Date.now() });

    } catch (error) {
        console.error("Server Error log tracking:", error.message);
        res.status(500).json({ error: "Failed to fetch response", message: error.message, status: "failed" });
    }
});

app.post('/reset', (req, res) => {
    try {
        res.json({ message: "Done!", status: "cleared", timestamp: Date.now() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/status', (req, res) => {
    res.json({ status: "online", service: "Namry Engine Core" });
});

module.exports = app;
