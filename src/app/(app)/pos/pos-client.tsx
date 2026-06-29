"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchProdukAction,
  scanBarcodeAction,
  searchMemberAction,
  getActiveHargaKhususAction,
  checkoutAction,
} from "./actions";
import { TutupSesiDialog } from "./tutup-sesi-dialog";
import { QuickMemberDialog } from "./quick-member-dialog";
import { StrukDialog, type StrukData } from "./struk";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type Produk = {
  id: string;
  sku: string;
  nama: string;
  satuan: string;
  stok: number;
  hargaRitel: number;
  hargaGrosir: number;
  minQtyGrosir: number;
};

type CartItem = Produk & { qty: number };

type Member = { id: string; nama: string; noHp: string; kodeMember: string };

export function PosClient({
  sesiKasirId,
  kasirNama,
}: {
  sesiKasirId: string;
  kasirNama: string;
}) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [query, setQuery] = useState("");
  const [produkResults, setProdukResults] = useState<Produk[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tipeTransaksi, setTipeTransaksi] = useState<"RITEL" | "GROSIR">(
    "RITEL",
  );

  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [hargaKhususMap, setHargaKhususMap] = useState<Map<string, number>>(
    new Map(),
  );

  const [diskonTotal, setDiskonTotal] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState<
    "TUNAI" | "TRANSFER" | "QRIS" | "KARTU"
  >("TUNAI");
  const [jumlahDibayar, setJumlahDibayar] = useState(0);

  const [struk, setStruk] = useState<StrukData | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      searchProdukAction(query).then(setProdukResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (memberQuery.trim().length < 2) return;
    const handle = setTimeout(() => {
      searchMemberAction(memberQuery).then(setMemberResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [memberQuery]);

  const visibleProdukResults = query.trim().length >= 2 ? produkResults : [];
  const visibleMemberResults =
    memberQuery.trim().length >= 2 ? memberResults : [];

  function selectMember(member: Member) {
    setSelectedMember(member);
    setMemberQuery("");
    setMemberResults([]);
    getActiveHargaKhususAction(member.id).then((list) => {
      setHargaKhususMap(new Map(list.map((h) => [h.produkId, h.hargaKhusus])));
    });
  }

  function clearMember() {
    setSelectedMember(null);
    setHargaKhususMap(new Map());
  }

  function addToCart(produk: Produk) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === produk.id);
      if (existing) {
        if (existing.qty >= produk.stok) {
          toast.error(`Stok ${produk.nama} tidak cukup.`);
          return prev;
        }
        return prev.map((c) =>
          c.id === produk.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      if (produk.stok < 1) {
        toast.error(`Stok ${produk.nama} habis.`);
        return prev;
      }
      return [...prev, { ...produk, qty: 1 }];
    });
    setQuery("");
    setProdukResults([]);
  }

  function handleBarcodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    startTransition(async () => {
      const produk = await scanBarcodeAction(barcode);
      if (!produk) {
        toast.error(`Barcode "${barcode}" tidak ditemukan.`);
      } else {
        addToCart(produk);
      }
      setBarcodeInput("");
    });
  }

  function updateQty(produkId: string, qty: number) {
    setCart((prev) =>
      prev.map((c) =>
        c.id === produkId ? { ...c, qty: Math.max(1, qty) } : c,
      ),
    );
  }

  function removeFromCart(produkId: string) {
    setCart((prev) => prev.filter((c) => c.id !== produkId));
  }

  const resolveHarga = useCallback(
    (item: CartItem) => {
      const khusus = hargaKhususMap.get(item.id);
      if (khusus !== undefined) {
        return { harga: khusus, tipeHarga: "KHUSUS" as const };
      }
      if (tipeTransaksi === "GROSIR" && item.qty >= item.minQtyGrosir) {
        return { harga: item.hargaGrosir, tipeHarga: "GROSIR" as const };
      }
      return { harga: item.hargaRitel, tipeHarga: "RITEL" as const };
    },
    [hargaKhususMap, tipeTransaksi],
  );

  const cartWithPrice = useMemo(
    () =>
      cart.map((item) => {
        const { harga, tipeHarga } = resolveHarga(item);
        return { ...item, harga, tipeHarga, subtotal: harga * item.qty };
      }),
    [cart, resolveHarga],
  );

  const subtotal = cartWithPrice.reduce((sum, i) => sum + i.subtotal, 0);
  const total = Math.max(subtotal - diskonTotal, 0);
  const kembalian = jumlahDibayar - total;

  function resetForm() {
    setCart([]);
    clearMember();
    setDiskonTotal(0);
    setJumlahDibayar(0);
    setTipeTransaksi("RITEL");
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong.");
      return;
    }
    if (jumlahDibayar < total) {
      toast.error("Jumlah dibayar kurang dari total.");
      return;
    }

    startTransition(async () => {
      const result = await checkoutAction({
        sesiKasirId,
        tipeTransaksi,
        memberId: selectedMember?.id ?? null,
        items: cart.map((c) => ({ produkId: c.id, qty: c.qty })),
        diskonTotal,
        metodePembayaran,
        jumlahDibayar,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Transaksi berhasil.");
      setStruk({ ...result.transaksi, kasirNama });
      resetForm();
    });
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Kasir (POS)</h1>
          <TutupSesiDialog sesiKasirId={sesiKasirId} />
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <Label htmlFor="barcodeInput">Scan Barcode (Input Utama)</Label>
          <form onSubmit={handleBarcodeSubmit}>
            <Input
              id="barcodeInput"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Arahkan scanner ke sini, atau ketik barcode lalu Enter..."
              autoFocus
              autoComplete="off"
            />
          </form>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => setManualMode((v) => !v)}
          >
            {manualMode ? "Sembunyikan input manual" : "Produk tidak ada barcode? Input manual"}
          </Button>

          {manualMode && (
            <div className="space-y-2 border-t pt-3">
              <Label>Cari Manual (nama / SKU)</Label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama atau SKU produk..."
              />
              {visibleProdukResults.length > 0 && (
                <div className="rounded-md border">
                  {visibleProdukResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>
                        {p.nama}{" "}
                        <span className="text-muted-foreground">({p.sku})</span>
                      </span>
                      <span className="text-muted-foreground">Stok: {p.stok}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cartWithPrice.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nama}</TableCell>
                <TableCell>
                  {formatRupiah(item.harga)}
                  {item.tipeHarga !== "RITEL" && (
                    <Badge variant="secondary" className="ml-2">
                      {item.tipeHarga}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    max={item.stok}
                    value={item.qty}
                    onChange={(e) => updateQty(item.id, Number(e.target.value))}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>{formatRupiah(item.subtotal)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {cartWithPrice.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Keranjang masih kosong.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <div className="space-y-2 rounded-md border p-4">
          <Label>Tipe Transaksi</Label>
          <Select
            value={tipeTransaksi}
            onValueChange={(v) => setTipeTransaksi(v as "RITEL" | "GROSIR")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RITEL">Ritel</SelectItem>
              <SelectItem value="GROSIR">Grosir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <Label>Member</Label>
          {selectedMember ? (
            <div className="flex items-center justify-between text-sm">
              <span>
                {selectedMember.nama} ({selectedMember.kodeMember})
              </span>
              <Button variant="ghost" size="sm" onClick={clearMember}>
                Hapus
              </Button>
            </div>
          ) : (
            <>
              <Input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Cari no. HP / kode / nama..."
              />
              {visibleMemberResults.length > 0 && (
                <div className="rounded-md border">
                  {visibleMemberResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => selectMember(m)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>{m.nama}</span>
                      <span className="text-muted-foreground">{m.noHp}</span>
                    </button>
                  ))}
                </div>
              )}
              <QuickMemberDialog onSelect={selectMember} />
            </>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="diskonTotal">Diskon Total</Label>
            <Input
              id="diskonTotal"
              type="number"
              min={0}
              value={diskonTotal}
              onChange={(e) => setDiskonTotal(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <Select
              value={metodePembayaran}
              onValueChange={(v) =>
                setMetodePembayaran(
                  v as "TUNAI" | "TRANSFER" | "QRIS" | "KARTU",
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUNAI">Tunai</SelectItem>
                <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                <SelectItem value="QRIS">QRIS</SelectItem>
                <SelectItem value="KARTU">Kartu Debit/Kredit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jumlahDibayar">Jumlah Dibayar</Label>
            <Input
              id="jumlahDibayar"
              type="number"
              min={0}
              value={jumlahDibayar}
              onChange={(e) => setJumlahDibayar(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>Kembalian</span>
            <span>{formatRupiah(Math.max(kembalian, 0))}</span>
          </div>
          <Button
            className="w-full"
            disabled={pending}
            onClick={handleCheckout}
          >
            {pending ? "Memproses..." : "Bayar"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={resetForm}
          >
            Batalkan Keranjang
          </Button>
        </div>
      </div>

      {struk && <StrukDialog data={struk} onClose={() => setStruk(null)} />}
    </div>
  );
}
