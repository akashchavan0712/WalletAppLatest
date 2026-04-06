import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactions, useCategories, useDeleteTransaction, useDeleteTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { ArrowDownLeft, ArrowUpRight, Trash2, Pencil, CheckSquare, Square, Check } from "lucide-react";
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
  const deleteTransactions = useDeleteTransactions();
  const { setActiveTab, setEditTransactionId } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const list = limit ? transactions.slice(0, limit) : transactions;

  const getCat = (name: string) => categories.find((c) => c.name === name);

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deleteTransactions.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        toast.success(`${selectedIds.size} transactions deleted`);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === list.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(list.map(t => t.id)));
    }
  };

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
    <div className="glass-card overflow-hidden transition-all duration-300 relative">
      {showHeader ? (
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-xs text-primary font-medium hover:underline"
          >
            View All
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isSelectionMode) {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
            </button>
            
            {isSelectionMode && (
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium text-primary hover:underline transition-colors"
              >
                {selectedIds.size === list.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {isSelectionMode && selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleDeleteSelected}
                disabled={deleteTransactions.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-destructive text-white text-xs font-medium rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteTransactions.isPending ? "Deleting..." : `Delete (${selectedIds.size})`}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
      <div className="divide-y divide-border">
        {list.map((tx, i) => {
          const cat = getCat(tx.category);
          const isSelected = selectedIds.has(tx.id);
          
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-4 p-4 transition-all group ${
                isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
              }`}
            >
              {!showHeader && isSelectionMode && (
                <button
                  onClick={(e) => handleToggleSelect(tx.id, e)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              )}
            
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
              <div className="text-right shrink-0 flex items-center gap-1.5">
                <p className={`text-sm font-semibold flex items-center gap-1 mr-2 ${
                  tx.type === "income" ? "text-income" : "text-foreground"
                }`}>
                  {tx.type === "income" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 text-expense" />}
                  {formatCurrency(tx.amount)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTransactionId(tx.id);
                  }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                  aria-label="Edit transaction"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
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
