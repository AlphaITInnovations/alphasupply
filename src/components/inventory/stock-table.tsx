"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Hash, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { articleCategoryLabels, serialNumberStatusLabels } from "@/types/inventory";

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
  minStockLevel: number;
  serialNumbers: SerialNumberInfo[];
};

type SortKey = "name" | "sku" | "category" | "currentStock" | "minStockLevel";
type SortDir = "asc" | "desc";

const categoryColors: Record<string, string> = {
  HIGH_TIER: "bg-indigo/10 text-indigo border-indigo/20",
  MID_TIER: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  LOW_TIER: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

export function StockTable({ articles }: { articles: StockArticle[] }) {
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

  const sorted = [...articles].sort((a, b) => {
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
      case "minStockLevel":
        cmp = a.minStockLevel - b.minStockLevel;
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortHeader = ({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) => {
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
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10" />
            <TableHead className="py-3">
              <SortHeader label="Art.Nr." sortKeyName="sku" />
            </TableHead>
            <TableHead className="py-3">
              <SortHeader label="Bezeichnung" sortKeyName="name" />
            </TableHead>
            <TableHead className="py-3">
              <SortHeader label="Kategorie" sortKeyName="category" />
            </TableHead>
            <TableHead className="py-3 text-right">
              <SortHeader label="Bestand" sortKeyName="currentStock" className="justify-end" />
            </TableHead>
            <TableHead className="py-3 w-40">
              <SortHeader label="Min." sortKeyName="minStockLevel" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Monitor className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Kein Lagerbestand</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Es befinden sich aktuell keine Artikel im Lager.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((article) => {
              const isLowStock =
                article.currentStock <= article.minStockLevel && article.minStockLevel > 0;
              const hasSerialnumbers =
                article.category === "HIGH_TIER" && article.serialNumbers.length > 0;
              const isExpanded = expandedRows.has(article.id);
              const fillPercent = article.minStockLevel > 0
                ? Math.min(100, Math.round((article.currentStock / article.minStockLevel) * 100))
                : 100;

              return (
                <Fragment key={article.id}>
                  <TableRow
                    className={`border-border/30 transition-colors duration-150 ${
                      hasSerialnumbers ? "cursor-pointer" : ""
                    } ${isExpanded ? "bg-muted/20" : ""}`}
                    onClick={hasSerialnumbers ? () => toggleExpand(article.id) : undefined}
                  >
                    <TableCell className="w-10 px-3">
                      {hasSerialnumbers && (
                        <div className={`flex h-5 w-5 items-center justify-center rounded transition-transform duration-200 ${isExpanded ? "rotate-0" : ""}`}>
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-primary" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${article.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {article.sku}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${article.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {article.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${categoryColors[article.category] ?? ""}`}>
                        {articleCategoryLabels[article.category]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold tabular-nums ${
                        isLowStock ? "text-destructive" : ""
                      }`}>
                        {article.currentStock}
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                          {article.unit}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {article.minStockLevel > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                fillPercent <= 50
                                  ? "bg-gradient-to-r from-destructive to-destructive/70"
                                  : fillPercent <= 100
                                    ? "bg-gradient-to-r from-warning to-warning/70"
                                    : "bg-gradient-to-r from-success to-success/70"
                              }`}
                              style={{ width: `${Math.min(fillPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                            {article.minStockLevel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">–</span>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded serial numbers */}
                  {hasSerialnumbers && isExpanded && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/30">
                      <TableCell />
                      <TableCell colSpan={5} className="py-3 pr-6">
                        <div className="space-y-2.5">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            Seriennummern ({article.serialNumbers.length})
                          </p>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {article.serialNumbers.map((sn) => (
                              <div
                                key={sn.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-3 py-2 transition-colors hover:border-border"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_4px_var(--color-success)]" />
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
  );
}
