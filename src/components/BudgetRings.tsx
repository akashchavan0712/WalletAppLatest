import { formatCurrency } from "@/lib/data";
import { useTransactions, useCategories } from "@/hooks/useTransactions";
import { motion } from "framer-motion";

export default function BudgetRings() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const spent = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const budgets = categories
    .filter((c) => c.budget)
    .map((c) => ({
      ...c,
      spent: spent[c.name] || 0,
      percent: Math.min(((spent[c.name] || 0) / (c.budget || 1)) * 100, 100),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-semibold text-sm text-foreground mb-4">Budget Status</h3>
      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No budgets set yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {budgets.map((b, i) => {
            const radius = 32;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (b.percent / 100) * circumference;
            const isOver = b.percent >= 90;

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary/40 transition-colors"
              >
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(225 13% 15%)" strokeWidth="4" />
                    <circle
                      cx="40" cy="40" r={radius} fill="none"
                      stroke={isOver ? "hsl(0 72% 51%)" : b.color}
                      strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={offset}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg">{b.icon}</span>
                    <span className={`text-[10px] font-bold ${isOver ? "text-[hsl(0_72%_51%)]" : "text-foreground"}`}>
                      {Math.round(b.percent)}%
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center truncate w-full">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatCurrency(b.spent)} / {formatCurrency(b.budget!)}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
