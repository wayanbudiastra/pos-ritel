import { z } from "zod";

export const jurnalLineSchema = z
  .object({
    akunId: z.string().min(1, "Akun wajib dipilih"),
    debit: z.coerce.number().min(0).default(0),
    kredit: z.coerce.number().min(0).default(0),
    keterangan: z
      .string()
      .max(300)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
  })
  .refine((line) => !(line.debit > 0 && line.kredit > 0), {
    message: "Satu baris tidak boleh memiliki debit dan kredit sekaligus",
  })
  .refine((line) => line.debit > 0 || line.kredit > 0, {
    message: "Baris harus memiliki nilai debit atau kredit",
  });

export const jurnalManualSchema = z
  .object({
    tanggal: z.string().min(1, "Tanggal wajib diisi"),
    keterangan: z.string().min(3, "Keterangan minimal 3 karakter").max(300),
    lines: z.array(jurnalLineSchema).min(2, "Jurnal harus memiliki minimal 2 baris"),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalKredit = data.lines.reduce((sum, l) => sum + l.kredit, 0);
      return Math.abs(totalDebit - totalKredit) < 0.01;
    },
    { message: "Total debit harus sama dengan total kredit" }
  );

export type JurnalManualInput = z.infer<typeof jurnalManualSchema>;
