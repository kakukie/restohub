# RestoHub - Panduan Deployment

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Source Code Structure](#source-code-structure)
3. [Environment Variables](#environment-variables)
4. [Deployment dengan Docker](#deployment-dengan-docker)
5. [Deployment Manual](#deployment-manual)
6. [Troubleshooting](#troubleshooting)
7. [API Endpoints](#api-endpoints)

---

## 🔧 Prerequisites

Sebelum deploy, pastikan Anda memiliki:

- **Node.js** 18+ atau 20+
- **Bun** atau **npm** sebagai package manager
- **Docker** dan **Docker Compose** (jika deploy dengan Docker)
- **Git** untuk version control
- **Server** dengan akses internet
- **Domain** (opsional, tapi direkomendasikan)

### Required Tools
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get -y install nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 📁 Source Code Structure

```
restohub/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── restaurants/ # Restaurant management
│   │   │   ├── orders/      # Order management
│   │   │   └── menu/         # Menu management
│   │   ├── (auth)/           # NextAuth config
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page (home)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboards/       # Dashboard components
│   │   │   ├── CustomerDashboard.tsx
│   │   │   ├── RestaurantDashboard.tsx
│   │   │   └── SuperAdminDashboard.tsx
│   │   ├── landing/          # Landing page
│   │   │   └── landingPage.tsx
│   │   └── menu/             # Public menu page
│   │       └── PublicMenuPage.tsx
│   ├── hooks/                  # Custom React hooks
│   │   └── use-toast.ts
│   ├── lib/                   # Utility functions
│   │   └── db.ts           # Prisma client
│   └── store/                 # Zustand store
│       └── app-store.ts
├── mini-services/              # Additional services (WebSocket, etc.)
├── public/                    # Static assets
├── db/                        # Database files
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               # Database seeding
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.local                 # Local environment variables
├── .env.example              # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── bun.lockb                 # Bun lock file
└── README.md
```

---

## 🔐 Environment Variables

### Environment Variables Required

Buat file `.env.local` di root project:

```env
# Database
DATABASE_URL="file:./db/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-min-32-chars"

# App URL (untuk production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Minio/S3 (untuk file uploads)
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="restohub-uploads"

# AI Skills (optional)
AI_API_KEY="your-ai-api-key"
AI_API_URL="https://api.example.com"

# Email (optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@restohub.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@restohub.com"
```

### Environment Variables Production

```env
# Database PostgreSQL untuk production
DATABASE_URL="postgresql://username:password@localhost:5432/restohub?schema=public"

# NextAuth Production
NEXTAUTH_URL="https://restohub.yourdomain.com"
NEXTAUTH_SECRET="prod-super-secret-key-min-32-chars-longer"

# App URL Production
NEXT_PUBLIC_APP_URL="https://restohub.yourdomain.com"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Minio/S3 Production
MINIO_ENDPOINT="https://s3.yourdomain.com"
MINIO_ACCESS_KEY="prod-access-key"
MINIO_SECRET_KEY="prod-secret-key"
MINIO_BUCKET="restohub-prod-uploads"
```

---

## 🐳 Deployment dengan Docker

### 1. Persiapan File Docker

Buat file `docker/Dockerfile`:

```dockerfile
# Base image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build Next.js application
RUN bun run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["bun", "run", "start"]
```

Buat file `docker/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./db/prod.db
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXT_PUBLIC_APP_URL=https://restohub.yourdomain.com
      - NEXT_PUBLIC_APP_NAME=RestoHub
    volumes:
      - ./db:/app/db
    depends_on:
      - minio
    restart: unless-stopped
    networks:
      - restohub-network

  # Minio Object Storage
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
      - MINIO_DEFAULT_BUCKETS=restohub-uploads
    volumes:
      - minio-data:/data
    networks:
      - restohub-network

volumes:
  minio-data:
    driver: local

networks:
  restohub-network:
    driver: bridge
```

### 2. Build Docker Image

```bash
# Build image Docker
cd /path/to/restohub
docker build -t restohub:latest .

# Atau gunakan buildx untuk multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t restohub:latest .
```

### 3. Jalankan dengan Docker Compose

```bash
# Jalankan semua services
cd /path/to/restohub
docker-compose up -d

# Lihat logs
docker-compose logs -f app

# Stop services
docker-compose down

# Restart services
docker-compose restart app
```

### 4. Docker Commands Berguna

```bash
# Lihat running containers
docker ps

# Lihat logs real-time
docker-compose logs -f

# Masuk ke container (debugging)
docker exec -it restohub-app-1 /bin/sh

# Build ulang tanpa cache
docker-compose build --no-cache

# Remove old images
docker system prune -a
```

---

## 🚀 Deployment Manual (Tanpa Docker)

### 1. Persiapan Server

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (opsional, untuk reverse proxy)
sudo apt install -y nginx
```

#### CentOS/RHEL
```bash
# Install Node.js
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
# Install dependencies dengan Bun (recommended)
bun install

# Atau dengan npm
npm install

# Generate Prisma client
bunx prisma generate

# Setup database
bunx prisma db push
```

### 4. Environment Setup

```bash
# Copy file environment
cp .env.example .env.local

# Edit dengan editor
nano .env.local

# Atau generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### 5. Build Application

```bash
# Build untuk production
bun run build

# Atau untuk development
bun run dev
```

### 6. Jalankan dengan PM2

```bash
# Setup PM2 ecosystem
pm2 start ecosystem.config.js

# Atau start langsung
pm2 start restohub --name "restohub"
```

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'restohub',
    script: './node_modules/next/dist/bin/next',
    cwd: '/path/to/restohub',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

### 7. Nginx Configuration (Reverse Proxy)

Buat file `/etc/nginx/sites-available/restohub`:

```nginx
upstream restohub_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name restohub.yourdomain.com;

    # Redirect HTTP ke HTTPS
    return 301 https://$server_name$request_uri;

    # Large client body size
    client_max_body_size 20M;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;

    location / {
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
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name restohub.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/restohub.crt;
    ssl_certificate_key /etc/ssl/certs/restohub.key;

    # Restful settings
    client_max_body_size 20M;

    # Enable compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
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
    }
}
```

---

## 🔧 Database Setup

### PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE restohub;

-- Connect ke database
\c restohub;

-- Verify tables
\dt

-- Exit
\q
```

### SQLite Setup (Development)

```bash
# Database akan dibuat otomatis di: ./db/dev.db
# Tidak perlu setup manual untuk development

# Untuk melihat data
sqlite3 db/dev.db ".tables"

# Backup database
cp db/dev.db db/dev.db.backup

# Restore database
cp db/dev.db.backup db/dev.db
```

---

## 📊 API Endpoints

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### Restaurants

```
GET  /api/restaurants                    # List semua restaurant
GET  /api/restaurants/:id              # Detail restaurant
POST /api/restaurants                   # Create restaurant
PUT  /api/restaurants/:id              # Update restaurant
DELETE /api/restaurants/:id              # Delete restaurant
GET  /api/restaurants/:id/qr-code     # Generate QR code
```

### Menu

```
GET  /api/restaurants/:id/menu          # Menu restaurant
POST /api/restaurants/:id/menu          # Add menu item
PUT  /api/menu/:id                     # Update menu item
DELETE /api/menu/:id                    # Delete menu item
GET  /api/menu/:id                     # Detail menu item
```

### Orders

```
GET  /api/orders                         # List orders
POST /api/orders                         # Create order
GET  /api/orders/:id                     # Detail order
PUT  /api/orders/:id/status              # Update status order
GET  /api/orders/restaurant/:restaurantId # Order by restaurant
```

### Subscription Plans

```
GET  /api/subscription/plans           # List semua plans
GET  /api/subscription/plans/:id       # Detail plan
PUT  /api/subscription/plans/:id       # Update plan pricing
```

---

## 🐛 Troubleshooting

### Issue: Port 3000 Sudah Digunakan

```bash
# Cari process di port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Atau gunakan port lain
# Ubah NEXT_PUBLIC_PORT di .env
```

### Issue: Database Connection Error

```bash
# Check database file
ls -la db/

# Verify DATABASE_URL di .env
cat .env.local | grep DATABASE_URL

# Reset database
rm db/dev.db
bunx prisma db push
```

### Issue: Build Errors

```bash
# Clear cache
rm -rf .next
rm -rf node_modules

# Reinstall
bun install

# Build ulang
bun run build
```

### Issue: Docker Container tidak start

```bash
# Lihat logs
docker-compose logs app

# Rebuild image
docker-compose build --no-cache

# Remove containers dan volumes
docker-compose down -v

# Start ulang
docker-compose up -d
```

---

## 📦 Production Checklist

Sebelum deploy ke production, pastikan:

- [ ] Environment variables sudah diset
- [ ] Database sudah di-setup
- [ ] SSL certificate sudah ter-install (HTTPS)
- [ ] Firewall sudah dikonfigurasi
- [ ] Backup strategy sudah siap
- [ ] Monitoring sudah di-setup
- [ ] Error tracking sudah di-aktifkan
- [ ] Rate limiting sudah di-aktifkan
- [ ] CORS sudah dikonfigurasi benar
- [ ] Session timeout sudah diset
- [ ] File upload limit sudah diset
- [ ] Email notifications sudah di-setup
- [ ] Log retention policy sudah ditentukan

---

## 🔒 Security Best Practices

### Environment Security

```bash
# Jadikan .env.local tidak dapat diakses
chmod 600 .env.local

# Jangan commit .env.local ke git
# Tambahkan .env.local ke .gitignore
echo ".env.local" >> .gitignore
```

### Application Security

1. **Gunakan HTTPS di production**
2. **Validasi semua input user**
3. **Sanitasi semua data dari database**
4. **Gunakan prepared statements untuk SQL**
5. **Implementasi rate limiting**
6. **Setup CORS yang ketat**
7. **Regular security updates**
8. **Monitor suspicious activity**

### Password Security

- Gunakan password minimal 12 karakter
- Campur huruf, angka, dan symbol
- Hash password dengan bcrypt atau argon2
- Implementasi password policy
- Rate limiting pada login attempts

---

## 📈 Monitoring & Logs

### Application Logs

```bash
# PM2 logs
pm2 logs restohub

# Docker logs
docker-compose logs -f app --tail=100

# Nginx logs
tail -f /var/log/nginx/access.log
```

### Health Checks

```bash
# Buat endpoint health check
curl http://localhost:3000/api/health

# Atau setup monitoring
# Gunakan: Uptime Robot, Pingdom, New Relic
```

---

## 🔄 Update & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Install dependencies baru
bun install

# Build ulang
bun run build

# Restart application
pm2 restart restohub
```

### Database Migration

```bash
# Generate migration baru
bunx prisma migrate dev --create-only

# Review migration
# Edit file migration di prisma/migrations/

# Apply migration
bunx prisma migrate deploy

# Seed database (opsional)
bunx prisma db seed
```

---

## 📚 Additional Resources

### Dokumentasi Teknologi

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Bun**: https://bun.sh/docs

### Tools & Utilities

- **PM2**: https://pm2.keymetrics.io/docs
- **Docker**: https://docs.docker.com
- **Nginx**: https://nginx.org/en/docs
- **PostgreSQL**: https://www.postgresql.org/docs

---

## 📞 Support

Untuk bantuan lebih lanjut:

1. **GitHub Issues**: Buka issue di repository
2. **Email Support**: support@restohub.com
3. **Documentation**: Baca dokumentasi teknologi
4. **Community**: Join Discord/Telegram community

---

## 📝 Catatan Penting

1. **Jangan pernah** commit `.env.local` atau file secrets ke repository
2. **Selalu backup** database sebelum deploy update baru
3. **Test di staging** sebelum deploy ke production
4. **Monitor** logs dan metrics secara regular
5. **Siapkan rollback plan** jika deployment gagal

---

**Versi Dokumentasi**: 1.0.0
**Last Updated**: January 2024
**Author**: RestoHub Development Team
