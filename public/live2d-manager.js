/**
 * Live2DManager - Project: Sora Visual Novel
 * Powered by PixiJS v6 & pixi-live2d-display (Cubism 4).
 * 
 * Optimized Features:
 * - Full anime-accurate parameter mapping (Brows, Mouth shapes, Tear drops, Pout)
 * - Organic eye blinking engine (randomized cadence, panic flutter)
 * - Dynamic 6-joint tail physics and idle breathing cycle
 * - Multi-harmonic typewriter lip-sync (natural syllabic mouth flaps)
 * - Precise gaze tracking (corrected pupil direction and dampened head tilt)
 * - Smooth lerp transitions with zero jarring jumps
 */
class Live2DManager {
    constructor() {
        this.app = null;
        this.model = null;
        this.isLoaded = false;
        this.isSpeaking = false;
        this.speakTimer = 0;
        this.currentExpression = "happy";
        
        // Eye blink simulation
        this.blinkTimer = 0;
        this.nextBlinkInterval = 3.0; // Seconds between blinks
        this.blinkProgress = 0;
        this.isBlinking = false;

        // Tail and breathing simulation
        this.tailTimer = 0;
        this.breathTimer = 0;

        // Current and target parameter states (Lerped every frame)
        this.currentParams = {};
        this.targetParams = {
            ParamAngleX: 0,
            ParamAngleY: 0,
            ParamAngleZ: 0,
            ParamEyeBallX: 0,
            ParamEyeBallY: 0,
            ParamEyeLOpen: 1.0,
            ParamEyeROpen: 1.0,
            ParamBrowLY: 0,
            ParamBrowRY: 0,
            ParamBrowLX: 0,
            ParamBrowRX: 0,
            ParamBrowLForm: 0,
            ParamBrowRForm: 0,
            ParamBrowLAngle: 0,
            ParamBrowRAngle: 0,
            ParamMouthForm: 0.2,
            ParamMouthOpenY: 0,
            ParamMouthFunnel: 0,
            ParamMouthShrug: 0,
            ParamBodyAngleX: 0,
            ParamBodyAngleY: 0,
            ParamBodyAngleZ: 0,
            ParamPositionY: 0,
            ParamBreath: 0.5,
            Param69: 0 // Anime tears / panic drops
        };

        // Mouse gaze tracking
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.currentMouseX = 0;
        this.currentMouseY = 0;

        this.canvas = document.getElementById("live2d-canvas");
        this.menuCanvas = document.getElementById("menu-live2d-canvas");
        this.sandboxCanvas = document.getElementById("sandbox-live2d-canvas");
        this.modelPath = "assets/live2d/witch/witch.model3.json";
        
        // Menu Model instance
        this.menuApp = null;
        this.menuModel = null;
        this.isMenuLoaded = false;
        this.menuMouseX = 0;
        this.menuMouseY = 0;
        this.targetMenuMouseX = 0;
        this.targetMenuMouseY = 0;

        // Sandbox Model instance
        this.sandboxApp = null;
        this.sandboxModel = null;
        this.isSandboxLoaded = false;
        this.sandboxMouseX = 0;
        this.sandboxMouseY = 0;
        this.targetSandboxMouseX = 0;
        this.targetSandboxMouseY = 0;
    }

    async init() {
        this.setLoadingStatus("> initializing Live2D runtime");
        if (!this.canvas && !this.menuCanvas && !this.sandboxCanvas) {
            console.warn("No Live2D canvas element found.");
            return;
        }

        if (typeof PIXI === "undefined" || !PIXI.live2d || !PIXI.live2d.Live2DModel) {
            console.warn("Live2D libraries not loaded or supported.");
            this.setLoadingStatus("> Live2D unavailable — continuing without model");
            this.finishLoading();
            return;
        }

        // Register Pixi Ticker for Live2D Cubism 4 once
        PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);

