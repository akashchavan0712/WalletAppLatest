import { useRecurringTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { CalendarClock } from "lucide-react";
import { format, parseISO, isAfter, isToday } from "date-fns";

export default function UpcomingBills() {
  const { data: recurring = [], isLoading } = useRecurringTransactions();

  if (isLoading) return null;

  // Assume next_due_date is just a string "YYYY-MM-DD"
  // Let's find the bills that are upcoming or due today
  const upcoming = recurring
    .filter((tx) => tx.type === "expense")
    .map((tx) => ({
      ...tx,
      parsedDate: parseISO(tx.next_due_date),
    }))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
    .slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-4 h-4 text-[hsl(38_92%_50%)]" />
        <h3 className="font-display font-semibold text-sm text-foreground">Upcoming Bills</h3>
      </div>
      <div className="space-y-3">
        {upcoming.map((bill) => {
          const isDueToday = isToday(bill.parsedDate);
          return (
            <div key={bill.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{bill.name}</p>
                <p className={`text-[11px] mt-0.5 ${isDueToday ? 'text-[hsl(0_72%_51%)] font-semibold' : 'text-muted-foreground'}`}>
                  {isDueToday ? "Due Today" : `Due ${format(bill.parsedDate, "MMM d")}`}
                </p>
              </div>
              <div className="text-right pl-3">
                <p className="text-[13px] font-semibold text-foreground">
                  {formatCurrency(bill.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
