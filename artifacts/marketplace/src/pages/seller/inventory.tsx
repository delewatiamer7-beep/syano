import { useState } from "react";
import { useListProducts, useUpdateStock, useUpdateDiscount, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, Check, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [stockValues, setStockValues] = useState<Record<number, number>>({});
  const [discountValues, setDiscountValues] = useState<Record<number, string>>({});
  
  const { data: products, isLoading } = useListProducts({ sellerId: user?.id }, {
    query: { enabled: !!user?.id }
  });

  const updateStock = useUpdateStock({
    mutation: {
      onSuccess: () => {
        toast({ title: "Stock updated" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    }
  });

  const updateDiscount = useUpdateDiscount({
    mutation: {
      onSuccess: () => {
        toast({ title: "Discount updated" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    }
  });

  const handleStockChange = (id: number, val: string) => {
    setStockValues(prev => ({ ...prev, [id]: parseInt(val, 10) || 0 }));
  };

  const handleSaveStock = (id: number) => {
    const val = stockValues[id];
    if (val !== undefined) {
      updateStock.mutate({ id, data: { stock: val } });
    }
  };

  const handleDiscountChange = (id: number, val: string) => {
    setDiscountValues(prev => ({ ...prev, [id]: val }));
  };

  const handleSaveDiscount = (id: number) => {
    const valStr = discountValues[id];
    if (valStr !== undefined) {
      const val = valStr === "" ? null : parseInt(valStr, 10);
      updateDiscount.mutate({ id, data: { discountPercent: val } });
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Inventory & Pricing</h1>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No products</h3>
              <p className="text-muted-foreground">Add products to manage inventory.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[120px]">Base Price</TableHead>
                  <TableHead className="w-[200px]">Stock Count</TableHead>
                  <TableHead className="w-[200px]">Discount (%)</TableHead>
                  <TableHead className="text-right w-[150px]">Final Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.stock <= 5 && product.stock > 0 && (
                        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>
                      )}
                      {product.stock === 0 && (
                        <Badge variant="destructive" className="ml-2">Out of Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="0"
                          className="w-20 h-8"
                          defaultValue={product.stock}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                        />
                        {stockValues[product.id] !== undefined && stockValues[product.id] !== product.stock && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleSaveStock(product.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          className="w-20 h-8"
                          placeholder="0"
                          defaultValue={product.discountPercent || ""}
                          onChange={(e) => handleDiscountChange(product.id, e.target.value)}
                        />
                        {discountValues[product.id] !== undefined && 
                         discountValues[product.id] !== (product.discountPercent?.toString() || "") && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleSaveDiscount(product.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      ${product.finalPrice.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
}