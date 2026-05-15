import { useGetSellerDashboard } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, ShoppingCart, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function SellerDashboard() {
  const { data: dashboard, isLoading } = useGetSellerDashboard();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  if (isLoading) {
    return <Layout><div className="container py-12">{t("seller_dashboard.loading")}</div></Layout>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t("seller_orders.pending")}</Badge>;
      case "processing": return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{t("seller_orders.processing")}</Badge>;
      case "shipped": return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">{t("seller_orders.shipped")}</Badge>;
      case "delivered": return <Badge className="bg-primary hover:bg-primary text-primary-foreground">{t("seller_orders.delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("seller_orders.cancelled")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const COLORS = ['#059669', '#3B82F6', '#F59E0B', '#F59E0B', '#EF4444'];

  const chartData = dashboard?.ordersByStatus.map(s => ({
    name: s.status,
    value: s.count
  })) || [];

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("seller_dashboard.title")}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller_dashboard.total_revenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboard?.totalRevenue || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller_dashboard.orders")}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard?.pendingOrders || 0} {t("seller_dashboard.pending")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller_dashboard.active_products")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalProducts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("seller_dashboard.low_stock")}</CardTitle>
              <AlertCircle className={`h-4 w-4 ${dashboard?.lowStockProducts ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dashboard?.lowStockProducts || 0}</div>
              {dashboard?.lowStockProducts ? (
                <Link href="/seller/inventory" className="text-xs text-primary hover:underline mt-1 block">
                  {t("seller_dashboard.view_inventory")}
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
              <h3 className="font-semibold text-lg">{t("seller_dashboard.recent_orders")}</h3>
              <Link href="/seller/orders" className="text-sm text-primary hover:underline">
                {t("seller_dashboard.manage_orders")}
              </Link>
            </div>
            <div className="divide-y">
              {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">{t("seller_dashboard.no_orders")}</div>
              ) : (
                dashboard.recentOrders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/10 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Order #{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.customerName} • {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="font-bold">{formatCurrency(order.total)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="font-semibold text-lg mb-6">{t("seller_dashboard.orders_by_status")}</h3>
            {chartData.length > 0 ? (
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {t("seller_dashboard.no_data")}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
