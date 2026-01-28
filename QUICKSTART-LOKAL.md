# 🚀 Quick Start - Menjalankan RestoHub di Lokal

## Cara Cepat (5 Menit)

### 1️⃣ Install Dependencies

```bash
bun install
```

### 2️⃣ Setup Environment

```bash
# Copy template
cp .env.example .env.local

# Edit file .env.local (opsional untuk development)
# Default values sudah cukup untuk development
```

### 3️⃣ Setup Database

```bash
# Generate Prisma Client
bunx prisma generate

# Create database tables
bunx prisma db push
```

### 4️⃣ Jalankan Development Server

```bash
bun run dev
```

### 5️⃣ Buka Browser

Akses: **http://localhost:3000**

---

## 📂 Source Code Anda Sudah Siap!

Semua file RestoHub sudah ada di direktori ini:

```
/home/z/my-project/
├── src/                    # Source code utama
│   ├── app/               # API routes & pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── store/             # State management
├── prisma/                # Database schema
├── public/                # Static assets
├── package.json           # Dependencies
└── ...dan lainnya
```

---

## 🎯 Akses Fitur-Fitur

Setelah server berjalan, akses:

| Fitur | URL |
|-------|-----|
| **Landing Page** | http://localhost:3000 |
| **Super Admin Dashboard** | http://localhost:3000/dashboard/super-admin |
| **Restaurant Dashboard** | http://localhost:3000/dashboard/restaurant |
| **Customer Dashboard** | http://localhost:3000/dashboard/customer |
| **Public Menu** | http://localhost:3000/menu/[restaurant-id] |

---

## 🔧 Commands Berguna

```bash
# Development
bun run dev              # Start development server
bun run lint             # Check code quality

# Database
bun run db:push          # Update database schema
bun run db:generate      # Generate Prisma client
bunx prisma studio       # Open database UI (http://localhost:5555)

# Production (nanti ketika mau deploy)
bun run build            # Build for production
bun run start            # Start production server
```

---

## 📚 Dokumentasi Lengkap

Untuk informasi lebih detail, baca:

- **SOURCE-CODE-GUIDE.md** - Panduan source code lengkap
- **PANDUAN-DEPLOYMENT.md** - Panduan deployment ke production
- **README.md** - Dokumentasi proyek

---

## 🐛 Masalah Umum

### Problem: "bun: command not found"

**Solution**: Install Bun terlebih dahulu
```bash
# Di Mac/Linux
curl -fsSL https://bun.sh/install | bash

# Di Windows: Download dari https://bun.sh
```

### Problem: "module not found"

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
bun install
```

### Problem: Database error

**Solution**: Reset database
```bash
rm db/dev.db
bunx prisma db push
```

### Problem: Port 3000 sudah dipakai

**Solution**: Gunakan port lain
```bash
# Edit package.json, ubah "dev" script:
"dev": "next dev -p 3001"

# Atau kill process di port 3000
lsof -i :3000
kill -9 <PID>
```

---

## ✅ Checklist Sebelum Mulai

Pastikan sudah:

- [x] Bun terinstall di sistem Anda
- [x] Source code sudah siap di folder ini
- [x] Dependencies terinstall (`bun install`)
- [x] Prisma client digenerate (`bunx prisma generate`)
- [x] Database sudah setup (`bunx prisma db push`)
- [x] Development server berjalan (`bun run dev`)

---

## 🎓 Tips Pertama Kali

1. **Explore Landing Page**
   - Buka http://localhost:3000
   - Lihat pricing plans
   - Coba registration form

2. **Access Super Admin Dashboard**
   - Klik "Dashboard" di menu
   - Lihat fitur restaurant management
   - Test subscription plan editing
   - Generate QR code

3. **Manage Menu**
   - Create restaurant baru
   - Add categories
   - Upload menu items
   - Test menu browsing

4. **Test Order Flow**
   - Register customer account
   - Browse restaurant
   - Add items ke cart
   - Place order

---

## 💾 Database Schema

Lihat dan edit schema di `prisma/schema.prisma`:

```prisma
model Restaurant {
  id       String @id @default(cuid())
  name     String
  // ... fields lainnya
}

model MenuItem {
  id       String @id @default(cuid())
  name     String
  price    Float
  // ... fields lainnya
}

// ... models lainnya
```

---

## 🔍 Debugging

### View Server Logs

```bash
# Server log ada di dev.log
tail -f dev.log
```

### Check Browser Console

- Buka Developer Tools (F12)
- Lihat Console tab untuk errors
- Network tab untuk API calls

### Use Prisma Studio

```bash
# Buka database GUI
bunx prisma studio

# Akses di http://localhost:5555
# Bisa view/edit data langsung
```

---

## 📖 Learn More

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

## 🆘 Butuh Bantuan?

1. Check **SOURCE-CODE-GUIDE.md** untuk panduan lengkap
2. Read **PANDUAN-DEPLOYMENT.md** untuk deployment guide
3. Search di dokumentasi teknologi di atas

---

**Siap untuk memulai?** Jalankan `bun run dev` dan buka http://localhost:3000 🚀
