"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { penyesuaianManual } from "@/services/inventory.service";

type ActionState = { error?: string } | undefined;

export async function penyesuaianManualAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "GUDANG"]);

  const produkId = formData.get("produkId") as string;
  const qty = Number(formData.get("qty"));
  const alasan = formData.get("alasan") as string;

  if (!qty || qty === 0) {
    return { error: "Qty penyesuaian tidak boleh 0." };
  }
  if (!alasan || alasan.trim().length < 3) {
    return { error: "Alasan wajib diisi." };
  }

  try {
    await penyesuaianManual(produkId, qty, alasan, session.user.id);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Gagal menyesuaikan stok.",
    };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/kartu-stok/${produkId}`);
  return {};
}
