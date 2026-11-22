import { CONFIG } from './config.js';

export const LEVELS = [
    {
        name: "The Gallery",
        map: [
            "################################",
            "#P...#.......L.......C.........#",
            "#.##.#.#####.#####.#####.#####.#",
            "#.#..#.....#.....#.....#.....#.#",
            "#.#.####.#.###.#.###.#.###.#.#.#",
            "#.#......#...G.#...#.#...G.#.#.#",
            "#.########.#.###.#.###.#.###.#.#",
            "#..........#.....#.....#.....#.#",
            "#.##########.#####.#####.#####.#",
            "#.#L.........L........C........#",
            "#.############################.#",
            "#.#............G.............#.#",
            "#.#.##########.#.###########.#.#",
            "#.#..........#.#.#.........#.#.#",
            "#.##########.#.#.#.#######.#...#",
            "#............#.#...A.....#.#.E.#",
            "#.############.#.#######.#.##..#",
            "################################"
        ],
        guards: [
            { waypoints: [[2, 7], [9, 7]] },
            { waypoints: [[5, 11], [26, 11]] }
        ]
    },
    {
        name: "The Vault Hall",
        map: [
            "################################",
            "#P...C...L.....C.....L.....C...#",
            "#.#####.#####.####.#####.#####.#",
            "#.#...#.#...#....#.#...#.#...#.#",
            "#.#.#.#.#.#.#..#.#.#.#.#.#.#.#.#",
            "#.#.G.#.#.G.#..G.#.#.G.#.#.#.#.#",
            "#.#.#.#.#.#.#..#.#.#.#.#.#.#.#.#",
            "#.#...#.#...#....#.#...#.#...#.#",
            "#.#####.#####.####.#####.#####.#",
            "#...L.....C.....L.....C.....L..#",
            "#.#####.#####.####.#####.#####.#",
            "#.#...#.#...#....#.#...#.#...#.#",
            "#.#.#.#.#.#.#..#.#.#.#.#.#.#.#.#",
            "#.#.C.#.#.C.#..C.#.#.C.#.#.A...#",
            "#.#.#.#.#.#.#..#.#.#.#.#.#.#.#.#",
            "#.#...#.#...#....#.#...#.#...#.#",
            "#.#####.#####.####.#####.####.E#",
            "################################"
        ],
        guards: [
            { waypoints: [[2, 9], [8, 9]] },
            { waypoints: [[12, 9], [20, 9]] },
            { waypoints: [[7, 3], [7, 14]] }
        ]
    },
    {
        name: "The Night Wing",
        map: [
            "################################",
            "#P...#...#...L...#...#...#...E.#",
            "#.##.#.#.#.#####.#.#.#.#.#####.#",
            "#.#..#.#.#.....#.#.#.#.#.....#.#",
            "#.#.##.###.###.#.###.###.###.#.#",
            "#.#.G..#...G.#.#...G.#.#.#.#.#.#",
            "#.#.####.#####.#.#####.#####.#.#",
            "#.#......C.....C.....C.......#.#",
            "#.############.#.#############.#",
            "#.#L.........L.#.L.........L.#.#",
            "#.#.##########.#.###########.#.#",
            "#.#..........#.#.#.........#.#.#",
            "#.##########.#.#.#.#######.#.#.#",
            "#............#.#.#.A.....#.#...#",
            "#.############.#.#######.#.###.#",
            "#..............#...............#",
            "#.############################.#",
            "################################"
        ],
        guards: [
            { waypoints: [[4, 7], [7, 7]] },
            { waypoints: [[4, 9], [13, 9]] },
            { waypoints: [[14, 4], [14, 14]] },
            { waypoints: [[17, 15], [29, 15]] }
        ]
    }
];

export function parseLevel(levelIndex) {
    const raw = LEVELS[levelIndex % LEVELS.length];
    const walls = [];
    const crates = [];
    const lamps = [];
    const gems = [];
    let artifact = null;
    let exit = null;
    let playerStart = { x: 80, y: 80 };

    for (let r = 0; r < raw.map.length; r++) {
        const row = raw.map[r];
        for (let c = 0; c < row.length; c++) {
            const ch = row[c];
            const px = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const tileBox = {
                x: c * CONFIG.TILE_SIZE,
                y: r * CONFIG.TILE_SIZE,
                w: CONFIG.TILE_SIZE,
                h: CONFIG.TILE_SIZE,
                col: c,
                row: r
            };

            if (ch === '#') walls.push(tileBox);
            else if (ch === 'C') crates.push(tileBox);
            else if (ch === 'L') lamps.push({ x: px, y: py, radius: 110 });
            else if (ch === 'G') gems.push({ x: px, y: py, collected: false, radius: 14 });
            else if (ch === 'A') artifact = { x: px, y: py, collected: false, radius: 16 };
            else if (ch === 'E') exit = { x: tileBox.x, y: tileBox.y, active: false, width: CONFIG.TILE_SIZE, height: CONFIG.TILE_SIZE };
            else if (ch === 'P') playerStart = { x: px, y: py };
        }
    }

    const guards = raw.guards.map((g, idx) => {
        const wps = g.waypoints.map(wp => ({
            x: wp[0] * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y: wp[1] * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
        }));
        return {
            id: idx,
            x: wps[0].x,
            y: wps[0].y,
            waypoints: wps,
            wpIndex: 0,
            angle: 0,
            speed: CONFIG.GUARD_PATROL_SPEED,
            state: 'PATROL', // PATROL, SUSPICIOUS, ALERTED, SEARCH
            suspicion: 0,
            searchTimer: 0,
            searchSpot: { x: 0, y: 0 },
            pauseTimer: 0
        };
    });

    return {
        name: raw.name,
        walls,
        crates,
        lamps,
        gems,
        artifact,
        exit,
        playerStart,
        guards
    };
}
