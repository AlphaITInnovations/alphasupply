import { db } from "@/lib/db";

export async function getActiveMobilfunk(search?: string) {
  return db.orderMobilfunk.findMany({
    where: {
      setupDone: true,
      ...(search && {
        OR: [
          { imei: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
          { order: { orderedFor: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          orderedFor: true,
          costCenter: true,
        },
      },
    },
    orderBy: { setupAt: "desc" },
  });
}
