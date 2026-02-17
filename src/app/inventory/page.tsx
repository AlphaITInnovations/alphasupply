export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getArticles } from "@/queries/inventory";
import { articleCategoryLabels } from "@/types/inventory";
import { ArticleCategory } from "@/generated/prisma/client";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const articles = await getArticles({
    search: params.search,
    category: params.category as ArticleCategory | undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artikel</h1>
        <Button asChild>
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Artikel
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <form className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Artikel suchen..."
            defaultValue={params.search}
            className="pl-9"
          />
        </form>
        <div className="flex gap-2">
          <Button
            variant={!params.category ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href="/inventory">Alle</Link>
          </Button>
          {(["SERIALIZED", "STANDARD", "CONSUMABLE"] as const).map((cat) => (
            <Button
              key={cat}
              variant={params.category === cat ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/inventory?category=${cat}`}>
                {articleCategoryLabels[cat]}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Tabelle */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikelnr.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead className="text-right">Bestand</TableHead>
              <TableHead className="text-right">Min. Bestand</TableHead>
              <TableHead className="text-right">Lieferanten</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Keine Artikel gefunden.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => {
                const isLowStock = article.currentStock <= article.minStockLevel && article.minStockLevel > 0;
                return (
                  <TableRow key={article.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/inventory/${article.id}`}
                        className="text-primary hover:underline"
                      >
                        {article.sku}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inventory/${article.id}`}
                        className="font-medium hover:underline"
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
                      <span className={isLowStock ? "text-destructive font-bold" : ""}>
                        {article.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {article.minStockLevel}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {article._count.articleSuppliers}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
