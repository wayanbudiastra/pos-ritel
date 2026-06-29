// Seeder transaksi POS + PO/GRN khusus bulan Juni 2026, ditulis lewat service
// layer asli (checkout, createPO/submitPO/approvePO, createGRN) supaya
// EventLog & Jurnal Otomatis (modul akuntansi) ikut terisi dengan data nyata.
//
// Setiap dijalankan, skrip ini akan:
// 1. Menghapus seluruh Transaksi/PO/GRN (dan turunannya) yang createdAt-nya
//    jatuh di bulan Juni 2026, lalu menghitung ulang stok & HPP produk persis
//    seperti seandainya data Juni itu tidak pernah ada (replay KartuStok yang
//    tersisa secara kronologis).
// 2. Mengisi ulang Juni 2026 dengan transaksi POS & PO baru, dikalibrasi agar
//    total penjualan + total nilai PO mendekati Rp200.000.000.
// 3. Memproses seluruh EventLog yang baru dibuat lewat EventConsumerService
//    agar Jurnal Otomatis (dan Laba Rugi/Neraca) langsung mencerminkan data ini.
import { prisma } from "../src/lib/prisma";
import { checkout, resolveHarga } from "../src/services/sales.service";
import { bukaSesi, tutupSesi } from "../src/services/sesi-kasir.service";
import { createPO, submitPO, approvePO } from "../src/services/purchase.service";
import { createGRN } from "../src/services/grn.service";
import { processEventLog } from "../src/services/event-consumer.service";

const JUNE_START = new Date(2026, 5, 1, 0, 0, 0, 0);
const JULY_START = new Date(2026, 6, 1, 0, 0, 0, 0);

