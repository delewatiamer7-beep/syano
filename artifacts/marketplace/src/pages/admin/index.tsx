import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ShoppingCart, TrendingUp, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
  });

  const statCards = [
    { label: t("admin.total_users"), value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500" },
    { label: t("admin.total_products"), value: stats?.totalProducts ?? 0, icon: Package, color: "text-purple-500" },
    { label: t("admin.total_orders"), value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "text-orange-500" },
    { label: t("admin.total_revenue"), value: format(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.nav_dashboard")}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.dashboard_desc")}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={`p-2 rounded-lg bg-muted ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders by Status */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">{t("admin.orders_by_status")}</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(stats?.ordersByStatus ?? []).map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between py-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}>
                      {t(`orders.status_${status}`)}
                    </span>
                    <span className="font-bold text-foreground">{count}</span>
                  </div>
                ))}
                {(!stats?.ordersByStatus?.length) && (
                  <p className="text-sm text-muted-foreground">{t("admin.no_data")}</p>
                )}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t("admin.recent_orders")}
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start pb-2 font-medium text-muted-foreground">{t("admin.col_order")}</th>
                      <th className="text-start pb-2 font-medium text-muted-foreground">{t("admin.col_customer")}</th>
                      <th className="text-start pb-2 font-medium text-muted-foreground">{t("admin.col_total")}</th>
                      <th className="text-start pb-2 font-medium text-muted-foreground">{t("admin.col_status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(stats?.recentOrders ?? []).map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">#{order.id}</td>
                        <td className="py-2.5 font-medium">{order.customerName}</td>
                        <td className="py-2.5 font-semibold">{format(order.total)}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] ?? ""}`}>
                            {t(`orders.status_${order.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!stats?.recentOrders?.length && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">{t("admin.no_data")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
