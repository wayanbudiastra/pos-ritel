import { auth } from "@/lib/auth";
import { listMember } from "@/services/member.service";
import { MemberDialog } from "./member-dialog";
import { MemberTable } from "./member-table";

export default async function MemberPage() {
  const [memberList, session] = await Promise.all([listMember(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Member</h1>
        {isAdmin && <MemberDialog />}
      </div>
      <MemberTable data={memberList} isAdmin={isAdmin} />
    </div>
  );
}
