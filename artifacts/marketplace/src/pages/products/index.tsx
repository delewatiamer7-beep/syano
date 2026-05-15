import React, { useState } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Products() {
  const { t } = useTranslation();
  const { currency, symbol } = useCurrency();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || undefined;
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const EXCHANGE_RATE = 14500;

  const toUsd = (val: string): number | undefined => {
    const n = parseFloat(val);
    if (isNaN(n)) return undefined;
    return currency === "SYP" ? n / EXCHANGE_RATE : n;
  };

  const { data: products, isLoading } = useListProducts({
    search: debouncedSearch || undefined,
    category: category && category !== "all" ? category : undefined,
    sortBy: sortBy,
    minPrice: toUsd(minPriceInput),
    maxPrice: toUsd(maxPriceInput),
    hasDiscount: hasDiscount || undefined,
  });

  const { data: categories } = useListCategories();

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("newest");
    setMinPriceInput("");
    setMaxPriceInput("");
    setHasDiscount(false);
  };

  const hasActiveFilters = search || (category && category !== "all") || sortBy !== "newest" || minPriceInput || maxPriceInput || hasDiscount;

  const priceLabel = `${t("products.min_price")} (${symbol})`;
  const maxPriceLabel = `${t("products.max_price")} (${symbol})`;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("products.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("products.subtitle")}</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.search_placeholder")}
                className="ps-9 pe-8 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="w-full sm:w-[200px]">
              <Select value={category || "all"} onValueChange={(val) => setCategory(val)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={t("products.all_categories")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.all_categories")}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full sm:w-[190px]">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("products.sort_newest")}</SelectItem>
                  <SelectItem value="price_asc">{t("products.sort_price_asc")}</SelectItem>
                  <SelectItem value="price_desc">{t("products.sort_price_desc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced filters toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={filtersOpen ? "border-primary text-primary" : ""}
            >
              <SlidersHorizontal className="h-4 w-4 me-1.5" />
              {t("products.filters")}
              <ChevronDown className={`h-3.5 w-3.5 ms-1 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Advanced filters panel */}
        {filtersOpen && (
          <div className="mb-6 p-4 bg-muted/30 border rounded-xl flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-xs font-medium text-muted-foreground">{priceLabel}</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="h-9 w-[120px]"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <Label className="text-xs font-medium text-muted-foreground">{maxPriceLabel}</Label>
              <Input
                type="number"
                min="0"
                placeholder="∞"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="h-9 w-[120px]"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Checkbox
                id="on-sale"
                checked={hasDiscount}
                onCheckedChange={(v) => setHasDiscount(!!v)}
              />
              <Label htmlFor="on-sale" className="cursor-pointer text-sm font-medium">
                {t("products.on_sale")}
              </Label>
            </div>
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5 me-1" />
              {t("products.clear_filters")}
            </Button>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col space-y-4">
                <div className="aspect-square bg-muted rounded-xl animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/20 rounded-xl border border-dashed">
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t("products.no_found")}</h3>
            <p className="text-muted-foreground max-w-md mb-6">{t("products.no_found_desc")}</p>
            <Button variant="outline" onClick={clearFilters}>
              {t("products.clear_filters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
