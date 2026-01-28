# Panduan Source Code RestoHub - Cara Mendapatkan dan Menjalankan di Lokal

## 📖 Ringkasan

RestoHub adalah platform manajemen restoran modern yang telah lengkap dibuat dengan fitur-fitur lengkap. Dokumen ini akan menjelaskan bagaimana Anda bisa mendapatkan seluruh source code dan menjalankannya di komputer lokal Anda.

---

## 🎯 Apa yang Telah Dibuat?

### 1. Sistem Manajemen Restoran Lengkap
- **Super Admin Dashboard**: Kelola seluruh restoran dan subscription plans
- **Restaurant Dashboard**: Kelola menu, pesanan, dan pengaturan restoran
- **Customer Dashboard**: Cari restoran, pesan menu, dan kelola pesanan
- **Public Menu Page**: Halaman publik yang diakses lewat QR code

### 2. Fitur Subscription Management
- 3 paket subscription (Basic, Pro, Enterprise)
- Harga bisa diedit manual oleh admin
- Menu limit per paket
- Fitur yang bisa dikustomisasi

### 3. Landing Page
- Halaman registrasi restoran modern
- Tampilan pricing paket yang transparan
- Form registrasi lengkap
- Responsive design

### 4. QR Code System
- Generate QR code unik untuk setiap restoran
- URL unik untuk akses menu publik
- Scan QR code untuk melihat menu

### 5. Payment Gateway Integration
- Mendukung QRIS, GOPAY, OVO, DANA, LinkAja, ShopeePay
- Payment processing dengan status tracking
- Receipt generation

---

## 📂 Struktur Source Code Lengkap

```
restohub/
│
├── 📁 prisma/
│   ├── schema.prisma              # Database schema (SQLite/PostgreSQL)
│   └── migrations/                # Database migrations
│
├── 📁 src/
│   │
│   ├── 📁 app/
│   │   ├── 📁 api/                # Backend API Routes
│   │   │   ├── route.ts          # Root API endpoint
│   │   │   ├── restaurants/      # Restaurant management API
│   │   │   │   └── route.ts      # CRUD restaurants
│   │   │   ├── categories/       # Category management API
│   │   │   │   └── route.ts      # CRUD categories
│   │   │   ├── menu-items/       # Menu management API
│   │   │   │   └── route.ts      # CRUD menu items
│   │   │   ├── orders/           # Order management API
│   │   │   │   └── route.ts      # CRUD orders
│   │   │   └── payments/         # Payment processing API
│   │   │       └── route.ts      # Payment processing
│   │   │
│   │   ├── layout.tsx            # Root layout component
│   │   ├── page.tsx              # Main landing page
│   │   ├── globals.css           # Global styles
│   │   └── (auth)/               # NextAuth configuration
│   │
│   ├── 📁 components/
│   │   │
│   │   ├── 📁 ui/                # shadcn/ui components (45+ components)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── ... dan lainnya
│   │   │
│   │   ├── 📁 dashboards/         # Dashboard components
│   │   │   ├── SuperAdminDashboard.tsx       # Super admin dashboard
│   │   │   ├── RestaurantAdminDashboard.tsx  # Restaurant dashboard
│   │   │   └── CustomerDashboard.tsx        # Customer dashboard
│   │   │
│   │   ├── 📁 landing/            # Landing page components
│   │   │   └── LandingPage.tsx   # Main landing page
│   │   │
│   │   ├── 📁 menu/               # Public menu components
│   │   │   └── PublicMenuPage.tsx  # Public menu page
│   │   │
│   │   └── 📁 common/            # Common components
│   │       └── QRCodeDialog.tsx   # QR code generator dialog
│   │
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── use-toast.ts          # Toast notification hook
│   │   └── use-mobile.ts         # Mobile detection hook
│   │
│   ├── 📁 lib/                    # Utility libraries
│   │   ├── utils.ts              # Utility functions
│   │   └── db.ts                 # Prisma client initialization
│   │
│   └── 📁 store/                  # State management
│       └── app-store.ts          # Zustand store
│
├── 📁 public/                      # Static assets
│   ├── logo.svg
│   ├── restaurant-logo-indo.png
│   ├── restaurant-logo-japanese.png
│   ├── restaurant-logo-pizza.png
│   ├── restaurant-hero.png
│   ├── menu-sate-ayam.png
│   ├── menu-es-teh.png
│   ├── menu-nasi-goreng.png
│   ├── menu-rendang.png
│   ├── food-platter.png
│   └── robots.txt
│
├── 📁 docker/                      # Docker configuration
│   ├── Dockerfile                # Multi-stage build Dockerfile
│   └── docker-compose.yml        # Service orchestration
│
├── 📁 nginx/                       # Nginx configuration
│   └── nginx.conf                # Reverse proxy config
│
├── 📁 db/                          # SQLite database (development)
│   └── dev.db                    # Development database
│
├── 📄 package.json               # Dependencies & scripts
├── 📄 tsconfig.json              # TypeScript configuration
├── 📄 next.config.ts             # Next.js configuration
├── 📄 tailwind.config.ts         # Tailwind CSS configuration
├── 📄 components.json            # shadcn/ui configuration
├── 📄 .env.example               # Environment variables template
│
├── 📄 README.md                  # Project documentation
├── 📄 PANDUAN-DEPLOYMENT.md      # Deployment guide (Bahasa Indonesia)
├── 📄 QUICKSTART.md             # Quick start guide
├── 📄 DEPLOYMENT.md             # Deployment guide (English)
└── 📄 SOURCE-CODE-GUIDE.md       # This file - Source code guide
```

