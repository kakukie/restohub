/**
 * Extract white pixels from logo.png to create a proper
 * white-on-transparent foreground icon for Android adaptive icons.
 * Then generate all mipmap sizes and splash screens.
 * 
 * Usage: node scripts/generate-android-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO = path.join(__dirname, '..', 'public', 'logo.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

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

/**
 * Extract white foreground from logo.png.
 * Pixels close to white (R,G,B all > 200) => keep as white, full alpha.
 * Everything else => fully transparent.
 * Returns a 512x512 RGBA buffer.
 */
async function extractWhiteForeground() {
    const { data, info } = await sharp(LOGO)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;
    const out = Buffer.alloc(w * h * 4, 0); // Start all transparent

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // White pixel detection: all channels > 200
        if (r > 200 && g > 200 && b > 200) {
            out[i]     = 255;  // R
            out[i + 1] = 255;  // G
            out[i + 2] = 255;  // B
            out[i + 3] = 255;  // A (opaque)
        }
        // else: stays transparent (0,0,0,0)
    }

    return sharp(out, { raw: { width: w, height: h, channels: 4 } })
        .png()
        .toBuffer();
}

async function generate() {
    if (!fs.existsSync(LOGO)) {
        console.error('Missing:', LOGO);
        process.exit(1);
    }

    console.log('Step 1: Extracting white foreground from logo.png...');
    const foregroundBuffer = await extractWhiteForeground();
    
    // Save the extracted foreground for future use
    const fgPath = path.join(__dirname, '..', 'public', 'icon-foreground.png');
    fs.writeFileSync(fgPath, foregroundBuffer);
    console.log('  Saved: public/icon-foreground.png');

    // Verify it looks right
    const fgStats = await sharp(foregroundBuffer).stats();
    const fgMeta = await sharp(foregroundBuffer).metadata();
    console.log(`  Foreground: ${fgMeta.width}x${fgMeta.height}, opaque: ${fgStats.isOpaque}, dominant: rgb(${fgStats.dominant.r},${fgStats.dominant.g},${fgStats.dominant.b})`);

    console.log('\nStep 2: Generating mipmap icons...');
    for (const [folder, sizes] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // ── Legacy icons: full logo (green bg + white icons) ──
        await sharp(LOGO)
            .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
            .png()
            .toFile(path.join(dir, 'ic_launcher.png'));

        await sharp(LOGO)
            .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
            .png()
            .toFile(path.join(dir, 'ic_launcher_round.png'));

        // ── Adaptive foreground: white icons on transparent ──
        // Safe zone is inner 66/108 of canvas. Icon fills ~55% for good visibility.
        const iconSize = Math.round(sizes.foreground * 0.55);
        const offset = Math.round((sizes.foreground - iconSize) / 2);

        const resizedFg = await sharp(foregroundBuffer)
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

        console.log(`  ✓ ${folder}: launcher=${sizes.launcher}px, fg=${sizes.foreground}px`);
    }

    // Copy foreground to mipmap-anydpi-v26
    const anydpiDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
    fs.copyFileSync(
        path.join(ANDROID_RES, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png'),
        path.join(anydpiDir, 'ic_launcher_foreground.png')
    );

    // ── Adaptive icon XMLs ──
    const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), launcherXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), launcherXml);

    // ── Background color ──
    const bgColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0DB378</color>
</resources>`;
    const valuesDir = path.join(ANDROID_RES, 'values');
    if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgColorXml);

    // Remove old grid-pattern drawable if exists
    const oldDrawableBg = path.join(ANDROID_RES, 'drawable', 'ic_launcher_background.xml');
    if (fs.existsSync(oldDrawableBg)) {
        fs.unlinkSync(oldDrawableBg);
        console.log('  ✓ Removed old drawable/ic_launcher_background.xml');
    }

    console.log('\nStep 3: Generating splash screens...');
    for (const [folder, size] of Object.entries(SPLASH_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const logoH = Math.round(size.h * 0.15);
        const resizedLogo = await sharp(LOGO)
            .resize(logoH, logoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

        await sharp({
            create: { width: size.w, height: size.h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } }
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

    console.log('\n✅ All Android icons and splash screens generated successfully!');
}

generate().catch(console.error);
