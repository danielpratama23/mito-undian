# Microsite Undian MITO Jawa Timur 2026

Program undian berhadiah eksklusif untuk pelanggan MITO di Jawa Timur.  
Validasi IMEI via Odoo 18 XML-RPC · Kalkulasi token via Google Gemini AI · React 18 + Node.js + PostgreSQL.

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Query, React Hook Form |
| Backend | Node.js 20, Express, Zod, JWT, Multer |
| Database | PostgreSQL 16 (port 5433, terpisah dari Odoo) |
| ORM | Prisma 5 |
| AI Token | Google Gemini 1.5 Flash |
| IMEI Check | Odoo 18 XML-RPC (`stock.lot`) |
| Upload | Cloudinary atau AWS S3 |
| Deploy | Docker Compose + Nginx |

---

## Struktur Folder

```
mito-undian/
├── backend/
│   ├── src/
│   │   ├── app.js                    ← Entry point, semua routes
│   │   ├── controllers/
│   │   │   ├── registrasiController.js
│   │   │   ├── adminController.js
│   │   │   └── undianController.js   ← Weighted random draw
│   │   ├── services/
│   │   │   ├── odooService.js        ← XML-RPC ke Odoo 18
│   │   │   ├── geminiService.js      ← Gemini AI token calc
│   │   │   └── storageService.js     ← Cloudinary / S3
│   │   ├── middleware/
│   │   │   ├── auth.js               ← JWT requireAuth
│   │   │   └── errorHandler.js       ← Global error handler
│   │   └── seed.js                   ← Buat admin + sample data
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/001_init.sql
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   ← Routing lengkap
│   │   ├── api/client.js             ← Axios instances
│   │   ├── utils/index.js            ← formatRupiah, dll
│   │   ├── components/
│   │   │   ├── Layout.jsx            ← Publik (Navbar + Footer)
│   │   │   ├── AdminLayout.jsx       ← Admin sidebar
│   │   │   ├── AuthGuard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── TokenBadge.jsx
│   │   └── pages/
│   │       ├── Home.jsx              ← Hero + countdown + kalkulator token
│   │       ├── Hadiah.jsx
│   │       ├── CaraIkut.jsx
│   │       ├── Registrasi.jsx        ← Form + upload struk
│   │       ├── SyaratKetentuan.jsx
│   │       ├── FAQ.jsx
│   │       ├── Pemenang.jsx          ← + cek status registrasi
│   │       └── admin/
│   │           ├── Login.jsx
│   │           ├── Dashboard.jsx     ← Stats + progress bar + recent
│   │           ├── PesertaList.jsx   ← Filter, search, pagination
│   │           ├── PesertaDetail.jsx ← Approve/Reject + lightbox struk
│   │           ├── Undian.jsx        ← Jalankan weighted random draw
│   │           └── Pemenang.jsx      ← Toggle umumkan ke publik
│   ├── Dockerfile
│   ├── nginx.conf
│   └── tailwind.config.js
│
└── infra/
    └── docker-compose.yml
```

---

## Setup Lokal (Development)

### 1. Prasyarat

- Node.js 20+
- PostgreSQL 16 (port 5433, atau sesuaikan)
- Akun Cloudinary atau AWS S3
- Akun Google AI Studio (Gemini API Key)
- Odoo 18 yang sudah running dengan produk ber-serial-number tracking

### 2. Database

```bash
# Buat database PostgreSQL
createdb -h localhost -p 5433 -U postgres mito_undian
# atau via psql:
# CREATE USER mito_user WITH PASSWORD 'securepass123';
# CREATE DATABASE mito_undian OWNER mito_user;
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# → Edit .env: isi DATABASE_URL, GEMINI_API_KEY, ODOO_*, CLOUDINARY_*

npm install

# Generate Prisma client + migrate
npx prisma generate
npx prisma migrate dev --name init
# atau jika tidak mau tracking migration:
# npx prisma db push

# Seed: buat admin + sample data
npm run db:seed

npm run dev
# → http://localhost:3001
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Setup Production (Docker)

```bash
cd infra

