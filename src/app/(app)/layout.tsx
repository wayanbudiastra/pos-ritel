import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";
import type { Role } from "@prisma/client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={session?.user?.name ?? ""}
        role={(session?.user?.role as Role) ?? "KASIR"}
      />
      <main className="min-w-0 flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  );
}
