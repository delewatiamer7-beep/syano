import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type Currency = "USD" | "SYP";

const DEFAULT_RATE = 14500;
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (usdAmount: number) => string;
  symbol: string;
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("marketplace_currency");
    return (saved === "SYP" || saved === "USD") ? saved : "USD";
  });
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE);

  useEffect(() => {
    fetch(`${BASE}/api/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.exchangeRate === "number" && data.exchangeRate > 0) {
          setExchangeRate(data.exchangeRate);
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    localStorage.setItem("marketplace_currency", c);
    setCurrencyState(c);
  }, []);

  const format = useCallback(
    (usdAmount: number): string => {
      if (currency === "SYP") {
        const syp = usdAmount * exchangeRate;
        return `${syp.toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س`;
      }
      return `$${usdAmount.toFixed(2)}`;
    },
    [currency, exchangeRate]
  );

  const symbol = currency === "SYP" ? "ل.س" : "$";

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, symbol, exchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
