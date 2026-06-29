import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import {
  getLaporanPenjualan,
  getLaporanMargin,
  getLaporanStok,
  getLaporanPembelian,
} from "@/services/laporan.service";

function formatRupiahNumber(value: number) {
  return Number(value.toFixed(2));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jenis: string }> },
) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !["OWNER", "ADMIN", "GUDANG"].includes(role)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const { jenis } = await params;
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start")
    ? new Date(searchParams.get("start")!)
    : new Date();
  const end = searchParams.get("end")
    ? new Date(searchParams.get("end")!)
    : new Date();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(jenis);

  if (jenis === "penjualan") {
    if (role === "GUDANG")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const kasirId = searchParams.get("kasirId") ?? undefined;
    const tipeHarga = searchParams.get("tipeHarga") ?? undefined;
    const memberId = searchParams.get("memberId") ?? undefined;
    const items = await getLaporanPenjualan({
      start,
      end,
      kasirId,
      tipeHarga,
      memberId,
    });

    sheet.columns = [
      { header: "No. Transaksi", key: "nomor", width: 22 },
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "Produk", key: "produk", width: 28 },
      { header: "SKU", key: "sku", width: 14 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Harga", key: "harga", width: 14 },
      { header: "Tipe Harga", key: "tipeHarga", width: 12 },
      { header: "Kasir", key: "kasir", width: 16 },
      { header: "Member", key: "member", width: 18 },
      { header: "Subtotal", key: "subtotal", width: 14 },
    ];
    for (const item of items) {
      sheet.addRow({
        nomor: item.transaksi.nomorTransaksi,
        tanggal: new Date(item.transaksi.createdAt).toLocaleString("id-ID"),
        produk: item.produk.nama,
        sku: item.produk.sku,
        qty: item.qty,
        harga: formatRupiahNumber(Number(item.hargaSatuan)),
        tipeHarga: item.tipeHarga,
        kasir: item.transaksi.kasir.nama,
        member: item.transaksi.member?.nama ?? "-",
        subtotal: formatRupiahNumber(Number(item.subtotal)),
      });
    }
  } else if (jenis === "margin") {
    if (role === "GUDANG")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const items = await getLaporanMargin(start, end);
    sheet.columns = [
      { header: "Produk", key: "nama", width: 28 },
      { header: "Kategori", key: "kategori", width: 18 },
      { header: "Qty Terjual", key: "qty", width: 12 },
      { header: "Penjualan", key: "penjualan", width: 16 },
      { header: "Modal (HPP)", key: "modal", width: 16 },
      { header: "Margin", key: "margin", width: 16 },
    ];
    for (const item of items) {
      sheet.addRow({
        nama: item.nama,
        kategori: item.kategori,
        qty: item.qty,
        penjualan: formatRupiahNumber(item.penjualan),
        modal: formatRupiahNumber(item.modal),
        margin: formatRupiahNumber(item.margin),
      });
    }
  } else if (jenis === "stok") {
    const items = await getLaporanStok();
    sheet.columns = [
      { header: "SKU", key: "sku", width: 14 },
      { header: "Nama", key: "nama", width: 28 },
      { header: "Kategori", key: "kategori", width: 18 },
      { header: "Stok", key: "stok", width: 10 },
      { header: "Stok Minimum", key: "stokMinimum", width: 14 },
      { header: "HPP", key: "hpp", width: 14 },
      { header: "Nilai Stok", key: "nilaiStok", width: 16 },
      { header: "Perlu Reorder", key: "perluReorder", width: 14 },
    ];
    for (const item of items) {
      sheet.addRow({
        sku: item.sku,
        nama: item.nama,
        kategori: item.kategori,
        stok: item.stok,
        stokMinimum: item.stokMinimum,
        hpp: formatRupiahNumber(item.hpp),
        nilaiStok: formatRupiahNumber(item.nilaiStok),
        perluReorder: item.perluReorder ? "Ya" : "-",
      });
    }
  } else if (jenis === "pembelian") {
    if (role === "GUDANG")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const items = await getLaporanPembelian(start, end);
    sheet.columns = [
      { header: "No. PO", key: "nomorPO", width: 20 },
      { header: "Supplier", key: "supplier", width: 24 },
      { header: "Status", key: "status", width: 18 },
      { header: "Total Nilai", key: "totalNilai", width: 16 },
      { header: "Jumlah GRN", key: "jumlahGrn", width: 12 },
      { header: "Diskrepansi", key: "diskrepansi", width: 12 },
      { header: "Tanggal", key: "tanggal", width: 18 },
    ];
    for (const po of items) {
      sheet.addRow({
        nomorPO: po.nomorPO,
        supplier: po.supplier,
        status: po.status,
        totalNilai: formatRupiahNumber(po.totalNilai),
        jumlahGrn: po.jumlahGrn,
        diskrepansi: po.adaDiskrepansi ? "Ada" : "-",
        tanggal: new Date(po.createdAt).toLocaleDateString("id-ID"),
      });
    }
  } else {
    return NextResponse.json(
      { error: "Jenis laporan tidak dikenal." },
      { status: 400 },
    );
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-${jenis}.xlsx"`,
    },
  });
}
