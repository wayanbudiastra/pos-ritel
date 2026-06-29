import { notFound } from "next/navigation";
import { getProduk } from "@/services/produk.service";
import { listKartuStok } from "@/services/inventory.service";
import { KartuStokTable } from "./kartu-stok-table";

export default async function KartuStokPage({
  params,
}: {
  params: Promise<{ produkId: string }>;
}) {
  const { produkId } = await params;
  const [produk, kartuStok] = await Promise.all([
    getProduk(produkId),
    listKartuStok(produkId),
  ]);
  if (!produk) notFound();

  const data = kartuStok.map((k) => ({
    id: k.id,
    createdAt: k.createdAt.toISOString(),
    jenisPergerakan: k.jenisPergerakan,
    qty: k.qty,
    stokSebelum: k.stokSebelum,
    stokSesudah: k.stokSesudah,
    referensiTipe: k.referensiTipe,
    userNama: k.user.nama,
    catatan: k.catatan,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Kartu Stok: {produk.nama}</h1>
        <p className="text-sm text-muted-foreground">
          Stok saat ini: {produk.stok}
        </p>
      </div>
      <KartuStokTable data={data} />
    </div>
  );
}
