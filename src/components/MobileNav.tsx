import { LayoutDashboard, Receipt, PieChart, Settings, Plus, CalendarDays, X, Check, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAddTransaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "transactions", icon: Receipt, label: "History" },
  { id: "add", icon: Plus, label: "Add", isFab: true },
  { id: "calendar", icon: CalendarDays, label: "Calendar" },
  { id: "analytics", icon: PieChart, label: "Stats" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function MobileNav() {
  const { activeTab, setActiveTab } = useAppStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const addTransaction = useAddTransaction();

  const handleSubmit = async () => {
    if (!amount) return;
    
    // Default to a generic category for quick add
    const defaultCat = type === "expense" ? "Miscellaneous" : "Salary";
    const date = new Date().toISOString().split("T")[0];

    addTransaction.mutate(
      {
        amount: parseFloat(amount),
        type,
        category: defaultCat,
        description: description || (type === "expense" ? "Quick Expense" : "Quick Income"),
        date,
      },
      {
        onSuccess: () => {
          toast.success("Transaction added!");
          setAmount("");
          setDescription("");
          setIsQuickAddOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <>
      <AnimatePresence>
        {isQuickAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQuickAddOpen(false)}
            className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background/90 backdrop-blur-3xl border-t-0 shadow-[0_-10px_40px_rgba(19,27,46,0.06)] safe-area-bottom pb-2">
        <AnimatePresence>
          {isQuickAddOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-muted/90 rounded-t-3xl shadow-lg flex flex-col gap-3">
                <div className="flex gap-2 p-1 bg-secondary/80 rounded-lg">
                  <button
                    onClick={() => setType("expense")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      type === "expense" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Expense
                  </button>
                  <button
                    onClick={() => setType("income")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      type === "income" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Income
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Wait, what for?"
                    className="flex-[1.5] bg-secondary/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!amount || addTransaction.isPending}
                    className="w-9 h-9 flex items-center justify-center rounded-lg editorial-gradient text-white shadow-md disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-around px-2 pt-2">
          {tabs.map((tab) => {
            if (tab.isFab) {
              return (
                <motion.button
                  key="add"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                  className={`w-14 h-14 -mt-8 rounded-full flex items-center justify-center shadow-xl transition-all ${
                    isQuickAddOpen ? "bg-card text-foreground border border-muted" : "editorial-gradient text-white"
                  }`}
                >
                  <motion.div animate={{ rotate: isQuickAddOpen ? 45 : 0 }}>
                    <Plus className="w-6 h-6" />
                  </motion.div>
                </motion.button>
              );
            }
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsQuickAddOpen(false);
                }}
                className="flex flex-col items-center gap-1 py-1 px-3 relative"
              >
                {isActive && !isQuickAddOpen && (
                  <motion.div
                    layoutId="mobile-active"
                    className="absolute -top-0.5 w-6 h-[2px] bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  />
                )}
                <tab.icon className={`w-5 h-5 transition-colors ${isActive && !isQuickAddOpen ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] transition-colors ${isActive && !isQuickAddOpen ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
