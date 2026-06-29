"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { akunSchema } from "@/validations/akun.schema";
import {
  createAkun,
  updateAkun,
  nonaktifkanAkun,
  aktifkanAkun,
} from "@/services/akun.service";

type ActionState = { error?: string } | undefined;

function parseAkunForm(formData: FormData) {
  return akunSchema.safeParse({
    kode: formData.get("kode"),
    nama: formData.get("nama"),
    tipe: formData.get("tipe"),
    saldoNormal: formData.get("saldoNormal"),
    indukAkunId: formData.get("indukAkunId"),
  });
}

export async function createAkunAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = parseAkunForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createAkun(parsed.data);
  } catch {
    return { error: "Kode akun sudah digunakan." };
  }

  revalidatePath("/akuntansi/coa");
  return {};
}

export async function updateAkunAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const id = formData.get("id") as string;
  const parsed = parseAkunForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateAkun(id, parsed.data);
  } catch {
    return { error: "Kode akun sudah digunakan." };
  }

  revalidatePath("/akuntansi/coa");
  return {};
}

export async function toggleAkunAction(id: string, aktif: boolean) {
  await requireRole(["ADMIN"]);
  try {
    if (aktif) {
      await nonaktifkanAkun(id);
    } else {
      await aktifkanAkun(id);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal mengubah status akun." };
  }
  revalidatePath("/akuntansi/coa");
  return {};
}
