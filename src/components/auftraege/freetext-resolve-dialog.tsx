"use client";

import { useState, useTransition } from "react";
import { Search, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { resolveFreetextItem } from "@/actions/orders";

type Article = {
  id: string;
  name: string;
  sku: string;
  category: string;
};

export function FreetextResolveDialog({
  open,
  onOpenChange,
  orderItemId,
  freeText,
  articles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: string;
  freeText: string;
  articles: Article[];
}) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.sku.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  function handleAssign(articleId: string) {
    setError(null);
    startTransition(async () => {
      const result = await resolveFreetextItem(orderItemId, articleId);
      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Artikel zuweisen</DialogTitle>
          <DialogDescription>
            Freitext-Position &ldquo;{freeText}&rdquo; einem Artikel zuordnen
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Artikel suchen..."
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[400px]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Kein passender Artikel gefunden.</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="/artikelverwaltung/neu" target="_blank">
                  <Plus className="mr-1 h-3 w-3" />
                  Neuen Artikel anlegen
                </a>
              </Button>
            </div>
          ) : (
            filtered.slice(0, 20).map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => handleAssign(article.id)}
                disabled={isPending}
                className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:bg-muted/50 hover:border-border/50 disabled:opacity-50"
              >
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                  {article.sku}
                </span>
                <span className="text-sm font-medium flex-1 truncate">
                  {article.name}
                </span>
                <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
