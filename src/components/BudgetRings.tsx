import { formatCurrency } from "@/lib/data";
import { useTransactions, useCategories, useUpdateCategory } from "@/hooks/useTransactions";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function BudgetRings() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const updateCategory = useUpdateCategory();

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
    .slice(0, 3);

  // Quick Start Templates for empty states
  const quickStartTemplates = [
    { name: "Housing", budget: 30000, icon: "🏠" },
    { name: "Food & Dining", budget: 15000, icon: "🍕" },
    { name: "Investments", budget: 20000, icon: "📈" }
  ];

  const handleQuickStart = (name: string, budget: number) => {
    const cat = categories.find(c => c.name === name);
    if (cat) {
        updateCategory.mutate({ id: cat.id, budget }, {
            onSuccess: () => toast.success(`Objective set for ${name}`),
            onError: (e) => toast.error(e.message)
        });
    }
  };

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-10">
        <div>
            <h3 className="font-headline font-black text-2xl tracking-tighter text-foreground uppercase">Fiscal Thresholds</h3>
            <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">Real-time Budget Monitoring</p>
        </div>
        <button className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.2em] border-b border-primary/20 hover:border-primary transition-all">Intelligence Dashboard</button>
      </div>
      
      {budgets.length === 0 ? (
        <div className="space-y-8">
            <div className="p-8 bg-muted/5 border border-dashed border-muted/20 rounded-[2.5rem] text-center">
                <ShieldCheck className="w-10 h-10 text-muted-foreground opacity-20 mx-auto mb-4" />
                <p className="text-[11px] font-label font-bold text-muted-foreground uppercase tracking-widest">No Active Thresholds Detected</p>
                <p className="text-[11px] text-muted-foreground/50 mt-2">Initialize a threshold logic to prevent capital leakage.</p>
            </div>
            
            <div className="space-y-4">
                <p className="text-[9px] font-label font-black text-foreground uppercase tracking-[0.3em] mb-2 px-1">Quick Start Templates</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickStartTemplates.map((t, i) => (
                        <motion.button
                            key={t.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => handleQuickStart(t.name, t.budget)}
                            className="p-5 bg-[#0f172a]/20 border border-muted/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-[#0f172a]/40 transition-all border-b-2 hover:border-primary/40 shadow-sm"
                        >
                            <span className="text-2xl">{t.icon}</span>
                            <div className="text-center">
                                <p className="text-[11px] font-headline font-black text-foreground">{t.name}</p>
                                <p className="text-[10px] font-label font-bold text-primary tracking-tighter opacity-70 mt-0.5">{formatCurrency(t.budget)}/mo</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
          {budgets.map((b, i) => {
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (b.percent / 100) * circumference;
            const isOver = b.percent >= 90;

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-6 relative"
              >
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted)/0.05)" strokeWidth="10" />
                    <motion.circle
                      cx="50" cy="50" r={radius} fill="none"
                      stroke={b.color}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={circumference} 
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.1 + 0.3 }}
                      style={{ filter: `drop-shadow(0 0 4px ${b.color}20)` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-headline font-black text-3xl tracking-tighter text-foreground">{Math.round(b.percent)}%</span>
                    <div className="w-2 h-0.5 bg-muted/20 my-1 rounded-full" />
                    <span className="text-[9px] font-label font-bold uppercase tracking-widest text-muted-foreground opacity-60 text-center px-4 truncate max-w-[100px]">{b.name}</span>
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                   <p className="text-sm font-headline font-black text-foreground tracking-tight">{formatCurrency(b.spent)}</p>
                   <p className="text-[9px] font-label font-bold text-muted-foreground uppercase tracking-widest opacity-40">Limit: {formatCurrency(b.budget!)}</p>
                </div>
                
                {isOver && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-glow"
                    >
                        <Zap className="w-3 h-3 fill-current" />
                    </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Decorative gradient blur */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 blur-[80px] rounded-full" />
    </div>
  );
}
