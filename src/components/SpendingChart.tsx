import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTransactions, useCategories } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/data";

export default function SpendingChart() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const expenses = transactions.filter((t) => t.type === "expense");
  const byCategory: Record<string, number> = {};
  expenses.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const getCat = (name: string) => categories.find((c) => c.name === name);

  const data = Object.entries(byCategory)
    .map(([name, value]) => {
      const cat = getCat(name);
      return { name, value, color: cat?.color || "#6B7280", icon: cat?.icon || "📦" };
    })
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-4">Spending Breakdown</h3>
        <div className="text-center py-8">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm font-medium text-foreground mb-1">No expenses to show yet</p>
          <p className="text-xs text-muted-foreground">Add your first expense to see the breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-semibold text-sm text-foreground mb-4">Spending Breakdown</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-48 h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="font-display font-bold text-lg text-foreground">{formatCurrency(total)}</p>
          </div>
        </div>
        <div className="flex-1 space-y-3 w-full">
          {data.slice(0, 5).map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-base">{d.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground font-medium truncate">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(d.value)}</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
