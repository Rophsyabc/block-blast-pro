// ============================================================
// Block Blast Pro â€” Premium Web Engine v2.5
// Full-featured block puzzle game with AI solver, Web Worker,
// Daily Challenge, Leaderboards, Undo, Combos, and Tutorial.
// ============================================================

/**
 * Block shape definitions & family theme colors.
 * @type {Object.<string, {shape: number[][], color: string}>}
 */
const BLOCK_DECODER = {
    // Squares
    SQUARE:                     { shape: [[1,1],[1,1]],             color: '#f1c40f' },   // gold
    LARGE_SQUARE:               { shape: [[1,1,1],[1,1,1],[1,1,1]], color: '#e67e22' },   // orange

    // L-shapes (cornflower blue)
    L:                          { shape: [[1,0],[1,0],[1,1]],       color: '#5dade2' },
    REVERSE_L:                  { shape: [[0,1],[0,1],[1,1]],       color: '#5dade2' },
    UPSIDE_L:                   { shape: [[1,1],[1,0],[1,0]],       color: '#5dade2' },
    REVERSE_UPSIDE_L:           { shape: [[1,1],[0,1],[0,1]],       color: '#5dade2' },

    // Big L-shapes (purple)
    BIG_L:                      { shape: [[1,0,0],[1,0,0],[1,1,1]], color: '#9b59b6' },
    REVERSE_BIG_L:              { shape: [[0,0,1],[0,0,1],[1,1,1]], color: '#9b59b6' },
    UPSIDE_BIG_L:               { shape: [[1,1,1],[1,0,0],[1,0,0]], color: '#9b59b6' },
    REVERSE_UPSIDE_BIG_L:       { shape: [[1,1,1],[0,0,1],[0,0,1]], color: '#9b59b6' },

    // Horizontal L variants (steel blue)
    HORIZONTAL_L:               { shape: [[0,0,1],[1,1,1]],         color: '#2980b9' },

    // T-shapes (emerald green)
    T:                          { shape: [[1,1,1],[0,1,0]],         color: '#2ecc71' },
    RIGHT_T:                    { shape: [[1,0],[1,1],[1,0]],       color: '#2ecc71' },
    LEFT_T:                     { shape: [[0,1],[1,1],[0,1]],       color: '#2ecc71' },
    UP_T:                       { shape: [[0,1,0],[1,1,1]],         color: '#2ecc71' },

    // Corner shapes (coral red)
    TOP_LEFT_CORNER:            { shape: [[1,1],[1,0]],             color: '#e74c3c' },
    TOP_RIGHT_CORNER:           { shape: [[1,1],[0,1]],             color: '#e74c3c' },
    BOTTOM_LEFT_CORNER:         { shape: [[1,0],[1,1]],             color: '#e74c3c' },
    BOTTOM_RIGHT_CORNER:        { shape: [[0,1],[1,1]],             color: '#e74c3c' },

    // Singles & Doubles (teal)
    ONE:                        { shape: [[1]],                     color: '#1abc9c' },
    HORIZONTAL_TWO:             { shape: [[1,1]],                   color: '#1abc9c' },
    VERTICAL_TWO:               { shape: [[1],[1]],                 color: '#1abc9c' },

    // Triples (slate)
    HORIZONTAL_THREE:           { shape: [[1,1,1]],                 color: '#607d8b' },
    VERTICAL_THREE:             { shape: [[1],[1],[1]],             color: '#607d8b' },

    // Fours (violet)
    HORIZONTAL_FOUR:            { shape: [[1,1,1,1]],               color: '#8e44ad' },
    VERTICAL_FOUR:              { shape: [[1],[1],[1],[1]],         color: '#8e44ad' },

    // Fives (crimson)
    HORIZONTAL_FIVE:            { shape: [[1,1,1,1,1]],             color: '#c0392b' },
    VERTICAL_FIVE:              { shape: [[1],[1],[1],[1],[1]],     color: '#c0392b' },

    // Six-packs (amber)
    HORIZONTAL_SIX_PACK:        { shape: [[1,1,1],[1,1,1]],         color: '#d35400' },
    VERTICAL_SIX_PACK:          { shape: [[1,1],[1,1],[1,1]],       color: '#d35400' },
};

/**
 * Color-blind pattern mapping per color family.
 * @type {Object.<string, string>}
 */
const CB_PATTERNS = {
    '#f1c40f': 'dots',
    '#e67e22': 'cross',
    '#5dade2': 'hlines',
    '#9b59b6': 'vlines',
    '#2980b9': 'diag1',
    '#2ecc71': 'diag2',
    '#e74c3c': 'checker',
    '#1abc9c': 'dots',
    '#607d8b': 'hlines',
    '#8e44ad': 'vlines',
    '#c0392b': 'cross',
    '#d35400': 'diag1',
};

const BLOCK_KEYS = Object.keys(BLOCK_DECODER);
const STORAGE_PREFIX = 'bbpro_v2_';
const LEVEL_THRESHOLD = 10; // blocks placed per level

/**
 * Mulberry32 Seeded Pseudo-Random Number Generator.
 * @param {number} a - Seed integer
 * @returns {function(): number} Random float between 0 and 1
 */
function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * Audio synthesis sound effects engine.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    _init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    _tone(freq, dur, type = 'sine', vol = 0.14) {
        if (!this.enabled) return;
        this._init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + dur);
        } catch (_) {}
    }

    playPlace()    { this._tone(280, 0.07); }
    playClear()    { this._tone(523, 0.1); setTimeout(() => this._tone(659, 0.1), 80); setTimeout(() => this._tone(784, 0.12), 160); }
    playStreak()   { this._tone(880, 0.15, 'triangle'); setTimeout(() => this._tone(1046, 0.2, 'triangle'), 100); }
    playLevelUp()  { [523,659,784,1046].forEach((f,i) => setTimeout(() => this._tone(f, 0.12, 'triangle'), i * 80)); }
    playNewBest()  { [784,880,1046,1318].forEach((f,i) => setTimeout(() => this._tone(f, 0.15), i * 70)); }
    playGameOver() { this._tone(350, 0.15); setTimeout(() => this._tone(240, 0.2), 150); }
    playUndo()     { this._tone(440, 0.08, 'sawtooth', 0.08); }
}

/**
 * Canvas particle explosion generator for line clears.
 */
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this._raf = null;
    }

    /**
     * Emit a burst of particles at canvas pixel coordinates.
     * @param {number} cx - Center X in pixels
     * @param {number} cy - Center Y in pixels
     * @param {string} color - Particle fill color
     */
    emit(cx, cy, color) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: 3 + Math.random() * 4,
                alpha: 1,
                color,
                decay: 0.025 + Math.random() * 0.02,
            });
        }
        if (!this._raf) this._loop();
    }

    _loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = this.particles.filter(p => p.alpha > 0.02);
        for (const p of this.particles) {
            p.x     += p.vx;
            p.y     += p.vy;
            p.vy    += 0.1; // gravity
            p.alpha -= p.decay;
            p.r     *= 0.97;
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle   = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        if (this.particles.length > 0) {
            this._raf = requestAnimationFrame(() => this._loop());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._raf = null;
        }
    }
}

/**
 * Animated number roll-up helper using cubic easing.
 * @param {HTMLElement} el - Element to update
 * @param {number} fromVal - Starting integer
 * @param {number} toVal - Ending integer
 * @param {number} [duration=500] - Duration in ms
 */
function animateCounter(el, fromVal, toVal, duration = 500) {
    const start = performance.now();
    const diff = toVal - fromVal;
    function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(fromVal + diff * eased);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = toVal;
    }
    requestAnimationFrame(step);
}

/**
 * Advertising & Monetization Engine for Web (AdSense, CrazyGames, Poki, Rewarded Ads).
 */
