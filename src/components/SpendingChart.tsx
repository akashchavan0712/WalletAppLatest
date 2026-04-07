import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatCurrency } from "@/lib/data";

const data = [
  { date: "OCT 01", amount: 4200 },
  { date: "", amount: 3800 },
  { date: "", amount: 6100 },
  { date: "", amount: 5900 },
  { date: "OCT 15", amount: 2100 },
  { date: "", amount: 4800 },
  { date: "", amount: 3900 },
  { date: "", amount: 6800 },
  { date: "", amount: 5200 },
  { date: "TODAY", amount: 2800 },
];

export default function SpendingChart() {
  // Add a ghostAmount to every data point for the background bar slots
  const chartData = data.map(d => ({ ...d, ghostAmount: 8500 }));

  return (
    <div className="bg-background border border-muted/40 p-8 lg:p-10 rounded-[3rem] shadow-sm flex flex-col h-[460px] w-full relative group">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-headline font-extrabold text-xl tracking-tight text-foreground">Spending Trajectory</h3>
          <p className="text-xs font-label text-muted-foreground mt-1">Daily expense distribution over 30 days</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-label font-bold text-foreground">LIVE</span>
            </div>
            <button className="bg-muted px-4 py-2 rounded-xl text-[10px] font-label font-bold uppercase tracking-widest flex items-center gap-2 border border-muted/50 hover:bg-muted/80 transition-colors">
            Last 30 Days
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
            <YAxis hide domain={[0, 9000]} />
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

      <div className="grid grid-cols-2 mt-6 pt-4 border-t border-muted/30">
          <div className="flex flex-col">
              <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest">Expected Surge</span>
              <span className="text-lg font-headline font-black text-foreground">Oct 28</span>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest">Accuracy</span>
              <span className="text-lg font-headline font-black text-[hsl(161_100%_21%)]">94.2%</span>
          </div>
      </div>
    </div>
  );
}
