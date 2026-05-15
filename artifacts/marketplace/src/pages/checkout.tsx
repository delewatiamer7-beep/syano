import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCart, usePlaceOrder, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle2 } from "lucide-react";

export default function Checkout() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [address, setAddress] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: cart, isLoading } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey()
    }
  });

  const clearCart = useClearCart({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    }
  });

  const placeOrder = usePlaceOrder({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
        clearCart.mutate();
      },
      onError: () => {
        toast({
          title: "Order Failed",
          description: "There was an error processing your order.",
          variant: "destructive",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your shipping address.",
        variant: "destructive",
      });
      return;
    }
    placeOrder.mutate({ data: { shippingAddress: address } });
  };

  if (isSuccess) {
    return (
      <Layout>
        <div className="container flex-1 flex items-center justify-center py-20">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold">Order Placed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. We'll send you an email confirmation shortly.
            </p>
            <div className="pt-6">
              <Button onClick={() => setLocation("/orders")} className="w-full">
                View Orders
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading || !cart || cart.items.length === 0) {
    if (!isLoading && (!cart || cart.items.length === 0)) {
      setLocation("/cart");
    }
    return <Layout><div className="container py-12">Loading checkout...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 w-full bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Full Shipping Address</Label>
                <Textarea 
                  id="address" 
                  placeholder="123 Main St, Apt 4B, City, State, ZIP" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="pt-6 border-t space-y-4">
                <h3 className="text-lg font-medium">Payment Details</h3>
                <div className="p-4 border rounded-lg bg-muted/30 flex items-start gap-4">
                  <CreditCard className="h-6 w-6 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Demo Payment Gateway</p>
                    <p className="text-sm text-muted-foreground">No actual payment is required. This is a demonstration marketplace.</p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="w-full lg:w-96 space-y-6 sticky top-24">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-4 max-h-[300px] overflow-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex items-start gap-3 text-sm">
                    <div className="h-12 w-12 bg-muted rounded border overflow-hidden shrink-0">
                      {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium text-right shrink-0">
                      ${item.subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t text-foreground">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                form="checkout-form"
                className="w-full h-12 text-base font-semibold mt-6"
                disabled={placeOrder.isPending}
              >
                {placeOrder.isPending ? "Processing..." : `Pay $${cart.total.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}