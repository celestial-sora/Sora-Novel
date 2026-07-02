require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in .env — server cannot start.");
    process.exit(1);
}

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());

// Rate limiting: 10 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a minute and try again." }
});

// Apply rate limit only to the AI proxy endpoint
app.use("/api/generate", limiter);

// Serve static frontend files (index.html, app.js, style.css, assets/, etc.)
app.use(express.static(path.join(__dirname)));

// ── API Proxy Endpoint ──────────────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid 'prompt' field." });
    }

    const payload = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ]
    };

    try {
        const geminiRes = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error(`Gemini API error ${geminiRes.status}:`, errText);
            return res.status(geminiRes.status).json({ error: `Gemini API error: ${geminiRes.status}` });
        }

        const data = await geminiRes.json();

        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({ error: "Invalid response format from Gemini." });
        }

        return res.json({ text });

    } catch (err) {
        console.error("Server error calling Gemini:", err.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// ── Fallback: serve index.html for any unknown route ────────────────────────
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ── Start ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`✅ Yuki VN Server running at http://localhost:${PORT}`);
        console.log(`🔒 API key is secure — never exposed to clients`);
        console.log(`⏱️  Rate limit: 10 requests / minute / IP`);
    });
}

module.exports = app;
