import { useState, useMemo } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, Zap, Clock, ShieldCheck } from "lucide-react";

export default function CalendarView() {
  const { data: transactions = [] } = useTransactions();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Date Calculation Helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Data Aggregation logic - optimized for high-fidelity ledger
  const { dailyData, monthlyStats, topCategories, taxDeductibleCount } = useMemo(() => {
    const daily: Record<string, { income: number; expense: number; labels: string[] }> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    const categories: Record<string, number> = {};

    transactions.forEach(tx => {
      const txDate = parseISO(tx.date);
      const dateKey = format(txDate, "yyyy-MM-dd");
      
      if (!daily[dateKey]) daily[dateKey] = { income: 0, expense: 0, labels: [] };
      
      if (tx.type === "income") {
        daily[dateKey].income += tx.amount;
        if (isSameMonth(txDate, currentMonth)) totalIncome += tx.amount;
      } else {
        daily[dateKey].expense += tx.amount;
        if (isSameMonth(txDate, currentMonth)) {
          totalExpense += tx.amount;
          categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
        }
        // Data-driven labels
        if (tx.description.toLowerCase().includes("rent")) {
          if (!daily[dateKey].labels.includes("RENT DAY")) daily[dateKey].labels.push("RENT DAY");
        }
      }
    });

    const sortedCats = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    // Dynamic Insight: Tax deductible candidates (donation, charity, medical)
    const taxCount = transactions.filter(tx => 
      isSameMonth(parseISO(tx.date), currentMonth) && 
      (tx.description.toLowerCase().includes("donat") || 
       tx.description.toLowerCase().includes("charity") || 
       tx.description.toLowerCase().includes("medical"))
    ).length;

    return { 
      dailyData: daily, 
      monthlyStats: { income: totalIncome, expense: totalExpense },
      topCategories: sortedCats,
      taxDeductibleCount: taxCount
    };
  }, [transactions, currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <p className="text-[10px] font-label text-muted-foreground uppercase tracking-[0.3em] mb-2">Monthly Ledger</p>
           <h1 className="text-5xl font-headline font-black text-foreground tracking-tighter">Financial Velocity</h1>
           <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-2">{format(currentMonth, "MMMM yyyy")} • Visualization Horizon</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-6 bg-muted/40 p-1 rounded-2xl border border-muted/20">
            <button onClick={handlePrevMonth} className="p-3 hover:bg-background rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-headline font-black text-sm uppercase tracking-tighter min-w-[120px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
            <button onClick={handleNextMonth} className="p-3 hover:bg-background rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-3 bg-background border border-muted/40 rounded-[2.5rem] overflow-hidden shadow-sm shadow-muted/10">
           {/* Weekday Headers */}
           <div className="grid grid-cols-7 border-b border-muted/20 bg-muted/10">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                    <div key={d} className="py-4 text-center text-[10px] font-label font-bold text-muted-foreground tracking-widest">{d}</div>
                ))}
           </div>
           
           {/* Days Grid */}
           <div className="grid grid-cols-7 grid-rows-5 no-scrollbar overflow-y-auto">
                {days.map((day, i) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const data = dailyData[dateKey];
                    const isSelected = isSameDay(day, selectedDay);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                        <motion.div 
                            key={dateKey}
                            onClick={() => setSelectedDay(day)}
                            whileHover={{ scale: 0.99 }}
                            className={`min-h-[140px] border-r border-b border-muted/10 p-3 flex flex-col gap-2 transition-colors cursor-pointer relative ${
                                isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20 z-10" : "hover:bg-muted/30"
                            } ${!isCurrentMonth ? "opacity-20" : ""}`}
                        >
                            <span className={`text-xs font-headline font-black ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                                {format(day, "dd")}
                            </span>
                            
                            {/* Daily Summaries (Pills) */}
                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                {data?.income > 0 && (
                                    <div className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] font-bold tracking-tighter truncate border border-emerald-500/10">
                                        +{formatCurrency(data.income)}
                                    </div>
                                )}
                                {data?.expense > 0 && (
                                    <div className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[9px] font-bold tracking-tighter truncate border border-amber-500/10">
                                        -{formatCurrency(data.expense)}
                                    </div>
                                )}
                                {data?.labels.map(l => (
                                    <div key={l} className="text-[8px] font-label font-black text-rose-500 uppercase tracking-tighter mt-1 italic">
                                        • {l}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Hover highlight for expansion */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div layoutId="day-highlight" className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
           </div>
        </div>

        {/* Outlook Sidebar */}
        <div className="space-y-10">
            {/* Monthly Net Card */}
            <div className="bg-[#0f172a] dark:bg-[#020617] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] opacity-40 mb-2">{format(currentMonth, "MMMM")} Net Velocity</p>
                <h3 className="text-4xl font-headline font-black tracking-tighter mb-8">
                    {formatCurrency(monthlyStats.income - monthlyStats.expense)}
                </h3>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow shadow-emerald-500/50" />
                            <span className="text-[10px] font-label text-white/60 uppercase tracking-widest">Inflow Velocity</span>
                        </div>
                        <span className="text-sm font-headline font-bold">+{formatCurrency(monthlyStats.income)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-glow" />
                            <span className="text-[10px] font-label text-white/60 uppercase tracking-widest">Burn Rate</span>
                        </div>
                        <span className="text-sm font-headline font-bold">-{formatCurrency(monthlyStats.expense)}</span>
                    </div>
                </div>

                <p className="text-[10px] font-label italic opacity-40 leading-relaxed mt-10 border-t border-white/10 pt-6">
                    "This represents your net capital velocity for the selected month. Strive for positive surplus to accelerate compounding."
                </p>
                
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full translate-x-10 -translate-y-10" />
            </div>

            {/* Top Expenditures */}
            <div className="space-y-6">
                <h4 className="font-headline font-black text-lg tracking-tight uppercase">Concentrated Spend</h4>
                <div className="space-y-5">
                    {topCategories.map(([name, amount]) => {
                        const percentage = monthlyStats.expense > 0 ? (amount / monthlyStats.expense) * 100 : 0;
                        return (
                            <div key={name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-label font-bold text-foreground uppercase tracking-widest">{name}</span>
                                    <span className="text-[10px] font-headline font-black">{formatCurrency(amount)}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }} 
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-foreground" 
                                    />
                                </div>
                            </div>
                        );
                    })}
                    <button className="w-full py-4 border border-muted/50 rounded-2xl text-[10px] font-label font-bold uppercase tracking-widest hover:bg-muted/30 transition-all mt-4">
                        Export Monthly Ledger
                    </button>
                </div>
            </div>

            {/* Insight Card */}
            <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-lg">
                    <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-label font-black text-foreground uppercase tracking-widest">Tax-Deductible Events</p>
                   <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                     {taxDeductibleCount > 0 
                       ? `Found ${taxDeductibleCount} transactions in ${format(currentMonth, "MMMM")} potentially eligible for deduction.`
                       : `No tax-deductible candidates identified in ${format(currentMonth, "MMMM")}.`}
                   </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
