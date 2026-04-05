import { LayoutDashboard, Receipt, PieChart, CreditCard, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useProfile } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: PieChart },
  { id: "budgets", label: "Budgets", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore();
  const { data: profile } = useProfile();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-card border-r border-border p-5 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center font-display font-bold text-white text-sm shadow-lg shadow-[hsl(217_91%_60%/0.25)]">
          F
        </div>
        <h1 className="font-display font-bold text-lg text-foreground tracking-tight">Finflow</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-primary" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile */}
      <button
        onClick={() => setActiveTab("settings")}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors mb-3"
      >
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-display font-semibold text-xs">
          {(profile?.display_name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-foreground truncate">
            {profile?.display_name || "User"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </button>

      {/* Quick tip */}
      <div className="bg-secondary/40 rounded-lg p-4 border border-border">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">💡 Tip</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Set budgets for each category to track spending and stay on target.
        </p>
      </div>
    </aside>
  );
}
