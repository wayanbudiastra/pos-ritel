import { z } from "zod";

export const checkoutItemSchema = z.object({
  produkId: z.string().min(1),
  qty: z.coerce.number().int().min(1, "Qty minimal 1"),
});

export const checkoutSchema = z.object({
  sesiKasirId: z.string().min(1, "Sesi kasir tidak ditemukan"),
  tipeTransaksi: z.enum(["RITEL", "GROSIR"]),
  memberId: z.string().optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, "Keranjang masih kosong"),
  diskonTotal: z.coerce.number().min(0).default(0),
  metodePembayaran: z.enum(["TUNAI", "TRANSFER", "QRIS", "KARTU"]),
  jumlahDibayar: z.coerce.number().min(0),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const returSchema = z.object({
  transaksiItemId: z.string().min(1),
  qty: z.coerce.number().int().min(1, "Qty retur minimal 1"),
  alasan: z.string().min(3, "Alasan retur wajib diisi").max(300),
});

export type ReturInput = z.infer<typeof returSchema>;
