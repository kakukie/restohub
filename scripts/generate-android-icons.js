/**
 * Generate Android icon assets for Meenuin.
 * 
 * ROOT CAUSE FIX:
 * Capacitor ships a default "ic_launcher_foreground.xml" in drawable-v24.
 * Android resource resolution picks drawable-v24 BEFORE mipmap-* for drawables.
 * Result: Capacitor default XML (Capacitor robot logo, dark) always wins.
 *
 * STRATEGY:
 * 1. Replace drawable-v24/ic_launcher_foreground.xml with Meenuin vector (white fork/spoon)
 * 2. Replace drawable/ic_launcher_background.xml with solid green color
 * 3. Update mipmap-anydpi-v26/ic_launcher.xml to reference @drawable/ correctly
 * 4. Generate legacy ic_launcher.png (full logo: green bg + white icon) for all mipmap densities
 * 5. Generate splash screens
 *
 * Usage: node scripts/generate-android-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO = path.join(__dirname, '..', 'public', 'logo.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Logo has EXACTLY two colors (verified by pixel analysis):
// - Green bg: r:13, g:179, b:120 = #0DB378
// - White fg: r:255, g:255, b:255 = #FFFFFF
// White bounding box in 512x512: x[180-380], y[120-380] -> centered icon

const BRAND_GREEN = '#0DB378';

// Meenuin fork+spoon vector path (derived from logo.png white pixel region)
// Coordinates normalized to 108x108 viewport (Android adaptive icon size)
// Source icon occupies ~x:180-380, y:120-380 in 512x512 logo
// We map that to the safe zone (~16-92 in 108dp canvas)
// The icon shape is: 3 vertical bars (fork tines) + 1 rounded rect (spoon)
// Generated from the logo bounding box proportionally
const MEENUIN_VECTOR_XML = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!--
        Meenuin icon: white fork (3 tines) and spoon on transparent background.
        Coordinates derived from public/logo.png pixel analysis (512x512 source).
        Icon bounding box in source: x[180-380] y[120-380] (200x260px)
        Mapped to safe zone in 108dp: center 66% = ~21-87dp range
        The icon center is at 54,54. Icon width ~35dp, height ~45dp.
    -->

    <!-- Fork: left tine -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 34,28 L 36,28 L 36,52 L 34,52 Z" />
    <!-- Fork: middle tine -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 39,28 L 41,28 L 41,52 L 39,52 Z" />
    <!-- Fork: right tine -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 44,28 L 46,28 L 46,52 L 44,52 Z" />
    <!-- Fork: handle -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 38,52 L 42,52 L 42,78 L 38,78 Z" />

    <!-- Spoon: bowl (ellipse approximated as rounded rect) -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 62,28 C 56,28 53,32 53,37 C 53,42 56,46 62,46 C 68,46 71,42 71,37 C 71,32 68,28 62,28 Z" />
    <!-- Spoon: handle -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 60,46 L 64,46 L 64,78 L 60,78 Z" />
</vector>`;

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
    if (!fs.existsSync(LOGO)) {
        console.error('ERROR: Missing public/logo.png');
        process.exit(1);
    }

    // ── STEP 1: Fix drawable-v24 (ROOT CAUSE) ─────────────────────────
    console.log('Step 1: Replacing Capacitor default drawable-v24/ic_launcher_foreground.xml...');
    const drawableV24Dir = path.join(ANDROID_RES, 'drawable-v24');
    if (!fs.existsSync(drawableV24Dir)) fs.mkdirSync(drawableV24Dir, { recursive: true });
    fs.writeFileSync(path.join(drawableV24Dir, 'ic_launcher_foreground.xml'), MEENUIN_VECTOR_XML);
    console.log('  ✓ drawable-v24/ic_launcher_foreground.xml → Meenuin fork+spoon vector');

    // ── STEP 2: Fix mipmap-anydpi-v26 XML ─────────────────────────────
    console.log('\nStep 2: Updating adaptive icon XMLs to use @drawable/...');
    const anydpiDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

    // Use @drawable/ic_launcher_foreground so it picks up our drawable-v24 vector
    // Use @color/ic_launcher_background for solid green
    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);
    console.log('  ✓ mipmap-anydpi-v26/ic_launcher.xml → @drawable/ic_launcher_foreground');

    // ── STEP 3: Fix background color ──────────────────────────────────
    console.log('\nStep 3: Setting brand green background color...');
    const valuesDir = path.join(ANDROID_RES, 'values');
    if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
    const bgColorXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BRAND_GREEN}</color>
</resources>`;
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgColorXml);
    console.log(`  ✓ values/ic_launcher_background.xml → ${BRAND_GREEN}`);

    // Remove old grid-pattern drawable background if it still exists
    const oldBg = path.join(ANDROID_RES, 'drawable', 'ic_launcher_background.xml');
    if (fs.existsSync(oldBg)) {
        fs.unlinkSync(oldBg);
        console.log('  ✓ Removed drawable/ic_launcher_background.xml (old grid pattern)');
    }

    // ── STEP 4: Generate legacy mipmap PNGs ───────────────────────────
    console.log('\nStep 4: Generating legacy ic_launcher.png / ic_launcher_round.png...');
    for (const [folder, sizes] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Legacy flat icon = full logo (green bg + white icon, no transparency issues)
        await sharp(LOGO)
            .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
            .png()
            .toFile(path.join(dir, 'ic_launcher.png'));

        await sharp(LOGO)
            .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
            .png()
            .toFile(path.join(dir, 'ic_launcher_round.png'));

        // Also put a placeholder foreground PNG in mipmap for completeness
        // (won't be used since drawable-v24 XML takes priority, but good to have)
        const { data, info } = await sharp(LOGO)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        
        const W = info.width, H = info.height;
        const fgBuf = Buffer.alloc(W * H * 4, 0);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) {
                fgBuf[i] = 255; fgBuf[i+1] = 255; fgBuf[i+2] = 255; fgBuf[i+3] = 255;
            }
        }

        const iconSize = Math.round(sizes.foreground * 0.55);
        const offset = Math.round((sizes.foreground - iconSize) / 2);

        const scaledFg = await sharp(fgBuf, { raw: { width: W, height: H, channels: 4 } })
            .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

        await sharp({
            create: { width: sizes.foreground, height: sizes.foreground, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
        })
        .composite([{ input: scaledFg, left: offset, top: offset }])
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`  ✓ ${folder}: ${sizes.launcher}px launcher, ${sizes.foreground}px foreground`);
    }

    // ── STEP 5: Generate splash screens ───────────────────────────────
    console.log('\nStep 5: Generating splash screens...');
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
        
        console.log(`  ✓ ${folder}/splash.png (${size.w}x${size.h})`);
    }

    console.log('\n✅ Done!');
    console.log('   Root cause fixed: drawable-v24/ic_launcher_foreground.xml now contains Meenuin vector');
    console.log('   Adaptive icon now references @drawable/ (picks up drawable-v24 XML correctly)');
}

generate().catch(console.error);
