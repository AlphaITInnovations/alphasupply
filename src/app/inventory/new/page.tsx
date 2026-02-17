export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleForm } from "@/components/inventory/article-form";
import { getArticleGroupSuggestions } from "@/queries/inventory";

export default async function NewArticlePage() {
  const groupSuggestions = await getArticleGroupSuggestions();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neuen Artikel anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm groupSuggestions={groupSuggestions} />
        </CardContent>
      </Card>
    </div>
  );
}
