import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NewProduct() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const productSchema = z.object({
    name: z.string().min(2, t("seller_products.name_min")),
    description: z.string().min(10, t("seller_products.desc_min")),
    price: z.coerce.number().min(0.01, t("seller_products.price_min")),
    category: z.string().min(2, t("seller_products.category_min")),
    stock: z.coerce.number().int().min(0),
    imageUrl: z.string().url(t("seller_products.url_invalid")).optional().or(z.literal("")),
  });

  type ProductFormValues = z.infer<typeof productSchema>;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      stock: 0,
      imageUrl: "",
    },
  });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: t("seller_products.created") });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setLocation("/seller/products");
      },
      onError: (error: any) => {
        toast({
          title: t("seller_products.create_failed"),
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    const payload = { ...data, imageUrl: data.imageUrl || null };
    createProduct.mutate({ data: payload });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Link href="/seller/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <BackIcon className="h-4 w-4 me-1" />
          {t("seller_products.back")}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("seller_products.new_title")}</h1>

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
                      <Input placeholder={t("seller_products.product_name_placeholder")} {...field} />
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
                        <Input type="number" step="0.01" min="0" placeholder="29.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("seller_products.initial_stock")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("seller_products.category")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("seller_products.category_placeholder")} {...field} />
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
                      <Textarea
                        placeholder={t("seller_products.description_placeholder")}
                        className="min-h-[120px]"
                        {...field}
                      />
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
                      <Input placeholder={t("seller_products.image_url_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 border-t gap-4">
                <Link href="/seller/products">
                  <Button variant="outline" type="button">{t("seller_products.cancel_btn")}</Button>
                </Link>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? t("seller_products.creating") : t("seller_products.create_btn")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
