# CLAUDE.md — Sora-chan AI Visual Novel

> คำแนะนำเฉพาะสำหรับ Claude AI เมื่อทำงานบนโปรเจกต์นี้  
> อ่านควบคู่กับ `AGENTS.md` ซึ่งมีข้อมูลโปรเจกต์แบบสมบูรณ์

---

## 🎯 Quick Context (อ่านก่อนลงมือ)

โปรเจกต์นี้คือ **Visual Novel ภาษาไทย** ที่มีตัวละครหลักชื่อ **โซระจัง** (Sora-chan)  
เธอเป็นน้องฝึกงาน AI Engineer — ขี้กังวล น่ารัก ตื่นตูมกับ error code แต่ใจสู้มาก  
ผู้เล่นรับบทเป็น **พี่เลี้ยง Senior** ที่คอยชี้แนะเธอ

**Stack:** Vanilla JS frontend + Node.js/Express backend + Gemini AI API

---

## 📋 ก่อนเริ่มงานทุกครั้ง

```
1. อ่าน AGENTS.md เพื่อทำความเข้าใจ architecture และ rules
2. ตรวจดู app.js ในส่วนที่เกี่ยวข้องก่อนแก้ไข (ไฟล์ยาว ~1237 บรรทัด)
3. ตรวจสอบ dialogue_tree.json ก่อนแก้ไข story content
4. ห้าม hardcode API key ใด ๆ ในโค้ด
```

---

## 💬 การสื่อสารกับ User

โปรเจกต์นี้มีทั้ง **ภาษาไทยและอังกฤษ** ผสมกัน:
- บทพูดตัวละคร → **ภาษาไทย** (ใช้ค่ะ/นะคะ ตาม character personality)
- Comment ในโค้ด → **ภาษาอังกฤษ**
- User อาจสื่อสารเป็น **ภาษาไทย** — ตอบกลับให้ตรงตามภาษาที่ user ใช้

---

## 🗂️ ไฟล์หลักที่ต้องรู้

