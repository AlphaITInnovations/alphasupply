import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getNextArticleNumber,
  getArticleGroupSuggestions,
} from "@/queries/inventory";
import { ArticleCreateForm } from "@/components/artikelverwaltung/article-create-form";

export const dynamic = "force-dynamic";

export default async function NeuerArtikelPage() {
  const [nextSku, groupSuggestions] = await Promise.all([
    getNextArticleNumber(),
    getArticleGroupSuggestions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/artikelverwaltung"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Artikelverwaltung
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Neuer Artikel</h1>
        <p className="text-muted-foreground">
          Neuen Artikel im System anlegen
        </p>
      </div>
      <div className="max-w-2xl">
        <ArticleCreateForm
          nextSku={nextSku}
          groupSuggestions={groupSuggestions}
        />
      </div>
    </div>
  );
}
