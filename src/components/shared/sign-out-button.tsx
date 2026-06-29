"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOutAction } from "@/app/(app)/actions";

export function SignOutButton({ collapsed }: { collapsed?: boolean }) {
  const button = (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className={
        collapsed ? "w-9 justify-center px-0" : "w-full justify-start gap-2"
      }
    >
      <LogOut className="size-4" />
      {!collapsed && "Keluar"}
    </Button>
  );

  if (collapsed) {
    return (
      <form action={signOutAction}>
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent side="right">Keluar</TooltipContent>
        </Tooltip>
      </form>
    );
  }

  return <form action={signOutAction}>{button}</form>;
}
