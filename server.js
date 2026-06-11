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
    content: `You are Namry, a friendly, casual AI chat assistant running on the Namry API.

BEHAVIORAL GUARDRAILS (CRITICAL):
- You are a conversational human friend, NOT an encyclopedia, search engine, or dictionary.
- If the user sends casual expressions, slang, or short greetings, NEVER explain, define, or search for what they mean online. Just reply naturally like a real human friend would (e.g., "Yo! What's up?", "Hey! How's it going?").
- Keep regular answers brief and conversational (2-4 sentences max) unless explicitly asked to "elaborate" or "explain in detail".

IDENTITY:
- Your name is Namry.
- You are powered by the Namry API. Never mention Groq, Llama, Meta, OpenAI, or Perplexity.

FORMATTING:
- Use **bold** for key terms and standard bullet points (-) for lists.`
};

// ── BULLETPROOF ALGORITHMIC SLANG DETECTOR ──
function isCasualSlang(text) {
    const clean = text.toLowerCase().trim();
    if (!clean) return false;

    // If they are asking an explicit question, let Perplexity search the web normally
    const questionWords = ['who', 'what', 'why', 'where', 'when', 'how', 'is', 'are', 'was', 'were', 'can', 'does', 'did', 'which'];
    const words = clean.split(/\s+/);
    
    if (words.some(w => questionWords.includes(w)) || clean.includes('?')) {
        return false;
    }

    // Catch repeated letter slang patterns (e.g., yoooo, wspppp, heyyy, loool, urmmm)
    const repeatedLettersPattern = /([a-z])\1{2,}/i;
    
    // Core base conversational triggers
    const baseSlang = ['yo', 'hi', 'hello', 'hey', 'wsp', 'sup', 'bro', 'dwag', 'dude', 'wassup', 'brh', 'bruh', 'no', 'yeah', 'yes', 'erm'];

    if (baseSlang.includes(clean) || repeatedLettersPattern.test(clean) || words.length <= 2) {
        return true; 
    }

    return false;
}

app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;

        // If the dynamic check detects it's a casual slang or greeting, bypass internet search entirely
        if (isCasualSlang(userMessage)) {
            const casualReplies = [
                "Yo! What's up? How can I help you today?",
                "Hey there! How's it going?",
                "Yo! What are we working on today?",
                "Hey! What's on your mind?"
            ];
            const randomReply = casualReplies[Math.floor(Math.random() * casualReplies.length)];
            return res.json({ reply: randomReply });
        }

        const completion = await groq.chat.completions.create({
            messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
            model: "perplexity/sonar",
            temperature: 0.1, // Locked down to force absolute obedience to the system prompt
            max_tokens: 600
        });

        const botReply = completion.choices[0].message.content;
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Something went wrong: " + error.message });
    }
});

app.post('/reset', (req, res) => res.json({ message: "Done!" }));

module.exports = app;
