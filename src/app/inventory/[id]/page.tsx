export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Hash, MapPin, ArrowLeftRight, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getArticleById } from "@/queries/inventory";
import {
  articleCategoryLabels,
  serialNumberStatusLabels,
  stockMovementTypeLabels,
} from "@/types/inventory";
import { StockMovementForm } from "@/components/inventory/stock-movement-form";
import { SerialNumberForm } from "@/components/inventory/serial-number-form";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const isLowStock =
    article.currentStock <= article.minStockLevel && article.minStockLevel > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{article.name}</h1>
            <Badge variant="secondary">
              {articleCategoryLabels[article.category]}
            </Badge>
          </div>
          <p className="ml-10 font-mono text-sm text-muted-foreground">
            {article.sku}
          </p>
          {article.description && (
            <p className="ml-10 text-sm text-muted-foreground">
              {article.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <StockMovementForm
            articles={[{ id: article.id, name: article.name, sku: article.sku }]}
            preselectedArticleId={article.id}
          />
          <Button variant="outline" asChild>
            <Link href={`/inventory/${article.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
        </div>
      </div>

      {/* Bestandskarten */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Aktueller Bestand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${isLowStock ? "text-destructive" : ""}`}>
              {article.currentStock} {article.unit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Mindestbestand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {article.minStockLevel} {article.unit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Zielbestand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {article.targetStockLevel ?? "–"} {article.unit}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={article.category === "SERIALIZED" ? "serial" : "movements"}>
        <TabsList>
          {article.category === "SERIALIZED" && (
            <TabsTrigger value="serial">
              <Hash className="mr-2 h-4 w-4" />
              Seriennummern ({article.serialNumbers.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="movements">
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Bewegungen ({article.stockMovements.length})
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="mr-2 h-4 w-4" />
            Lagerorte ({article.stockLocations.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Factory className="mr-2 h-4 w-4" />
            Lieferanten ({article.articleSuppliers.length})
          </TabsTrigger>
        </TabsList>

        {/* Seriennummern */}
        {article.category === "SERIALIZED" && (
          <TabsContent value="serial" className="space-y-4">
            <div className="flex justify-end">
              <SerialNumberForm articleId={article.id} />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seriennummer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lagerort</TableHead>
                    <TableHead>Notizen</TableHead>
                    <TableHead>Erfasst am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {article.serialNumbers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Keine Seriennummern erfasst.
                      </TableCell>
                    </TableRow>
                  ) : (
                    article.serialNumbers.map((sn) => (
                      <TableRow key={sn.id}>
                        <TableCell className="font-mono">{sn.serialNo}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sn.status === "IN_STOCK"
                                ? "default"
                                : sn.status === "DEFECTIVE"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {serialNumberStatusLabels[sn.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{sn.location?.name ?? "–"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {sn.notes ?? "–"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(sn.createdAt).toLocaleDateString("de-DE")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* Bewegungen */}
        <TabsContent value="movements">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Art</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                  <TableHead>Grund</TableHead>
                  <TableHead>Durchgeführt von</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {article.stockMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Keine Lagerbewegungen vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  article.stockMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {new Date(m.createdAt).toLocaleString("de-DE")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.type === "IN"
                              ? "default"
                              : m.type === "OUT"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {stockMovementTypeLabels[m.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {m.type === "IN" ? "+" : m.type === "OUT" ? "" : "="}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.reason ?? "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.performedBy ?? "–"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Lagerorte */}
        <TabsContent value="locations">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lagerort</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {article.stockLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                      Keine Lagerortzuordnung vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  article.stockLocations.map((sl) => (
                    <TableRow key={sl.id}>
                      <TableCell>{sl.location.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {sl.quantity}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Lieferanten */}
        <TabsContent value="suppliers">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lieferant</TableHead>
                  <TableHead>Lieferanten-Art.Nr.</TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead className="text-right">Lieferzeit</TableHead>
                  <TableHead>Bevorzugt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {article.articleSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Keine Lieferanten zugeordnet.
                    </TableCell>
                  </TableRow>
                ) : (
                  article.articleSuppliers.map((as_) => (
                    <TableRow key={as_.id}>
                      <TableCell className="font-medium">
                        {as_.supplier.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {as_.supplierSku ?? "–"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(as_.unitPrice).toFixed(2)} {as_.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        {as_.leadTimeDays ? `${as_.leadTimeDays} Tage` : "–"}
                      </TableCell>
                      <TableCell>
                        {as_.isPreferred && (
                          <Badge variant="default">Bevorzugt</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
