import { LayoutDashboard, Receipt, PieChart, Settings, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "transactions", icon: Receipt, label: "History" },
  { id: "add", icon: Plus, label: "Add", isFab: true },
  { id: "analytics", icon: PieChart, label: "Stats" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function MobileNav() {
  const { activeTab, setActiveTab, setShowAddModal } = useAppStore();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <motion.button
                key="add"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAddModal(true)}
                className="w-12 h-12 -mt-6 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-[hsl(217_91%_60%/0.3)]"
              >
                <Plus className="w-6 h-6 text-white" />
              </motion.button>
            );
          }
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 py-1 px-3 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute -top-0.5 w-6 h-[2px] bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                />
              )}
              <tab.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
