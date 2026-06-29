"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { returSchema } from "@/validations/transaksi.schema";
import {
  returItem,
  CheckoutError,
  searchTransaksiPaid,
} from "@/services/sales.service";

type ActionState = { error?: string; success?: boolean } | undefined;

export async function searchTransaksiAction(query: string) {
  await requireRole(["ADMIN"]);
  const transaksiList = await searchTransaksiPaid(query);

  return transaksiList.map((t) => ({
    id: t.id,
    nomorTransaksi: t.nomorTransaksi,
    createdAt: t.createdAt.toISOString(),
    kasirNama: t.kasir.nama,
    memberNama: t.member?.nama ?? null,
    items: t.items.map((i) => ({
      id: i.id,
      produkNama: i.produk.nama,
      qty: i.qty,
      qtyRetur: i.qtyRetur,
      hargaSatuan: Number(i.hargaSatuan),
    })),
  }));
}

export async function returItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);

  const parsed = returSchema.safeParse({
    transaksiItemId: formData.get("transaksiItemId"),
    qty: formData.get("qty"),
    alasan: formData.get("alasan"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await returItem(
      parsed.data.transaksiItemId,
      parsed.data.qty,
      parsed.data.alasan,
      session.user.id,
    );
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/penjualan/retur");
  return { success: true };
}
