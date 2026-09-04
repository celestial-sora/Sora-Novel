# AGENTS.md — Sora-chan AI Visual Novel

> This file contains instructions for AI agents working on this project.
> All agents must read and follow these guidelines before making any changes.

---

## Project Overview

**Sora-chan × Koharu-chan** is a dynamic AI-powered Visual Novel driven by the Gemini API.  
The player takes the role of **Sora-chan's closest friend**, helping her create an AI VTuber named **Koharu-chan**.

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML + CSS + JavaScript (no framework) |
| **Backend** | Node.js + Express |
| **AI Engine** | Google Gemini API (via secure backend proxy) |
| **Deployment** | Vercel (serverless) + local `node server.js` |
| **Rate Limiting** | `express-rate-limit` — 10 req/min/IP |
| **Storage** | `localStorage` (game saves), in-memory (sandbox chat history) |

---

## Project Structure

```
Sora-Novel/
├── server.js              # Express server — serves static files + proxies /api/generate
├── api/
│   └── generate.js        # Gemini API proxy handler (serverless compatible)
├── public/
│   ├── index.html         # Single-page app shell
│   ├── style.css          # All styling (dark theme, glassmorphism, animations)
│   ├── app.js             # Core game logic (~1237 lines)
│   ├── dialogue_tree.json # Static story nodes and choices
│   └── assets/            # Character sprites and backgrounds
│       ├── sora_normal.png
│       ├── sora_thinking.png
│       ├── sora_panic.png
│       ├── sora_confident.png
│       ├── office_desk.jpg
│       ├── office_lounge.jpg
│       ├── office_outside.jpg
│       ├── office_breakroom.jpg
│       ├── server_crash.jpg
│       └── sandbox_bg.jpg
├── .env                   # Secret keys — NEVER commit to git
├── vercel.json            # Vercel routing config
└── package.json           # Project metadata and dependencies
```

---

## Security Rules (CRITICAL)

- The **API key** must only exist in `.env` — never hardcode it in source files
- `GEMINI_API_KEY` is proxied exclusively through `/api/generate` — the frontend never sees it directly
- `.gitignore` must always cover `.env`
- Do not add broad CORS (`*`) to production endpoints without justification

---

## Architecture and Data Flow

```
Player Action (Browser)
    │
    ▼
app.js (Game Logic)
    │  static dialogue → dialogue_tree.json
    │  dynamic dialogue → callGeminiAPI()
    │
    ▼
POST /api/generate  (Express — server.js)
    │  Rate limit: 10 req/min/IP
    │
    ▼
api/generate.js
    │
    ▼
Google Gemini API (generateContent)
    │
    ▼
JSON response → parseDynamicNodeJSON() / parseSandboxJSON()
    │
    ▼
gameState.dynamicNodes[newNodeId] → playNode()
```

---

## Game State Object (`gameState` in app.js)

```js
gameState = {
    dialogueTree: {},       // Static nodes loaded from dialogue_tree.json
    dynamicNodes: {},       // AI-generated branches (runtime only)
    currentNodeId: "start", // Active node ID
    affectionScore: 50,     // 0–100 relationship meter
    gameHistory: [],        // [{speaker, text}] — last 6 entries sent as AI context
    isTyping: false,        // Typewriter animation in progress
    autoPlay: false,        // Auto-advance mode
    skipMode: false,        // Instant text mode
    isAILoading: false,     // AI request in progress
    sandboxHistory: []      // Sandbox chat multi-turn history [{role, parts}]
}
```

---

## Dialogue Node Schema

### Static Node (`dialogue_tree.json`)

```json
{
  "nodeId": {
    "speaker": "โซระจัง",
    "text": "Character dialogue text...",
    "background": "office_desk",
    "expression": "happy",
    "choices": [
      {
        "id": "choice_id",
        "hint": "Button label text",
        "next": "target_node_id",
        "affectionChange": 1
      }
    ],
    "isEnding": false
  }
}
```

### Dynamic Node (AI-generated, stored in `gameState.dynamicNodes`)

```json
{
  "node_dynamic_1234567890": {
    "speaker": "โซระจัง",
    "text": "...",
    "background": "office_lounge",
    "expression": "happy",
    "choices": [...],
    "affectionChange": 2
  }
}
```

**Valid backgrounds:** `living_room`, `office_desk`, `office_lounge`, `office_outside`, `office_breakroom`, `server_crash`

**Valid expressions:** `happy`, `neutral`, `thinking`, `curious`, `panic`, `worried`, `confident`, `excited`

---

## Static Story Map

