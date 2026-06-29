import { z } from "zod";

export const grnItemSchema = z.object({
  poItemId: z.string().min(1),
  produkId: z.string().min(1),
  qtyDiterima: z.coerce.number().int().min(0),
  qtyDitolak: z.coerce.number().int().min(0).default(0),
  hargaAktual: z.coerce.number().min(0),
  nomorBatch: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  tanggalExpired: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  terimaKelebihan: z.coerce.boolean().optional(),
});

export const createGrnSchema = z.object({
  poId: z.string().min(1),
  catatan: z
    .string()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  items: z.array(grnItemSchema).min(1, "GRN harus memiliki minimal 1 item"),
});

export type CreateGrnInput = z.infer<typeof createGrnSchema>;
