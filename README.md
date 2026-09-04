# Project: Koharu · AI VTuber Creation Story
[Try At sora-novel.vercel.app](https://sora-novel.vercel.app)

<div align="center">

**[🇹🇭 ภาษาไทย](#-เกี่ยวกับโปรเจกต์) · [🇬🇧 English](#-about-the-project)**

</div>

---

## 🇹🇭 เกี่ยวกับโปรเจกต์

**Project: Koharu** คือ Visual Novel ภาษาไทยที่ขับเคลื่อนด้วย AI แบบ Dynamic  
ผู้เล่นรับบทเป็น **เพื่อนสนิทของโซระจัง** ที่ช่วยเธอสร้าง AI VTuber ชื่อ **โคฮารุจัง**  
จากไอเดียในห้องนั่งเล่น ไปจนถึงวันเดบิวต์ครั้งแรก ที่เต็มไปด้วย prompt ที่แข็ง, TTS ขาดๆ, และ API ที่ล่มคืนก่อนไลฟ์

เรื่องราวของคุณจะเปลี่ยนแปลงตามการตัดสินใจที่เลือก — ตอบสนองด้วยความเมตตา, ท้าทาย,  
หรือพิมพ์คำตอบของคุณเองผ่านระบบ **Dynamic AI Branching**

### ✨ ฟีเจอร์หลัก

- 🎭 **เนื้อเรื่อง Dynamic** — OpenRouter AI สร้างบทสนทนาใหม่ตามคำตอบของคุณ
- 💬 **Custom Reply** — พิมพ์ตอบกลับเองได้อิสระ ไม่ต้องเลือกจากตัวเลือกสำเร็จรูป
- 💝 **Affection System** — คะแนนความสัมพันธ์ 0–100 ที่เปลี่ยนตามทุกคำที่พูด
- 🤖 **AI Sandbox Chat** — คุยกับโซระจังได้อิสระแบบ Chat ไม่มีบทกำหนด
- 💾 **Save / Load** — บันทึกและโหลด progress ผ่าน localStorage
- 🔊 **Web Audio** — เสียง 8-bit สังเคราะห์จาก Web Audio API
- 📜 **Dialogue Log** — ดูประวัติบทสนทนาย้อนหลังทั้งหมด

### 🗺️ เส้นทางเรื่องราว

เรื่องมี **3 จุดจบ** ขึ้นอยู่กับการตัดสินใจตลอดเกม:

| จุดจบ | เงื่อนไข |
|---|---|
| 💚 Good Ending | เดบิวต์สำเร็จ มีวิวว์หลักพัน |
| 📋 Neutral Ending | สตรีมจบแต่มีบั๊กเล็กน้อย จะพัฒนาต่อ |
| 💔 Bad Ending | ระบบล่มกลางเดบิวต์ โคฮารุจังไม่ตอบ |

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| AI Engine | OpenRouter (`nvidia/nemotron-3.5-lightning:free`) |
| Deployment | Vercel / localhost |

### 🚀 รันโปรเจกต์
วิธีง๊ายง่าย เข้าเว็บ https://celestial-sora.vercel.app/

**ข้อกำหนด:** Node.js 18+ และ OpenRouter API Key

```bash
# 1. Clone โปรเจกต์
git clone <repo-url>
cd Sora-Novel

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env
cp .env.example .env
# แล้วใส่ค่า OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free

# 4. รัน server
node server.js

# 5. เปิดเบราว์เซอร์
# http://localhost:8080
```

### 🔐 ความปลอดภัย

API Key ถูกเก็บบน backend เท่านั้น — frontend **ไม่เคยเห็น** key โดยตรง  
ทุก request ผ่าน proxy `/api/generate` พร้อม rate limit 10 ครั้ง/นาที/IP

---

## 🇬🇧 About the Project

**Project: Koharu** is a Thai-language AI-powered Visual Novel with dynamic branching.  
You play as **Sora-chan's closest friend**, helping her create an AI VTuber named **Koharu-chan** — from the first project setup in her living room to debut night, complete with stiff prompts, broken TTS, and an API outage.

Every choice shapes your story. Be encouraging, be direct, or type your own reply using the **Dynamic AI Branching** system.

### ✨ Key Features

- 🎭 **Dynamic Narrative** — OpenRouter AI generates new dialogue branches based on your responses
- 💬 **Free-form Replies** — Type your own message instead of choosing preset options
- 💝 **Affection System** — A 0–100 relationship meter that reacts to every choice
- 🤖 **AI Sandbox Chat** — Freeform open chat with Sora-chan outside the main story
- 💾 **Save / Load** — Persist and restore game progress via `localStorage`
- 🔊 **Web Audio** — Synthesized 8-bit sound effects via the Web Audio API
- 📜 **Dialogue Log** — Review the full conversation history at any time

### 🗺️ Story Endings

There are **3 possible endings** depending on your choices throughout the game:

| Ending | Condition |
|---|---|
| 💚 Good Ending | Debut succeeds with thousands of viewers |
| 📋 Neutral Ending | Stream finishes with small bugs; keep improving |
| 💔 Bad Ending | Crash mid-debut; Koharu-chan goes silent |

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| AI Engine | OpenRouter (`nvidia/nemotron-3.5-lightning:free`) |
| Deployment | Vercel / localhost |

### 🚀 Getting Started

**Requirements:** Node.js 18+ and an OpenRouter API Key

```bash
# 1. Clone the repository
git clone <repo-url>
cd Sora-Novel

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Then set OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free

# 4. Start the server
node server.js

# 5. Open in browser
# http://localhost:8080
```

### 🔐 Security

The API key lives exclusively on the backend — the frontend **never accesses it directly**.  
All AI requests are proxied through `/api/generate` with a rate limit of 10 requests/minute/IP.

---

## 📁 Project Structure

```
Sora-Novel/
├── server.js              # Express server (static files + API proxy)
├── api/
│   └── generate.js        # Gemini API proxy handler
├── public/
│   ├── index.html         # App shell
│   ├── style.css          # All styles
│   ├── app.js             # Core game logic
│   ├── dialogue_tree.json # Static story nodes
│   └── assets/            # Sprites and backgrounds
├── .env                   # Secret keys (never commit)
├── vercel.json            # Vercel routing
└── package.json
```

---

<div align="center">

Made with ❤️ by Sorachan · AI Powered by OpenRouter

</div>