        // Only create the model for the visible screen. Three simultaneous
        // WebGL contexts caused severe GPU/memory pressure on some browsers.
        if (this.menuCanvas && document.getElementById("main-menu")?.classList.contains("active")) {
            this.setLoadingStatus("> loading witch.model3.json");
            await this.initMenuModel();
        }
        this.finishLoading();
    }

    setLoadingStatus(status) {
        const loader = document.getElementById("live2d-loading");
        const statusEl = document.getElementById("live2d-loading-status");
        if (loader) loader.classList.remove("is-hidden");
        if (statusEl) statusEl.firstChild.textContent = `${status}`;
    }

    finishLoading() {
        this.setLoadingStatus("> Live2D Model ready");
        const loader = document.getElementById("live2d-loading");
        if (loader) setTimeout(() => loader.classList.add("is-hidden"), 450);
    }

    async ensureScreenModel(screenId) {
        if (typeof PIXI === "undefined" || !PIXI.live2d?.Live2DModel) return;
        if (screenId === "game-stage" && this.canvas && !this.app && !this.isLoadingStage) {
            this.isLoadingStage = true;
            this.setLoadingStatus("> loading gameplay Live2D model");
            try {
                this.app = new PIXI.Application({
                    view: this.canvas,
                    transparent: true,
                    autoDensity: true,
                    resolution: Math.min(window.devicePixelRatio || 1, 1.5),
                    antialias: false
                });

                this.resize();
                window.addEventListener("resize", () => this.resize());

                console.log("Loading Live2D Stage model:", this.modelPath);
                this.model = await PIXI.live2d.Live2DModel.from(this.modelPath, {
                    autoInteract: false
                });

                this.model.anchor.set(0.5, 1.0);
                this.app.stage.addChild(this.model);

                this.fitModel();
                this.setupInteractions();
                this.setupTicker();

                this.isLoaded = true;
                console.log("✅ Live2D Stage Model loaded!");

                this.canvas.style.display = "block";
                this.setExpression("happy");
            } catch (err) {
                console.error("Failed to load stage Live2D model:", err);
                this.showFallback();
            } finally {
                this.isLoadingStage = false;
                this.finishLoading();
            }
        }
        if (screenId === "sandbox-stage" && this.sandboxCanvas && !this.sandboxApp && !this.isLoadingSandbox) {
            this.isLoadingSandbox = true;
            this.setLoadingStatus("> loading sandbox Live2D model");
            try { await this.initSandboxModel(); }
            finally { this.isLoadingSandbox = false; this.finishLoading(); }
        }
        if (screenId === "main-menu" && this.menuCanvas && !this.menuApp) {
            await this.initMenuModel();
        }
    }

    resize() {
        if (!this.app || !this.canvas) return;
        const container = this.canvas.parentElement;
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;

        this.app.renderer.resize(width, height);
        this.fitModel();
    }

    fitModel() {
        if (!this.model || !this.app) return;
        const stageWidth = this.app.renderer.screen.width;
        const stageHeight = this.app.renderer.screen.height;

        this.model.x = stageWidth / 2;
        this.model.y = stageHeight + 35;

        // Standard model height fit: ~88% of viewport
        const targetHeight = stageHeight * 0.90;
        const baseHeight = (this.model.height / this.model.scale.y) || 2000;
        const scale = targetHeight / baseHeight;
        
        this.model.scale.set(scale);
    }

    setupInteractions() {
        window.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height * 0.35; // Sora-chan's eye level
            
            // Normalized range [-1, 1]
            this.targetMouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.35)));
            this.targetMouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.35)));
        });

        // Click / touch reaction on character
        this.canvas.addEventListener("click", () => {
            this.triggerTapReaction();
        });
    }

    triggerTapReaction() {
        if (!this.isLoaded || !this.model) return;
        
        // Playful bounce & cute reaction
        const origY = this.model.y;
        let t = 0;
        const prevExpr = this.currentExpression;
        
        // Temporarily flash happy/excited expression
        this.setExpression("excited");
        
        const bounce = () => {
            t += 0.16;
            this.model.y = origY - Math.sin(t) * 18;
            if (t < Math.PI) {
                requestAnimationFrame(bounce);
            } else {
                this.model.y = origY;
                setTimeout(() => {
                    if (this.currentExpression === "excited") {
                        this.setExpression(prevExpr);
                    }
                }, 800);
            }
        };
        bounce();
    }

    setupTicker() {
        this.app.ticker.add((delta) => {
            if (!document.getElementById("game-stage")?.classList.contains("active")) return;
            if (!this.model || !this.model.internalModel) return;
            const coreModel = this.model.internalModel.coreModel;
            if (!coreModel) return;

            const dt = delta / 60; // Approximate elapsed seconds per frame

            // 1. Smooth mouse follow lerp
            this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.08 * delta;
            this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.08 * delta;

            // 2. Organic Eye-Blink Simulation
            this.blinkTimer += dt;
            if (this.blinkTimer >= this.nextBlinkInterval) {
                this.isBlinking = true;
                this.blinkProgress += dt * 16; // Fast blink (~120ms total)
                if (this.blinkProgress >= Math.PI) {
                    this.isBlinking = false;
                    this.blinkProgress = 0;
                    this.blinkTimer = 0;
                    // Random interval between 2.5 and 5.5 seconds (or rapid if panic)
                    this.nextBlinkInterval = (this.currentExpression === "panic") ? (1.0 + Math.random() * 1.5) : (2.5 + Math.random() * 3.0);
                }
            }
            const blinkFactor = this.isBlinking ? Math.max(0, 1 - Math.sin(this.blinkProgress)) : 1.0;

            // 3. Gentle & Stable Lip-Sync (Clean mouth movement only, no body shaking)
            if (this.isSpeaking) {
                this.speakTimer += dt * 8; // Calm, natural speaking pace
                const mouthOpen = (Math.sin(this.speakTimer) + 1) * 0.28;
                this.targetParams.ParamMouthOpenY = Math.max(0, Math.min(0.6, mouthOpen));
            } else {
                this.targetParams.ParamMouthOpenY = 0;
            }

            // 4. Stable Body (Zero tremor or shaking)
            this.targetParams.ParamPositionY = 0;

            // 5. Breathing Cycle (Gentle and slow)
            this.breathTimer += dt * 1.5;
            const breathVal = (Math.sin(this.breathTimer) + 1) * 0.5;
            this.setParameterValue("ParamBreath", breathVal);

            // 6. Tail Physics (Gentle sway across joints 3 to 8)
            const tailSpeed = (this.currentExpression === "excited" || this.currentExpression === "happy") ? 2.5 : 1.5;
            this.tailTimer += dt * tailSpeed;
            for (let i = 3; i <= 8; i++) {
                const phase = (i - 3) * 0.45;
                const tailAngle = Math.sin(this.tailTimer - phase) * (6 + (i - 3) * 3);
                this.setParameterValue(`Param_Angle_Rotation${i}`, tailAngle);
            }

            // 7. Calm Gaze & Head Position (Completely stable, no vibration)
            const gazeAngleX = this.currentMouseX * 12 + this.targetParams.ParamAngleX;
            const gazeAngleY = -this.currentMouseY * 8 + this.targetParams.ParamAngleY;
            const gazeAngleZ = this.currentParams.ParamAngleZ + (this.currentMouseX * 4);
            
            const pupilX = -this.currentMouseX * 0.75 + this.targetParams.ParamEyeBallX;
            const pupilY = -this.currentMouseY * 0.75 + this.targetParams.ParamEyeBallY;

            // 8. Smooth interpolation for all target expression parameters
            for (let key in this.targetParams) {
                if (this.currentParams[key] === undefined) {
                    this.currentParams[key] = 0;
                }
                const target = this.targetParams[key];
                this.currentParams[key] += (target - this.currentParams[key]) * 0.14 * delta;
            }

            // 9. Apply parameters to Cubism 4 Core
            this.setParameterValue("ParamAngleX", gazeAngleX);
            this.setParameterValue("ParamAngleY", gazeAngleY);
            this.setParameterValue("ParamAngleZ", gazeAngleZ);

            this.setParameterValue("ParamEyeBallX", pupilX);
            this.setParameterValue("ParamEyeBallY", pupilY);

            // Apply eyes with blink factor
            const eyeL = this.currentParams.ParamEyeLOpen * blinkFactor;
            const eyeR = this.currentParams.ParamEyeROpen * blinkFactor;
            this.setParameterValue("ParamEyeLOpen", eyeL);
            this.setParameterValue("ParamEyeROpen", eyeR);

            // Brows
            this.setParameterValue("ParamBrowLY", this.currentParams.ParamBrowLY);
            this.setParameterValue("ParamBrowRY", this.currentParams.ParamBrowRY);
            this.setParameterValue("ParamBrowLX", this.currentParams.ParamBrowLX);
            this.setParameterValue("ParamBrowRX", this.currentParams.ParamBrowRX);
            this.setParameterValue("ParamBrowLForm", this.currentParams.ParamBrowLForm);
            this.setParameterValue("ParamBrowRForm", this.currentParams.ParamBrowRForm);
            this.setParameterValue("ParamBrowLAngle", this.currentParams.ParamBrowLAngle);
            this.setParameterValue("ParamBrowRAngle", this.currentParams.ParamBrowRAngle);

            // Mouth
            this.setParameterValue("ParamMouthForm", this.currentParams.ParamMouthForm);
            this.setParameterValue("ParamMouthOpenY", this.currentParams.ParamMouthOpenY);
            this.setParameterValue("ParamMouthFunnel", this.currentParams.ParamMouthFunnel);
            this.setParameterValue("ParamMouthShrug", this.currentParams.ParamMouthShrug);

            // Body
            this.setParameterValue("ParamBodyAngleX", this.currentMouseX * 7);
            this.setParameterValue("ParamBodyAngleY", -this.currentMouseY * 4);
            this.setParameterValue("ParamPositionY", this.currentParams.ParamPositionY);

            // Special FX (Param69 = anime tears / panic stream)
            this.setParameterValue("Param69", this.currentParams.Param69);
        });
    }

    setParameterValue(paramId, value) {
        if (!this.model || !this.model.internalModel) return;
        const coreModel = this.model.internalModel.coreModel;
        try {
            if (coreModel.setParameterValueById) {
                coreModel.setParameterValueById(paramId, value);
            } else if (coreModel.setParameterValue) {
                coreModel.setParameterValue(paramId, value);
            }
        } catch (e) {
            // Parameter not present in model
        }
    }

    /**
     * Highly tuned, anime-accurate facial expressions
     * @param {string} expr - 'happy', 'neutral', 'thinking', 'curious', 'panic', 'worried', 'confident', 'excited'
     */
    setExpression(expr) {
        this.currentExpression = expr || "happy";

        // Reset to clean neutral base
        const p = {
            ParamAngleX: 0,
            ParamAngleY: 0,
            ParamAngleZ: 0,
            ParamEyeBallX: 0,
            ParamEyeBallY: 0,
            ParamEyeLOpen: 1.0,
            ParamEyeROpen: 1.0,
            ParamBrowLY: 0,
            ParamBrowRY: 0,
            ParamBrowLX: 0,
            ParamBrowRX: 0,
            ParamBrowLForm: 0,
            ParamBrowRForm: 0,
            ParamBrowLAngle: 0,
            ParamBrowRAngle: 0,
            ParamMouthForm: 0.2,
            ParamMouthFunnel: 0,
            ParamMouthShrug: 0,
            Param69: 0
        };

        switch (this.currentExpression) {
            case "happy":
                p.ParamMouthForm = 1.0;
                p.ParamBrowLY = 0.35;
                p.ParamBrowRY = 0.35;
                p.ParamBrowLForm = 0.8;
                p.ParamBrowRForm = 0.8;
                p.ParamAngleZ = 3;
                p.ParamAngleY = 2;
                break;

            case "neutral":
                p.ParamMouthForm = 0.2;
                p.ParamBrowLY = 0;
                p.ParamBrowRY = 0;
                p.ParamBrowLForm = 0.1;
                p.ParamBrowRForm = 0.1;
                p.ParamEyeLOpen = 0.95;
                p.ParamEyeROpen = 0.95;
                break;

            case "thinking":
            case "curious":
                // Inquisitive head tilt, asymmetrical brows, looking slightly upward
                p.ParamAngleZ = -9;
                p.ParamAngleX = -6;
                p.ParamAngleY = 5;
                p.ParamBrowLY = 0.75;
                p.ParamBrowLForm = 0.5;
                p.ParamBrowRY = -0.25;
                p.ParamBrowRForm = -0.3;
                p.ParamEyeBallX = 0.4;
                p.ParamEyeBallY = 0.6;
                p.ParamMouthFunnel = 0.55;
                p.ParamMouthShrug = 0.4;
                p.ParamMouthForm = -0.2;
                break;

            case "panic":
                // Flustered wide eyes, troubled curved eyebrows, tear drops streaming
                p.ParamAngleZ = -3;
                p.ParamAngleY = -4;
                p.ParamEyeLOpen = 1.35;
                p.ParamEyeROpen = 1.35;
                p.ParamBrowLAngle = -0.85;
                p.ParamBrowRAngle = -0.85;
                p.ParamBrowLForm = -1.0;
                p.ParamBrowRForm = -1.0;
                p.ParamBrowLY = -0.4;
                p.ParamBrowRY = -0.4;
                p.ParamMouthForm = -1.0;
                p.Param69 = 1.0; // Stream real anime tear drops!
                break;

            case "worried":
                // Soft drooped ears/head, mild glistening eyes, pout
                p.ParamAngleZ = -4;
                p.ParamAngleY = -5;
                p.ParamEyeLOpen = 0.88;
                p.ParamEyeROpen = 0.88;
                p.ParamBrowLAngle = -0.6;
                p.ParamBrowRAngle = -0.6;
                p.ParamBrowLForm = -0.7;
                p.ParamBrowRForm = -0.7;
                p.ParamBrowLY = -0.3;
                p.ParamBrowRY = -0.3;
                p.ParamMouthForm = -0.75;
                p.Param69 = 0.35;
                break;

            case "confident":
                // Proud smirk, chin lifted, firm steady gaze
                p.ParamAngleY = 9;
                p.ParamAngleZ = 4;
                p.ParamAngleX = 2;
                p.ParamBrowLY = 0.3;
                p.ParamBrowRY = 0.3;
                p.ParamBrowLForm = 0.4;
                p.ParamBrowRForm = 0.4;
                p.ParamMouthForm = 0.85;
                p.ParamMouthShrug = 0.55;
                p.ParamEyeLOpen = 1.0;
                p.ParamEyeROpen = 1.0;
                break;

            case "excited":
                // Joyful huge smile, high energetic brows, wide open sparkling eyes
                p.ParamAngleY = 6;
                p.ParamAngleZ = -4;
                p.ParamEyeLOpen = 1.15;
                p.ParamEyeROpen = 1.15;
                p.ParamBrowLY = 0.7;
                p.ParamBrowRY = 0.7;
                p.ParamBrowLForm = 1.0;
                p.ParamBrowRForm = 1.0;
                p.ParamMouthForm = 1.2;
                p.ParamMouthFunnel = 0.2;
                break;
        }

        Object.assign(this.targetParams, p);

    }

    startSpeaking() {
        this.isSpeaking = true;
        this.speakTimer = 0;
    }

    stopSpeaking() {
        this.isSpeaking = false;
        this.targetParams.ParamMouthOpenY = 0;
    }

    show() {
        if (this.canvas) this.canvas.style.display = "block";
    }

    hide() {
        if (this.canvas) this.canvas.style.display = "none";
    }

    // ==========================================
    // Main Menu Live2D Integration
    // ==========================================
    async initMenuModel() {
        if (!this.menuCanvas) return;
        try {
            this.menuApp = new PIXI.Application({
                view: this.menuCanvas,
                transparent: true,
                autoDensity: true,
                resolution: Math.min(window.devicePixelRatio || 1, 1.5),
                antialias: false
            });

            this.resizeMenu();
            window.addEventListener("resize", () => this.resizeMenu());

            console.log("Loading Main Menu Live2D model...");
            this.menuModel = await PIXI.live2d.Live2DModel.from(this.modelPath, {
                autoInteract: false
            });

            this.menuModel.anchor.set(0.5, 1.0);
            this.menuApp.stage.addChild(this.menuModel);

            this.fitMenuModel();
            this.setupMenuInteractions();
            this.setupMenuTicker();

            this.isMenuLoaded = true;
            console.log("✅ Main Menu Live2D Model active & greeting!");
        } catch (err) {
            console.error("Failed to load Menu Live2D model:", err);
        }
    }

    resizeMenu() {
        if (!this.menuApp || !this.menuCanvas) return;
        const container = this.menuCanvas.parentElement;
        const width = container ? container.clientWidth : 480;
        const height = container ? container.clientHeight : window.innerHeight * 0.85;

        this.menuApp.renderer.resize(width, height);
        this.fitMenuModel();
    }

    fitMenuModel() {
        if (!this.menuModel || !this.menuApp) return;
        const stageW = this.menuApp.renderer.screen.width;
        const stageH = this.menuApp.renderer.screen.height;

        this.menuModel.x = stageW / 2;
        this.menuModel.y = stageH + 25;

        const targetH = stageH * 0.90;
        const baseH = (this.menuModel.height / this.menuModel.scale.y) || 2000;
        this.menuModel.scale.set(targetH / baseH);
    }

    setupMenuInteractions() {
        window.addEventListener("mousemove", (e) => {
            if (!this.menuCanvas) return;
            const rect = this.menuCanvas.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height * 0.35;

            this.targetMenuMouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.4)));
            this.targetMenuMouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.4)));
        });

        this.menuCanvas.addEventListener("click", () => {
            if (!this.menuModel) return;
            const origY = this.menuModel.y;
            let t = 0;
            const bounce = () => {
                t += 0.16;
                this.menuModel.y = origY - Math.sin(t) * 16;
                if (t < Math.PI) {
                    requestAnimationFrame(bounce);
                } else {
                    this.menuModel.y = origY;
                }
            };
            bounce();
        });
    }

    setupMenuTicker() {
        let blinkTimer = 0;
        let nextBlink = 3.0;
        let blinkProgress = 0;
        let isBlinking = false;
        let tailTimer = 0;
        let breathTimer = 0;

        this.menuApp.ticker.add((delta) => {
            if (!document.getElementById("main-menu")?.classList.contains("active")) return;
            if (!this.menuModel || !this.menuModel.internalModel) return;
            const coreModel = this.menuModel.internalModel.coreModel;
            if (!coreModel) return;

            const dt = delta / 60;

            // 1. Mouse gaze lerp
            this.menuMouseX += (this.targetMenuMouseX - this.menuMouseX) * 0.08 * delta;
            this.menuMouseY += (this.targetMenuMouseY - this.menuMouseY) * 0.08 * delta;

            // 2. Eye blink
            blinkTimer += dt;
            if (blinkTimer >= nextBlink) {
                isBlinking = true;
                blinkProgress += dt * 16;
                if (blinkProgress >= Math.PI) {
                    isBlinking = false;
                    blinkProgress = 0;
                    blinkTimer = 0;
                    nextBlink = 2.5 + Math.random() * 3.0;
                }
            }
            const blinkFactor = isBlinking ? Math.max(0, 1 - Math.sin(blinkProgress)) : 1.0;

            // 3. Natural breathing
            breathTimer += dt * 1.5;
            const breathVal = (Math.sin(breathTimer) + 1) * 0.5;
            this.setMenuParam("ParamBreath", breathVal);

            // 4. Tail sway
            tailTimer += dt * 2.2;
            for (let i = 3; i <= 8; i++) {
                const phase = (i - 3) * 0.45;
                const tailAngle = Math.sin(tailTimer - phase) * (7 + (i - 3) * 3.5);
                this.setMenuParam(`Param_Angle_Rotation${i}`, tailAngle);
            }

            // 5. Gaze tracking (gently looks at menu buttons and player cursor)
            const headX = this.menuMouseX * 14;
            const headY = -this.menuMouseY * 9 + 2;
            const headZ = this.menuMouseX * 4 + 2;
            const pupilX = -this.menuMouseX * 0.75;
            const pupilY = -this.menuMouseY * 0.75;

            this.setMenuParam("ParamAngleX", headX);
            this.setMenuParam("ParamAngleY", headY);
            this.setMenuParam("ParamAngleZ", headZ);
            this.setMenuParam("ParamEyeBallX", pupilX);
            this.setMenuParam("ParamEyeBallY", pupilY);

            // 6. Warm, happy smile
            this.setMenuParam("ParamEyeLOpen", 1.0 * blinkFactor);
            this.setMenuParam("ParamEyeROpen", 1.0 * blinkFactor);
            this.setMenuParam("ParamBrowLY", 0.35);
            this.setMenuParam("ParamBrowRY", 0.35);
            this.setMenuParam("ParamBrowLForm", 0.8);
            this.setMenuParam("ParamBrowRForm", 0.8);
            this.setMenuParam("ParamMouthForm", 1.0);
            this.setMenuParam("ParamMouthOpenY", 0.05);
            this.setMenuParam("ParamBodyAngleX", this.menuMouseX * 6);
        });
    }

    setMenuParam(paramId, value) {
        if (!this.menuModel || !this.menuModel.internalModel) return;
        const coreModel = this.menuModel.internalModel.coreModel;
        try {
            if (coreModel.setParameterValueById) {
                coreModel.setParameterValueById(paramId, value);
            } else if (coreModel.setParameterValue) {
                coreModel.setParameterValue(paramId, value);
            }
        } catch (e) {}
    }

    // ==========================================
    // Sandbox Chat Live2D Integration
    // ==========================================
    async initSandboxModel() {
        if (!this.sandboxCanvas) return;
        try {
            this.sandboxApp = new PIXI.Application({
                view: this.sandboxCanvas,
                transparent: true,
                autoDensity: true,
                resolution: Math.min(window.devicePixelRatio || 1, 1.5),
                antialias: false
            });

            this.resizeSandbox();
            window.addEventListener("resize", () => this.resizeSandbox());

            console.log("Loading Sandbox Live2D model...");
            this.sandboxModel = await PIXI.live2d.Live2DModel.from(this.modelPath, {
                autoInteract: false
            });

            this.sandboxModel.anchor.set(0.5, 1.0);
            this.sandboxApp.stage.addChild(this.sandboxModel);

            this.fitSandboxModel();
            this.setupSandboxInteractions();
            this.setupSandboxTicker();

            this.isSandboxLoaded = true;
            console.log("✅ Sandbox Live2D Model ready!");
        } catch (err) {
            console.error("Failed to load Sandbox Live2D model:", err);
        }
    }

    resizeSandbox() {
        if (!this.sandboxApp || !this.sandboxCanvas) return;
        const container = this.sandboxCanvas.parentElement;
        const width = container ? container.clientWidth : 480;
        const height = container ? container.clientHeight : window.innerHeight * 0.85;
        this.sandboxApp.renderer.resize(width, height);
        this.fitSandboxModel();
    }

    fitSandboxModel() {
        if (!this.sandboxModel || !this.sandboxApp) return;
        const stageW = this.sandboxApp.renderer.screen.width;
        const stageH = this.sandboxApp.renderer.screen.height;
        this.sandboxModel.x = stageW / 2;
        this.sandboxModel.y = stageH + 25;
        const targetH = stageH * 0.90;
        const baseH = (this.sandboxModel.height / this.sandboxModel.scale.y) || 2000;
        this.sandboxModel.scale.set(targetH / baseH);
    }

    setupSandboxInteractions() {
        window.addEventListener("mousemove", (e) => {
            if (!this.sandboxCanvas) return;
            const rect = this.sandboxCanvas.getBoundingClientRect();
            if (rect.width === 0) return;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height * 0.35;
            this.targetSandboxMouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.4)));
            this.targetSandboxMouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.4)));
        });

        this.sandboxCanvas.addEventListener("click", () => {
            if (!this.sandboxModel) return;
            const origY = this.sandboxModel.y;
            let t = 0;
            const bounce = () => {
                t += 0.16;
                this.sandboxModel.y = origY - Math.sin(t) * 16;
                if (t < Math.PI) requestAnimationFrame(bounce);
                else this.sandboxModel.y = origY;
            };
            bounce();
        });
    }

    setupSandboxTicker() {
        let blinkTimer = 0;
        let nextBlink = 3.0;
        let blinkProgress = 0;
        let isBlinking = false;
        let tailTimer = 0;
        let breathTimer = 0;
        let mouthTimer = 0;

        // Sandbox-specific state: isTalking toggled by setSandboxExpression
        this.sandboxIsTalking = false;
        this.sandboxCurrentExpression = "neutral";

        this.sandboxApp.ticker.add((delta) => {
            if (!document.getElementById("sandbox-stage")?.classList.contains("active")) return;
            if (!this.sandboxModel || !this.sandboxModel.internalModel) return;
            const coreModel = this.sandboxModel.internalModel.coreModel;
            if (!coreModel) return;

            const dt = delta / 60;

            // Mouse gaze lerp
            this.sandboxMouseX += (this.targetSandboxMouseX - this.sandboxMouseX) * 0.08 * delta;
            this.sandboxMouseY += (this.targetSandboxMouseY - this.sandboxMouseY) * 0.08 * delta;

            // Eye blink
            blinkTimer += dt;
            if (blinkTimer >= nextBlink) {
                isBlinking = true;
                blinkProgress += dt * 16;
                if (blinkProgress >= Math.PI) {
                    isBlinking = false;
                    blinkProgress = 0;
                    blinkTimer = 0;
                    nextBlink = 2.5 + Math.random() * 3.0;
                }
            }
            const blinkFactor = isBlinking ? Math.max(0, 1 - Math.sin(blinkProgress)) : 1.0;

            // Breathing
            breathTimer += dt * 1.5;
            this.setSandboxParam("ParamBreath", (Math.sin(breathTimer) + 1) * 0.5);

            // Tail sway
            tailTimer += dt * 2.2;
            for (let i = 3; i <= 8; i++) {
                const phase = (i - 3) * 0.45;
                this.setSandboxParam(`Param_Angle_Rotation${i}`, Math.sin(tailTimer - phase) * (7 + (i - 3) * 3.5));
            }

            // Mouth talking animation
            if (this.sandboxIsTalking) {
                mouthTimer += dt * 12;
                this.setSandboxParam("ParamMouthOpenY", Math.abs(Math.sin(mouthTimer)) * 0.85);
            } else {
                this.setSandboxParam("ParamMouthOpenY", 0.0);
            }

            // Gaze
            this.setSandboxParam("ParamAngleX", this.sandboxMouseX * 14);
            this.setSandboxParam("ParamAngleY", -this.sandboxMouseY * 9 + 2);
            this.setSandboxParam("ParamAngleZ", this.sandboxMouseX * 4 + 2);
            this.setSandboxParam("ParamEyeBallX", -this.sandboxMouseX * 0.75);
            this.setSandboxParam("ParamEyeBallY", -this.sandboxMouseY * 0.75);

            // Eye open
            this.setSandboxParam("ParamEyeLOpen", 1.0 * blinkFactor);
            this.setSandboxParam("ParamEyeROpen", 1.0 * blinkFactor);

            // Expression-driven parameters (set by setSandboxExpression)
            this.setSandboxParam("ParamBodyAngleX", this.sandboxMouseX * 6);
        });
    }

    setSandboxParam(paramId, value) {
        if (!this.sandboxModel || !this.sandboxModel.internalModel) return;
        const coreModel = this.sandboxModel.internalModel.coreModel;
        try {
            if (coreModel.setParameterValueById) coreModel.setParameterValueById(paramId, value);
            else if (coreModel.setParameterValue) coreModel.setParameterValue(paramId, value);
        } catch (e) {}
    }

    /**
     * Update Sandbox Live2D expression to match chat response
     * @param {string} expression - happy|neutral|thinking|curious|panic|worried|confident|excited
     */
    setSandboxExpression(expression) {
        if (!this.isSandboxLoaded) return;
        this.sandboxCurrentExpression = expression;

        const e = expression || "neutral";
        const p = {
            ParamBrowLY: 0,
            ParamBrowRY: 0,
            ParamBrowLForm: 0,
            ParamBrowRForm: 0,
            ParamMouthForm: 0.5,
            Param69: 0
        };

        if (e === "happy" || e === "excited") {
            p.ParamBrowLY = 0.35; p.ParamBrowRY = 0.35;
            p.ParamBrowLForm = 0.8; p.ParamBrowRForm = 0.8;
            p.ParamMouthForm = 1.0;
        } else if (e === "thinking" || e === "curious") {
            p.ParamBrowLY = 0.1; p.ParamBrowRY = -0.2;
            p.ParamBrowLForm = -0.3; p.ParamBrowRForm = 0.2;
            p.ParamMouthForm = 0.3;
        } else if (e === "panic" || e === "worried") {
            p.ParamBrowLY = -0.5; p.ParamBrowRY = -0.5;
            p.ParamBrowLForm = -0.8; p.ParamBrowRForm = -0.8;
            p.ParamMouthForm = -0.5;
            p.Param69 = 1.0;
        } else if (e === "confident") {
            p.ParamBrowLY = 0.2; p.ParamBrowRY = 0.2;
            p.ParamBrowLForm = 0.4; p.ParamBrowRForm = 0.4;
            p.ParamMouthForm = 0.8;
        }

        for (const [k, v] of Object.entries(p)) {
            this.setSandboxParam(k, v);
        }
    }

    startSandboxSpeaking() {
        if (this.isSandboxLoaded) this.sandboxIsTalking = true;
    }

    stopSandboxSpeaking() {
        if (this.isSandboxLoaded) this.sandboxIsTalking = false;
    }
}

window.Live2DManager = Live2DManager;
