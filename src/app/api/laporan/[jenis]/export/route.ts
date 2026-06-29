import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import {
  getLaporanPenjualan,
  getLaporanMargin,
  getLaporanStok,
  getLaporanPembelian,
} from "@/services/laporan.service";
import { getLabaRugi, getNeraca } from "@/services/laporan-keuangan.service";

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
  } else if (jenis === "laba-rugi") {
    if (role !== "OWNER" && role !== "ADMIN")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const data = await getLabaRugi(start, end);

    sheet.columns = [
      { header: "Akun", key: "akun", width: 32 },
      { header: "Nilai", key: "nilai", width: 18 },
    ];
    sheet.addRow({ akun: "PENDAPATAN" });
    for (const item of data.pendapatan) {
      sheet.addRow({ akun: item.nama, nilai: formatRupiahNumber(item.total) });
    }
    sheet.addRow({ akun: "Total Pendapatan", nilai: formatRupiahNumber(data.totalPendapatan) });
    sheet.addRow({});
    sheet.addRow({ akun: "HARGA POKOK PENJUALAN" });
    for (const item of data.hpp) {
      sheet.addRow({ akun: item.nama, nilai: formatRupiahNumber(item.total) });
    }
    sheet.addRow({ akun: "Total HPP", nilai: formatRupiahNumber(data.totalHpp) });
    sheet.addRow({ akun: "Laba Kotor", nilai: formatRupiahNumber(data.labaKotor) });
    sheet.addRow({});
    sheet.addRow({ akun: "BEBAN OPERASIONAL" });
    for (const item of data.beban) {
      sheet.addRow({ akun: item.nama, nilai: formatRupiahNumber(item.total) });
    }
    sheet.addRow({ akun: "Total Beban Operasional", nilai: formatRupiahNumber(data.totalBeban) });
    sheet.addRow({});
    sheet.addRow({
      akun: data.labaBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH",
      nilai: formatRupiahNumber(data.labaBersih),
    });
  } else if (jenis === "neraca") {
    if (role !== "OWNER" && role !== "ADMIN")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const tanggal = searchParams.get("tanggal") ? new Date(searchParams.get("tanggal")!) : new Date();
    const data = await getNeraca(tanggal);

    sheet.columns = [
      { header: "Akun", key: "akun", width: 32 },
      { header: "Nilai", key: "nilai", width: 18 },
    ];
    sheet.addRow({ akun: "ASET" });
    for (const item of data.aset) {
      sheet.addRow({ akun: item.nama, nilai: formatRupiahNumber(item.total) });
    }
    sheet.addRow({ akun: "Total Aset", nilai: formatRupiahNumber(data.totalAset) });
    sheet.addRow({});
    sheet.addRow({ akun: "LIABILITAS" });
    for (const item of data.liabilitas) {
      sheet.addRow({ akun: item.nama, nilai: formatRupiahNumber(item.total) });
    }
    sheet.addRow({ akun: "Total Liabilitas", nilai: formatRupiahNumber(data.totalLiabilitas) });
    sheet.addRow({});
    sheet.addRow({ akun: "EKUITAS" });
    for (const item of data.ekuitasAkun) {
      sheet.addRow({ akun: item.nama, nilai: formatRupiahNumber(item.total) });
    }
    sheet.addRow({ akun: "Laba Ditahan (Berjalan)", nilai: formatRupiahNumber(data.labaDitahanBerjalan) });
    sheet.addRow({ akun: "Total Ekuitas", nilai: formatRupiahNumber(data.totalEkuitas) });
    sheet.addRow({});
    sheet.addRow({ akun: "Total Liabilitas + Ekuitas", nilai: formatRupiahNumber(data.totalLiabilitasEkuitas) });
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
