import { Link } from "wouter";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, ArrowRight, ChevronRight } from "lucide-react";

export default function OrderHistory() {
  const { data: orders, isLoading } = useListOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">Pending</Badge>;
      case "processing": return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">Processing</Badge>;
      case "shipped": return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200">Shipped</Badge>;
      case "delivered": return <Badge className="bg-primary hover:bg-primary text-primary-foreground">Delivered</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border">
            <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              You haven't placed any orders yet. Discover our premium selection of products.
            </p>
            <Link href="/products" className="text-primary hover:underline font-medium inline-flex items-center">
              Start Shopping <ArrowRight className="ml-1 h-4 w-4" />
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
                        <span className="font-semibold text-base">Order #{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-muted-foreground">
                        Placed on {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </p>
                      <p className="text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} • Total: <span className="font-medium text-foreground">${order.total.toFixed(2)}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center text-primary group-hover:underline text-sm font-medium">
                      View details
                      <ChevronRight className="h-4 w-4 ml-1" />
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