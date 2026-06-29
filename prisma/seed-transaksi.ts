import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import { resolveHarga } from "../src/services/sales.service";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

// ---------- util ----------
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}
function chance(probability: number) {
  return Math.random() < probability;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function atTime(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}
function formatDatePrefix(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// ---------- baseline master data ----------
const PRODUK_BASELINE = [
  { sku: "SKU-0001", barcode: "8990000000017", nama: "Beras Premium 5kg", kategori: "Sembako", satuan: "karung", hpp: 62000, hargaRitel: 68000, hargaGrosir: 65000, minQtyGrosir: 5, stok: 150, stokMinimum: 15 },
  { sku: "SKU-0002", barcode: "8990000000024", nama: "Minyak Goreng 1L", kategori: "Sembako", satuan: "botol", hpp: 15000, hargaRitel: 17000, hargaGrosir: 16000, minQtyGrosir: 12, stok: 300, stokMinimum: 25 },
  { sku: "SKU-0003", barcode: "8990000000031", nama: "Air Mineral 600ml", kategori: "Minuman", satuan: "botol", hpp: 2000, hargaRitel: 3000, hargaGrosir: 2500, minQtyGrosir: 24, stok: 600, stokMinimum: 60 },
  { sku: "SKU-0004", barcode: "8990000000048", nama: "Gula Pasir 1kg", kategori: "Sembako", satuan: "kg", hpp: 14000, hargaRitel: 16000, hargaGrosir: 15000, minQtyGrosir: 10, stok: 250, stokMinimum: 20 },
  { sku: "SKU-0005", barcode: "8990000000055", nama: "Telur Ayam 1kg", kategori: "Sembako", satuan: "kg", hpp: 26000, hargaRitel: 29000, hargaGrosir: 27500, minQtyGrosir: 10, stok: 150, stokMinimum: 15 },
  { sku: "SKU-0006", barcode: "8990000000062", nama: "Mie Instan (Dus isi 40)", kategori: "Sembako", satuan: "dus", hpp: 88000, hargaRitel: 98000, hargaGrosir: 92000, minQtyGrosir: 5, stok: 80, stokMinimum: 10 },
  { sku: "SKU-0007", barcode: "8990000000079", nama: "Kopi Sachet (Box isi 10)", kategori: "Minuman", satuan: "box", hpp: 31000, hargaRitel: 35000, hargaGrosir: 33000, minQtyGrosir: 8, stok: 120, stokMinimum: 12 },
  { sku: "SKU-0008", barcode: "8990000000086", nama: "Susu Kental Manis", kategori: "Minuman", satuan: "kaleng", hpp: 11000, hargaRitel: 13000, hargaGrosir: 12000, minQtyGrosir: 12, stok: 200, stokMinimum: 20 },
  { sku: "SKU-0009", barcode: "8990000000093", nama: "Deterjen Bubuk 1kg", kategori: "Rumah Tangga", satuan: "pcs", hpp: 22000, hargaRitel: 25000, hargaGrosir: 23500, minQtyGrosir: 10, stok: 180, stokMinimum: 15 },
  { sku: "SKU-0010", barcode: "8990000000109", nama: "Sabun Mandi Batang", kategori: "Rumah Tangga", satuan: "pcs", hpp: 5000, hargaRitel: 6000, hargaGrosir: 5500, minQtyGrosir: 20, stok: 300, stokMinimum: 30 },
  { sku: "SKU-0011", barcode: "8990000000116", nama: "Pasta Gigi 150g", kategori: "Rumah Tangga", satuan: "pcs", hpp: 12000, hargaRitel: 14000, hargaGrosir: 13000, minQtyGrosir: 15, stok: 200, stokMinimum: 20 },
  { sku: "SKU-0012", barcode: "8990000000123", nama: "Galon Air Mineral 19L", kategori: "Minuman", satuan: "galon", hpp: 19000, hargaRitel: 22000, hargaGrosir: 20500, minQtyGrosir: 5, stok: 100, stokMinimum: 10 },
];

const SUPPLIER_BASELINE = [
  { id: "supplier-demo", nama: "PT Sumber Rejeki Distribusi", kontakPerson: "Budi Santoso", telepon: "081234567890", alamat: "Jl. Industri No. 10, Jakarta" },
  { id: "supplier-demo-2", nama: "CV Mitra Pangan Sejahtera", kontakPerson: "Yusuf Hidayat", telepon: "081298765432", alamat: "Jl. Raya Bekasi No. 25, Bekasi" },
];

const MEMBER_BASELINE = [
  { kodeMember: "MBR-000001", nama: "Siti Rahayu", noHp: "081200000001", email: "siti.rahayu@demo.test" },
  { kodeMember: "MBR-000002", nama: "Budi Hartono", noHp: "081200000002", email: "budi.hartono@demo.test" },
  { kodeMember: "MBR-000003", nama: "Dewi Lestari", noHp: "081200000003", email: "dewi.lestari@demo.test" },
  { kodeMember: "MBR-000004", nama: "Agus Wijaya", noHp: "081200000004", email: "agus.wijaya@demo.test" },
  { kodeMember: "MBR-000005", nama: "Rina Marlina", noHp: "081200000005", email: "rina.marlina@demo.test" },
];

async function setupMasterData() {
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.createMany({
    data: [
      { nama: "Owner Demo", email: "owner@demo.test", passwordHash, role: "OWNER" },
      { nama: "Admin Demo", email: "admin@demo.test", passwordHash, role: "ADMIN" },
      { nama: "Kasir Demo", email: "kasir@demo.test", passwordHash, role: "KASIR" },
      { nama: "Kasir Dua", email: "kasir2@demo.test", passwordHash, role: "KASIR" },
      { nama: "Gudang Demo", email: "gudang@demo.test", passwordHash, role: "GUDANG" },
    ],
    skipDuplicates: true,
  });

  const kategoriMap = new Map<string, string>();
  for (const nama of ["Sembako", "Minuman", "Rumah Tangga"]) {
    const k = await prisma.kategori.upsert({ where: { nama }, update: {}, create: { nama } });
    kategoriMap.set(nama, k.id);
  }

  for (const p of PRODUK_BASELINE) {
    await prisma.produk.upsert({
      where: { sku: p.sku },
      update: {
        stok: p.stok,
        hpp: p.hpp,
        hargaRitel: p.hargaRitel,
        hargaGrosir: p.hargaGrosir,
        minQtyGrosir: p.minQtyGrosir,
        stokMinimum: p.stokMinimum,
        aktif: true,
      },
      create: {
        sku: p.sku,
        barcode: p.barcode,
        nama: p.nama,
        kategoriId: kategoriMap.get(p.kategori)!,
        satuan: p.satuan,
        hpp: p.hpp,
        hargaRitel: p.hargaRitel,
        hargaGrosir: p.hargaGrosir,
        minQtyGrosir: p.minQtyGrosir,
        stok: p.stok,
        stokMinimum: p.stokMinimum,
      },
    });
  }

  for (const s of SUPPLIER_BASELINE) {
    await prisma.supplier.upsert({ where: { id: s.id }, update: {}, create: s });
  }

  for (const m of MEMBER_BASELINE) {
    await prisma.member.upsert({ where: { noHp: m.noHp }, update: {}, create: m });
  }

  console.log("Master data siap.");
}

async function wipeTransactionalData() {
  await prisma.kartuStok.deleteMany({});
  await prisma.transaksiItem.deleteMany({});
  await prisma.transaksi.deleteMany({});
  await prisma.sesiKasir.deleteMany({});
  await prisma.gRNItem.deleteMany({});
  await prisma.gRN.deleteMany({});
  await prisma.pOItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.stokOpnameItem.deleteMany({});
  await prisma.stokOpname.deleteMany({});
  await prisma.hargaKhususLog.deleteMany({});
  await prisma.hargaKhusus.deleteMany({});
  console.log("Data transaksi lama (termasuk sisa skrip verifikasi Fase 2-3) dibersihkan.");
}

async function main() {
  await setupMasterData();
  await wipeTransactionalData();

  const users = await prisma.user.findMany();
  const kasirList = users.filter((u) => u.role === "KASIR");
  const admin = users.find((u) => u.role === "ADMIN")!;
  const gudang = users.find((u) => u.role === "GUDANG")!;

  const produkList = await prisma.produk.findMany();
  const supplierList = await prisma.supplier.findMany();
  const memberList = await prisma.member.findMany();

  // Harga khusus untuk beberapa member (PRD 5.2.3).
  const produkBySku = new Map(produkList.map((p) => [p.sku, p]));
  const memberByKode = new Map(memberList.map((m) => [m.kodeMember, m]));
  const hargaKhususSeed: { member: string; sku: string; harga: number }[] = [
    { member: "MBR-000001", sku: "SKU-0003", harga: 2200 },
    { member: "MBR-000001", sku: "SKU-0001", harga: 64000 },
    { member: "MBR-000002", sku: "SKU-0006", harga: 89000 },
    { member: "MBR-000003", sku: "SKU-0009", harga: 22500 },
  ];
  for (const hk of hargaKhususSeed) {
    await prisma.hargaKhusus.create({
      data: {
        memberId: memberByKode.get(hk.member)!.id,
        produkId: produkBySku.get(hk.sku)!.id,
        hargaKhusus: hk.harga,
        status: "AKTIF",
      },
    });
    await prisma.hargaKhususLog.create({
      data: {
        memberId: memberByKode.get(hk.member)!.id,
        produkId: produkBySku.get(hk.sku)!.id,
        hargaBaru: hk.harga,
        diubahOlehId: admin.id,
      },
    });
  }
  console.log(`Harga khusus dibuat: ${hargaKhususSeed.length} entri.`);

  // hargaKhususMap[memberId][produkId] = harga
  const hargaKhususMap = new Map<string, Map<string, number>>();
  for (const hk of hargaKhususSeed) {
    const memberId = memberByKode.get(hk.member)!.id;
    const produkId = produkBySku.get(hk.sku)!.id;
    if (!hargaKhususMap.has(memberId)) hargaKhususMap.set(memberId, new Map());
    hargaKhususMap.get(memberId)!.set(produkId, hk.harga);
  }

  // State stok/HPP in-memory selama simulasi (mulai dari baseline yang sudah di-set di Produk).
  const stokState = new Map(produkList.map((p) => [p.id, { stok: p.stok, hpp: Number(p.hpp) }]));
  const produkInfo = new Map(
    produkList.map((p) => [
      p.id,
      {
        nama: p.nama,
        hargaRitel: Number(p.hargaRitel),
        hargaGrosir: Number(p.hargaGrosir),
        minQtyGrosir: p.minQtyGrosir,
        hargaBeliDasar: Number(p.hpp),
      },
    ])
  );

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 3 bulan kalender (termasuk bulan ini)
  const totalHari = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const monthlyTotal = new Map<string, number>();
  const allTransaksiItems: { id: string; produkId: string; qty: number; createdAt: Date }[] = [];

  const poCounterByPrefix = new Map<string, number>();
  const grnCounterByPrefix = new Map<string, number>();
  const soCounterByPrefix = new Map<string, number>();
  const trxCounterByPrefix = new Map<string, number>();

  function nextNomor(map: Map<string, number>, prefix: string, label: string) {
    const n = (map.get(prefix) ?? 0) + 1;
    map.set(prefix, n);
    return `${label}-${prefix}-${String(n).padStart(4, "0")}`;
  }

  let supplierIdx = 0;

  async function restock(date: Date) {
    const supplier = supplierList[supplierIdx % supplierList.length];
    supplierIdx++;

    const items = produkList.map((p) => {
      const info = produkInfo.get(p.id)!;
      const qtyPesan = randomInt(p.stokMinimum * 6, p.stokMinimum * 12);
      const hargaBeli = Math.round(info.hargaBeliDasar * (1 + (Math.random() * 0.06 - 0.03)));
      return { produkId: p.id, qtyPesan, hargaBeli };
    });
    const totalNilai = items.reduce((sum, i) => sum + i.qtyPesan * i.hargaBeli, 0);

    const prefix = formatDatePrefix(date);
    const nomorPO = nextNomor(poCounterByPrefix, prefix, "PO");

    const po = await prisma.purchaseOrder.create({
      data: {
        nomorPO,
        supplierId: supplier.id,
        dibuatOlehId: gudang.id,
        totalNilai,
        status: "DISETUJUI",
        disetujuiPada: date,
        createdAt: date,
        updatedAt: date,
        items: { create: items.map((i) => ({ produkId: i.produkId, qtyPesan: i.qtyPesan, hargaBeli: i.hargaBeli, qtyDiterima: i.qtyPesan })) },
      },
      include: { items: true },
    });

    const nomorGRN = nextNomor(grnCounterByPrefix, prefix, "GRN");
    const grnDate = addDays(date, 1);
    const grn = await prisma.gRN.create({
      data: {
        nomorGRN,
        poId: po.id,
        diterimaOlehId: gudang.id,
        catatan: "Penerimaan rutin restock",
        createdAt: grnDate,
      },
    });

    const kartuStokRows: Prisma.KartuStokCreateManyInput[] = [];
    for (const item of items) {
      await prisma.gRNItem.create({
        data: {
          grnId: grn.id,
          produkId: item.produkId,
          qtyDiterima: item.qtyPesan,
          hargaAktual: item.hargaBeli,
          adaDiskrepansi: false,
        },
      });

      const state = stokState.get(item.produkId)!;
      const stokSebelum = state.stok;
      const stokSesudah = stokSebelum + item.qtyPesan;
      const hppBaru = (stokSebelum * state.hpp + item.qtyPesan * item.hargaBeli) / stokSesudah;
      state.stok = stokSesudah;
      state.hpp = hppBaru;

      kartuStokRows.push({
        produkId: item.produkId,
        jenisPergerakan: "PENERIMAAN_GRN",
        qty: item.qtyPesan,
        stokSebelum,
        stokSesudah,
        referensiTipe: "GRN",
        referensiId: grn.id,
        userId: gudang.id,
        createdAt: grnDate,
      });
    }
    await prisma.kartuStok.createMany({ data: kartuStokRows });
    await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: "SELESAI" } });
  }

  async function stokOpname(date: Date) {
    const prefix = formatDatePrefix(date);
    const nomorOpname = nextNomor(soCounterByPrefix, prefix, "SO");

    const items = produkList.map((p) => {
      const state = stokState.get(p.id)!;
      const selisih = chance(0.25) ? randomInt(-3, 3) : 0;
      return { produkId: p.id, stokSistem: state.stok, selisih };
    });

    const opname = await prisma.stokOpname.create({
      data: {
        nomorOpname,
        lingkup: "SEMUA",
        dibuatOlehId: gudang.id,
        createdAt: date,
        items: {
          create: items.map((i) => ({
            produkId: i.produkId,
            stokSistem: i.stokSistem,
            stokFisik: i.stokSistem + i.selisih,
            selisih: i.selisih,
            alasanKode: i.selisih === 0 ? null : i.selisih > 0 ? "DITEMUKAN" : "HILANG",
          })),
        },
      },
    });

    const totalNilaiSelisih = items.reduce((sum, i) => {
      const hpp = stokState.get(i.produkId)!.hpp;
      return sum + Math.abs(i.selisih) * hpp;
    }, 0);

    const butuhApproval = totalNilaiSelisih > 500_000;
    const selesaiPada = butuhApproval ? addDays(date, 2) : date;

    const kartuStokRows: Prisma.KartuStokCreateManyInput[] = [];
    for (const i of items) {
      if (i.selisih === 0) continue;
      const state = stokState.get(i.produkId)!;
      const stokSebelum = state.stok;
      const stokSesudah = stokSebelum + i.selisih;
      state.stok = stokSesudah;
      kartuStokRows.push({
        produkId: i.produkId,
        jenisPergerakan: "PENYESUAIAN_OPNAME",
        qty: i.selisih,
        stokSebelum,
        stokSesudah,
        referensiTipe: "STOK_OPNAME",
        referensiId: opname.id,
        userId: butuhApproval ? admin.id : gudang.id,
        catatan: i.selisih > 0 ? "DITEMUKAN" : "HILANG",
        createdAt: selesaiPada,
      });
    }
    if (kartuStokRows.length > 0) {
      await prisma.kartuStok.createMany({ data: kartuStokRows });
    }
    await prisma.stokOpname.update({
      where: { id: opname.id },
      data: { status: "SELESAI", selesaiPada },
    });
  }

  console.log(`Mulai simulasi ${totalHari} hari (${start.toLocaleDateString("id-ID")} s/d ${today.toLocaleDateString("id-ID")})...`);

  for (let dayOffset = 0; dayOffset <= totalHari; dayOffset++) {
    const day = addDays(start, dayOffset);
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`;

    if (dayOffset % 7 === 0) {
      await restock(day);
    }
    if (dayOffset === 28 || dayOffset === 60) {
      await stokOpname(day);
    }

    const kasir = pick(kasirList);
    const sesi = await prisma.sesiKasir.create({
      data: {
        userId: kasir.id,
        modalAwal: 300000,
        totalKasAkhir: null,
        dibukaPada: atTime(day, 8, 0),
        ditutupPada: atTime(day, 20, 30),
      },
    });

    const jumlahTransaksi = randomInt(8, 15);
    const prefix = formatDatePrefix(day);
    const dayKartuStok: Prisma.KartuStokCreateManyInput[] = [];

    for (let t = 0; t < jumlahTransaksi; t++) {
      const isGrosir = chance(0.22);
      const tipeTransaksi: "RITEL" | "GROSIR" = isGrosir ? "GROSIR" : "RITEL";
      const pakaiMember = chance(0.28);
      const member = pakaiMember ? pick(memberList) : null;
      const memberHargaKhusus = member ? hargaKhususMap.get(member.id) : undefined;

      const jumlahItem = isGrosir ? randomInt(1, 2) : randomInt(1, 4);
      const produkDipilih = new Set<string>();
      const items: { produkId: string; qty: number; hargaSatuan: number; tipeHarga: string; subtotal: number }[] = [];

      for (let i = 0; i < jumlahItem; i++) {
        const produk = pick(produkList);
        if (produkDipilih.has(produk.id)) continue;
        produkDipilih.add(produk.id);

        const info = produkInfo.get(produk.id)!;
        const qty = isGrosir
          ? randomInt(info.minQtyGrosir, info.minQtyGrosir * 2)
          : randomInt(1, 6);

        const state = stokState.get(produk.id)!;
        if (state.stok < qty) continue; // lewati jika stok tidak cukup

        const hargaKhususAktif = memberHargaKhusus?.get(produk.id);
        const { harga, tipeHarga } = resolveHarga(
          { hargaRitel: info.hargaRitel, hargaGrosir: info.hargaGrosir, minQtyGrosir: info.minQtyGrosir },
          qty,
          tipeTransaksi,
          hargaKhususAktif
        );

        items.push({ produkId: produk.id, qty, hargaSatuan: harga, tipeHarga, subtotal: harga * qty });

        const stokSebelum = state.stok;
        const stokSesudah = stokSebelum - qty;
        state.stok = stokSesudah;
        dayKartuStok.push({
          produkId: produk.id,
          jenisPergerakan: "PENJUALAN",
          qty: -qty,
          stokSebelum,
          stokSesudah,
          referensiTipe: "TRANSAKSI",
          userId: kasir.id,
          createdAt: atTime(day, randomInt(8, 20), randomInt(0, 59)),
        });
      }

      if (items.length === 0) continue;

      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const diskonTotal = chance(0.1) ? Math.round(subtotal * 0.05) : 0;
      const total = subtotal - diskonTotal;
      const metodePembayaran = pick(["TUNAI", "TUNAI", "TUNAI", "TRANSFER", "QRIS", "KARTU"] as const);
      const jumlahDibayar = metodePembayaran === "TUNAI" ? Math.ceil(total / 5000) * 5000 : total;
      const waktuTransaksi = atTime(day, randomInt(8, 20), randomInt(0, 59));
      const nomorTransaksi = nextNomor(trxCounterByPrefix, prefix, "TRX");

      const transaksi = await prisma.transaksi.create({
        data: {
          nomorTransaksi,
          tipeTransaksi,
          memberId: member?.id,
          kasirId: kasir.id,
          sesiKasirId: sesi.id,
          subtotal,
          diskonTotal,
          total,
          metodePembayaran,
          jumlahDibayar,
          kembalian: jumlahDibayar - total,
          status: "PAID",
          createdAt: waktuTransaksi,
          updatedAt: waktuTransaksi,
          items: { create: items },
        },
        include: { items: true },
      });

      monthlyTotal.set(monthKey, (monthlyTotal.get(monthKey) ?? 0) + total);
      for (const item of transaksi.items) {
        allTransaksiItems.push({
          id: item.id,
          produkId: item.produkId,
          qty: item.qty,
          createdAt: waktuTransaksi,
        });
      }

      // Fix createdAt kartu stok yang baru ditambahkan untuk transaksi ini agar konsisten
      const lastN = items.length;
      for (let k = dayKartuStok.length - lastN; k < dayKartuStok.length; k++) {
        dayKartuStok[k].referensiId = transaksi.id;
        dayKartuStok[k].createdAt = waktuTransaksi;
      }
    }

    if (dayKartuStok.length > 0) {
      await prisma.kartuStok.createMany({ data: dayKartuStok });
    }

    await prisma.sesiKasir.update({
      where: { id: sesi.id },
      data: { totalKasAkhir: 300000 },
    });

    // Flush stok akhir hari untuk seluruh produk (sinkronisasi dari state in-memory).
    await Promise.all(
      produkList.map((p) => {
        const state = stokState.get(p.id)!;
        return prisma.produk.update({
          where: { id: p.id },
          data: { stok: state.stok, hpp: state.hpp },
        });
      })
    );

    if (dayOffset % 15 === 0) {
      console.log(`Hari ke-${dayOffset}/${totalHari} (${day.toLocaleDateString("id-ID")}) selesai.`);
    }
  }

  // ---------- Retur Penjualan (sampel kecil dari transaksi yang sudah lewat) ----------
  const kandidatRetur = allTransaksiItems.filter((i) => i.qty >= 2);
  const jumlahRetur = Math.min(20, Math.floor(kandidatRetur.length * 0.02));
  for (let i = 0; i < jumlahRetur; i++) {
    const item = pick(kandidatRetur);
    const transaksiItem = await prisma.transaksiItem.findUnique({ where: { id: item.id } });
    if (!transaksiItem || transaksiItem.qtyRetur > 0) continue;

    const qtyRetur = 1;
    await prisma.transaksiItem.update({
      where: { id: item.id },
      data: { qtyRetur },
    });

    const produk = await prisma.produk.findUniqueOrThrow({ where: { id: item.produkId } });
    const stokSesudah = produk.stok + qtyRetur;
    await prisma.produk.update({ where: { id: item.produkId }, data: { stok: stokSesudah } });

    const tanggalRetur = addDays(item.createdAt, randomInt(1, 5));
    await prisma.kartuStok.create({
      data: {
        produkId: item.produkId,
        jenisPergerakan: "RETUR_PENJUALAN",
        qty: qtyRetur,
        stokSebelum: produk.stok,
        stokSesudah,
        referensiTipe: "TRANSAKSI",
        referensiId: transaksiItem.transaksiId,
        userId: admin.id,
        catatan: "Retur sampel data demo",
        createdAt: tanggalRetur > today ? today : tanggalRetur,
      },
    });
  }
  console.log(`Retur penjualan dibuat: ${jumlahRetur} entri.`);

  console.log("\n=== Ringkasan Omzet Penjualan per Bulan ===");
  for (const [month, total] of [...monthlyTotal.entries()].sort()) {
    console.log(`${month}: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(total)}`);
  }
  const grandTotal = [...monthlyTotal.values()].reduce((a, b) => a + b, 0);
  const avgPerMonth = grandTotal / monthlyTotal.size;
  console.log(`Rata-rata per bulan: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(avgPerMonth)}`);
  console.log("\nSeeding transaksi Fase 1-3 selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
