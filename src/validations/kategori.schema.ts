import { z } from "zod";

export const kategoriSchema = z.object({
  nama: z.string().min(2, "Nama kategori minimal 2 karakter").max(100),
});

export type KategoriInput = z.infer<typeof kategoriSchema>;
