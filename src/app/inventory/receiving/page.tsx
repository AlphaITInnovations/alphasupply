export const dynamic = "force-dynamic";

import { PackageOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ManualReceivingDialog } from "@/components/inventory/receiving-form";
import {
  getArticlesForReceiving,
  getArticleGroupSuggestions,
  getNextArticleNumber,
} from "@/queries/inventory";

export default async function ReceivingPage() {
  const [articles, groupSuggestions, nextSku] = await Promise.all([
    getArticlesForReceiving(),
    getArticleGroupSuggestions(),
    getNextArticleNumber(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wareneingang</h1>
        <ManualReceivingDialog
          articles={articles}
          groupSuggestions={groupSuggestions}
          nextSku={nextSku}
        />
      </div>

      {/* Platzhalter: Hier werden später offene Bestellungen/Aufträge angezeigt */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <PackageOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            Keine offenen Wareneingänge
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
            Hier werden zukünftig offene Bestellungen angezeigt, die auf Wareneingang warten. Nutze den Button oben rechts für manuelles Einbuchen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
