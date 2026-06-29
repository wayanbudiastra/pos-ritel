import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ========== AGREGASI HARIAN (PRD 5.6.5) ==========

export async function aggregateHarian(date: Date) {
  const tanggal = startOfDay(date);
  const transaksiList = await prisma.transaksi.findMany({
    where: { status: "PAID", createdAt: { gte: tanggal, lte: endOfDay(date) } },
    include: { items: { include: { produk: true } } },
  });

  let totalRitel = 0;
  let totalGrosir = 0;
  let totalKhusus = 0;
  let totalModal = 0;
  let totalQtyTerjual = 0;
  let totalDiskon = 0;

  for (const t of transaksiList) {
    totalDiskon += Number(t.diskonTotal);
    for (const item of t.items) {
      const nilai = Number(item.subtotal);
      if (item.tipeHarga === "RITEL") totalRitel += nilai;
      else if (item.tipeHarga === "GROSIR") totalGrosir += nilai;
      else totalKhusus += nilai;

      totalModal += Number(item.produk.hpp) * item.qty;
      totalQtyTerjual += item.qty;
    }
  }

  const totalPenjualan = transaksiList.reduce(
    (sum, t) => sum + Number(t.total),
    0,
  );

  return prisma.ringkasanPenjualanHarian.upsert({
    where: { tanggal },
    update: {
      totalRitel,
      totalGrosir,
      totalKhusus,
      totalPenjualan,
      totalModal,
      totalDiskon,
      totalTransaksi: transaksiList.length,
      totalQtyTerjual,
    },
    create: {
      tanggal,
      totalRitel,
      totalGrosir,
      totalKhusus,
      totalPenjualan,
      totalModal,
      totalDiskon,
      totalTransaksi: transaksiList.length,
      totalQtyTerjual,
    },
  });
}

export async function backfillRingkasan(start: Date, end: Date) {
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  let count = 0;
  while (cursor <= last) {
    await aggregateHarian(cursor);
    cursor = addDays(cursor, 1);
    count++;
  }
  return count;
}

export function getRingkasanRange(start: Date, end: Date) {
  return prisma.ringkasanPenjualanHarian.findMany({
    where: { tanggal: { gte: startOfDay(start), lte: startOfDay(end) } },
    orderBy: { tanggal: "asc" },
  });
}

// ========== DASHBOARD KPI ==========

export async function getKpiDashboard(start: Date, end: Date) {
  const days = Math.max(
    1,
    Math.round(
      (startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000,
    ) + 1,
  );
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));

  const [current, previous] = await Promise.all([
    getRingkasanRange(start, end),
    getRingkasanRange(prevStart, prevEnd),
  ]);

  function summarize(rows: typeof current) {
    const totalPenjualan = rows.reduce(
      (s, r) => s + Number(r.totalPenjualan),
      0,
    );
    const totalTransaksi = rows.reduce((s, r) => s + r.totalTransaksi, 0);
    const totalModal = rows.reduce((s, r) => s + Number(r.totalModal), 0);
    const rataRata = totalTransaksi > 0 ? totalPenjualan / totalTransaksi : 0;
    const marginKotor = totalPenjualan - totalModal;
    return { totalPenjualan, totalTransaksi, rataRata, marginKotor };
  }

  const cur = summarize(current);
  const prev = summarize(previous);

  function pctChange(now: number, before: number) {
    if (before === 0) return now > 0 ? 100 : 0;
    return ((now - before) / before) * 100;
  }

  return {
    totalPenjualan: {
      value: cur.totalPenjualan,
      changePct: pctChange(cur.totalPenjualan, prev.totalPenjualan),
    },
    totalTransaksi: {
      value: cur.totalTransaksi,
      changePct: pctChange(cur.totalTransaksi, prev.totalTransaksi),
    },
    rataRata: {
      value: cur.rataRata,
      changePct: pctChange(cur.rataRata, prev.rataRata),
    },
    marginKotor: {
      value: cur.marginKotor,
      changePct: pctChange(cur.marginKotor, prev.marginKotor),
    },
  };
}

