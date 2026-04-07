import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useCategories, useAddTransaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

export default function AddExpenseModal() {
  const { showAddModal, setShowAddModal } = useAppStore();
  const categoriesQuery = useCategories();
  const addTransaction = useAddTransaction();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customIncomeCategory, setCustomIncomeCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const incomeCategories = [
    { id: "salary", name: "Salary", icon: "💼" },
    { id: "freelance", name: "Freelancing", icon: "🧑‍💻" },
    { id: "business", name: "Business", icon: "🏢" },
    { id: "custom", name: "Custom", icon: "✍️" },
  ];

  const defaultExpenseCategories = [
    { id: "food", name: "Food & Dining", icon: "🍕" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "housing", name: "Housing", icon: "🏠" },
    { id: "transport", name: "Transport", icon: "🚗" },
    { id: "health", name: "Healthcare", icon: "💊" },
    { id: "bills", name: "Bills & Utilities", icon: "💡" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "misc", name: "Miscellaneous", icon: "📦" },
  ];

  const categories = categoriesQuery.data?.length ? categoriesQuery.data : defaultExpenseCategories;
  const availableCategories = type === "income" ? incomeCategories : categories;

  const handleSubmit = () => {
    const categoryName = category === "custom" ? customIncomeCategory.trim() : category;
    if (!amount || !categoryName || !date || (type === "expense" && !description)) return;
    addTransaction.mutate(
      {
        amount: parseFloat(amount),
        type,
        category: categoryName,
        description,
        date,
      },
      {
        onSuccess: () => {
          toast.success("Transaction added!");
          setAmount("");
          setDescription("");
          setCategory("");
          setDate(new Date().toISOString().split("T")[0]);
          setShowAddModal(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <AnimatePresence>
      {showAddModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-[480px] bg-background border border-muted/50 rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-headline font-extrabold text-2xl tracking-tight text-foreground">Add Transaction</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6 border border-muted/30">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setCategory("");
                      setCustomIncomeCategory("");
                      if (t === "income") setDescription("");
                    }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all capitalize ${
                      type === t
                        ? t === "expense"
                          ? "bg-background shadow-sm text-foreground"
                          : "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-[10px] text-muted-foreground font-label uppercase tracking-widest px-1 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-muted/40 border border-muted/50 rounded-2xl px-5 py-4 text-3xl font-headline font-extrabold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                />
              </div>

              {type === "expense" && (
                <div className="mb-5">
                  <label className="text-[10px] text-muted-foreground font-label uppercase tracking-widest px-1 block mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was this for?"
                    className="w-full bg-muted/40 border border-muted/50 rounded-xl px-4 py-3.5 text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  />
                </div>
              )}

              {type === "income" && category === "custom" && (
                <div className="mb-5">
                  <label className="text-[10px] text-muted-foreground font-label uppercase tracking-widest px-1 block mb-1">Custom income category</label>
                  <input
                    type="text"
                    value={customIncomeCategory}
                    onChange={(e) => setCustomIncomeCategory(e.target.value)}
                    placeholder="e.g. Bonus, Commission"
                    className="w-full bg-muted/40 border border-muted/50 rounded-xl px-4 py-3.5 text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  />
                </div>
              )}

              <div className="mb-5">
                <label className="text-[10px] text-muted-foreground font-label uppercase tracking-widest px-1 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split("T")[0]}
                  min="2000-01-01"
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-muted/40 border border-muted/50 rounded-xl px-4 py-3.5 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                />
              </div>

              <div className="mb-8">
                <label className="text-[10px] text-muted-foreground font-label uppercase tracking-widest px-1 block mb-2">Category</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id === "custom" ? "custom" : cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        category === (cat.id === "custom" ? "custom" : cat.name)
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-muted-foreground/20 bg-muted/30 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  !amount ||
                  !category ||
                  !date ||
                  (type === "expense" && !description) ||
                  (type === "income" && category === "custom" && !customIncomeCategory.trim()) ||
                  addTransaction.isPending
                }
                className="w-full py-4 rounded-xl editorial-gradient text-white font-bold text-base shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-[0.98]"
              >
                {addTransaction.isPending ? "Loging..." : `Log ${type === "income" ? "Income" : "Expense"}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
