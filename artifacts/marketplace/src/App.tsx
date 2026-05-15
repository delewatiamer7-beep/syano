import "@/i18n";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { setupApi } from "@/lib/api-setup";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Products from "@/pages/products";
import ProductDetail from "@/pages/products/[id]";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderHistory from "@/pages/orders";
import OrderDetail from "@/pages/orders/[id]";
import CustomerDashboard from "@/pages/customer/dashboard";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerProducts from "@/pages/seller/products";
import NewProduct from "@/pages/seller/products/new";
import EditProduct from "@/pages/seller/products/[id]/edit";
import SellerOrders from "@/pages/seller/orders";
import Inventory from "@/pages/seller/inventory";

setupApi();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
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

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <CurrencyProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
