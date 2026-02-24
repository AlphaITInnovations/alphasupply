"use client";

import { Fragment, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Hash,
  Search,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  articleCategoryLabels,
  serialNumberStatusLabels,
} from "@/types/inventory";

type SerialNumberInfo = {
  id: string;
  serialNo: string;
  status: string;
};

type StockArticle = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  incomingStock: number;
  minStockLevel: number;
  serialNumbers: SerialNumberInfo[];
};

type SortKey = "name" | "currentStock" | "category";
type SortDir = "asc" | "desc";

const tierBadgeColors: Record<string, string> = {
  HIGH_TIER:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  MID_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  LOW_TIER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const snStatusDotColors: Record<string, string> = {
  IN_STOCK: "bg-emerald-500 shadow-[0_0_4px_theme(colors.emerald.500)]",
  RESERVED: "bg-blue-500 shadow-[0_0_4px_theme(colors.blue.500)]",
  DEPLOYED: "bg-gray-400",
  DEFECTIVE: "bg-red-500 shadow-[0_0_4px_theme(colors.red.500)]",
  RETURNED: "bg-amber-500 shadow-[0_0_4px_theme(colors.amber.500)]",
  DISPOSED: "bg-slate-400",
};

type FilterCategory = "ALL" | "HIGH_TIER" | "MID_TIER" | "LOW_TIER";

export function StockOverview({ articles }: { articles: StockArticle[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    let result = articles;

    // Filter by category
    if (filter !== "ALL") {
      result = result.filter((a) => a.category === filter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.sku.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "de");
          break;
        case "currentStock":
          cmp = a.currentStock - b.currentStock;
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [articles, filter, search, sortKey, sortDir]);

  const totalStock = filtered.reduce((sum, a) => sum + a.currentStock, 0);

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

  function stockColor(current: number, min: number): string {
    if (min === 0) return "";
    if (current > min) return "text-emerald-600 dark:text-emerald-400";
    if (current === min) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{filtered.length}</span> Artikel
        </span>
        <span>
          <span className="font-semibold text-foreground">{totalStock}</span> Einheiten gesamt
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10" />
              <TableHead className="py-3">
                <SortHeader label="Artikel" sortKeyName="name" />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                SKU
              </TableHead>
              <TableHead className="py-3">
                <SortHeader label="Tier" sortKeyName="category" />
              </TableHead>
              <TableHead className="py-3 text-right">
                <SortHeader
                  label="Bestand"
                  sortKeyName="currentStock"
                  className="justify-end"
                />
              </TableHead>
              <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider">
                Im Zulauf
              </TableHead>
              <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider">
                Min-Bestand
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Status
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
              filtered.map((article) => {
                const hasSerialnumbers =
                  article.category === "HIGH_TIER" &&
                  article.serialNumbers.length > 0;
                const isExpanded = expandedRows.has(article.id);
                const stockStatus = getStockStatus(
                  article.currentStock,
                  article.minStockLevel
                );

                return (
                  <Fragment key={article.id}>
                    <TableRow
                      className={`border-border/30 transition-colors duration-150 ${
                        hasSerialnumbers ? "cursor-pointer" : ""
                      } ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={
                        hasSerialnumbers
                          ? () => toggleExpand(article.id)
                          : undefined
                      }
                    >
                      {/* Expand chevron */}
                      <TableCell className="w-10 px-3">
                        {hasSerialnumbers && (
                          <div className="flex h-5 w-5 items-center justify-center rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Artikel name */}
                      <TableCell>
                        <Link
                          href={`/artikelverwaltung/${article.id}`}
                          className="text-sm font-medium hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {article.name}
                        </Link>
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {article.sku}
                        </span>
                      </TableCell>

                      {/* Tier Badge */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${tierBadgeColors[article.category] ?? ""}`}
                        >
                          {articleCategoryLabels[article.category]}
                        </span>
                      </TableCell>

                      {/* Bestand */}
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-bold tabular-nums ${stockColor(article.currentStock, article.minStockLevel)}`}
                        >
                          {article.currentStock}
                          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                            {article.unit}
                          </span>
                        </span>
                      </TableCell>

                      {/* Im Zulauf */}
                      <TableCell className="text-right">
                        {article.incomingStock > 0 ? (
                          <span className="text-sm font-medium tabular-nums text-amber-500">
                            +{article.incomingStock}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 tabular-nums">
                            &ndash;
                          </span>
                        )}
                      </TableCell>

                      {/* Min-Bestand */}
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {article.minStockLevel > 0
                            ? article.minStockLevel
                            : "\u2013"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Expanded serial numbers */}
                    {hasSerialnumbers && isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/30">
                        <TableCell />
                        <TableCell colSpan={7} className="py-3 pr-6">
                          <div className="space-y-2.5">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              Seriennummern ({article.serialNumbers.length})
                            </p>
                            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {article.serialNumbers.map((sn) => (
                                <div
                                  key={sn.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-3 py-2 transition-colors hover:border-border"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-1.5 w-1.5 rounded-full ${snStatusDotColors[sn.status] ?? "bg-gray-400"}`}
                                    />
                                    <span className="font-mono text-xs font-medium">
                                      {sn.serialNo}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {serialNumberStatusLabels[sn.status]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function getStockStatus(
  current: number,
  min: number
): { label: string; className: string } {
  if (min === 0) {
    return {
      label: "OK",
      className:
        "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
    };
  }
  if (current > min) {
    return {
      label: "OK",
      className:
        "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
    };
  }
  if (current === min) {
    return {
      label: "Knapp",
      className:
        "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300",
    };
  }
  return {
    label: "Niedrig",
    className:
      "border-red-200 text-red-700 dark:border-red-800 dark:text-red-300",
  };
}
