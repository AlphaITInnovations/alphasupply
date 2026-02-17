export const dynamic = "force-dynamic";

import { Package, AlertTriangle, ArrowLeftRight, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/queries/inventory";
import {
  articleCategoryLabels,
  stockMovementTypeLabels,
} from "@/types/inventory";
import Link from "next/link";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Statistik-Karten */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Artikel gesamt
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Niedrigbestand
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.lowStockArticles.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Seriennummern (im Lager)
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSerialNumbers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Letzte Bewegungen
            </CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recentMovements.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Niedrigbestand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Niedrigbestand
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Alle Artikel haben ausreichend Bestand.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/inventory/${article.id}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{article.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {article.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {article.currentStock} / {article.minStockLevel}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {articleCategoryLabels[article.category]}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Letzte Lagerbewegungen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Letzte Lagerbewegungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Lagerbewegungen vorhanden.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {movement.article.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {movement.reason ?? "Keine Angabe"}
                        {movement.performedBy && ` - ${movement.performedBy}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          movement.type === "IN"
                            ? "default"
                            : movement.type === "OUT"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {movement.type === "IN" ? "+" : ""}
                        {movement.quantity}{" "}
                        {stockMovementTypeLabels[movement.type]}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleString("de-DE")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
