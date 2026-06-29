import { auth } from "@/lib/auth";
import { listOpname } from "@/services/stok-opname.service";
import { listKategori } from "@/services/kategori.service";
import { OpnameDialog } from "./opname-dialog";
import { OpnameTable } from "./opname-table";

export default async function StokOpnamePage() {
  const [opnameList, kategoriList, session] = await Promise.all([
    listOpname(),
    listKategori(),
    auth(),
  ]);
  const role = session?.user?.role;
  const canCreate = role === "ADMIN" || role === "GUDANG";

  const data = opnameList.map((o) => ({
    id: o.id,
    nomorOpname: o.nomorOpname,
    lingkupLabel: o.lingkup === "SEMUA" ? "Seluruh Produk" : o.lingkup,
    jumlahItem: o.items.length,
    status: o.status,
    dibuatOlehNama: o.dibuatOleh.nama,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok Opname</h1>
        {canCreate && <OpnameDialog kategoriList={kategoriList} />}
      </div>
      <OpnameTable data={data} />
    </div>
  );
}
