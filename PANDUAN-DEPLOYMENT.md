# Panduan Deployment RestoHub

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Struktur Source Code](#struktur-source-code)
3. [Konfigurasi Environment](#konfigurasi-environment)
4. [Cara Deploy dengan Docker](#cara-deploy-dengan-docker)
5. [Deploy Manual](#deploy-manual)
6. [Pemeliharaan & Troubleshooting](#pemeliharaan--troubleshooting)
7. [API Endpoints](#api-endpoints)

---

## 🔧 Persiapan

Sebelum melakukan deployment, pastikan Anda memiliki:

### Software yang Dibutuhkan

- **Node.js** versi 18+ atau 20+
- **Bun** atau **npm** sebagai package manager (rekomendasi Bun)
- **Docker** dan **Docker Compose** untuk containerization
- **Git** untuk version control (opsional)
- **Akses internet** ke server deployment

### Alat yang Diperlukan

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 📁 Struktur Source Code

Pastikan struktur project Anda sudah lengkap seperti berikut:

```
restohub/
├── prisma/
│   ├── schema.prisma          # Schema database
│   └── seed.ts               # Data awal database
├── src/
│   ├── app/                   # API routes & Next.js pages
│   │   ├── api/             # Endpoint backend
│   │   │   ├── auth/       # Autentikasi
│   │   │   ├── restaurants/ # Manajemen restoran
│   │   │   ├── orders/     # Manajemen pesanan
│   │   │   └── menu/        # Manajemen menu
│   │   ├── (auth)/         # Konfigurasi NextAuth
│   │   ├── layout.tsx      # Layout utama
│   │   └── page.tsx        # Halaman landing (home)
│   ├── components/            # Komponen React
│   │   ├── ui/            # Komponen shadcn/ui
│   │   ├── dashboards/      # Dashboard untuk berbagai role
│   │   │   ├── SuperAdminDashboard.tsx
│   │   │   ├── RestaurantDashboard.tsx
│   │   │   └── CustomerDashboard.tsx
│   │   ├── landing/         # Halaman landing
│   │   └── menu/          # Halaman menu publik
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Fungsi utilitas
│   ├── store/                # State management (Zustand)
│   └── styles/              # Global styles (opsional)
├── public/                  # File statis
├── docker/                  # Konfigurasi Docker
│   ├── Dockerfile
│   └── docker-compose.yml
├── nginx/                   # Konfigurasi Nginx
│   └── nginx.conf
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── db/                      # File database (untuk dev)
├── .env.example              # Template environment variables
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── bun.lockb               # Bun lock file
├── .gitignore
├── DEPLOYMENT.md            # Dokumentasi lengkap
└── README.md                # Informasi project
```

---

## 🌍 Konfigurasi Environment

### Variables yang Wajib Diisi

Buat file bernama `.env.local` di root project Anda:

```env
# ==========================================
# KONFIGURASI DATABASE
# ==========================================

# Untuk Development (SQLite)
DATABASE_URL="file:./db/dev.db"

# Untuk Production (PostgreSQL - REKOMENDASI)
DATABASE_URL="postgresql://username:password@localhost:5432/restohub?schema=public"

# ==========================================
# KONFIGURASI NEXTAUTH
# ==========================================

# URL aplikasi untuk NextAuth
NEXTAUTH_URL="http://localhost:3000"

# Secret key untuk enkripsi JWT (PENTING! Ganti di production)
# Generate dengan: openssl rand -base64 32
NEXTAUTH_SECRET="ubah-secret-key-ini-min-32-karakter-di-production"

# ==========================================
# KONFIGURASI APLIKASI
# ==========================================

# Base URL aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Port aplikasi (opsional)
NEXT_PUBLIC_PORT="3000"

# ==========================================
# KONFIGURASI MINIO/S3 (Upload File)
# ==========================================

# Endpoint Minio
MINIO_ENDPOINT="http://localhost:9000"

# Kredensial Minio
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"

# Nama bucket untuk upload
MINIO_BUCKET="restohub-uploads"

# Gunakan SSL untuk Minio (true/false)
MINIO_USE_SSL="false"

# ==========================================
# KONFIGURASI EMAIL (Opsional)
# ==========================================

# SMTP Server
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@restohub.com"
SMTP_PASSWORD="password-email-anda"

# Email pengirim
SMTP_FROM="noreply@restohub.com"
SMTP_NAME="RestoHub"

# ==========================================
# KONFIGURASI AI SKILLS (Opsional)
# ==========================================

# API Key untuk z-ai-web-dev-sdk
AI_API_KEY="api-key-anda-untuk-ai"

# Base URL API AI
AI_API_URL="https://api.z-ai.com"

# ==========================================
# KONFIGURASI SECURITY
# ==========================================

# Aktifkan rate limiting (true/false)
ENABLE_RATE_LIMITING="true"

# Batas maksimum request per menit
RATE_LIMIT_MAX="100"

# Timeout sesi dalam menit
SESSION_TIMEOUT="30"

# ==========================================
# KONFIGURASI DEVELOPMENT
# ==========================================

# Mode environment
NODE_ENV="development"

# Aktifkan mode debug (true/false)
DEBUG="true"

# Level log (error/warn/info/debug)
LOG_LEVEL="debug"
```

### Variables Production

Gunakan konfigurasi berikut untuk production:

```env
# Database PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/restohub?schema=public"

# NextAuth Production
NEXTAUTH_URL="https://restohub.domainanda.com"
NEXTAUTH_SECRET="production-secret-key-minimal-32-karakter-panjang-untuk-keamanan"
NEXT_PUBLIC_APP_URL="https://restohub.domainanda.com"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Minio Production
MINIO_ENDPOINT="https://minio.domainanda.com"
MINIO_ACCESS_KEY="prod-access-key-anda"
MINIO_SECRET_KEY="prod-secret-key-anda"
MINIO_BUCKET="restohub-prod-uploads"
MINIO_USE_SSL="true"
```

---

## 🐳 Cara Deploy dengan Docker

### 1. Persiapan File Docker

#### Dockerfile (docker/Dockerfile)

File ini mendefinisikan bagaimana aplikasi akan di-container-ize:

```dockerfile
# ==========================================
# STAGE 1: BUILDER
# ==========================================

FROM oven/bun:1 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build Next.js application
RUN bun run build

# ==========================================
# STAGE 2: PRODUCTION RUNNER
# ==========================================

FROM oven/bun:1 AS runner

# Install dumb-init untuk signal handling
RUN apt-get update && apt-get install -y dumb-init

# Buat user non-root untuk keamanan
RUN useradd -m -u -s -r /app node

# Set working directory
WORKDIR /app

# Copy dari builder
COPY --from=builder --chown=node:node /app/next.config.js ./
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node --app/node_modules ./node_modules

# Buat direktori database
RUN mkdir -p /app/db && chown node:node /app/db

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch ke user non-root
USER node

# Set entrypoint untuk startup yang benar
ENTRYPOINT ["dumb-init", "--", "bun", "run", "start"]
```

**Penjelasan Dockerfile:**

1. **Multi-stage build**: Dua stage - builder dan runner untuk memperkecil ukuran image final
2. **Security**: User non-root (node) dibuat untuk keamanan
3. **Optimization**: `--frozen-lockfile` mempercepat install dependencies
4. **Prisma**: Client di-generate otomatis sebelum build
5. **Environment**: `NODE_ENV=production` dan `PORT=3000` diset
6. **Signal Handling**: `dumb-init` memastikan aplikasi berhenti dengan benar

#### Docker Compose (docker/docker-compose.yml)

File ini mendefinisikan semua service yang dibutuhkan:

```yaml
version: '3.8'

services:
  # ==========================================
  # SERVICE 1: RESTOHUB APP
  # ==========================================
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: restohub-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      # Database (gunakan SQLite di Docker untuk simplifikasi)
      - DATABASE_URL=file:./db/prod.db
      # NextAuth Configuration
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-change-this-secret-in-production}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
      - NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-RestoHub}
    volumes:
      # Mount database agar persist
      - app-db:/app/db
      # Mount folder uploads
      - app-uploads:/app/public/uploads
    networks:
      - restohub-network
    healthcheck:
      # Health check untuk memastikan aplikasi jalan
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health || exit 1"]
      interval: 30s  # Cek setiap 30 detik
      timeout: 10s  # Timeout 10 detik
      retries: 3  # Coba maksimal 3 kali
      start_period: 40s  # Tunggu 40 detik sebelum mulai cek

  # ==========================================
  # SERVICE 2: MINIO OBJECT STORAGE
  # ==========================================
  minio:
    image: minio/minio:latest
    container_name: restohub-minio
    restart: unless-stopped
    ports:
      # Console Minio
      - "9000:9000"
      # API Minio
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-minioadmin}
      - MINIO_DEFAULT_BUCKETS=restohub-uploads
    volumes:
      # Simpan data Minio agar persist
      - minio-data:/data
    networks:
      - restohub-network
    command: >
      server /data --address ":9000" --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ==========================================
  # SERVICE 3 (OPTIONAL): POSTGRESQL DATABASE
  # ==========================================
  postgres:
    image: postgres:15-alpine
    container_name: restohub-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-restohub}
      - POSTGRES_INITDB_ARGS: "-E UTF8"
    volumes:
      # Simpan data PostgreSQL agar persist
      - postgres-data:/var/lib/postgresql/data
    networks:
      - restohub-network
    healthcheck:
      # Cek apakah PostgreSQL siap menerima koneksi
      test: ["CMD-SHELL", "pg_isready", "-U", "${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    profiles:
      # Service ini hanya jalan saat profile production aktif
      - production

  # ==========================================
  # SERVICE 4 (OPTIONAL): REDIS CACHE
  # ==========================================
  redis:
    image: redis:7-alpine
    container_name: restohub-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      # Simpan data Redis agar persist
      - redis-data:/data
    networks:
      - restohub-network
    command: >
      redis-server --appendonly yes --save 900 1
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    profiles:
      - production

  # ==========================================
  # VOLUMES
  # ==========================================
volumes:
  app-db:
    driver: local
    # Volume untuk database app
  app-uploads:
    driver: local
    # Volume untuk file uploads
  minio-data:
    driver: local
    # Volume untuk data Minio
  postgres-data:
    driver: local
    # Volume untuk data PostgreSQL
  redis-data:
    driver: local
    # Volume untuk data Redis

  # ==========================================
  # NETWORKS
  # ==========================================
networks:
  restohub-network:
    driver: bridge
    # Bridge network untuk komunikasi antar container
```

**Penjelasan Docker Compose:**

1. **Service App**: Service utama RestoHub dengan health check
2. **Service Minio**: Object storage untuk upload file dengan persistensi data
3. **Service Postgres**: Database PostgreSQL (opsional, untuk production)
4. **Service Redis**: Cache untuk session dan performance (opsional)
5. **Health Checks**: Setiap service memiliki health check
6. **Volumes**: Semua data persist dengan Docker volumes
7. **Networks**: Semua service terkoneksi dalam satu network
8. **Profiles**: Postgres dan Redis hanya aktif di production

### 2. Persiapan Environment

```bash
# 1. Salin template environment
cp .env.example .env.local

# 2. Edit file environment
nano .env.local

# 3. Generate secret key yang aman
openssl rand -base64 32

# 4. Paste ke file NEXTAUTH_SECRET
# 5. Update NEXT_PUBLIC_APP_URL dengan domain Anda
NEXT_PUBLIC_APP_URL="https://restohub.domainanda.com"

# 6. Simpan file
```

**Variable Wajib Di-update untuk Production:**

- `NEXTAUTH_SECRET` - GANTI dengan secret key yang aman (minimal 32 karakter)
- `DATABASE_URL` - Ganti dengan connection string PostgreSQL jika menggunakan database production
- `NEXT_PUBLIC_APP_URL` - Ganti dengan domain production Anda (HTTPS)
- `MINIO_*` - Ganti dengan credentials Minio production Anda

### 3. Build Docker Image

```bash
# Navigasi ke project root
cd /path/ke/restohub

# Build image Docker
docker build -t restohub:latest -f docker/Dockerfile .

# atau untuk build multi-platform (Linux dan ARM)
docker buildx build --platform linux/amd64,linux/arm64 -t restohub:latest -f docker/Dockerfile .

# Verifikasi image sudah terbuild
docker images | grep restohub
```

**Penjelasan Build:**

- `-t restohub:latest` - Tag image untuk mudah di-identify
- `-f docker/Dockerfile` - Gunakan Dockerfile spesifik
- Build process akan memakan waktu 5-10 menit tergantung server

### 4. Jalankan dengan Docker Compose

```bash
# Jalankan semua service
docker-compose up -d

# Lihat status services
docker-compose ps

# Output yang diharapkan:
# app-app       | Up       | 0.0.0.0:3000->3000/tcp
# minio-app      | Up       | 0.0.0.0:9000-9000/tcp
# minio-app      | Up       | 0.0.0.0:9001-9001/tcp
# postgres-app    | Up       | 0.0.0.0:5432->5432/tcp
# redis-app       | Up       | 0.0.0.0:6379->6379/tcp
```

### 5. Verifikasi Deployment

```bash
# 1. Cek apakah aplikasi berjalan
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-20T10:00:00Z",
  "uptime": "0d 0h 1m"
}

# 2. Cek logs aplikasi
docker-compose logs -f app --tail=50

# 3. Cek logs Minio
docker-compose logs -f minio --tail=50

# 4. Masuk ke container (untuk debugging jika diperlukan)
docker exec -it restohub-app-1 /bin/sh

# 5. Cek environment variables di dalam container
docker exec restohub-app-1 env | grep NEXT_PUBLIC
```

### 6. Database Migration (Jika diperlukan)

```bash
# Jalankan migration database
docker exec -it restohub-app-1 bunx prisma migrate deploy

# Seed database dengan data awal (opsional)
docker exec -it restohub-app-1 bunx prisma db seed

# Verifikasi tabel database
docker exec restohub-postgres psql -U postgres -d restohub -c "\dt"
```

### 7. Perintah Docker Berguna

```bash
# Lihat semua container yang berjalan
docker ps

# Lihat logs real-time
docker-compose logs -f app

# Restart service spesifik
docker-compose restart app

# Stop semua services
docker-compose down

# Stop dan hapus volumes
docker-compose down -v

# Hapus image lama untuk hemat space
docker system prune -a

# Update service tanpa downtime (build ulang)
docker-compose up -d --build

# Masuk ke container untuk debugging
docker exec -it restohub-app-1 /bin/sh

# Cek penggunaan resource
docker stats

# Hapus container yang berhenti
docker container prune
```

---

## 🚀 Deploy Manual

Jika tidak ingin menggunakan Docker, berikut panduan deploy manual:

### 1. Persiapan Server

#### Ubuntu/Debian

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### CentOS/RHEL

```bash
# Install Node.js 20
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx
```

### 2. Clone Repository

```bash
# Clone dari GitHub/GitLab
git clone https://github.com/yourusername/restohub.git
cd restohub

# Atau copy source code secara manual
# Pastikan semua file ter-copy
```

### 3. Install Dependencies

```bash
# Install dengan Bun (direkomendasi, lebih cepat)
bun install

# Atau dengan npm
npm install

# Generate Prisma client
bunx prisma generate

# Setup database
bunx prisma db push
```

### 4. Konfigurasi Environment

```bash
# Copy file environment template
cp .env.example .env.production

# Edit file environment
nano .env.production

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Update konfigurasi sesuai environment Anda
```

### 5. Build Application

```bash
# Build untuk production
bun run build

# Verifikasi folder build berhasil dibuat
ls -la .next
```

### 6. Jalankan dengan PM2

Buat file bernama `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'restohub',
    script: './node_modules/next/dist/bin/next',
    cwd: '/path/ke/restohub',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/restohub',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'your-production-secret-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: 'RestoHub'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

```bash
# Install PM2 (jika belum)
sudo npm install -g pm2

# Setup PM2
pm2 setup

# Start aplikasi
pm2 start restohub

# Cek status PM2
pm2 status

# Lihat logs PM2
pm2 logs restohub --lines 100

# Restart aplikasi
pm2 restart restohub

# Stop aplikasi
pm2 stop restohub

# Set PM2 auto-start on boot
pm2 startup
pm2 save
```

### 7. Nginx Reverse Proxy

Buat file konfigurasi Nginx:

```nginx
# Upstream ke RestoHub app
upstream restohub_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Zone rate limiting untuk mencegah abuse
limit_req_zone $binary_remote_addr zone=one:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=200r/m;

# HTTP Server - Redirect ke HTTPS
server {
    listen 80;
    server_name restohub.domainanda.com www.restohub.domainanda.com;

    # Redirect semua traffic HTTP ke HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name restohub.domainanda.com www.restohub.domainanda.com;

    # SSL Certificates
    ssl_certificate /etc/ssl/certs/restohub.crt;
    ssl_certificate_key /etc/ssl/certs/restohub.key;

    # Konfigurasi SSL Modern
    ssl_protocols TLSv1.2 TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Hapus server tokens
    server_tokens off;

    # Batas ukuran body client
    client_max_body_size 20M;
    client_body_timeout 60s;

    # Aktifkan gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript application/xml text/xml application/xml+rss text/javascript image/svg+xml;

    # Logging
    access_log /var/log/nginx/restohub_access.log;
    error_log /var/log/nginx/restohub_error.log warn;

    # Root directory
    root /var/www/html;

    # Next.js static files dengan cache
    location /_next/static {
        alias /app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Next.js images dengan cache
    location /_next/image {
        alias /app/.next/image/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Public uploads dengan cache
    location /uploads {
        alias /app/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API endpoints dengan rate limiting
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://restohub_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://restohub_backend;
        proxy_http_version 1.1;
        access_log off;
    }

    # NextAuth endpoints
    location /api/auth/ {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://restohub_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout lebih panjang untuk auth
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }

    # Main application proxy
    location / {
        limit_req zone=one burst=200 nodelay;
        proxy_pass http://restohub_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Deny akses ke file tersembunyi
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
        return 404;
    }

    # Deny akses ke file sensitif
    location ~ /\.env|\.git/ {
        deny all;
        access_log off;
        return 404;
    }

    # Favicon dan robots.txt
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    location = /robots.txt {
        log_not_found off;
        access_log off;
    }
}
```

```bash
# Copy konfigurasi Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/restohub

# Buat symlink
sudo ln -s /etc/nginx/sites-available/restohub /etc/nginx/sites-enabled/restohub

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🛠️ Pemeliharaan & Troubleshooting

### Issue 1: Port 3000 Sudah Digunakan

```bash
# Cari process di port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Atau gunakan port lain
PORT=3001
```

### Issue 2: Database Connection Error

```bash
# Cek apakah database berjalan (PostgreSQL)
docker-compose ps postgres

# Cek logs database
docker-compose logs postgres

# Test koneksi dari dalam container
docker exec -it restohub-app-1 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.\$connect()
  .then(() => console.log('✓ Database terkoneksi!'))
  .catch(err => console.error('✗ Database gagal terkoneksi:', err));
"

# Reset database jika perlu
docker exec -it restohub-postgres psql -U postgres -d restohub -c "DROP DATABASE IF EXISTS restohub; CREATE DATABASE restohub;"
```

### Issue 3: Build Gagal

```bash
# Bersihkan cache
rm -rf .next
rm -rf node_modules

# Reinstall dependencies
rm -f bun.lockb
bun install

# Build ulang
bun run build
```

### Issue 4: Docker Container Tidak Berjalan

```bash
# Lihat logs container
docker-compose logs app

# Lihat status semua container
docker-compose ps

# Rebuild image tanpa cache
docker-compose build --no-cache

# Hapus container dan volumes lalu start ulang
docker-compose down -v
docker-compose up -d
```

### Issue 5: Memory Usage Tinggi

```bash
# Cek resource usage Docker
docker stats

# Batasi penggunaan memory container
docker-compose down
# Edit docker-compose.yml
# Tambahkan: mem_limit: 2g
docker-compose up -d
```

---

## 📊 API Endpoints

### Autentikasi

```
POST /api/auth/register     - Registrasi user baru
POST /api/auth/login        - Login user
POST /api/auth/logout       - Logout user
GET /api/auth/session       - Cek sesi user saat ini
```

### Manajemen Restoran

```
GET /api/restaurants                    - Daftar semua restoran
GET /api/restaurants/:id              - Detail restoran spesifik
POST /api/restaurants                   - Buat restoran baru
PUT /api/restaurants/:id              - Update data restoran
DELETE /api/restaurants/:id              - Hapus restoran
GET /api/restaurants/:id/qr-code     - Generate QR Code restoran
```

### Manajemen Menu

```
GET /api/restaurants/:id/menu          - Menu restoran spesifik
POST /api/restaurants/:id/menu          - Tambah menu item baru
PUT /api/menu/:id                      - Update menu item
DELETE /api/menu/:id                    - Hapus menu item
GET /api/menu/:id                     - Detail menu item
```

### Pesanan

```
GET /api/orders                         - Daftar semua pesanan
POST /api/orders                         - Buat pesanan baru
GET /api/orders/:id                     - Detail pesanan spesifik
PUT /api/orders/:id/status              - Update status pesanan
GET /api/orders/restaurant/:restaurantId - Pesanan per restoran
```

### Subscription Plans

```
GET /api/subscription/plans           - Daftar semua paket subscription
GET /api/subscription/plans/:id       - Detail paket spesifik
PUT /api/subscription/plans/:id       - Update harga dan fitur paket
```

---

## 📋 Checklist Sebelum Production

Sebelum deploy ke production, pastikan:

- [ ] Environment variables sudah diset dengan benar
- [ ] Database sudah disetup dan di-test
- [ ] SSL/TLS certificate sudah ter-install dan valid
- [ ] Firewall hanya membuka port yang dibutuhkan (80, 443, 3000)
- [ ] CORS sudah dikonfigurasi dengan benar
- [ ] Security headers sudah di-set
- [ ] Database backup strategy sudah siap
- [ ] Error tracking dan monitoring sudah di-setup
- [ ] Rate limiting sudah di-aktifkan
- [ ] Log retention policy sudah ditentukan
- [ ] File upload limit sudah diset
- [ ] Email notifications sudah di-setup (jika diperlukan)
- [ ] Load balancing sudah dipertimbangkan (untuk traffic tinggi)

---

## 🔒 Security Best Practices

### 1. Environment Security

```bash
# JANGAN pernah commit .env.local ke repository!
echo ".env.local" >> .gitignore

# Set permission yang benar
chmod 600 .env.local
```

### 2. Application Security

1. **Validasi semua input user** - Jangan percaya input dari user
2. **Sanitasi semua data** - Selalu gunakan prepared statements SQL
3. **Implementas rate limiting** - Mencegah abuse dan DDoS
4. **Setup CORS yang ketat** - Hanya allow origin yang dipercaya
5. **Regular security updates** - Update dependencies dan OS secara berkala

### 3. Password Security

- Gunakan password minimal 12 karakter
- Campur huruf besar, huruf kecil, angka, dan simbol
- Hash password dengan bcrypt atau argon2 (min cost factor 10)
- Implementasi password policy (minimal, karakter spesifik, kadaluarsa)

### 4. Database Security

- Gunakan user database terpisah dengan hak terbatas
- Hindari penggunaan root user untuk aplikasi
- Backup database secara berkala (misal: harian)
- Gunakan SSL/TLS untuk koneksi database
- Limitasi koneksi database dengan connection pooling

---

## 📝 Catatan Penting

### Production Deployment

1. **JANGAN pernah** commit `.env.local` atau file secrets ke repository Git
2. **SELALU backup** database sebelum deploy update baru ke production
3. **Test secara menyeluruh** di staging environment sebelum production
4. **Monitor logs** secara regular untuk error dan aktivitas mencurigakan
5. **Siapkan rollback plan** jika deployment gagal
6. **Gunakan HTTPS** di production dengan SSL certificate yang valid
7. **Database migrations** harus di-test sebelum production
8. **SSL certificates** harus diperbarui sebelum expiration (Let's Encrypt otomatis)

### Performance Optimization

1. **Enable CDN** untuk static assets di production
2. **Implementasi caching** untuk frequently accessed data
3. **Optimize images** sebelum upload ke Minio
4. **Gunakan database indexes** untuk queries yang sering
5. **Implementasi pagination** untuk large datasets
6. **Enable compression** (gzip, brotli) untuk transfer data lebih cepat
7. **Setup load balancer** untuk high traffic

---

## 📞 Support & Resources

### Dokumentasi Teknologi

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Docker**: https://docs.docker.com
- **Docker Compose**: https://docs.docker.com/compose/
- **Nginx**: https://nginx.org/en/docs/
- **PostgreSQL**: https://www.postgresql.org/docs

### Platform Deployment Alternatif

Jika tidak ingin menggunakan Docker/PM2:

- **Vercel**: https://vercel.com (Serverless, gratis, mudah)
- **Railway**: https://railway.app (PaaS, mudah)
- **DigitalOcean**: https://digitalocean.com (VPS, kontrol penuh)
- **AWS**: https://aws.amazon.com (Cloud platform, scalable)
- **Google Cloud**: https://cloud.google.com (Cloud platform)
- **Heroku**: https://heroku.com (PaaS, popular)

---

## ✅ Verifikasi Deployment

Setelah deployment, verifikasi:

```bash
# 1. Cek akses website
curl -I https://restohub.domainanda.com

# 2. Test health endpoint
curl https://restohub.domainanda.com/api/health

# 3. Test API authentication
curl -X POST https://restohub.domainanda.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restohub.com","password":"admin123"}'

# 4. Cek status services Docker
docker-compose ps

# 5. Verifikasi SSL certificate
echo | openssl s_client -connect restohub.domainanda.com:443 -servername restohub.domainanda.com

# 6. Test database connection
docker exec -it restohub-postgres psql -U postgres -d restohub -c "SELECT version();"
```

---

**Versi Dokumentasi**: 1.0.0  
**Last Updated**: Januari 2024  
**Bahasa**: Indonesia  
**Author**: Tim Development RestoHub

---

## 🎯 Langkah Deployment Cepat

### Untuk Development (Lokal)

```bash
# 1. Install dependencies
bun install

# 2. Setup environment
cp .env.example .env.local

# 3. Run development server
bun run dev
```

### Untuk Production (Docker)

```bash
# 1. Setup environment
cp .env.example .env.local
nano .env.local  # Update dengan nilai production

# 2. Build Docker image
docker build -t restohub:latest .

# 3. Jalankan services
docker-compose up -d

# 4. Verifikasi
docker-compose logs -f app
curl http://localhost:3000/api/health
```

### Untuk Production (PM2)

```bash
# 1. Build application
bun run build

# 2. Setup environment di ecosystem.config.js
pm2 start restohub

# 3. Setup Nginx reverse proxy
# Copy nginx config ke /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/restohub /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

---

**Selamat menggunakan RestoHub!** 🎉

Untuk bantuan lebih lanjut:
- Buka issue di GitHub repository
- Email support: support@restohub.com
- Baca dokumentasi teknologi yang tersedia
