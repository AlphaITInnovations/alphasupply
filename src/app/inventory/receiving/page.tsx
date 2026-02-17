export const dynamic = "force-dynamic";

import { ReceivingForm } from "@/components/inventory/receiving-form";
import {
  getArticlesForReceiving,
  getArticleGroupSuggestions,
  getNextArticleNumber,
} from "@/queries/inventory";

export default async function ReceivingPage() {
  const [articles, groupSuggestions, nextSku] = await Promise.all([
    getArticlesForReceiving(),
    getArticleGroupSuggestions(),
    getNextArticleNumber(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <ReceivingForm
        articles={articles}
        groupSuggestions={groupSuggestions}
        nextSku={nextSku}
      />
    </div>
  );
}
