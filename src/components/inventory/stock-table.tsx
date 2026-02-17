"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowUpDown, Hash } from "lucide-react";
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

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>
              <SortHeader label="Artikelnr." sortKeyName="sku" />
            </TableHead>
            <TableHead>
              <SortHeader label="Name" sortKeyName="name" />
            </TableHead>
            <TableHead>
              <SortHeader label="Kategorie" sortKeyName="category" />
            </TableHead>
            <TableHead className="text-right">
              <SortHeader label="Bestand" sortKeyName="currentStock" />
            </TableHead>
            <TableHead className="text-right">
              <SortHeader label="Mindestbestand" sortKeyName="minStockLevel" />
            </TableHead>
            <TableHead>Einheit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Kein Lagerbestand vorhanden.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((article) => {
              const isLowStock =
                article.currentStock <= article.minStockLevel && article.minStockLevel > 0;
              const hasSerialnumbers =
                article.category === "SERIALIZED" && article.serialNumbers.length > 0;
              const isExpanded = expandedRows.has(article.id);

              return (
                <Fragment key={article.id}>
                  <TableRow
                    className={hasSerialnumbers ? "cursor-pointer" : ""}
                    onClick={hasSerialnumbers ? () => toggleExpand(article.id) : undefined}
                  >
                    <TableCell className="w-8 px-2">
                      {hasSerialnumbers && (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/inventory/${article.id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {article.sku}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${article.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {article.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {articleCategoryLabels[article.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={isLowStock ? "text-destructive font-bold" : "font-medium"}>
                        {article.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {article.minStockLevel}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {article.unit}
                    </TableCell>
                  </TableRow>

                  {/* Expanded serial numbers */}
                  {hasSerialnumbers && isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell />
                      <TableCell colSpan={6} className="py-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Hash className="h-3 w-3" />
                            Seriennummern im Lager ({article.serialNumbers.length})
                          </p>
                          <div className="grid gap-1.5">
                            {article.serialNumbers.map((sn) => (
                              <div
                                key={sn.id}
                                className="flex items-center gap-3 rounded-md bg-background px-3 py-1.5 text-sm border"
                              >
                                <span className="font-mono text-xs">
                                  {sn.serialNo}
                                </span>
                                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                  {serialNumberStatusLabels[sn.status]}
                                </Badge>
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
