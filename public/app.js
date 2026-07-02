// พี่จู uwufufu AI Chatbot - Core Application Logic
const API_URL = "/api/generate";

// Sprites mapping
const SPRITES = {
    "happy": "assets/subaru_normal.webp",
    "neutral": "assets/subaru_larp.webp"
};

// Application State
let state = {
    chatHistory: [], // Holds array of { role: "user" | "model", text: string }
    isAILoading: false,
    soundEnabled: true
};

// Web Audio API Context for Synth Sounds
let audioCtx = null;

// Initialize App
window.addEventListener("DOMContentLoaded", () => {
    // Load sound configuration
    const savedSound = localStorage.getItem("yuki_chatbot_sound");
    if (savedSound !== null) {
        state.soundEnabled = savedSound === "true";
    }
    updateSoundButtonUI();

    setupEventListeners();
    initWelcomeChat();
});

// Setup Event Listeners
function setupEventListeners() {
    // Send Message Button
    document.getElementById("btn-send").addEventListener("click", () => {
        submitUserMessage();
    });

    // Input Keypress (Enter key)
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            submitUserMessage();
        }
    });

    // Reset Chat Button
    document.getElementById("btn-clear-chat").addEventListener("click", () => {
        playSound("click");
        if (confirm("ต้องการรีเซ็ตประวัติการคุยทั้งหมดใช่ไหม?")) {
            resetChat();
        }
    });

    // Sound Toggle Button
    document.getElementById("btn-toggle-sound").addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem("yuki_chatbot_sound", state.soundEnabled);
        playSound("click");
        updateSoundButtonUI();
        showToast(state.soundEnabled ? "เปิดเสียงประมวลผลแล้ว" : "ปิดเสียงประมวลผลแล้ว", "success");
    });
}

// Sound Synthesizer using Web Audio API (Retro Synth SFX)
function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (e) {
        console.warn("Web Audio API is not supported:", e);
        audioCtx = null;
    }
}

function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;
        
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(err => console.warn("AudioContext resume rejected:", err));
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === "click") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === "tick") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(650, now);
            gain.gain.setValueAtTime(0.008, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.02);
            osc.start(now);
            osc.stop(now + 0.02);
        } else if (type === "ding") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(1320, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === "sad") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(160, now + 0.1);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {
        console.warn("Sound play failed:", e);
    }
}

// Update Sound Toggle UI
function updateSoundButtonUI() {
    const btn = document.getElementById("btn-toggle-sound");
    if (state.soundEnabled) {
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        btn.classList.remove("muted");
    } else {
        btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        btn.classList.add("muted");
    }
}

// Initialize Chat with Welcome Message
function initWelcomeChat() {
    const defaultWelcomeText = "ยินดีต้อนรับสู่โหมดแชทอิสระครับ! คุยเรื่องอะไรกับผมก็ได้นะ หรือมีเรื่องอะไรที่อยากระบายหรืออยากให้ผมช่วยหาทางออกก็บอกได้เลยนะ! ถึงผมจะไม่ได้เก่งอะไรมาก แต่สัญญาเลยว่าไม่ทิ้งคุณไปแน่ๆ!";
    
    // Clear chat list
    const msgBox = document.getElementById("chat-messages");
    msgBox.innerHTML = "";
    
    // Set Character Sprite
    const sprite = document.getElementById("character-sprite");
    sprite.src = SPRITES["happy"];
    sprite.style.display = "block";

    // Set Initial State
    state.chatHistory = [
        { role: "model", text: defaultWelcomeText }
    ];

    addChatBubble("model", defaultWelcomeText);
}

// Reset Chat History
function resetChat() {
    initWelcomeChat();
    showToast("รีเซ็ตบทสนทนาเรียบร้อยแล้ว", "success");
}

