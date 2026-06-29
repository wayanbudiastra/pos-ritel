import { z } from "zod";

export const akunSchema = z.object({
  kode: z.string().min(1, "Kode akun wajib diisi").max(20),
  nama: z.string().min(2, "Nama akun minimal 2 karakter").max(150),
  tipe: z.enum(["ASET", "LIABILITAS", "EKUITAS", "PENDAPATAN", "BEBAN", "HPP"]),
  saldoNormal: z.enum(["DEBIT", "KREDIT"]),
  indukAkunId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type AkunInput = z.infer<typeof akunSchema>;
