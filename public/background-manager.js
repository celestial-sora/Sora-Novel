/**
 * BackgroundManager - Project: Sora Visual Novel
 * Manages video backgrounds, smooth cross-fades, and ambient particle effects.
 * Completely stable: zero zoom, zero jitter/shaking.
 */
class BackgroundManager {
    constructor() {
        this.container = document.getElementById("bg-layer");
        this.videoEl = null;
        this.layerA = null;
        this.layerB = null;
        this.activeLayer = "A";
        this.canvas = null;
        this.ctx = null;
        this.currentBg = "";
        this.currentUrl = "";
        this.particles = [];
        this.animFrameId = null;

        this.init();
    }

    init() {
        if (!this.container) return;

        // Container is completely fixed and static (no transform, no zoom)
        this.container.innerHTML = "";
        this.container.style.position = "absolute";
        this.container.style.top = "0";
        this.container.style.left = "0";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.overflow = "hidden";
        this.container.style.transform = "none";

        // 1. Video background layer (christmas living room mp4)
        this.videoEl = document.createElement("video");
        this.videoEl.id = "bg-video";
        this.videoEl.className = "bg-video-layer active";
        this.videoEl.autoplay = true;
        this.videoEl.loop = true;
        this.videoEl.muted = true;
        this.videoEl.playsInline = true;
        this.videoEl.src = "assets/bg_living_room.mp4";
        this.container.appendChild(this.videoEl);

        // Try playing video safely
        const playPromise = this.videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.log("Autoplay waiting for user gesture:", err);
            });
        }

        // 2. Dual image layers for smooth cross-fades
        this.layerA = document.createElement("div");
        this.layerA.className = "bg-crossfade-layer";
        this.container.appendChild(this.layerA);

        this.layerB = document.createElement("div");
        this.layerB.className = "bg-crossfade-layer";
        this.container.appendChild(this.layerB);

        // 3. Ambient particles canvas
        this.canvas = document.createElement("canvas");
        this.canvas.id = "bg-particle-canvas";
        this.canvas.className = "bg-particle-canvas";
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());

        this.setupParticlesForScene("office_desk");
        this.startParticleLoop();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Smoothly transitions to a new background (video or image)
     * @param {string} bgUrl - Media path/URL (.mp4 or .jpg/.png)
     * @param {string} bgKey - Key such as office_desk, living_room, server_crash
     */
    transitionTo(bgUrl, bgKey) {
        if (this.currentBg === bgKey && this.currentUrl === bgUrl) return;
        this.currentBg = bgKey;
        this.currentUrl = bgUrl;

        const isVideo = bgUrl.endsWith(".mp4") || bgKey === "office_desk" || bgKey === "living_room";

        if (isVideo) {
            // Activate video background smoothly
            if (this.videoEl) {
                if (!this.videoEl.src.includes(bgUrl)) {
                    this.videoEl.src = bgUrl;
                }
                this.videoEl.classList.add("active");
                this.videoEl.play().catch(() => {});
            }
            if (this.layerA) this.layerA.classList.remove("active");
            if (this.layerB) this.layerB.classList.remove("active");
        } else {
            // Fade out video, crossfade into target image layer
            if (this.videoEl) {
                this.videoEl.classList.remove("active");
            }
            const incoming = this.activeLayer === "A" ? this.layerB : this.layerA;
            const outgoing = this.activeLayer === "A" ? this.layerA : this.layerB;

            incoming.style.backgroundImage = `url("${bgUrl}")`;
            incoming.classList.add("active");
            outgoing.classList.remove("active");

            this.activeLayer = this.activeLayer === "A" ? "B" : "A";
        }

        // Setup atmospheric particles
        this.setupParticlesForScene(bgKey);

        // Server crash special red alert styling
        const stage = document.getElementById("game-stage");
        if (stage) {
            if (bgKey === "server_crash") {
                stage.classList.add("server-alarm-active");
            } else {
                stage.classList.remove("server-alarm-active");
            }
        }
    }

    setupParticlesForScene(bgKey) {
        this.particles = [];
        const count = bgKey === "server_crash" ? 50 : 25;

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(bgKey));
        }
    }

    createParticle(bgKey) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (bgKey === "server_crash") {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2.5 + 1,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.6) * 3,
                color: Math.random() > 0.3 ? "rgba(255, 75, 75, " : "rgba(255, 180, 50, ",
                alpha: Math.random() * 0.6 + 0.3,
                pulseSpeed: Math.random() * 0.04 + 0.02
            };
        } else if (bgKey === "office_breakroom") {
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 3.5 + 1.5,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -(Math.random() * 0.6 + 0.2),
                color: Math.random() > 0.5 ? "rgba(255, 230, 180, " : "rgba(255, 190, 130, ",
                alpha: Math.random() * 0.35 + 0.1,
                pulseSpeed: Math.random() * 0.02 + 0.01
            };
        } else {
            // Warm cozy living room / soft light sparkles
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -(Math.random() * 0.4 + 0.1),
                color: Math.random() > 0.5 ? "rgba(255, 220, 150, " : "rgba(255, 255, 220, ",
                alpha: Math.random() * 0.45 + 0.15,
                pulseSpeed: Math.random() * 0.02 + 0.01
            };
        }
    }

    startParticleLoop() {
        const loop = () => {
            this.renderParticles();
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    renderParticles() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        for (let p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            p.alpha += Math.sin(Date.now() * p.pulseSpeed * 0.05) * 0.008;
            const clampedAlpha = Math.max(0.05, Math.min(0.75, p.alpha));

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color + clampedAlpha + ")";
            this.ctx.shadowBlur = p.size * 2;
            this.ctx.shadowColor = p.color + "0.8)";
            this.ctx.fill();
        }
    }
}

window.BackgroundManager = BackgroundManager;
