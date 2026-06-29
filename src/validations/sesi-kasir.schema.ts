import { z } from "zod";

export const bukaSesiSchema = z.object({
  modalAwal: z.coerce.number().min(0, "Modal awal tidak boleh negatif"),
});

export type BukaSesiInput = z.infer<typeof bukaSesiSchema>;

export const tutupSesiSchema = z.object({
  totalKasAkhir: z.coerce
    .number()
    .min(0, "Total kas akhir tidak boleh negatif"),
  catatan: z
    .string()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type TutupSesiInput = z.infer<typeof tutupSesiSchema>;
