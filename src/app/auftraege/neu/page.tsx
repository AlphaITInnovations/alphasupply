export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { OrderCreateForm } from "@/components/auftraege/order-create-form";

export default async function NeuerAuftragPage() {
  const articles = await db.article.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      currentStock: true,
      unit: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/auftraege">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Neuer Auftrag</h1>
          <p className="text-muted-foreground">
            Neuen Auftrag anlegen
          </p>
        </div>
      </div>

      <OrderCreateForm articles={articles} />
    </div>
  );
}
