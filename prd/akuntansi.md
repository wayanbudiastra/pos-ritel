# PRODUCT REQUIREMENTS DOCUMENT
# Sistem POS Retail — Modul Akuntansi (Jurnal & Laporan Keuangan)

**Versi:** 1.0
**Tanggal:** 29 Juni 2026
**Status:** Draft untuk Review

**Tech Stack:** Next.js 14+ (App Router), TypeScript, PostgreSQL, Prisma 5, Tailwind CSS, Node.js v22, Vercel — *identik dengan PRD Sistem Setup, karena modul ini menyatu di codebase yang sama.*

**Dokumen terkait:** [`sistem_setup.md`](./sistem_setup.md) — modul ini secara eksplisit dijanjikan di bagian 1.1 & 2.5 dokumen tersebut sebagai PRD terpisah yang mengonsumsi tabel `EventLog`.

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Arsitektur & Pola Integrasi](#2-arsitektur--pola-integrasi)
3. [Role & Hak Akses (RBAC)](#3-role--hak-akses-rbac)
4. [User Stories Utama](#4-user-stories-utama)
5. [Functional Requirements](#5-functional-requirements)
6. [Skema Database (Prisma Schema)](#6-skema-database-prisma-schema)
7. [Struktur Folder Proyek](#7-struktur-folder-proyek)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Roadmap Pengembangan](#9-roadmap-pengembangan)
10. [Pertanyaan Terbuka & Asumsi](#10-pertanyaan-terbuka--asumsi)

---

## 1. Executive Summary

### 1.1 Latar Belakang

PRD Sistem Setup (`sistem_setup.md`) secara sengaja memisahkan pembukuan double-entry ke dokumen ini, namun sudah menyediakan titik integrasi berupa tabel `EventLog` (append-only) yang mencatat 4 jenis event: `SALE_COMPLETED`, `PURCHASE_RECEIVED`, `STOCK_ADJUSTED`, `PURCHASE_PAID`. Modul Akuntansi membaca `EventLog` secara asinkron dan mengubahnya menjadi jurnal akuntansi, tanpa modul POS/Pembelian/Inventory perlu tahu detail akuntansi sama sekali.

Konsep mengikuti pola standar akuntansi double-entry yang umum dipakai aplikasi kasir/ritel di Indonesia (mengacu SAK EMKM): Chart of Account (COA), Jurnal Umum, Buku Besar, Laporan Laba Rugi, dan Neraca.

### 1.2 Tujuan

- **Otomatisasi pembukuan:** Setiap transaksi penjualan, penerimaan barang, dan penyesuaian stok otomatis menghasilkan jurnal yang benar dan seimbang (debit = kredit) tanpa input manual berulang.
- **Fleksibilitas pencatatan:** Tetap mendukung jurnal manual untuk transaksi non-operasional (setor modal, bayar beban, koreksi).
- **Visibilitas finansial real-time:** Owner/Admin dapat melihat Laba Rugi dan Neraca kapan saja tanpa proses tutup buku manual yang rumit.
- **Audit trail penuh:** Setiap jurnal — otomatis maupun manual — dapat ditelusuri balik ke transaksi sumbernya, dan tidak pernah dihapus (hanya dibalik dengan jurnal pembalik).

### 1.3 Ruang Lingkup (Scope)

#### Termasuk dalam Modul Ini (In-Scope)

- Chart of Account (COA) — struktur akun standar & dapat dikustomisasi
- Pemetaan Akun — menghubungkan setiap jenis event POS ke akun COA tertentu (agar tidak hardcode)
- Jurnal Otomatis — consumer yang membaca `EventLog` dan membuat jurnal
- Jurnal Manual — input jurnal umum oleh Admin, dengan validasi balance
- Buku Besar per akun (pendukung audit & pengecekan saldo)
- Laporan Laba Rugi (Income Statement) per periode
- Laporan Neraca (Balance Sheet) per tanggal cut-off
- Export Excel untuk Laba Rugi & Neraca (konsisten dengan modul Laporan POS yang sudah ada)

#### Tidak Termasuk (Out-of-Scope)

- Laporan Arus Kas (Cash Flow Statement) — dapat menjadi fase lanjutan
- Multi-currency / akuntansi multi-mata uang
- Perhitungan pajak (PPN/PPh) detail — jurnal otomatis saat ini mengasumsikan harga sudah final tanpa pajak (lihat 10.2 PRD Sistem Setup)
- Tutup buku (closing period) formal yang mengunci jurnal periode lama — laporan dihitung on-the-fly dari rentang tanggal
- Anggaran (budgeting) dan analisis varians
- Pembayaran hutang ke supplier (fitur sumber event `PURCHASE_PAID`) — **belum ada di modul Pembelian saat ini**, lihat 10.2

### 1.4 Target Pengguna

Mewarisi role yang sama dari PRD Sistem Setup — tidak menambah role baru:

- **Owner:** Melihat Laba Rugi & Neraca (read-only), untuk pengambilan keputusan bisnis.
- **Admin:** Mengelola COA, Pemetaan Akun, membuat/membalik Jurnal Manual, meninjau antrian Jurnal Otomatis yang gagal diproses.
- **Kasir / Gudang:** Tidak memiliki akses ke modul ini sama sekali (konsisten dengan matriks PRD Sistem Setup yang membatasi laporan finansial hanya untuk Owner & Admin).

---

## 2. Arsitektur & Pola Integrasi

### 2.1 Diagram Alur Integrasi

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODUL OPERASIONAL (POS)                      │
│   SalesService | GrnService | InventoryService | StokOpname     │
└───────────────────────────┬───────────────────────────────────────┘
                            │ menulis (append-only, tanpa tahu akuntansi)
                            ▼
                   ┌─────────────────┐
                   │   EventLog      │  (sudah ada — PRD Sistem Setup 6.2)
                   │ diprosesAkuntansi=false │
                   └────────┬────────┘
                            │ dibaca async (cron / tombol "Proses Sekarang")
                            ▼
              ┌──────────────────────────────┐
              │   EventConsumerService        │  ◄── PemetaanAkun (COA)
              │  (modul Akuntansi)            │
              └───────────┬──────────────────┘
                            │ membuat
                            ▼
                   ┌─────────────────┐
                   │  JurnalEntry +   │
                   │  JurnalLine      │ ◄── juga diisi manual oleh Admin
                   └────────┬────────┘
                            │ diagregasi
                            ▼
              ┌──────────────────────────────┐
              │ Buku Besar | Laba Rugi | Neraca │
              └──────────────────────────────┘
```

### 2.2 Pola Desain Utama

- **Event Consumer Pattern:** Modul Akuntansi tidak pernah mengubah tabel operasional (`Transaksi`, `GRN`, `KartuStok`, dst). Ia hanya membaca `EventLog` dan menulis ke tabelnya sendiri (`Akun`, `JurnalEntry`, `JurnalLine`). Ini menjamin modul POS yang sudah berjalan di production tidak perlu diubah sama sekali untuk mengaktifkan modul ini.
- **Idempotency:** Satu baris `EventLog` hanya boleh menghasilkan satu `JurnalEntry`. Diberlakukan via kombinasi unique constraint `JurnalEntry.eventLogId` + flag `EventLog.diprosesAkuntansi`, sehingga consumer aman dijalankan berulang kali (misal retry setelah error) tanpa duplikasi.
- **Balanced Transaction Wajib:** Setiap `JurnalEntry` divalidasi dalam satu `prisma.$transaction` — total debit harus sama dengan total kredit pada seluruh `JurnalLine` sebelum entry disimpan. Tidak ada jurnal tidak seimbang yang boleh tersimpan.
- **Append-Only Ledger:** Jurnal yang sudah ber-status `POSTED` tidak dapat diedit atau dihapus. Koreksi dilakukan dengan membuat jurnal pembalik (*reversing entry*) yang mereferensikan jurnal asal — pola yang sama dengan Kartu Stok di PRD Sistem Setup (tidak pernah menghapus histori, hanya menambah catatan baru).
- **Pemetaan Akun, Bukan Hardcode:** Kode akun untuk setiap jenis transaksi (Kas, Persediaan, HPP, Hutang Usaha, dst) disimpan di tabel `PemetaanAkun` yang dapat diubah Admin, bukan ditulis langsung di kode aplikasi. Ini memungkinkan toko memakai struktur COA berbeda tanpa redeploy.

### 2.3 Pemicu Proses (Trigger)

Dua mode, tidak saling eksklusif:

1. **Terjadwal (Vercel Cron):** Endpoint `/api/cron/process-jurnal-otomatis` berjalan setiap beberapa menit (atau menyatu dengan cron agregasi laporan harian yang sudah ada di `vercel.json`), memproses seluruh `EventLog` yang `diprosesAkuntansi=false`.
2. **Manual oleh Admin:** Tombol "Proses Sekarang" di halaman Antrian Jurnal Otomatis, untuk kebutuhan rekonsiliasi langsung tanpa menunggu jadwal cron.

---

## 3. Role & Hak Akses (RBAC)

### 3.1 Matriks Hak Akses per Modul

| Modul | Owner | Admin | Kasir | Gudang |
|---|---|---|---|---|
| Chart of Account (COA) | View | Full | - | - |
| Pemetaan Akun | View | Full | - | - |
| Jurnal Otomatis (Antrian & Hasil) | View | Full (proses, retry) | - | - |
| Jurnal Manual | View | Full (buat, balik) | - | - |
| Buku Besar | View | View | - | - |
| Laporan Laba Rugi | View | View | - | - |
| Laporan Neraca | View | View | - | - |

Keterangan: sama seperti PRD Sistem Setup, "Full" = create/read/update sesuai konteks (jurnal tidak pernah hard-delete), "View" = baca saja, "-" = modul tidak terlihat sama sekali di navigasi maupun API.

### 3.2 Implementasi Teknis

Mewarisi pola yang sama dari `src/lib/rbac.ts` dan `src/lib/route-access.ts` di PRD Sistem Setup — menambah entri baru ke `ROUTE_ACCESS`:

| Prefix Route | Roles |
|---|---|
| `/akuntansi/coa` | `OWNER`, `ADMIN` |
| `/akuntansi/pemetaan` | `ADMIN` |
| `/akuntansi/jurnal` | `OWNER`, `ADMIN` |
| `/akuntansi/laba-rugi` | `OWNER`, `ADMIN` |
| `/akuntansi/neraca` | `OWNER`, `ADMIN` |

Setiap Server Action tetap memvalidasi ulang role di server (`requireRole`), tidak hanya mengandalkan sidebar yang disembunyikan.

---

## 4. User Stories Utama

### US-01: Jurnal otomatis dari transaksi penjualan

**Sebagai:** Sistem (dipicu otomatis)

**Kriteria Penerimaan:**
- Saat `EventLog` bertipe `SALE_COMPLETED` diproses, sistem membuat satu `JurnalEntry` dengan baris: Debit Kas/Bank/Piutang (sesuai metode pembayaran) sebesar total transaksi, Kredit Pendapatan Penjualan sebesar subtotal-diskon, Debit HPP, Kredit Persediaan Barang Dagang sebesar nilai HPP barang terjual.
- Jurnal yang terbentuk otomatis seimbang (total debit = total kredit) tanpa perlu intervensi manual.
- Jurnal mencantumkan referensi ke `nomorTransaksi` asal untuk audit trail.

### US-02: Jurnal otomatis dari penerimaan barang (GRN)

**Sebagai:** Sistem (dipicu otomatis)

**Kriteria Penerimaan:**
- Event `PURCHASE_RECEIVED` menghasilkan jurnal: Debit Persediaan Barang Dagang, Kredit Hutang Usaha (karena pembayaran ke supplier dianggap kredit sampai ada fitur pelunasan).
- Nilai jurnal mengikuti `totalBiaya` dari payload event (qty diterima × harga aktual saat GRN, sudah termasuk efek moving average HPP).

### US-03: Jurnal otomatis dari penyesuaian stok

**Sebagai:** Sistem (dipicu otomatis)

**Kriteria Penerimaan:**
- Event `STOCK_ADJUSTED` dengan selisih positif (stok ditemukan lebih) → Debit Persediaan, Kredit Pendapatan Lain-lain.
- Event `STOCK_ADJUSTED` dengan selisih negatif (hilang/rusak) → Debit Beban Selisih Stok, Kredit Persediaan.
- Nilai jurnal = `nilaiHpp` dari payload (selisih qty × HPP produk saat itu).

### US-04: Membuat jurnal manual

**Sebagai:** Admin

**Kriteria Penerimaan:**
- Admin dapat memilih tanggal, menulis keterangan, dan menambahkan minimal 2 baris akun (debit/kredit).
- Sistem menolak penyimpanan jika total debit ≠ total kredit, dengan pesan selisih yang jelas.
- Setelah disimpan (status `POSTED`), baris jurnal tidak dapat diedit; perubahan hanya melalui jurnal pembalik.

### US-05: Membalik jurnal yang salah

**Sebagai:** Admin

**Kriteria Penerimaan:**
- Admin dapat memilih jurnal `POSTED` (otomatis maupun manual) dan membuat jurnal pembalik satu klik (baris debit/kredit dibalik otomatis).
- Jurnal asal tetap tampil di riwayat dengan tautan ke jurnal pembaliknya, tidak terhapus.

### US-06: Meninjau antrian jurnal otomatis yang gagal

**Sebagai:** Admin

**Kriteria Penerimaan:**
- Jika consumer gagal memetakan event ke akun (misal `PemetaanAkun` belum diisi), event tetap `diprosesAkuntansi=false` dan masuk daftar "Gagal Diproses" beserta pesan error.
- Admin dapat memperbaiki Pemetaan Akun lalu klik "Proses Ulang" tanpa duplikasi jurnal.

### US-07: Melihat Laporan Laba Rugi

**Sebagai:** Owner / Admin

**Kriteria Penerimaan:**
- Dapat memfilter rentang tanggal custom (default bulan berjalan).
- Menampilkan: Pendapatan Penjualan → HPP → Laba Kotor → Beban Operasional (per akun) → Laba/Rugi Bersih.
- Dapat export ke Excel.

### US-08: Melihat Neraca

**Sebagai:** Owner / Admin

**Kriteria Penerimaan:**
- Dapat memilih tanggal cut-off (default: hari ini).
- Menampilkan saldo seluruh akun Aset, Liabilitas, dan Ekuitas (termasuk Laba Ditahan berjalan) per tanggal tersebut.
- Sistem menampilkan indikator jika Total Aset ≠ Total Liabilitas + Ekuitas (sebagai pengecekan integritas data — seharusnya selalu seimbang jika seluruh jurnal benar).
- Dapat export ke Excel.

---

## 5. Functional Requirements

### 5.1 Chart of Account (COA)

#### 5.1.1 Struktur Akun

| Field | Tipe | Keterangan |
|---|---|---|
| kode | String (unique) | Format `[tipe]-[urutan]`, contoh `1-1000` |
| nama | String | Nama akun, contoh "Kas" |
| tipe | Enum | `ASET`, `LIABILITAS`, `EKUITAS`, `PENDAPATAN`, `BEBAN`, `HPP` |
| saldoNormal | Enum | `DEBIT` atau `KREDIT` — menentukan arah penambahan saldo |
| indukAkunId | Relasi (opsional) | Untuk sub-akun, hierarki 1 level (mirip Kategori Produk) |
| aktif | Boolean | Soft-delete, tidak menghapus histori jurnal |

#### 5.1.2 COA Default (Seed)

| Kode | Nama | Tipe | Saldo Normal |
|---|---|---|---|
| 1-1000 | Kas | ASET | DEBIT |
| 1-1100 | Bank | ASET | DEBIT |
| 1-2000 | Piutang Usaha | ASET | DEBIT |
| 1-3000 | Persediaan Barang Dagang | ASET | DEBIT |
| 2-1000 | Hutang Usaha | LIABILITAS | KREDIT |
| 3-1000 | Modal Pemilik | EKUITAS | KREDIT |
| 3-2000 | Laba Ditahan | EKUITAS | KREDIT |
| 4-1000 | Pendapatan Penjualan | PENDAPATAN | KREDIT |
| 4-2000 | Pendapatan Lain-lain | PENDAPATAN | KREDIT |
| 5-1000 | Harga Pokok Penjualan (HPP) | HPP | DEBIT |
| 6-1000 | Beban Selisih Stok | BEBAN | DEBIT |
| 6-2000 | Beban Operasional Lainnya | BEBAN | DEBIT |

#### 5.1.3 Validasi & Aturan Bisnis

- Akun tidak dapat dinonaktifkan jika masih dipakai sebagai mapping aktif di `PemetaanAkun`.
- Akun tidak dapat dihapus permanen jika sudah punya `JurnalLine` — hanya bisa dinonaktifkan (konsisten dengan pola soft-delete di seluruh PRD Sistem Setup).

### 5.2 Pemetaan Akun (Account Mapping)

Tabel konfigurasi yang menghubungkan "kebutuhan akun" (kunci tetap di kode) ke akun COA pilihan Admin, supaya logic jurnal otomatis tidak hardcode kode akun.

| Kunci | Dipakai untuk | Akun Default |
|---|---|---|
| `KAS` | Penjualan tunai | 1-1000 Kas |
| `BANK` | Penjualan transfer/QRIS/kartu | 1-1100 Bank |
| `PIUTANG_USAHA` | (cadangan, jika ada penjualan kredit ke member) | 1-2000 Piutang Usaha |
| `PERSEDIAAN` | Mutasi stok (penjualan, GRN, penyesuaian) | 1-3000 Persediaan Barang Dagang |
| `HUTANG_USAHA` | Penerimaan barang dari supplier (kredit) | 2-1000 Hutang Usaha |
| `PENDAPATAN_PENJUALAN` | Pendapatan dari `SALE_COMPLETED` | 4-1000 Pendapatan Penjualan |
| `PENDAPATAN_LAIN` | Selisih stok lebih | 4-2000 Pendapatan Lain-lain |
| `HPP` | Harga pokok penjualan dari `SALE_COMPLETED` | 5-1000 HPP |
| `BEBAN_SELISIH_STOK` | Selisih stok kurang | 6-1000 Beban Selisih Stok |

Admin dapat mengubah akun tujuan tiap kunci ini melalui halaman Pemetaan Akun. Mapping metode pembayaran → kunci kas/bank: `TUNAI/QRIS` → `KAS`, `TRANSFER/KARTU` → `BANK` (dapat disesuaikan di fase berikutnya jika dibutuhkan granularitas per metode).

### 5.3 Jurnal Otomatis (Event Consumer)

#### 5.3.1 Alur Proses

1. Consumer mengambil batch `EventLog` dengan `diprosesAkuntansi=false`, urut `createdAt` ascending.
2. Untuk tiap event, tentukan template jurnal berdasarkan `eventType` (lihat 5.3.2).
3. Resolusi akun via `PemetaanAkun` (jika kunci belum dipetakan → event ditandai gagal, **bukan** error fatal yang menghentikan batch — event lain tetap diproses).
4. Simpan `JurnalEntry` + `JurnalLine` dalam satu `$transaction`, lalu update `EventLog.diprosesAkuntansi=true` dalam transaction yang sama (atomic, mencegah event terproses ganda).
5. Catat hasil batch (jumlah sukses/gagal) untuk ditampilkan di halaman Antrian.

#### 5.3.2 Template Jurnal per Event Type

| Event Type | Debit | Kredit |
|---|---|---|
| `SALE_COMPLETED` | `KAS`/`BANK` (= total) | `PENDAPATAN_PENJUALAN` (= total − hpp margin... lihat catatan) |
| | `HPP` (= hpp) | `PERSEDIAAN` (= hpp) |
| `PURCHASE_RECEIVED` | `PERSEDIAAN` (= totalBiaya) | `HUTANG_USAHA` (= totalBiaya) |
| `STOCK_ADJUSTED` (selisih > 0) | `PERSEDIAAN` (= nilaiHpp) | `PENDAPATAN_LAIN` (= nilaiHpp) |
| `STOCK_ADJUSTED` (selisih < 0) | `BEBAN_SELISIH_STOK` (= nilaiHpp) | `PERSEDIAAN` (= nilaiHpp) |
| `PURCHASE_PAID` | `HUTANG_USAHA` (= jumlahDibayar) | `KAS`/`BANK` (= jumlahDibayar) |

> **Catatan perhitungan `SALE_COMPLETED`:** payload event menyimpan `total` (uang yang benar-benar masuk) dan `hpp` (modal barang terjual). Pendapatan Penjualan dicatat sebesar `total` dikurangi bagian yang merupakan pengembalian modal — secara praktik akuntansi standar, **Pendapatan Penjualan dicatat sebesar nilai jual penuh (`total`)**, dan HPP dicatat terpisah sebagai baris kedua. Baris 1 (Kas=total, Pendapatan=total) sudah seimbang sendiri; baris 2 (HPP=hpp, Persediaan=hpp) juga seimbang sendiri — sehingga satu `JurnalEntry` berisi 4 baris yang totalnya tetap seimbang (total+hpp = total+hpp).

> **Catatan `PURCHASE_PAID`:** event ini akan terbentuk **setelah** modul Pembelian di PRD Sistem Setup punya fitur "Bayar Hutang Supplier" (saat ini belum ada — lihat 10.2). Sampai fitur itu dibangun, template ini sudah siap namun tidak akan pernah ter-trigger.

#### 5.3.3 Penanganan Kegagalan

- Event gagal dipetakan (kunci `PemetaanAkun` kosong) → masuk daftar "Gagal Diproses" dengan keterangan kunci yang belum dipetakan.
- Event dengan payload tidak valid (data korup) → dicatat sebagai gagal permanen, ditampilkan terpisah agar tidak terus mencoba ulang tanpa henti di setiap siklus cron.

### 5.4 Jurnal Manual

#### 5.4.1 Alur Input

1. Admin membuka "Jurnal Manual" → "Buat Jurnal Baru".
2. Input tanggal (default hari ini), keterangan umum, dan baris-baris: pilih akun, isi nominal di kolom Debit **atau** Kredit (tidak boleh keduanya pada baris yang sama).
3. Sistem menghitung total debit & total kredit secara real-time di UI.
4. Tombol "Simpan" nonaktif (disabled) selama total debit ≠ total kredit.
5. Setelah disimpan, status jurnal `POSTED`, nomor jurnal otomatis `JRN-YYYYMMDD-####`.

#### 5.4.2 Pembalikan Jurnal (Reversing Entry)

- Tombol "Balik Jurnal" pada jurnal `POSTED` manapun (otomatis/manual) membuat `JurnalEntry` baru dengan seluruh baris debit/kredit tertukar, mereferensikan `jurnalPembalikDariId`.
- Jurnal yang sudah pernah dibalik tidak dapat dibalik kedua kalinya (mencegah double-reversal); harus membuat jurnal koreksi baru secara manual jika diperlukan lagi.

### 5.5 Buku Besar (General Ledger)

- Pilih satu akun → tampilkan seluruh `JurnalLine` terkait diurutkan tanggal, dengan kolom saldo berjalan (running balance) sesuai `saldoNormal` akun tersebut.
- Filter rentang tanggal.
- Mengikuti pola tabel standar aplikasi ini: search + pagination 10 data/halaman, dibatasi 100 data terakhir (konsisten dengan seluruh tabel lain di PRD Sistem Setup).

### 5.6 Laporan Laba Rugi

#### 5.6.1 Struktur Laporan

```
Pendapatan Penjualan                          xxx
Pendapatan Lain-lain                          xxx
                                          ───────
Total Pendapatan                              xxx

Harga Pokok Penjualan (HPP)                  (xxx)
                                          ───────
Laba Kotor                                    xxx

Beban Operasional:
  Beban Selisih Stok                          xxx
  Beban Operasional Lainnya                   xxx
                                          ───────
Total Beban Operasional                      (xxx)
                                          ───────
LABA (RUGI) BERSIH                            xxx
```

#### 5.6.2 Logika Kalkulasi

- Jumlahkan seluruh `JurnalLine` dengan akun bertipe `PENDAPATAN` (kredit − debit) dan `BEBAN`/`HPP` (debit − kredit) dalam rentang `tanggal` yang dipilih.
- Karena tidak ada proses tutup buku, laporan ini selalu dihitung ulang dari rentang tanggal — periode berapa pun bisa diminta tanpa migrasi data.

### 5.7 Laporan Neraca

#### 5.7.1 Struktur Laporan

```
ASET                                          LIABILITAS
  Kas                          xxx               Hutang Usaha            xxx
  Bank                         xxx             Total Liabilitas         xxx
  Piutang Usaha                xxx
  Persediaan Barang Dagang     xxx            EKUITAS
                            ───────              Modal Pemilik          xxx
Total Aset                     xxx               Laba Ditahan           xxx
                                               Total Ekuitas            xxx
                                          ───────────────────────────────────
                                          Total Liabilitas + Ekuitas    xxx
```

#### 5.7.2 Logika Kalkulasi

- Saldo akun `ASET`/`LIABILITAS`/`EKUITAS` dihitung **akumulatif dari awal berdirinya data** sampai `tanggalCutOff` (bukan per-periode seperti Laba Rugi, karena ini akun riil/permanen).
- **Laba Ditahan** = akumulasi seluruh saldo akun `PENDAPATAN` dikurangi `BEBAN`/`HPP` sejak awal data sampai `tanggalCutOff` (representasi laba/rugi kumulatif yang belum "ditutup" secara formal ke modal).
- Validasi tampilan: `Total Aset` harus sama dengan `Total Liabilitas + Total Ekuitas`. Jika tidak (mengindikasikan ada jurnal yang tidak seimbang lolos validasi — seharusnya tidak mungkin terjadi), tampilkan banner peringatan merah di atas laporan.

### 5.8 Ekspor & Format

- Laba Rugi dan Neraca dapat diekspor ke Excel (`exceljs`, pola yang sama dengan modul Laporan POS yang sudah ada di `/api/laporan/[jenis]/export`).
- PDF tidak termasuk fase ini (konsisten dengan keputusan yang sama di PRD Sistem Setup — cetak memakai *browser print API* untuk kebutuhan cetak cepat).

---

## 6. Skema Database (Prisma Schema)

### 6.1 Entity Relationship Diagram (Ringkasan)

```
EventLog (sudah ada) ──< dibaca oleh >── EventConsumerService
                                                  │
                                                  ▼
Akun ──< JurnalLine >── JurnalEntry ──> User (dibuatOleh)
  │                          │
  │                          └──> JurnalEntry (self-relation: pembalik)
  │
  └──< PemetaanAkun
```

### 6.2 Prisma Schema Tambahan

```prisma
// Ditambahkan ke schema.prisma yang sudah ada — tidak mengubah model operasional.

enum TipeAkun {
  ASET
  LIABILITAS
  EKUITAS
  PENDAPATAN
  BEBAN
  HPP
}

enum SaldoNormal {
  DEBIT
  KREDIT
}

enum SumberJurnal {
  OTOMATIS
  MANUAL
}

enum StatusJurnal {
  POSTED
  DIBATALKAN
}

model Akun {
  id           String      @id @default(cuid())
  kode         String      @unique // "1-1000"
  nama         String
  tipe         TipeAkun
  saldoNormal  SaldoNormal
  indukAkunId  String?
  indukAkun    Akun?       @relation("SubAkun", fields: [indukAkunId], references: [id])
  subAkun      Akun[]      @relation("SubAkun")
  aktif        Boolean     @default(true)
  createdAt    DateTime    @default(now())

  jurnalLine     JurnalLine[]
  pemetaanAkun   PemetaanAkun[]

  @@map("akun")
}

model PemetaanAkun {
  id        String   @id @default(cuid())
  kunci     String   @unique // "KAS", "PERSEDIAAN", dst (lihat 5.2)
  akunId    String
  akun      Akun     @relation(fields: [akunId], references: [id])
  updatedAt DateTime @updatedAt

  @@map("pemetaan_akun")
}

model JurnalEntry {
  id                  String        @id @default(cuid())
  nomorJurnal         String        @unique // "JRN-20260629-0001"
  tanggal             DateTime
  keterangan          String
  sumber              SumberJurnal
  eventLogId          String?       @unique // null jika manual; unique agar 1 event = 1 jurnal
  dibuatOlehId        String
  dibuatOleh          User          @relation(fields: [dibuatOlehId], references: [id])
  status              StatusJurnal  @default(POSTED)
  jurnalPembalikDariId String?      @unique
  jurnalPembalikDari  JurnalEntry?  @relation("Pembalik", fields: [jurnalPembalikDariId], references: [id])
  jurnalPembalik      JurnalEntry?  @relation("Pembalik")
  createdAt           DateTime      @default(now())

  items JurnalLine[]

  @@map("jurnal_entry")
}

model JurnalLine {
  id            String      @id @default(cuid())
  jurnalEntryId String
  jurnalEntry   JurnalEntry @relation(fields: [jurnalEntryId], references: [id])
  akunId        String
  akun          Akun        @relation(fields: [akunId], references: [id])
  debit         Decimal     @default(0) @db.Decimal(14, 2)
  kredit        Decimal     @default(0) @db.Decimal(14, 2)
  keterangan    String?

  @@map("jurnal_line")
}
```

### 6.3 Catatan Implementasi Schema

- `EventLog` **tidak diubah** — modul ini hanya menambah relasi logis lewat `JurnalEntry.eventLogId` (disimpan sebagai string biasa, bukan foreign key formal ke tabel `EventLog`, supaya modul operasional tetap independen sesuai prinsip di 2.5 PRD Sistem Setup).
- Constraint `@unique` pada `eventLogId` dan `jurnalPembalikDariId` adalah penjaga idempotency yang disebut di 2.2 — secara skema, database sendiri yang menolak duplikasi, bukan hanya logic aplikasi.
- Seluruh nilai uang tetap `Decimal(14,2)`, konsisten dengan PRD Sistem Setup.

---

## 7. Struktur Folder Proyek

Mengikuti pola folder yang sama dengan modul-modul lain (route group `(app)`, service layer terpisah):

```
src/
├── app/(app)/akuntansi/
│   ├── coa/page.tsx                      # CRUD Chart of Account
│   ├── pemetaan/page.tsx                 # Konfigurasi Pemetaan Akun
│   ├── jurnal/
│   │   ├── page.tsx                      # Riwayat jurnal (otomatis + manual)
│   │   ├── antrian/page.tsx              # Antrian EventLog gagal/belum diproses
│   │   └── manual/baru/page.tsx          # Form jurnal manual
│   ├── buku-besar/[akunId]/page.tsx
│   ├── laba-rugi/page.tsx
│   └── neraca/page.tsx
├── app/api/cron/process-jurnal-otomatis/route.ts
├── services/
│   ├── akun.service.ts
│   ├── pemetaan-akun.service.ts
│   ├── jurnal.service.ts                 # jurnal manual + pembalik + buku besar
│   ├── event-consumer.service.ts         # jurnal otomatis dari EventLog
│   └── laporan-keuangan.service.ts       # laba rugi + neraca
└── validations/
    ├── akun.schema.ts
    └── jurnal.schema.ts
```

---

## 8. Non-Functional Requirements

| Aspek | Kebutuhan |
|---|---|
| Konsistensi Data | Setiap `JurnalEntry` + `JurnalLine` dibuat dalam satu `$transaction`; ditolak jika total debit ≠ total kredit |
| Idempotency | 1 `EventLog` → maksimal 1 `JurnalEntry` (dijaga unique constraint di level database) |
| Audit Trail | Jurnal tidak pernah di-hard-delete; koreksi hanya via jurnal pembalik yang saling mereferensikan |
| Keamanan | RBAC defense-in-depth (UI + Server Action) seperti seluruh modul lain; hanya Admin yang dapat menulis, Owner hanya membaca |
| Performa | Laba Rugi & Neraca dihitung on-the-fly dari `JurnalLine`; untuk skala toko ritel single-outlet dianggap cukup tanpa precomputed summary (berbeda dengan `RingkasanPenjualanHarian` di Laporan POS yang memang menangani volume baris jauh lebih besar) |
| Kompatibilitas | Tidak mengubah skema/behaviour modul operasional (POS/Pembelian/Inventory) yang sudah berjalan di production |

---

## 9. Roadmap Pengembangan

### Fase 1: Fondasi Akuntansi
- Schema `Akun`, `PemetaanAkun`, `JurnalEntry`, `JurnalLine` + migration
- CRUD Chart of Account + seed COA default
- Halaman Pemetaan Akun

### Fase 2: Jurnal Manual & Buku Besar
- Form Jurnal Manual + validasi balance
- Fitur jurnal pembalik
- Buku Besar per akun (search + pagination, konsisten pola tabel yang sudah ada)

### Fase 3: Jurnal Otomatis
- `EventConsumerService` + endpoint cron
- Halaman Antrian Jurnal Otomatis (sukses/gagal + retry)
- Uji seluruh 4 jenis event (`SALE_COMPLETED`, `PURCHASE_RECEIVED`, `STOCK_ADJUSTED`, `PURCHASE_PAID`*)

  *`PURCHASE_PAID` diuji dengan event simulasi karena trigger aslinya belum ada di modul Pembelian.

### Fase 4: Laporan Keuangan
- Laba Rugi + export Excel
- Neraca + validasi balance + export Excel
- Dashboard ringkas (opsional): kartu KPI Laba Bersih bulan ini, ditempatkan berdekatan dengan dashboard Laporan POS yang sudah ada

---

## 10. Pertanyaan Terbuka & Asumsi

### 10.1 Asumsi yang Digunakan dalam Dokumen Ini

- Tidak ada proses tutup buku (closing period) formal; seluruh laporan dihitung dari rentang tanggal secara real-time.
- Penjualan dianggap selalu tunai/instan dari sisi kas (Kas/Bank bertambah saat itu juga) — `PIUTANG_USAHA` disiapkan di COA namun belum ada alur bisnis di POS yang menghasilkan piutang member (member tetap bayar saat transaksi, hanya mendapat harga khusus, bukan kredit).
- Pajak (PPN) belum masuk ke jurnal otomatis, konsisten dengan asumsi PRD Sistem Setup bahwa toko belum dianggap PKP.

### 10.2 Hal yang Perlu Diklarifikasi Sebelum Development Dimulai

1. **Fitur "Bayar Hutang Supplier" belum ada** di modul Pembelian PRD Sistem Setup — event `PURCHASE_PAID` tidak akan pernah ter-trigger sampai fitur itu ditambahkan. Apakah perlu menyusun PRD tambahan kecil untuk modul Pembelian agar Admin bisa mencatat pelunasan hutang?
2. Apakah dibutuhkan role baru "Akuntan" yang terpisah dari Admin untuk pemisahan tugas (segregation of duties), atau Admin yang sama tetap memegang seluruh akses pembukuan?
3. Apakah Laba Rugi perlu pemisahan lebih detail (per kategori produk/kategori beban) di fase berikutnya, atau ringkasan per tipe akun sudah cukup untuk kebutuhan saat ini?
4. Apakah Neraca pembuka (saldo awal sebelum sistem ini dipakai) perlu diinput manual via Jurnal Manual tanggal awal, atau toko ini memang baru mulai pembukuan dari nol bersamaan dengan go-live POS?

---

*Dokumen ini melengkapi PRD Sistem Setup. Modul Akuntansi membaca `EventLog` secara asinkron tanpa mengubah skema atau perilaku modul operasional yang sudah berjalan.*
