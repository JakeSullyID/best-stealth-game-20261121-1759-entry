import { parseLevel } from './levels.js';

export function stageShot(name, state) {
    // Reset world with fixed seed/level
    state.levelIndex = 0;
    state.level = parseLevel(0);
    state.player = {
        x: state.level.playerStart.x,
        y: state.level.playerStart.y,
        angle: 0,
        speed: 170,
        inDarkness: true
    };
    state.timer = 45;
    state.score = 1500;

    if (name === 'cover') {
        state.gameMode = 'PLAY';
        // Position player and guard with crate between them on level 1 open floor
        state.player.x = 940;
        state.player.y = 380;
        if (state.level.guards[0]) {
            state.level.guards[0].x = 700;
            state.level.guards[0].y = 380;
            state.level.guards[0].angle = 0; // facing right
        }
    } else if (name === 'nearmiss') {
        state.gameMode = 'PLAY';
        state.player.x = 380;
        state.player.y = 300;
        if (state.level.guards[0]) {
            state.level.guards[0].x = 200;
            state.level.guards[0].y = 300;
            state.level.guards[0].angle = 0; // facing right
            state.level.guards[0].state = 'SUSPICIOUS';
            state.level.guards[0].suspicion = 50;
        }
    } else if (name === 'alert') {
        state.gameMode = 'PLAY';
        state.player.x = 340;
        state.player.y = 300;
        if (state.level.guards[0]) {
            state.level.guards[0].x = 200;
            state.level.guards[0].y = 300;
            state.level.guards[0].angle = 0; // facing right
            state.level.guards[0].state = 'ALERTED';
            state.level.guards[0].suspicion = 100;
        }
    } else if (name === 'win') {
        // Collect artifact and reach exit
        if (state.level.artifact) state.level.artifact.collected = true;
        if (state.level.exit) state.level.exit.active = true;
        state.gameMode = 'WIN';
    }
}
