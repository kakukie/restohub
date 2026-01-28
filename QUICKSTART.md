# RestoHub - Quick Start Guide

## 📁 File & Directory Structure

```
restohub/
├── deployment-guide.md          # Panduan deployment lengkap
├── deploy.sh                  # Script deployment otomatis
├── docker/
│   ├── Dockerfile             # Docker image configuration
│   └── docker-compose.yml      # Docker services definition
├── nginx/
│   └── nginx.conf            # Nginx reverse proxy config
├── .env.example               # Template environment variables
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Data seeding
└── src/                      # Source code
```

---

## 🚀 Cara Cepat Deploy

### 1. Dapatkan Source Code

#### Opsi A: Clone dari Git
```bash
git clone https://github.com/yourusername/restohub.git
cd restohub
```

#### Opsi B: Download ZIP
1. Download dari GitHub/GitLab sebagai ZIP
2. Extract ke folder project

### 2. Setup Environment

```bash
# Copy template
cp .env.example .env.local

# Edit file
nano .env.local

# Generate secret untuk production
openssl rand -base64 32
```

**Variable Penting yang Perlu Diisi:**
- `DATABASE_URL` - String koneksi database
- `NEXTAUTH_SECRET` - Secret key untuk authentication (MIN 32 chars)
- `NEXT_PUBLIC_APP_URL` - Base URL aplikasi
- `MINIO_ACCESS_KEY` - Minio access credentials (untuk uploads)

### 3. Deploy dengan Docker (Recommended)

```bash
# Jalankan script deployment otomatis
bash deploy.sh

# Atau manual:
cd /path/to/restohub
docker-compose build --no-cache
docker-compose up -d

# Lihat status
docker-compose ps

# Lihat logs
docker-compose logs -f app --tail=50
```

### 4. Deploy Manual dengan PM2

```bash
# 1. Install dependencies
bun install

# 2. Build application
bun run build

# 3. Start dengan PM2
pm2 start ecosystem.config.js

# 4. Nginx reverse proxy
# Copy nginx/config ke /etc/nginx/sites-available/restohub
# Enable: sudo ln -s /etc/nginx/sites-available/restohub /etc/nginx/sites-enabled/
# Restart: sudo systemctl reload nginx
```

---

## 🔐 Security Checklist

Sebelum production:

- [ ] Semua password default sudah diubah
- [ ] SSL certificate ter-install dan valid
- [ ] Firewall hanya buka port yang perlu (80, 443)
- [ ] Environment variables tidak di-commit ke git
- [ ] Database backup sudah di-setup
- [ ] Monitoring dan logging aktif
- [ ] Rate limiting aktif
- [ ] CORS configuration benar

---

## 📊 Fitur yang Tersedia

### 1. Landing Page (`/`)
- Registration form untuk restaurant owners
- Display 3 subscription plans dengan harga
- Fitur showcase dan cara kerja

### 2. Super Admin Dashboard
- Restaurant management (CRUD)
- Subscription plans editing (harga, features, menu limit)
- QR Code generation untuk setiap restaurant
- Analytics dan statistik platform
- User management

### 3. Restaurant Dashboard
- Menu management (CRUD)
- Order tracking
- Order history
- Customer management
- Menu analytics

### 4. Customer Dashboard
- Browser restaurants
- View menu dan order
- Shopping cart
- Checkout dengan multiple payment methods
- Order tracking real-time

### 5. Public Menu Page (`/menu/[restaurantId]`)
- Scan QR code untuk akses menu
- Search menu items
- Add ke cart
- Place order
- Input table number
- Order confirmation

---

## 🔧 Environment Variables

### Development (.env.local)
```env
DATABASE_URL="file:./db/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RestoHub"
```

### Production
```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/restohub"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-key-min-32-chars-random"

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Minio (File Uploads)
MINIO_ENDPOINT="https://minio.yourdomain.com"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET="restohub-uploads"
MINIO_USE_SSL="true"
```

---

## 🐛 Troubleshooting Common Issues

### 1. Port 3000 sudah dipakai
```bash
lsof -i :3000
kill -9 <PID>
```

### 2. Database connection error
```bash
# Check DATABASE_URL
cat .env.local | grep DATABASE_URL

# Reset database
rm db/dev.db
bunx prisma db push
```

### 3. Build error
```bash
# Clear cache
rm -rf .next node_modules
bun install
bun run build
```

### 4. Docker container tidak start
```bash
# Lihat logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Catatan Penting

1. **Environment Variables**: JANGAN pernah commit `.env.local` ke repository. Gunakan `.env.example` sebagai template
2. **Database**: Pastikan backup database sebelum deploy update baru
3. **SSL**: Gunakan Let's Encrypt untuk gratis atau sertifikat komersial untuk production
4. **Security**: Rate limiting, input validation, dan CORS harus dikonfigurasi dengan benar
5. **Monitoring**: Setup monitoring untuk uptime dan performance tracking
6. **Testing**: Test secara menyeluruh di staging environment sebelum production

---

## 📞 Support & Resources

### Dokumentasi Teknologi
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Docker: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose/
- Nginx: https://nginx.org/en/docs/
- Tailwind CSS: https://tailwindcss.com/docs

### Deploy Platform Alternatif
- **Vercel**: https://vercel.com (Serverless, gratis)
- **Railway**: https://railway.app (PaaS, mudah)
- **DigitalOcean**: https://digitalocean.com (VPS, kontrol penuh)
- **AWS**: https://aws.amazon.com (Cloud platform, scalable)
- **Google Cloud**: https://cloud.google.com (Cloud platform)

---

**Versi**: 1.0.0
**Last Updated**: January 2024

---

## 🎯 Next Steps

Setelah deployment sukses:

1. Buka aplikasi di browser
2. Register sebagai Super Admin
3. Buat restaurant baru
4. Edit subscription plans jika perlu
5. Generate QR code untuk restaurant
6. Print QR code dan tempel di meja
7. Tambah menu items
8. Test flow customer ordering
9. Setup payment gateway jika perlu
10. Monitor performance secara regular

Selamat menggunakan RestoHub! 🎉
