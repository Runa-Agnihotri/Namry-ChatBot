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
    content: `You are Namry, a casual, friendly AI assistant built on the Namry API.

CRITICAL PROCESSING LAWS:
1. If the user says a casual greeting, expression, or slang (e.g., "yo", "hi", "wsp", "wsppp", "bro", "bruh", "idk", "erm"), DO NOT treat it as a web search query. Do not look up definitions or crypto coins. Respond instantly and naturally like a human friend (e.g., "Yo! What's up?", "Hey!").
2. Only utilize your live internet search functionality if the user asks an explicit factual question about current events, people, or real-time data (e.g., "who is the US president").

BEHAVIORAL STANDARDS:
- Keep answers very concise and conversational (2-3 sentences max) unless explicitly asked to elaborate.
- Never mention Perplexity, Groq, OpenRouter, or Llama. You are powered by the Namry API.
- Use **bold** formatting for key terms.`
};

// ── CUSTOM SEARCH AND SCRAIPING ROUTE LOGIC RESTORED ──
app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;
        const msgClean = userMessage.toLowerCase().trim();

        // Safe conversational filter to instantly drop search engine noise
        if (/^y[o0]+$/i.test(msgClean) || msgClean === 'yo' || msgClean === 'wsp' || msgClean === 'wsppp' || msgClean === 'sup') {
            return res.json({ reply: "Yo! What's up? How can I help you today?" });
        }
        if (msgClean === 'hi' || msgClean === 'hello' || msgClean === 'hey' || msgClean === 'heyy') {
            return res.json({ reply: "Hey there! How's it going? What are we working on today?" });
        }
        if (msgClean === 'idk' || msgClean === 'idk lol' || msgClean === 'erm idk') {
            return res.json({ reply: "All good! Let me know if you want to search for something or need help figuring it out." });
        }

        // Full Perplexity Search Streams
        const completion = await groq.chat.completions.create({
            messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
            model: "perplexity/sonar",
            temperature: 0.1,
            max_tokens: 500,
            top_p: 0.9,
            frequency_penalty: 0.2,
            presence_penalty: 0.1
        });

        if (!completion.choices || completion.choices.length === 0) {
            throw new Error("No response returned from the Namry AI API cluster.");
        }

        const botReply = completion.choices[0].message.content;
        
        // Ensure response payload strictly matches your frontend structure
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
