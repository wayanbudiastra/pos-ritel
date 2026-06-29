import { NextResponse } from "next/server";
import { aggregateHarian } from "@/services/laporan.service";

// PRD 5.6.5: agregasi laporan harian dijalankan via scheduled job (Vercel Cron)
// agar dashboard tidak perlu full-scan tabel Transaksi setiap kali dibuka.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const ringkasan = await aggregateHarian(yesterday);
  return NextResponse.json({
    ok: true,
    tanggal: ringkasan.tanggal,
    totalPenjualan: ringkasan.totalPenjualan,
  });
}
