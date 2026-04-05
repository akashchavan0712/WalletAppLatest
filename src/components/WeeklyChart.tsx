import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/data";
import { useTransactions } from "@/hooks/useTransactions";
import { startOfWeek, addDays, format } from "date-fns";

export default function WeeklyChart() {
  const { data: transactions = [] } = useTransactions();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const data = days.map((day, i) => {
    const dayDate = addDays(weekStart, i);
    const dayStr = format(dayDate, "yyyy-MM-dd");
    const amount = transactions
      .filter((t) => t.type === "expense" && t.date === dayStr)
      .reduce((s, t) => s + t.amount, 0);
    return { day, amount };
  });

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-semibold text-sm text-foreground mb-4">This Week</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
              cursor={{ fill: "hsl(var(--secondary) / 0.5)" }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="hsl(217 91% 60%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
