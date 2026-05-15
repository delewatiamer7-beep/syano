import { useState } from "react";
import { Link } from "wouter";
import { useListProducts, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, Trash2, Plus, PackageOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: products, isLoading } = useListProducts({
    sellerId: user?.id
  }, {
    query: {
      enabled: !!user?.id
    }
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Product deleted" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Failed to delete product", variant: "destructive" });
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
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your product catalog</p>
          </div>
          <Link href="/seller/products/new">
            <Button className="h-10">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading products...</div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">Create your first product to start selling.</p>
              <Link href="/seller/products/new">
                <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                          {product.discountPercent}% OFF
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="uppercase text-xs">{product.category}</TableCell>
                    <TableCell className="text-right font-medium">
                      {product.discountPercent && product.discountPercent > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>${product.finalPrice.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span>${product.price.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.stock > 10 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/seller/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product from the marketplace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}