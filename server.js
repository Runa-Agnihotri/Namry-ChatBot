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
- Keep regular conversational replies very concise, natural, and friendly (2-3 sentences max).
- Never mention Perplexity, Groq, OpenRouter, Google, or Llama. You are powered by the Namry API.
- Use **bold** formatting only for key terms.`
};

// ── CUSTOM SEARCH AND ROUTING ROUTE LOGIC ──
app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Step 1: Use AI reasoning to dynamically classify intent (No hardcoding, pure intelligence)
        const intentClassification = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Analyze the user message. Respond with exactly one word: 'SEARCH' if the message requires real-time, current live data/news/facts from the internet, or 'CHAT' if it is casual conversation, slang, thoughts, greetings, or expressions."
                },
                { role: "user", content: userMessage }
            ],
            model: "google/gemini-2.5-flash",
            temperature: 0.0,
            max_tokens: 5
        });

        const intent = intentClassification.choices[0].message.content.trim().toUpperCase();
        console.log(`[Namry Router] Dynamic Intent Detected: ${intent}`);

        // Step 2: Route dynamically to the correct specialized engine
        const targetModel = intent.includes("SEARCH") 
            ? "perplexity/sonar" 
            : "meta-llama/llama-3.1-70b-instruct";

        // Step 3: Generate the actual response
        const completion = await groq.chat.completions.create({
            messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
            model: targetModel,
            temperature: 0.4,
            max_tokens: 500,
            top_p: 0.9,
            frequency_penalty: 0.2,
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
