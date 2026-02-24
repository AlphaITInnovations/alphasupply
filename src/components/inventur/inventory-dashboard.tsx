"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Euro,
  BarChart3,
  Plus,
  ClipboardCheck,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
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

type ArticleValue = {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  avgPurchasePrice: number;
  totalValue: number;
};

type Stats = {
  articleCount: number;
  totalStockUnits: number;
  warehouseValue: number;
  articlesWithPrice: number;
  articlesWithoutPrice: number;
  categoryStats: Record<string, { count: number; stock: number; value: number }>;
  allArticlesWithValue: ArticleValue[];
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

const categoryBadgeColors: Record<string, string> = {
  HIGH_TIER: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  MID_TIER: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  LOW_TIER: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
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
  const [search, setSearch] = useState("");
  const [showAllArticles, setShowAllArticles] = useState(false);

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

  // Filter articles for value list
  const filteredArticles = search.trim()
    ? stats.allArticlesWithValue.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.sku.toLowerCase().includes(search.toLowerCase())
      )
    : stats.allArticlesWithValue;

  const displayedArticles = showAllArticles
    ? filteredArticles
    : filteredArticles.slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Lagerwert - Hero Card */}
        <Card className="sm:col-span-2 lg:col-span-1 border-primary/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Euro className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Lagerwert gesamt
                </p>
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(stats.warehouseValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Netto-Einkaufswert · {stats.articlesWithPrice} Artikel bewertet
                  {stats.articlesWithoutPrice > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}· {stats.articlesWithoutPrice} ohne Preis
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bestand */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Digitaler Bestand
                </p>
                <p className="text-3xl font-bold">{stats.totalStockUnits}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Einheiten über {stats.articleCount} Artikel
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wert nach Kategorie */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Wert nach Kategorie
                </p>
                {Object.entries(stats.categoryStats).map(([cat, data]) => (
                  <div key={cat} className="flex items-center justify-between gap-3 leading-relaxed">
                    <span className="text-xs font-medium">
                      {articleCategoryLabels[cat] || cat}
                    </span>
                    <span className="text-xs font-semibold tabular-nums">
                      {formatCurrency(data.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center gap-3">
        {activeInventory ? (
          <Button asChild size="lg">
            <Link href={`/inventur/${activeInventory.id}`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Laufende Inventur fortsetzen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button onClick={() => setShowNewDialog(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Neue Inventur starten
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          Physischen Bestand prüfen und mit dem digitalen Lager abgleichen
        </p>
      </div>

      {/* Artikelwerte - Full List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Euro className="h-4 w-4" />
              Lagerwert pro Artikel
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Artikel suchen..."
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left pb-2 pr-4 font-medium">Artikel</th>
                  <th className="text-left pb-2 pr-4 font-medium hidden sm:table-cell">SKU</th>
                  <th className="text-left pb-2 pr-4 font-medium hidden md:table-cell">Kategorie</th>
                  <th className="text-right pb-2 pr-4 font-medium">Bestand</th>
                  <th className="text-right pb-2 pr-4 font-medium hidden sm:table-cell">EK-Preis</th>
                  <th className="text-right pb-2 font-medium">Wert</th>
                </tr>
              </thead>
              <tbody>
                {displayedArticles.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4 font-medium">{a.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      {a.sku}
                    </td>
                    <td className="py-2 pr-4 hidden md:table-cell">
                      <Badge variant="outline" className={`text-[10px] ${categoryBadgeColors[a.category] || ""}`}>
                        {articleCategoryLabels[a.category] || a.category}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {a.currentStock} {a.unit}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                      {a.avgPurchasePrice > 0 ? formatCurrency(a.avgPurchasePrice) : "–"}
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold">
                      {a.totalValue > 0 ? formatCurrency(a.totalValue) : "–"}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="font-semibold border-t-2">
                  <td className="pt-3 pr-4" colSpan={3}>
                    <span className="hidden md:inline">Gesamt ({filteredArticles.length} Artikel)</span>
                    <span className="md:hidden">Gesamt</span>
                  </td>
                  <td className="pt-3 pr-4 text-right tabular-nums">
                    {filteredArticles.reduce((s, a) => s + a.currentStock, 0)}
                  </td>
                  <td className="pt-3 pr-4 hidden sm:table-cell" />
                  <td className="pt-3 text-right tabular-nums">
                    {formatCurrency(filteredArticles.reduce((s, a) => s + a.totalValue, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {!showAllArticles && filteredArticles.length > 15 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3"
              onClick={() => setShowAllArticles(true)}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Alle {filteredArticles.length} Artikel anzeigen
            </Button>
          )}
          {showAllArticles && filteredArticles.length > 15 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3"
              onClick={() => setShowAllArticles(false)}
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Weniger anzeigen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Past Inventories */}
      {inventories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" />
              Durchgeführte Inventuren
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
                      von {inv.startedBy} am{" "}
                      {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {inv.checkedItems}/{inv.totalItems} geprüft
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.deviations > 0
                        ? `${inv.deviations} Abweichung${inv.deviations > 1 ? "en" : ""}`
                        : "Keine Abweichungen"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
              Physischen Lagerbestand mit dem digitalen System abgleichen.
              Alle aktiven Artikel werden aufgenommen, der aktuelle Systembestand
              wird als Soll-Wert gesetzt.
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
