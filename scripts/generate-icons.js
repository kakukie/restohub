const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const sourceCandidates = [
    path.join(publicDir, 'logo.svg'),
    path.join(publicDir, 'logo.png'),
];

function resolveSource() {
    for (const candidate of sourceCandidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

async function generateIcons() {
    const sourcePath = resolveSource();
    if (!sourcePath) {
        console.error('No icon source found in public directory (expected logo.svg or logo.png)');
        process.exit(1);
    }

    try {
        await sharp(sourcePath)
            .resize(192, 192)
            .toFile(path.join(publicDir, 'icon-192x192.png'));
        console.log('Generated icon-192x192.png');

        await sharp(sourcePath)
            .resize(512, 512)
            .toFile(path.join(publicDir, 'icon-512x512.png'));
        console.log('Generated icon-512x512.png');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
