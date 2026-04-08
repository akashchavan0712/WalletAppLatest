import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatCurrency } from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import { useMemo } from "react";

interface Props {
  daysToDisplay?: number;
}

export default function SpendingChart({ daysToDisplay = 15 }: Props) {
  const { data: transactions = [] } = useTransactions();

  const chartData = useMemo(() => {
    const timeFrameDays = Array.from({ length: daysToDisplay }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - ((daysToDisplay - 1) - i));
      return d.toISOString().split("T")[0];
    });

    const grouped = transactions
      .filter(t => t.type === "expense")
      .reduce((acc: Record<string, number>, t) => {
        const date = t.date.split("T")[0];
        acc[date] = (acc[date] || 0) + t.amount;
        return acc;
      }, {});

    return timeFrameDays.map(date => {
      const d = new Date(date);
      const isToday = date === new Date().toISOString().split("T")[0];
      const label = isToday ? "TODAY" : d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
      
      return {
        date: label,
        amount: grouped[date] || 0,
        ghostAmount: 8500 // Still using this for background bar height
      };
    });
  }, [transactions]);

  const stats = useMemo(() => {
    // Simple logic for "Accuracy" and "Next Surge"
    // In a real app, this would be an AI prediction
    const hasData = transactions.length > 5;
    return {
      accuracy: hasData ? "94.2%" : "N/A",
      surgeDate: hasData ? "Oct 28" : "Pending Data"
    };
  }, [transactions]);

  return (
    <div className="bg-background border border-muted/40 p-5 lg:p-10 rounded-[2rem] lg:rounded-[3rem] shadow-sm flex flex-col h-[300px] lg:h-[380px] w-full relative group">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h3 className="font-headline font-extrabold text-base lg:text-xl tracking-tight text-foreground">Spending Trajectory</h3>
          <p className="text-[10px] lg:text-xs font-label text-muted-foreground mt-0.5 lg:mt-1 hidden lg:block">Daily expense distribution over 15 days</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-label font-bold text-foreground">LIVE</span>
            </div>
            <button className="bg-muted px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] font-label font-bold uppercase tracking-widest flex items-center gap-1.5 lg:gap-2 border border-muted/50 hover:bg-muted/80 transition-colors">
            <span className="hidden lg:inline">Last {daysToDisplay} Days</span>
            <span className="lg:hidden">{daysToDisplay}D</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            </button>
        </div>
      </div>

      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={-48}>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
              dy={10}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-foreground text-background px-3 py-2 rounded-xl shadow-xl text-[10px] font-bold">
                      {formatCurrency(payload[1]?.value as number || 0)}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Ghost Bars (Background Slots) */}
            <Bar 
              dataKey="ghostAmount" 
              fill="hsl(var(--muted)/0.2)"
              radius={[30, 30, 0, 0]}
              barSize={72}
              isAnimationActive={false}
            />
            {/* Active Data Bars */}
            <Bar 
              dataKey="amount" 
              radius={[30, 30, 0, 0]}
              barSize={60}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === chartData.length - 1 ? "#3b82f6" : "hsl(var(--primary)/0.2)"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="hidden lg:grid grid-cols-2 mt-6 pt-4 border-t border-muted/30">
          <div className="flex flex-col">
              <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest">Expected Surge</span>
              <span className="text-lg font-headline font-black text-foreground">{stats.surgeDate}</span>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest">Accuracy</span>
              <span className="text-lg font-headline font-black text-[hsl(161_100%_21%)]">{stats.accuracy}</span>
          </div>
      </div>
    </div>
  );
}