| ไฟล์ | หน้าที่ | ความสำคัญ |
|---|---|---|
| [`app.js`](file:///home/sorachan/Documents/Sora-Novel/public/app.js) | Game logic ทั้งหมด (typewriter, AI calls, save/load) | ⭐⭐⭐ สูงมาก |
| [`dialogue_tree.json`](file:///home/sorachan/Documents/Sora-Novel/public/dialogue_tree.json) | Static story nodes | ⭐⭐⭐ สูงมาก |
| [`style.css`](file:///home/sorachan/Documents/Sora-Novel/public/style.css) | CSS ทั้งหมด (28KB) | ⭐⭐ สูง |
| [`index.html`](file:///home/sorachan/Documents/Sora-Novel/public/index.html) | HTML shell | ⭐⭐ สูง |
| [`api/generate.js`](file:///home/sorachan/Documents/Sora-Novel/api/generate.js) | Gemini proxy endpoint | ⭐⭐ สูง |
| [`server.js`](file:///home/sorachan/Documents/Sora-Novel/server.js) | Express server setup | ⭐ ปานกลาง |

---

## 🤖 AI System — สิ่งที่ต้องรู้

### Gemini Prompt Structure

โปรเจกต์นี้ใช้ Gemini ใน **2 โหมด** (ดู `app.js` บรรทัด 796–961 และ 1147–1167):

**Story Mode** — `submitCustomResponse()` / `submitChoiceAsResponse()`
- ส่ง system prompt + chat history (6 ข้อความล่าสุด) + player input
- ต้องการ JSON: `{ text, expression, affectionChange, choices[] }`
- อย่างน้อย 1 choice ต้องชี้ไปยัง static node ID

**Sandbox Mode** — `submitSandboxMessage()`
- Multi-turn history ทั้งหมด
- ต้องการ JSON: `{ text, expression }`

### JSON Parser Safety
`parseDynamicNodeJSON()` มี fallback node — อย่าลบออก  
ถ้าแก้ไข prompt schema ต้องอัปเดต parser พร้อมกัน

---

## 🎨 CSS Conventions (สรุปย่อ)

```css
/* ใช้ CSS variables เสมอ — อย่า hardcode color */
color: var(--primary-color);    /* ห้ามใช้ #7c3aed */
background: var(--bg-surface);  /* ห้ามใช้ rgba(...) โดยตรง */

/* Theme: Dark + glassmorphism + purple/pink accent */
/* Fonts: Kanit (TH), Outfit (EN) จาก Google Fonts */
```

---

## 📝 การเพิ่ม Story Content

### เพิ่ม Dialogue Node ใหม่

1. เพิ่มใน [`dialogue_tree.json`](file:///home/sorachan/Documents/Sora-Novel/public/dialogue_tree.json):
```json
"node_new_scene": {
  "speaker": "โซระจัง",
  "text": "บทพูดภาษาไทยที่นี่ค่ะ!",
  "background": "office_lounge",
  "expression": "happy",
  "choices": [
    {
      "id": "choice_1",
      "hint": "ข้อความบนปุ่ม",
      "next": "next_node_id",
      "affectionChange": 1
    }
  ]
}
```

2. อัปเดต system prompt ใน `app.js` บรรทัด 823–834 ให้รู้จัก node ใหม่
3. เพิ่มใน Story Map ใน `AGENTS.md`

### Valid Values
- **backgrounds:** `office_desk`, `office_lounge`, `office_outside`, `office_breakroom`, `server_crash`
- **expressions:** `happy`, `neutral`, `thinking`, `curious`, `panic`, `worried`, `confident`, `excited`

---

## 🐛 Debugging Checklist

เมื่อ user รายงานปัญหา ให้ตรวจตามลำดับ:

1. **AI ไม่ตอบ?**
   - ตรวจ `.env` มี `GEMINI_API_KEY` หรือไม่
   - ตรวจ rate limit (10 req/min) — อาจกด Choice เร็วเกินไป
   - ดู Network tab → `/api/generate` response status

2. **ฉากไม่แสดง?**
   - ตรวจ `nodeId` ใน `dialogueTree` หรือ `dynamicNodes`
   - ตรวจ console: `"Node not found:"`

3. **Save/Load พัง?**
   - localStorage key ต้องเป็น `oracle_chan_vn_save` เท่านั้น
   - ตรวจ JSON.parse ไม่ throw error

4. **Sprite/Background ไม่แสดง?**
   - ตรวจ `SPRITES` / `BACKGROUNDS` object ใน `app.js`
   - ตรวจ path ใน `public/assets/`

---

## 🚀 Deploy & Run

```bash
# Local development
npm install
node server.js
# → http://localhost:8080

# Production: Vercel (อัตโนมัติ)
# vercel.json กำหนด routing ให้ /api/* ไปที่ api/generate.js
# Environment variable GEMINI_API_KEY ต้องตั้งใน Vercel dashboard
```

---

## ⚠️ Security Checklist (ตรวจทุกครั้งก่อน commit)

- [ ] `.env` อยู่ใน `.gitignore`
- [ ] ไม่มี API key ใน source code
- [ ] Rate limit บน `/api/generate` ยังคงอยู่
- [ ] CORS ใน `api/generate.js` เหมาะสมกับ environment

---

## 🌟 Character Reference — โซระจัง

ใช้เป็นข้อมูลอ้างอิงเมื่อเขียน/แก้ไขบทพูด:

| Property | Detail |
|---|---|
| **ชื่อ** | โซระจัง (Sora-chan) |
| **บุคลิก** | น่ารัก, ขี้กังวล, กระตือรือร้น, ใจสู้ |
| **หน้าที่** | AI Engineer ฝึกหัด (วันแรก) |
| **ทักษะ** | Gemini API, Node.js, LLM, Python (เรียนรู้) |
| **จุดอ่อน** | ตื่นตูมกับ error, OOM, stack trace |
| **สไตล์พูด** | ลงท้ายด้วย ค่ะ/นะคะ, เรียกตัวเองว่า หนู/โซระจัง, เรียกผู้เล่นว่า พี่ |
| **คำอุทาน** | "แงงง!", "บั๊กอีกแล้วค่ะพี่!", "เย้!" |

---

> 💡 **Tip for Claude:** โปรเจกต์นี้เขียน frontend ล้วนๆ ด้วย Vanilla JS  
> ถ้าจะเพิ่ม feature ใหม่ — ก่อนอื่น **ค้นหาว่ามีฟังก์ชันที่เกี่ยวข้องใน `app.js` อยู่แล้วหรือไม่**  
> เพื่อหลีกเลี่ยงการเขียนโค้ดซ้ำซ้อน
