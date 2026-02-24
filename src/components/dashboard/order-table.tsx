"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orderStatusLabels, orderStatusColors } from "@/types/orders";

type DashboardOrder = {
  id: string;
  orderNumber: string;
  orderedFor: string;
  orderedBy: string;
  costCenter: string;
  technicianName: string | null;
  createdAt: Date;
  computedStatus: string;
  items: { id: string }[];
  mobilfunk: { id: string }[];
};

function formatRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gestern";
  if (days < 30) return `vor ${days} Tagen`;
  const months = Math.floor(days / 30);
  return `vor ${months} Mon.`;
}

export function DashboardOrderTable({ orders }: { orders: DashboardOrder[] }) {
  const [search, setSearch] = useState("");

  const filtered = orders.filter((order) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.orderedFor.toLowerCase().includes(q) ||
      order.orderedBy.toLowerCase().includes(q) ||
      order.costCenter.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <CardTitle>Offene Aufträge ({orders.length})</CardTitle>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suche nach Nr., Empfänger, Besteller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {search ? "Keine Ergebnisse gefunden." : "Keine offenen Aufträge vorhanden."}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Auftragsnr.</TableHead>
                <TableHead>Empfänger</TableHead>
                <TableHead className="hidden sm:table-cell">Kostenstelle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Positionen</TableHead>
                <TableHead className="hidden lg:table-cell">Erstellt</TableHead>
                <TableHead className="hidden lg:table-cell">Techniker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/auftraege/${order.id}`}
                      className="font-mono font-bold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.orderedFor}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{order.costCenter}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        orderStatusColors[order.computedStatus] ??
                        "bg-gray-100 text-gray-700"
                      }
                    >
                      {orderStatusLabels[order.computedStatus] ?? order.computedStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {order.items.length + order.mobilfunk.length}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatRelative(order.createdAt)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {order.technicianName || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
