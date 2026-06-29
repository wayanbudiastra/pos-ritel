import { notFound } from "next/navigation";
import { getPO } from "@/services/purchase.service";
import { GrnForm } from "./grn-form";

export default async function GrnBaruPage({
  params,
}: {
  params: Promise<{ poId: string }>;
}) {
  const { poId } = await params;
  const po = await getPO(poId);
  if (!po || (po.status !== "DISETUJUI" && po.status !== "SEBAGIAN_DITERIMA")) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Terima Barang — {po.nomorPO}</h1>
        <p className="text-sm text-muted-foreground">
          Supplier: {po.supplier.nama}
        </p>
      </div>
      <GrnForm
        poId={po.id}
        poItems={po.items.map((i) => ({
          id: i.id,
          produkId: i.produkId,
          produkNama: i.produk.nama,
          qtyPesan: i.qtyPesan,
          qtyDiterima: i.qtyDiterima,
          hargaBeli: Number(i.hargaBeli),
        }))}
      />
    </div>
  );
}
