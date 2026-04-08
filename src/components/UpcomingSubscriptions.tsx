import { useRecurringTransactions, useCategories } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";
import { CopyIcon } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

export default function UpcomingSubscriptions() {
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
    .slice(0, 4);

  const getCat = (name: string) => categories.find((c) => c.name === name);

  return (
    <div className="bg-background border border-muted/40 p-8 rounded-[2.5rem] shadow-sm flex flex-col w-full group relative overflow-hidden h-full min-h-[320px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[80px] rounded-full translate-x-10 -translate-y-10" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="font-headline font-extrabold text-xl tracking-tight text-foreground uppercase">Capital Commitments</h3>
          <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">Pending Subscriptions</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10 flex-1">
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full pt-4">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
              <CopyIcon className="w-5 h-5 text-muted-foreground opacity-50" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">No Subscriptions Detected</p>
            <p className="text-[10px] font-label text-muted-foreground/60 uppercase tracking-widest mt-1">Initialize recurring schemas</p>
          </div>
        ) : (
          upcoming.map((bill) => {
            const isDueToday = isToday(bill.parsedDate);
            const cat = getCat(bill.category);

          return (
            <div key={bill.id} className="flex items-center justify-between py-2 border-b border-muted/20 last:border-0 hover:bg-muted/10 transition-colors p-3 rounded-2xl mx-[-12px]">
              <div className="flex items-center gap-4">
                 <div 
                   className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                   style={{ backgroundColor: `${cat?.color || "#6B7280"}15`, color: cat?.color || "#6B7280" }}
                 >
                   {cat?.icon || <CopyIcon className="w-5 h-5" />}
                 </div>
                 <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{bill.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isDueToday ? 'bg-destructive/80' : 'bg-muted-foreground/40'}`} />
                      <p className={`text-[10px] font-label font-bold uppercase tracking-widest ${isDueToday ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isDueToday ? "Due Today" : format(bill.parsedDate, "MMM dd")}
                      </p>
                    </div>
                 </div>
              </div>
              <div className="text-right pl-3">
                <p className="text-[13px] font-headline font-black text-foreground">
                  -{formatCurrency(bill.amount)}
                </p>
                <p className="text-[9px] font-label text-muted-foreground uppercase tracking-widest mt-1.5 opacity-60">
                  {bill.frequency.toUpperCase()}
                </p>
              </div>
            </div>
          );
        })
      )}
      </div>
      
      <button className="w-full mt-6 py-4 rounded-2xl bg-muted/30 border border-muted/50 text-[10px] font-label font-bold text-foreground uppercase tracking-widest hover:bg-muted/60 transition-all z-10 relative">
          Manage Obligations
      </button>
    </div>
  );
}
