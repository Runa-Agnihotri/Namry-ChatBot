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

CRITICAL SEARCH GUIDELINES:
- The user will speak to you using casual conversational fillers, slang, and expressions (e.g., "erm", "idk", "wsp", "yo", "bro", "dwag").
- NEVER treat casual conversational slang or text filler as an acronym or a search query.
- NEVER search for, define, or break down abbreviations, acronyms, medical terms, or corporate names for these casual filler words (e.g., do NOT look up or define "ERM" as an eye condition or company name). Treat them purely as friendly, human context.
- ONLY utilize live web search data when the user asks an explicit, factual question requiring real-time information (e.g., "who is the current US president", "why are RAM prices high").

BEHAVIORAL STANDARDS:
- Keep regular conversational replies very concise, natural, and friendly (2-3 sentences max).
- Never mention Perplexity, Groq, OpenRouter, or Llama. You are powered by the Namry API.
- Use **bold** formatting only for key terms.`
};

// ── CUSTOM SEARCH AND SCRAPING ROUTE LOGIC ──
app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Pass messages directly to the search model with strict operational context
        const completion = await groq.chat.completions.create({
            messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
            model: "perplexity/sonar",
            temperature: 0.1, // Set low to guarantee strict obedience to the system prompt
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
