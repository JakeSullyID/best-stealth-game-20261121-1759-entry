import { CONFIG } from './config.js';

export function hasLineOfSight(x0, y0, x1, y1, level) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    if (dist > CONFIG.CONE_RANGE * 1.2) return false;

    const steps = Math.ceil(dist / (CONFIG.TILE_SIZE / 4));
    const stepX = dx / steps;
    const stepY = dy / steps;

    let cx = x0;
    let cy = y0;

    for (let i = 0; i <= steps; i++) {
        // check if (cx, cy) collides with any wall or crate
        const tileCol = Math.floor(cx / CONFIG.TILE_SIZE);
        const tileRow = Math.floor(cy / CONFIG.TILE_SIZE);

        for (const w of level.walls) {
            if (w.col === tileCol && w.row === tileRow) return false;
        }
        for (const c of level.crates) {
            if (Math.floor(c.x / CONFIG.TILE_SIZE) === tileCol && Math.floor(c.y / CONFIG.TILE_SIZE) === tileRow) {
                return false;
            }
        }
        cx += stepX;
        cy += stepY;
    }
    return true;
}

export function conePolygon(guard, level) {
    const rays = 15;
    const halfAngleRad = (CONFIG.CONE_HALF_ANGLE * Math.PI) / 180;
    const points = [{ x: guard.x, y: guard.y }];

    for (let i = 0; i <= rays; i++) {
        const t = i / rays;
        const angle = guard.angle - halfAngleRad + t * (halfAngleRad * 2);
        
        // Cast ray up to CONE_RANGE
        let rayDist = CONFIG.CONE_RANGE;
        const step = 8;
        for (let d = step; d <= CONFIG.CONE_RANGE; d += step) {
            const rx = guard.x + Math.cos(angle) * d;
            const ry = guard.y + Math.sin(angle) * d;
            const col = Math.floor(rx / CONFIG.TILE_SIZE);
            const row = Math.floor(ry / CONFIG.TILE_SIZE);

            let hit = false;
            for (const w of level.walls) {
                if (w.col === col && w.row === row) { hit = true; break; }
            }
            if (!hit) {
                for (const c of level.crates) {
                    if (Math.floor(c.x / CONFIG.TILE_SIZE) === col && Math.floor(c.y / CONFIG.TILE_SIZE) === row) {
                        hit = true; break;
                    }
                }
            }
            if (hit) {
                rayDist = d;
                break;
            }
        }
        points.push({
            x: guard.x + Math.cos(angle) * rayDist,
            y: guard.y + Math.sin(angle) * rayDist
        });
    }
    return points;
}

export function detectionRate(player, guard, level) {
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy);

    if (dist > CONFIG.CONE_RANGE) return 0;

    const angleToPlayer = Math.atan2(dy, dx);
    let angleDiff = angleToPlayer - guard.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    const halfAngleRad = (CONFIG.CONE_HALF_ANGLE * Math.PI) / 180;
    if (Math.abs(angleDiff) > halfAngleRad) return 0;

    if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, level)) return 0;

    // Closeness factor (0.2 at max range to 1.0 at zero range)
    const closeness = 1.0 - (dist / CONFIG.CONE_RANGE);
    let rate = CONFIG.DETECTION_BASE_RATE * (0.3 + 0.7 * closeness);

    // Check if player is in lamplight
    for (const lamp of level.lamps) {
        if (Math.hypot(player.x - lamp.x, player.y - lamp.y) < lamp.radius) {
            rate *= CONFIG.LAMPLIGHT_DETECTION_MULT;
            break;
        }
    }

    return rate;
}
