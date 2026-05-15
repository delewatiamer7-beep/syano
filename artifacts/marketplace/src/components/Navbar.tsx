import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, Store, LayoutDashboard, Search, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGetCart } from "@workspace/api-client-react";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated, isCustomer, isSeller } = useAuth();
  const { setTheme } = useTheme();

  const { data: cart } = useGetCart({
    query: {
      enabled: isCustomer
    }
  });

  const cartItemCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">Marketplace</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Discover
            </Link>
            {isSeller && (
              <>
                <Link href="/seller/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/seller/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Products
                </Link>
                <Link href="/seller/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Orders
                </Link>
                <Link href="/seller/inventory" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Inventory
                </Link>
              </>
            )}
            {isCustomer && (
              <>
                <Link href="/customer/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Orders
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isCustomer && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          )}

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
                <DropdownMenuItem asChild>
                  <Link href={isSeller ? "/seller/dashboard" : "/customer/dashboard"} className="cursor-pointer w-full flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive cursor-pointer focus:text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="h-9 px-4">Log in</Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 px-4">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
