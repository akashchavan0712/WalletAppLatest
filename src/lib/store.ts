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
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
  showAddModal: false,
  setShowAddModal: (show) => set({ showAddModal: show }),
  theme: getStoredTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("finflow-theme", next);
      document.documentElement.classList.toggle("light", next === "light");
      return { theme: next };
    }),
}));

// Initialize theme on load
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("finflow-theme");
  if (savedTheme === "light") {
    document.documentElement.classList.add("light");
  }
}
