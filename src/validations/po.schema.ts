import { z } from "zod";

export const poItemSchema = z.object({
  produkId: z.string().min(1),
  qtyPesan: z.coerce.number().int().min(1, "Qty pesan minimal 1"),
  hargaBeli: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
});

export const createPoSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  items: z.array(poItemSchema).min(1, "PO harus memiliki minimal 1 item"),
});

export type CreatePoInput = z.infer<typeof createPoSchema>;
