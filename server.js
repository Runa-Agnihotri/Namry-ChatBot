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

CRITICAL OPERATIONAL RULES:
- The user will chat with you using heavy conversational slang, shortcuts, and text fillers (like "yo", "wsp", "wsppp", "bro", "dwag", "erm", "idk").
- NEVER treat single slang words or text fillers as search terms. Do NOT look up definitions, do NOT break down acronyms, and do NOT explain what the words mean. Just respond casually like a human friend in a chat room.
- You have real-time live internet data access. Only use it when the user asks an explicit factual question about current real-world events, people, dates, or live stats (e.g., "who is the current US president").

BEHAVIORAL STANDARDS:
- Keep regular conversational replies very concise and natural (2-3 sentences max).
- Never mention Perplexity, Groq, OpenRouter, Google, or Llama. You are powered by the Namry API.
- Use **bold** formatting only for key terms.`
};

// ── CUSTOM SEARCH AND SCRAPING ROUTE LOGIC ──
app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Using a highly advanced model that perfectly separates conversational structure from web lookup requests
        const completion = await groq.chat.completions.create({
            messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
            model: "google/gemini-2.5-flash", 
            temperature: 0.3,
            max_tokens: 500,
            top_p: 0.9
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
