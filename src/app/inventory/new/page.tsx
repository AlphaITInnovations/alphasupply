export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleForm } from "@/components/inventory/article-form";
import { getArticleGroupSuggestions, getNextArticleNumber } from "@/queries/inventory";

export default async function NewArticlePage() {
  const [groupSuggestions, nextSku] = await Promise.all([
    getArticleGroupSuggestions(),
    getNextArticleNumber(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neuen Artikel anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm
            groupSuggestions={groupSuggestions}
            nextSku={nextSku}
          />
        </CardContent>
      </Card>
    </div>
  );
}
