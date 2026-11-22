[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/JakeSullyID/best-stealth-game-20261121-1759-entry/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/JakeSullyID/best-stealth-game-20261121-1759-entry/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/reward?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# SHADOW VAULT

SHADOW VAULT is a top-down 2D canvas stealth heist game built for the `best-stealth-game-20261121-1759` make.fun bounty. Infiltrate a heavily guarded museum at night, steal the golden artifact, collect glowing gems, and escape through the green exit unseen!

## Gameplay & Stealth Mechanics

- **Lamplight vs Darkness:** Warm amber light pools mark danger zones where guard detection fills rapidly. Dark floors and crate shadows are your safe havens.
- **Guard States:** Guards patrol fixed routes. If you enter their yellow vision cone, the detection meter fills (growing faster close-up or in lamplight). At 35% they become suspicious (`?`), and at 100% (`!`) they alert, chase, and sound the alarm.
- **Movement:** Use WASD/Arrows to walk or click any floor tile to move. Hold `Shift` to run (faster, but noise alerts nearby guards).
- **Objectives:** Collect cyan gems for bonus score, steal the golden artifact to unlock the green exit, and reach the exit to progress to the next museum wing across 3 challenging levels.

## Controls

- **Movement:** `W, A, S, D` or `Arrow Keys` (or click floor tile to walk)
- **Run:** Hold `Shift`
- **Actions:** `Enter` (Start / Restart / Next Level), `P` (Pause), `M` (Mute Audio), `R` (Restart Level)

## File Structure

- `game/index.html` - HTML container and canvas
- `game/src/config.js` - Game tuning constants
- `game/src/random.js` - Seeded PRNG
- `game/src/levels.js` - Level ASCII maps and parsing
- `game/src/input.js` - Keyboard and mouse input handlers
- `game/src/vision.js` - Line-of-sight and vision cone math
- `game/src/guards.js` - Guard AI state machine
- `game/src/audio.js` - Synthesized WebAudio sound effects
- `game/src/render.js` - Canvas graphics and HUD rendering
- `game/src/shots.js` - Deterministic screenshot scene staging
- `game/src/main.js` - Main game loop and state management
- `main.ts` - Hand-in dossier build script
- `serve.ts` - Local development server

## Running Locally

```bash
# Start local dev server
npx tsx serve.ts

# Build hand-in dossier
npx tsx main.ts
```