---

## 🔧 Teknologi yang Digunakan

### Core Technologies
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Runtime**: Bun (JavaScript runtime)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)

### Backend
- **Database ORM**: Prisma 6.11.1
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: NextAuth.js v4.24.11
- **API**: Next.js API Routes (App Router)

### Frontend
- **State Management**: Zustand 5.0.6
- **Server State**: TanStack Query 5.82.0
- **Forms**: React Hook Form 7.60.0 + Zod 4.0.2
- **UI Library**: Radix UI primitives + shadcn/ui
- **Icons**: Lucide React 0.525.0
- **Animations**: Framer Motion 12.23.2

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2 (for manual deployment)

---

## 💾 Cara Mendapatkan Source Code

### Method 1: Download Langsung (Paling Mudah)

Jika Anda memiliki akses ke file server:

1. **Persiapkan folder lokal**
   ```bash
   mkdir restohub-local
   cd restohub-local
   ```

2. **Copy semua file dari server ke lokal**
   
   Anda bisa menggunakan:
   - SCP (Linux/Mac)
   ```bash
   scp -r user@server:/home/z/my-project/* .
   ```
   
   - FileZilla (GUI FTP/SFTP)
   - WinSCP (Windows)
   - rsync
   ```bash
   rsync -avz user@server:/home/z/my-project/ .
   ```

3. **Pastikan semua file tercopy**
   ```bash
   ls -la
   # Pastikan Anda melihat:
   # package.json, prisma/, src/, public/, dll.
   ```

### Method 2: Git Repository (Rekomendasi)

Jika source code ada di Git repository:

```bash
# Clone repository
git clone https://github.com/username/restohub.git
cd restohub

# Atau jika dari private repository:
git clone git@github.com:username/restohub.git
```

### Method 3: Export dari Cloud Environment

Jika Anda bekerja di cloud IDE atau server:

1. **Compress source code**
   ```bash
   tar -czf restohub-source.tar.gz \
     --exclude='node_modules' \
     --exclude='.next' \
     --exclude='*.log' \
     --exclude='db/dev.db' \
     .
   ```

2. **Download file compressed**
   ```bash
   # Via SCP
   scp user@server:/home/z/my-project/restohub-source.tar.gz .

   # Atau gunakan panel control cloud provider Anda
   ```

3. **Extract di lokal**
   ```bash
   tar -xzf restohub-source.tar.gz
   cd restohub
   ```

---

## 🚀 Cara Menjalankan di Lokal

### Persyaratan Sistem

Sebelum memulai, pastikan Anda telah menginstall:

