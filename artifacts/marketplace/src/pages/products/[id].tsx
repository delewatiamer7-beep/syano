import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProduct, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Minus, Plus, ShoppingCart, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function ProductDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { isCustomer, isAuthenticated } = useAuth();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: ["getProduct", id] }
  });

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("product_detail.added_to_cart"),
          description: t("product_detail.added_desc", { qty: quantity, name: product?.name }),
        });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => {
        toast({
          title: t("common.error"),
          description: t("product_detail.error_add"),
          variant: "destructive",
        });
      }
    }
  });

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate({ data: { productId: product.id, quantity } });
  };

  const decreaseQuantity = () => { if (quantity > 1) setQuantity(quantity - 1); };
  const increaseQuantity = () => { if (product && quantity < product.stock) setQuantity(quantity + 1); };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-6">
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
              <div className="h-12 bg-muted rounded w-1/3 animate-pulse" />
              <div className="h-32 bg-muted rounded w-full animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-2xl font-bold mb-4">{t("product_detail.not_found")}</h2>
          <p className="text-muted-foreground mb-8">{t("product_detail.not_found_desc")}</p>
          <Link href="/products">
            <Button>{t("product_detail.back_to_products")}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasDiscount = product.discountPercent && product.discountPercent > 0;

  return (
    <Layout>
      <div className="container py-8">
        <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4 me-1" />
          {t("product_detail.back")}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Image */}
          <div className="flex flex-col space-y-4">
            <div className="aspect-square bg-card border rounded-2xl overflow-hidden relative flex items-center justify-center shadow-sm">
              {hasDiscount && (
                <Badge className="absolute top-4 end-4 z-10 text-sm py-1.5 px-3 bg-primary text-primary-foreground font-bold shadow-md">
                  {product.discountPercent}% {t("products.off")}
                </Badge>
              )}
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground font-medium">{t("product_detail.no_image")}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="mb-2 uppercase tracking-wider text-sm font-semibold text-primary">
              {product.category}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
              {product.name}
            </h1>

            <div className="text-muted-foreground mb-6 font-medium">
              {t("product_detail.sold_by")} <span className="text-foreground">{product.sellerName}</span>
            </div>

            <div className="flex items-end gap-3 mb-8">
              {hasDiscount ? (
                <>
                  <span className="text-4xl font-bold text-foreground">{format(product.finalPrice)}</span>
                  <span className="text-xl text-muted-foreground line-through pb-1">{format(product.price)}</span>
                </>
              ) : (
                <span className="text-4xl font-bold text-foreground">{format(product.price)}</span>
              )}
            </div>

            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Actions */}
            <div className="space-y-6 bg-card border rounded-xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("product_detail.availability")}</span>
                {product.stock > 0 ? (
                  <span className="text-primary font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {t("product_detail.in_stock", { count: product.stock })}
                  </span>
                ) : (
                  <span className="text-destructive font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    {t("product_detail.out_of_stock")}
                  </span>
                )}
              </div>

              {product.stock > 0 && (
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center border rounded-md h-12 w-32">
                    <button
                      className="flex-1 flex items-center justify-center hover:bg-muted/50 transition-colors h-full text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <button
                      className="flex-1 flex items-center justify-center hover:bg-muted/50 transition-colors h-full text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {isCustomer ? (
                    <Button
                      className="flex-1 h-12 text-base font-medium shadow-sm hover:shadow"
                      onClick={handleAddToCart}
                      disabled={addToCart.isPending}
                    >
                      <ShoppingCart className="me-2 h-5 w-5" />
                      {addToCart.isPending ? t("product_detail.adding") : t("product_detail.add_to_cart")}
                    </Button>
                  ) : !isAuthenticated ? (
                    <Link href={`/login?redirect=/products/${product.id}`} className="flex-1">
                      <Button className="w-full h-12 text-base font-medium shadow-sm">
                        {t("product_detail.login_to_buy")}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="flex-1 h-12 text-base font-medium" disabled>
                      {t("product_detail.sellers_cannot_buy")}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                <Truck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">{t("product_detail.fast_shipping")}</span>
                <span className="text-xs text-muted-foreground mt-1">{t("product_detail.fast_shipping_desc")}</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">{t("product_detail.secure_payment")}</span>
                <span className="text-xs text-muted-foreground mt-1">{t("product_detail.secure_payment_desc")}</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                <RefreshCw className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">{t("product_detail.easy_returns")}</span>
                <span className="text-xs text-muted-foreground mt-1">{t("product_detail.easy_returns_desc")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
