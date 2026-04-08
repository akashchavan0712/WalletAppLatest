import { useState, useMemo } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useTransactions, useCategories } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MobileCalendar() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Date Calculators
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Optional: Start calendar from first day of week. Example screenshot shows it starts exactly aligned maybe. 
  // Let's use standard grid with startOfWeek.
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start to match UI ("MON TUE...")
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { dailyActivity, totalSpend } = useMemo(() => {
    const daily: Record<string, { count: number, txs: typeof transactions }> = {};
    let spend = 0;

    transactions.forEach(tx => {
      const txDate = parseISO(tx.date);
      const dateKey = format(txDate, "yyyy-MM-dd");
      
      if (!daily[dateKey]) daily[dateKey] = { count: 0, txs: [] };
      daily[dateKey].count += 1;
      daily[dateKey].txs.push(tx);
      
      if (tx.type === "expense" && isSameMonth(txDate, currentMonth)) {
        spend += tx.amount;
      }
    });

    return { dailyActivity: daily, totalSpend: spend };
  }, [transactions, currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const selectedDateKey = format(selectedDay, "yyyy-MM-dd");
  const selectedDayTransactions = dailyActivity[selectedDateKey]?.txs || [];
  
  const getCat = (name: string) => categories.find((c) => c.name === name);

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="flex items-start justify-between px-2 mb-6">
        <div>
          <h1 className="text-4xl font-headline font-black text-foreground tracking-tighter">
            {format(currentMonth, "MMMM")}
          </h1>
          <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Total Spend: {formatCurrency(totalSpend)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-xl bg-muted/40 border border-muted/20 flex items-center justify-center hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button 
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl bg-muted/40 border border-muted/20 flex items-center justify-center hover:bg-muted/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Box */}
      <div className="mx-2 bg-[#020617] dark:bg-[#020617] rounded-[2rem] p-5 shadow-xl border border-muted/5 mb-8">
        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-4">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
            <div key={d} className="text-center text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              {d}
            </div>
          ))}
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-7 gap-y-3">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const activity = dailyActivity[dateKey];
            const isSelected = isSameDay(day, selectedDay);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            // To mimic the screenshot, maybe multiple dots if lots of transactions?
            // Let's do max 2 dots.
            const dotCount = activity?.count ? Math.min(activity.count, 2) : 0;

            return (
              <button 
                key={dateKey}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center justify-center h-12 w-full rounded-xl transition-all ${
                  !isCurrentMonth ? "opacity-20 pointer-events-none" : "opacity-100"
                } ${isSelected ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : "text-white"}`}
              >
                <span className={`text-[13px] font-headline font-black ${isSelected ? "opacity-100" : "opacity-90"}`}>
                  {format(day, "d")}
                </span>
                
                {/* Dots indicator */}
                {dotCount > 0 && !isSelected && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                     {Array.from({ length: dotCount }).map((_, idx) => (
                       <div key={idx} className="w-1 h-1 rounded-full bg-blue-500" />
                     ))}
                  </div>
                )}
                {dotCount > 0 && isSelected && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {Array.from({ length: dotCount }).map((_, idx) => (
                       <div key={idx} className="w-1 h-1 rounded-full bg-white" />
                     ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda Header */}
      <div className="flex items-center justify-between px-3 mb-4">
        <h3 className="text-xl font-headline font-black text-foreground tracking-tight">
          {format(selectedDay, "MMMM d")}
        </h3>
        <span className="px-3 py-1.5 rounded-full bg-muted/40 border border-muted/20 text-[9px] font-label font-bold text-muted-foreground uppercase tracking-widest">
          {selectedDayTransactions.length} Transactions
        </span>
      </div>

      {/* Agenda List */}
      <div className="space-y-1 px-2">
        {selectedDayTransactions.length === 0 ? (
           <div className="text-center py-8">
              <p className="text-xs font-label font-bold text-muted-foreground opacity-50 uppercase tracking-widest">No transactions on this date</p>
           </div>
        ) : (
          selectedDayTransactions.map((tx) => {
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
          })
        )}
      </div>
    </div>
  );
}
