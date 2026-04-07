import { LayoutDashboard, Receipt, PieChart, CreditCard, Settings, CalendarDays } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useProfile } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: PieChart },
  { id: "budgets", label: "Budgets", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore();
  const profile = useProfile();
  const auth = useAuth();
  
  const userProfile = profile.data;
  const user = auth.user;

  return (
    <aside className="hidden lg:flex flex-col h-full p-4 gap-2 bg-muted/30 w-64 fixed left-0 top-0 border-r-0 font-headline text-sm font-medium tracking-tight">
      {/* Logo */}
      <div className="mb-8 px-4 py-2 flex items-center justify-between">
        <div>
          <h1 className="font-headline font-extrabold text-lg tracking-tighter text-foreground">Wallet Tracker</h1>
          <p className="text-xs text-muted-foreground font-label">Editorial Intelligence</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                isActive
                  ? "text-primary bg-card shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <item.icon className="w-5 h-5 text-current" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="mt-auto p-4 bg-muted/50 rounded-2xl flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center font-headline font-bold text-primary shadow-sm">
          {(userProfile?.display_name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-bold text-foreground truncate">
            {userProfile?.display_name || "User"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate font-label pr-1">
            {user?.email}
          </p>
        </div>
      </div>
      
      {/* Quick Add Top up replacement styling */}
      <div className="px-2">
        <button
          onClick={() => setActiveTab("add")}
          className="w-full py-2.5 bg-foreground text-background rounded-xl font-bold text-sm active:scale-95 transition-transform hover:opacity-90"
        >
          Quick Add
        </button>
      </div>
    </aside>
  );
}
