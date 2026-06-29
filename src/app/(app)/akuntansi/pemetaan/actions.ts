"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { setPemetaanAkun } from "@/services/pemetaan-akun.service";

export async function setPemetaanAkunAction(kunci: string, akunId: string) {
  await requireRole(["ADMIN"]);
  if (!akunId) {
    return { error: "Pilih akun terlebih dahulu." };
  }
  await setPemetaanAkun(kunci, akunId);
  revalidatePath("/akuntansi/pemetaan");
  return {};
}
