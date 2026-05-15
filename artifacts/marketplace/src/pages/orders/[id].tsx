import { useParams, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronLeft, Package, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";

export default function OrderDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: ["getOrder", id] }
  });

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

  if (isLoading) {
    return <Layout><div className="container py-12 text-muted-foreground">{t("common.loading")}</div></Layout>;
  }

  if (!order) {
    return <Layout><div className="container py-12 text-muted-foreground">{t("orders.empty")}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-4xl">
        <Link href="/orders" className="inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          {t("orders.back")}
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 flex flex-wrap items-center gap-3">
              {t("orders.order_id", { id: order.id })}
              {getStatusBadge(order.status)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("orders.placed_on", { date: format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a") })}
            </p>
          </div>
          <div className="text-end shrink-0">
            <div className="text-2xl font-bold">{formatCurrency(order.total)}</div>
            <p className="text-sm text-muted-foreground mt-0.5">{order.items.length} {t("orders.items")}</p>
          </div>
        </div>

        <div className="mb-6">
          <OrderStatusTimeline
            status={order.status as "pending" | "processing" | "shipped" | "delivered" | "cancelled"}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" /> {t("orders.items")}
                </h3>
              </div>
              <div className="divide-y">
                {order.items.map((item, idx) => (
                  <div key={idx} className="px-6 py-4 flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm leading-snug">
                        <Link href={`/products/${item.productId}`} className="hover:text-primary hover:underline transition-colors">
                          {item.productName}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("checkout.qty", { count: item.quantity })} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="font-semibold text-sm shrink-0">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> {t("orders.address")}
                </h3>
              </div>
              <div className="p-6">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
