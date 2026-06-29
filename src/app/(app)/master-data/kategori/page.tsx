import { auth } from "@/lib/auth";
import { listKategori } from "@/services/kategori.service";
import { KategoriDialog } from "./kategori-dialog";
import { KategoriTable } from "./kategori-table";

export default async function KategoriPage() {
  const [kategoriList, session] = await Promise.all([listKategori(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kategori Produk</h1>
        {isAdmin && <KategoriDialog />}
      </div>
      <KategoriTable data={kategoriList} isAdmin={isAdmin} />
    </div>
  );
}
