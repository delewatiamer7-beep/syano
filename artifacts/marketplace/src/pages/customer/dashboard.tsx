import { useGetCustomerDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function CustomerDashboard() {
  const { data: dashboard, isLoading } = useGetCustomerDashboard();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  if (isLoading) {
    return <Layout><div className="container py-12">{t("customer_dashboard.loading")}</div></Layout>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t("orders.status_pending")}</Badge>;
      case "processing": return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{t("orders.status_processing")}</Badge>;
      case "shipped": return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">{t("orders.status_shipped")}</Badge>;
      case "delivered": return <Badge className="bg-primary hover:bg-primary text-primary-foreground">{t("orders.status_delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("orders.status_cancelled")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("customer_dashboard.title")}</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("customer_dashboard.total_orders")}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("customer_dashboard.total_spent")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboard?.totalSpent || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("customer_dashboard.pending_orders")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.pendingOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("customer_dashboard.delivered")}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.deliveredOrders || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
            <h3 className="font-semibold text-lg">{t("customer_dashboard.recent_orders")}</h3>
            <Link href="/orders" className="text-sm text-primary hover:underline">{t("customer_dashboard.view_all")}</Link>
          </div>
          <div className="divide-y">
            {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">{t("customer_dashboard.no_orders")}</div>
            ) : (
              dashboard.recentOrders.map((order) => (
                <div key={order.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/orders/${order.id}`} className="font-semibold hover:text-primary">
                        {t("customer_dashboard.order_id", { id: order.id })}
                      </Link>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy")} • {t("customer_dashboard.items_count", { count: order.items.length })}
                    </div>
                  </div>
                  <div className="font-bold">{formatCurrency(order.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
