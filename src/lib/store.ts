import { create } from "zustand";

function getStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("finflow-theme") as "dark" | "light") || "dark";
}

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  showBulkImportModal: boolean;
  setShowBulkImportModal: (show: boolean) => void;
  editTransactionId: string | null;
  setEditTransactionId: (id: string | null) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
  showAddModal: false,
  setShowAddModal: (show) => set({ showAddModal: show }),
  showBulkImportModal: false,
  setShowBulkImportModal: (show) => set({ showBulkImportModal: show }),
  editTransactionId: null,
  setEditTransactionId: (id) => set({ editTransactionId: id }),
  theme: getStoredTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("finflow-theme", next);
      document.documentElement.classList.toggle("light", next === "light");
      return { theme: next };
    }),
  currency: (typeof window !== "undefined" && localStorage.getItem("finflow-currency")) || "INR",
  setCurrency: (currency) => set(() => {
    localStorage.setItem("finflow-currency", currency);
    return { currency };
  }),
}));

// Initialize theme on load
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("finflow-theme");
  if (savedTheme === "light") {
    document.documentElement.classList.add("light");
  }
}
