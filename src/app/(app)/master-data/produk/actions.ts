"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { produkSchema } from "@/validations/produk.schema";
import {
  createProduk,
  updateProduk,
  nonaktifkanProduk,
  aktifkanProduk,
} from "@/services/produk.service";

type ActionState = { error?: string } | undefined;

function parseProdukForm(formData: FormData) {
  return produkSchema.safeParse({
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    nama: formData.get("nama"),
    kategoriId: formData.get("kategoriId"),
    satuan: formData.get("satuan"),
    hpp: formData.get("hpp"),
    hargaRitel: formData.get("hargaRitel"),
    hargaGrosir: formData.get("hargaGrosir"),
    minQtyGrosir: formData.get("minQtyGrosir"),
    stokMinimum: formData.get("stokMinimum"),
  });
}

export async function createProdukAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = parseProdukForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createProduk(parsed.data);
  } catch {
    return { error: "SKU atau barcode sudah digunakan." };
  }

  revalidatePath("/master-data/produk");
  return {};
}

export async function updateProdukAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const id = formData.get("id") as string;
  const parsed = parseProdukForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateProduk(id, parsed.data);
  } catch {
    return { error: "SKU atau barcode sudah digunakan." };
  }

  revalidatePath("/master-data/produk");
  return {};
}

export async function toggleProdukAction(id: string, aktif: boolean) {
  await requireRole(["ADMIN"]);
  if (aktif) {
    await nonaktifkanProduk(id);
  } else {
    await aktifkanProduk(id);
  }
  revalidatePath("/master-data/produk");
}
