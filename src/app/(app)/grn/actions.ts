"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { createGrnSchema } from "@/validations/grn.schema";
import { createGRN, GrnError } from "@/services/grn.service";

type ActionState = { error?: string } | undefined;

export async function createGrnAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["GUDANG"]);

  const raw = formData.get("payload");
  const parsed = createGrnSchema.safeParse(JSON.parse(raw as string));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createGRN(parsed.data, session.user.id);
  } catch (error) {
    if (error instanceof GrnError) return { error: error.message };
    throw error;
  }

  revalidatePath("/grn");
  revalidatePath("/pembelian");
  revalidatePath(`/pembelian/${parsed.data.poId}`);
  return {};
}
