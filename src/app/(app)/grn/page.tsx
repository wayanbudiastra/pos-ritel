import Link from "next/link";
import { auth } from "@/lib/auth";
import { listGRN } from "@/services/grn.service";
import { listPOSiapGRN } from "@/services/purchase.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GrnTable } from "./grn-table";

export default async function GrnPage() {
  const [grnList, poSiapGrn, session] = await Promise.all([
    listGRN(),
    listPOSiapGRN(),
    auth(),
  ]);
  const isGudang = session?.user?.role === "GUDANG";

  const data = grnList.map((g) => ({
    id: g.id,
    nomorGRN: g.nomorGRN,
    nomorPO: g.po.nomorPO,
    supplierNama: g.po.supplier.nama,
    diterimaOlehNama: g.diterimaOleh.nama,
    createdAt: g.createdAt.toISOString(),
    adaDiskrepansi: g.items.some((i) => i.adaDiskrepansi),
  }));

  return (
    <div className="space-y-8">
      {isGudang && (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Buat GRN Baru</h1>
          <p className="text-sm text-muted-foreground">
            Pilih PO yang berstatus Disetujui atau Sebagian Diterima.
          </p>
          <div className="space-y-2">
            {poSiapGrn.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>
                  {po.nomorPO} — {po.supplier.nama}{" "}
                  <Badge variant="secondary" className="ml-2">
                    {po.status.replace("_", " ")}
                  </Badge>
                </span>
                <Button size="sm" render={<Link href={`/grn/baru/${po.id}`} />}>
                  Terima Barang
                </Button>
              </div>
            ))}
            {poSiapGrn.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tidak ada PO yang siap diterima.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Riwayat GRN</h2>
        <GrnTable data={data} />
      </div>
    </div>
  );
}
