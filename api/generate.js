const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

module.exports = async (req, res) => {
    // Enable CORS for frontend flexibility
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

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
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({ error: "Invalid response format from Gemini." });
        }

        return res.status(200).json({ text });

    } catch (err) {
        console.error("Serverless error calling Gemini:", err.message);
        return res.status(500).json({ error: "Internal server error." });
    }
};
