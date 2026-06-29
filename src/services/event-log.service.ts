import { prisma } from "@/lib/prisma";
import type { Prisma, EventType } from "@prisma/client";

// PRD 2.5: Integration Hooks — dicatat agar modul akuntansi terpisah dapat
// membaca event ini secara asinkron tanpa modul POS perlu tahu detail akuntansi.
export function logEvent(
  eventType: EventType,
  referensiId: string,
  payload: Prisma.InputJsonValue,
) {
  return prisma.eventLog.create({ data: { eventType, referensiId, payload } });
}
