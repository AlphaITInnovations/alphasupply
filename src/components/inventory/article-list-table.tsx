"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArticleForm } from "@/components/inventory/article-form";
import { articleCategoryLabels } from "@/types/inventory";

type ArticleRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  productGroup: string | null;
  productSubGroup: string | null;
  avgPurchasePrice: { toNumber(): number } | number | string | null;
  unit: string;
  currentStock: number;
  incomingStock: number;
  minStockLevel: number;
  notes: string | null;
  _count: { serialNumbers: number; articleSuppliers: number };
};

const categoryColors: Record<string, string> = {
  SERIALIZED: "bg-indigo/10 text-indigo border-indigo/20",
  STANDARD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  CONSUMABLE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

export function ArticleListTable({
  articles,
  groupSuggestions,
}: {
  articles: ArticleRow[];
  groupSuggestions?: { groups: string[]; subGroups: string[] };
}) {
  const [editArticle, setEditArticle] = useState<ArticleRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Art.Nr.</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Name</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Gruppe</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Kategorie</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">EK netto</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Bestand</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Zulauf</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Min.</TableHead>
              <TableHead className="py-3 w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  Keine Artikel gefunden.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => {
                const isLowStock = article.currentStock <= article.minStockLevel && article.minStockLevel > 0;
                return (
                  <TableRow key={article.id} className="border-border/30 group">
                    <TableCell>
                      <Link
                        href={`/inventory/${article.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {article.sku}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${article.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {article.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {article.productGroup ? (
                        <div className="text-xs">
                          <span className="text-foreground">{article.productGroup}</span>
                          {article.productSubGroup && (
                            <span className="text-muted-foreground"> / {article.productSubGroup}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${categoryColors[article.category] ?? ""}`}>
                        {articleCategoryLabels[article.category]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {article.avgPurchasePrice != null
                        ? `${Number(article.avgPurchasePrice).toFixed(2)} €`
                        : "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {article.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {article.incomingStock > 0 ? (
                        <span className="text-sm font-medium tabular-nums text-amber-500">
                          +{article.incomingStock}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/40 tabular-nums">–</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {article.minStockLevel}
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          {article.minStockLevel > 0 ? (
                            <div
                              className={`h-full rounded-full transition-all ${
                                article.currentStock >= article.minStockLevel * 1.5
                                  ? "bg-emerald-500"
                                  : article.currentStock >= article.minStockLevel
                                    ? "bg-amber-400"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (article.currentStock / Math.max(article.minStockLevel * 1.5, 1)) * 100)}%`,
                              }}
                            />
                          ) : (
                            <div className="h-full rounded-full bg-muted-foreground/20 w-full" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditArticle(article)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editArticle} onOpenChange={(open) => !open && setEditArticle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Artikel bearbeiten</DialogTitle>
          </DialogHeader>
          {editArticle && (
            <ArticleForm
              article={editArticle}
              onSuccess={() => setEditArticle(null)}
              groupSuggestions={groupSuggestions}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
