import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreatePoInput } from "@/validations/po.schema";
import { PO_APPROVAL_THRESHOLD } from "@/lib/config";

export class PurchaseError extends Error {}

// Dibatasi ke 100 data terakhir; pencarian & paging 10/halaman di client.
export function listPO() {
  return prisma.purchaseOrder.findMany({
    include: { supplier: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function listPOSiapGRN() {
  return prisma.purchaseOrder.findMany({
    where: { status: { in: ["DISETUJUI", "SEBAGIAN_DITERIMA"] } },
    include: { supplier: true, items: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getPO(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      dibuatOleh: { select: { nama: true } },
      items: { include: { produk: true } },
      grn: { include: { items: true } },
    },
  });
}

// PRD 5.3.4: harga beli 3 transaksi pembelian terakhir sebagai referensi negosiasi.
export async function getHargaBeliTerakhir(produkId: string) {
  const items = await prisma.pOItem.findMany({
    where: { produkId },
    orderBy: { id: "desc" },
    take: 3,
    select: { hargaBeli: true },
  });
  return items.map((i) => Number(i.hargaBeli));
}

async function generateNomorPO(tx: Prisma.TransactionClient) {
  const today = new Date();
  const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const count = await tx.purchaseOrder.count({
    where: { nomorPO: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function createPO(data: CreatePoInput, dibuatOlehId: string) {
  return prisma.$transaction(async (tx) => {
    const totalNilai = data.items.reduce(
      (sum, i) => sum + i.qtyPesan * i.hargaBeli,
      0,
    );
    const nomorPO = await generateNomorPO(tx);

    return tx.purchaseOrder.create({
      data: {
        nomorPO,
        supplierId: data.supplierId,
        dibuatOlehId,
        totalNilai,
        status: "DRAFT",
        items: {
          create: data.items.map((i) => ({
            produkId: i.produkId,
            qtyPesan: i.qtyPesan,
            hargaBeli: i.hargaBeli,
          })),
        },
      },
      include: { items: true },
    });
  });
}

// PRD 5.3.3 langkah 4-5: status otomatis DIAJUKAN jika >= ambang batas, atau
// langsung DISETUJUI (auto-approve) jika di bawah ambang batas.
export async function submitPO(id: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.status !== "DRAFT") {
    throw new PurchaseError("PO tidak dalam status Draft.");
  }

  const butuhApproval = Number(po.totalNilai) >= PO_APPROVAL_THRESHOLD;
  return prisma.purchaseOrder.update({
    where: { id },
    data: butuhApproval
      ? { status: "DIAJUKAN" }
      : { status: "DISETUJUI", disetujuiPada: new Date() },
  });
}

export async function approvePO(id: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.status !== "DIAJUKAN") {
    throw new PurchaseError("PO tidak dalam status Diajukan.");
  }
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "DISETUJUI", disetujuiPada: new Date() },
  });
}

export async function batalkanPO(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { grn: true },
  });
  if (!po) throw new PurchaseError("PO tidak ditemukan.");
  if (po.grn.length > 0) {
    throw new PurchaseError(
      "PO sudah memiliki GRN dan tidak dapat dibatalkan langsung.",
    );
  }
  if (po.status === "SELESAI" || po.status === "DIBATALKAN") {
    throw new PurchaseError("PO sudah selesai/dibatalkan.");
  }
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "DIBATALKAN" },
  });
}

// PRD 5.3.4: PO yang sudah SEBAGIAN_DITERIMA hanya dapat ditutup (sisa qty
// dianggap tidak akan diterima lagi).
export async function tutupPO(id: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po || po.status !== "SEBAGIAN_DITERIMA") {
    throw new PurchaseError(
      "PO harus berstatus Sebagian Diterima untuk ditutup.",
    );
  }
  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "SELESAI" },
  });
}
