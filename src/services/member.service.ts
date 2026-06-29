import { prisma } from "@/lib/prisma";
import type {
  MemberInput,
  MemberQuickInput,
} from "@/validations/member.schema";

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listMember() {
  return prisma.member.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export function searchMember(query: string) {
  return prisma.member.findMany({
    where: {
      aktif: true,
      OR: [
        { noHp: { contains: query } },
        { kodeMember: { contains: query, mode: "insensitive" } },
        { nama: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { nama: "asc" },
  });
}

export function getMember(id: string) {
  return prisma.member.findUnique({ where: { id } });
}

async function generateKodeMember() {
  const last = await prisma.member.findFirst({
    orderBy: { kodeMember: "desc" },
    select: { kodeMember: true },
  });
  const lastNumber = last ? parseInt(last.kodeMember.split("-")[1], 10) : 0;
  const nextNumber = lastNumber + 1;
  return `MBR-${String(nextNumber).padStart(6, "0")}`;
}

export async function createMember(data: MemberInput) {
  const kodeMember = await generateKodeMember();
  return prisma.member.create({ data: { ...data, kodeMember } });
}

// Daftar cepat oleh Kasir saat transaksi (PRD 5.2.2).
export async function quickCreateMember(data: MemberQuickInput) {
  const kodeMember = await generateKodeMember();
  return prisma.member.create({ data: { ...data, kodeMember } });
}

export function updateMember(id: string, data: MemberInput) {
  return prisma.member.update({ where: { id }, data });
}

export function nonaktifkanMember(id: string) {
  return prisma.member.update({ where: { id }, data: { aktif: false } });
}

export function aktifkanMember(id: string) {
  return prisma.member.update({ where: { id }, data: { aktif: true } });
}

// PRD 5.2.6: ringkasan riwayat transaksi member.
export async function getRiwayatMember(memberId: string) {
  const transaksi = await prisma.transaksi.findMany({
    where: { memberId, status: "PAID" },
    include: { items: { include: { produk: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalBelanja = transaksi.reduce((sum, t) => sum + Number(t.total), 0);
  const frekuensi = transaksi.length;
  const rataRata = frekuensi > 0 ? totalBelanja / frekuensi : 0;

  const produkCount = new Map<string, { nama: string; qty: number }>();
  for (const t of transaksi) {
    for (const item of t.items) {
      const existing = produkCount.get(item.produkId);
      if (existing) {
        existing.qty += item.qty;
      } else {
        produkCount.set(item.produkId, {
          nama: item.produk.nama,
          qty: item.qty,
        });
      }
    }
  }
  const produkTerlaris = [...produkCount.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Statistik (totalBelanja/frekuensi/produkTerlaris) dihitung dari seluruh
  // riwayat; tabel yang ditampilkan dibatasi ke 100 transaksi terakhir saja.
  return {
    transaksi: transaksi.slice(0, 100),
    totalBelanja,
    frekuensi,
    rataRata,
    produkTerlaris,
  };
}
