import { z } from "zod";

export const hargaKhususSchema = z.object({
  produkId: z.string().min(1, "Produk wajib dipilih"),
  hargaKhusus: z.coerce.number().min(0, "Harga khusus tidak boleh negatif"),
  tanggalMulai: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  tanggalBerakhir: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  catatan: z
    .string()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  konfirmasiDiBawahHpp: z.coerce.boolean().optional(),
});

export type HargaKhususInput = z.infer<typeof hargaKhususSchema>;