// ========== TOP PRODUK & SLOW-MOVING (PRD 5.6.2) ==========

export async function getTopProduk(
  start: Date,
  end: Date,
  kategoriId?: string,
) {
  const items = await prisma.transaksiItem.findMany({
    where: {
      transaksi: {
        status: "PAID",
        createdAt: { gte: startOfDay(start), lte: endOfDay(end) },
      },
      ...(kategoriId ? { produk: { kategoriId } } : {}),
    },
    select: {
      produkId: true,
      qty: true,
      subtotal: true,
      produk: { select: { nama: true } },
    },
  });

  const map = new Map<string, { nama: string; qty: number; nilai: number }>();
  for (const item of items) {
    const existing = map.get(item.produkId);
    if (existing) {
      existing.qty += item.qty;
      existing.nilai += Number(item.subtotal);
    } else {
      map.set(item.produkId, {
        nama: item.produk.nama,
        qty: item.qty,
        nilai: Number(item.subtotal),
      });
    }
  }

  const all = [...map.entries()].map(([produkId, v]) => ({ produkId, ...v }));
  return {
    byQty: [...all].sort((a, b) => b.qty - a.qty).slice(0, 10),
    byNilai: [...all].sort((a, b) => b.nilai - a.nilai).slice(0, 10),
  };
}

export async function getSlowMoving(days = 30) {
  const since = addDays(new Date(), -days);
  const produkList = await prisma.produk.findMany({
    where: { aktif: true },
    include: {
      transaksiItem: {
        where: { transaksi: { status: "PAID", createdAt: { gte: since } } },
        select: { qty: true },
      },
    },
  });

  return produkList
    .map((p) => ({
      produkId: p.id,
      nama: p.nama,
      qtyTerjual: p.transaksiItem.reduce((sum, i) => sum + i.qty, 0),
      stok: p.stok,
    }))
    .sort((a, b) => a.qtyTerjual - b.qtyTerjual)
    .slice(0, 10);
}

// ========== ANALISIS MEMBER (PRD 5.6.2) ==========

export async function getMemberAnalytics(start: Date, end: Date) {
  const transaksiList = await prisma.transaksi.findMany({
    where: {
      status: "PAID",
      memberId: { not: null },
      createdAt: { gte: startOfDay(start), lte: endOfDay(end) },
    },
    include: { member: true, items: true },
  });

  const map = new Map<
    string,
    {
      nama: string;
      kodeMember: string;
      totalBelanja: number;
      frekuensi: number;
      itemKhusus: number;
      itemTotal: number;
    }
  >();

  for (const t of transaksiList) {
    if (!t.member) continue;
    const existing = map.get(t.member.id);
    const itemKhusus = t.items.filter((i) => i.tipeHarga === "KHUSUS").length;
    if (existing) {
      existing.totalBelanja += Number(t.total);
      existing.frekuensi += 1;
      existing.itemKhusus += itemKhusus;
      existing.itemTotal += t.items.length;
    } else {
      map.set(t.member.id, {
        nama: t.member.nama,
        kodeMember: t.member.kodeMember,
        totalBelanja: Number(t.total),
        frekuensi: 1,
        itemKhusus,
        itemTotal: t.items.length,
      });
    }
  }

  return [...map.entries()]
    .map(([memberId, v]) => ({
      memberId,
      ...v,
      efektivitasHargaKhusus:
        v.itemTotal > 0 ? (v.itemKhusus / v.itemTotal) * 100 : 0,
    }))
    .sort((a, b) => b.totalBelanja - a.totalBelanja)
    .slice(0, 10);
}

// ========== PERFORMA KASIR (PRD 5.6.2) ==========

