"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { articleCategoryLabels } from "@/types/inventory";

type ArticleRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  productGroup: string | null;
  productSubGroup: string | null;
  avgPurchasePrice: number | null;
  currentStock: number;
  isActive: boolean;
};

type SortKey = "name" | "sku" | "category" | "currentStock";
type SortDir = "asc" | "desc";

type FilterCategory = "ALL" | "HIGH_TIER" | "MID_TIER" | "LOW_TIER";

const tierBadgeColors: Record<string, string> = {
  HIGH_TIER:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  MID_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  LOW_TIER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function ArticleCatalog({ articles }: { articles: ArticleRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = articles;

    if (filter !== "ALL") {
      result = result.filter((a) => a.category === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.sku.toLowerCase().includes(q) ||
          (a.productGroup && a.productGroup.toLowerCase().includes(q)) ||
          (a.productSubGroup && a.productSubGroup.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "de");
          break;
        case "sku":
          cmp = a.sku.localeCompare(b.sku, "de");
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
        case "currentStock":
          cmp = a.currentStock - b.currentStock;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [articles, filter, search, sortKey, sortDir]);

  const filterPills: { value: FilterCategory; label: string }[] = [
    { value: "ALL", label: "Alle" },
    { value: "HIGH_TIER", label: "High-Tier" },
    { value: "MID_TIER", label: "Mid-Tier" },
    { value: "LOW_TIER", label: "Low-Tier" },
  ];

  const SortHeader = ({
    label,
    sortKeyName,
    className,
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => {
    const isCurrentSort = sortKey === sortKeyName;
    return (
      <button
        onClick={() => toggleSort(sortKeyName)}
        className={`group/sort flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground ${className ?? ""}`}
      >
        {label}
        {isCurrentSort ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-50 transition-opacity" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters + Create button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Artikel suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {filterPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setFilter(pill.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === pill.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
        <Button asChild>
          <Link href="/artikelverwaltung/neu">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Artikel
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3">
                <SortHeader label="Name" sortKeyName="name" />
              </TableHead>
              <TableHead className="py-3">
                <SortHeader label="SKU" sortKeyName="sku" />
              </TableHead>
              <TableHead className="py-3">
                <SortHeader label="Tier" sortKeyName="category" />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Produktgruppe
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Untergruppe
              </TableHead>
              <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider">
                EK-Preis
              </TableHead>
              <TableHead className="py-3 text-right">
                <SortHeader
                  label="Bestand"
                  sortKeyName="currentStock"
                  className="justify-end"
                />
              </TableHead>
              <TableHead className="py-3 text-center text-xs font-semibold uppercase tracking-wider">
                Aktiv
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      Keine Artikel gefunden
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Passen Sie die Suche oder Filter an.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((article) => (
                <TableRow
                  key={article.id}
                  className="border-border/30 group cursor-pointer hover:bg-muted/30"
                >
                  {/* Name */}
                  <TableCell>
                    <Link
                      href={`/artikelverwaltung/${article.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {article.name}
                    </Link>
                  </TableCell>

                  {/* SKU */}
                  <TableCell>
                    <Link
                      href={`/artikelverwaltung/${article.id}`}
                      className="font-mono text-xs text-muted-foreground hover:text-primary"
                    >
                      {article.sku}
                    </Link>
                  </TableCell>

                  {/* Tier Badge */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${tierBadgeColors[article.category] ?? ""}`}
                    >
                      {articleCategoryLabels[article.category]}
                    </span>
                  </TableCell>

                  {/* Produktgruppe */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {article.productGroup || "\u2013"}
                    </span>
                  </TableCell>

                  {/* Untergruppe */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {article.productSubGroup || "\u2013"}
                    </span>
                  </TableCell>

                  {/* EK-Preis */}
                  <TableCell className="text-right">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {article.avgPurchasePrice != null
                        ? `${article.avgPurchasePrice.toFixed(2)} \u20AC`
                        : "\u2013"}
                    </span>
                  </TableCell>

                  {/* Bestand */}
                  <TableCell className="text-right">
                    <span className="text-sm font-bold tabular-nums">
                      {article.currentStock}
                    </span>
                  </TableCell>

                  {/* Aktiv */}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          article.isActive
                            ? "bg-emerald-500 shadow-[0_0_4px_theme(colors.emerald.500)]"
                            : "bg-red-500 shadow-[0_0_4px_theme(colors.red.500)]"
                        }`}
                      />
                    </div>
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
