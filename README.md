# RestoHub - Platform Digital Restoran Terlengkap

Platform modern untuk mengelola restoran, menu digital, pesanan online, dan QR code menu dengan Next.js 16, TypeScript, dan Docker.

## 🌟 Fitur Utama

### 1. Landing Page & Registrasi Restoran
- Halaman landing modern dengan 3 paket subscription
- Formulir registrasi lengkap untuk pemilik restoran
- Tampilan harga paket yang transparan:
  - **Basic**: Rp 99.000/bulan - 50 item menu
  - **Pro**: Rp 199.000/bulan - 100 item menu
  - **Enterprise**: Rp 499.000/bulan - 200 item menu

### 2. Super Admin Dashboard
- Manajemen restoran lengkap (CRUD)
- **Manajemen Subscription Plans** - Admin bisa edit harga, fitur, dan menu limit secara manual
- Generate QR Code unik untuk setiap restoran
- Dashboard dengan statistik dan analitik platform

### 3. Restaurant Dashboard
- Manajemen menu digital (tambah, edit, hapus)
- Manajemen pesanan real-time
- Upload gambar menu dengan Minio/S3
- Konfigurasi jam operasional

### 4. Customer Dashboard
- Cari dan pilih restoran
- Browser menu digital lengkap dengan gambar
- Shopping cart interaktif
- Checkout dengan berbagai metode pembayaran
- Pesanan pelanggan
- QR Code scan di meja

### 5. Public Menu Page
- Halaman publik yang bisa diakses dengan QR code
- Tampilan menu modern dan responsif
- Pencarian menu items
- Input nomor meja
- Place order langsung

## 🛠️ Teknologi

- **Framework**: Next.js 16 dengan App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite dev, PostgreSQL prod)
- **State Management**: Zustand
- **Authentication**: NextAuth.js v4
- **UI Components**: shadcn/ui (New York style)
- **File Storage**: Minio/S3 (untuk upload gambar)
- **Payment Gateway**: Midtrans/Xendit/DOKU
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx

## 📚 Dokumentasi Lengkap

- **Panduan Deployment**: Lihat [PANDUAN-DEPLOYMENT.md](PANDUAN-DEPLOYMENT.md) untuk:
  - Persiapan server
  - Cara deploy dengan Docker lengkap
  - Konfigurasi environment variables
  - Deploy manual dengan PM2
  - Troubleshooting
  - Security best practices

- **Quick Start**: Lihat [QUICKSTART.md](QUICKSTART.md) untuk:
  - Struktur source code
  - Fitur yang tersedia
  - Cara cepat deploy

- **Build APK dari Host**: Lihat [APK-HOST-BUILD.md](APK-HOST-BUILD.md) untuk:
  - Build APK tanpa masuk ke container production
  - Builder Android terpisah berbasis Docker
  - Output default `dist/app-debug.apk` untuk testing device

## 🚀 Cara Deploy

### Method 1: Docker Compose (Rekomendasi untuk Production)

```bash
# 1. Clone atau download source code
git clone https://github.com/yourusername/restohub.git
cd restohub

# 2. Setup environment
cp .env.example .env.local
nano .env.local  # Update dengan nilai production Anda

# 3. Build dan jalankan
docker-compose up -d

# 4. Verifikasi deployment
curl http://localhost:3000/api/health
```

### Method 2: Docker dengan Minio, Postgres, dan Redis (Full Production)

```bash
# 1. Update environment variables untuk production
nano .env.local

# 2. Jalankan semua services
docker-compose --profile production up -d

# 3. Setup Nginx reverse proxy
# Gunakan konfigurasi di nginx/nginx.conf
# Setup SSL dengan Let's Encrypt
```

### Method 3: PM2 (Manual Deployment)

```bash
# 1. Build application
bun run build

# 2. Setup PM2 ecosystem
# Edit ecosystem.config.js sesuai environment Anda

# 3. Start dengan PM2
pm2 start restohub
pm2 startup
pm2 save
```

## 🔧 Environment Configuration

### Required Variables

```env
# Database
DATABASE_URL="file:./db/dev.db"                    # Development (SQLite)
# DATABASE_URL="postgresql://..."  # Production (PostgreSQL)

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Minio/S3
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="restohub-uploads"
```