// Submit User Message
async function submitUserMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    
    if (!text || state.isAILoading) return;

    input.value = "";
    playSound("click");

    // 1. Render user message bubble
    addChatBubble("user", text);
    state.chatHistory.push({ role: "user", text: text });

    // 2. Show inline typing indicator
    setAILoader(true);

    try {
        // Send chat history payload to backend
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history: state.chatHistory })
        });

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const data = await response.json();
        
        // Gemini returns the raw string which contains JSON fields
        let replyJson = { text: "", expression: "happy" };
        try {
            if (data.text) {
                // Parse the Gemini output string
                let cleaned = data.text.trim();
                if (cleaned.startsWith("```")) {
                    cleaned = cleaned.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
                }
                const startIdx = cleaned.indexOf("{");
                const endIdx = cleaned.lastIndexOf("}");
                if (startIdx !== -1 && endIdx !== -1) {
                    cleaned = cleaned.substring(startIdx, endIdx + 1);
                }
                replyJson = JSON.parse(cleaned);
            } else {
                throw new Error("Empty response format");
            }
        } catch (e) {
            console.warn("Response parsing failed, using raw response:", e);
            replyJson = {
                text: data.text || "ขอโทษทีครับ มีปัญหาในการจัดรูปแบบประมวลผลข้อความนิดหน่อย",
                expression: "neutral"
            };
        }

        // 3. Remove typing indicator
        setAILoader(false);

        // 4. Render model response bubble with typewriter effect
        const sprite = document.getElementById("character-sprite");
        sprite.src = SPRITES[replyJson.expression] || SPRITES["happy"];
        
        // Play bounce effect on speaking
        sprite.classList.remove("float");
        sprite.classList.add("speaking");

        playSound(replyJson.expression === "happy" ? "ding" : "sad");

        addChatBubble("model", replyJson.text, true, () => {
            sprite.classList.remove("speaking");
            sprite.classList.add("float");
        });

        // 5. Save model message in state history
        state.chatHistory.push({ role: "model", text: replyJson.text });

    } catch (error) {
        console.error("Chat submission failed:", error);
        setAILoader(false);
        playSound("sad");
        
        const errorText = "อุ๊ย... ดูเหมือนคลื่นสัญญาณจิตใต้สำนึกของผมจะติดขัดขัดข้องนิดหน่อยครับ! ลองพิมพ์ข้อความใหม่อีกครั้งได้ไหม?";
        addChatBubble("model", errorText);
        state.chatHistory.push({ role: "model", text: errorText });
    }
}

// Render Chat Bubble
function addChatBubble(sender, text, isAnimated = false, onComplete = null) {
    const msgBox = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    div.appendChild(bubble);
    msgBox.appendChild(div);
    
    // Auto-scroll to bottom of chat
    msgBox.scrollTop = msgBox.scrollHeight;

    if (isAnimated) {
        // Render typewriter animation
        let index = 0;
        bubble.innerHTML = "";
        
        function type() {
            if (index < text.length) {
                bubble.innerHTML += text.charAt(index);
                index++;
                playSound("tick");
                msgBox.scrollTop = msgBox.scrollHeight;
                setTimeout(type, 30); // 30ms per character
            } else {
                if (onComplete) onComplete();
            }
        }
        type();
    } else {
        bubble.innerHTML = text;
        if (onComplete) onComplete();
    }
}

// Inline Typing Loader Animation
function setAILoader(show) {
    state.isAILoading = show;
    const msgBox = document.getElementById("chat-messages");
    
    if (show) {
        // Append typing bubble
        if (!document.getElementById("typing-bubble")) {
            const typingBubble = document.createElement("div");
            typingBubble.id = "typing-bubble";
            typingBubble.className = "message model";
            typingBubble.innerHTML = `
                <div class="message-bubble" style="padding: 0.5rem 1rem;">
                    <div class="inline-typing-indicator"><span></span><span></span><span></span></div>
                </div>
            `;
            msgBox.appendChild(typingBubble);
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    } else {
        // Remove typing bubble
        const typingBubble = document.getElementById("typing-bubble");
        if (typingBubble) {
            typingBubble.remove();
        }
    }
}

// Toast notification helper
function showToast(message, type = "neutral") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-info-circle"></i>';
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
