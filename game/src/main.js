// Core game loop coordinating fixed-step updates, input processing, and rendering.
import { CONFIG } from './config.js';
import { parseLevel } from './levels.js';
import { createInput } from './input.js';
import { updateGuard } from './guards.js';
import { audio } from './audio.js';
import { renderGame } from './render.js';
import { stageShot } from './shots.js';

function initGame() {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const input = createInput();

    const state = {
        levelIndex: 0,
        level: parseLevel(0),
        player: {
            x: 80,
            y: 80,
            angle: 0,
            speed: CONFIG.PLAYER_WALK_SPEED,
            inDarkness: true
        },
        gameMode: 'TITLE', // TITLE, PLAY, LEVELCLEAR, WIN, CAUGHT, PAUSED
        timer: 0,
        score: 0,
        clickTarget: null
    };

    resetLevel(state, false);

    // Check URL shot parameter
    const urlParams = new URLSearchParams(window.location.search);
    const shot = urlParams.get('shot');
    if (shot) {
        stageShot(shot, state);
    }

    let lastTime = performance.now();
    let accumulatedTime = 0;
    const fixedDt = CONFIG.STEP_TIME;

    function mainLoop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        accumulatedTime += Math.min(dt, 0.1);

        while (accumulatedTime >= fixedDt) {
            update(fixedDt, input, state);
            accumulatedTime -= fixedDt;
        }

        renderGame(ctx, state);

        if (shot && !window.__shotReady) {
            window.__shotReady = true;
        }

        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

function resetLevel(state, keepScore = true) {
    state.level = parseLevel(state.levelIndex);
    state.player.x = state.level.playerStart.x;
    state.player.y = state.level.playerStart.y;
    state.clickTarget = null;
    if (!keepScore) {
        state.score = 0;
        state.timer = 0;
    }
}

function update(dt, input, state) {
    // Global controls
    if (input.keys['KeyM']) {
        audio.setMuted(!audio.isMuted());
        input.keys['KeyM'] = false; // consume
    }

    if (state.gameMode === 'TITLE') {
        if (input.keys['Enter']) {
            state.gameMode = 'PLAY';
            resetLevel(state, false);
            input.keys['Enter'] = false;
        }
        return;
    }

    if (state.gameMode === 'LEVELCLEAR') {
        if (input.keys['Enter']) {
            state.levelIndex++;
            if (state.levelIndex >= CONFIG.LEVEL_COUNT) {
                state.gameMode = 'WIN';
                audio.playWin();
            } else {
                state.gameMode = 'PLAY';
                resetLevel(state, true);
            }
            input.keys['Enter'] = false;
        }
        return;
    }

    if (state.gameMode === 'WIN') {
        if (input.keys['Enter'] || input.keys['KeyKeyR'] || input.keys['KeyR']) {
            state.levelIndex = 0;
            state.gameMode = 'TITLE';
            input.keys['Enter'] = false;
            input.keys['KeyR'] = false;
            input.keys['KeyKeyR'] = false;
        }
        return;
    }

    if (state.gameMode === 'CAUGHT') {
        if (input.keys['Enter'] || input.keys['KeyR']) {
            state.gameMode = 'PLAY';
            resetLevel(state, true);
            input.keys['Enter'] = false;
            input.keys['KeyR'] = false;
        }
        return;
    }

    if (input.keys['KeyP']) {
        state.gameMode = state.gameMode === 'PAUSED' ? 'PLAY' : 'PAUSED';
        input.keys['KeyP'] = false;
    }

    if (state.gameMode === 'PAUSED') return;

    if (state.gameMode === 'PLAY') {
        state.timer += dt;

        // Player movement input
        let dx = 0;
        let dy = 0;
        if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

        const isRunning = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
        const currentSpeed = isRunning ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_WALK_SPEED;

        const clickPos = input.consumeClick();
        if (clickPos) {
            state.clickTarget = clickPos;
        }

        if (dx !== 0 || dy !== 0) {
            state.clickTarget = null; // keyboard overrides click
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            movePlayer(state.player, dx * currentSpeed * dt, dy * currentSpeed * dt, state.level);
            state.player.angle = Math.atan2(dy, dx);
            audio.playFootstep(isRunning);

            // Running noise alerts nearby guards
            if (isRunning) {
                for (const g of state.level.guards) {
                    if (Math.hypot(g.x - state.player.x, g.y - state.player.y) < CONFIG.NOISE_RADIUS_RUNNING) {
                        g.suspicion = Math.max(g.suspicion, 60);
                        if (g.state === 'PATROL') {
                            g.state = 'SUSPICIOUS';
                        }
                    }
                }
            }
        } else if (state.clickTarget) {
            const cdx = state.clickTarget.x - state.player.x;
            const cdy = state.clickTarget.y - state.player.y;
            const cdist = Math.hypot(cdx, cdy);
            if (cdist < 5) {
                state.clickTarget = null;
            } else {
                const ndx = cdx / cdist;
                const ndy = cdy / cdist;
                movePlayer(state.player, ndx * currentSpeed * dt, ndy * currentSpeed * dt, state.level);
                state.player.angle = Math.atan2(ndy, ndx);
                audio.playFootstep(false);
            }
        }

        // Check darkness / lamplight
        state.player.inDarkness = true;
        for (const lamp of state.level.lamps) {
            if (Math.hypot(state.player.x - lamp.x, state.player.y - lamp.y) < lamp.radius) {
                state.player.inDarkness = false;
                break;
            }
        }

        // Update guards
        for (const g of state.level.guards) {
            const prevState = g.state;
            updateGuard(g, state.player, state.level, dt);
            if (g.state === 'ALERTED' && prevState !== 'ALERTED') {
                audio.playAlert();
            }
            if (g.state === 'ALERTED') {
                const dist = Math.hypot(g.x - state.player.x, g.y - state.player.y);
                if (dist < 26) {
                    state.gameMode = 'CAUGHT';
                    audio.playLose();
                }
            }
        }

        // Check gem pickups
        for (const gem of state.level.gems) {
            if (!gem.collected && Math.hypot(state.player.x - gem.x, state.player.y - gem.y) < 22) {
                gem.collected = true;
                state.score += 100;
                audio.playPickup();
            }
        }

        // Check artifact pickup
        if (state.level.artifact && !state.level.artifact.collected) {
            if (Math.hypot(state.player.x - state.level.artifact.x, state.player.y - state.level.artifact.y) < 25) {
                state.level.artifact.collected = true;
                state.score += 500;
                if (state.level.exit) state.level.exit.active = true;
                audio.playPickup();
            }
        }

        // Check exit
        if (state.level.exit && state.level.exit.active) {
            const e = state.level.exit;
            if (state.player.x >= e.x && state.player.x <= e.x + e.width &&
                state.player.y >= e.y && state.player.y <= e.y + e.height) {
                state.gameMode = 'LEVELCLEAR';
                audio.playWin();
            }
        }
    }
}

function movePlayer(player, vx, vy, level) {
    // Try X movement
    player.x += vx;
    if (checkCollision(player, level)) {
        player.x -= vx;
    }

    // Try Y movement
    player.y += vy;
    if (checkCollision(player, level)) {
        player.y -= vy;
    }
}

function checkCollision(player, level) {
    const r = 12; // player radius
    const box = { x: player.x - r, y: player.y - r, w: r * 2, h: r * 2 };

    for (const w of level.walls) {
        if (boxesIntersect(box, w)) return true;
    }
    for (const c of level.crates) {
        if (boxesIntersect(box, c)) return true;
    }
    return false;
}

function boxesIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initGame();
} else {
    window.addEventListener('DOMContentLoaded', initGame);
}
