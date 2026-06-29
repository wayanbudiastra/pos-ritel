import { auth } from "@/lib/auth";
import { listSupplier } from "@/services/supplier.service";
import { SupplierDialog } from "./supplier-dialog";
import { SupplierTable } from "./supplier-table";

export default async function SupplierPage() {
  const [supplierList, session] = await Promise.all([listSupplier(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Supplier</h1>
        {isAdmin && <SupplierDialog />}
      </div>
      <SupplierTable data={supplierList} isAdmin={isAdmin} />
    </div>
  );
}
