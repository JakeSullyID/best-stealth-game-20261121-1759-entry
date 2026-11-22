// Hand-in compilation script that packages game files and generates the build dossier.
import { cpSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

function main() {
    const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
    console.log(`Building SHADOW VAULT into output directory: ${outputDir}`);

    mkdirSync(outputDir, { recursive: true });

    const repoDir = dirname(fileURLToPath(import.meta.url));

    // Copy game directory
    const gameSrc = join(repoDir, 'game');
    const gameDest = join(outputDir, 'game');
    if (existsSync(gameSrc)) {
        cpSync(gameSrc, gameDest, { recursive: true });
        console.log('Copied game/ to output.');
    }

    // Copy screenshots directory if present
    const shotsSrc = join(repoDir, 'screenshots');
    const shotsDest = join(outputDir, 'screenshots');
    if (existsSync(shotsSrc)) {
        cpSync(shotsSrc, shotsDest, { recursive: true });
        console.log('Copied screenshots/ to output.',);
    }

    // Build dossier
    const dossierBytes = buildDossier(outputDir, {
        text_max_bytes: 163840,
        screenshots: {
            max: 4,
            max_bytes: 262144
        },
        game_max_files: 993,
        game_max_bytes: 50331648,
        game_path_max_bytes: 1000
    });

    writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
    console.log('Build dossier generated successfully.');
}

try {
    main();
} catch (err) {
    console.error('Fatal error finding/building dossier:', err);
    process.exit(1);
}
