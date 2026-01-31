const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('Running post-build copy...');

const nextDir = path.join(__dirname, '..', '.next');
const standaloneNextDir = path.join(nextDir, 'standalone', '.next');
const staticDir = path.join(nextDir, 'static');
const publicDir = path.join(__dirname, '..', 'public');
const standalonePublicDir = path.join(nextDir, 'standalone', 'public');

// 1. cp -r .next/static .next/standalone/.next/
console.log(`Copying ${staticDir} to ${standaloneNextDir}/static...`);
copyDir(staticDir, path.join(standaloneNextDir, 'static'));

// 2. cp -r public .next/standalone/
console.log(`Copying ${publicDir} to ${standalonePublicDir}...`);
copyDir(publicDir, standalonePublicDir);

console.log('Post-build copy complete.');