```
[Chapter 1: Idea Spark]
   [start] ──→ [ch1_setup_env / ch1_git_clone / ch1_cold] ──→ [ch1_api_test / ch1_first_bug]
                   │
                   ▼
[Chapter 2: VTuber Prompt Engineering]
   [ch2_start] ──→ [ch2_embedding_choice / ch2_oom_error] ──→ [ch2_chunking_strategy] ──→ [ch2_context_overflow]
                   │
                   ▼
[Chapter 3: First Stream Rehearsal]
   [ch3_start] ──→ [ch3_coffee_chat / ch3_imposter_syndrome] ──→ [ch3_secret_hint] ──→ [ch3_refactoring]
                   │
                   ▼
[Chapter 4: Crisis the Night Before Debut]
   [ch4_start] ──→ [ch4_incident_alert] ───┬──→ [ch4_stacktrace_analysis] ──→ [ch4_emergency_hotfix]
                                            └──→ [ch4_secret_code_audit] (Secret Route Trigger)
                                                               │
                                                               ▼
                                                  [Chapter 5: Debut Day & Endings]
                                                     [ch5_start] ──→ [ch5_eval_ending]
                                                                        ├─ (Affection 100% + Secret Heartbeat) ──→ [ending_secret] 🌟🚀
                                                                        ├─ (Affection >= 70%) ───────────────→ [ending_good] ❤️
                                                                        ├─ (Affection >= 40%) ───────────────→ [ending_neutral] 📋
                                                                        └─ (Affection < 40%) ────────────────→ [ending_bad] 💔
```

**Endings:**
- `ending_good` — Debut succeeds with thousands of viewers; Sora thanks her closest friend ❤️ (>=70%)
- `ending_neutral` — Stream finishes with small bugs; they promise to keep improving 📋 (40-69%)
- `ending_bad` — System crashes mid-debut; Koharu-chan goes silent 💔 (<40%)
- `ending_secret` — Koharu-chan sends a secret message that she feels her creator's love 🌟🚀 (100% Affection + Heartbeat path)

---

## AI Prompt System

The game uses Gemini in two contexts:

### 1. Story Mode (`submitCustomResponse` / `submitChoiceAsResponse`)

- Sends: system prompt + last 6 history entries + `affectionScore` + player input
- Expected JSON response: `{ text, expression, affectionChange, choices[] }`
- At least one `choices[].next` must point to a valid static node ID
- Response must be raw JSON — no markdown code block wrappers

### 2. Sandbox Mode (`submitSandboxMessage`)

- Sends: full multi-turn chat history
- Expected JSON response: `{ text, expression }`
- Fallback: raw text is used if JSON parsing fails

---

## Development Commands

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev
# or
node server.js
# Available at http://localhost:8080

# Required environment variables (.env)
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash   # optional, defaults to gemini-2.5-flash
PORT=8080                        # optional, defaults to 8080
```

---

## CSS and Styling Conventions

- All **color values** must use CSS custom properties defined in `:root` inside `style.css`
- **Theme:** Dark mode, glassmorphism, purple/pink accent palette
- **Fonts:** Kanit (Thai), Outfit (English) — loaded via Google Fonts
- **Animations:** Define keyframes in `style.css`, not inline JavaScript
- Do **not** use TailwindCSS, Bootstrap, or any CSS framework

---

## Coding Standards

### Before modifying any file

1. Read the relevant section of `app.js` — the file is ~1237 lines
2. Check `gameState` to see if the required property already exists
3. Review `dialogue_tree.json` before adding or modifying story nodes

### When adding new features

- New functions in `app.js` → use camelCase naming, add a comment block explaining purpose
- New DOM elements in `index.html` → must have a unique `id` attribute
- New styles → add to `style.css` under the relevant section

### When modifying AI prompts

- Validate JSON schema changes against `parseDynamicNodeJSON()` before deploying
- Never rename response fields without updating the parser at the same time

### When adding new story nodes

1. Add the node to `dialogue_tree.json` following the schema above
2. Update the system prompt in `submitCustomResponse()` and `submitChoiceAsResponse()` to reference the new node
3. Update the Story Map in this file

---

## Prohibited Actions

- ❌ Never commit the `.env` file
- ❌ Never expose `GEMINI_API_KEY` in any frontend code
- ❌ Never use `eval()` or pass unsanitized user input into `innerHTML` (XSS risk)
- ❌ Never remove the rate limiter on `/api/generate`
- ❌ Never rename the localStorage key `oracle_chan_vn_save` (will break existing saves)
- ❌ Never delete the fallback node in `parseDynamicNodeJSON()` (required for graceful AI error recovery)

---

## Debugging Reference

| Symptom | Where to Look |
|---|---|
| AI does not respond | Check `.env` for `GEMINI_API_KEY`; check rate limit; inspect Network tab `/api/generate` |
| Node not found | Look for `console.error("Node not found:")` |
| Save/Load broken | Verify localStorage key matches `oracle_chan_vn_save` exactly |
| Sprite not displaying | Check `SPRITES` object and file paths in `public/assets/` |
| Background not changing | Check `BACKGROUNDS` object and node's `background` field value |
| JSON parse error | Inspect raw Gemini response in Network tab or server logs |
