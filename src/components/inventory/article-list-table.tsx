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
  unit: string;
  currentStock: number;
  minStockLevel: number;
  targetStockLevel: number | null;
  notes: string | null;
  _count: { serialNumbers: number; articleSuppliers: number };
};

const categoryColors: Record<string, string> = {
  SERIALIZED: "bg-petrol/10 text-petrol border-petrol/20",
  STANDARD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  CONSUMABLE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

export function ArticleListTable({ articles }: { articles: ArticleRow[] }) {
  const [editArticle, setEditArticle] = useState<ArticleRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Art.Nr.</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Name</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Kategorie</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Bestand</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Min.</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Lieferanten</TableHead>
              <TableHead className="py-3 w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${categoryColors[article.category] ?? ""}`}>
                        {articleCategoryLabels[article.category]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold tabular-nums ${isLowStock ? "text-destructive" : ""}`}>
                        {article.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                      {article.minStockLevel}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                      {article._count.articleSuppliers}
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
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
