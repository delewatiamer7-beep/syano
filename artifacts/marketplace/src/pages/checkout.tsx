import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCart, usePlaceOrder, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Checkout() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { format } = useCurrency();

  const [address, setAddress] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: cart, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey() }
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
          title: t("checkout.order_failed"),
          description: t("checkout.order_failed_desc"),
          variant: "destructive",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({
        title: t("checkout.address_required"),
        description: t("checkout.address_required_desc"),
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
            <h1 className="text-3xl font-bold">{t("checkout.success_title")}</h1>
            <p className="text-muted-foreground">{t("checkout.success_desc")}</p>
            <div className="pt-6">
              <Button onClick={() => setLocation("/orders")} className="w-full">
                {t("checkout.view_orders")}
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
    return <Layout><div className="container py-12">{t("checkout.loading")}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("checkout.title")}</h1>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 w-full bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">{t("checkout.shipping_info")}</h2>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">{t("checkout.full_address")}</Label>
                <Textarea
                  id="address"
                  placeholder={t("checkout.address_placeholder")}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="pt-6 border-t space-y-4">
                <h3 className="text-lg font-medium">{t("checkout.payment_details")}</h3>
                <div className="p-4 border rounded-lg bg-muted/30 flex items-start gap-4">
                  <CreditCard className="h-6 w-6 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{t("checkout.demo_gateway")}</p>
                    <p className="text-sm text-muted-foreground">{t("checkout.demo_desc")}</p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="w-full lg:w-96 space-y-6 sticky top-24">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">{t("checkout.order_summary")}</h3>

              <div className="space-y-4 mb-4 max-h-[300px] overflow-auto pe-2">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex items-start gap-3 text-sm">
                    <div className="h-12 w-12 bg-muted rounded border overflow-hidden shrink-0">
                      {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-muted-foreground">{t("checkout.qty", { count: item.quantity })}</p>
                    </div>
                    <div className="font-medium text-right shrink-0">
                      {format(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("checkout.subtotal")}</span>
                  <span>{format(cart.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("checkout.shipping")}</span>
                  <span>{t("checkout.free")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t text-foreground">
                  <span>{t("checkout.total")}</span>
                  <span>{format(cart.total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                className="w-full h-12 text-base font-semibold mt-6"
                disabled={placeOrder.isPending}
              >
                {placeOrder.isPending
                  ? t("checkout.processing")
                  : t("checkout.pay", { amount: format(cart.total) })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
