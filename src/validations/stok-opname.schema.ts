import { z } from "zod";

export const createOpnameSchema = z.object({
  lingkup: z.string().min(1, "Lingkup wajib dipilih"), // "SEMUA" atau id kategori
});

export type CreateOpnameInput = z.infer<typeof createOpnameSchema>;

export const inputFisikSchema = z.object({
  stokOpnameItemId: z.string().min(1),
  stokFisik: z.coerce.number().int().min(0, "Stok fisik tidak boleh negatif"),
  alasanKode: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type InputFisikInput = z.infer<typeof inputFisikSchema>;
