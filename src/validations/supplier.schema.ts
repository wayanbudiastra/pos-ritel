import { z } from "zod";

export const supplierSchema = z.object({
  nama: z.string().min(2, "Nama supplier minimal 2 karakter").max(200),
  kontakPerson: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  telepon: z
    .string()
    .max(30)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  alamat: z
    .string()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
