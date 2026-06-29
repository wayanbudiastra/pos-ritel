import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processEventLog } from "@/services/event-consumer.service";

// PRD akuntansi.md 2.3: dijalankan terjadwal (Vercel Cron) selain bisa
// dipicu manual oleh Admin lewat halaman Antrian Jurnal Otomatis.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron tidak punya sesi user — pakai akun Admin pertama sebagai "pembuat"
  // jurnal otomatis (konsisten dengan kebutuhan dibuatOlehId di JurnalEntry).
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    return NextResponse.json({ error: "Tidak ada user Admin untuk memproses jurnal." }, { status: 500 });
  }

  const hasil = await processEventLog(admin.id);
  return NextResponse.json({ ok: true, ...hasil });
}
