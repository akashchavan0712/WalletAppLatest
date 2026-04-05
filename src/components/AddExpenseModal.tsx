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
            <div className="w-full max-w-[480px] glass-card p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl text-foreground">Add Transaction</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-1 p-1 bg-secondary/60 rounded-lg mb-5">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setCategory("");
                      setCustomIncomeCategory("");
                      if (t === "income") setDescription("");
                    }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                      type === t
                        ? t === "expense"
                          ? "bg-card shadow-sm text-foreground"
                          : "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full mt-2 bg-secondary/60 border border-border rounded-lg px-4 py-3 text-2xl font-display font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                />
              </div>

              {type === "expense" && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was this for?"
                    className="w-full mt-2 bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                  />
                </div>
              )}

              {type === "income" && category === "custom" && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Custom income category</label>
                  <input
                    type="text"
                    value={customIncomeCategory}
                    onChange={(e) => setCustomIncomeCategory(e.target.value)}
                    placeholder="e.g. Bonus, Commission"
                    className="w-full mt-2 bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split("T")[0]}
                  min="2000-01-01"
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-2 bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                />
              </div>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id === "custom" ? "custom" : cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        category === (cat.id === "custom" ? "custom" : cat.name)
                          ? "ring-2 ring-primary bg-primary/20 text-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
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
                className="w-full py-3.5 rounded-lg gradient-primary text-white font-medium text-sm shadow-lg shadow-[hsl(217_91%_60%/0.2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {addTransaction.isPending ? "Adding..." : `Add ${type === "income" ? "Income" : "Expense"}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
