import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function SellerOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const { data: orders, isLoading } = useListOrders();

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: t("seller_orders.updated") });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError: () => {
        toast({ title: t("seller_orders.update_failed"), variant: "destructive" });
      }
    }
  });

  const handleStatusChange = (id: number, status: any) => {
    updateStatus.mutate({ id, data: { status } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600";
      case "processing": return "text-blue-600";
      case "shipped": return "text-indigo-600";
      case "delivered": return "text-primary font-medium";
      case "cancelled": return "text-destructive";
      default: return "";
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("seller_orders.title")}</h1>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("seller_orders.loading")}</div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t("seller_orders.no_orders")}</h3>
              <p className="text-muted-foreground mb-6">{t("seller_orders.no_orders_desc")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("seller_orders.order_id")}</TableHead>
                  <TableHead>{t("seller_orders.date")}</TableHead>
                  <TableHead>{t("seller_orders.customer")}</TableHead>
                  <TableHead>{t("seller_orders.items")}</TableHead>
                  <TableHead className="text-right">{t("seller_orders.total")}</TableHead>
                  <TableHead className="w-[180px]">{t("seller_orders.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div>{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                    </TableCell>
                    <TableCell>
                      {order.items.length === 1
                        ? t("seller_orders.items_count", { count: order.items.length })
                        : t("seller_orders.items_count_plural", { count: order.items.length })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={order.status}
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className={`h-8 ${getStatusColor(order.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("seller_orders.pending")}</SelectItem>
                          <SelectItem value="processing">{t("seller_orders.processing")}</SelectItem>
                          <SelectItem value="shipped">{t("seller_orders.shipped")}</SelectItem>
                          <SelectItem value="delivered">{t("seller_orders.delivered")}</SelectItem>
                          <SelectItem value="cancelled">{t("seller_orders.cancelled")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
}
