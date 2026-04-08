import { useRecurringTransactions, useCategories } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { CopyIcon } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { motion } from "framer-motion";

export default function MobileCapitalCommitments() {
  const { data: recurring = [], isLoading } = useRecurringTransactions();
  const { data: categories = [] } = useCategories();

  if (isLoading) return null;

  const upcoming = recurring
    .filter((tx) => tx.type === "expense")
    .map((tx) => ({
      ...tx,
      parsedDate: parseISO(tx.next_due_date),
    }))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
    .slice(0, 3); // top 3 for mobile

  const getCat = (name: string) => categories.find((c) => c.name === name);

  return (
    <div className="mobile-commitments-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-foreground leading-tight">Capital Commitments</h3>
          <p className="text-[10px] font-label font-bold text-muted-foreground uppercase opacity-70 mt-0.5">Pending Subscriptions</p>
        </div>
      </div>

      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-2">
              <CopyIcon className="w-4 h-4 text-muted-foreground opacity-50" />
            </div>
            <p className="text-xs font-bold text-muted-foreground">No Subscriptions Detected</p>
          </div>
        ) : (
          upcoming.map((bill) => {
            const isDueToday = isToday(bill.parsedDate);
            const cat = getCat(bill.category);

            return (
              <div key={bill.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#0f172a]/40 border border-muted/10 shadow-[inset_0_1px_0_hsl(var(--muted)/0.1)]">
                <div className="flex items-center gap-3">
                   <div 
                     className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                     style={{ backgroundColor: `${cat?.color || "#6B7280"}20`, color: cat?.color || "#6B7280" }}
                   >
                     {cat?.icon || <CopyIcon className="w-4 h-4" />}
                   </div>
                   <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{bill.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isDueToday ? 'bg-rose-500' : 'bg-muted-foreground/30'}`} />
                        <p className={`text-[9px] font-label font-bold uppercase tracking-wider ${isDueToday ? 'text-rose-500' : 'text-muted-foreground'}`}>
                          {isDueToday ? "Due Today" : format(bill.parsedDate, "MMM dd")}
                        </p>
                      </div>
                   </div>
                </div>
                <div className="text-right pl-2">
                  <p className="text-sm font-headline font-black text-foreground">
                    -{formatCurrency(bill.amount)}
                  </p>
                  <p className="text-[8px] font-label font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                    {bill.frequency}
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
