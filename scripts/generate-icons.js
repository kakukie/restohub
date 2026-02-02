const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'logo.png');

async function generateIcons() {
    if (!fs.existsSync(logoPath)) {
        console.error('logo.png not found in public directory');
        process.exit(1);
    }

    try {
        await sharp(logoPath)
            .resize(192, 192)
            .toFile(path.join(publicDir, 'icon-192x192.png'));
        console.log('Generated icon-192x192.png');

        await sharp(logoPath)
            .resize(512, 512)
            .toFile(path.join(publicDir, 'icon-512x512.png'));
        console.log('Generated icon-512x512.png');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
