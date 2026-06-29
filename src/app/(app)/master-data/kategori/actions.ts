"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { kategoriSchema } from "@/validations/kategori.schema";
import {
  createKategori,
  updateKategori,
  deleteKategori,
} from "@/services/kategori.service";

type ActionState = { error?: string } | undefined;

export async function createKategoriAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = kategoriSchema.safeParse({ nama: formData.get("nama") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createKategori(parsed.data);
  } catch {
    return { error: "Nama kategori sudah digunakan." };
  }

  revalidatePath("/master-data/kategori");
  return {};
}

export async function updateKategoriAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const id = formData.get("id") as string;
  const parsed = kategoriSchema.safeParse({ nama: formData.get("nama") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateKategori(id, parsed.data);
  } catch {
    return { error: "Nama kategori sudah digunakan." };
  }

  revalidatePath("/master-data/kategori");
  return {};
}

export async function deleteKategoriAction(id: string): Promise<ActionState> {
  await requireRole(["ADMIN"]);
  try {
    await deleteKategori(id);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Gagal menghapus kategori.",
    };
  }
  revalidatePath("/master-data/kategori");
  return {};
}
