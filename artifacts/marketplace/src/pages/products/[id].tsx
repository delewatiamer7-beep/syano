import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProduct, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Minus, Plus, ShoppingCart, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function ProductDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { isCustomer, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useGetProduct(id, {
    query: {
      enabled: !!id,
      queryKey: ["getProduct", id]
    }
  });

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: `${quantity}x ${product?.name} has been added to your cart.`,
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

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate({ data: { productId: product.id, quantity } });
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) setQuantity(quantity + 1);
  };

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
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/products">
            <Button>Back to products</Button>
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
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to all products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col space-y-4">
            <div className="aspect-square bg-card border rounded-2xl overflow-hidden relative flex items-center justify-center shadow-sm">
              {hasDiscount && (
                <Badge className="absolute top-4 right-4 z-10 text-sm py-1.5 px-3 bg-primary text-primary-foreground font-bold shadow-md">
                  {product.discountPercent}% OFF
                </Badge>
              )}
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground font-medium">No Image Available</span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2 uppercase tracking-wider text-sm font-semibold text-primary">
              {product.category}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
              {product.name}
            </h1>
            
            <div className="text-muted-foreground mb-6 font-medium">
              Sold by <span className="text-foreground">{product.sellerName}</span>
            </div>

            <div className="flex items-end gap-3 mb-8">
              {hasDiscount ? (
                <>
                  <span className="text-4xl font-bold text-foreground">
                    ${product.finalPrice.toFixed(2)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through pb-1">
                    ${product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold text-foreground">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Actions */}
            <div className="space-y-6 bg-card border rounded-xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between">
                <span className="font-medium">Availability</span>
                {product.stock > 0 ? (
                  <span className="text-primary font-medium flex items-center">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="text-destructive font-medium flex items-center">
                    <span className="w-2 h-2 rounded-full bg-destructive mr-2" />
                    Out of Stock
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
                    <span className="flex-1 text-center font-medium">
                      {quantity}
                    </span>
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
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {addToCart.isPending ? "Adding..." : "Add to Cart"}
                    </Button>
                  ) : !isAuthenticated ? (
                    <Link href={`/login?redirect=/products/${product.id}`} className="flex-1">
                      <Button className="w-full h-12 text-base font-medium shadow-sm">
                        Log in to Buy
                      </Button>
                    </Link>
                  ) : (
                    <Button className="flex-1 h-12 text-base font-medium" disabled>
                      Sellers cannot buy
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                <Truck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">Fast Shipping</span>
                <span className="text-xs text-muted-foreground mt-1">On all orders</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">Secure Payment</span>
                <span className="text-xs text-muted-foreground mt-1">100% protected</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
                <RefreshCw className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium">Easy Returns</span>
                <span className="text-xs text-muted-foreground mt-1">30 days policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
