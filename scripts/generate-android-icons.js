/**
 * Generate Android adaptive icon assets & splash screens.
 *
 * Adaptive icon layers:
 *   - Background: solid green (#00A669) — set via values/ic_launcher_background.xml
 *   - Foreground: white fork/spoon on transparent (from public/icon-foreground.png)
 *
 * Legacy icon (ic_launcher.png / ic_launcher_round.png):
 *   - Full logo.png (green bg + white icons already baked in)
 *
 * Splash screen:
 *   - White background with centered logo
 *
 * Usage: node scripts/generate-android-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO = path.join(__dirname, '..', 'public', 'logo.png');
const FOREGROUND_SRC = path.join(__dirname, '..', 'public', 'icon-foreground.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const BRAND_GREEN = { r: 0, g: 166, b: 105 }; // #00A669

const MIPMAP_SIZES = {
    'mipmap-mdpi':    { launcher: 48,  foreground: 108 },
    'mipmap-hdpi':    { launcher: 72,  foreground: 162 },
    'mipmap-xhdpi':   { launcher: 96,  foreground: 216 },
    'mipmap-xxhdpi':  { launcher: 144, foreground: 324 },
    'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

const SPLASH_SIZES = {
    'drawable':             { w: 480, h: 800 },
    'drawable-port-hdpi':   { w: 480, h: 800 },
    'drawable-port-mdpi':   { w: 320, h: 480 },
    'drawable-port-xhdpi':  { w: 720, h: 1280 },
    'drawable-port-xxhdpi': { w: 960, h: 1600 },
    'drawable-port-xxxhdpi':{ w: 1280, h: 1920 },
};

async function generate() {
    for (const src of [LOGO, FOREGROUND_SRC]) {
        if (!fs.existsSync(src)) {
            console.error('Missing:', src);
            process.exit(1);
        }
    }

    console.log('Generating Android icons...');

    // ── 1) Mipmap icons ────────────────────────────────────────────────
    for (const [folder, sizes] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // ── Legacy icons (ic_launcher / ic_launcher_round) ──
        // Use full logo.png (green bg + white icons already combined)
        await sharp(LOGO)
            .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
            .png()
            .toFile(path.join(dir, 'ic_launcher.png'));

        await sharp(LOGO)
            .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
            .png()
            .toFile(path.join(dir, 'ic_launcher_round.png'));

        // ── Adaptive foreground (white icons on transparent) ──
        // The icon should fill ~66% of the canvas (safe zone = inner 66/108)
        const iconSize = Math.round(sizes.foreground * 0.55);
        const offset = Math.round((sizes.foreground - iconSize) / 2);

        const resizedFg = await sharp(FOREGROUND_SRC)
            .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

        await sharp({
            create: {
                width: sizes.foreground,
                height: sizes.foreground,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([{ input: resizedFg, left: offset, top: offset }])
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`  ✓ ${folder}`);
    }

    // Copy foreground to mipmap-anydpi-v26 as well
    const anydpiDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
    fs.copyFileSync(
        path.join(ANDROID_RES, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png'),
        path.join(anydpiDir, 'ic_launcher_foreground.png')
    );

    // ── 2) Ensure adaptive icon XML points to color (not grid drawable) ──
    const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), launcherXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), launcherXml);

    // ── 3) Ensure background color matches brand green ──
    const bgColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#00A669</color>
</resources>`;

    const valuesDir = path.join(ANDROID_RES, 'values');
    if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgColorXml);

    // ── 4) Remove the old grid-pattern vector drawable background ──
    const oldDrawableBg = path.join(ANDROID_RES, 'drawable', 'ic_launcher_background.xml');
    if (fs.existsSync(oldDrawableBg)) {
        fs.unlinkSync(oldDrawableBg);
        console.log('  ✓ Removed old drawable/ic_launcher_background.xml (grid pattern)');
    }

    // ── 5) Splash screens ──────────────────────────────────────────────
    for (const [folder, size] of Object.entries(SPLASH_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Logo at 15% of screen height, centered on white background
        const logoH = Math.round(size.h * 0.15);

        const resizedLogo = await sharp(LOGO)
            .resize(logoH, logoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

        await sharp({
            create: {
                width: size.w,
                height: size.h,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 255 }
            }
        })
        .composite([{
            input: resizedLogo,
            left: Math.round((size.w - logoH) / 2),
            top: Math.round((size.h - logoH) / 2)
        }])
        .png()
        .toFile(path.join(dir, 'splash.png'));

        console.log(`  ✓ ${folder}/splash.png`);
    }

    console.log('\n✅ Done! All Android icons and splash screens generated.');
}

generate().catch(console.error);
