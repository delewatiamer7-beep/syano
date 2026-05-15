import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, LogOut, LayoutDashboard, Search, X, Globe, DollarSign } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useGetCart, useListProducts, getGetCartQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n";
import { useDebounce } from "@/hooks/use-debounce";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, logout, isAuthenticated, isCustomer, isSeller } = useAuth();
  const { setTheme } = useTheme();
  const { currency, setCurrency, symbol } = useCurrency();
  const { t, i18n } = useTranslation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: cart } = useGetCart({ query: { queryKey: getGetCartQueryKey(), enabled: isCustomer } });
  const cartItemCount = cart?.itemCount || 0;

  const { data: suggestions } = useListProducts(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getListProductsQueryKey({ search: debouncedSearch || undefined }), enabled: !!debouncedSearch && debouncedSearch.length >= 2 } }
  );

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    applyDirection(lang);
  };

  useEffect(() => {
    applyDirection(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (productId: number) => {
    navigate(`/products/${productId}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const isRtl = i18n.language === "ar";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">{t("nav.brand")}</span>
          </Link>

          <nav className="hidden md:flex gap-5">
            <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {t("nav.discover")}
            </Link>
            {isSeller && (
              <>
                <Link href="/seller/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.dashboard")}
                </Link>
                <Link href="/seller/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.products")}
                </Link>
                <Link href="/seller/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.orders")}
                </Link>
                <Link href="/seller/inventory" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.inventory")}
                </Link>
              </>
            )}
            {isCustomer && (
              <>
                <Link href="/customer/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.dashboard")}
                </Link>
                <Link href="/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.orders")}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="relative flex-1 max-w-sm hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                placeholder={t("nav.search_placeholder")}
                className="ps-9 pe-8 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-background transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {searchOpen && debouncedSearch.length >= 2 && (
            <div className="absolute top-full mt-1 start-0 end-0 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
              {!suggestions || suggestions.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">{t("products.no_found")}</div>
              ) : (
                <div className="py-1 max-h-72 overflow-y-auto">
                  {suggestions.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSuggestionClick(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-start"
                    >
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category}</div>
                      </div>
                      <div className="text-sm font-semibold text-primary shrink-0">
                        {symbol}{p.finalPrice.toFixed(2)}
                      </div>
                    </button>
                  ))}
                  {suggestions.length > 0 && (
                    <button
                      onClick={handleSearchSubmit as any}
                      className="w-full px-3 py-2.5 text-sm text-primary font-medium hover:bg-muted/50 transition-colors border-t flex items-center gap-2"
                    >
                      <Search className="h-3.5 w-3.5" />
                      {t("nav.search_for", { query: debouncedSearch })}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-[1.1rem] w-[1.1rem]" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Globe className="h-[1.1rem] w-[1.1rem]" />
                <span className="sr-only">{t("language.label")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => switchLanguage("en")}
                className={i18n.language === "en" ? "font-semibold text-primary" : ""}
              >
                🇬🇧 {t("language.en")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchLanguage("ar")}
                className={i18n.language === "ar" ? "font-semibold text-primary" : ""}
              >
                🇸🇦 {t("language.ar")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-2 font-medium text-xs gap-1">
                <span className="text-sm">{currency === "SYP" ? "ل.س" : "$"}</span>
                <span className="hidden sm:inline">{currency}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setCurrency("USD")}
                className={currency === "USD" ? "font-semibold text-primary" : ""}
              >
                $ {t("currency.usd")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrency("SYP")}
                className={currency === "SYP" ? "font-semibold text-primary" : ""}
              >
                ل.س {t("currency.syp")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t("theme.toggle")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>{t("theme.light")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>{t("theme.dark")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>{t("theme.system")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          {isCustomer && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">{t("nav.cart")}</span>
              </Button>
            </Link>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 rounded-full px-4 border border-border bg-card">
                  <span className="text-sm font-medium truncate max-w-[100px]">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground w-[200px] truncate">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={isSeller ? "/seller/dashboard" : "/customer/dashboard"} className="cursor-pointer w-full flex items-center">
                    <LayoutDashboard className="me-2 h-4 w-4" />
                    <span>{t("nav.dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive" onClick={logout}>
                  <LogOut className="me-2 h-4 w-4" />
                  <span>{t("nav.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="h-9 px-4">{t("nav.login")}</Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 px-4">{t("nav.signup")}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Expandable */}
      {searchOpen && (
        <div className="md:hidden border-t px-4 py-3 bg-background">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("nav.search_placeholder")}
                className="ps-9 pe-8"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
