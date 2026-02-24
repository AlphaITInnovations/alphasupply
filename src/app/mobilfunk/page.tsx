export const dynamic = "force-dynamic";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveMobilfunk } from "@/queries/mobilfunk";
import { PageHeader } from "@/components/layout/page-header";
import { mobilfunkTypeLabels, simTypeLabels, mobilfunkTariffLabels } from "@/types/orders";

export default async function MobilfunkPage() {
  const entries = await getActiveMobilfunk();

  return (
    <div className="space-y-6">
      <PageHeader title="Mobilfunk" description="Eingerichtete Geräte im Umlauf" />

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Smartphone className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Keine eingerichteten Geräte
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
              Hier werden Mobilfunk-Geräte angezeigt, die über Aufträge eingerichtet wurden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Auftrag</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Empfänger</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Typ</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">IMEI</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Handynummer</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Tarif</TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Eingerichtet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((mf) => (
                <TableRow key={mf.id} className="border-border/30">
                  <TableCell>
                    <Link
                      href={`/orders/${mf.order.id}`}
                      className="font-mono text-xs text-primary hover:underline font-semibold"
                    >
                      {mf.order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{mf.order.orderedFor}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        mf.type === "PHONE_AND_SIM"
                          ? "text-violet-700 border-violet-300 dark:text-violet-300 dark:border-violet-800"
                          : mf.type === "PHONE_ONLY"
                            ? "text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-800"
                            : "text-cyan-700 border-cyan-300 dark:text-cyan-300 dark:border-cyan-800"
                      }`}
                    >
                      {mobilfunkTypeLabels[mf.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {mf.imei || "–"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {mf.phoneNumber || "–"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {mf.tariff ? mobilfunkTariffLabels[mf.tariff] : "–"}
                    {mf.simType && (
                      <span className="ml-1 text-muted-foreground">
                        ({simTypeLabels[mf.simType]})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {mf.setupAt
                      ? new Date(mf.setupAt).toLocaleDateString("de-DE")
                      : "–"}
                    {mf.setupBy && ` (${mf.setupBy})`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
