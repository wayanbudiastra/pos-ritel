import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ExportButton({ href }: { href: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      render={<Link href={href} prefetch={false} />}
    >
      Export Excel
    </Button>
  );
}
