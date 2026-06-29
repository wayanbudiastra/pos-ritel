# PRODUCT REQUIREMENTS DOCUMENT
# Sistem POS Retail — Setup Awal & Modul Inti

**Versi:** 1.0
**Tanggal:** 28 Juni 2026
**Status:** Draft untuk Review

**Tech Stack:** Next.js 14+ (App Router), TypeScript, PostgreSQL, Prisma 5, Tailwind CSS, Node.js v22, Vercel

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Arsitektur & Tech Stack](#2-arsitektur--tech-stack)
3. [Role & Hak Akses (RBAC)](#3-role--hak-akses-rbac)
4. [User Stories Utama](#4-user-stories-utama)
5. [Functional Requirements](#5-functional-requirements)
   - [5.1 Modul Penjualan (POS)](#51-modul-penjualan-pos--harga-ritel--grosir)
   - [5.2 Modul Member](#52-modul-member--harga-khusus-per-customer)
   - [5.3 Modul Pembelian (PO)](#53-modul-pembelian--purchase-order-po)
   - [5.4 Modul GRN](#54-modul-grn--goods-receipt-note-penerimaan-barang)
   - [5.5 Modul Inventory](#55-modul-inventory--manajemen-stok)
   - [5.6 Modul Laporan](#56-modul-laporan--data-analitik-tingkat-lanjut)
6. [Skema Database (Prisma Schema)](#6-skema-database-prisma-schema)
7. [Struktur Folder Proyek](#7-struktur-folder-proyek-nextjs-app-router)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Roadmap Pengembangan](#9-roadmap-pengembangan-fase-setup-awal)
10. [Pertanyaan Terbuka & Asumsi](#10-pertanyaan-terbuka--asumsi)

---

## 1. Executive Summary

### 1.1 Latar Belakang

Dokumen ini mendefinisikan kebutuhan fungsional dan teknis untuk pembangunan tahap awal (setup awal) Sistem Point of Sale (POS) bagi toko ritel. Sistem ini dirancang untuk menangani operasional harian toko mulai dari penjualan ke pelanggan ritel maupun grosir, proses pembelian barang dari supplier, penerimaan barang (GRN), pengelolaan member dengan harga khusus, hingga manajemen stok dan pelaporan analitik.

Modul akuntansi/jurnal (pembukuan double-entry) secara sengaja dipisahkan ke dalam PRD tersendiri agar dokumen ini tetap fokus pada operasional inti POS. Namun, skema database dan arsitektur event pada PRD ini sudah dirancang agar siap diintegrasikan dengan modul akuntansi tersebut di kemudian hari (lihat bagian 2.5 Integration Hooks).

### 1.2 Tujuan

- **Efisiensi transaksi:** Mempercepat proses transaksi kasir dengan dukungan dua tingkat harga (ritel & grosir) secara otomatis.
- **Kontrol stok akurat:** Memastikan data stok real-time dan dapat ditelusuri (traceable) melalui kartu stok.
- **Loyalitas pelanggan:** Mendukung program member dengan harga khusus per pelanggan untuk mendorong repeat order.
- **Pengadaan terstruktur:** Mengelola siklus pembelian dari Purchase Order (PO) hingga penerimaan barang (GRN) dengan jejak audit yang jelas.
- **Pengambilan keputusan berbasis data:** Menyediakan laporan dan analitik tingkat lanjut untuk mendukung keputusan bisnis (produk terlaris, tren penjualan, margin, dsb).
- **Siap berkembang:** Arsitektur modular yang memudahkan penambahan modul akuntansi dan ekspansi multi-outlet di masa depan.

### 1.3 Ruang Lingkup (Scope)

#### Termasuk dalam Setup Awal (In-Scope)

- Autentikasi & otorisasi berbasis peran (RBAC): Admin, Owner/Viewer, Kasir, Gudang
- Master data: Produk, Kategori, Satuan, Supplier, Member/Pelanggan
- Modul Penjualan (POS) dengan dua jenis harga: Ritel dan Grosir
- Modul Member dengan harga khusus per-customer (individual)
- Modul Pembelian: Purchase Order (PO) ke supplier
- Modul Goods Receipt Note (GRN): penerimaan barang dari PO, termasuk penerimaan partial
- Modul Inventory: manajemen stok, kartu stok, stok minimum, stok opname
- Modul Laporan: dashboard analitik penjualan, stok, dan pembelian
- Integration hooks (event/trigger point) untuk modul akuntansi terpisah

#### Tidak Termasuk (Out-of-Scope) pada PRD ini

- Modul Jurnal/Akuntansi (double-entry bookkeeping) — akan dibuat sebagai PRD terpisah
- Multi-outlet / multi-cabang (sistem ini didesain single outlet)
- Integrasi pembayaran online/payment gateway (QRIS dinamis, dsb) — dapat menjadi fase lanjutan
- Aplikasi mobile native (POS berbasis web responsif, dapat diakses dari tablet/PC)
- E-commerce / penjualan online ke marketplace

### 1.4 Target Pengguna

- **Owner:** Pemilik toko, membutuhkan visibilitas penuh terhadap performa bisnis tanpa harus terlibat operasional harian.
- **Admin:** Mengelola master data, konfigurasi sistem, approval transaksi tertentu (PO, GRN, harga khusus).
- **Kasir:** Mengoperasikan transaksi penjualan harian di counter.
- **Gudang:** Mengelola stok fisik, menerima barang (GRN), melakukan stok opname.

---

## 2. Arsitektur & Tech Stack

### 2.1 Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Server Components + Client Components, API Routes/Route Handlers |
| Bahasa | TypeScript | Type-safety end-to-end (FE, BE, schema) |
| Database | PostgreSQL 15+ | Relational, mendukung transaksi ACID untuk operasi stok |
| ORM | Prisma 5 | Schema-first, migration, type-safe query |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui + Radix UI | Komponen accessible, dapat dikustomisasi |
| Validasi | Zod | Validasi schema di client & server |
| Form Handling | React Hook Form | Form state management performant |
| Auth | NextAuth.js v5 (Auth.js) | Session-based, credential provider untuk RBAC internal |
| State/Data Fetching | TanStack Query (React Query) | Caching & sinkronisasi data client-side |
| Runtime | Node.js v22 | LTS, native fetch, performa V8 terbaru |
| Hosting | Vercel | Serverless deployment, edge network |
| Database Hosting | Neon / Supabase (Postgres-as-a-Service) | Direkomendasikan untuk kompatibilitas serverless + Prisma |
| Package Manager | npm (bundled dgn Node 22) | Lockfile npm v10+ |

### 2.2 Pertimbangan Versi Penting

- **Prisma 5:** Versi ini stabil untuk produksi. Pastikan menggunakan driver adapter (`@prisma/adapter-pg` atau `driverAdapters` preview feature) apabila database hosting menggunakan connection pooling serverless (Neon/Supabase), agar koneksi tidak exhausted di lingkungan serverless Vercel.
- **Node.js v22:** Pastikan konfigurasi `engines` pada package.json mengarah ke `>=22` dan environment Vercel (Project Settings > Node.js Version) diset ke versi yang sesuai.
- **Connection Pooling:** Gunakan dua connection string terpisah pada Prisma schema: `DATABASE_URL` (pooled, untuk runtime query) dan `DIRECT_URL` (direct, untuk migration).

### 2.3 Diagram Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│   Next.js App Router (React Server + Client Components)     │
│   - Halaman POS (Kasir)   - Dashboard Laporan                │
│   - Halaman Admin/Master  - Halaman Gudang/Inventory         │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼───────────────────────────────────┐
│                  NEXT.JS SERVER (Vercel Serverless)            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Route        │  │ Server        │  │ Middleware          │   │
│  │ Handlers/API │  │ Actions        │  │ (Auth RBAC Guard)    │   │
│  └─────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │     Service Layer (Business Logic per Modul)         │    │
│  │  SalesService | PurchaseService | InventoryService   │    │
│  │  MemberService | ReportService                       │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Prisma Client (ORM Layer)                │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────────┘
                            │ Pooled Connection
┌───────────────────────────▼───────────────────────────────────┐
│              PostgreSQL Database (Neon/Supabase)                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Pola Desain Utama

- **Service Layer Pattern:** Logika bisnis (kalkulasi harga, validasi stok, dsb) ditempatkan pada service layer, terpisah dari Route Handler/Server Action, agar mudah diuji dan dipakai ulang.
- **Transactional Integrity:** Setiap operasi yang menyentuh lebih dari satu tabel terkait stok/keuangan (transaksi penjualan, konfirmasi GRN, stok opname) WAJIB dibungkus dalam Prisma `$transaction` untuk menjaga konsistensi data.
- **Optimistic UI + Server Validation:** Form input menggunakan validasi client-side (Zod + React Hook Form) untuk UX responsif, namun validasi akhir tetap dilakukan di server sebagai source of truth.
- **Audit Trail:** Setiap transaksi penting (penjualan, PO, GRN, stok opname, perubahan harga khusus) mencatat `createdBy`, `createdAt`, dan riwayat status.

### 2.5 Integration Hooks (untuk Modul Akuntansi Terpisah)

Agar modul Jurnal/Akuntansi dapat dibangun secara independen di PRD lain tanpa mengubah skema inti, sistem ini menyediakan event point berikut yang dapat di-subscribe atau di-trigger:

| Event | Trigger Saat | Data yang Dibutuhkan Modul Akuntansi |
|---|---|---|
| `SALE_COMPLETED` | Transaksi penjualan berhasil dibayar (status PAID) | Total, metode bayar, HPP barang terjual, customerId |
| `PURCHASE_RECEIVED` | GRN dikonfirmasi (barang diterima & stok bertambah) | Total biaya barang, supplierId, status hutang (jika kredit) |
| `STOCK_ADJUSTED` | Penyesuaian stok manual atau hasil stok opname | Selisih qty, nilai HPP, alasan penyesuaian |
| `PURCHASE_PAID` | Pembayaran ke supplier dilakukan | Jumlah dibayar, metode, sisa hutang |

Implementasi: setiap event di atas dicatat pada tabel `EventLog` (lihat 6.2) berisi payload JSON, sehingga modul akuntansi dapat membaca log ini secara asynchronous (polling atau listener) tanpa modul POS perlu mengetahui detail proses akuntansi.

---

## 3. Role & Hak Akses (RBAC)

### 3.1 Definisi Role

- **OWNER:** Akses penuh ke seluruh data termasuk laporan finansial & analitik, namun bersifat read-mostly (tidak melakukan input operasional harian). Dapat melihat semua modul.
- **ADMIN:** Mengelola master data (produk, supplier, member), approve PO, approve harga khusus member, mengatur konfigurasi sistem & user.
- **KASIR:** Akses terbatas pada modul Penjualan (POS) dan melihat stok (read-only) untuk keperluan transaksi.
- **GUDANG:** Akses pada modul Inventory, Pembelian (input PO), dan GRN. Tidak memiliki akses ke modul Penjualan atau Laporan finansial.

### 3.2 Matriks Hak Akses per Modul

| Modul | Owner | Admin | Kasir | Gudang |
|---|---|---|---|---|
| Dashboard & Laporan Analitik | View | View | - | View (stok only) |
| Penjualan (POS) | View | Full | Full (transaksi) | - |
| Master Produk & Kategori | View | Full | View | View |
| Member & Harga Khusus | View | Full (incl. approve) | View, tambah member baru | - |
| Pembelian (PO) | View | Full (approve) | - | Full (create, submit) |
| GRN (Penerimaan Barang) | View | View, approve diskrepansi | - | Full |
| Inventory & Stok Opname | View | Full | View (read-only) | Full |
| Manajemen User & Role | - | Full | - | - |
| Konfigurasi Sistem | View | Full | - | - |

Keterangan: "Full" mencakup create, read, update, dan delete/void sesuai konteks modul. "View" adalah akses baca saja. Tanda "-" berarti modul tidak terlihat/tidak dapat diakses sama sekali pada navigasi.

### 3.3 Implementasi Teknis RBAC

- Role disimpan sebagai enum pada tabel User (`OWNER`, `ADMIN`, `KASIR`, `GUDANG`).
- Middleware Next.js (`middleware.ts`) memeriksa session & role sebelum mengizinkan akses ke route group tertentu, contoh: `/dashboard/laporan/*` hanya untuk OWNER & ADMIN.
- Setiap Server Action/Route Handler melakukan validasi ulang role di sisi server (defense-in-depth), tidak hanya mengandalkan hidden/disabled UI.
- Struktur folder route menggunakan Route Groups untuk memisahkan akses, contoh: `app/(kasir)/pos`, `app/(gudang)/inventory`, `app/(admin)/master-data`.

---

## 4. User Stories Utama

### US-01: Melakukan transaksi penjualan dengan harga ritel atau grosir secara otomatis

**Sebagai:** Kasir

**Kriteria Penerimaan:**
- Sistem menampilkan harga ritel secara default saat produk ditambahkan ke keranjang
- Kasir dapat beralih tipe transaksi ke "Grosir" sehingga harga seluruh item di keranjang menyesuaikan ke harga grosir
- Jika qty item mencapai ambang batas grosir (minimum qty grosir per produk), sistem otomatis menyarankan/menerapkan harga grosir
- Stok berkurang otomatis setelah pembayaran berhasil dikonfirmasi

### US-02: Menerapkan harga khusus untuk member tertentu saat transaksi

**Sebagai:** Kasir

**Kriteria Penerimaan:**
- Kasir dapat mencari & memilih member berdasarkan nomor HP/kode member
- Jika member memiliki harga khusus untuk produk tertentu, harga tersebut otomatis diterapkan menggantikan harga ritel/grosir
- Produk yang tidak memiliki harga khusus tetap menggunakan harga ritel/grosir standar
- Riwayat transaksi tersimpan terhubung dengan customerId member tersebut

### US-03: Mengatur harga khusus per produk untuk member individual

**Sebagai:** Admin

**Kriteria Penerimaan:**
- Admin dapat memilih satu member dan menentukan daftar produk dengan harga khusus (override harga ritel default)
- Sistem memvalidasi agar harga khusus tidak di bawah HPP (harga pokok) tanpa konfirmasi/peringatan eksplisit
- Harga khusus dapat memiliki periode berlaku (opsional: tanggal mulai & berakhir)
- Histori perubahan harga khusus tercatat (siapa mengubah, kapan, nilai lama & baru)

### US-04: Membuat Purchase Order (PO) ke supplier

**Sebagai:** Gudang

**Kriteria Penerimaan:**
- Gudang dapat memilih supplier dan menambahkan produk beserta qty & harga beli yang disepakati
- PO memiliki status: Draft → Diajukan → Disetujui → Sebagian Diterima → Selesai → Dibatalkan
- PO dengan nilai di atas ambang batas tertentu (dikonfigurasi) memerlukan approval Admin sebelum dikirim ke supplier
- PO dapat dicetak/diexport sebagai dokumen PDF untuk dikirim ke supplier

### US-05: Mencatat penerimaan barang (GRN) terhadap PO, termasuk penerimaan sebagian (partial)

**Sebagai:** Gudang

**Kriteria Penerimaan:**
- GRN dibuat dengan mereferensikan satu PO yang berstatus Disetujui atau Sebagian Diterima
- Gudang dapat menerima sebagian qty dari yang dipesan; sisa qty tetap terbuka untuk GRN berikutnya
- Sistem mendeteksi & menampilkan peringatan jika qty/harga diterima berbeda dari PO (diskrepansi)
- Setelah GRN dikonfirmasi, stok produk bertambah otomatis dan kartu stok mencatat pergerakan masuk

### US-06: Melakukan stok opname (perhitungan fisik) dan penyesuaian stok

**Sebagai:** Gudang

**Kriteria Penerimaan:**
- Gudang dapat membuat sesi stok opname untuk seluruh produk atau kategori tertentu
- Sistem menampilkan stok sistem (saat ini) berdampingan dengan input stok fisik hasil hitung
- Selisih (variance) dihitung otomatis dan memerlukan alasan (reason code) sebelum disimpan
- Setelah disetujui, stok sistem disesuaikan dan tercatat di kartu stok sebagai "Penyesuaian Stok Opname"

### US-07: Melihat dashboard analitik performa toko

**Sebagai:** Owner

**Kriteria Penerimaan:**
- Owner dapat melihat ringkasan penjualan harian/mingguan/bulanan beserta tren grafik
- Owner dapat melihat produk terlaris (top-selling) dan produk slow-moving
- Owner dapat melihat estimasi margin kotor per kategori produk
- Dashboard dapat difilter berdasarkan rentang tanggal custom

### US-08: Mengelola master data produk termasuk dua tingkat harga

**Sebagai:** Admin

**Kriteria Penerimaan:**
- Admin dapat menambah/mengubah produk dengan field harga beli (HPP awal), harga ritel, dan harga grosir
- Admin dapat mengatur minimum qty untuk berlakunya harga grosir per produk
- Admin dapat mengatur stok minimum (reorder point) per produk untuk keperluan notifikasi stok rendah
- Produk dapat dinonaktifkan (soft-delete) tanpa menghapus histori transaksi terkait

---

## 5. Functional Requirements

### 5.1 Modul Penjualan (POS) — Harga Ritel & Grosir

#### 5.1.1 Deskripsi

Modul ini menangani transaksi penjualan di counter kasir. Sistem mendukung dua tingkat harga (Ritel dan Grosir) yang dapat dipilih per transaksi, serta penerapan harga khusus member yang menggantikan kedua harga tersebut apabila berlaku.

#### 5.1.2 Logika Penentuan Harga (Price Resolution)

Saat sebuah produk ditambahkan ke keranjang, sistem menentukan harga final dengan urutan prioritas berikut:

1. Cek apakah transaksi terhubung dengan Member tertentu DAN produk tersebut memiliki Harga Khusus aktif untuk member itu → jika ya, gunakan Harga Khusus (prioritas tertinggi).
2. Jika tidak ada harga khusus, cek tipe transaksi yang dipilih kasir: "Ritel" atau "Grosir".
3. Jika tipe "Grosir" dipilih DAN qty item ≥ minimum qty grosir produk tersebut → gunakan Harga Grosir.
4. Jika tidak memenuhi kondisi grosir → gunakan Harga Ritel (default).

Catatan: penentuan harga dilakukan per-item, bukan per-transaksi keseluruhan, sehingga dalam satu transaksi yang sama dapat tercampur item dengan harga ritel, grosir, dan harga khusus member secara bersamaan.

#### 5.1.3 Alur Transaksi (Happy Path)

1. Kasir membuka sesi kasir (input modal awal kas) di awal shift.
2. Kasir memilih tipe transaksi: Ritel (default) atau Grosir.
3. (Opsional) Kasir mencari & memilih Member berdasarkan nomor HP, kode member, atau nama.
4. Kasir menambahkan produk ke keranjang via scan barcode atau pencarian nama.
5. Sistem menghitung harga final per item sesuai logika 5.1.2 dan menampilkan subtotal.
6. Kasir dapat mengubah qty atau menghapus item dari keranjang.
7. Sistem menghitung Total, diskon (jika ada), dan Pajak (jika dikonfigurasi).
8. Kasir memilih metode pembayaran: Tunai, Transfer Bank, QRIS (manual/statis), Kartu Debit/Kredit.
9. Kasir menginput jumlah dibayar; sistem menghitung kembalian (untuk metode tunai).
10. Kasir konfirmasi pembayaran → status transaksi menjadi PAID.
11. Sistem otomatis: (a) mengurangi stok produk, (b) mencatat kartu stok keluar, (c) mencatat event SALE_COMPLETED, (d) mencetak/menampilkan struk.
12. Kasir menutup sesi kasir di akhir shift dengan rekonsiliasi kas fisik vs kas sistem.

#### 5.1.4 Fitur Detail

- **Pencarian Produk:** via scan barcode (auto-focus input) atau pencarian nama (minimum 2 karakter, debounced search).
- **Keranjang Belanja:** dapat mengubah qty langsung dari list, menghapus item, menambahkan catatan per item (opsional).
- **Diskon:** mendukung diskon per item (persentase atau nominal) dan diskon total transaksi, dengan batas maksimum yang dapat dikonfigurasi per role (misal Kasir maksimum 10%, Admin tanpa batas).
- **Retur Penjualan:** Admin/Kasir (dengan approval) dapat membuat retur sebagian/seluruh item dari transaksi yang sudah PAID, dengan stok otomatis kembali dan opsi refund tunai atau tukar barang.
- **Void Transaksi:** transaksi yang belum dibayar (status DRAFT) dapat dibatalkan langsung; transaksi PAID hanya bisa dibatalkan via proses retur dengan approval Admin.
- **Cetak Struk:** menggunakan format thermal printer 58mm/80mm (melalui browser print API) sebagai default; opsi kirim struk digital (email/WA) dapat menjadi fase lanjutan.
- **Sesi Kasir (Cash Session):** setiap kasir wajib membuka sesi dengan input modal awal sebelum dapat melakukan transaksi, dan menutup sesi di akhir shift dengan rekap kas masuk per metode pembayaran.

#### 5.1.5 Validasi & Aturan Bisnis

- Qty yang dijual tidak boleh melebihi stok tersedia, kecuali fitur "izinkan stok negatif" diaktifkan secara eksplisit di konfigurasi sistem (untuk kondisi tertentu seperti pre-order).
- Transaksi dengan status DRAFT yang tidak diselesaikan dalam durasi tertentu (dikonfigurasi, default 60 menit) ditandai sebagai EXPIRED dan stok yang sempat di-hold (jika ada mekanisme hold) dilepas kembali.
- Perubahan harga produk di master data TIDAK memengaruhi transaksi yang sudah selesai (harga di-snapshot pada saat transaksi dibuat).

---

### 5.2 Modul Member — Harga Khusus Per-Customer

#### 5.2.1 Deskripsi

Modul ini mengelola data pelanggan terdaftar (member) dan memungkinkan pemberian harga khusus yang sifatnya individual per pelanggan (bukan berbasis tier/level keanggotaan). Setiap member dapat memiliki daftar harga khusus yang berbeda-beda untuk produk yang berbeda-beda, sesuai negosiasi atau kesepakatan masing-masing.

#### 5.2.2 Pendaftaran Member

- Data wajib: Nama, Nomor HP (unik, dipakai sebagai identifier pencarian utama).
- Data opsional: Alamat, Email, Tanggal Lahir, Catatan internal.
- Sistem otomatis generate Kode Member unik (format: MBR-000001, incremental) saat pendaftaran.
- Member dapat didaftarkan langsung oleh Kasir saat transaksi ("daftar cepat": nama + no. HP) atau melalui form lengkap oleh Admin.
- Member dapat dinonaktifkan (soft-delete) tanpa menghapus histori transaksinya.

#### 5.2.3 Harga Khusus Per-Customer

Setiap baris Harga Khusus terhubung ke satu Member dan satu Produk, dengan struktur berikut:

| Field | Tipe | Keterangan |
|---|---|---|
| memberId | Relasi | Member yang menerima harga khusus ini |
| productId | Relasi | Produk yang harganya di-override |
| hargaKhusus | Decimal | Harga final untuk kombinasi member + produk ini |
| tanggalMulai | Date (opsional) | Jika diisi, harga khusus baru berlaku mulai tanggal ini |
| tanggalBerakhir | Date (opsional) | Jika diisi, harga khusus berhenti berlaku setelah tanggal ini |
| status | Enum | AKTIF / NONAKTIF — memungkinkan menangguhkan tanpa menghapus data |
| catatan | Text (opsional) | Alasan/konteks pemberian harga khusus (untuk referensi internal) |

#### 5.2.4 Alur Pengaturan Harga Khusus

1. Admin membuka halaman detail Member, lalu memilih tab "Harga Khusus".
2. Admin mencari & memilih produk yang ingin diberikan harga khusus.
3. Admin menginput nilai harga khusus. Sistem menampilkan perbandingan dengan Harga Ritel, Harga Grosir, dan HPP produk tersebut sebagai referensi.
4. Jika harga khusus berada di bawah HPP, sistem menampilkan peringatan (warning, bukan blocking) yang meminta konfirmasi eksplisit dari Admin.
5. Harga khusus tersimpan dan langsung aktif (atau terjadwal sesuai tanggalMulai jika diisi).
6. Setiap penyimpanan/perubahan dicatat di tabel histori (`HargaKhususLog`) untuk audit trail.

#### 5.2.5 Validasi & Aturan Bisnis

- Kombinasi (memberId + productId) bersifat unik untuk status AKTIF — tidak boleh ada dua harga khusus aktif untuk produk yang sama pada member yang sama secara bersamaan.
- Saat transaksi POS, sistem mencari harga khusus AKTIF dengan tanggal berjalan berada di antara tanggalMulai dan tanggalBerakhir (jika diisi); jika tidak ditemukan, fallback ke harga ritel/grosir standar.
- Hanya role Admin (dan Owner sebagai view-only) yang dapat membuat/mengubah harga khusus; Kasir hanya dapat melihat & menerapkannya saat transaksi, tidak dapat mengubah nilainya.
- Daftar harga khusus per member ditampilkan dalam bentuk tabel yang dapat di-export (untuk keperluan review berkala oleh Owner/Admin).

#### 5.2.6 Riwayat Transaksi Member

- Setiap member memiliki halaman riwayat transaksi: total belanja, frekuensi, rata-rata nilai transaksi, dan produk yang paling sering dibeli.
- Data ini menjadi dasar pertimbangan Admin/Owner dalam menentukan/meninjau ulang harga khusus untuk member tersebut.

---

### 5.3 Modul Pembelian — Purchase Order (PO)

#### 5.3.1 Deskripsi

Modul ini menangani proses pemesanan barang ke supplier sebelum barang secara fisik diterima. PO menjadi dokumen acuan untuk proses GRN selanjutnya.

#### 5.3.2 Status PO (State Machine)

```
DRAFT → DIAJUKAN → DISETUJUI → SEBAGIAN_DITERIMA → SELESAI
  │                                              │
  └────────────────> DIBATALKAN <────────────────┘
```

| Status | Keterangan |
|---|---|
| DRAFT | PO masih dapat diedit bebas oleh Gudang, belum dikirim ke supplier |
| DIAJUKAN | PO diajukan untuk approval (jika di atas ambang nilai tertentu) |
| DISETUJUI | PO disetujui Admin, siap dikirim/dicetak untuk supplier, menunggu barang datang |
| SEBAGIAN_DITERIMA | Sebagian item PO sudah di-GRN, sisanya masih ditunggu |
| SELESAI | Seluruh item PO telah diterima sepenuhnya (via satu atau beberapa GRN) |
| DIBATALKAN | PO dibatalkan; tidak dapat diproses lebih lanjut |

#### 5.3.3 Alur Pembuatan PO

1. Gudang membuat PO baru, memilih Supplier dari master data.
2. Gudang menambahkan produk dengan qty pesan & harga beli (dapat mengacu pada harga beli terakhir dari produk tersebut sebagai default, dapat diubah).
3. Sistem menghitung Total Nilai PO secara otomatis.
4. Jika Total Nilai PO ≥ ambang batas approval (dikonfigurasi di pengaturan sistem), status otomatis menjadi DIAJUKAN dan PO masuk ke daftar approval Admin.
5. Jika di bawah ambang batas, PO dapat langsung diset ke DISETUJUI oleh Gudang tanpa approval tambahan (dapat dikonfigurasi sesuai kebijakan toko).
6. Admin meninjau & menyetujui (atau menolak dengan catatan) PO yang berstatus DIAJUKAN.
7. PO yang DISETUJUI dapat dicetak/diexport ke PDF untuk dikirim ke supplier.

#### 5.3.4 Fitur Detail

- **Referensi Harga:** saat menambahkan produk ke PO, sistem menampilkan harga beli 3 transaksi pembelian terakhir produk tersebut sebagai referensi negosiasi.
- **Multi-item:** satu PO dapat berisi banyak produk dari satu supplier yang sama.
- **Edit Terbatas:** setelah status DISETUJUI, item PO (qty/harga) tidak dapat diubah lagi — perubahan kebutuhan harus melalui PO baru atau pembatalan & pembuatan ulang.
- **Pembatalan:** PO yang belum memiliki GRN sama sekali dapat dibatalkan langsung oleh Admin; PO yang sudah SEBAGIAN_DITERIMA hanya dapat ditutup (sisa qty dianggap tidak akan diterima lagi).

---

### 5.4 Modul GRN — Goods Receipt Note (Penerimaan Barang)

#### 5.4.1 Deskripsi

GRN mencatat penerimaan fisik barang dari supplier berdasarkan PO yang sudah disetujui. Modul ini mendukung penerimaan sebagian (partial receipt) — satu PO dapat memiliki lebih dari satu GRN apabila barang dikirim bertahap oleh supplier.

#### 5.4.2 Alur Penerimaan Barang

1. Gudang memilih PO berstatus DISETUJUI atau SEBAGIAN_DITERIMA untuk dibuatkan GRN baru.
2. Sistem menampilkan daftar item PO beserta qty yang masih outstanding (belum diterima).
3. Gudang menginput qty fisik yang benar-benar diterima per item (dapat sama dengan, kurang dari, namun tidak boleh melebihi qty outstanding).
4. Gudang menginput nomor batch/lot dan tanggal expired (jika produk termasuk kategori yang melacak expiry).
5. Jika ada perbedaan harga aktual saat barang diterima vs harga di PO, sistem menampilkan flag diskrepansi dan mencatat harga aktual sebagai nilai final untuk update HPP.
6. Gudang submit GRN → sistem melakukan, dalam satu transaksi database: (a) menambah stok produk sesuai qty diterima, (b) mencatat kartu stok masuk, (c) update status PO (SEBAGIAN_DITERIMA atau SELESAI jika seluruh item sudah lengkap), (d) mencatat event PURCHASE_RECEIVED, (e) update HPP produk menggunakan metode rata-rata bergerak (moving average).
7. GRN dapat dicetak sebagai dokumen bukti penerimaan barang.

#### 5.4.3 Penanganan Diskrepansi

| Jenis Diskrepansi | Penanganan Sistem |
|---|---|
| Qty diterima < qty PO | Diizinkan; sisa qty tetap outstanding untuk GRN berikutnya (status PO → SEBAGIAN_DITERIMA) |
| Qty diterima > qty PO | Tidak diizinkan secara default; memerlukan toggle "terima kelebihan" dengan approval Admin |
| Harga aktual ≠ harga PO | Diizinkan, namun ditandai sebagai flag untuk ditinjau Admin; harga aktual yang digunakan untuk update HPP |
| Barang rusak/cacat saat terima | Dicatat qty terpisah sebagai "ditolak/rusak", tidak menambah stok, dengan catatan wajib |

#### 5.4.4 Kalkulasi HPP (Harga Pokok Penjualan)

HPP per produk dihitung menggunakan metode Moving Average (rata-rata bergerak), diperbarui setiap kali ada GRN baru, dengan formula:

```
HPP Baru = ((Stok Lama × HPP Lama) + (Qty Diterima × Harga Beli Aktual)) / (Stok Lama + Qty Diterima)
```

HPP ini digunakan sebagai referensi pada Modul Member (5.2.4) untuk memvalidasi harga khusus, dan menjadi data dasar bagi modul akuntansi terpisah untuk menghitung COGS (Cost of Goods Sold).

---

### 5.5 Modul Inventory — Manajemen Stok

#### 5.5.1 Deskripsi

Modul ini menjadi pusat kebenaran (source of truth) untuk seluruh pergerakan stok produk, baik yang berasal dari penjualan, penerimaan barang, maupun penyesuaian manual.

#### 5.5.2 Kartu Stok (Stock Card)

Setiap pergerakan stok — apa pun sumbernya — WAJIB tercatat di tabel `KartuStok` sehingga stok akhir produk pada tabel master selalu dapat ditelusuri/diverifikasi dari akumulasi kartu stok.

| Jenis Pergerakan | Arah | Sumber |
|---|---|---|
| Penjualan (Sale) | Keluar (-) | Transaksi POS berstatus PAID |
| Retur Penjualan | Masuk (+) | Retur dari pelanggan |
| Penerimaan Barang (GRN) | Masuk (+) | Konfirmasi GRN |
| Retur Pembelian | Keluar (-) | Barang dikembalikan ke supplier |
| Penyesuaian Stok Opname | Masuk (+) / Keluar (-) | Hasil stok opname yang disetujui |
| Penyesuaian Manual | Masuk (+) / Keluar (-) | Input manual Admin/Gudang dengan alasan wajib |

Setiap baris kartu stok mencatat: produk, tanggal/waktu, jenis pergerakan, qty, stok sebelum, stok sesudah, referensi dokumen sumber (no. transaksi/PO/GRN), dan user yang melakukan.

#### 5.5.3 Stok Minimum & Notifikasi

- Setiap produk memiliki field `stokMinimum` (reorder point) yang dapat dikonfigurasi oleh Admin.
- Dashboard menampilkan daftar produk dengan stok ≤ stokMinimum sebagai "Perlu Reorder", terurut berdasarkan tingkat urgensi (stok tersisa relatif terhadap minimum).
- Notifikasi in-app (badge/counter) muncul untuk Admin & Gudang ketika ada produk yang mencapai stok minimum.

#### 5.5.4 Stok Opname (Physical Count)

1. Gudang membuat sesi Stok Opname baru, memilih lingkup: seluruh produk atau kategori tertentu.
2. Sistem men-generate daftar produk dalam lingkup tersebut beserta stok sistem saat sesi dibuat (snapshot).
3. Gudang menginput stok fisik hasil hitung untuk setiap produk.
4. Sistem menghitung selisih (stok fisik − stok sistem) secara otomatis per item.
5. Item dengan selisih ≠ 0 memerlukan alasan (reason code: hilang, rusak, salah catat, ditemukan, lainnya).
6. Gudang submit hasil opname → status menjadi "Menunggu Approval" jika total nilai selisih melebihi ambang batas (dikonfigurasi), atau langsung "Selesai" jika di bawah ambang batas.
7. Setelah disetujui (jika perlu) atau langsung selesai, stok sistem disesuaikan dan kartu stok mencatat pergerakan "Penyesuaian Stok Opname" per item.

#### 5.5.5 Manajemen Produk & Kategori

- Produk memiliki atribut: SKU/Kode, Nama, Kategori, Satuan, Harga Beli (HPP), Harga Ritel, Harga Grosir, Minimum Qty Grosir, Stok Minimum, Status Aktif/Nonaktif.
- Kategori bersifat hierarkis sederhana (satu level: Kategori > Produk) untuk kebutuhan setup awal; struktur multi-level dapat menjadi fase lanjutan.
- Produk mendukung barcode (manual input atau generate otomatis jika supplier tidak menyediakan barcode standar).

---

### 5.6 Modul Laporan — Data Analitik Tingkat Lanjut

#### 5.6.1 Deskripsi

Modul ini menyediakan dashboard dan laporan terperinci untuk mendukung pengambilan keputusan bisnis oleh Owner & Admin, mencakup analitik penjualan, stok, dan pembelian.

#### 5.6.2 Dashboard Ringkasan (Owner & Admin)

- **Kartu Ringkasan (KPI Cards):** Total Penjualan Hari Ini, Total Transaksi, Rata-rata Nilai Transaksi, Estimasi Margin Kotor — dengan perbandingan terhadap periode sebelumnya (↑/↓ persentase).
- **Grafik Tren Penjualan:** line/bar chart penjualan harian dalam rentang waktu yang dapat difilter (7 hari, 30 hari, custom range), dengan breakdown harga ritel vs grosir vs member.
- **Top Produk Terlaris:** top 10 produk berdasarkan qty terjual dan berdasarkan nilai penjualan, dapat difilter per kategori.
- **Produk Slow-Moving:** produk dengan penjualan terendah/tidak terjual dalam periode tertentu (default 30 hari) — membantu identifikasi stok mati.
- **Analisis Member:** member dengan total belanja tertinggi (top spenders), frekuensi transaksi, dan efektivitas harga khusus (perbandingan margin sebelum vs sesudah harga khusus diterapkan).
- **Performa Kasir:** jumlah transaksi & total penjualan per kasir per shift, untuk evaluasi operasional.

#### 5.6.3 Laporan Detail (Drill-Down)

| Laporan | Isi | Filter Tersedia |
|---|---|---|
| Laporan Penjualan | Daftar transaksi detail per item, harga yang diterapkan (ritel/grosir/khusus) | Tanggal, kasir, tipe harga, member |
| Laporan Margin Kotor | Margin per produk/kategori (Harga Jual − HPP) dikalikan qty terjual | Tanggal, kategori, produk |
| Laporan Stok | Posisi stok saat ini, nilai stok (qty × HPP), produk perlu reorder | Kategori, status stok |
| Laporan Pembelian | Rekap PO & GRN per supplier, termasuk diskrepansi yang terjadi | Tanggal, supplier, status PO |
| Kartu Stok per Produk | Histori lengkap pergerakan stok suatu produk | Tanggal, jenis pergerakan |

#### 5.6.4 Ekspor & Format

- Seluruh laporan detail dapat diekspor ke format Excel (.xlsx) dan PDF untuk kebutuhan presentasi/arsip.
- Dashboard dapat diakses melalui perangkat tablet/desktop dengan layout responsif (grafik menyesuaikan ukuran layar).

#### 5.6.5 Catatan Teknis Implementasi

- Untuk performa, agregasi laporan harian (total penjualan, qty terjual per produk) sebaiknya di-precompute melalui scheduled job (Vercel Cron) ke tabel ringkasan (`RingkasanPenjualanHarian`), bukan dihitung on-the-fly dari seluruh tabel transaksi setiap kali dashboard dibuka.
- Library visualisasi data yang disarankan: Recharts atau Tremor, dikombinasikan dengan komponen shadcn/ui untuk konsistensi desain.

---

## 6. Skema Database (Prisma Schema)

### 6.1 Entity Relationship Diagram (Ringkasan)

```
User ──┐
       ├──< Transaksi >── TransaksiItem >── Produk ──< Kategori
       │                       │              │
       │                  Member (opsional)   ├──< HargaKhusus >── Member
       │                                       │
       ├──< PurchaseOrder >── POItem >── Produk ──< Supplier
       │            │
       │            └──< GRN >── GRNItem
       │
       ├──< StokOpname >── StokOpnameItem >── Produk
       │
       └──< KartuStok >── Produk

EventLog (independen, mencatat semua event untuk modul akuntansi)
```

### 6.2 Prisma Schema Lengkap

```prisma
// schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ========== ENUMS ==========

enum Role {
  OWNER
  ADMIN
  KASIR
  GUDANG
}

enum TipeTransaksi {
  RITEL
  GROSIR
}

enum StatusTransaksi {
  DRAFT
  PAID
  VOID
  EXPIRED
}

enum MetodePembayaran {
  TUNAI
  TRANSFER
  QRIS
  KARTU
}

enum StatusPO {
  DRAFT
  DIAJUKAN
  DISETUJUI
  SEBAGIAN_DITERIMA
  SELESAI
  DIBATALKAN
}

enum StatusHargaKhusus {
  AKTIF
  NONAKTIF
}

enum JenisPergerakanStok {
  PENJUALAN
  RETUR_PENJUALAN
  PENERIMAAN_GRN
  RETUR_PEMBELIAN
  PENYESUAIAN_OPNAME
  PENYESUAIAN_MANUAL
}

enum StatusStokOpname {
  DRAFT
  MENUNGGU_APPROVAL
  SELESAI
}

enum EventType {
  SALE_COMPLETED
  PURCHASE_RECEIVED
  STOCK_ADJUSTED
  PURCHASE_PAID
}

// ========== USER & AUTH ==========

model User {
  id            String   @id @default(cuid())
  nama          String
  email         String   @unique
  passwordHash  String
  role          Role
  aktif         Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  transaksi       Transaksi[]
  purchaseOrders  PurchaseOrder[]
  grn             GRN[]
  stokOpname      StokOpname[]
  kartuStokEntri  KartuStok[]
  hargaKhususLog  HargaKhususLog[]
  sesiKasir       SesiKasir[]

  @@map("users")
}

model SesiKasir {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  modalAwal     Decimal   @db.Decimal(14, 2)
  totalKasAkhir Decimal?  @db.Decimal(14, 2)
  dibukaPada    DateTime  @default(now())
  ditutupPada   DateTime?
  catatan       String?

  transaksi     Transaksi[]

  @@map("sesi_kasir")
}

// ========== MASTER DATA ==========

model Kategori {
  id        String    @id @default(cuid())
  nama      String    @unique
  produk    Produk[]
  createdAt DateTime  @default(now())

  @@map("kategori")
}

model Produk {
  id                String   @id @default(cuid())
  sku               String   @unique
  barcode           String?  @unique
  nama              String
  kategoriId        String
  kategori          Kategori @relation(fields: [kategoriId], references: [id])
  satuan            String
  hpp               Decimal  @db.Decimal(14, 2) @default(0)
  hargaRitel        Decimal  @db.Decimal(14, 2)
  hargaGrosir       Decimal  @db.Decimal(14, 2)
  minQtyGrosir      Int      @default(1)
  stok              Int      @default(0)
  stokMinimum       Int      @default(0)
  aktif             Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  transaksiItem     TransaksiItem[]
  poItem            POItem[]
  grnItem           GRNItem[]
  hargaKhusus       HargaKhusus[]
  kartuStok         KartuStok[]
  stokOpnameItem    StokOpnameItem[]

  @@map("produk")
}

model Supplier {
  id            String   @id @default(cuid())
  nama          String
  kontakPerson  String?
  telepon       String?
  alamat        String?
  aktif         Boolean  @default(true)
  createdAt     DateTime @default(now())

  purchaseOrders PurchaseOrder[]

  @@map("supplier")
}

model Member {
  id            String   @id @default(cuid())
  kodeMember    String   @unique // MBR-000001
  nama          String
  noHp          String   @unique
  email         String?
  alamat        String?
  tanggalLahir  DateTime?
  catatan       String?
  aktif         Boolean  @default(true)
  createdAt     DateTime @default(now())

  transaksi       Transaksi[]
  hargaKhusus     HargaKhusus[]
  hargaKhususLog  HargaKhususLog[]

  @@map("member")
}

// ========== HARGA KHUSUS (PER-CUSTOMER) ==========

model HargaKhusus {
  id              String            @id @default(cuid())
  memberId        String
  member          Member            @relation(fields: [memberId], references: [id])
  produkId        String
  produk          Produk            @relation(fields: [produkId], references: [id])
  hargaKhusus     Decimal           @db.Decimal(14, 2)
  tanggalMulai    DateTime?
  tanggalBerakhir DateTime?
  status          StatusHargaKhusus @default(AKTIF)
  catatan         String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([memberId, produkId, status])
  @@map("harga_khusus")
}

model HargaKhususLog {
  id              String   @id @default(cuid())
  memberId        String
  member          Member   @relation(fields: [memberId], references: [id])
  produkId        String
  hargaLama       Decimal? @db.Decimal(14, 2)
  hargaBaru       Decimal  @db.Decimal(14, 2)
  diubahOlehId    String
  diubahOleh      User     @relation(fields: [diubahOlehId], references: [id])
  createdAt       DateTime @default(now())

  @@map("harga_khusus_log")
}

// ========== PENJUALAN (POS) ==========

model Transaksi {
  id                String           @id @default(cuid())
  nomorTransaksi    String           @unique // TRX-20260628-0001
  tipeTransaksi     TipeTransaksi    @default(RITEL)
  memberId          String?
  member            Member?          @relation(fields: [memberId], references: [id])
  kasirId           String
  kasir             User             @relation(fields: [kasirId], references: [id])
  sesiKasirId       String
  sesiKasir         SesiKasir        @relation(fields: [sesiKasirId], references: [id])
  subtotal          Decimal          @db.Decimal(14, 2)
  diskonTotal        Decimal          @db.Decimal(14, 2) @default(0)
  total             Decimal          @db.Decimal(14, 2)
  metodePembayaran  MetodePembayaran?
  jumlahDibayar     Decimal?         @db.Decimal(14, 2)
  kembalian         Decimal?         @db.Decimal(14, 2)
  status            StatusTransaksi  @default(DRAFT)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  items             TransaksiItem[]

  @@map("transaksi")
}

model TransaksiItem {
  id              String     @id @default(cuid())
  transaksiId     String
  transaksi       Transaksi  @relation(fields: [transaksiId], references: [id])
  produkId        String
  produk          Produk     @relation(fields: [produkId], references: [id])
  qty             Int
  hargaSatuan     Decimal    @db.Decimal(14, 2) // snapshot harga final saat transaksi
  tipeHarga       String     // "RITEL" | "GROSIR" | "KHUSUS" (untuk keperluan laporan)
  diskonItem      Decimal    @db.Decimal(14, 2) @default(0)
  subtotal        Decimal    @db.Decimal(14, 2)

  @@map("transaksi_item")
}

// ========== PEMBELIAN (PO & GRN) ==========

model PurchaseOrder {
  id              String         @id @default(cuid())
  nomorPO         String         @unique // PO-20260628-0001
  supplierId      String
  supplier        Supplier       @relation(fields: [supplierId], references: [id])
  dibuatOlehId    String
  dibuatOleh      User           @relation(fields: [dibuatOlehId], references: [id])
  totalNilai      Decimal        @db.Decimal(14, 2)
  status          StatusPO       @default(DRAFT)
  disetujuiPada   DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  items           POItem[]
  grn             GRN[]

  @@map("purchase_order")
}

model POItem {
  id              String         @id @default(cuid())
  poId            String
  po              PurchaseOrder  @relation(fields: [poId], references: [id])
  produkId        String
  produk          Produk         @relation(fields: [produkId], references: [id])
  qtyPesan        Int
  hargaBeli       Decimal        @db.Decimal(14, 2)
  qtyDiterima     Int            @default(0) // akumulasi dari seluruh GRN terkait

  @@map("po_item")
}

model GRN {
  id              String         @id @default(cuid())
  nomorGRN        String         @unique // GRN-20260628-0001
  poId            String
  po              PurchaseOrder  @relation(fields: [poId], references: [id])
  diterimaOlehId  String
  diterimaOleh    User           @relation(fields: [diterimaOlehId], references: [id])
  catatan         String?
  createdAt       DateTime       @default(now())

  items           GRNItem[]

  @@map("grn")
}

model GRNItem {
  id              String   @id @default(cuid())
  grnId           String
  grn             GRN      @relation(fields: [grnId], references: [id])
  produkId        String
  qtyDiterima     Int
  qtyDitolak      Int      @default(0)
  hargaAktual     Decimal  @db.Decimal(14, 2)
  nomorBatch      String?
  tanggalExpired  DateTime?
  adaDiskrepansi  Boolean  @default(false)

  @@map("grn_item")
}

// ========== INVENTORY ==========

model KartuStok {
  id              String              @id @default(cuid())
  produkId        String
  produk          Produk              @relation(fields: [produkId], references: [id])
  jenisPergerakan JenisPergerakanStok
  qty             Int                 // positif = masuk, negatif = keluar
  stokSebelum     Int
  stokSesudah     Int
  referensiTipe   String              // "TRANSAKSI" | "GRN" | "STOK_OPNAME" | "MANUAL"
  referensiId     String?
  userId          String
  user            User                @relation(fields: [userId], references: [id])
  catatan         String?
  createdAt       DateTime            @default(now())

  @@map("kartu_stok")
}

model StokOpname {
  id              String            @id @default(cuid())
  nomorOpname     String            @unique // SO-20260628-0001
  lingkup         String            // "SEMUA" | nama kategori
  status          StatusStokOpname  @default(DRAFT)
  dibuatOlehId    String
  dibuatOleh      User              @relation(fields: [dibuatOlehId], references: [id])
  createdAt       DateTime          @default(now())
  selesaiPada     DateTime?

  items           StokOpnameItem[]

  @@map("stok_opname")
}

model StokOpnameItem {
  id              String      @id @default(cuid())
  stokOpnameId    String
  stokOpname      StokOpname  @relation(fields: [stokOpnameId], references: [id])
  produkId        String
  produk          Produk      @relation(fields: [produkId], references: [id])
  stokSistem      Int
  stokFisik       Int?
  selisih         Int?
  alasanKode      String?     // "HILANG" | "RUSAK" | "SALAH_CATAT" | "DITEMUKAN" | "LAINNYA"

  @@map("stok_opname_item")
}

// ========== INTEGRATION / EVENT LOG ==========

model EventLog {
  id          String    @id @default(cuid())
  eventType   EventType
  payload     Json
  referensiId String
  diprosesAkuntansi Boolean @default(false)
  createdAt   DateTime  @default(now())

  @@map("event_log")
}
```

### 6.3 Catatan Implementasi Schema

- Seluruh nilai uang menggunakan tipe `Decimal` dengan precision (14,2) untuk menghindari floating-point error pada kalkulasi finansial.
- Penomoran dokumen (Transaksi, PO, GRN, Stok Opname) menggunakan format `[PREFIX]-[YYYYMMDD]-[counter incremental harian]`, digenerate di service layer menggunakan transaksi database untuk menghindari race condition pada nomor duplikat.
- Relasi `qtyDiterima` pada `POItem` diakumulasi setiap kali GRN baru dikonfirmasi untuk PO terkait, sehingga sistem dapat menentukan status PO (SEBAGIAN_DITERIMA vs SELESAI) tanpa perlu join kompleks setiap saat.
- Tabel `EventLog` bersifat append-only dan independen dari skema operasional lain, sehingga modul akuntansi terpisah dapat membaca tabel ini tanpa risiko terhadap integritas data operasional POS.
- Migrasi awal (`prisma migrate dev`) sebaiknya disertai seed data (`prisma/seed.ts`) berisi minimal: 1 user tiap role, beberapa kategori & produk contoh, 1 supplier, dan 1 member contoh — untuk mempermudah demo & testing.

---

## 7. Struktur Folder Proyek (Next.js App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (kasir)/
│   │   └── pos/page.tsx                 # Halaman utama transaksi
│   ├── (gudang)/
│   │   ├── inventory/page.tsx
│   │   ├── stok-opname/page.tsx
│   │   ├── pembelian/page.tsx           # PO
│   │   └── grn/page.tsx
│   ├── (admin)/
│   │   ├── master-data/
│   │   │   ├── produk/page.tsx
│   │   │   ├── kategori/page.tsx
│   │   │   └── supplier/page.tsx
│   │   ├── member/
│   │   │   ├── page.tsx
│   │   │   └── [id]/harga-khusus/page.tsx
│   │   ├── pembelian/approval/page.tsx
│   │   └── pengaturan/page.tsx
│   ├── (dashboard)/
│   │   └── laporan/
│   │       ├── page.tsx                  # Dashboard ringkasan
│   │       ├── penjualan/page.tsx
│   │       ├── margin/page.tsx
│   │       ├── stok/page.tsx
│   │       └── pembelian/page.tsx
│   └── api/
│       └── webhooks/.../route.ts        # Jika diperlukan integrasi eksternal
├── components/
│   ├── ui/                               # shadcn/ui components
│   ├── pos/                              # Komponen spesifik POS (keranjang, scanner, dsb)
│   ├── inventory/
│   └── shared/
├── lib/
│   ├── prisma.ts                         # Prisma client singleton
│   ├── auth.ts                           # NextAuth config
│   └── utils.ts
├── services/
│   ├── sales.service.ts
│   ├── purchase.service.ts
│   ├── grn.service.ts
│   ├── inventory.service.ts
│   ├── member.service.ts
│   └── report.service.ts
├── validations/                          # Zod schemas
│   ├── transaksi.schema.ts
│   ├── produk.schema.ts
│   └── ...
├── middleware.ts                         # RBAC guard
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## 8. Non-Functional Requirements

| Aspek | Kebutuhan |
|---|---|
| Performa | Halaman POS harus responsif dengan waktu respon pencarian produk < 300ms; transaksi tersimpan < 1 detik setelah konfirmasi bayar |
| Ketersediaan | Target uptime 99.5% (bergantung pada SLA Vercel + database hosting yang dipilih) |
| Konsistensi Data | Operasi yang melibatkan stok (penjualan, GRN, stok opname) wajib atomic melalui Prisma `$transaction` untuk mencegah data tidak konsisten akibat race condition |
| Keamanan | Password di-hash (bcrypt/argon2), session menggunakan HTTP-only cookie via NextAuth, seluruh input divalidasi server-side dengan Zod untuk mencegah injection |
| Audit Trail | Setiap transaksi finansial & perubahan harga khusus mencatat user, timestamp, dan nilai sebelum/sesudah |
| Skalabilitas | Desain awal single-outlet namun skema (terutama Produk & Transaksi) disusun agar penambahan kolom `outletId` di fase mendatang tidak memerlukan migrasi struktural besar |
| Usability | UI dioptimalkan untuk penggunaan dengan keyboard/scanner di counter kasir (auto-focus, shortcut keyboard untuk aksi umum seperti bayar/void) |
| Kompatibilitas Perangkat | Responsif untuk desktop, tablet (kasir/gudang), dan layar mobile untuk akses laporan oleh Owner |
| Backup & Recovery | Database hosting (Neon/Supabase) dikonfigurasi dengan automated daily backup dan point-in-time recovery |

---

## 9. Roadmap Pengembangan (Fase Setup Awal)

### Fase 1: Foundation (Minggu 1–2)

- Setup project Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Setup Prisma 5 + koneksi PostgreSQL (Neon/Supabase) + migrasi schema awal
- Implementasi autentikasi (NextAuth v5) + middleware RBAC untuk 4 role
- CRUD Master Data: Kategori, Produk, Supplier

### Fase 2: Modul Member & Penjualan (Minggu 3–4)

- CRUD Member + halaman daftar cepat saat transaksi
- Implementasi Harga Khusus per-customer + histori log
- Halaman POS: pencarian produk, keranjang, logika resolusi harga (ritel/grosir/khusus)
- Sesi Kasir (buka/tutup), pembayaran, cetak struk
- Retur & void transaksi

### Fase 3: Modul Pembelian & Inventory (Minggu 5–6)

- CRUD Purchase Order + state machine status + approval flow
- Modul GRN dengan dukungan partial receipt & penanganan diskrepansi
- Update HPP otomatis (moving average) saat GRN dikonfirmasi
- Kartu Stok (logging seluruh pergerakan stok)
- Stok Opname (sesi, input fisik, approval selisih)
- Notifikasi stok minimum

### Fase 4: Laporan & Integrasi (Minggu 7–8)

- Dashboard ringkasan (KPI cards, grafik tren)
- Laporan detail: penjualan, margin, stok, pembelian (dengan export Excel/PDF)
- Implementasi EventLog untuk seluruh trigger point modul akuntansi
- Scheduled job (Vercel Cron) untuk agregasi laporan harian

### Fase 5: Testing, Hardening & Deployment (Minggu 9–10)

- End-to-end testing untuk seluruh happy path & edge case (stok negatif, void, diskrepansi GRN)
- Seed data demo lengkap untuk keperluan UAT (User Acceptance Test)
- Konfigurasi environment production di Vercel (env variables, Node.js v22, connection pooling)
- Dokumentasi pengguna per role (Kasir, Gudang, Admin, Owner)
- Go-live & monitoring awal

### 9.1 Catatan Prioritas

Apabila diperlukan rilis bertahap (MVP lebih cepat), Fase 1–2 (Foundation + Penjualan dasar tanpa harga khusus) dapat dianggap sebagai MVP minimum untuk operasional toko mulai berjalan, dengan Fase 3–4 menyusul sebagai peningkatan bertahap.

---

## 10. Pertanyaan Terbuka & Asumsi

### 10.1 Asumsi yang Digunakan dalam Dokumen Ini

- Sistem didesain untuk single outlet; struktur multi-cabang belum termasuk dalam scope.
- Harga khusus member bersifat per-customer individual (negosiasi langsung), bukan berbasis tier/level keanggotaan umum.
- Modul Jurnal/Akuntansi dianggap sebagai sistem terpisah yang akan mengonsumsi data dari `EventLog`.
- Pajak (PPN) belum dimasukkan secara eksplisit pada perhitungan transaksi — dapat ditambahkan sebagai field opsional jika toko termasuk PKP (Pengusaha Kena Pajak).

### 10.2 Hal yang Perlu Diklarifikasi Sebelum Development Dimulai

1. Apakah toko termasuk PKP dan perlu menghitung PPN pada setiap transaksi?
2. Berapa ambang batas nilai PO yang memerlukan approval Admin (nominal Rupiah)?
3. Apakah dibutuhkan dukungan multi-cabang di roadmap jangka menengah (mempengaruhi keputusan menambah `outletId` lebih awal atau tidak)?
4. Apakah ada kebutuhan integrasi pembayaran digital (QRIS dinamis via payment gateway) pada fase berikutnya?
5. Apakah produk yang dijual memerlukan pelacakan expired date secara umum (tidak hanya untuk kategori tertentu)?

---

*Dokumen ini adalah PRD setup awal. Modul Jurnal/Akuntansi (double-entry bookkeeping) akan disusun sebagai dokumen PRD terpisah yang mengonsumsi data dari tabel `EventLog` pada skema di atas.*