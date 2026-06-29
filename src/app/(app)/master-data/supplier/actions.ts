"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { supplierSchema } from "@/validations/supplier.schema";
import {
  createSupplier,
  updateSupplier,
  nonaktifkanSupplier,
  aktifkanSupplier,
} from "@/services/supplier.service";

type ActionState = { error?: string } | undefined;

function parseSupplierForm(formData: FormData) {
  return supplierSchema.safeParse({
    nama: formData.get("nama"),
    kontakPerson: formData.get("kontakPerson"),
    telepon: formData.get("telepon"),
    alamat: formData.get("alamat"),
  });
}

export async function createSupplierAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = parseSupplierForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await createSupplier(parsed.data);
  revalidatePath("/master-data/supplier");
  return {};
}

export async function updateSupplierAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const id = formData.get("id") as string;
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updateSupplier(id, parsed.data);
  revalidatePath("/master-data/supplier");
  return {};
}

export async function toggleSupplierAction(id: string, aktif: boolean) {
  await requireRole(["ADMIN"]);
  if (aktif) {
    await nonaktifkanSupplier(id);
  } else {
    await aktifkanSupplier(id);
  }
  revalidatePath("/master-data/supplier");
}
