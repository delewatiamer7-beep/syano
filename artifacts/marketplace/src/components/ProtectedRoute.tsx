import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ("customer" | "seller")[];
}) {
  const { isAuthenticated, user, isSeller } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role as any)) {
      setLocation(isSeller ? "/seller/dashboard" : "/customer/dashboard");
    }
  }, [isAuthenticated, user, allowedRoles, setLocation, isSeller]);

  if (!isAuthenticated) return null;
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role as any)) return null;

  return <>{children}</>;
}
