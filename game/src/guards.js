import { CONFIG } from './config.js';
import { detectionRate, hasLineOfSight } from './vision.js';

export function updateGuard(guard, player, level, dt) {
    // Handle state machine
    const targetWp = guard.waypoints[guard.wpIndex];

    if (guard.state === 'PATROL') {
        guard.speed = CONFIG.GUARD_PATROL_SPEED;
        const dx = targetWp.x - guard.x;
        const dy = targetWp.y - guard.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
            guard.pauseTimer = 1.5; // pause at waypoint
            guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        } else if (guard.pauseTimer > 0) {
            guard.pauseTimer -= dt;
        } else {
            const targetAngle = Math.atan2(dy, dx);
            angleToward(guard, targetAngle, dt * 3);
            guard.x += Math.cos(guard.angle) * guard.speed * dt;
            guard.y += Math.sin(guard.angle) * guard.speed * dt;
        }
    } else if (guard.state === 'SUSPICIOUS') {
        guard.speed = 0;
        // turn toward player
        const dx = player.x - guard.x;
        const dy = player.y - guard.y;
        const targetAngle = Math.atan2(dy, dx);
        angleToward(guard, targetAngle, dt * 4);

        if (guard.suspicion <= 0) {
            guard.state = 'PATROL';
        }
    } else if (guard.state === 'ALERTED') {
        guard.speed = CONFIG.GUARD_CHASE_SPEED;
        const dx = player.x - guard.x;
        const dy = player.y - guard.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        angleToward(guard, targetAngle, dt * 6);

        guard.x += Math.cos(guard.angle) * guard.speed * dt;
        guard.y += Math.sin(guard.angle) * guard.speed * dt;

        // If lost sight for a while or player escaped, enter search
        if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, level) && dist > 250) {
            guard.state = 'SEARCH';
            guard.searchTimer = 4.0;
            guard.searchSpot = { x: player.x, y: player.y };
        }
    } else if (guard.state === 'SEARCH') {
        guard.speed = CONFIG.GUARD_SEARCH_SPEED;
        const dx = guard.searchSpot.x - guard.x;
        const dy = guard.searchSpot.y - guard.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15 || guard.searchTimer <= 0) {
            guard.searchTimer -= dt;
            if (guard.searchTimer <= -3.0) {
                guard.state = 'PATROL';
            } else {
                guard.angle += dt * 2; // look around
            }
        } else {
            const targetAngle = Math.atan2(dy, dx);
            angleToward(guard, targetAngle, dt * 4);
            guard.x += Math.cos(guard.angle) * guard.speed * dt;
            guard.y += Math.sin(guard.angle) * guard.speed * dt;
        }
    }

    // Check detection from vision
    const rate = detectionRate(player, guard, level);
    if (rate > 0) {
        guard.suspicion = Math.min(CONFIG.ALERT_THRESHOLD, guard.suspicion + rate * dt);
        if (guard.suspicion >= CONFIG.ALERT_THRESHOLD) {
            guard.state = 'ALERTED';
        } else if (guard.suspicion >= CONFIG.SUSPICIOUS_THRESHOLD && guard.state === 'PATROL') {
            guard.state = 'SUSPICIOUS';
        }
    } else if (guard.state !== 'ALERTED' && guard.state !== 'SEARCH') {
        guard.suspicion = Math.max(0, guard.suspicion - CONFIG.DETECTION_DRAIN_RATE * dt);
        if (guard.suspicion === 0 && guard.state === 'SUSPICIOUS') {
            guard.state = 'PATROL';
        }
    }
}

function angleToward(guard, targetAngle, maxDelta) {
    let diff = targetAngle - guard.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    if (diff > maxDelta) guard.angle += maxDelta;
    else if (diff < -maxDelta) guard.angle -= maxDelta;
    else guard.angle = targetAngle;
}
