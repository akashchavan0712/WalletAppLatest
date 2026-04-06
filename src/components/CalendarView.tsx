import { useState, useMemo } from "react";
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import { motion } from "framer-motion";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import TransactionList from "./TransactionList";

export default function CalendarView() {
  const { data: transactions = [] } = useTransactions();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Derived values for summaries
  const { dailyTotal, weeklyTotal, monthlyTotal, filteredTransactions } = useMemo(() => {
    let dTotal = 0;
    let wTotal = 0;
    let mTotal = 0;
    const filtered = [];

    const startOfWk = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const endOfWk = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const startOfMo = startOfMonth(currentMonth);
    const endOfMo = endOfMonth(currentMonth);

    for (const tx of transactions) {
      if (tx.type !== "expense") continue;

      const txDate = parseISO(tx.date);

      // Daily
      if (isSameDay(txDate, selectedDate)) {
        dTotal += tx.amount;
        filtered.push(tx);
      }

      // Weekly
      if (txDate >= startOfWk && txDate <= endOfWk) {
        wTotal += tx.amount;
      }

      // Monthly
      if (txDate >= startOfMo && txDate <= endOfMo) {
        mTotal += tx.amount;
      }
    }

    return {
      dailyTotal: dTotal,
      weeklyTotal: wTotal,
      monthlyTotal: mTotal,
      filteredTransactions: filtered,
    };
  }, [transactions, selectedDate, currentMonth]);

  // Modifiers for the calendar to show which days have transactions
  const daysWithTransactions = useMemo(() => {
    const days = new Set<string>();
    transactions.forEach(tx => {
      if (tx.type === "expense") {
        days.add(tx.date);
      }
    });
    return Array.from(days).map(d => parseISO(d));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-foreground">Calendar</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 flex justify-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(day) => day && setSelectedDate(day)}
              onMonthChange={setCurrentMonth}
              modifiers={{ hasTransaction: daysWithTransactions }}
              modifiersStyles={{
                hasTransaction: { 
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(var(--primary))'
                }
              }}
              className="bg-transparent"
            />
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm text-foreground">Spending Summary</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Selected Day ({format(selectedDate, "MMM d")})</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(dailyTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">This Week</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(weeklyTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">This Month ({format(currentMonth, "MMMM")})</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">
                Transactions for {format(selectedDate, "MMMM d, yyyy")}
              </h3>
            </div>
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-border">
                {/* We just manually render the list for this specific date */}
                {filteredTransactions.map((tx, i) => (
                  <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      🪙
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
             <div className="p-8 text-center">
               <p className="text-sm text-muted-foreground">No expenses on this day.</p>
             </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
