import { z } from "zod";

export const memberSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(150),
  noHp: z.string().min(8, "Nomor HP tidak valid").max(20),
  email: z
    .string()
    .email("Email tidak valid")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  alamat: z
    .string()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  catatan: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type MemberInput = z.infer<typeof memberSchema>;

// Pendaftaran cepat oleh Kasir saat transaksi (PRD 5.2.2): hanya nama + no. HP.
export const memberQuickSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(150),
  noHp: z.string().min(8, "Nomor HP tidak valid").max(20),
});

export type MemberQuickInput = z.infer<typeof memberQuickSchema>;
