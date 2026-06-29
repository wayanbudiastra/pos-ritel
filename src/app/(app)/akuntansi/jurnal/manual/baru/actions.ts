"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { jurnalManualSchema } from "@/validations/jurnal.schema";
import { createJurnalManual, JurnalError } from "@/services/jurnal.service";

type ActionState = { error?: string; jurnalId?: string } | undefined;

export async function createJurnalManualAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole(["ADMIN"]);

  const raw = formData.get("payload");
  const parsed = jurnalManualSchema.safeParse(JSON.parse(raw as string));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const jurnal = await createJurnalManual(parsed.data, session.user.id);
    revalidatePath("/akuntansi/jurnal");
    return { jurnalId: jurnal.id };
  } catch (error) {
    if (error instanceof JurnalError) return { error: error.message };
    throw error;
  }
}
