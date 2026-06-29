"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { memberSchema, memberQuickSchema } from "@/validations/member.schema";
import {
  createMember,
  updateMember,
  nonaktifkanMember,
  aktifkanMember,
  quickCreateMember,
} from "@/services/member.service";

type ActionState = { error?: string } | undefined;

function parseMemberForm(formData: FormData) {
  return memberSchema.safeParse({
    nama: formData.get("nama"),
    noHp: formData.get("noHp"),
    email: formData.get("email"),
    alamat: formData.get("alamat"),
    catatan: formData.get("catatan"),
  });
}

export async function createMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = parseMemberForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createMember(parsed.data);
  } catch {
    return { error: "Nomor HP sudah terdaftar." };
  }

  revalidatePath("/member");
  return {};
}

export async function updateMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const id = formData.get("id") as string;
  const parsed = parseMemberForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateMember(id, parsed.data);
  } catch {
    return { error: "Nomor HP sudah terdaftar." };
  }

  revalidatePath("/member");
  return {};
}

export async function toggleMemberAction(id: string, aktif: boolean) {
  await requireRole(["ADMIN"]);
  if (aktif) {
    await nonaktifkanMember(id);
  } else {
    await aktifkanMember(id);
  }
  revalidatePath("/member");
}

// Daftar cepat oleh Kasir saat transaksi di halaman POS.
export async function quickCreateMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(["ADMIN", "KASIR"]);

  const parsed = memberQuickSchema.safeParse({
    nama: formData.get("nama"),
    noHp: formData.get("noHp"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await quickCreateMember(parsed.data);
  } catch {
    return { error: "Nomor HP sudah terdaftar." };
  }

  revalidatePath("/pos");
  return {};
}
