import React from "react";
import { Link, useLocation } from "wouter";
import {
  useGetCart,
  useRemoveFromCart,
  useUpdateCartItem,
  getGetCartQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Cart() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { format } = useCurrency();

  const { data: cart, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey() }
  });

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    }
  });

  const removeItem = useRemoveFromCart({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    }
  });

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    updateItem.mutate({ productId, data: { quantity } });
  };

  const handleRemove = (productId: number) => {
    removeItem.mutate({ productId });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="w-full lg:w-96 h-64 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("cart.title")}</h1>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border border-dashed">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("cart.empty")}</h2>
            <p className="text-muted-foreground mb-8 max-w-md">{t("cart.empty_desc")}</p>
            <Link href="/products">
              <Button size="lg" className="h-12 px-8">{t("cart.start_shopping")}</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1 w-full space-y-6">
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 space-y-6">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex flex-col sm:flex-row gap-6 pb-6 border-b last:border-0 last:pb-0">
                      <Link href={`/products/${item.productId}`} className="shrink-0">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 bg-muted rounded-lg overflow-hidden border">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                              {t("cart.no_image")}
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between gap-4">
                          <div>
                            <Link href={`/products/${item.productId}`}>
                              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">{item.product.name}</h3>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {t("cart.sold_by")} {item.product.sellerName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {item.product.discountPercent && item.product.discountPercent > 0 ? (
                              <>
                                <div className="font-bold text-lg">{format(item.product.finalPrice)}</div>
                                <div className="text-sm text-muted-foreground line-through">{format(item.product.price)}</div>
                              </>
                            ) : (
                              <div className="font-bold text-lg">{format(item.product.price)}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border rounded-md h-9">
                            <button
                              className="px-3 hover:bg-muted/50 h-full text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={updateItem.isPending}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 font-medium text-sm w-8 text-center">{item.quantity}</span>
                            <button
                              className="px-3 hover:bg-muted/50 h-full text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              disabled={updateItem.isPending || item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemove(item.productId)}
                            disabled={removeItem.isPending}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t("cart.remove")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 bg-card border rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6">{t("cart.order_summary")}</h3>

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("cart.subtotal", { count: cart.itemCount })}</span>
                  <span>{format(cart.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("cart.shipping")}</span>
                  <span>{t("cart.shipping_calc")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("cart.tax")}</span>
                  <span>{t("cart.tax_calc")}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>{t("cart.total")}</span>
                  <span>{format(cart.total)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full h-12 text-base font-semibold">
                  {t("cart.checkout")}
                  <ArrowRight className="ms-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
