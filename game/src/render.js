import { CONFIG } from './config.js';
import { conePolygon } from './vision.js';

export function renderGame(ctx, state) {
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 1. Draw floor
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.strokeStyle = '#181b22';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += CONFIG.TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= CONFIG.CANVAS_HEIGHT; y += CONFIG.TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
        ctx.stroke();
    }

    const level = state.level;

    // 2. Draw lamps (light pools on floor)
    for (const lamp of level.lamps) {
        const grad = ctx.createRadialGradient(lamp.x, lamp.y, 10, lamp.x, lamp.y, lamp.radius);
        grad.addColorStop(0, 'rgba(255, 180, 50, 0.25)');
        grad.addColorStop(0.7, 'rgba(255, 150, 30, 0.08)');
        grad.addColorStop(1, 'rgba(255, 120, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Draw exit
    if (level.exit) {
        ctx.fillStyle = level.exit.active ? 'rgba(46, 204, 113, 0.3)' : 'rgba(100, 100, 100, 0.15)';
        ctx.fillRect(level.exit.x, level.exit.y, level.exit.width, level.exit.height);
        ctx.strokeStyle = level.exit.active ? '#2ecc71' : '#555';
        ctx.lineWidth = 3;
        ctx.strokeRect(level.exit.x, level.exit.y, level.exit.width, level.exit.height);

        ctx.fillStyle = level.exit.active ? '#2ecc71' : '#777';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', level.exit.x + level.exit.width / 2, level.exit.y + level.exit.height / 2 + 4);
    }

    // 4. Draw gems
    for (const g of level.gems) {
        if (g.collected) continue;
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.restore();
    }

    // 5. Draw artifact
    if (level.artifact && !level.artifact.collected) {
        const a = level.artifact;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(Date.now() * 0.002);
        ctx.fillStyle = '#f1c40f';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;
        ctx.fillRect(-11, -11, 22, 22);
        ctx.restore();
    }

    // 6. Draw crates (cover)
    for (const c of level.crates) {
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
        // cross planks
        ctx.beginPath();
        ctx.moveTo(c.x + 4, c.y + 4);
        ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
        ctx.moveTo(c.x + c.w - 4, c.y + 4);
        ctx.lineTo(c.x + 4, c.y + c.h - 4);
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 7. Draw walls
    for (const w of level.walls) {
        ctx.fillStyle = '#212529';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#343a40';
        ctx.fillRect(w.x, w.y, w.w, 4); // top highlight
        ctx.strokeStyle = '#101214';
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    // 8. Draw vision cones
    for (const g of level.guards) {
        const poly = conePolygon(g, level);
        if (poly.length > 2) {
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) {
                ctx.lineTo(poly[i].x, poly[i].y);
            }
            ctx.closePath();

            if (g.state === 'ALERTED') {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
            } else if (g.state === 'SUSPICIOUS') {
                ctx.fillStyle = 'rgba(241, 196, 15, 0.22)';
            } else {
                ctx.fillStyle = 'rgba(243, 156, 18, 0.12)';
            }
            ctx.fill();
        }
    }

    // 9. Draw guards
    for (const g of level.guards) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.angle);

        // Body
        ctx.fillStyle = g.state === 'ALERTED' ? '#c0392b' : (g.state === 'SUSPICIOUS' ? '#d35400' : '#e67e22');
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Nose tick
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, -3, 8, 6);
        ctx.restore();

        // Status indicator above guard
        if (g.state === 'ALERTED') {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', g.x, g.y - 22);
        } else if (g.state === 'SUSPICIOUS' || g.suspicion > 5) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', g.x, g.y - 22);
        }
    }

    // 10. Draw player
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    ctx.fillStyle = p.inDarkness ? '#1abc9c' : '#16a085';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player direction tick
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, -2, 7, 4);
    ctx.restore();

    // 11. HUD Top Bar
    ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 50);
    ctx.strokeStyle = '#1f2833';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, 50);
    ctx.stroke();

    // Objective text
    ctx.fillStyle = '#c5c6c7';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    const objText = level.artifact && !level.artifact.collected ? "Objective: Steal Golden Artifact" : "Objective: Reach Green EXIT!";
    ctx.fillText(`${level.name} | ${objText}`, 20, 31);

    // Detection meter (center)
    const maxSuspicion = level.guards.reduce((max, g) => Math.max(max, g.suspicion), 0);
    const barW = 200;
    const barH = 14;
    const barX = CONFIG.CANVAS_WIDTH / 2 - barW / 2;
    const barY = 18;

    ctx.fillStyle = '#1f2833';
    ctx.fillRect(barX, barY, barW, barH);
    const fillW = (maxSuspicion / CONFIG.ALERT_THRESHOLD) * barW;
    ctx.fillStyle = maxSuspicion > CONFIG.SUSPICIOUS_THRESHOLD ? '#e74c3c' : '#f1c40f';
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.strokeStyle = '#c5c6c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`DETECTION: ${Math.round(maxSuspicion)}%`, CONFIG.CANVAS_WIDTH / 2, barY + 11);

    // Right HUD: Gems, Time
    ctx.textAlign = 'right';
    const gemsCollected = level.gems.filter(g => g.collected).length;
    ctx.fillText(`Gems: ${gemsCollected}/${level.gems.length} | Time: ${Math.floor(state.timer)}s`, CONFIG.CANVAS_WIDTH - 20, 31);

    // Bottom Hint Line
    ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 30, CONFIG.CANVAS_WIDTH, 30);
    ctx.fillStyle = '#8c92a4';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("WASD/Arrows to Move | SHIFT to Run (Loud!) | Click to Walk | P: Pause | M: Mute | R: Restart", CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 10);

    // 12. State Overlays
    if (state.gameMode === 'TITLE') {
        drawOverlay(ctx, "SHADOW VAULT", "Steal the golden artifact from the museum at night. Avoid guard lamplight and vision cones.\nDarkness is safety. Warm light pools increase detection speed.\n\nPress ENTER to begin heist", "#66fcf1");
    } else if (state.gameMode === 'LEVELCLEAR') {
        drawOverlay(ctx, "LEVEL CLEAR", `Completed ${level.name}!\n\nPress ENTER for next level`, "#2ecc71");
    } else if (state.gameMode === 'WIN') {
        drawOverlay(ctx, "VAULT CRACKED", `All wings successfully looted!\nFinal Time: ${Math.floor(state.timer)}s | Score: ${state.score}\n\nPress ENTER to play again`, "#f1c40f");
    } else if (state.gameMode === 'CAUGHT') {
        drawOverlay(ctx, "CAUGHT!", "Guards sounded the alarm and cornered you.\n\nPress R or ENTER to retry", "#e74c3c");
    } else if (state.gameMode === 'PAUSED') {
        drawOverlay(ctx, "PAUSED", "Game Paused\n\nPress P to resume", "#c5c6c7");
    }
}

function drawOverlay(ctx, title, subtitle, titleColor) {
    ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.fillStyle = titleColor;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 20;
    ctx.fillText(title, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#c5c6c7';
    ctx.font = '20px sans-serif';
    
    const lines = subtitle.split('\n');
    let startY = CONFIG.CANVAS_HEIGHT / 2;
    for (const line of lines) {
        ctx.fillText(line, CONFIG.CANVAS_WIDTH / 2, startY);
        startY += 28;
    }
}
