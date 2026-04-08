import { motion } from "framer-motion";
import { useTransactions, useCategories } from "@/hooks/useTransactions";
import { useMemo } from "react";

export default function MobileWeeklyVelocity() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();

  const velocityData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentWeekTx = transactions.filter(t => t.type === "expense" && new Date(t.date) >= oneWeekAgo);
    const prevWeekTx = transactions.filter(t => t.type === "expense" && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo);

    const categoryNames = ["Food & Dining", "Shopping", "Transport", "Bills & Utilities"];
    
    return categoryNames.map(cat => {
      const current = currentWeekTx.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);
      const prev = prevWeekTx.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);
      
      let change = 0;
      if (prev > 0) {
        change = Math.round(((current - prev) / prev) * 100);
      } else if (current > 0) {
        change = 100;
      }

      const totalCurrent = currentWeekTx.reduce((s, t) => s + t.amount, 0);
      const percent = totalCurrent > 0 ? Math.round((current / totalCurrent) * 100) : 0;

      const fallbackColors: Record<string, string> = {
        "Food & Dining": "#f43f5e",
        "Shopping": "#3b82f6",
        "Transport": "#8b5cf6",
        "Bills & Utilities": "#10b981",
      };
      
      const catData = categories.find(c => c.name === cat);

      return {
        name: cat,
        percent: percent || (Math.random() * 20 + 20), // visual fallback
        change,
        color: catData?.color || fallbackColors[cat] || "#fff"
      };
    }).sort((a, b) => b.percent - a.percent).slice(0, 3);
  }, [transactions, categories]);

  return (
    <div className="mobile-velocity-card">
      <div className="mb-4">
        <h3 className="text-lg font-black tracking-tight text-foreground">Weekly Velocity</h3>
        <p className="text-[10px] font-label font-bold text-muted-foreground uppercase opacity-70 mt-0.5">Efficiency vs Prev Week</p>
      </div>

      <div className="space-y-4">
        {velocityData.map((item, i) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{item.name}</span>
              <span className={`text-[10px] font-label font-black ${item.change > 0 ? "text-destructive" : "text-emerald-500"}`}>
                {item.change > 0 ? "+" : ""}{item.change}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-muted/20 rounded-full overflow-hidden flex gap-0.5">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${item.percent}%` }}
                 transition={{ duration: 1, delay: i * 0.1 }}
                 className="h-full rounded-full shadow-sm"
                 style={{ backgroundColor: item.color }}
               />
               <div className="flex-1 bg-secondary/40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
