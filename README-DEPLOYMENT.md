# RestoHub - Deployment Guide

## 📋 Cara Mendapatkan Source Code Lengkap

### 1. Clone dari Git (Recommended)

Jika Anda memiliki akses ke repository Git/GitLab:

```bash
# Clone repository
git clone https://github.com/yourusername/restohub.git
cd restohub

# Checkout branch terbaru
git checkout main
git pull origin main
```

### 2. Download sebagai ZIP

Jika tidak akses Git, download sebagai ZIP:

1. Buka repository di GitHub/GitLab
2. Klik tombol "Code" → "Download ZIP"
3. Extract file ZIP ke komputer Anda
4. Pastikan semua folder sudah ter-copy dengan benar

### 3. Struktur Source Code yang Dibutuhkan

Pastikan struktur folder berikut sudah lengkap:

```
restohub/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/              # API routes & pages
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── store/            # Zustand store
│   └── styles/           # Global styles (optional)
├── public/              # Static files
├── docker/              # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
├── nginx/               # Nginx configuration
│   └── nginx.conf
├── .env.example          # Environment template
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── DEPLOYMENT.md         # Deployment documentation
└── README.md            # Main documentation
```

### 4. Dependencies yang Dibutuhkan

Install dependencies setelah download:

```bash
cd restohub

# Install dengan Bun (recommended, lebih cepat)
bun install

# Atau dengan npm
npm install
```

---

## 🚀 Deployment Methods

### Method 1: Docker Compose (Recommended untuk Production)

#### Kelebihan:
- ✅ Isolated environment
- ✅ Mudah scale
- ✅ Database included
- ✅ File storage included
- ✅ One-command deployment

#### Langkah-langkah:

1. **Persiapan Environment**

```bash
# Copy file environment template
cp .env.example .env.local

# Edit file environment
nano .env.local

# Generate secret key untuk production
openssl rand -base64 32

# Paste ke .env.local
```

2. **Edit docker-compose.yml untuk Production**

```yaml
# Ubah environment variables di docker-compose.yml
environment:
  - DATABASE_URL=postgresql://postgres:password@postgres:5432/restohub
  - NEXTAUTH_URL=https://restohub.yourdomain.com
  - NEXT_PUBLIC_APP_URL=https://restohub.yourdomain.com
```

3. **Buat Volumes untuk Database & Uploads**

```bash
# Buat folder volumes di server
mkdir -p /data/restohub/db
mkdir -p /data/restohub/uploads
mkdir -p /data/restohub/redis

# Set permissions
sudo chown -R 1000:1000 /data/restohub
sudo chmod -R 755 /data/restohub
```

4. **Jalankan Services**

```bash
# Jalankan semua services (app + minio + postgres + redis)
docker-compose --profile production up -d

# Lihat status services
docker-compose ps

# Lihat logs
docker-compose logs -f app
```

5. **Setup SSL dengan Let's Encrypt**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --nginx -d restohub.yourdomain.com --email admin@restohub.com

# Certificate akan tersimpan di:
# /etc/letsencrypt/live/restohub.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/restohub.yourdomain.com/privkey.pem

# Update nginx.conf untuk menggunakan SSL
sudo nano nginx/nginx.conf

# Restart nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

### Method 2: Manual Deployment dengan PM2

#### Langkah-langkah:

1. **Install Node.js & PM2**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

2. **Setup Database**

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Setup database
sudo -u postgres psql

CREATE DATABASE restohub;
CREATE USER restohub_user WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE restohub TO restohub_user;
\q

# Update DATABASE_URL di .env.local
DATABASE_URL="postgresql://restohub_user:your-strong-password@localhost:5432/restohub"
```

3. **Deploy Application**

```bash
# Clone atau copy source code
cd /var/www/restohub
git clone https://github.com/yourusername/restohub.git .

# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Setup environment
cp .env.example .env.production

# Build application
bun run build

# Start dengan PM2
pm2 start ecosystem.config.js

# Set PM2 untuk auto-start on boot
pm2 startup
pm2 save
```

4. **Setup Nginx Reverse Proxy**

```bash
# Copy nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/restohub

# Create symlink
sudo ln -s /etc/nginx/sites-available/restohub /etc/nginx/sites-enabled/restohub

# Test configuration
sudo nginx -t

# Enable site
sudo systemctl restart nginx
```

---

### Method 3: Cloud Deployment (Vercel / Railway / DigitalOcean)

#### Deploy ke Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Environment variables akan diminta saat deploy
# Masukkan NEXTAUTH_SECRET dan database credentials
```

#### Deploy ke Railway:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up

# Add database via Railway dashboard
# Add environment variables via Railway dashboard
```

---

## 🔧 Post-Deployment Configuration

### 1. Database Migration

```bash
# Connect ke container
docker exec -it restohub-app-1 /bin/sh

# Run migrations
bunx prisma migrate deploy

# Seed initial data (opsional)
bunx prisma db seed
```

### 2. Create Admin User

```bash
# Masuk ke container
docker exec -it restohub-app-1 /bin/sh