class AdEngine {
    constructor() {
        this.enabled = true;
        this.gamesSinceLastAd = 0;
        this.interstitialInterval = 3;
        this.rewardCallback = null;
        this.timerInterval = null;
        this._initAdModal();
    }

    _initAdModal() {
        const skipBtn = document.getElementById('ad-skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this._closeAdModal(true);
            });
        }
    }

    showRewardedAd({ rewardName = 'Reward', onReward = () => {}, onClose = () => {} }) {
        this.rewardCallback = onReward;
        const modal = document.getElementById('ad-player-modal');
        const timerEl = document.getElementById('ad-timer');
        const skipBtn = document.getElementById('ad-skip-btn');
        const sponsorText = document.getElementById('ad-sponsor-text');

        if (sponsorText) sponsorText.textContent = `Sponsored Video: ${rewardName}`;
        modal.classList.remove('hidden');

        let secondsLeft = 5;
        skipBtn.disabled = true;
        skipBtn.textContent = `Skip Ad (${secondsLeft})`;
        timerEl.textContent = `Reward in ${secondsLeft}s...`;

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                skipBtn.textContent = `Skip Ad (${secondsLeft})`;
                timerEl.textContent = `Reward in ${secondsLeft}s...`;
            } else {
                clearInterval(this.timerInterval);
                skipBtn.disabled = false;
                skipBtn.textContent = 'Claim Reward ✓';
                timerEl.textContent = '🎉 Reward Unlocked!';
            }
        }, 1000);
    }

    _closeAdModal(grantReward = false) {
        clearInterval(this.timerInterval);
        const modal = document.getElementById('ad-player-modal');
        modal.classList.add('hidden');
        if (grantReward && typeof this.rewardCallback === 'function') {
            const cb = this.rewardCallback;
            this.rewardCallback = null;
            cb();
        }
    }

    onGameOver() {
        this.gamesSinceLastAd++;
    }
}

/**
 * Main Block Blast Pro Application Controller.
 */
class BlockBlastApp {
    constructor() {
        this.canvas  = document.getElementById('game-board');
        this.ctx     = this.canvas.getContext('2d');

        // Particle canvas
        this.pCanvas = document.getElementById('particle-canvas');
        this.particles = new ParticleSystem(this.pCanvas);

        this.sound = new SoundEngine();
        this.adEngine = new AdEngine();

        // Grid Geometry
        this.GRID      = 8;
        this.cellSize  = 50;
        this.gridGap   = 4;
        this.padding   = 6;

        // Core State
        this.board      = Array(8).fill(null).map(() => Array(8).fill(null));
        this.hand       = [null, null, null];
        this.pieceUsed  = [false, false, false];
        this.selectedIndex = 0;
        this.hasRevivedThisGame = false;

        // Undo Buffer (max 3 snapshots)
        this.undoStack  = [];

        // Game Statistics
        this.score             = 0;
        this.bestScore         = parseInt(localStorage.getItem(STORAGE_PREFIX + 'best') || '0');
        this.streak            = 0;
        this.maxStreak         = 0;
        this.totalBlocksPlaced = 0;
        this.totalLinesCleared = 0;
        this.gamesPlayed       = parseInt(localStorage.getItem(STORAGE_PREFIX + 'games') || '0');
        this.totalScoreAccum   = parseInt(localStorage.getItem(STORAGE_PREFIX + 'score_accum') || '0');
        this.level             = 1;
        this.maxLevel          = parseInt(localStorage.getItem(STORAGE_PREFIX + 'maxlevel') || '1');

        // Session metrics (Pieces Per Minute)
        this.sessionStartTime  = null;

        // Modes
        this.isDailyMode       = false;
        this.dailySeed         = 0;
        this.dailyRand         = null;
        this.dailyDateStr      = '';

        // AI / Hint State
        this.activeHint        = null;
        this.bestSequence      = null;
        this.hintPulseRaf      = null;
        this.hintAlpha         = 0.6;
        this.hintDir           = 1;
        this.aiWorker          = null;

        // UI Interactions
        this.hoverCell         = null;
        this.dragPieceIdx      = null;
        this.editMode          = false;
        this.colorBlindMode    = false;

        // Themes
        this.themes            = ['', 'theme-wood', 'theme-synthwave', 'theme-light'];
        this.themeIndex        = 0;

        // Tutorial state
        this.tutorialStep      = 0;

        this._initWorker();
        this._initDOM();
        this._initResize();
        this._initKeyboard();
        this._initHintPulse();
        this._checkFirstTimeTutorial();

        if (!this._loadGame()) {
            this.startNewGame();
        }
    }

    // ===================== Web Worker =====================

    /**
     * Initializes the background Web Worker for heavy AI solving.
     * Gracefully falls back to synchronous computation if unavailable.
     */
    _initWorker() {
        try {
            this.aiWorker = new Worker('ai-worker.js');
            this.aiWorker.onmessage = (e) => {
                const { type, result, sequence } = e.data;
                if (type === 'hint') {
                    if (result) {
                        this.activeHint = result;
                        this.setStatus(`ðŸ’¡ AI Hint â€” row ${result.r + 1}, col ${result.c + 1}`);
                        this._showHintTooltip(result);
                        this.renderBoard();
                    } else {
                        this.setStatus(`âŒ No valid placement for selected piece.`);
                    }
                } else if (type === 'solve') {
                    if (sequence && sequence.length > 0) {
                        this.bestSequence = sequence;
                        this.activeHint = sequence[0];
                        this.selectedIndex = sequence[0].pieceIdx;
                        this._updateHandUI();
                        this._showHintTooltip(sequence[0]);
                        this.renderBoard();
                        this.setStatus(`âœ… Optimal solution found! ${sequence.reduce((a, b) => a + b.lines, 0)} lines. Press Auto Move.`);
                    } else {
                        this.setStatus('âŒ No full-hand clear sequence found.');
                        this.showAiHint();
                    }
                }
            };
        } catch (err) {
            console.info('Web Worker disabled (likely file:// protocol), using inline solver fallback.');
            this.aiWorker = null;
        }
    }

    // ===================== DOM & Event Setup =====================

