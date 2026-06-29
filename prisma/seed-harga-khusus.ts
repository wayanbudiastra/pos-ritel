import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

// Diskon harga khusus member dihitung otomatis per kategori produk dari Harga
// Ritel. Saat ini seluruh kategori didiskon 10%, tapi disusun per-kategori
// agar mudah dibedakan nilainya per kategori di kemudian hari.
const DISKON_PER_KATEGORI: Record<string, number> = {
  Sembako: 0.1,
  Minuman: 0.1,
  "Rumah Tangga": 0.1,
};
const DISKON_DEFAULT = 0.1;

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const memberList = await prisma.member.findMany({ where: { aktif: true } });
  const produkList = await prisma.produk.findMany({
    where: { aktif: true },
    include: { kategori: true },
  });

  if (memberList.length === 0 || produkList.length === 0) {
    throw new Error("Tidak ada member/produk aktif. Jalankan seed master data dulu.");
  }

  // Bersihkan harga khusus lama supaya hasilnya konsisten (semua mengikuti
  // aturan diskon per kategori, tidak ada sisa nilai manual sebelumnya).
  await prisma.hargaKhususLog.deleteMany({});
  await prisma.hargaKhusus.deleteMany({});

  let count = 0;
  for (const member of memberList) {
    for (const produk of produkList) {
      const diskon = DISKON_PER_KATEGORI[produk.kategori.nama] ?? DISKON_DEFAULT;
      const hargaKhusus = Math.round(Number(produk.hargaRitel) * (1 - diskon));

      await prisma.hargaKhusus.create({
        data: {
          memberId: member.id,
          produkId: produk.id,
          hargaKhusus,
          status: "AKTIF",
          catatan: `Diskon otomatis ${Math.round(diskon * 100)}% (kategori ${produk.kategori.nama})`,
        },
      });
      await prisma.hargaKhususLog.create({
        data: {
          memberId: member.id,
          produkId: produk.id,
          hargaBaru: hargaKhusus,
          diubahOlehId: admin.id,
        },
      });
      count++;
    }
  }

  console.log(
    `Harga khusus dibuat: ${count} entri (${memberList.length} member x ${produkList.length} produk).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
