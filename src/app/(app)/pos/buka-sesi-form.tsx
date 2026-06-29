"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { bukaSesiAction } from "./actions";

export function BukaSesiForm() {
  const [state, formAction, pending] = useActionState(
    bukaSesiAction,
    undefined,
  );

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Buka Sesi Kasir</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modalAwal">Modal Awal</Label>
              <Input
                id="modalAwal"
                name="modalAwal"
                type="number"
                step="0.01"
                min="0"
                required
                autoFocus
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Memproses..." : "Mulai Shift"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
