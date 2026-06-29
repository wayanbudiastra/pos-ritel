import { auth } from "@/lib/auth";
import { listProduk } from "@/services/produk.service";
import { listKategori } from "@/services/kategori.service";
import { ProdukDialog } from "./produk-dialog";
import { ProdukTable } from "./produk-table";

export default async function ProdukPage() {
  const [produkList, kategoriList, session] = await Promise.all([
    listProduk(),
    listKategori(),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  const data = produkList.map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    nama: p.nama,
    kategoriId: p.kategoriId,
    kategoriNama: p.kategori.nama,
    satuan: p.satuan,
    hpp: Number(p.hpp),
    hargaRitel: Number(p.hargaRitel),
    hargaGrosir: Number(p.hargaGrosir),
    minQtyGrosir: p.minQtyGrosir,
    stok: p.stok,
    stokMinimum: p.stokMinimum,
    aktif: p.aktif,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produk</h1>
        {isAdmin && <ProdukDialog kategoriList={kategoriList} />}
      </div>
      <ProdukTable data={data} kategoriList={kategoriList} isAdmin={isAdmin} />
    </div>
  );
}
