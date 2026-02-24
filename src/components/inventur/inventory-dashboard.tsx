"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Euro,
  BarChart3,
  AlertTriangle,
  Plus,
  ClipboardCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { startInventory } from "@/actions/inventur";
import { articleCategoryLabels } from "@/types/inventory";
import { toast } from "sonner";

type Stats = {
  articleCount: number;
  totalStockUnits: number;
  warehouseValue: number;
  categoryStats: Record<string, { count: number; stock: number; value: number }>;
  lowStockArticles: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
  }[];
  topValueArticles: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    totalValue: number;
    avgPurchasePrice: number;
    unit: string;
  }[];
};

type InventorySummary = {
  id: string;
  name: string;
  status: string;
  startedBy: string;
  completedAt: string | null;
  createdAt: string;
  totalItems: number;
  checkedItems: number;
  deviations: number;
};

const statusLabels: Record<string, string> = {
  IN_PROGRESS: "Laufend",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Abgebrochen",
};

const statusColors: Record<string, string> = {
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

const categoryColors: Record<string, string> = {
  HIGH_TIER: "text-amber-600 dark:text-amber-400",
  MID_TIER: "text-blue-600 dark:text-blue-400",
  LOW_TIER: "text-emerald-600 dark:text-emerald-400",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function InventoryDashboard({
  stats,
  inventories,
}: {
  stats: Stats;
  inventories: InventorySummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [name, setName] = useState("");
  const [startedBy, setStartedBy] = useState("");

  function handleStart() {
    if (!name.trim() || !startedBy.trim()) return;
    startTransition(async () => {
      const result = await startInventory({
        name: name.trim(),
        startedBy: startedBy.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.inventoryId) {
        toast.success("Inventur gestartet.");
        setShowNewDialog(false);
        router.push(`/inventur/${result.inventoryId}`);
      }
    });
  }

  const activeInventory = inventories.find((i) => i.status === "IN_PROGRESS");

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Artikel gesamt</p>
                <p className="text-2xl font-bold">{stats.articleCount}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalStockUnits} Einheiten
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Euro className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lagerwert</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.warehouseValue)}
                </p>
                <p className="text-xs text-muted-foreground">Netto-EK</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kategorien</p>
                <div className="flex flex-col gap-0.5 mt-1">
                  {Object.entries(stats.categoryStats).map(([cat, data]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${categoryColors[cat] || ""}`}>
                        {articleCategoryLabels[cat] || cat}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {data.count} ({data.stock} Stk)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                stats.lowStockArticles.length > 0
                  ? "bg-amber-500/10"
                  : "bg-emerald-500/10"
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  stats.lowStockArticles.length > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Unter Mindestbestand
                </p>
                <p className="text-2xl font-bold">
                  {stats.lowStockArticles.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.lowStockArticles.length === 0
                    ? "Alles OK"
                    : "Nachbestellung prüfen"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap gap-3">
        {activeInventory ? (
          <Button asChild>
            <Link href={`/inventur/${activeInventory.id}`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Laufende Inventur fortsetzen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Inventur starten
          </Button>
        )}
      </div>

      {/* Two column: Top Value + Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Value Articles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Wertintensivste Artikel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topValueArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Artikelpreise hinterlegt.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.topValueArticles.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.currentStock} {a.unit} × {formatCurrency(a.avgPurchasePrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {formatCurrency(a.totalValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Unter Mindestbestand
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Alle Artikel über Mindestbestand.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.lowStockArticles.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {a.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {a.currentStock} / {a.minStockLevel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ist / Mindest
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Past Inventories */}
      {inventories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" />
              Inventuren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventories.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/inventur/${inv.id}`}
                  className="flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{inv.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusColors[inv.status] || ""}`}
                      >
                        {statusLabels[inv.status] || inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gestartet von {inv.startedBy} am{" "}
                      {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {inv.checkedItems}/{inv.totalItems}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.deviations > 0
                        ? `${inv.deviations} Abweichungen`
                        : "Keine Abweichungen"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Inventory Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Inventur starten</DialogTitle>
            <DialogDescription>
              Alle aktiven Artikel werden in die Inventur aufgenommen.
              Der aktuelle Bestand wird als Soll-Wert übernommen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bezeichnung</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Inventur Q1 2026"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Durchgeführt von</Label>
              <Input
                value={startedBy}
                onChange={(e) => setStartedBy(e.target.value)}
                placeholder="Name des Verantwortlichen"
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={!name.trim() || !startedBy.trim() || isPending}
              className="w-full"
            >
              {isPending ? "Wird erstellt..." : "Inventur starten"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
