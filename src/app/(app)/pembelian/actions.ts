"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createPoSchema } from "@/validations/po.schema";
import {
  createPO,
  submitPO,
  approvePO,
  batalkanPO,
  tutupPO,
  PurchaseError,
  getHargaBeliTerakhir,
} from "@/services/purchase.service";

type ActionState = { error?: string } | undefined;

export async function createPoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["ADMIN", "GUDANG"]);

  const raw = formData.get("payload");
  const parsed = createPoSchema.safeParse(JSON.parse(raw as string));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await createPO(parsed.data, session.user.id);
  revalidatePath("/pembelian");
  return {};
}

export async function submitPoAction(id: string) {
  await requireRole(["ADMIN", "GUDANG"]);
  try {
    await submitPO(id);
  } catch (error) {
    if (error instanceof PurchaseError) return { error: error.message };
    throw error;
  }
  revalidatePath("/pembelian");
  revalidatePath(`/pembelian/${id}`);
  return {};
}

export async function approvePoAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    await approvePO(id);
  } catch (error) {
    if (error instanceof PurchaseError) return { error: error.message };
    throw error;
  }
  revalidatePath("/pembelian");
  revalidatePath(`/pembelian/${id}`);
  return {};
}

export async function batalkanPoAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    await batalkanPO(id);
  } catch (error) {
    if (error instanceof PurchaseError) return { error: error.message };
    throw error;
  }
  revalidatePath("/pembelian");
  revalidatePath(`/pembelian/${id}`);
  return {};
}

export async function tutupPoAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    await tutupPO(id);
  } catch (error) {
    if (error instanceof PurchaseError) return { error: error.message };
    throw error;
  }
  revalidatePath("/pembelian");
  revalidatePath(`/pembelian/${id}`);
  return {};
}

export async function getHargaBeliTerakhirAction(produkId: string) {
  await requireRole(["ADMIN", "GUDANG"]);
  return getHargaBeliTerakhir(produkId);
}

export async function searchProdukForPoAction(query: string) {
  await requireRole(["ADMIN", "GUDANG"]);
  const produkList = await prisma.produk.findMany({
    where: {
      aktif: true,
      OR: [
        { nama: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 15,
    orderBy: { nama: "asc" },
  });

  return produkList.map((p) => ({
    id: p.id,
    sku: p.sku,
    nama: p.nama,
    hpp: Number(p.hpp),
  }));
}
