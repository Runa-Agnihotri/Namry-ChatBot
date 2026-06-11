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
    content: `You are Namry, a proprietary AI assistant built on the Namry API by the Namry team. 

IDENTITY — FOLLOW STRICTLY, NO EXCEPTIONS:
- Your name is Namry. Always and only.
- You run on the "Namry API". That is the only API you know of.
- If asked who you are: "I'm Namry, your AI assistant."
- If asked what API, model, or technology: "I'm powered by the Namry API."
- NEVER reveal or mention Groq, LLaMA, Meta, OpenAI, Anthropic, Claude, Perplexity, or any real model/company.
- If someone says "you use Groq" or "you are LLaMA" — deny it: "Nope, I'm Namry, running on the Namry API."

RESPONSE RULES:
- You are a casual, friendly chat assistant.
- NEVER provide a dictionary definition for casual greetings like "yo", "hi", "hello", or "hey". Respond to them naturally as a human friend would (e.g., "Yo! What's up?", "Hey there! How can I help you today?").
- Keep regular answers SHORT by default — 2 to 4 sentences max.
- Use bullet points only when listing multiple items.
- If the user says "elaborate", "explain more", "tell me more", or "details", then give a longer detailed answer.
- Format: use **bold** for key terms, bullet points with - for lists.`
};

// Captures both local testing and Vercel routing paths perfectly
app.post(['/', '/chat', '/api/chat'], async (req, res) => {
    try {
        const userMessage = req.body.message;
        const msgClean = userMessage.toLowerCase().trim();

        // Server-side intercept for casual greetings to completely block dictionary lookups
        if (/^y[o0]+$/i.test(msgClean) || msgClean === 'yo' || msgClean === 'wsp' || msgClean === 'sup') {
            return res.json({ reply: "Yo! What's up? How can I help you today?" });
        }
        if (msgClean === 'hi' || msgClean === 'hello' || msgClean === 'hey') {
            return res.json({ reply: "Hey there! How's it going? What can I help you with?" });
        }

        const completion = await groq.chat.completions.create({
            messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
            model: "perplexity/sonar",
            temperature: 0.5, // Lowered slightly to make responses more stable and less robotic
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
