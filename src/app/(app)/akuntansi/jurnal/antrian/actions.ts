"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { processEventLog } from "@/services/event-consumer.service";

export async function prosesJurnalOtomatisAction() {
  const session = await requireRole(["ADMIN"]);
  const hasil = await processEventLog(session.user.id);
  revalidatePath("/akuntansi/jurnal/antrian");
  revalidatePath("/akuntansi/jurnal");
  return hasil;
}
