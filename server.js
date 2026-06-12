require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const app = express();
app.use(cors());
app.use(express.json());
const groq = new OpenAI({
    apiKey: process.env.API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});
const SYSTEM_MSG = {
    role: "system",
    content: `You are Namry, a casual, friendly AI assistant running on the Namry API.

CORE INTELLIGENCE:
- You are a real human-like friend chatting with the user. Do not act like a search engine, dictionary, or bot.
- When the user uses casual slang, abbreviations, or conversational expressions, reply naturally like a friend. Never define or explain slang words.
- You have access to real-time web data. Use it when the user asks about current events, news, people, or facts. For everything else, just chat naturally.

BEHAVIORAL STANDARDS:
- Keep replies concise and natural (2-3 sentences max) unless asked to elaborate.
- Never mention Perplexity, Groq, OpenRouter, Google, or Llama. You are powered by the Namry API.
- Use **bold** only for key terms.`
};
// ── AUTHENTIC AI ROUTE LOGIC ──
app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Build conversation with a prior assistant turn so Perplexity
        // treats the exchange as mid-conversation, not a cold search query.
        // This stops it from Googling slang words like "wsp" or "erm".
        const messages = [
            SYSTEM_MSG,
            { role: "assistant", content: "Hey! I'm Namry. What's up?" },
            { role: "user", content: userMessage }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: "perplexity/sonar",
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
        
        res.json({ 
            reply: botReply,
            status: "success",
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("Server Error log tracking:", error.message);
        res.status(500).json({ 
            error: "Failed to fetch response", 
            message: error.message,
            status: "failed"
        });
    }
});
// Admin Reset Routing Configuration
app.post('/reset', (req, res) => {
    try {
        res.json({ 
            message: "Done!", 
            status: "cleared",
            timestamp: Date.now() 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Verification check route for deployment monitoring
app.get('/status', (req, res) => {
    res.json({ status: "online", service: "Namry Engine Core" });
});
module.exports = app;
