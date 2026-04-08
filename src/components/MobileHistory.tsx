import { useMemo } from "react";
import { useTransactions, useMonthlyTransactions, useCategories } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Settings2, Search } from "lucide-react";

interface Props {
  searchQuery?: string;
  categoryFilter?: string;
  setCategoryFilter?: (val: string) => void;
}

export default function MobileHistory({ searchQuery, categoryFilter, setCategoryFilter }: Props) {
  const { data: transactions = [] } = useTransactions();
  const { data: monthlyTransactions = [] } = useMonthlyTransactions();
  const { data: categories = [] } = useCategories();

  // Filter transactions based on props
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesCategory = !categoryFilter || tx.category === categoryFilter;
      const matchesSearch = !searchQuery || 
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [transactions, categoryFilter, searchQuery]);

  // Group by date
  const groupedDates = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    filteredTransactions.forEach(tx => {
      const date = parseISO(tx.date);
      let dateLabel = format(date, "dd MMM");
      if (isToday(date)) dateLabel = "Today";
      else if (isYesterday(date)) dateLabel = "Yesterday";

      // Actually, we should store pure ISO strings and sort later, but let's just use the original order 
      // since the transactions array is already mostly sorted desc by date, so unique labels naturally appear in order.
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const monthlyVelocity = useMemo(() => {
    return monthlyTransactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
  }, [monthlyTransactions]);

  const getCat = (name: string) => categories.find((c) => c.name === name);

  return (
    <div className="pb-28">
      {/* Dynamic Search/Filter Mobile Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="flex-1 bg-muted/40 rounded-2xl flex items-center px-4 py-3 border border-muted/20">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <input 
            type="text" 
            placeholder="Search ledger..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground font-medium"
            onChange={(e) => {
              // We'd typically pass a setSearchQuery, but the parent manages the global searchQuery.
              // Assuming that if searchQuery prop is present, we either just render it or depend on the parent.
            }}
            value={searchQuery || ""}
            readOnly
          />
        </div>
        <button className="bg-muted/40 p-3.5 rounded-2xl border border-muted/20 flex items-center justify-center">
          <Settings2 className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="space-y-8 px-2">
        {Object.entries(groupedDates).map(([dateLabel, txs], groupIndex) => {
          // get a real formatted date if the label is Today or Yesterday
          const firstTxDate = txs[0] ? parseISO(txs[0].date) : new Date();
          const subtitleDate = (dateLabel === "Today" || dateLabel === "Yesterday") 
                ? format(firstTxDate, "dd MMM").toUpperCase() 
                : "";

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              key={dateLabel} 
              className="space-y-4"
            >
              <div className="flex items-end justify-between px-1">
                <h3 className="font-headline font-black text-xl tracking-tight leading-none text-foreground">
                  {dateLabel}
                </h3>
                {subtitleDate && (
                  <span className="text-[9px] font-label font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
                    {subtitleDate}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {txs.map((tx, i) => {
                  const cat = getCat(tx.category);
                  const isExpense = tx.type === "expense";
                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-[1.25rem] bg-background hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-xl shrink-0" 
                          style={{ backgroundColor: `${cat?.color || "#6B7280"}15`, color: cat?.color || "#6B7280" }}
                        >
                          {cat?.icon || "📦"}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold tracking-tight text-foreground leading-tight">
                            {tx.description}
                          </p>
                          <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {cat?.name || tx.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-base font-black tracking-tight ${isExpense ? "text-foreground" : "text-emerald-500"}`}>
                          {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[10px] font-label font-medium text-muted-foreground uppercase tracking-widest mt-1">
                          {format(parseISO(tx.date), "HH:mm aaa")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs font-label font-bold text-muted-foreground uppercase tracking-widest">
              No transactions to display
            </p>
          </div>
        )}
      </div>

      {/* Monthly Velocity Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 mx-2 bg-[#020617] dark:bg-[#020617] rounded-[2rem] p-6 text-white shadow-xl border border-muted/5 relative overflow-hidden"
      >
        <p className="text-[9px] font-label font-bold uppercase tracking-widest opacity-60 mb-2">Monthly Velocity</p>
        <div className="flex items-end gap-3 mb-6">
          <h2 className="text-4xl font-headline font-black tracking-tighter">
            {formatCurrency(monthlyVelocity)}
          </h2>
          {/* Mock trend metric inline to mimic image realistically */}
          <span className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            12%
          </span>
        </div>
        
        {/* Simple mock velocity bar */}
        <div className="flex gap-2">
            <div className="h-1.5 rounded-full bg-blue-500 flex-1" />
            <div className="h-1.5 rounded-full bg-blue-500/20 w-8" />
            <div className="h-1.5 rounded-full bg-emerald-500/40 w-16 ml-auto" />
        </div>
      </motion.div>
    </div>
  );
}
