"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  bukaSesiSchema,
  tutupSesiSchema,
} from "@/validations/sesi-kasir.schema";
import { checkoutSchema } from "@/validations/transaksi.schema";
import {
  bukaSesi,
  tutupSesi,
  getRekapSesi,
} from "@/services/sesi-kasir.service";
import { checkout, CheckoutError } from "@/services/sales.service";
import { searchMember } from "@/services/member.service";
import { listHargaKhususAktif } from "@/services/harga-khusus.service";

type ActionState = { error?: string } | undefined;

export async function bukaSesiAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "KASIR"]);

  const parsed = bukaSesiSchema.safeParse({
    modalAwal: formData.get("modalAwal"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await bukaSesi(session.user.id, parsed.data.modalAwal);
  revalidatePath("/pos");
  return {};
}

export async function tutupSesiAction(
  sesiKasirId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "KASIR"]);

  const parsed = tutupSesiSchema.safeParse({
    totalKasAkhir: formData.get("totalKasAkhir"),
    catatan: formData.get("catatan"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await tutupSesi(sesiKasirId, parsed.data.totalKasAkhir, parsed.data.catatan);
  revalidatePath("/pos");
  return {};
}

export async function getRekapSesiAction(sesiKasirId: string) {
  await requireRole(["ADMIN", "KASIR"]);
  return getRekapSesi(sesiKasirId);
}

export async function searchProdukAction(query: string) {
  await requireRole(["ADMIN", "KASIR"]);
  const produkList = await prisma.produk.findMany({
    where: {
      aktif: true,
      OR: [
        { nama: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query } },
      ],
    },
    take: 15,
    orderBy: { nama: "asc" },
  });

  // Decimal milik Prisma bukan plain object, harus dikonversi sebelum
  // dikirim melewati boundary Server Action ke Client Component.
  return produkList.map((p) => ({
    id: p.id,
    sku: p.sku,
    nama: p.nama,
    satuan: p.satuan,
    stok: p.stok,
    hpp: Number(p.hpp),
    hargaRitel: Number(p.hargaRitel),
    hargaGrosir: Number(p.hargaGrosir),
    minQtyGrosir: p.minQtyGrosir,
  }));
}

// Input utama POS: lookup exact-match barcode hasil scan, lebih cepat &
// presisi dibanding fuzzy search nama/SKU (dipakai untuk input manual).
export async function scanBarcodeAction(barcode: string) {
  await requireRole(["ADMIN", "KASIR"]);
  const produk = await prisma.produk.findFirst({
    where: { barcode, aktif: true },
  });
  if (!produk) return null;

  return {
    id: produk.id,
    sku: produk.sku,
    nama: produk.nama,
    satuan: produk.satuan,
    stok: produk.stok,
    hpp: Number(produk.hpp),
    hargaRitel: Number(produk.hargaRitel),
    hargaGrosir: Number(produk.hargaGrosir),
    minQtyGrosir: produk.minQtyGrosir,
  };
}

export async function searchMemberAction(query: string) {
  await requireRole(["ADMIN", "KASIR"]);
  return searchMember(query);
}

export async function getActiveHargaKhususAction(memberId: string) {
  await requireRole(["ADMIN", "KASIR"]);
  const list = await listHargaKhususAktif(memberId);
  return list.map((h) => ({
    produkId: h.produkId,
    hargaKhusus: Number(h.hargaKhusus),
  }));
}

export async function checkoutAction(input: unknown) {
  const session = await requireRole(["ADMIN", "KASIR"]);

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const transaksi = await checkout(
      parsed.data,
      session.user.id,
      session.user.role,
    );
    revalidatePath("/pos");
    return {
      transaksi: {
        nomorTransaksi: transaksi.nomorTransaksi,
        createdAt: transaksi.createdAt.toISOString(),
        memberNama: transaksi.member?.nama ?? null,
        items: transaksi.items.map((i) => ({
          nama: i.produk.nama,
          qty: i.qty,
          hargaSatuan: Number(i.hargaSatuan),
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number(transaksi.subtotal),
        diskonTotal: Number(transaksi.diskonTotal),
        total: Number(transaksi.total),
        metodePembayaran: transaksi.metodePembayaran ?? "TUNAI",
        jumlahDibayar: Number(transaksi.jumlahDibayar),
        kembalian: Number(transaksi.kembalian),
      },
    };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { error: error.message };
    }
    throw error;
  }
}
