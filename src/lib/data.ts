export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  merchant?: string;
}

export function formatCurrency(amount: number): string {
  // Try to use the user's selected currency from localStorage, default to INR
  const currency = typeof window !== "undefined" ? localStorage.getItem("finflow-currency") || "INR" : "INR";
  
  // Format based on the selected currency
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } else if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } else if (currency === "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  } else if (currency === "GBP") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 2,
    }).format(amount);
  } else {
    // Fallback
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