- **Bun** (JavaScript runtime) - Download dari https://bun.sh
- **Node.js** (alternatif) - versi 18+ (https://nodejs.org)
- **Git** (optional) - untuk version control (https://git-scm.com)
- **VS Code** (recommended) - IDE (https://code.visualstudio.com)

### Langkah 1: Install Dependencies

```bash
# Jika menggunakan Bun (recommended)
bun install

# Atau jika menggunakan npm
npm install

# Atau jika menggunakan yarn
yarn install
```

### Langkah 2: Setup Environment Variables

```bash
# Copy template environment
cp .env.example .env.local

# Edit file .env.local
nano .env.local  # Linux/Mac
# atau
notepad .env.local  # Windows
```

Isi dengan nilai lokal Anda:

```env
# Database (Development menggunakan SQLite)
DATABASE_URL="file:./db/dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RestoHub"

# Minio/S3 (Optional untuk development)
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="restohub-uploads"
```

**Tips untuk NEXTAUTH_SECRET**:
Generate secret key yang kuat:
```bash
# Di terminal
openssl rand -base64 32

# Atau online: https://generate-secret.vercel.app/32
```

### Langkah 3: Setup Database

```bash
# Generate Prisma Client
bunx prisma generate

# Atau
npx prisma generate

# Push schema ke database (creates tables)
bunx prisma db push

# Atau jika ingin migrasi
bunx prisma migrate dev --name init
```

### Langkah 4: Jalankan Development Server

```bash
# Start development server
bun run dev

# Atau jika menggunakan npm
npm run dev

# Atau jika menggunakan yarn
yarn dev
```

Server akan berjalan di **http://localhost:3000**

### Langkah 5: Akses Aplikasi

Buka browser dan akses:

- **Landing Page**: http://localhost:3000
- **Super Admin Dashboard**: http://localhost:3000/dashboard/super-admin
- **Restaurant Dashboard**: http://localhost:3000/dashboard/restaurant
- **Customer Dashboard**: http://localhost:3000/dashboard/customer
- **Public Menu**: http://localhost:3000/menu/[restaurant-id]

---

## 📝 Script yang Tersedia

Semua script ada di `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "NODE_ENV=production bun .next/standalone/server.js",
    "lint": "eslint .",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset"
  }
}
```

**Penggunaan**:
```bash
bun run dev          # Development server
bun run build        # Production build
bun run start        # Production server
bun run lint         # Code linting
bun run db:push      # Update database schema
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run database migrations
bun run db:reset     # Reset database
```

---

## 🗄️ Database Schema

Prisma schema lengkap ada di `prisma/schema.prisma`:

### Models:

1. **User**
   - Fields: id, email, name, phone, password, role
   - Roles: SUPER_ADMIN, RESTAURANT_ADMIN, CUSTOMER

2. **Restaurant**
   - Fields: id, name, description, address, phone, email, logo, isActive
   - Relations: admin, categories, menuItems, paymentMethods, orders

3. **Category**
   - Fields: id, name, description, displayOrder, isActive
   - Relations: restaurant, menuItems

4. **MenuItem**
   - Fields: id, name, description, price, image, isAvailable, displayOrder
   - Relations: restaurant, category, orderItems

5. **Order**
   - Fields: id, orderNumber, totalAmount, notes, tableNumber, status, paymentStatus
   - Status: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
   - Relations: customer, restaurant, orderItems, payment

6. **OrderItem**
   - Fields: id, quantity, price, notes
   - Relations: order, menuItem

7. **PaymentMethod**
   - Fields: id, type, isActive, qrCode, merchantId
   - Types: QRIS, GOPAY, OVO, DANA, LINKAJA, SHOPEEPAY, CASH
   - Relations: restaurant, payments

8. **Payment**
   - Fields: id, amount, type, status, transactionId, paymentDate, receiptData
   - Status: PENDING, PAID, FAILED, REFUNDED
   - Relations: order, method

---

## 🔍 Komponen Utama

### 1. SuperAdminDashboard (`src/components/dashboards/SuperAdminDashboard.tsx`)

Fitur:
- Manajemen restoran (CRUD)
- Manajemen subscription plans (edit harga, fitur, menu limit)
- Generate QR code untuk setiap restoran
- Statistik platform
- Dashboard dengan charts dan metrics

### 2. RestaurantAdminDashboard (`src/components/dashboards/RestaurantAdminDashboard.tsx`)

Fitur:
- Manajemen menu (tambah, edit, hapus)
- Manajemen categories
- Manajemen pesanan
- Upload gambar menu
- View order history

### 3. CustomerDashboard (`src/components/dashboards/CustomerDashboard.tsx`)

Fitur:
- Cari dan filter restoran
- Browse menu
- Shopping cart
- Checkout dengan payment gateway
- Order history

### 4. LandingPage (`src/components/landing/LandingPage.tsx`)

Fitur:
- Hero section dengan CTA
- Pricing cards untuk subscription plans
- Features showcase
- How it works section
- Registration form
- Responsive design

### 5. PublicMenuPage (`src/components/menu/PublicMenuPage.tsx`)

Fitur:
- Public menu access tanpa login
- Search dan filter menu
- Add to cart
- Table number input
- Place order

### 6. QRCodeDialog (`src/components/common/QRCodeDialog.tsx`)

Fitur:
- Generate QR code unik
- Display restaurant URL
- Download QR code

---

## 🔌 API Routes

Semua API routes ada di `src/app/api/`:

### `/api/route.ts`
- Root API endpoint
- Health check
- API version info

### `/api/restaurants/route.ts`
- `GET /api/restaurants` - List all restaurants
- `POST /api/restaurants` - Create new restaurant
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant

### `/api/categories/route.ts`
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### `/api/menu-items/route.ts`
- `GET /api/menu-items` - List menu items
- `POST /api/menu-items` - Create menu item
- `PUT /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item

### `/api/orders/route.ts`
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order

### `/api/payments/route.ts`
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment status
- `POST /api/payments/callback` - Payment gateway callback

---

## 🐛 Troubleshooting

### Problem: "module not found" error

**Solution**:
```bash
# Clear cache dan reinstall
rm -rf node_modules .next
bun install
```

### Problem: Database connection error

**Solution**:
```bash
# Check DATABASE_URL di .env.local
cat .env.local | grep DATABASE_URL

# Reset database
rm db/dev.db
bunx prisma db push
```

### Problem: Port 3000 already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Problem: Prisma client not generated

**Solution**:
```bash
# Regenerate Prisma client
bunx prisma generate
```

### Problem: Build fails

**Solution**:
```bash
# Clear all cache
rm -rf .next node_modules prisma/node_modules
bun install
bun run build
```

---

## 📚 Referensi dan Dokumentasi

### Dokumentasi Proyek
- **README.md** - Dokumentasi utama proyek
- **PANDUAN-DEPLOYMENT.md** - Panduan deployment lengkap (Bahasa Indonesia)
- **DEPLOYMENT.md** - Deployment guide (English)
- **QUICKSTART.md** - Quick start guide
- **SOURCE-CODE-GUIDE.md** - Dokumen ini

### Dokumentasi Teknologi
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **NextAuth.js**: https://next-auth.js.org
- **Zustand**: https://zustand-demo.pmnd.rs
- **Radix UI**: https://www.radix-ui.com

### Tutorial dan Learning Resources
- **Next.js Learn**: https://nextjs.org/learn
- **Prisma Tutorial**: https://www.prisma.io/docs/getting-started
- **Tailwind Tutorial**: https://tailwindcss.com/docs/installation

---

## 🤝 Kontribusi

Jika Anda ingin berkontribusi:

1. Fork repository
2. Buat branch fitur baru: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push ke branch: `git push origin feature/my-feature`
5. Submit pull request

---

## 📞 Support dan Bantuan

Jika mengalami masalah:

1. Baca dokumentasi yang tersedia
2. Check troubleshooting section di dokumentasi ini
3. Cari di GitHub Issues
4. Buat issue baru jika masalah belum ada

---

## ✅ Checklist Sebelum Menjalankan

Sebelum menjalankan aplikasi, pastikan:

- [ ] Bun atau Node.js sudah terinstall
- [ ] Source code sudah didownload lengkap
- [ ] Dependencies sudah terinstall (`bun install`)
- [ ] Environment variables sudah disetup (`.env.local`)
- [ ] Database sudah di-setup (`bunx prisma db push`)
- [ ] Prisma client sudah digenerate (`bunx prisma generate`)
- [ ] Development server sudah berjalan (`bun run dev`)
- [ ] Browser sudah dibuka di http://localhost:3000

---

## 🎓 Tips untuk Pengembangan

### Development Tips

1. **Gunakan Hot Reload**
   - Next.js punya hot reload otomatis
   - Simpan file dan refresh browser

2. **Debugging**
   - Gunakan console.log() untuk debugging
   - Atau gunakan debugger di VS Code
   - Check dev.log untuk server logs

3. **Database Management**
   - Gunakan Prisma Studio untuk visual database
   - Run: `bunx prisma studio`
   - Buka di http://localhost:5555

4. **Linting**
   - Run `bun run lint` sebelum commit
   - Perbaiki semua linting errors

5. **Testing**
   - Test semua fitur sebelum deployment
   - Test dengan berbagai browsers

---

## 🚀 Next Steps

Setelah berhasil menjalankan di lokal:

1. **Eksplorasi Dashboard**
   - Coba semua fitur super admin
   - Test subscription plan editing
   - Generate QR code

2. **Buat Restaurant Test**
   - Register restaurant baru
   - Add categories dan menu items
   - Test menu browsing

3. **Test Payment Flow**
   - Create customer account
   - Place order dengan cart
   - Test payment processing

4. **Deploy ke Production**
   - Ikuti panduan di PANDUAN-DEPLOYMENT.md
   - Gunakan Docker untuk deployment
   - Setup SSL dan domain

---

## 📄 License

Project ini dibuat untuk keperluan komersial dan dapat digunakan sesuai kebutuhan bisnis Anda.

---

## 📅 Changelog

### Versi 1.0.0 (Januari 2024)
- ✅ Initial release
- ✅ Complete restaurant management system
- ✅ Super Admin, Restaurant Admin, Customer dashboards
- ✅ Subscription plan management
- ✅ QR code generation
- ✅ Payment gateway integration
- ✅ Landing page dan public menu page
- ✅ Docker deployment configuration
- ✅ Complete documentation (Bahasa Indonesia & English)

---

**Created**: Januari 2024  
**Tech Stack**: Next.js 16, TypeScript, Prisma, Docker, Tailwind CSS  
**Status**: Production Ready ✅
