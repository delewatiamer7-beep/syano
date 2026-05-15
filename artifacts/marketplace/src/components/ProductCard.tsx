import React from "react";
import { Link, useLocation } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isCustomer, isAuthenticated } = useAuth();
  const { format } = useCurrency();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("product_detail.added_to_cart"),
          description: t("product_detail.added_desc", { qty: 1, name: product.name }),
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
  };

  const hasDiscount = product.discountPercent && product.discountPercent > 0;

  return (
    <div
      className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all cursor-pointer h-full relative"
      onClick={() => navigate(`/products/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/products/${product.id}`)}
    >
      {hasDiscount && (
        <Badge className="absolute top-3 end-3 z-10 bg-primary hover:bg-primary text-primary-foreground font-bold px-2 py-1">
          {product.discountPercent}% {t("products.off")}
        </Badge>
      )}

      <div className="aspect-square bg-muted overflow-hidden relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
            <span className="text-sm font-medium">{t("product_detail.no_image")}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
          {product.category}
        </div>
        <h3 className="font-semibold text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
          {t("common.by")} {product.sellerName}
        </p>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {format(product.price)}
                </span>
                <span className="font-bold text-xl text-foreground">
                  {format(product.finalPrice)}
                </span>
              </>
            ) : (
              <span className="font-bold text-xl text-foreground">
                {format(product.price)}
              </span>
            )}
          </div>

          {isCustomer && (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleAddToCart}
              disabled={addToCart.isPending || product.stock <= 0}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">{t("product_detail.add_to_cart")}</span>
            </Button>
          )}

          {!isAuthenticated && (
            <Link href={`/login?redirect=/products/${product.id}`} onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <div className="mt-3 text-xs font-medium text-destructive">
            {t("products.only_left", { count: product.stock })}
          </div>
        )}
        {product.stock <= 0 && (
          <div className="mt-3 text-xs font-medium text-muted-foreground">
            {t("products.out_of_stock")}
          </div>
        )}
      </div>
    </div>
  );
}
