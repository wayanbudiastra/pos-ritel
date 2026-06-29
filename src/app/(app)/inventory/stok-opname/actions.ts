"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { createOpnameSchema } from "@/validations/stok-opname.schema";
import {
  createOpname,
  inputFisik,
  submitOpname,
  approveOpname,
  OpnameError,
} from "@/services/stok-opname.service";

type ActionState = { error?: string } | undefined;

export async function createOpnameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "GUDANG"]);

  const parsed = createOpnameSchema.safeParse({
    lingkup: formData.get("lingkup"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createOpname(parsed.data.lingkup, session.user.id);
  } catch (error) {
    if (error instanceof OpnameError) return { error: error.message };
    throw error;
  }

  revalidatePath("/inventory/stok-opname");
  return {};
}

export async function inputFisikAction(
  itemId: string,
  stokFisik: number,
  alasanKode: string | undefined,
) {
  await requireRole(["ADMIN", "GUDANG"]);
  try {
    await inputFisik(itemId, stokFisik, alasanKode);
  } catch (error) {
    if (error instanceof OpnameError) return { error: error.message };
    throw error;
  }
  revalidatePath("/inventory/stok-opname");
  return {};
}

export async function submitOpnameAction(id: string) {
  const session = await requireRole(["ADMIN", "GUDANG"]);
  try {
    await submitOpname(id, session.user.id);
  } catch (error) {
    if (error instanceof OpnameError) return { error: error.message };
    throw error;
  }
  revalidatePath("/inventory/stok-opname");
  revalidatePath(`/inventory/stok-opname/${id}`);
  return {};
}

export async function approveOpnameAction(id: string) {
  const session = await requireRole(["ADMIN"]);
  try {
    await approveOpname(id, session.user.id);
  } catch (error) {
    if (error instanceof OpnameError) return { error: error.message };
    throw error;
  }
  revalidatePath("/inventory/stok-opname");
  revalidatePath(`/inventory/stok-opname/${id}`);
  return {};
}
