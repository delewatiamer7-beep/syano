import { useState } from "react";
import { Link } from "wouter";
import { useListProducts, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Edit, Trash2, Plus, PackageOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SellerProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: products, isLoading } = useListProducts({
    sellerId: user?.id
  }, {
    query: {
      queryKey: getListProductsQueryKey({ sellerId: user?.id }),
      enabled: !!user?.id
    }
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: t("seller_products.deleted") });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: t("seller_products.delete_failed"), variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteProduct.mutate({ id: deleteId });
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("seller_products.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("seller_products.subtitle")}</p>
          </div>
          <Link href="/seller/products/new">
            <Button className="h-10">
              <Plus className="me-2 h-4 w-4" /> {t("seller_products.add_product")}
            </Button>
          </Link>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("seller_products.loading")}</div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t("seller_products.no_products")}</h3>
              <p className="text-muted-foreground mb-6">{t("seller_products.no_products_desc")}</p>
              <Link href="/seller/products/new">
                <Button><Plus className="me-2 h-4 w-4" /> {t("seller_products.add_product")}</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t("seller_products.image_col")}</TableHead>
                  <TableHead>{t("seller_products.name_col")}</TableHead>
                  <TableHead>{t("seller_products.category_col")}</TableHead>
                  <TableHead className="text-end">{t("seller_products.price_col")}</TableHead>
                  <TableHead className="text-center">{t("seller_products.stock_col")}</TableHead>
                  <TableHead className="text-end">{t("seller_products.actions_col")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded overflow-hidden bg-muted border">
                        {product.imageUrl && <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.discountPercent && product.discountPercent > 0 && (
                        <Badge variant="secondary" className="ms-2 bg-primary/10 text-primary">
                          {product.discountPercent}% {t("seller_products.off_badge")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="uppercase text-xs">{product.category}</TableCell>
                    <TableCell className="text-end font-medium">
                      {product.discountPercent && product.discountPercent > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{format(product.finalPrice)}</span>
                          <span className="text-xs text-muted-foreground line-through">{format(product.price)}</span>
                        </div>
                      ) : (
                        <span>{format(product.price)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.stock > 10 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t("seller_products.actions_col")}</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("seller_products.confirm_delete")}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("seller_products.delete_confirm_title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("seller_products.delete_confirm_desc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("seller_products.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("seller_products.confirm_delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
