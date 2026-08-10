module.exports = async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

    // Helper for offline mock response
    function getMockResponse(promptText) {
        if (promptText.includes("AI Sandbox Chat") || promptText.includes("chatting with your Senior")) {
            return JSON.stringify({
                text: "หนูกำลังรันอยู่ในโหมด Offline Test ค่ะ! ถึงจะยังไม่ได้ต่อ API Key แต่โซระจังก็พร้อมเรียนรู้และลุยกับพี่ได้เสมอนะคะ!",
                expression: "happy"
            });
        }
        return JSON.stringify({
            text: "หนูกำลังรันระบบดีบักในโหมด Offline Test อยู่ค่ะ! ไม่ต้องใช้ API Key ก็สามารถทดสอบเล่นบทเรียนของโซระจังต่อไปได้เลยนะคะพี่!",
            expression: "happy",
            affectionChange: 1,
            choices: [
                { id: "mock_1", hint: "ก้าวต่อไปในบทถัดไปของโปรเจกต์!", next: "ch2_start", affectionChange: 1 },
                { id: "mock_2", hint: "เปิดไฟล์ .env และเริ่มรันระบบกันต่อ", next: "ch1_setup_env", affectionChange: 1 }
            ]
        });
    }

    // If API Key is missing or placeholder, return mock response instantly
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE" || GEMINI_API_KEY.includes("your_key")) {
        console.log("ℹ️  Offline Test Mode: returning mock AI response");
        return res.status(200).json({ text: getMockResponse(prompt) });
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
            console.log("⚠️ Fallback to Offline Test Mode due to API error");
            return res.status(200).json({ text: getMockResponse(prompt) });
        }

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.log("⚠️ Fallback to Offline Test Mode due to empty API text");
            return res.status(200).json({ text: getMockResponse(prompt) });
        }

        return res.status(200).json({ text });

    } catch (err) {
        console.error("Serverless error calling Gemini:", err.message);
        console.log("⚠️ Fallback to Offline Test Mode due to serverless error");
        return res.status(200).json({ text: getMockResponse(prompt) });
    }
};