# Buat super admin user
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  const admin = await prisma.user.create({
    data: {
      email: 'admin@restohub.com',
      name: 'Super Admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Admin created:', admin);
}

createAdmin();
"

exit
```

### 3. Setup SSL Certificates

```bash
# Untuk development (self-signed)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/certs/restohub.key \
  -out /etc/ssl/certs/restohub.crt

# Untuk production (Let's Encrypt)
sudo certbot certonly --nginx \
  -d restohub.yourdomain.com \
  --email admin@restohub.com \
  --agree-tos \
  --redirect
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-20T10:00:00Z",
  "uptime": "2d 14h"
}
```

### Log Monitoring

```bash
# Docker logs
docker-compose logs -f app --tail=100

# PM2 logs
pm2 logs restohub --lines 100

# Nginx logs
tail -f /var/log/nginx/restohub_access.log
tail -f /var/log/nginx/restohub_error.log
```

### Database Backup

```bash
# Backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=\$(date +%Y%m%d)
BACKUP_DIR="/backups/restohub"
mkdir -p \$BACKUP_DIR

# Backup PostgreSQL
docker exec restohub-postgres pg_dump -U postgres restohub > \$BACKUP_DIR/restohub_\$DATE.sql

# Backup SQLite (jika menggunakan)
docker exec restohub-app-1 cp /app/db/prod.db \$BACKUP_DIR/prod_\$DATE.db

# Hapus backup lama dari 7 hari
find \$BACKUP_DIR -type f -mtime +7 -delete

# Compress
gzip \$BACKUP_DIR/restohub_\$DATE.sql

echo "Backup completed: \$DATE"
EOF

chmod +x backup-db.sh

# Jalankan backup harian di crontab
crontab -e "0 2 * * * /path/to/backup-db.sh"
```

---

## 🔒 Security Checklist

### Sebelum Go Live:

- [ ] Semua password default sudah diubah
- [ ] Environment variables sudah diset dengan benar
- [ ] SSL/TLS certificate sudah ter-install
- [ ] Firewall hanya membuka port yang dibutuhkan (80, 443, 3000)
- [ ] Rate limiting sudah di-aktifkan
- [ ] CORS sudah dikonfigurasi ketat
- [ ] Security headers sudah diset
- [ ] Database backups sudah dijadwalkan
- [ ] Error tracking sudah di-setup
- [ ] Monitoring system sudah aktif
- [ ] SSL certificate expiration sudah di-monitor

### Security Best Practices:

1. **Gunakan Strong Passwords**: Minimum 16 karakter, kombinasi huruf, angka, symbol
2. **Regular Updates**: Update dependencies dan OS secara regular
3. **Access Control**: Batasi akses hanya ke user yang perlu
4. **Audit Logging**: Log semua aktivitas admin
5. **Input Validation**: Validasi semua input user
6. **Rate Limiting**: Batasi request yang mencurigakan
7. **Backup Strategy**: Backup harian dengan retention 30 hari

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

```bash
# Cari process di port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Atau gunakan port lain
PORT=3001
```

### Issue: Database Connection Failed

```bash
# Check database running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec -it restohub-app-1 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.\$connect()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Database connection failed:', err));
"
```

### Issue: Build Fails

```bash
# Clear cache
rm -rf .next node_modules

# Reinstall
rm -rf bun.lockb
bun install

# Build ulang
bun run build
```

---

## 📝 Notes Penting

### Production Deployment:

1. **Jangan pernah** commit `.env.local` ke repository
2. **Selalu backup** database sebelum deploy update baru
3. **Test thoroughly** di staging sebelum production
4. **Monitor logs** secara regular untuk error
5. **Setup alerts** untuk critical issues
6. **Database migrations** harus di-test sebelum production
7. **SSL certificates** harus diperbarui sebelum expiration
8. **Backup strategy** harus diuji secara regular

### Performance Optimization:

1. **Enable CDN** untuk static assets
2. **Implementasi caching** untuk frequently accessed data
3. **Optimize images** sebelum upload
4. **Gunakan database indexes** untuk queries
5. **Implementasi pagination** untuk large datasets
6. **Enable compression** (gzip, brotli)
7. **Setup load balancer** untuk high traffic

---

## 📞 Support Resources

### Dokumentasi Resmi:
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Docker: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose/
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/docs/

### Community Support:
- Next.js Discord: https://discord.gg/nextjs
- GitHub Discussions: Buka issues di repository
- Stack Overflow: Tag questions dengan [restohub]

---

## ✅ Deployment Verification

Setelah deployment, verifikasi:

```bash
# 1. Check website accessibility
curl -I https://restohub.yourdomain.com

# 2. Test health endpoint
curl https://restohub.yourdomain.com/api/health

# 3. Test API authentication
curl -X POST https://restohub.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restohub.com","password":"admin123"}'

# 4. Test database connection
docker exec restohub-postgres psql -U postgres -d restohub -c "SELECT version();"

# 5. Check all services running
docker-compose ps

# 6. Verify SSL certificate
echo | openssl s_client -connect restohub.yourdomain.com:443 -servername restohub.yourdomain.com
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
