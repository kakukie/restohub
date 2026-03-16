const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.join(__dirname, '..');
const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
const sourceCandidates = [
  path.join(rootDir, 'public', 'icon-512x512.png'),
  path.join(rootDir, 'public', 'logo.png'),
];

const sizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

function resolveSource() {
  for (const candidate of sourceCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function generate() {
  const source = resolveSource();
  if (!source) {
    throw new Error('No icon source found. Expected public/icon-512x512.png or public/logo.png');
  }

  for (const item of sizes) {
    const targetDir = path.join(androidResDir, item.dir);
    fs.mkdirSync(targetDir, { recursive: true });

    const iconBuffer = await sharp(source)
      .resize(item.size, item.size, { fit: 'cover' })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), iconBuffer);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), iconBuffer);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), iconBuffer);
  }

  console.log(`Generated Android launcher icons from: ${path.basename(source)}`);
}

generate().catch((error) => {
  console.error('Failed to generate Android icons:', error.message);
  process.exit(1);
});