// Baseline stok & HPP awal produk (sama dengan prisma/seed-transaksi.ts),
// dipakai untuk replay KartuStok di luar Juni demi menghitung ulang stok/HPP
// yang benar setelah data Juni dihapus.
const BASELINE_BY_SKU = new Map<string, { stok: number; hpp: number }>([
  ["SKU-0001", { stok: 150, hpp: 62000 }],
  ["SKU-0002", { stok: 300, hpp: 15000 }],
  ["SKU-0003", { stok: 600, hpp: 2000 }],
  ["SKU-0004", { stok: 250, hpp: 14000 }],
  ["SKU-0005", { stok: 150, hpp: 26000 }],
  ["SKU-0006", { stok: 80, hpp: 88000 }],
  ["SKU-0007", { stok: 120, hpp: 31000 }],
  ["SKU-0008", { stok: 200, hpp: 11000 }],
  ["SKU-0009", { stok: 180, hpp: 22000 }],
  ["SKU-0010", { stok: 300, hpp: 5000 }],
  ["SKU-0011", { stok: 200, hpp: 12000 }],
  ["SKU-0012", { stok: 100, hpp: 19000 }],
]);

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}
function chance(probability: number) {
  return Math.random() < probability;
}
function atTime(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ---------- Langkah 1: hapus data Juni & hitung ulang stok/HPP ----------
async function wipeJuniDanHitungUlangStok() {
  const juneTransaksi = await prisma.transaksi.findMany({
    where: { createdAt: { gte: JUNE_START, lt: JULY_START } },
    select: { id: true },
  });
  const juneTransaksiIds = juneTransaksi.map((t) => t.id);

  const junePO = await prisma.purchaseOrder.findMany({
    where: { createdAt: { gte: JUNE_START, lt: JULY_START } },
    select: { id: true },
  });
  const junePoIds = junePO.map((p) => p.id);

  const juneGrn = await prisma.gRN.findMany({
    where: { poId: { in: junePoIds } },
    select: { id: true },
  });
  const juneGrnIds = juneGrn.map((g) => g.id);

  const juneSesi = await prisma.sesiKasir.findMany({
    where: { dibukaPada: { gte: JUNE_START, lt: JULY_START } },
    select: { id: true },
  });
  const juneSesiIds = juneSesi.map((s) => s.id);

  const juneEventLogs = await prisma.eventLog.findMany({
    where: {
      OR: [
        { eventType: "SALE_COMPLETED", referensiId: { in: juneTransaksiIds } },
        { eventType: "PURCHASE_RECEIVED", referensiId: { in: juneGrnIds } },
      ],
    },
    select: { id: true },
  });
  const juneEventLogIds = juneEventLogs.map((e) => e.id);

  console.log(
    `Menghapus data Juni 2026: ${juneTransaksiIds.length} transaksi, ${junePoIds.length} PO, ${juneGrnIds.length} GRN, ${juneSesiIds.length} sesi kasir, ${juneEventLogIds.length} event log.`,
  );

  // ---- Hitung ulang stok & HPP: replay seluruh KartuStok yang TIDAK terkait data Juni ----
  const produkList = await prisma.produk.findMany();
  const runningStok = new Map<string, number>();
  const runningHpp = new Map<string, number>();
  for (const p of produkList) {
    const baseline = BASELINE_BY_SKU.get(p.sku);
    runningStok.set(p.id, baseline?.stok ?? p.stok);
    runningHpp.set(p.id, baseline?.hpp ?? Number(p.hpp));
  }

  const keptKartuStok = await prisma.kartuStok.findMany({
    where: {
      NOT: {
        OR: [
          { referensiTipe: "TRANSAKSI", referensiId: { in: juneTransaksiIds } },
          { referensiTipe: "GRN", referensiId: { in: juneGrnIds } },
        ],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grnIdsTerpakai = [...new Set(keptKartuStok.filter((k) => k.jenisPergerakan === "PENERIMAAN_GRN").map((k) => k.referensiId))];
  const grnItemRows = await prisma.gRNItem.findMany({ where: { grnId: { in: grnIdsTerpakai } } });
  const hargaAktualMap = new Map(grnItemRows.map((g) => [`${g.grnId}:${g.produkId}`, Number(g.hargaAktual)]));

  for (const row of keptKartuStok) {
    const stokSebelum = runningStok.get(row.produkId) ?? 0;
    const stokSesudah = stokSebelum + row.qty;
    if (row.jenisPergerakan === "PENERIMAAN_GRN" && stokSesudah > 0) {
      const hargaAktual = hargaAktualMap.get(`${row.referensiId}:${row.produkId}`);
      if (hargaAktual !== undefined) {
        const hppLama = runningHpp.get(row.produkId) ?? 0;
        runningHpp.set(row.produkId, (stokSebelum * hppLama + row.qty * hargaAktual) / stokSesudah);
      }
    }
    runningStok.set(row.produkId, stokSesudah);
  }

  // ---- Hapus (urutan menghormati foreign key) ----
  await prisma.jurnalLine.deleteMany({ where: { jurnalEntry: { eventLogId: { in: juneEventLogIds } } } });
  await prisma.jurnalEntry.deleteMany({ where: { eventLogId: { in: juneEventLogIds } } });
  await prisma.eventLog.deleteMany({ where: { id: { in: juneEventLogIds } } });
  await prisma.kartuStok.deleteMany({
    where: {
      OR: [
        { referensiTipe: "TRANSAKSI", referensiId: { in: juneTransaksiIds } },
        { referensiTipe: "GRN", referensiId: { in: juneGrnIds } },
      ],
    },
  });
  await prisma.transaksiItem.deleteMany({ where: { transaksiId: { in: juneTransaksiIds } } });
  await prisma.transaksi.deleteMany({ where: { id: { in: juneTransaksiIds } } });
  await prisma.sesiKasir.deleteMany({ where: { id: { in: juneSesiIds } } });
  await prisma.gRNItem.deleteMany({ where: { grnId: { in: juneGrnIds } } });
  await prisma.gRN.deleteMany({ where: { id: { in: juneGrnIds } } });
  await prisma.pOItem.deleteMany({ where: { poId: { in: junePoIds } } });
  await prisma.purchaseOrder.deleteMany({ where: { id: { in: junePoIds } } });

  for (const p of produkList) {
    await prisma.produk.update({
      where: { id: p.id },
      data: { stok: runningStok.get(p.id)!, hpp: runningHpp.get(p.id)! },
    });
  }

  console.log("Data Juni lama dihapus, stok & HPP produk dihitung ulang ke kondisi sebelum Juni.\n");
}

async function main() {
  await wipeJuniDanHitungUlangStok();

  const users = await prisma.user.findMany();
  const kasirList = users.filter((u) => u.role === "KASIR");
  const admin = users.find((u) => u.role === "ADMIN")!;
  const gudang = users.find((u) => u.role === "GUDANG")!;

  const supplierList = await prisma.supplier.findMany();
  const memberList = await prisma.member.findMany();
  const hargaKhususList = await prisma.hargaKhusus.findMany({ where: { status: "AKTIF" } });
  const hargaKhususMap = new Map<string, Map<string, number>>();
  for (const hk of hargaKhususList) {
    if (!hargaKhususMap.has(hk.memberId)) hargaKhususMap.set(hk.memberId, new Map());
    hargaKhususMap.get(hk.memberId)!.set(hk.produkId, Number(hk.hargaKhusus));
  }

  let supplierIdx = 0;
  let totalPOValue = 0;
  let totalPOSValue = 0;

  async function backdate(model: { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> }, id: string, data: Record<string, unknown>) {
    await model.update({ where: { id }, data });
  }

  async function restock(day: Date) {
    const produkList = await prisma.produk.findMany();
    const supplier = supplierList[supplierIdx % supplierList.length];
    supplierIdx++;

    // Restock seluruh produk tiap siklus (bukan hanya yang stoknya rendah),
    // supaya nilai PO bulanan dapat dikalibrasi mendekati target gabungan.
    const kandidat = produkList;

    const items = kandidat.map((p) => {
      const qtyPesan = randomInt(p.stokMinimum * 2, p.stokMinimum * 3);
      const hargaBeli = Math.round(Number(p.hpp) * (1 + (Math.random() * 0.06 - 0.03)));
      return { produkId: p.id, qtyPesan, hargaBeli };
    });

    const po = await createPO({ supplierId: supplier.id, items }, gudang.id);
    let status: string = (await submitPO(po.id)).status;
    if (status === "DIAJUKAN") {
      status = (await approvePO(po.id)).status;
    }

    const poFresh = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: po.id }, include: { items: true } });
    const grn = await createGRN(
      {
        poId: po.id,
        items: poFresh.items.map((it) => ({
          poItemId: it.id,
          produkId: it.produkId,
          qtyDiterima: it.qtyPesan,
          qtyDitolak: 0,
          hargaAktual: Number(it.hargaBeli),
        })),
      },
      gudang.id,
    );

    const tanggalPO = atTime(day, 9, 0);
    const tanggalGRN = atTime(day, 14, 0);

    await backdate(prisma.purchaseOrder, po.id, { createdAt: tanggalPO, updatedAt: tanggalGRN, disetujuiPada: tanggalPO });
    await backdate(prisma.gRN, grn.id, { createdAt: tanggalGRN });
    await prisma.kartuStok.updateMany({ where: { referensiTipe: "GRN", referensiId: grn.id }, data: { createdAt: tanggalGRN } });
    await prisma.eventLog.updateMany({ where: { eventType: "PURCHASE_RECEIVED", referensiId: grn.id }, data: { createdAt: tanggalGRN } });

    totalPOValue += Number(poFresh.totalNilai);
    console.log(`  Restock ${tanggalPO.toLocaleDateString("id-ID")}: PO ${po.nomorPO} senilai ${formatRupiah(Number(poFresh.totalNilai))} (${kandidat.length} produk).`);
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
  }

  console.log("Mulai mengisi transaksi POS & PO untuk Juni 2026...\n");

  for (let dayOfMonth = 1; dayOfMonth <= 30; dayOfMonth++) {
    const day = new Date(2026, 5, dayOfMonth);

    if (dayOfMonth === 1 || dayOfMonth === 11 || dayOfMonth === 21) {
      await restock(day);
    }

    const kasir = pick(kasirList);
    const sesi = await bukaSesi(kasir.id, 300000);

    const jumlahTransaksi = randomInt(13, 23);
    let totalHariIni = 0;

    for (let t = 0; t < jumlahTransaksi; t++) {
      const produkList = await prisma.produk.findMany({ where: { aktif: true } });
      const isGrosir = chance(0.22);
      const tipeTransaksi: "RITEL" | "GROSIR" = isGrosir ? "GROSIR" : "RITEL";
      const pakaiMember = chance(0.28);
      const member = pakaiMember ? pick(memberList) : null;
      const memberHargaKhusus = member ? hargaKhususMap.get(member.id) : undefined;

      const jumlahItem = isGrosir ? randomInt(1, 2) : randomInt(1, 4);
      const produkDipilih = new Set<string>();
      const cartItems: { produkId: string; qty: number }[] = [];

      for (let i = 0; i < jumlahItem; i++) {
        const produk = pick(produkList);
        if (produkDipilih.has(produk.id)) continue;

        const qty = isGrosir
          ? randomInt(produk.minQtyGrosir, produk.minQtyGrosir * 2)
          : randomInt(1, 6);
        if (produk.stok < qty + 5) continue; // sisakan buffer stok kecil

        produkDipilih.add(produk.id);
        cartItems.push({ produkId: produk.id, qty });
      }

      if (cartItems.length === 0) continue;

      const waktuTransaksi = atTime(day, randomInt(8, 20), randomInt(0, 59));
      const subtotalEstimasi = cartItems.reduce((sum, it) => {
        const produk = produkList.find((p) => p.id === it.produkId)!;
        const hargaKhususAktif = memberHargaKhusus?.get(it.produkId);
        const { harga } = resolveHarga(produk, it.qty, tipeTransaksi, hargaKhususAktif);
        return sum + harga * it.qty;
      }, 0);
      const diskonTotal = chance(0.1) ? Math.round(subtotalEstimasi * 0.05) : 0;
      const total = subtotalEstimasi - diskonTotal;
      const metodePembayaran = pick(["TUNAI", "TUNAI", "TUNAI", "TRANSFER", "QRIS", "KARTU"] as const);
      const jumlahDibayar = metodePembayaran === "TUNAI" ? Math.ceil(total / 5000) * 5000 : total;

      try {
        const transaksi = await checkout(
          {
            sesiKasirId: sesi.id,
            tipeTransaksi,
            memberId: member?.id,
            items: cartItems,
            diskonTotal,
            metodePembayaran,
            jumlahDibayar,
          },
          kasir.id,
          "KASIR",
        );

        await backdate(prisma.transaksi, transaksi.id, { createdAt: waktuTransaksi, updatedAt: waktuTransaksi });
        await prisma.kartuStok.updateMany({ where: { referensiTipe: "TRANSAKSI", referensiId: transaksi.id }, data: { createdAt: waktuTransaksi } });
        await prisma.eventLog.updateMany({ where: { eventType: "SALE_COMPLETED", referensiId: transaksi.id }, data: { createdAt: waktuTransaksi } });

        totalHariIni += Number(transaksi.total);
        totalPOSValue += Number(transaksi.total);
      } catch {
        // Stok berubah sejak cache awal hari diambil — lewati transaksi ini.
      }
    }

    await tutupSesi(sesi.id, 300000);
    await backdate(prisma.sesiKasir, sesi.id, { dibukaPada: atTime(day, 8, 0), ditutupPada: atTime(day, 20, 30) });

    console.log(`Hari ${day.toLocaleDateString("id-ID")}: ${jumlahTransaksi} transaksi diupayakan, omzet ${formatRupiah(totalHariIni)}.`);
  }

  console.log("\nMemproses Jurnal Otomatis dari seluruh EventLog baru...");
  let totalSukses = 0;
  let totalGagal = 0;
  while (true) {
    const hasil = await processEventLog(admin.id, 200);
    totalSukses += hasil.sukses;
    totalGagal += hasil.gagal.length;
    if (hasil.sukses === 0 && hasil.gagal.length === 0) break;
  }
  console.log(`Jurnal Otomatis: ${totalSukses} sukses, ${totalGagal} gagal.`);

  console.log("\n=== Ringkasan Juni 2026 ===");
  console.log("Total Penjualan POS :", formatRupiah(totalPOSValue));
  console.log("Total Nilai PO      :", formatRupiah(totalPOValue));
  console.log("Total Gabungan      :", formatRupiah(totalPOSValue + totalPOValue));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
