import React from "react";
import { Link, useLocation } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isCustomer, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not add item to cart.",
          variant: "destructive",
        });
      }
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
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
          <Badge className="absolute top-3 right-3 z-10 bg-primary hover:bg-primary text-primary-foreground font-bold px-2 py-1">
            {product.discountPercent}% OFF
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
              <span className="text-sm font-medium">No Image</span>
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
            by {product.sellerName}
          </p>
          
          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
              {hasDiscount ? (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="font-bold text-xl text-foreground">
                    ${product.finalPrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-xl text-foreground">
                  ${product.price.toFixed(2)}
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
                <span className="sr-only">Add to cart</span>
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
              Only {product.stock} left in stock
            </div>
          )}
          {product.stock <= 0 && (
            <div className="mt-3 text-xs font-medium text-muted-foreground">
              Out of stock
            </div>
          )}
        </div>
    </div>
  );
}
