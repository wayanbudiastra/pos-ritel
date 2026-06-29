"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTableSearch } from "@/hooks/use-table-search";
import { TablePagination } from "@/components/shared/table-pagination";
import { MemberDialog } from "./member-dialog";
import { ToggleMemberButton } from "./toggle-button";

type Member = {
  id: string;
  kodeMember: string;
  nama: string;
  noHp: string;
  email: string | null;
  alamat: string | null;
  catatan: string | null;
  aktif: boolean;
};

export function MemberTable({
  data,
  isAdmin,
}: {
  data: Member[];
  isAdmin: boolean;
}) {
  const {
    query,
    setQuery,
    pageRows,
    page,
    totalPages,
    totalFiltered,
    setPage,
  } = useTableSearch(
    data,
    (row, q) =>
      row.nama.toLowerCase().includes(q) ||
      row.kodeMember.toLowerCase().includes(q) ||
      row.noHp.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, kode member, atau no. HP..."
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>No. HP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.kodeMember}</TableCell>
              <TableCell>{m.nama}</TableCell>
              <TableCell>{m.noHp}</TableCell>
              <TableCell>
                <Badge variant={m.aktif ? "success" : "secondary"}>
                  {m.aktif ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/member/${m.id}`} />}
                >
                  Detail
                </Button>
                {isAdmin && (
                  <>
                    <MemberDialog member={m} />
                    <ToggleMemberButton id={m.id} aktif={m.aktif} />
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {pageRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Tidak ada member yang cocok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={totalFiltered}
        onPageChange={setPage}
      />
    </div>
  );
}
