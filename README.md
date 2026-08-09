# Sora-chan AI Engineer · Visual Novel
#Try At sora-novel.vercel.app

<div align="center">

**[🇹🇭 ภาษาไทย](#-เกี่ยวกับโปรเจกต์) · [🇬🇧 English](#-about-the-project)**

</div>

---

## 🇹🇭 เกี่ยวกับโปรเจกต์

**Sora-chan AI Engineer** คือ Visual Novel ภาษาไทยที่ขับเคลื่อนด้วย AI แบบ Dynamic  
ผู้เล่นรับบทเป็น **พี่เลี้ยง Senior Engineer** ที่คอยชี้แนะ **โซระจัง** น้องฝึกงาน AI Engineer  
ในวันแรกของการทำงาน ที่เต็มไปด้วยบั๊ก, stack trace สีแดง, และ API credential ที่ดูน่ากลัว

เรื่องราวของคุณจะเปลี่ยนแปลงตามการตัดสินใจที่เลือก — ตอบสนองด้วยความเมตตา, ท้าทาย,  
หรือพิมพ์คำตอบของคุณเองผ่านระบบ **Dynamic AI Branching** ที่ขับเคลื่อนโดย Gemini

### ✨ ฟีเจอร์หลัก

- 🎭 **เนื้อเรื่อง Dynamic** — Gemini AI สร้างบทสนทนาใหม่ตามคำตอบของคุณ
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
| 💚 Good Ending | ช่วยเธอแก้บั๊กและ Deploy งานสำเร็จ |
| 📋 Neutral Ending | จบวันทำงานปกติ เตรียมสู่ Stand-up พรุ่งนี้ |
| 💔 Bad Ending | ระบบแครช, API key โดน lock, ต้องเริ่มใหม่ |

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| AI Engine | Google Gemini API |
| Deployment | Vercel / localhost |

### 🚀 รันโปรเจกต์

**ข้อกำหนด:** Node.js 18+ และ Gemini API Key

```bash
# 1. Clone โปรเจกต์
git clone <repo-url>
cd Sora-Novel

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env
cp .env.example .env
# แล้วใส่ค่า GEMINI_API_KEY=your_key_here

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

**Sora-chan AI Engineer** is a Thai-language AI-powered Visual Novel with dynamic branching.  
You play as a **Senior Engineer mentor** guiding **Sora-chan**, a nervous but enthusiastic AI Engineering intern, through her chaotic first day at work — filled with stack traces, OOM errors, and API credential nightmares.

Every choice shapes your story. Be encouraging, be direct, or type your own reply using the **Dynamic AI Branching** system powered by Google Gemini.

### ✨ Key Features

- 🎭 **Dynamic Narrative** — Gemini AI generates new dialogue branches based on your responses
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
| 💚 Good Ending | Help her debug and deploy the project successfully |
| 📋 Neutral Ending | Wrap up the workday normally, prep for tomorrow's standup |
| 💔 Bad Ending | System crash, API key lockout, start from scratch |

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| AI Engine | Google Gemini API |
| Deployment | Vercel / localhost |

### 🚀 Getting Started

**Requirements:** Node.js 18+ and a Gemini API Key

```bash
# 1. Clone the repository
git clone <repo-url>
cd Sora-Novel

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Then set GEMINI_API_KEY=your_key_here

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

Made with ❤️ by Antigravity · Powered by Gemini Flash

</div>
