import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "admin.nav_dashboard" },
  { href: "/admin/users", icon: Users, labelKey: "admin.nav_users" },
  { href: "/admin/products", icon: Package, labelKey: "admin.nav_products" },
  { href: "/admin/orders", icon: ShoppingCart, labelKey: "admin.nav_orders" },
  { href: "/admin/settings", icon: Settings, labelKey: "admin.nav_settings" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const isRtl = i18n.language === "ar";

  return (
    <div className="min-h-screen bg-background flex" dir={isRtl ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-card border-e border-border flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-none">{t("admin.title")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("admin.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, icon: Icon, labelKey }) => {
            const isActive = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t(labelKey)}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
