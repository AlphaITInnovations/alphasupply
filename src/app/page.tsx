export const dynamic = "force-dynamic";

import {
  ClipboardList,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  Wrench,
  ShoppingCart,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/queries/inventory";
import { articleCategoryLabels } from "@/types/inventory";
import Link from "next/link";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* KPI-Karten */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/orders" className="block">
          <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-petrol/5 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offene Auftr&auml;ge
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-petrol/10">
                <ClipboardList className="h-4 w-4 text-petrol" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight">{stats.openOrders}</div>
              <p className="mt-1 text-xs text-muted-foreground">NEW / IN_PROGRESS</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/procurement" className="block">
          <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bestellwesen
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <ShoppingCart className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.procPendingOrders}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">M&uuml;ssen bestellt werden</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/techniker" className="block">
          <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Techniker
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                <Wrench className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.techPendingOrders}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Warten auf Bearbeitung</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory/receiving" className="block">
          <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Zulauf
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <PackageCheck className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                {stats.incomingArticles}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Artikel im Wareneingang</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Niedrigbestand */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                </div>
                Niedrigbestand
                {stats.lowStockArticles.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {stats.lowStockArticles.length}
                  </Badge>
                )}
              </CardTitle>
              <Link href="/inventory/stock" className="text-xs font-medium text-primary hover:underline">
                Alle anzeigen
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.lowStockArticles.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <p className="mt-3 text-sm font-medium">Alles im gr&uuml;nen Bereich</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alle Artikel haben ausreichend Bestand.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.lowStockArticles.map((article) => {
                  const fillPercent = article.minStockLevel > 0
                    ? Math.min(100, Math.round((article.currentStock / article.minStockLevel) * 100))
                    : 100;
                  return (
                    <Link
                      key={article.id}
                      href={`/inventory/${article.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-border hover:shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                            {article.name}
                          </p>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {articleCategoryLabels[article.category]}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-destructive to-destructive/70 transition-all duration-500"
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs font-mono font-bold text-destructive">
                            {article.currentStock}/{article.minStockLevel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aktivitaets-Log (letzte 48h, scrollbar) */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-petrol/10">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-petrol" />
                </div>
                Aktivit&auml;ts-Log
                <span className="text-xs font-normal text-muted-foreground">48 h</span>
              </CardTitle>
              <Link href="/inventory/movements" className="text-xs font-medium text-primary hover:underline">
                Alle anzeigen
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {stats.recentMovements.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Keine Aktivit&auml;ten</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keine Lagerbewegungen in den letzten 48 Stunden.
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {stats.recentMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      movement.type === "IN"
                        ? "bg-success/10"
                        : movement.type === "OUT"
                          ? "bg-destructive/10"
                          : "bg-warning/10"
                    }`}>
                      {movement.type === "IN" ? (
                        <ArrowDownRight className="h-4 w-4 text-success" />
                      ) : movement.type === "OUT" ? (
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {movement.article.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {movement.reason ?? "Keine Angabe"}
                        {movement.performedBy && ` \u00b7 ${movement.performedBy}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold font-mono ${
                        movement.type === "IN"
                          ? "text-success"
                          : movement.type === "OUT"
                            ? "text-destructive"
                            : "text-warning"
                      }`}>
                        {movement.type === "IN" ? "+" : movement.type === "OUT" ? "-" : ""}
                        {Math.abs(movement.quantity)}
                      </span>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
