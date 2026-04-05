import { motion } from "framer-motion";
import { useTransactions, useCategories, useDeleteTransaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  limit?: number;
  showHeader?: boolean;
}

export default function TransactionList({ limit, showHeader = true }: Props) {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const deleteTransaction = useDeleteTransaction();
  const { setActiveTab } = useAppStore();
  const list = limit ? transactions.slice(0, limit) : transactions;

  const getCat = (name: string) => categories.find((c) => c.name === name);

  if (isLoading) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="mt-3">Loading transactions...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-3xl mb-2">💸</p>
        <p className="text-sm font-medium text-foreground mb-1">No transactions yet</p>
        <p className="text-xs text-muted-foreground">Click "Add Transaction" to get started</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-xs text-primary font-medium hover:underline"
          >
            View All
          </button>
        </div>
      )}
      <div className="divide-y divide-border">
        {list.map((tx, i) => {
          const cat = getCat(tx.category);
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${cat?.color || "#6B7280"}20` }}
              >
                {cat?.icon || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{cat?.name || tx.category} · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <p className={`text-sm font-semibold flex items-center gap-1 ${
                  tx.type === "income" ? "text-income" : "text-foreground"
                }`}>
                  {tx.type === "income" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 text-expense" />}
                  {formatCurrency(tx.amount)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTransaction.mutate(tx.id, {
                      onSuccess: () => toast.success("Transaction deleted"),
                      onError: (err) => toast.error(err.message),
                    });
                  }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Delete transaction"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
