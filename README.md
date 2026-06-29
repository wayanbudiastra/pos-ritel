# POS Ritel

Sistem Point of Sale untuk toko ritel — Next.js (App Router) + TypeScript + Prisma 5 + PostgreSQL (Neon) + NextAuth v5.

Dibangun sesuai [PRD Sistem Setup](prd/sistem_setup.md), mencakup Fase 1-4:

- **Fase 1** — Autentikasi & RBAC (Owner/Admin/Kasir/Gudang), master data Kategori/Produk/Supplier.
- **Fase 2** — Member & harga khusus, POS (penjualan ritel/grosir/khusus dengan scan barcode), sesi kasir, retur.
- **Fase 3** — Purchase Order, GRN (partial receipt + moving average HPP), inventory, stok opname.
- **Fase 4** — Dashboard analitik, laporan (penjualan/margin/stok/pembelian) + export Excel, agregasi harian via cron.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env   # isi DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Akun demo: `admin@demo.test` / `password123` (lihat `prisma/seed.ts` untuk role lain).

## Deploy

Project ini sudah terhubung ke Vercel — setiap push ke branch `master` otomatis trigger deployment baru ke production.

Migration database **tidak** otomatis dijalankan saat build (untuk menghindari race condition antar deployment). Setelah menambah migration baru, jalankan manual:

```bash
npm run db:deploy
```

Environment variables yang dibutuhkan di Vercel Project Settings: lihat [`.env.example`](.env.example).
