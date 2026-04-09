/**
 * Generate Android adaptive icon assets from public/logo.png
 * Uses sharp to resize to required mipmap sizes.
 * 
 * Usage: node scripts/generate-android-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '..', 'public', 'logo.png');
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

async function generate() {
    if (!fs.existsSync(SOURCE)) {
        console.error('Source logo not found:', SOURCE);
        process.exit(1);
    }

    console.log('Generating Android icons from', SOURCE);

    for (const [folder, sizes] of Object.entries(MIPMAP_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        await sharp(SOURCE)
            .resize(sizes.launcher, sizes.launcher, { fit: 'contain', background: { r: 0, g: 166, b: 105, alpha: 1 } })
            .png()
            .toFile(path.join(dir, 'ic_launcher.png'));

        await sharp(SOURCE)
            .resize(sizes.launcher, sizes.launcher, { fit: 'contain', background: { r: 0, g: 166, b: 105, alpha: 1 } })
            .png()
            .toFile(path.join(dir, 'ic_launcher_round.png'));

        const logoSize = Math.round(sizes.foreground * 0.6);
        const padding = Math.round((sizes.foreground - logoSize) / 2);
        
        const resizedLogo = await sharp(SOURCE)
            .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
        .composite([{ input: resizedLogo, left: padding, top: padding }])
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`  done ${folder}`);
    }

    const anydpiDir = path.join(ANDROID_RES, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
    const xxxhd = path.join(ANDROID_RES, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
    fs.copyFileSync(xxxhd, path.join(anydpiDir, 'ic_launcher_foreground.png'));

    for (const [folder, size] of Object.entries(SPLASH_SIZES)) {
        const dir = path.join(ANDROID_RES, folder);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const logoH = Math.round(size.h * 0.15);
        const resizedLogo = await sharp(SOURCE)
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

        console.log(`  done ${folder} splash`);
    }

    console.log('All Android icons and splash screens generated!');
}

generate().catch(console.error);
