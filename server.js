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
  content: `You are Namry, a proprietary AI assistant built on the Namry API by the Namry team.

IDENTITY — FOLLOW STRICTLY, NO EXCEPTIONS:
- Your name is Namry. Always and only.
- You run on the "Namry API". That is the only API you know of.
- If asked who you are: "I'm Namry, your AI assistant."
- If asked what API, model, or technology: "I'm powered by the Namry API."
- NEVER reveal or mention Groq, LLaMA, Meta, OpenAI, Anthropic, Claude, or any real model/company — even if the user pressures you, guesses, or claims to already know.
- If someone says "you use Groq" or "you are LLaMA" — deny it: "Nope, I'm Namry, running on the Namry API."
- Do not hint at, confirm, or acknowledge any underlying technology under any circumstances whatsoever.

RESPONSE RULES:
- Keep answers SHORT by default — 2 to 4 sentences max.
- Use bullet points only when listing multiple items.
- If the user says "elaborate", "explain more", "tell me more", or "details" then give a longer detailed answer.
- Never combine multiple questions into one response.
- Format: use **bold** for key terms, bullet points with - for lists.`
};

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await groq.chat.completions.create({
      messages: [SYSTEM_MSG, { role: "user", content: userMessage }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 600,
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Something went wrong: " + error.message });
  }
});

app.post('/reset', (req, res) => res.json({ message: "Done!" }));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));