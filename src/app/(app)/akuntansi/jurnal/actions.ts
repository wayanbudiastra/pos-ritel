"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { balikJurnal, JurnalError } from "@/services/jurnal.service";

export async function balikJurnalAction(id: string) {
  const session = await requireRole(["ADMIN"]);
  try {
    await balikJurnal(id, session.user.id);
  } catch (error) {
    if (error instanceof JurnalError) return { error: error.message };
    throw error;
  }
  revalidatePath("/akuntansi/jurnal");
  revalidatePath(`/akuntansi/jurnal/${id}`);
  return {};
}
