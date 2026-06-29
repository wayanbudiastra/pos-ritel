import { auth } from "@/lib/auth";
import { listPO } from "@/services/purchase.service";
import { listSupplier } from "@/services/supplier.service";
import { PoFormDialog } from "./po-form-dialog";
import { PoTable } from "./po-table";

export default async function PembelianPage() {
  const [poList, supplierList, session] = await Promise.all([
    listPO(),
    listSupplier(),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";
  const isGudang = session?.user?.role === "GUDANG";

  const data = poList.map((po) => ({
    id: po.id,
    nomorPO: po.nomorPO,
    supplierNama: po.supplier.nama,
    totalNilai: Number(po.totalNilai),
    status: po.status,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Purchase Order</h1>
        {(isAdmin || isGudang) && <PoFormDialog supplierList={supplierList} />}
      </div>
      <PoTable data={data} isAdmin={isAdmin} isGudang={isGudang} />
    </div>
  );
}