    _initDOM() {
        document.getElementById('best-val').textContent = this.bestScore;

        // Sound Toggle
        document.getElementById('sound-btn').addEventListener('click', e => {
            this.sound.enabled = !this.sound.enabled;
            e.currentTarget.textContent = this.sound.enabled ? 'ðŸ”Š' : 'ðŸ”‡';
        });

        // Theme Toggle
        document.getElementById('theme-btn').addEventListener('click', () => {
            if (this.themes[this.themeIndex]) document.body.classList.remove(this.themes[this.themeIndex]);
            this.themeIndex = (this.themeIndex + 1) % this.themes.length;
            if (this.themes[this.themeIndex]) document.body.classList.add(this.themes[this.themeIndex]);
            this.renderBoard();
        });

        // Color-blind Mode
        document.getElementById('colorblind-btn').addEventListener('click', e => {
            this.colorBlindMode = !this.colorBlindMode;
            document.body.classList.toggle('colorblind-mode', this.colorBlindMode);
            e.currentTarget.classList.toggle('active', this.colorBlindMode);
            this.renderBoard();
        });

        // Daily Challenge Mode
        document.getElementById('daily-btn').addEventListener('click', () => {
            this._toggleDailyChallenge();
        });
        document.getElementById('mode-badge-exit').addEventListener('click', () => {
            this._exitDailyChallenge();
        });

        // Leaderboard Modal
        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this._renderLeaderboard();
            document.getElementById('leaderboard-modal').classList.remove('hidden');
        });
        document.getElementById('lb-close-btn').addEventListener('click', () => {
            document.getElementById('leaderboard-modal').classList.add('hidden');
        });
        document.getElementById('lb-reset-btn').addEventListener('click', () => {
            if (confirm('Reset the top 10 leaderboard?')) {
                localStorage.removeItem(STORAGE_PREFIX + 'leaderboard');
                this._renderLeaderboard();
            }
        });

        // Tutorial Modal
        document.getElementById('help-btn').addEventListener('click', () => {
            this._showTutorial(0);
        });
        document.getElementById('tutorial-skip-btn').addEventListener('click', () => {
            document.getElementById('tutorial-overlay').classList.add('hidden');
            localStorage.setItem(STORAGE_PREFIX + 'tut_done', '1');
        });
        document.getElementById('tutorial-next-btn').addEventListener('click', () => {
            this.tutorialStep++;
            if (this.tutorialStep > 2) {
                document.getElementById('tutorial-overlay').classList.add('hidden');
                localStorage.setItem(STORAGE_PREFIX + 'tut_done', '1');
            } else {
                this._showTutorial(this.tutorialStep);
            }
        });

        // Edit Board Mode
        document.getElementById('edit-btn').addEventListener('click', e => {
            this.editMode = !this.editMode;
            e.currentTarget.classList.toggle('active', this.editMode);
            this.setStatus(this.editMode ? 'ðŸ› ï¸ EDIT MODE â€” click cells to toggle blocks.' : 'ðŸŽ® PLAY MODE â€” drag/click to place pieces.');
            this.renderBoard();
        });

        // New Game Button
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());

        // Undo Button
        document.getElementById('undo-btn').addEventListener('click', () => this._undo());

        // Stats Modal
        document.getElementById('stats-open-btn').addEventListener('click', () => {
            this._updateStatsUI();
            document.getElementById('stats-modal').classList.remove('hidden');
        });
        document.getElementById('stats-close-btn').addEventListener('click', () => {
            document.getElementById('stats-modal').classList.add('hidden');
        });

        // Game Over Modal Controls
        document.getElementById('modal-restart-btn').addEventListener('click', () => {
            document.getElementById('game-over-modal').classList.add('hidden');
            this.startNewGame();
        });
        document.getElementById('modal-revive-btn').addEventListener('click', () => {
            this.adEngine.showRewardedAd({
                rewardName: 'Second Chance (Blast 4 Cells)',
                onReward: () => this.reviveGame()
            });
        });
        document.getElementById('modal-share-btn').addEventListener('click', () => {
            this._shareScore();
        });
        document.getElementById('save-initials-btn').addEventListener('click', () => {
            this._saveLeaderboardEntry();
        });

        // AI Control Buttons
        document.getElementById('hint-btn').addEventListener('click', () => this.showAiHint());
        document.getElementById('auto-btn').addEventListener('click', () => this.makeAutoMove());
        document.getElementById('solve-btn').addEventListener('click', () => this.solveEntireHand());

        // Canvas Mouse Events
        this.canvas.addEventListener('mousemove', e => this._handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverCell = null;
            this.renderBoard();
        });
        this.canvas.addEventListener('click', e => this._handleCanvasClick(e));

        // Touch Events (Mobile)
        this.canvas.addEventListener('touchstart', e => { e.preventDefault(); this._handleTouch(e, 'start'); }, { passive: false });
        this.canvas.addEventListener('touchmove',  e => { e.preventDefault(); this._handleTouch(e, 'move');  }, { passive: false });
        this.canvas.addEventListener('touchend',   e => { e.preventDefault(); this._handleTouch(e, 'end');   }, { passive: false });

        // Hand Cards Interaction
        document.querySelectorAll('.hand-card').forEach(card => {
            const idx = parseInt(card.dataset.index);

            card.addEventListener('click', () => {
                if (!this.pieceUsed[idx]) {
                    this.selectedIndex = idx;
                    this.activeHint = null;
                    this._hideHintTooltip();
                    this._updateHandUI();
                    this.renderBoard();
                }
            });

            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!this.pieceUsed[idx]) {
                        this.selectedIndex = idx;
                        this.activeHint = null;
                        this._hideHintTooltip();
                        this._updateHandUI();
                        this.renderBoard();
                    }
                }
            });

            card.addEventListener('mousedown', () => {
                if (!this.pieceUsed[idx] && !this.editMode) {
                    this.dragPieceIdx = idx;
                    this.selectedIndex = idx;
                    this._updateHandUI();
                }
            });
        });

        window.addEventListener('mouseup', () => { this.dragPieceIdx = null; });
    }

    _initResize() {
        const sync = () => {
            const wrapper = this.canvas.parentElement;
            const avail   = wrapper.clientWidth - 24;
            const sz      = Math.min(440, avail);
            this.canvas.style.width  = sz + 'px';
            this.canvas.style.height = sz + 'px';
            this.cellSize = Math.floor((sz - this.padding * 2 - this.gridGap * (this.GRID - 1)) / this.GRID);
            this.renderBoard();
        };
        window.addEventListener('resize', sync);
        sync();
    }

    _initKeyboard() {
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT') return;
            switch (e.key) {
                case '1': this._selectPiece(0); break;
                case '2': this._selectPiece(1); break;
                case '3': this._selectPiece(2); break;
                case 'h': case 'H': this.showAiHint();    break;
                case 'a': case 'A': this.makeAutoMove();  break;
                case 'u': case 'U': this._undo();         break;
                case 'n': case 'N': this.startNewGame();  break;
            }
        });
    }

    _selectPiece(idx) {
        if (!this.pieceUsed[idx] && this.hand[idx]) {
            this.selectedIndex = idx;
            this.activeHint = null;
            this._hideHintTooltip();
            this._updateHandUI();
            this.renderBoard();
        }
    }

    _initHintPulse() {
        const pulse = () => {
            if (this.activeHint) {
                this.hintAlpha += this.hintDir * 0.035;
                if (this.hintAlpha >= 0.95 || this.hintAlpha <= 0.3) this.hintDir *= -1;
                this.renderBoard();
            }
            this.hintPulseRaf = requestAnimationFrame(pulse);
        };
        this.hintPulseRaf = requestAnimationFrame(pulse);
    }

    _checkFirstTimeTutorial() {
        if (!localStorage.getItem(STORAGE_PREFIX + 'tut_done')) {
            setTimeout(() => this._showTutorial(0), 400);
        }
    }

    _showTutorial(step) {
        this.tutorialStep = step;
        const overlay = document.getElementById('tutorial-overlay');
        const iconEl  = document.getElementById('tutorial-step-icon');
        const titleEl = document.getElementById('tutorial-title');
        const descEl  = document.getElementById('tutorial-desc');
        const dots    = document.querySelectorAll('.t-dot');

        const tutorials = [
            { icon: 'ðŸ§©', title: 'GRID & PLACEMENT', desc: 'Drag or click pieces from your hand into the 8Ã—8 grid. Plan ahead to leave space for larger blocks!' },
            { icon: 'ðŸ”¥', title: 'COMBOS & STREAKS', desc: 'Fill entire rows or columns to blast lines! Clear lines on consecutive turns to multiply your streak bonus!' },
            { icon: 'ðŸ¤–', title: 'AI TOOLS & DAILY', desc: 'Stuck? Press AI Hint or Auto Move. Try the ðŸ“… Daily Challenge for a daily seed shared with all players!' }
        ];

        const t = tutorials[step];
        iconEl.textContent  = t.icon;
        titleEl.textContent = t.title;
        descEl.textContent  = t.desc;

        dots.forEach((dot, i) => dot.classList.toggle('active', i === step));
        overlay.classList.remove('hidden');
    }

    // ===================== Touch Handlers =====================

    _touchCell(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mx = (touch.clientX - rect.left) * scaleX;
        const my = (touch.clientY - rect.top)  * scaleY;
        const c  = Math.floor((mx - this.padding) / (this.cellSize + this.gridGap));
        const r  = Math.floor((my - this.padding) / (this.cellSize + this.gridGap));
        if (r >= 0 && r < this.GRID && c >= 0 && c < this.GRID) return { r, c };
        return null;
    }

    _handleTouch(e, phase) {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return;
        const cell = this._touchCell(touch);

        if (phase === 'start' || phase === 'move') {
            this.hoverCell = cell;
            this.renderBoard();
        }
        if (phase === 'end' && cell) {
            if (this.editMode) {
                this.board[cell.r][cell.c] = this.board[cell.r][cell.c] ? null : '#3498db';
                this.renderBoard();
            } else {
                this._placePiece(this.selectedIndex, cell.r, cell.c);
            }
            this.hoverCell = null;
        }
    }

    // ===================== Daily Challenge =====================

    /**
     * Toggles the daily seeded challenge game mode.
     */
    _toggleDailyChallenge() {
        if (this.isDailyMode) return;
        this.isDailyMode = true;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        this.dailyDateStr = `${yyyy}-${mm}-${dd}`;
        this.dailySeed = parseInt(`${yyyy}${mm}${dd}`, 10);
        this.dailyRand = mulberry32(this.dailySeed);

        document.getElementById('mode-badge').classList.remove('hidden');
        document.getElementById('mode-badge-text').textContent = `ðŸ“… DAILY CHALLENGE (${this.dailyDateStr})`;
        this.startNewGame();
    }

    /**
     * Exits Daily Challenge mode and returns to standard mode.
     */
    _exitDailyChallenge() {
        this.isDailyMode = false;
        this.dailyRand = null;
        document.getElementById('mode-badge').classList.add('hidden');
        this.startNewGame();
    }

    // ===================== Game Core Logic =====================

    /**
     * Starts a new game session, resetting state and clearing undo buffer.
     */
    startNewGame() {
        this.gamesPlayed++;
        localStorage.setItem(STORAGE_PREFIX + 'games', this.gamesPlayed);

        this.board             = Array(8).fill(null).map(() => Array(8).fill(null));
        this.score             = 0;
        this.streak            = 0;
        this.maxStreak         = 0;
        this.totalBlocksPlaced = 0;
        this.totalLinesCleared = 0;
        this.level             = 1;
        this.activeHint        = null;
        this.bestSequence      = null;
        this.hoverCell         = null;
        this.editMode          = false;
        this.undoStack         = [];
        this.sessionStartTime  = null;

        document.getElementById('edit-btn').classList.remove('active');
        document.getElementById('combo-badge').classList.add('hidden');
        this._hideHintTooltip();

        this._updateStatsUI();
        this._refillHand(false);
        this._saveGame();
        this.renderBoard();
        this.setStatus(this.isDailyMode ? `ðŸ“… Daily Challenge started (${this.dailyDateStr})! Place pieces to beat today's high score.` : 'New game! Select a piece and click or drag onto the grid.');
    }

    _refillHand(animate = true) {
        for (let i = 0; i < 3; i++) {
            if (this.isDailyMode && this.dailyRand) {
                const randIdx = Math.floor(this.dailyRand() * BLOCK_KEYS.length);
                this.hand[i] = BLOCK_KEYS[randIdx];
            } else {
                this.hand[i] = BLOCK_KEYS[Math.floor(Math.random() * BLOCK_KEYS.length)];
            }
            this.pieceUsed[i] = false;
        }
        this.selectedIndex = 0;
        this.bestSequence  = null;
        this._updateHandUI(animate);
        this._checkGameOver();
    }

    /**
     * Checks if a piece shape can legally be placed at (r, c).
     * @param {number} r - Board row
     * @param {number} c - Board column
     * @param {string} blockKey - Key in BLOCK_DECODER
     * @returns {boolean}
     */
    canPlace(r, c, blockKey) {
        if (!blockKey) return false;
        const { shape } = BLOCK_DECODER[blockKey];
        if (r < 0 || c < 0 || r + shape.length > this.GRID || c + shape[0].length > this.GRID) return false;
        for (let i = 0; i < shape.length; i++)
            for (let j = 0; j < shape[0].length; j++)
                if (shape[i][j] && this.board[r + i][c + j] !== null) return false;
        return true;
    }

    _pushUndo() {
        const snap = {
            board:      this.board.map(r => [...r]),
            hand:       [...this.hand],
            pieceUsed:  [...this.pieceUsed],
            score:      this.score,
            streak:     this.streak,
            maxStreak:  this.maxStreak,
            totalBlocksPlaced: this.totalBlocksPlaced,
            totalLinesCleared: this.totalLinesCleared,
            level:      this.level,
            selectedIndex: this.selectedIndex,
        };
        this.undoStack.push(snap);
        if (this.undoStack.length > 3) this.undoStack.shift();
        document.getElementById('undo-btn').disabled = false;
    }

    _undo() {
        if (this.undoStack.length === 0) {
            this.setStatus('âš ï¸ Nothing to undo.');
            return;
        }
        const snap = this.undoStack.pop();
        this.board              = snap.board;
        this.hand               = snap.hand;
        this.pieceUsed          = snap.pieceUsed;
        this.score              = snap.score;
        this.streak             = snap.streak;
        this.maxStreak          = snap.maxStreak;
        this.totalBlocksPlaced  = snap.totalBlocksPlaced;
        this.totalLinesCleared  = snap.totalLinesCleared;
        this.level              = snap.level;
        this.selectedIndex      = snap.selectedIndex;
        this.activeHint         = null;
        this.bestSequence       = null;
        this._hideHintTooltip();
        document.getElementById('combo-badge').classList.add('hidden');
        if (this.undoStack.length === 0) document.getElementById('undo-btn').disabled = true;
        this.sound.playUndo();
        this._updateStatsUI();
        this._updateHandUI(false);
        this.renderBoard();
        this.setStatus('â†© Move undone.');
        this._saveGame();
    }

    _placePiece(pieceIdx, r, c) {
        if (pieceIdx < 0 || this.pieceUsed[pieceIdx]) return false;
        const blockKey = this.hand[pieceIdx];
        if (!this.canPlace(r, c, blockKey)) return false;

        if (!this.sessionStartTime) this.sessionStartTime = Date.now();

        this._pushUndo();

        const { shape, color } = BLOCK_DECODER[blockKey];
        let cellsPlaced = 0;
        for (let i = 0; i < shape.length; i++)
            for (let j = 0; j < shape[0].length; j++)
                if (shape[i][j]) { this.board[r + i][c + j] = color; cellsPlaced++; }

        this.pieceUsed[pieceIdx] = true;
        this.totalBlocksPlaced++;
        this.sound.playPlace();

        // Level Up Check
        const newLevel = Math.floor(this.totalBlocksPlaced / LEVEL_THRESHOLD) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            if (this.level > this.maxLevel) {
                this.maxLevel = this.level;
                localStorage.setItem(STORAGE_PREFIX + 'maxlevel', this.maxLevel);
            }
            this.sound.playLevelUp();
            this._triggerLevelUp();
        }

        // Line Clears
        const { linesCleared, clearedCells } = this._clearFullLines();
        let moveScore = cellsPlaced * 10;

        if (linesCleared > 0) {
            this.streak++;
            if (this.streak > this.maxStreak) this.maxStreak = this.streak;
            this.totalLinesCleared += linesCleared;

            const lineBonus   = linesCleared * 100 * (1 + (linesCleared - 1) * 2);
            const streakBonus = this.streak * 50;
            const doubleBonus = (linesCleared >= 2) ? 200 : 0;
            moveScore += lineBonus + streakBonus + doubleBonus;

            // Particle Bursts
            for (const { pr, pc, col } of clearedCells) {
                const cx = this.padding + pc * (this.cellSize + this.gridGap) + this.cellSize / 2;
                const cy = this.padding + pr * (this.cellSize + this.gridGap) + this.cellSize / 2;
                this.particles.emit(cx, cy, col || '#f1c40f');
            }

            if (linesCleared >= 2) {
                this._triggerOverlay(`ðŸ”¥ DOUBLE CLEAR +${doubleBonus}`);
            } else if (this.streak > 1) {
                this.sound.playStreak();
                this._triggerOverlay(`ðŸ”¥ STREAK x${this.streak}`);
            } else {
                this.sound.playClear();
                this._triggerOverlay(`+${moveScore}`);
            }

            if (this.streak >= 2) {
                const badge = document.getElementById('combo-badge');
                badge.classList.remove('hidden');
                document.getElementById('combo-badge-val').textContent = `x${this.streak}`;
            }
        } else {
            this.streak = 0;
            document.getElementById('combo-badge').classList.add('hidden');
        }

        const prevScore = this.score;
        this.score += moveScore;
        this.totalScoreAccum += moveScore;
        localStorage.setItem(STORAGE_PREFIX + 'score_accum', this.totalScoreAccum);

        const isNewBest = this.score > this.bestScore;
        if (isNewBest) {
            this.bestScore = this.score;
            localStorage.setItem(STORAGE_PREFIX + 'best', this.bestScore);
            this.sound.playNewBest();
            this._triggerNewBest();
        }

        // Animate Score Counter
        const scoreEl = document.getElementById('score-val');
        animateCounter(scoreEl, prevScore, this.score, 400);
        scoreEl.classList.add('pop');
        setTimeout(() => scoreEl.classList.remove('pop'), 300);

        this._updateStatsUI(true);
        this.activeHint = null;
        this._hideHintTooltip();
        this._saveGame();

        const nextAvail = this.pieceUsed.findIndex(u => !u);
        if (nextAvail !== -1) {
            this.selectedIndex = nextAvail;
        } else {
            this._refillHand(true);
        }

        this._updateHandUI();
        this.renderBoard();
        this._checkGameOver();
        return true;
    }

    _clearFullLines() {
        const rowsToClear = [];
        const colsToClear = [];

        for (let r = 0; r < this.GRID; r++)
            if (this.board[r].every(c => c !== null)) rowsToClear.push(r);
        for (let c = 0; c < this.GRID; c++) {
            let full = true;
            for (let r = 0; r < this.GRID; r++) if (this.board[r][c] === null) { full = false; break; }
            if (full) colsToClear.push(c);
        }

        const clearedCells = [];
        rowsToClear.forEach(r => {
            for (let c = 0; c < this.GRID; c++) { clearedCells.push({ pr: r, pc: c, col: this.board[r][c] }); this.board[r][c] = null; }
        });
        colsToClear.forEach(c => {
            for (let r = 0; r < this.GRID; r++) { clearedCells.push({ pr: r, pc: c, col: this.board[r][c] }); this.board[r][c] = null; }
        });

        return { linesCleared: rowsToClear.length + colsToClear.length, clearedCells };
    }

    _checkGameOver() {
        const unusedPieces = this.hand.filter((k, i) => !this.pieceUsed[i] && k);
        if (unusedPieces.length === 0) return false;

        const allStuck = unusedPieces.every(key => {
            for (let r = 0; r < this.GRID; r++)
                for (let c = 0; c < this.GRID; c++)
                    if (this.canPlace(r, c, key)) return false;
            return true;
        });

        if (allStuck) {
            this.sound.playGameOver();
            this._showGameOver();
            return true;
        }
        return false;
    }

    _showGameOver() {
        document.getElementById('modal-score').textContent  = this.score;
        document.getElementById('modal-level').textContent  = this.level;
        document.getElementById('modal-streak').textContent = `${this.maxStreak}x`;
        document.getElementById('modal-blocks').textContent = this.totalBlocksPlaced;

        const ribbon = document.getElementById('modal-best-ribbon');
        if (this.score >= this.bestScore && this.score > 0) {
            ribbon.classList.remove('hidden');
        } else {
            ribbon.classList.add('hidden');
        }

        // Check if qualifies for leaderboard top 10
        const lb = this._getLeaderboard();
        const qualifies = lb.length < 10 || this.score > lb[lb.length - 1].score;
        const entryBox = document.getElementById('leaderboard-entry-box');
        if (qualifies && this.score > 0) {
            entryBox.classList.remove('hidden');
            const inp = document.getElementById('player-initials-input');
            inp.value = localStorage.getItem(STORAGE_PREFIX + 'last_initials') || 'PRO';
        } else {
            entryBox.classList.add('hidden');
        }

        // Show Rewarded Ad Revive button if not already used
        const reviveBtn = document.getElementById('modal-revive-btn');
        if (reviveBtn) {
            if (!this.hasRevivedThisGame && this.score >= 50) {
                reviveBtn.classList.remove('hidden');
            } else {
                reviveBtn.classList.add('hidden');
            }
        }

        this.adEngine.onGameOver();
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    /**
     * Revives the game by clearing center board cells after watching a rewarded ad.
     */
    reviveGame() {
        this.hasRevivedThisGame = true;
        document.getElementById('game-over-modal').classList.add('hidden');

        // Clear center cells (r: 2..5, c: 2..5)
        const cleared = [];
        for (let r = 2; r <= 5; r++) {
            for (let c = 2; c <= 5; c++) {
                if (this.board[r][c]) {
                    cleared.push({ r, c, col: this.board[r][c] });
                    this.board[r][c] = null;
                }
            }
        }

        // If center was already empty, clear rows 3 and 4
        if (cleared.length === 0) {
            for (let c = 0; c < this.GRID; c++) {
                if (this.board[3][c]) { cleared.push({ r: 3, c, col: this.board[3][c] }); this.board[3][c] = null; }
                if (this.board[4][c]) { cleared.push({ r: 4, c, col: this.board[4][c] }); this.board[4][c] = null; }
            }
        }

        // Emit celebration / blast particles
        for (const cell of cleared) {
            const cx = this.padding + cell.c * (this.cellSize + this.gridGap) + this.cellSize / 2;
            const cy = this.padding + cell.r * (this.cellSize + this.gridGap) + this.cellSize / 2;
            this.particles.emit(cx, cy, cell.col || '#f1c40f');
        }

        this.sound.playClear();
        this._triggerOverlay('💥 REVIVED & BLASTED!');
        this._updateHandUI();
        this.renderBoard();
        this.setStatus('💥 Second Chance: 4 cells cleared! Keep your streak going!');
        this._saveGame();
    }

    // ===================== Leaderboard System =====================

    _getLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'leaderboard')) || [];
        } catch (_) {
            return [];
        }
    }

    _saveLeaderboardEntry() {
        const inp = document.getElementById('player-initials-input');
        const initials = (inp.value || 'PRO').trim().toUpperCase().slice(0, 3) || 'PRO';
        localStorage.setItem(STORAGE_PREFIX + 'last_initials', initials);

        const lb = this._getLeaderboard();
        const today = new Date().toISOString().split('T')[0];
        lb.push({
            name: initials,
            score: this.score,
            level: this.level,
            date: today,
        });

        lb.sort((a, b) => b.score - a.score);
        const top10 = lb.slice(0, 10);
        localStorage.setItem(STORAGE_PREFIX + 'leaderboard', JSON.stringify(top10));

        document.getElementById('leaderboard-entry-box').classList.add('hidden');
        this.setStatus(`ðŸ† High score saved for ${initials}!`);
    }

    _renderLeaderboard() {
        const listEl = document.getElementById('leaderboard-list');
        const lb = this._getLeaderboard();
        listEl.innerHTML = '';

        if (lb.length === 0) {
            listEl.innerHTML = '<div class="lb-empty">No high scores yet! Play a game to record your name.</div>';
            return;
        }

        const medals = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'];
        lb.forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = `lb-row top-${idx + 1}`;
            row.innerHTML = `
                <span class="lb-rank">${medals[idx] || (idx + 1)}</span>
                <span class="lb-name">${entry.name}</span>
                <span class="lb-lvl">Lv.${entry.level || 1}</span>
                <span class="lb-score">${entry.score.toLocaleString()}</span>
                <span class="lb-date">${entry.date || ''}</span>
            `;
            listEl.appendChild(row);
        });
    }

    // ===================== Share Score =====================

    _shareScore() {
        let gridEmoji = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 8; c++) {
                gridEmoji += this.board[r][c] ? 'ðŸŸ©' : 'â¬›';
            }
            gridEmoji += '\n';
        }

        const ppm = this._computePPM();
        const text = `ðŸ§© Block Blast Pro Score\n` +
                     `â­ Score: ${this.score.toLocaleString()} | ðŸ† High: ${this.bestScore.toLocaleString()}\n` +
                     `ðŸ“ˆ Level: ${this.level} | ðŸ”¥ Streak: ${this.maxStreak}x | âš¡ PPM: ${ppm}\n\n` +
                     gridEmoji +
                     `\nPlay now: https://blockblastpro.app/`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this._showShareToast();
            }).catch(() => {
                this._showShareToast();
            });
        } else {
            this._showShareToast();
        }
    }

    _showShareToast() {
        const toast = document.getElementById('share-toast');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2200);
    }

    // ===================== AI Hints & Solving =====================

    _showHintTooltip(hint) {
        const tt = document.getElementById('hint-tooltip');
        if (!hint) { tt.classList.add('hidden'); return; }
        const lineText = hint.lines ? `${hint.lines} line${hint.lines > 1 ? 's' : ''}` : '0 lines';
        tt.textContent = `ðŸ’¡ Hint: Row ${hint.r + 1}, Col ${hint.c + 1} â€¢ Clears ${lineText} â€¢ Score +${hint.score || 100}`;
        tt.classList.remove('hidden');
    }

    _hideHintTooltip() {
        const tt = document.getElementById('hint-tooltip');
        if (tt) tt.classList.add('hidden');
    }

    /**
     * Triggers AI move suggestion via Web Worker (or synchronous fallback).
     */
    showAiHint() {
        if (this.selectedIndex < 0 || this.pieceUsed[this.selectedIndex]) return;

        if (this.aiWorker) {
            this.aiWorker.postMessage({
                type: 'hint',
                board: this.board,
                hand: this.hand,
                selectedIndex: this.selectedIndex,
            });
        } else {
            const hint = this._findBestSingleMove(this.hand[this.selectedIndex]);
            if (hint) {
                this.activeHint = hint;
                this.setStatus(`ðŸ’¡ AI Hint â€” row ${hint.r + 1}, col ${hint.c + 1}`);
                this._showHintTooltip(hint);
                this.renderBoard();
            } else {
                this.setStatus(`âŒ No valid placement for selected piece.`);
            }
        }
    }

    /**
     * Executes the best single move or next step in the precomputed solution.
     */
    makeAutoMove() {
        if (this.bestSequence && this.bestSequence.length > 0) {
            const step = this.bestSequence.shift();
            const ok   = this._placePiece(step.pieceIdx, step.r, step.c);
            if (ok && this.bestSequence.length > 0) {
                this.activeHint    = this.bestSequence[0];
                this.selectedIndex = this.activeHint.pieceIdx;
                this._showHintTooltip(this.activeHint);
            } else {
                this.bestSequence = null;
                this.activeHint   = null;
                this._hideHintTooltip();
            }
            this._updateHandUI();
            this.renderBoard();
            return;
        }
        if (this.selectedIndex < 0 || this.pieceUsed[this.selectedIndex]) return;
        const hint = this._findBestSingleMove(this.hand[this.selectedIndex]);
        if (hint) this._placePiece(this.selectedIndex, hint.r, hint.c);
    }

    /**
     * Solves the entire hand of pieces using Web Worker or permutations search.
     */
    solveEntireHand() {
        this.setStatus('ðŸ¤– AI thinking...');
        if (this.aiWorker) {
            this.aiWorker.postMessage({
                type: 'solve',
                board: this.board,
                hand: this.hand,
                pieceUsed: this.pieceUsed,
            });
        } else {
            setTimeout(() => {
                const seq = this._findBestSequence();
                if (seq && seq.length > 0) {
                    this.bestSequence = seq;
                    this.activeHint   = seq[0];
                    this.selectedIndex = seq[0].pieceIdx;
                    this._updateHandUI();
                    this._showHintTooltip(seq[0]);
                    this.renderBoard();
                    this.setStatus(`âœ… Optimal sequence found! ${seq.reduce((a, b) => a + b.lines, 0)} lines. Press Auto Move.`);
                } else {
                    this.setStatus('âŒ No optimal sequence found.');
                    this.showAiHint();
                }
            }, 50);
        }
    }

    _findBestSingleMove(blockKey) {
        if (!blockKey) return null;
        let best = null, maxScore = -Infinity;
        for (let r = 0; r < this.GRID; r++) {
            for (let c = 0; c < this.GRID; c++) {
                if (this.canPlace(r, c, blockKey)) {
                    const { nextBoard, lines } = this._simulatePlacement(this.board, r, c, blockKey);
                    let occupied = 0;
                    nextBoard.forEach(row => row.forEach(cell => { if (cell) occupied++; }));
                    let holes = 0;
                    for (let ri = 0; ri < 8; ri++) for (let ci = 0; ci < 8; ci++) {
                        if (!nextBoard[ri][ci]) {
                            let n = 0;
                            if (ri === 0 || nextBoard[ri-1][ci]) n++;
                            if (ri === 7 || nextBoard[ri+1][ci]) n++;
                            if (ci === 0 || nextBoard[ri][ci-1]) n++;
                            if (ci === 7 || nextBoard[ri][ci+1]) n++;
                            if (n === 4) holes += 2;
                            else if (n === 3) holes += 1;
                        }
                    }
                    const score = (lines * 100) - (occupied * 10) - (holes * 50);
                    if (score > maxScore) { maxScore = score; best = { r, c, blockKey, score, lines }; }
                }
            }
        }
        return best;
    }

    _findBestSequence() {
        const unused = this.pieceUsed.reduce((a, u, i) => { if (!u && this.hand[i]) a.push(i); return a; }, []);
        if (!unused.length) return null;
        let bestScore = -Infinity, bestSeq = null;
        const perms = this._permutations(unused);
        for (const p of perms) {
            this._searchSeq(this.board, p, 0, [], (seq, sc) => {
                if (sc > bestScore) { bestScore = sc; bestSeq = seq; }
            });
        }
        return bestSeq;
    }

    _permutations(arr) {
        if (arr.length <= 1) return [arr];
        return arr.flatMap((v, i) => this._permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [v, ...p]));
    }

    _searchSeq(board, indices, depth, path, cb) {
        if (depth === indices.length) {
            let totalLines = 0, occupied = 0, holes = 0;
            path.forEach(s => totalLines += s.lines);
            const fb = path[path.length - 1].board;
            for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
                if (fb[r][c]) { occupied++; }
                else {
                    let n = 0;
                    if (r === 0 || fb[r-1][c]) n++;
                    if (r === 7 || fb[r+1][c]) n++;
                    if (c === 0 || fb[r][c-1]) n++;
                    if (c === 7 || fb[r][c+1]) n++;
                    if (n === 4) holes += 2; else if (n === 3) holes++;
                }
            }
            cb([...path], (totalLines * 1000) - (occupied * 10) - (holes * 50));
            return;
        }

        const pieceIdx = indices[depth];
        const blockKey = this.hand[pieceIdx];
        let found = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this._canPlaceOnBoard(board, r, c, blockKey)) {
                    found = true;
                    const { nextBoard, lines } = this._simulatePlacement(board, r, c, blockKey);
                    path.push({ pieceIdx, r, c, blockKey, lines, board: nextBoard });
                    this._searchSeq(nextBoard, indices, depth + 1, path, cb);
                    path.pop();
                }
            }
        }
        if (!found && path.length > 0) {
            let tl = 0, occ = 0;
            path.forEach(s => tl += s.lines);
            path[path.length - 1].board.forEach(row => row.forEach(c => { if (c) occ++; }));
            cb([...path], (tl * 1000) - occ - 5000);
        }
    }

    _canPlaceOnBoard(board, r, c, blockKey) {
        const { shape } = BLOCK_DECODER[blockKey];
        if (r < 0 || c < 0 || r + shape.length > 8 || c + shape[0].length > 8) return false;
        for (let i = 0; i < shape.length; i++)
            for (let j = 0; j < shape[0].length; j++)
                if (shape[i][j] && board[r + i][c + j] !== null) return false;
        return true;
    }

    _simulatePlacement(board, r, c, blockKey) {
        const nextBoard = board.map(row => [...row]);
        const { shape, color } = BLOCK_DECODER[blockKey];
        for (let i = 0; i < shape.length; i++)
            for (let j = 0; j < shape[0].length; j++)
                if (shape[i][j]) nextBoard[r + i][c + j] = color;

        const rows = [], cols = [];
        for (let ri = 0; ri < 8; ri++) if (nextBoard[ri].every(c => c !== null)) rows.push(ri);
        for (let ci = 0; ci < 8; ci++) { let f = true; for (let ri = 0; ri < 8; ri++) if (!nextBoard[ri][ci]) { f = false; break; } if (f) cols.push(ci); }
        rows.forEach(ri => { for (let ci = 0; ci < 8; ci++) nextBoard[ri][ci] = null; });
        cols.forEach(ci => { for (let ri = 0; ri < 8; ri++) nextBoard[ri][ci] = null; });
        return { nextBoard, lines: rows.length + cols.length };
    }

    // ===================== Canvas Rendering =====================

    _getCellXY(r, c) {
        return {
            x: this.padding + c * (this.cellSize + this.gridGap),
            y: this.padding + r * (this.cellSize + this.gridGap),
        };
    }

    /**
     * Renders the complete game grid, empty tiles, placed blocks, hover previews, and AI hints.
     */
    renderBoard() {
        const bg = getComputedStyle(document.body).getPropertyValue('--cell-empty').trim() || '#1e2636';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Base Grid
        for (let r = 0; r < this.GRID; r++) {
            for (let c = 0; c < this.GRID; c++) {
                const { x, y } = this._getCellXY(r, c);
                if (this.board[r][c]) {
                    this._drawCell(x, y, this.cellSize, this.board[r][c]);
                } else {
                    this._drawEmpty(x, y, this.cellSize, bg);
                }
            }
        }

        // AI Hint
        if (this.activeHint) {
            const { r, c, blockKey } = this.activeHint;
            const { shape } = BLOCK_DECODER[blockKey];
            for (let i = 0; i < shape.length; i++)
                for (let j = 0; j < shape[0].length; j++)
                    if (shape[i][j]) {
                        const { x, y } = this._getCellXY(r + i, c + j);
                        this._drawCell(x, y, this.cellSize, '#f1c40f', true, this.hintAlpha);
                    }
        }

        // Hover Preview
        if (this.hoverCell && this.selectedIndex >= 0 && !this.pieceUsed[this.selectedIndex]) {
            const { r, c } = this.hoverCell;
            const blockKey = this.hand[this.selectedIndex];
            const valid    = this.canPlace(r, c, blockKey);
            const { shape, color } = BLOCK_DECODER[blockKey];
            for (let i = 0; i < shape.length; i++)
                for (let j = 0; j < shape[0].length; j++)
                    if (shape[i][j]) {
                        const tr = r + i, tc = c + j;
                        if (tr < this.GRID && tc < this.GRID) {
                            const { x, y } = this._getCellXY(tr, tc);
                            this._drawCell(x, y, this.cellSize, valid ? color : '#e74c3c', true, 0.55);
                        }
                    }
        }
    }

    _drawEmpty(x, y, sz, bg) {
        this.ctx.save();
        this.ctx.fillStyle = bg;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, sz, sz, 6);
        this.ctx.fill();
        const g = this.ctx.createRadialGradient(x + sz/2, y + sz/2, sz * 0.1, x + sz/2, y + sz/2, sz * 0.7);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.18)');
        this.ctx.fillStyle = g;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, sz, sz, 6);
        this.ctx.fill();
        this.ctx.restore();
    }

    _drawCell(x, y, sz, color, outline = false, alpha = 1.0) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        if (!outline) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, sz, sz, 7);
            this.ctx.fill();

            // Gloss Highlight
            const gloss = this.ctx.createLinearGradient(x, y, x, y + sz);
            gloss.addColorStop(0, 'rgba(255,255,255,0.28)');
            gloss.addColorStop(0.5, 'rgba(255,255,255,0.06)');
            gloss.addColorStop(1, 'rgba(0,0,0,0.1)');
            this.ctx.fillStyle = gloss;
            this.ctx.beginPath();
            this.ctx.roundRect(x + 1, y + 1, sz - 2, sz - 2, 6);
            this.ctx.fill();

            if (this.colorBlindMode) this._drawPattern(x, y, sz, color);
        } else {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, sz, sz, 7);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            this.ctx.lineWidth   = 2;
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    _drawPattern(x, y, sz, color) {
        const pattern = CB_PATTERNS[color] || 'dots';
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        this.ctx.lineWidth   = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, sz, sz, 7);
        this.ctx.clip();

        const sp = 6;
        if (pattern === 'hlines') {
            for (let dy = sp / 2; dy < sz; dy += sp) { this.ctx.moveTo(x, y + dy); this.ctx.lineTo(x + sz, y + dy); }
        } else if (pattern === 'vlines') {
            for (let dx = sp / 2; dx < sz; dx += sp) { this.ctx.moveTo(x + dx, y); this.ctx.lineTo(x + dx, y + sz); }
        } else if (pattern === 'diag1') {
            for (let d = -sz; d < sz * 2; d += sp) { this.ctx.moveTo(x + d, y); this.ctx.lineTo(x + d + sz, y + sz); }
        } else if (pattern === 'diag2') {
            for (let d = -sz; d < sz * 2; d += sp) { this.ctx.moveTo(x + d + sz, y); this.ctx.lineTo(x + d, y + sz); }
        } else if (pattern === 'cross') {
            for (let dy = sp / 2; dy < sz; dy += sp) { this.ctx.moveTo(x, y + dy); this.ctx.lineTo(x + sz, y + dy); }
            for (let dx = sp / 2; dx < sz; dx += sp) { this.ctx.moveTo(x + dx, y); this.ctx.lineTo(x + dx, y + sz); }
        } else if (pattern === 'checker') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
            for (let row = 0; row < sz / sp; row++)
                for (let col = 0; col < sz / sp; col++)
                    if ((row + col) % 2 === 0) this.ctx.fillRect(x + col * sp, y + row * sp, sp, sp);
        } else {
            for (let dy = sp; dy < sz; dy += sp) for (let dx = sp; dx < sz; dx += sp) {
                this.ctx.moveTo(x + dx, y + dy); this.ctx.arc(x + dx, y + dy, 1.2, 0, Math.PI * 2);
            }
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    // ===================== Hand UI & Stuck Indicators =====================

    _updateHandUI(animate = false) {
        document.querySelectorAll('.hand-card').forEach((card, idx) => {
            const isSelected = idx === this.selectedIndex;
            const isUsed = this.pieceUsed[idx];
            const blockKey = this.hand[idx];

            // Check if this piece is stuck (unplaceable anywhere)
            let isStuck = false;
            if (!isUsed && blockKey) {
                let canFitAnywhere = false;
                for (let r = 0; r < this.GRID && !canFitAnywhere; r++) {
                    for (let c = 0; c < this.GRID && !canFitAnywhere; c++) {
                        if (this.canPlace(r, c, blockKey)) canFitAnywhere = true;
                    }
                }
                isStuck = !canFitAnywhere;
            }

            card.className = `hand-card${isSelected ? ' selected' : ''}${isUsed ? ' used' : ''}${isStuck ? ' stuck' : ''}${animate ? ' fly-in' : ''}`;
            if (animate) { void card.offsetWidth; }
            card.innerHTML = '';

            if (isUsed) {
                card.innerHTML = '<span style="color:var(--text-muted);font-weight:700;font-size:11px;letter-spacing:1px;">PLACED</span>';
                return;
            }

            if (blockKey) {
                card.appendChild(this._renderMiniCanvas(blockKey));
                if (isStuck) {
                    const warn = document.createElement('span');
                    warn.style.cssText = 'position:absolute;bottom:4px;font-size:9px;font-weight:800;color:var(--danger);letter-spacing:0.5px;';
                    warn.textContent = 'NO SPACE';
                    card.appendChild(warn);
                }
            }
        });
    }

    _renderMiniCanvas(blockKey) {
        const { shape, color } = BLOCK_DECODER[blockKey];
        const rows = shape.length, cols = shape[0].length;
        const canvas = document.createElement('canvas');
        const miniCell = 14, gap = 2;
        canvas.width  = cols * (miniCell + gap);
        canvas.height = rows * (miniCell + gap);
        const ctx = canvas.getContext('2d');

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const x = c * (miniCell + gap), y = r * (miniCell + gap);
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.roundRect(x, y, miniCell, miniCell, 3);
                    ctx.fill();
                    const g = ctx.createLinearGradient(x, y, x, y + miniCell);
                    g.addColorStop(0, 'rgba(255,255,255,0.3)');
                    g.addColorStop(1, 'rgba(0,0,0,0.05)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.roundRect(x, y, miniCell, miniCell, 3);
                    ctx.fill();
                }
            }
        }
        return canvas;
    }

    // ===================== Stats & Overlays =====================

    _computePPM() {
        if (!this.sessionStartTime || this.totalBlocksPlaced === 0) return '0.0';
        const elapsedMins = (Date.now() - this.sessionStartTime) / 60000;
        if (elapsedMins < 0.05) return '0.0';
        return (this.totalBlocksPlaced / elapsedMins).toFixed(1);
    }

    _updateStatsUI(skipScore = false) {
        if (!skipScore) {
            document.getElementById('score-val').textContent = this.score;
        }
        document.getElementById('best-val').textContent   = this.bestScore;
        document.getElementById('streak-val').textContent = `${this.streak}x`;
        document.getElementById('level-val').textContent  = this.level;

        const safe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        safe('best-val-modal',   this.bestScore);
        safe('max-streak-val',   `${this.maxStreak}x`);
        safe('total-placed-val', this.totalBlocksPlaced);
        safe('games-played-val', this.gamesPlayed);
        safe('total-lines-val',  this.totalLinesCleared);
        safe('max-level-val',    this.maxLevel);
        safe('ppm-val',          this._computePPM());

        const avg = this.gamesPlayed > 0 ? Math.round(this.totalScoreAccum / this.gamesPlayed) : 0;
        safe('avg-score-val',    avg);
    }

    setStatus(msg) {
        document.getElementById('status-msg').textContent = msg;
    }

    _triggerOverlay(text) {
        const el = document.getElementById('combo-overlay');
        el.textContent = text;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1300);
    }

    _triggerLevelUp() {
        const el = document.getElementById('levelup-overlay');
        el.textContent = `â¬† LEVEL ${this.level}`;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1600);

        const lv = document.getElementById('level-val');
        lv.textContent = this.level;
        lv.classList.add('pop');
        setTimeout(() => lv.classList.remove('pop'), 350);
    }

    _triggerNewBest() {
        const el = document.getElementById('newbest-overlay');
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 2200);
    }

    // ===================== Mouse Handlers =====================

    _getCell(e) {
        const rect   = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width  / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mx     = (e.clientX - rect.left) * scaleX;
        const my     = (e.clientY - rect.top)  * scaleY;
        const c      = Math.floor((mx - this.padding) / (this.cellSize + this.gridGap));
        const r      = Math.floor((my - this.padding) / (this.cellSize + this.gridGap));
        if (r >= 0 && r < this.GRID && c >= 0 && c < this.GRID) return { r, c };
        return null;
    }

    _handleMouseMove(e) {
        this.hoverCell = this._getCell(e);
        this.renderBoard();
    }

    _handleCanvasClick(e) {
        const cell = this._getCell(e);
        if (!cell) return;

        if (this.editMode) {
            this.board[cell.r][cell.c] = this.board[cell.r][cell.c] ? null : '#3498db';
            this.renderBoard();
            return;
        }

        this._placePiece(this.selectedIndex, cell.r, cell.c);
    }

    // ===================== Persistence =====================

    _loadGame() {
        const saved = localStorage.getItem(STORAGE_PREFIX + 'state');
        if (!saved) return false;
        try {
            const s = JSON.parse(saved);
            if (!Array.isArray(s.board) || s.board.length !== 8) return false;
            if (!Array.isArray(s.hand)  || s.hand.length  !== 3) return false;
            if (typeof s.score !== 'number') return false;

            this.board              = s.board;
            this.hand               = s.hand;
            this.pieceUsed          = s.pieceUsed       || [false, false, false];
            this.score              = s.score;
            this.streak             = s.streak          || 0;
            this.maxStreak          = s.maxStreak        || 0;
            this.totalBlocksPlaced  = s.totalBlocksPlaced || 0;
            this.totalLinesCleared  = s.totalLinesCleared || 0;
            this.level              = s.level            || 1;
            this.bestScore          = s.bestScore        || parseInt(localStorage.getItem(STORAGE_PREFIX + 'best') || '0');

            this._updateStatsUI();
            this._updateHandUI(false);
            this.renderBoard();
            this._checkGameOver();
            return true;
        } catch (err) {
            console.warn('Corrupt save state, starting fresh.', err);
            return false;
        }
    }

    _saveGame() {
        const s = {
            board: this.board, hand: this.hand, pieceUsed: this.pieceUsed,
            score: this.score, streak: this.streak, maxStreak: this.maxStreak,
            totalBlocksPlaced: this.totalBlocksPlaced, totalLinesCleared: this.totalLinesCleared,
            level: this.level, bestScore: this.bestScore,
        };
        localStorage.setItem(STORAGE_PREFIX + 'state', JSON.stringify(s));
    }
}

// ===================== PWA Dynamic Manifest =====================
function injectManifest() {
    const manifest = {
        name: 'Block Blast Pro',
        short_name: 'Block Blast',
        description: 'Premium block puzzle game with AI solver and daily challenges',
        start_url: '.',
        display: 'standalone',
        background_color: '#0f1219',
        theme_color: '#0f1219',
        icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const link = document.createElement('link');
    link.rel  = 'manifest';
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
}

// ===================== App Boot =====================
window.addEventListener('DOMContentLoaded', () => {
    injectManifest();
    window._app = new BlockBlastApp();
});

