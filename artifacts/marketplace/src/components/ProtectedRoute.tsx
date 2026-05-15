import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

type Role = "customer" | "seller" | "admin";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { isAuthenticated, user, isSeller, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role as Role)) {
      if (isAdmin) setLocation("/admin");
      else if (isSeller) setLocation("/seller/dashboard");
      else setLocation("/customer/dashboard");
    }
  }, [isAuthenticated, user, allowedRoles, setLocation, isSeller, isAdmin]);

  if (!isAuthenticated) return null;
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as Role)) return null;

  return <>{children}</>;
}