# Buat .env untuk docker
echo "DB_PASSWORD=ganti_password_kuat" > .env

# Build dan start semua service
docker-compose up -d --build

# Lihat logs
docker-compose logs -f backend
```

Akses:
- Microsite publik: `http://your-server`
- Admin panel: `http://your-server/admin`

---

## Konfigurasi Odoo 18

Pastikan di Odoo 18:
1. Aktifkan **Tracking by Unique Serial Number** di pengaturan Inventory
2. Setiap produk MITO diset tracking = `By Unique Serial Number`
3. IMEI/serial number tersimpan di **Inventory → Products → Lots/Serial Numbers**
4. Buat API user Odoo dengan akses **read** ke model `stock.lot` dan `product.product`
5. Isi environment variable `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD`

---

## API Endpoints

### Public
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/program` | Info program |
| POST | `/api/registrasi` | Submit registrasi (multipart/form-data) |
| GET | `/api/registrasi/:id` | Cek status registrasi |
| GET | `/api/pemenang` | Daftar pemenang yang sudah diumumkan |

### Admin (Bearer JWT)
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/admin/login` | Login admin |
| GET | `/api/admin/dashboard` | Statistik ringkasan |
| GET | `/api/admin/peserta` | List peserta (filter: `?status=PENDING&q=nama&page=1`) |
| GET | `/api/admin/peserta/:id` | Detail peserta + token logs |
| PUT | `/api/admin/peserta/:id/verifikasi` | `{ action: "APPROVE"\|"REJECT", alasanReject? }` |
| POST | `/api/admin/undian` | Jalankan undian `{ hadiah, jumlahPemenang }` (superadmin) |
| GET | `/api/admin/pemenang` | Daftar semua pemenang |
| PUT | `/api/admin/pemenang/:id/umumkan` | Toggle tampil di publik (superadmin) |

---

## Flow Sistem

```
[1] Konsumen beli produk MITO
      ↓
[2] Buka microsite → isi form registrasi + upload struk
      ↓
[3] Backend:
    ├─ Validasi format (Zod)
    ├─ Cek duplikat NIK & IMEI (PostgreSQL)
    ├─ Validasi IMEI ke Odoo 18 (XML-RPC → stock.lot)
    ├─ Upload struk → Cloudinary/S3
    └─ Simpan ke DB (status: PENDING)
      ↓
[4] Admin login → panel verifikasi
    ├─ Lihat struk, cek data
    ├─ APPROVE → trigger Gemini AI
    │     └─ Gemini hitung token = floor(nominal / 500.000)
    │     └─ Simpan token ke DB + catat token_log
    └─ REJECT → simpan alasan
      ↓
[5] Tanggal undian:
    Admin → Jalankan Undian (superadmin only)
    └─ Weighted random: peluang ∝ jumlah token
    └─ Simpan pemenang ke DB
    └─ Toggle "umumkan" → tampil di halaman publik
```

---

## Akun Default (setelah seed)

| Username | Password | Role |
|---|---|---|
| superadmin | Admin@2026! | superadmin |
| verifikator1 | Verif@2026! | verifikator |

⚠️ **Ganti password setelah pertama kali login!**

---

## Halaman Microsite

| URL | Halaman |
|---|---|
| `/` | Home — hero, countdown, kalkulator token |
| `/hadiah` | Daftar hadiah |
| `/cara-ikut` | Step-by-step panduan |
| `/registrasi` | Form pendaftaran |
| `/syarat-ketentuan` | S&K lengkap |
| `/faq` | FAQ dengan accordion |
| `/pemenang` | Daftar pemenang + cek status registrasi |
| `/admin` | Dashboard admin |
| `/admin/peserta` | List & filter peserta |
| `/admin/peserta/:id` | Detail + verifikasi + lightbox struk |
| `/admin/undian` | Jalankan undian berbobot |
| `/admin/pemenang` | Manajemen pengumuman pemenang |
