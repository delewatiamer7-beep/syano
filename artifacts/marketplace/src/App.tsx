import "@/i18n";
import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { setupApi } from "@/lib/api-setup";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { PageLoader } from "@/components/PageLoader";

const NotFound          = lazy(() => import("@/pages/not-found"));
const Home              = lazy(() => import("@/pages/home"));
const Login             = lazy(() => import("@/pages/login"));
const Register          = lazy(() => import("@/pages/register"));
const Products          = lazy(() => import("@/pages/products"));
const ProductDetail     = lazy(() => import("@/pages/products/[id]"));
const Cart              = lazy(() => import("@/pages/cart"));
const Checkout          = lazy(() => import("@/pages/checkout"));
const OrderHistory      = lazy(() => import("@/pages/orders"));
const OrderDetail       = lazy(() => import("@/pages/orders/[id]"));
const CustomerDashboard = lazy(() => import("@/pages/customer/dashboard"));
const SellerDashboard   = lazy(() => import("@/pages/seller/dashboard"));
const SellerProducts    = lazy(() => import("@/pages/seller/products"));
const NewProduct        = lazy(() => import("@/pages/seller/products/new"));
const EditProduct       = lazy(() => import("@/pages/seller/products/[id]/edit"));
const SellerOrders      = lazy(() => import("@/pages/seller/orders"));
const Inventory         = lazy(() => import("@/pages/seller/inventory"));
const AdminDashboard    = lazy(() => import("@/pages/admin/index"));
const AdminUsers        = lazy(() => import("@/pages/admin/users"));
const AdminProducts     = lazy(() => import("@/pages/admin/products"));
const AdminOrders       = lazy(() => import("@/pages/admin/orders"));
const AdminSettings     = lazy(() => import("@/pages/admin/settings"));
const AdminLogs         = lazy(() => import("@/pages/admin/logs"));

setupApi();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageTransition>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/products" component={Products} />
          <Route path="/products/:id" component={ProductDetail} />

          <Route path="/cart">
            <ProtectedRoute allowedRoles={["customer"]}><Cart /></ProtectedRoute>
          </Route>
          <Route path="/checkout">
            <ProtectedRoute allowedRoles={["customer"]}><Checkout /></ProtectedRoute>
          </Route>
          <Route path="/orders">
            <ProtectedRoute allowedRoles={["customer"]}><OrderHistory /></ProtectedRoute>
          </Route>
          <Route path="/orders/:id">
            <ProtectedRoute allowedRoles={["customer"]}><OrderDetail /></ProtectedRoute>
          </Route>
          <Route path="/customer/dashboard">
            <ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>
          </Route>

          <Route path="/seller/dashboard">
            <ProtectedRoute allowedRoles={["seller"]}><SellerDashboard /></ProtectedRoute>
          </Route>
          <Route path="/seller/products">
            <ProtectedRoute allowedRoles={["seller"]}><SellerProducts /></ProtectedRoute>
          </Route>
          <Route path="/seller/products/new">
            <ProtectedRoute allowedRoles={["seller"]}><NewProduct /></ProtectedRoute>
          </Route>
          <Route path="/seller/products/:id/edit">
            <ProtectedRoute allowedRoles={["seller"]}><EditProduct /></ProtectedRoute>
          </Route>
          <Route path="/seller/orders">
            <ProtectedRoute allowedRoles={["seller"]}><SellerOrders /></ProtectedRoute>
          </Route>
          <Route path="/seller/inventory">
            <ProtectedRoute allowedRoles={["seller"]}><Inventory /></ProtectedRoute>
          </Route>

          <Route path="/admin">
            <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
          </Route>
          <Route path="/admin/users">
            <ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>
          </Route>
          <Route path="/admin/products">
            <ProtectedRoute allowedRoles={["admin"]}><AdminProducts /></ProtectedRoute>
          </Route>
          <Route path="/admin/orders">
            <ProtectedRoute allowedRoles={["admin"]}><AdminOrders /></ProtectedRoute>
          </Route>
          <Route path="/admin/logs">
            <ProtectedRoute allowedRoles={["admin"]}><AdminLogs /></ProtectedRoute>
          </Route>
          <Route path="/admin/settings">
            <ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>
          </Route>

          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