export async function getPerformaKasir(start: Date, end: Date) {
  const transaksiList = await prisma.transaksi.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: startOfDay(start), lte: endOfDay(end) },
    },
    include: { kasir: { select: { nama: true } } },
  });

  const map = new Map<
    string,
    { nama: string; totalTransaksi: number; totalPenjualan: number }
  >();
  for (const t of transaksiList) {
    const existing = map.get(t.kasirId);
    if (existing) {
      existing.totalTransaksi += 1;
      existing.totalPenjualan += Number(t.total);
    } else {
      map.set(t.kasirId, {
        nama: t.kasir.nama,
        totalTransaksi: 1,
        totalPenjualan: Number(t.total),
      });
    }
  }

  return [...map.entries()]
    .map(([kasirId, v]) => ({ kasirId, ...v }))
    .sort((a, b) => b.totalPenjualan - a.totalPenjualan);
}

// ========== LAPORAN DETAIL (DRILL-DOWN, PRD 5.6.3) ==========

export async function getLaporanPenjualan(filters: {
  start: Date;
  end: Date;
  kasirId?: string;
  tipeHarga?: string;
  memberId?: string;
}) {
  return prisma.transaksiItem.findMany({
    where: {
      transaksi: {
        status: "PAID",
        createdAt: {
          gte: startOfDay(filters.start),
          lte: endOfDay(filters.end),
        },
        ...(filters.kasirId ? { kasirId: filters.kasirId } : {}),
        ...(filters.memberId ? { memberId: filters.memberId } : {}),
      },
      ...(filters.tipeHarga ? { tipeHarga: filters.tipeHarga } : {}),
    },
    include: {
      produk: { select: { nama: true, sku: true } },
      transaksi: {
        select: {
          nomorTransaksi: true,
          createdAt: true,
          kasir: { select: { nama: true } },
          member: { select: { nama: true } },
        },
      },
    },
    orderBy: { transaksi: { createdAt: "desc" } },
    take: 100,
  });
}

export async function getLaporanMargin(start: Date, end: Date) {
  const items = await prisma.transaksiItem.findMany({
    where: {
      transaksi: {
        status: "PAID",
        createdAt: { gte: startOfDay(start), lte: endOfDay(end) },
      },
    },
    include: { produk: { include: { kategori: true } } },
  });

  const map = new Map<
    string,
    {
      nama: string;
      kategori: string;
      qty: number;
      penjualan: number;
      modal: number;
    }
  >();

  for (const item of items) {
    const existing = map.get(item.produkId);
    const penjualan = Number(item.subtotal);
    const modal = Number(item.produk.hpp) * item.qty;
    if (existing) {
      existing.qty += item.qty;
      existing.penjualan += penjualan;
      existing.modal += modal;
    } else {
      map.set(item.produkId, {
        nama: item.produk.nama,
        kategori: item.produk.kategori.nama,
        qty: item.qty,
        penjualan,
        modal,
      });
    }
  }

  return [...map.entries()]
    .map(([produkId, v]) => ({ produkId, ...v, margin: v.penjualan - v.modal }))
    .sort((a, b) => b.margin - a.margin);
}

export async function getLaporanStok() {
  const produkList = await prisma.produk.findMany({
    where: { aktif: true },
    include: { kategori: true },
    orderBy: { nama: "asc" },
  });

  return produkList.map((p) => ({
    produkId: p.id,
    sku: p.sku,
    nama: p.nama,
    kategori: p.kategori.nama,
    stok: p.stok,
    stokMinimum: p.stokMinimum,
    hpp: Number(p.hpp),
    nilaiStok: p.stok * Number(p.hpp),
    perluReorder: p.stok <= p.stokMinimum,
  }));
}

export async function getLaporanPembelian(start: Date, end: Date) {
  const poList = await prisma.purchaseOrder.findMany({
    where: { createdAt: { gte: startOfDay(start), lte: endOfDay(end) } },
    include: {
      supplier: true,
      grn: { include: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return poList.map((po) => ({
    poId: po.id,
    nomorPO: po.nomorPO,
    supplier: po.supplier.nama,
    status: po.status,
    totalNilai: Number(po.totalNilai),
    jumlahGrn: po.grn.length,
    adaDiskrepansi: po.grn.some((g) => g.items.some((i) => i.adaDiskrepansi)),
    createdAt: po.createdAt,
  }));
}
