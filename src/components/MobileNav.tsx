import { LayoutDashboard, Receipt, PieChart, Settings, Plus, CalendarDays, X, Check, ArrowDownLeft, ArrowUpRight, Tag, Send, AlignLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAddTransaction, useCategories } from "@/hooks/useTransactions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/data";

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
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const amountRef = useRef<HTMLInputElement>(null);
  const addTransaction = useAddTransaction();
  const { data: categories = [] } = useCategories();

  const handleSubmit = async () => {
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }
    
    const finalCategory = category || (type === "expense" ? "Miscellaneous" : "Salary");

    addTransaction.mutate(
      {
        amount: parseFloat(amount),
        type,
        category: finalCategory,
        description: description || (type === "expense" ? "Quick Expense" : "Quick Income"),
        date,
      },
      {
        onSuccess: () => {
          toast.success("Transaction recorded");
          setAmount("");
          setDescription("");
          setCategory("");
          setIsOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => amountRef.current?.focus(), 150);
    }
  }, [isOpen]);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 mobile-nav-bar safe-area-bottom pb-2">
      {/* The "Middle View" Hybrid Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-full left-0 right-0 px-4 pb-4"
          >
            <div className="bg-card border border-muted/30 rounded-[2rem] shadow-2xl overflow-hidden p-5 space-y-5">
              {/* Header: Amount + Type */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black opacity-30">₹</span>
                  <input
                    ref={amountRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-4xl font-black focus:outline-none placeholder:opacity-10 tracking-tighter"
                    style={{ fontSize: '32px' }}
                  />
                </div>
                
                <div className="flex bg-muted/50 rounded-full p-1 border border-muted/20">
                  <button
                    onClick={() => setType("expense")}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      type === "expense" ? "bg-background shadow-md text-destructive" : "text-muted-foreground opacity-50"
                    }`}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setType("income")}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      type === "income" ? "bg-background shadow-md text-emerald-500" : "text-muted-foreground opacity-50"
                    }`}
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-muted/10">
                <AlignLeft className="w-5 h-5 text-muted-foreground/60" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this for?"
                  className="bg-transparent flex-1 focus:outline-none text-base font-medium placeholder:text-muted-foreground/30"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Category Picker */}
              <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.name)}
                      className={`px-4 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                        category === cat.name
                          ? "bg-foreground text-background border-foreground shadow-lg"
                          : "bg-muted/40 text-muted-foreground border-muted/10"
                      }`}
                    >
                      <span className="mr-2 opacity-70">{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSubmit}
                disabled={!amount || addTransaction.isPending}
                className="w-full py-4 editorial-gradient text-white rounded-[1.5rem] font-black text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
              >
                <Check className="w-5 h-5" />
                Confirm Transaction
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-around px-2 pt-1 h-16">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <motion.button
                key="add"
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 -mt-8 rounded-full flex items-center justify-center shadow-2xl border-4 border-background transition-all z-20 ${
                  isOpen ? "bg-primary text-primary-foreground" : "editorial-gradient text-white"
                }`}
              >
                <Plus className={`w-7 h-7 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
              </motion.button>
            );
          }
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsOpen(false);
              }}
              className="flex flex-col items-center gap-1 py-1 px-3 relative min-w-[64px]"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute -top-1 w-6 h-[2px] rounded-full mobile-nav-active-bar"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                />
              )}
              <tab.icon className={`w-5 h-5 transition-colors ${isActive ? "mobile-nav-icon-active" : "mobile-nav-icon-inactive"}`} />
              <span className={`text-[10px] transition-colors ${isActive ? "mobile-nav-label-active" : "mobile-nav-label-inactive"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
