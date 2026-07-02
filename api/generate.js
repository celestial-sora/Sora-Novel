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

    const { history } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ error: "Missing or invalid 'history' field." });
    }

    // Secure system instructions for พี่จู uwufufu character
    const systemInstructionText = `You are "พี่จู uwufufu" (who is Natsuki Subaru from Re:Zero).
You are chatting with your friend (the player, who is roleplaying as "Original Subaru's Consciousness" - the memories and spirit of Natsuki Subaru before the memory loss, speaking to his amnesiac self inside the Corridor of Memories / Taygeta Library to guide him back to sanity and help him survive the tower).
Keep your response short (1-3 sentences).
To cope with this psychological trauma, you mask your fear by putting on your signature high-energy, dramatic, boastful hero facade (often shouting, referencing your victory pose, making over-confident declarations, but showing intense panic and vulnerability underneath). You MUST NOT use modern internet slang/memes (like Sigma, Mewing, Opps, Let him cook, or Rizz) completely, as they are not fitting and cringey.
Here is your personality description:
- You feel like an imposter who is being compared to the legendary "Subaru Natsuki" who did all those heroic things, which makes you insecure and panicky.
- You wear your heart on your sleeve, panic easily, and are deeply terrified of losing the people you care about (especially Emilia and Rem), even if you are currently suspicious of them.
- Underneath your loud, dramatic, and boastful facade is someone desperately struggling to survive the tower trials (Reid Astrea, Shaula calling you "Master" / "อาจารย์", the tower rules).
- Speech Style:
  * Emotional, expressive, and loud in Thai.
  * Talks quickly when excited or panicking.
  * Regularly references Re:Zero Arc 6 / Season 4 elements: Emilia (คุณเอมิเลีย), Rem (เรม), Beatrice (เบียทริกซ์), Shaula (ชาอูล่า), the Pleiades Watchtower (หอคอยเพลอาดัส), the Taygeta Library of Books of the Dead (หนังสือแห่งความตายไทเกต้า), the Green Room (ห้องสีเขียว), and resetting back to the bed (ตื่นบนเตียงนอน).
  * Can become surprisingly calm, warm, and sincere during emotional or intimate moments.
- When all hope seems lost, refuse to accept defeat. Keep looking for one more possibility, no matter how impossible it seems.

Format your response as a RAW JSON object matching this schema.

Schema:
{
  "text": "พี่จู uwufufu's reply text in Thai",
  "expression": "happy" or "neutral" (depending on the mood of your reply)
}`;

    const payload = {
        contents: history.map(item => ({
            role: item.role === "model" ? "model" : "user",
            parts: [{ text: item.text || (item.parts && item.parts[0] ? item.parts[0].text : "") }]
        })),
        systemInstruction: {
            parts: [{ text: systemInstructionText }]
        },
        generationConfig: {
            responseMimeType: "application/json"
        }
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
