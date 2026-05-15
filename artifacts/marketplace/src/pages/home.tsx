import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ArrowRight, Tag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const { data: products, isLoading: isLoadingProducts } = useListProducts();
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();

  const featuredProducts = products?.slice(0, 8) || [];

  return (
    <Layout>
      <div className="w-full">
        <section className="bg-card border-b py-20 px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              {t("home.hero_title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.hero_desc")}
            </p>
            <div className="pt-4 flex items-center justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="h-12 px-8 text-base font-semibold">
                  {t("home.shop_all")}
                  <ArrowRight className="ms-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">{t("home.categories_title")}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {isLoadingCategories ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))
            ) : categories?.length === 0 ? (
              <p className="text-muted-foreground col-span-full">{t("home.no_categories")}</p>
            ) : (
              categories?.map((category) => (
                <Link key={category} href={`/products?category=${encodeURIComponent(category)}`}>
                  <div className="group flex flex-col items-center justify-center p-6 bg-card border rounded-xl hover:border-primary transition-colors cursor-pointer">
                    <Tag className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                    <span className="font-medium text-sm text-foreground">{category}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="py-16 bg-muted/30 border-t">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold tracking-tight">{t("home.arrivals_title")}</h2>
              <Link href="/products" className="text-primary hover:underline font-medium flex items-center">
                {t("home.view_all")} <ArrowRight className="ms-1 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {isLoadingProducts ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-4">
                    <div className="aspect-square bg-muted rounded-xl animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                  </div>
                ))
              ) : featuredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">{t("home.no_products")}</p>
                </div>
              ) : (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