### Production Variables

```env
# PostgreSQL Production
DATABASE_URL="postgresql://user:pass@localhost:5432/restohub?schema=public"

# NextAuth Production
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-min-32-chars-random"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Minio Production
MINIO_ENDPOINT="https://minio.yourdomain.com"
MINIO_ACCESS_KEY="prod-access-key"
MINIO_SECRET_KEY="prod-secret-key"
MINIO_BUCKET="restohub-prod-uploads"
MINIO_USE_SSL="true"
```

## 📁 Struktur Project

```
restohub/
├── prisma/
│   ├── schema.prisma              # Schema database
│   └── seed.ts                   # Data awal
├── src/
│   ├── app/                      # API routes & pages
│   │   ├── api/                   # Backend endpoints
│   │   ├── (auth)/                # NextAuth config
│   │   ├── layout.tsx             # Layout
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboards/             # Dashboard components
│   │   ├── landing/                # Landing page
│   │   └── menu/                  # Public menu page
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions
│   ├── store/                    # Zustand store
│   └── styles/                   # Global styles
├── public/                        # Static assets
├── docker/                        # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
├── nginx/                         # Nginx configuration
│   └── nginx.conf
├── prisma/
├── db/                             # SQLite database (dev)
├── .env.example                   # Environment template
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── PANDUAN-DEPLOYMENT.md        # Panduan deployment lengkap
└── QUICKSTART.md                   # Quick start guide
```

## 🚀 Getting Started

### Development

```bash
# 1. Install dependencies
bun install

# 2. Generate Prisma client
bunx prisma generate

# 3. Setup database
bunx prisma db push

# 4. Run development server
bun run dev

# 5. Buka http://localhost:3000
```

### Production

```bash
# 1. Setup environment
cp .env.example .env.local
nano .env.local

# 2. Build Docker image
docker build -t restohub:latest .

# 3. Jalankan services
docker-compose up -d

# 4. Verifikasi
docker-compose ps
curl http://localhost:3000/api/health
```

## 🔐 Security

- Environment variables tidak boleh di-commit ke repository
- Gunakan secret key yang kuat (minimal 32 karakter)
- Implement rate limiting untuk mencegah abuse
- Validasi semua input user
- Gunakan HTTPS di production dengan valid SSL certificate
- Regular backup database
- Monitor logs dan security events

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Restaurants
- `GET /api/restaurants` - Daftar restoran
- `GET /api/restaurants/:id` - Detail restoran
- `POST /api/restaurants` - Buat restoran
- `PUT /api/restaurants/:id` - Update restoran
- `DELETE /api/restaurants/:id` - Hapus restoran
- `GET /api/restaurants/:id/qr-code` - Generate QR code

### Menu
- `GET /api/restaurants/:id/menu` - Menu restoran
- `POST /api/restaurants/:id/menu` - Tambah menu
- `PUT /api/menu/:id` - Update menu
- `DELETE /api/menu/:id` - Hapus menu

### Orders
- `GET /api/orders` - Daftar pesanan
- `POST /api/orders` - Buat pesanan
- `GET /api/orders/:id` - Detail pesanan
- `PUT /api/orders/:id/status` - Update status

### Subscription Plans
- `GET /api/subscription/plans` - Daftar paket
- `GET /api/subscription/plans/:id` - Detail paket
- `PUT /api/subscription/plans/:id` - Update paket

## 🛠️ Troubleshooting

### Masalah Umum

**Port 3000 sudah digunakan:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Database connection error:**
```bash
# Reset database
rm db/dev.db
bunx prisma db push
```

**Build error:**
```bash
# Clear cache
rm -rf .next node_modules
bun install
bun run build
```

---

## 📞 Support

Untuk bantuan:
- 📖 [Baca panduan deployment lengkap](PANDUAN-DEPLOYMENT.md)
- 📖 [Quick start guide](QUICKSTART.md)
- GitHub Issues: [Buka issue di repository](https://github.com/yourusername/restohub/issues)

---

**Versi**: 1.0.0  
**Last Updated**: Januari 2024  
**Tech Stack**: Next.js 16, TypeScript, Prisma, Docker, Tailwind CSS
