import { auth } from "@/lib/auth";
import { listAkun } from "@/services/akun.service";
import { AkunDialog } from "./akun-dialog";
import { AkunTable } from "./akun-table";

export default async function CoaPage() {
  const [akunList, session] = await Promise.all([listAkun(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chart of Account (COA)</h1>
          <p className="text-sm text-muted-foreground">
            Daftar akun untuk pencatatan jurnal otomatis & manual.
          </p>
        </div>
        {isAdmin && <AkunDialog />}
      </div>
      <AkunTable data={akunList} isAdmin={isAdmin} />
    </div>
  );
}
