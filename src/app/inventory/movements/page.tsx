export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStockMovements, getArticles } from "@/queries/inventory";
import { stockMovementTypeLabels } from "@/types/inventory";
import { StockMovementForm } from "@/components/inventory/stock-movement-form";
import Link from "next/link";

export default async function MovementsPage() {
  const [movements, articles] = await Promise.all([
    getStockMovements({ limit: 100 }),
    getArticles(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lagerbewegungen</h1>
        <StockMovementForm
          articles={articles.map((a) => ({
            id: a.id,
            name: a.name,
            sku: a.sku,
          }))}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Artikel</TableHead>
              <TableHead>Art</TableHead>
              <TableHead className="text-right">Menge</TableHead>
              <TableHead>Grund</TableHead>
              <TableHead>Durchgeführt von</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Keine Lagerbewegungen vorhanden.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {new Date(m.createdAt).toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/inventory/${m.articleId}`}
                      className="text-primary hover:underline"
                    >
                      {m.article.sku} - {m.article.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.type === "IN"
                          ? "default"
                          : m.type === "OUT"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {stockMovementTypeLabels[m.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {m.type === "IN" ? "+" : m.type === "OUT" ? "" : "="}
                    {m.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.reason ?? "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.performedBy ?? "–"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
