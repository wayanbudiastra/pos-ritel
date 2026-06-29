import { z } from "zod";

export const produkSchema = z.object({
  sku: z.string().min(1, "SKU wajib diisi").max(50),
  barcode: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  nama: z.string().min(2, "Nama produk minimal 2 karakter").max(200),
  kategoriId: z.string().min(1, "Kategori wajib dipilih"),
  satuan: z.string().min(1, "Satuan wajib diisi").max(30),
  hpp: z.coerce.number().min(0, "HPP tidak boleh negatif"),
  hargaRitel: z.coerce.number().min(0, "Harga ritel tidak boleh negatif"),
  hargaGrosir: z.coerce.number().min(0, "Harga grosir tidak boleh negatif"),
  minQtyGrosir: z.coerce.number().int().min(1, "Minimum qty grosir minimal 1"),
  stokMinimum: z.coerce
    .number()
    .int()
    .min(0, "Stok minimum tidak boleh negatif"),
});

export type ProdukInput = z.infer<typeof produkSchema>;
