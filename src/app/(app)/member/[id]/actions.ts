"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { hargaKhususSchema } from "@/validations/harga-khusus.schema";
import {
  upsertHargaKhusus,
  nonaktifkanHargaKhusus,
} from "@/services/harga-khusus.service";
import { prisma } from "@/lib/prisma";

type ActionState = { error?: string; warning?: string } | undefined;

export async function upsertHargaKhususAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);

  const memberId = formData.get("memberId") as string;
  const parsed = hargaKhususSchema.safeParse({
    produkId: formData.get("produkId"),
    hargaKhusus: formData.get("hargaKhusus"),
    tanggalMulai: formData.get("tanggalMulai"),
    tanggalBerakhir: formData.get("tanggalBerakhir"),
    catatan: formData.get("catatan"),
    konfirmasiDiBawahHpp: formData.get("konfirmasiDiBawahHpp"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // PRD 5.2.4: peringatan (bukan blocking) jika harga khusus di bawah HPP,
  // memerlukan konfirmasi eksplisit dari Admin sebelum disimpan.
  const produk = await prisma.produk.findUnique({
    where: { id: parsed.data.produkId },
  });
  if (
    produk &&
    parsed.data.hargaKhusus < Number(produk.hpp) &&
    !parsed.data.konfirmasiDiBawahHpp
  ) {
    return {
      warning: `Harga khusus (${parsed.data.hargaKhusus}) di bawah HPP (${produk.hpp}). Konfirmasi untuk tetap menyimpan.`,
    };
  }

  await upsertHargaKhusus(memberId, parsed.data, session.user.id);
  revalidatePath(`/member/${memberId}`);
  return {};
}

export async function nonaktifkanHargaKhususAction(
  id: string,
  memberId: string,
) {
  const session = await requireRole(["ADMIN"]);
  await nonaktifkanHargaKhusus(id, session.user.id);
  revalidatePath(`/member/${memberId}`);
}
