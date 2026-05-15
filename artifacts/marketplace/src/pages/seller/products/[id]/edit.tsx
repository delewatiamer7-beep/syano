import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateProduct, useGetProduct, getListProductsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(2, "Category is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProduct() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const { data: product, isLoading } = useGetProduct(id, {
    query: {
      queryKey: getGetProductQueryKey(id),
      enabled: !!id,
    }
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || "",
      });
    }
  }, [product, form]);

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: t("seller_products.updated") });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        setLocation("/seller/products");
      },
      onError: (error: any) => {
        toast({
          title: t("seller_products.update_failed"),
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    const payload = { ...data, imageUrl: data.imageUrl || null };
    updateProduct.mutate({ id, data: payload });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  if (isLoading) {
    return <Layout><div className="container py-12 text-muted-foreground">{t("common.loading")}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Link href="/seller/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <BackIcon className="h-4 w-4 me-1" />
          {t("seller_products.back")}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("seller_products.edit_title")}</h1>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.product_name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller_products.price_label")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none text-muted-foreground">
                    {t("seller_products.stock_col")}
                  </p>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted/30 text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground">{product?.stock}</span>
                    <span className="text-xs">{t("seller_products.stock_managed")}</span>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.category")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.description")}</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.image_url")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t gap-4">
                <Link href="/seller/products">
                  <Button variant="outline" type="button">{t("seller_products.cancel_btn")}</Button>
                </Link>
                <Button type="submit" disabled={updateProduct.isPending}>
                  {updateProduct.isPending ? t("seller_products.saving") : t("seller_products.save_btn")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
