"use client";

import { Button } from "@/components/ui/button";

export function PrintPoButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      Cetak PO
    </Button>
  );
}
