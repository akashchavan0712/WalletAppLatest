import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactions, useCategories, useDeleteTransaction, useDeleteTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { Trash2, Pencil, Check, Clock, CalendarDays } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  limit?: number;
  showHeader?: boolean;
  categoryFilter?: string;
  searchQuery?: string;
}

export default function TransactionList({ limit, showHeader = true, categoryFilter, searchQuery }: Props) {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const deleteTransaction = useDeleteTransaction();
  const deleteTransactions = useDeleteTransactions();
  const { setActiveTab, setEditTransactionId } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const filtered = transactions.filter(tx => {
    const matchesCategory = !categoryFilter || tx.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const list = limit ? filtered.slice(0, limit) : filtered;
  const getCat = (name: string) => categories.find((c) => c.name === name);

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
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
    if (selectedIds.size === list.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(list.map(t => t.id)));
  };

  if (isLoading) {
    return (
      <div className="bg-background border border-muted/40 p-12 rounded-[2.5rem] text-center flex flex-col items-center">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-0" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-150" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce delay-300" />
        </div>
        <p className="mt-4 text-xs font-label text-muted-foreground uppercase tracking-widest">Sourcing ledger data...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="bg-background border border-muted/40 p-16 rounded-[2.5rem] text-center">
        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-muted-foreground opacity-50">💸</span>
        </div>
        <h3 className="text-xl font-headline font-black text-foreground mb-2">No Transactions Found</h3>
        <p className="text-xs font-label text-muted-foreground uppercase tracking-widest">Your financial record is currently empty.</p>
      </div>
    );
  }

  return (
    <div className="bg-background border border-muted/40 rounded-[2.5rem] overflow-hidden shadow-sm transition-all relative">
      {/* Header/Controls */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-8 gap-4 ${!showHeader ? 'bg-surface-container-low/50 border-b border-muted/20' : ''}`}>
        <div>
          <h3 className="font-headline font-extrabold text-xl tracking-tight text-foreground">
            {showHeader ? "Recent History" : "Fiscal Ledger"}
          </h3>
          {!showHeader && <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">Found {list.length} transactions</p>}
        </div>
        
        <div className="flex items-center gap-3">
          {!showHeader && (
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className="px-4 py-2 bg-background border border-muted/40 rounded-xl text-[10px] font-label font-bold uppercase tracking-widest text-foreground hover:bg-muted transition-all shadow-sm"
            >
              {isSelectionMode ? "Cancel" : "Bulk Select"}
            </button>
          )}
          
          {showHeader ? (
            <button
              onClick={() => setActiveTab("transactions")}
              className="text-[10px] font-label font-bold text-primary uppercase tracking-widest hover:underline transition-all"
            >
              Details
            </button>
          ) : isSelectionMode && selectedIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-6 py-2 bg-foreground text-background text-[10px] font-label font-bold uppercase rounded-xl hover:opacity-90 transition-all shadow-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIds.size})
            </motion.button>
          )}
        </div>
      </div>

      <div className={`overflow-x-hidden no-scrollbar ${!showHeader ? 'h-full overflow-y-auto' : ''}`}>
        <table className="w-full text-left table-fixed">
          <thead className="sticky top-0 z-20 bg-background shadow-sm">
            <tr className="font-label text-[10px] text-muted-foreground uppercase tracking-[0.2em] bg-surface-container-low/30 backdrop-blur-md">
              {isSelectionMode && (
                <th className="px-6 py-5 w-14 text-center">
                  <button
                    onClick={handleSelectAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      selectedIds.size === list.length ? "bg-primary border-primary" : "border-muted-foreground/30 ring-1 ring-offset-2 ring-offset-background"
                    }`}
                  >
                    {selectedIds.size === list.length && <Check className="w-3 h-3 text-white" />}
                  </button>
                </th>
              )}
              <th className={`py-5 px-6 ${showHeader || !isSelectionMode ? '' : 'pl-0'}`}>Merchant / Entity</th>
              <th className="py-5 px-2 hidden md:table-cell w-[140px]">Category</th>
              <th className="py-5 px-2 hidden lg:table-cell w-[120px]">Status</th>
              <th className="py-5 pr-8 text-right w-[160px]">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/10">
            {list.map((tx, i) => {
              const cat = getCat(tx.category);
              const isSelected = selectedIds.has(tx.id);
              const isCleared = i > 0; 
              
              return (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`hover:bg-muted/30 transition-colors group relative ${isSelected ? "bg-primary/5 shadow-inner" : ""}`}
                >
                  {isSelectionMode && (
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={(e) => handleToggleSelect(tx.id, e)}
                        className={`w-5 h-5 rounded-md border flex mx-auto items-center justify-center shrink-0 transition-all ${
                          isSelected ? "bg-primary border-primary shadow-glow ring-2 ring-primary/20" : "border-muted-foreground/30 bg-background"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    </td>
                  )}
                  <td className={`py-6 px-6 ${showHeader || !isSelectionMode ? '' : 'pl-0'}`}>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: `${cat?.color || "#6B7280"}15` }}
                      >
                        {cat?.icon || "📦"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate leading-tight transition-all group-hover:text-primary">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 opacity-60">
                            <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest leading-none">ID: #{tx.id.slice(0, 8).toUpperCase()}</span>
                            <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <div className="flex items-center gap-1">
                                <CalendarDays className="w-2.5 h-2.5" />
                                <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest leading-none">
                                    {new Date(tx.date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                                </span>
                            </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-2 hidden md:table-cell">
                    <span className="text-[9px] font-label font-black uppercase tracking-widest text-muted-foreground/80 px-2.5 py-1 bg-surface-container-highest/20 rounded-lg border border-outline-variant/10 italic whitespace-nowrap">
                      {cat?.name || tx.category}
                    </span>
                  </td>
                  <td className="py-6 px-2 hidden lg:table-cell">
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <div className={`w-1.5 h-1.5 rounded-full ${isCleared ? 'bg-emerald-500 shadow-glow shadow-emerald-500/40' : 'bg-amber-500 shadow-glow shadow-amber-500/40'}`} />
                        <span className={`text-[9px] font-label font-black uppercase tracking-widest ${isCleared ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {isCleared ? 'Cleared' : 'Verified'}
                        </span>
                    </div>
                  </td>
                  <td className="py-6 pr-8 text-right align-middle">
                    <div className="flex items-center justify-end gap-6 h-full">
                      {/* Actions */}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditTransactionId(tx.id); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-background hover:text-primary hover:shadow-sm transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTransaction.mutate(tx.id, { onSuccess: () => toast.success("Transaction deleted") });
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className={`text-lg font-black font-headline min-w-[100px] tracking-tighter ${
                        tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      }`}>
                        {tx.type === "income" ? "+" : ""}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
