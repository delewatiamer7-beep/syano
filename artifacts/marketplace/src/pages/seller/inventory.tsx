import { useState } from "react";
import { useListProducts, useUpdateStock, useUpdateDiscount, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Inventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  const [stockValues, setStockValues] = useState<Record<number, number>>({});
  const [discountValues, setDiscountValues] = useState<Record<number, string>>({});

  const { data: products, isLoading } = useListProducts({ sellerId: user?.id }, {
    query: { queryKey: getListProductsQueryKey({ sellerId: user?.id }), enabled: !!user?.id }
  });

  const updateStock = useUpdateStock({
    mutation: {
      onSuccess: () => {
        toast({ title: t("inventory.stock_updated") });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    }
  });

  const updateDiscount = useUpdateDiscount({
    mutation: {
      onSuccess: () => {
        toast({ title: t("inventory.discount_updated") });
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
      <div className="container py-8 md:py-12 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("inventory.title")}</h1>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">{t("inventory.loading")}</div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t("inventory.no_products")}</h3>
              <p className="text-muted-foreground">{t("inventory.no_products_desc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">{t("inventory.product")}</TableHead>
                    <TableHead className="w-[130px]">{t("inventory.base_price")}</TableHead>
                    <TableHead className="w-[200px]">{t("inventory.stock_count")}</TableHead>
                    <TableHead className="w-[200px]">{t("inventory.discount")}</TableHead>
                    <TableHead className="text-right w-[150px]">{t("inventory.final_price")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="h-16">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{product.name}</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {product.stock <= 5 && product.stock > 0 && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                {t("inventory.low_stock")}
                              </Badge>
                            )}
                            {product.stock === 0 && (
                              <Badge variant="destructive" className="text-xs">{t("inventory.out_of_stock")}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(product.price)}</TableCell>
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary" onClick={() => handleSaveStock(product.id)}>
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
                          <span className="text-muted-foreground text-sm">%</span>
                          {discountValues[product.id] !== undefined &&
                            discountValues[product.id] !== (product.discountPercent?.toString() || "") && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary" onClick={() => handleSaveDiscount(product.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-base">
                        {formatCurrency(product.finalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
