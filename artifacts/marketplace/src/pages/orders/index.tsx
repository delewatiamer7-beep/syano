import { Link } from "wouter";
import { useListOrders } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, ArrowRight, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function OrderHistory() {
  const { data: orders, isLoading } = useListOrders();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">{t("orders.status_pending")}</Badge>;
      case "processing": return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">{t("orders.status_processing")}</Badge>;
      case "shipped": return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200">{t("orders.status_shipped")}</Badge>;
      case "delivered": return <Badge className="bg-primary hover:bg-primary text-primary-foreground">{t("orders.status_delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("orders.status_cancelled")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("orders.title")}</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border">
            <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t("orders.empty")}</h3>
            <p className="text-muted-foreground max-w-md mb-6">{t("orders.empty_desc")}</p>
            <Link href="/products" className="text-primary hover:underline font-medium inline-flex items-center">
              {t("orders.start_shopping")} <ArrowRight className="ms-1 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="group bg-card border rounded-xl p-6 hover:shadow-sm hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-base">{t("orders.order_id", { id: order.id })}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-muted-foreground">
                        {t("orders.placed_on", { date: format(new Date(order.createdAt), "MMM d, yyyy") })}
                      </p>
                      <p className="text-muted-foreground">
                        {order.items.length === 1
                          ? t("orders.items_total", { count: order.items.length })
                          : t("orders.items_total_plural", { count: order.items.length })}
                        {" "}
                        <span className="font-medium text-foreground">{formatCurrency(order.total)}</span>
                      </p>
                    </div>

                    <div className="flex items-center text-primary group-hover:underline text-sm font-medium">
                      {t("orders.view_details")}
                      <ChevronRight className="h-4 w-4 ms-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
