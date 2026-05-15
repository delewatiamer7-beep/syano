import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, AuthResponse } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSeller: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsReady(true);
  }, []);

  const login = useCallback((authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setToken(authResponse.token);
    localStorage.setItem("token", authResponse.token);
    localStorage.setItem("user", JSON.stringify(authResponse.user));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  if (!isReady) return null;

  const isAuthenticated = !!token;
  const isSeller = user?.role === "seller";
  const isCustomer = user?.role === "customer";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isSeller, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
