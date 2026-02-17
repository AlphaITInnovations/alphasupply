export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getArticles } from "@/queries/inventory";
import { ArticleCategory } from "@/generated/prisma/client";
import { ArticleListTable } from "@/components/inventory/article-list-table";

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

  const categoryFilters = [
    { key: undefined, label: "Alle" },
    { key: "SERIALIZED", label: "Mit Seriennummer" },
    { key: "STANDARD", label: "Standard" },
    { key: "CONSUMABLE", label: "Schüttgut" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artikelliste</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {articles.length} Artikel {params.category || params.search ? "(gefiltert)" : "gesamt"}
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Artikel
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Artikel suchen..."
            defaultValue={params.search}
            className="pl-9 bg-card"
          />
        </form>
        <div className="flex gap-1.5">
          {categoryFilters.map((f) => (
            <Button
              key={f.key ?? "all"}
              variant={params.category === f.key ? "default" : "outline"}
              size="sm"
              asChild
              className={params.category === f.key ? "shadow-sm" : "bg-card"}
            >
              <Link href={f.key ? `/inventory?category=${f.key}` : "/inventory"}>
                {f.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <ArticleListTable articles={articles} />
    </div>
  );
}
