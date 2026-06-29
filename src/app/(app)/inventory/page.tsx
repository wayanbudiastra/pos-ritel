import Link from "next/link";
import { auth } from "@/lib/auth";
import { listProduk } from "@/services/produk.service";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "./inventory-table";

export default async function InventoryPage() {
  const [produkList, session] = await Promise.all([listProduk(), auth()]);
  const role = session?.user?.role;
  const canAdjust = role === "ADMIN" || role === "GUDANG";

  const data = produkList.map((p) => ({
    id: p.id,
    sku: p.sku,
    nama: p.nama,
    stok: p.stok,
    stokMinimum: p.stokMinimum,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inventory & Stok</h1>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/inventory/stok-opname" />}
        >
          Stok Opname
        </Button>
      </div>
      <InventoryTable data={data} canAdjust={canAdjust} />
    </div>
  );
}
