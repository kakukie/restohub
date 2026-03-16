# Build APK dari Host

Panduan ini membuat file APK tanpa menyentuh container production aplikasi seperti `meenuin-app-1` atau `meenuin-app-2`.

## Konsep

Build dijalankan di container builder terpisah yang khusus berisi:

- Node.js 22
- OpenJDK 21
- Android SDK 35

Container app production tetap tidak dipakai untuk proses APK.

## Prasyarat Host

- Docker terinstall dan bisa dijalankan dari host
- Source code terbaru sudah di-pull

## Build APK

Jalankan dari root project:

```bash
bash ./scripts/build-apk-host.sh
```

Script akan:

1. Build image `restohub-apk-builder:latest` bila belum ada
2. Menjalankan build Android di container builder terpisah
3. Secara default menghasilkan APK `debug` yang bisa langsung di-install untuk testing

## Lokasi File APK

Hasil default untuk testing ada di:

```bash
dist/app-debug.apk
```

Jika ingin build release:

```bash
APK_MODE=release bash ./scripts/build-apk-host.sh
```

Output release:

```bash
dist/app-release.apk
```

## Opsi Tambahan

Force rebuild image builder:

```bash
FORCE_REBUILD=1 bash ./scripts/build-apk-host.sh
```

Ganti nama image builder:

```bash
APK_BUILDER_IMAGE=my-restohub-apk-builder:latest bash ./scripts/build-apk-host.sh
```

## Troubleshooting

Jika image builder gagal dibuat karena network:

- pastikan host bisa akses `dl.google.com`, `registry.npmjs.org`, dan repository Debian

Jika build Android gagal saat `npm ci` atau `npx cap sync android`:

- pastikan file `.env` atau `.env.production` yang dibutuhkan build sudah tersedia di host

Jika Anda ingin APK dibuild ulang setelah ada update code:

```bash
git pull origin master
bash ./scripts/build-apk-host.sh
```
