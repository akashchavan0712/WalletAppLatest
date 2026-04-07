import { useState } from "react";
import { formatCurrency } from "@/lib/data";
import { useSavingsGoals, useAddSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/useTransactions";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, TrendingUp, Minus, ShieldCheck, Target, Zap } from "lucide-react";
import { toast } from "sonner";

const goalIcons = ["🎯", "🏠", "✈️", "🚗", "💻", "📱", "💍", "🎓", "🛡️", "🏝️", "🎮", "👶"];
const goalColors = ["#3B82F6", "#10B981", "#8B5CF6", "#F97316", "#EC4899", "#06B6D4", "#EF4444", "#F59E0B"];

function AddGoalForm({ onClose }: { onClose: () => void }) {
  const addGoal = useAddSavingsGoal();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#3B82F6");

  const handleSubmit = () => {
    if (!name.trim() || !target) return;
    addGoal.mutate(
      { name: name.trim(), target: parseFloat(target), icon, color, current: 0 },
      {
        onSuccess: () => {
          toast.success("Savings objective initialized");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-6 pb-6"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest pl-1">Objective Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Asset Accumulation"
            className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-headline font-medium"
            autoFocus
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest pl-1">Target Capital (₹)</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-headline font-black tracking-tight"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Visual Anchor</p>
            <div className="grid grid-cols-6 gap-2">
              {goalIcons.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === i ? "bg-primary border border-primary/20 scale-110 shadow-glow" : "bg-muted/10 border border-muted/20 hover:bg-muted/20"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">Thematic Color</p>
            <div className="grid grid-cols-4 gap-3">
              {goalColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 rounded-lg transition-all relative overflow-hidden border border-white/10 ${
                    color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : "hover:opacity-80"
                  }`}
                  style={{ backgroundColor: c }}
                >
                    {color === c && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !target || addGoal.isPending}
          className="flex-1 py-4 rounded-2xl bg-foreground text-background font-headline font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 hover:opacity-90 transition-all"
        >
          {addGoal.isPending ? "Syncing..." : "Initialize Objective"}
        </button>
        <button onClick={onClose} className="px-8 py-4 rounded-2xl bg-[#0f172a]/60 border border-muted/20 text-muted-foreground text-[10px] font-label font-bold uppercase tracking-widest hover:text-foreground hover:bg-[#0f172a] transition-all">
          Discard
        </button>
      </div>
    </motion.div>
  );
}

function DepositModal({ goal, onClose }: { goal: { id: string; name: string; current: number; target: number }; onClose: () => void }) {
  const updateGoal = useUpdateSavingsGoal();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "withdraw">("add");

  const handleSubmit = () => {
    if (!amount) return;
    const val = parseFloat(amount);
    const newCurrent = mode === "add" ? goal.current + val : Math.max(0, goal.current - val);
    updateGoal.mutate(
      { id: goal.id, current: newCurrent },
      {
        onSuccess: () => {
          toast.success(mode === "add" ? `${formatCurrency(val)} added to velocity` : `${formatCurrency(val)} redirected`);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-4 mt-6 p-6 rounded-[2rem] bg-[#020617] border border-muted/20 shadow-2xl"
    >
      <div className="flex gap-1.5 p-1 bg-muted/10 rounded-2xl border border-muted/20">
        {(["add", "withdraw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-[9px] font-label font-black uppercase tracking-widest rounded-xl transition-all ${
              mode === m ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "add" ? "Capital Injection" : "Capital Withdrawal"}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Injection amount (₹)"
        className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline font-black transition-all"
        autoFocus
      />
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!amount || updateGoal.isPending}
          className="flex-1 py-3 px-4 rounded-xl bg-foreground text-background font-label font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-20"
        >
          {updateGoal.isPending ? "Processing..." : "Commit Change"}
        </button>
        <button onClick={onClose} className="px-6 py-3 rounded-xl bg-muted/10 text-muted-foreground text-[10px] font-label font-bold uppercase tracking-widest">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

export default function SavingsGoals({ compact = false }: { compact?: boolean }) {
  const { data: goals = [], isLoading } = useSavingsGoals();
  const deleteGoal = useDeleteSavingsGoal();
  const [showForm, setShowForm] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-0" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-300" />
        </div>
        <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest">Scanning Objectives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        {!compact && (
            <div>
                <h3 className="font-headline font-black text-2xl tracking-tighter text-foreground uppercase">Savings Objectives</h3>
                <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">Capital Accumulation Targets</p>
            </div>
        )}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all shadow-sm ${
            showForm ? "bg-muted text-muted-foreground" : "bg-[#0f172a] text-white border border-muted/40 hover:bg-[#1e293b]"
          }`}
        >
          <span className="text-[10px] font-label font-bold uppercase tracking-widest">{showForm ? "Close" : "New Goal"}</span>
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="bg-[#0f172a]/30 p-8 rounded-[2.5rem] border border-muted/40 mb-8 shadow-sm">
            <AddGoalForm onClose={() => setShowForm(false)} />
          </div>
        )}
      </AnimatePresence>

      {goals.length === 0 && !showForm ? (
        <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border border-dashed border-muted/30">
          <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
          <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-[0.2em]">No Active Accumulation Targets</p>
          <p className="text-[11px] text-muted-foreground/60 mt-2 max-w-xs mx-auto">Establish a savings horizon to accelerate your net wealth velocity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {goals.map((goal, i) => {
            const percent = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
            const isComplete = percent >= 100;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-background border border-muted/40 p-8 rounded-[2.5rem] shadow-sm group hover:shadow-xl hover:shadow-muted/5 transition-all"
              >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-[#020617] border border-muted/20 flex items-center justify-center text-2xl shadow-xl transition-all group-hover:scale-105" style={{ color: goal.color }}>
                            {goal.icon}
                        </div>
                        <div>
                            <p className="text-lg font-headline font-black text-foreground tracking-tighter truncate max-w-[200px]">{goal.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-label font-bold text-primary uppercase tracking-widest">{formatCurrency(goal.current)}</span>
                                <span className="text-[10px] font-label text-muted-foreground uppercase opacity-40">/ {formatCurrency(goal.target)} Target</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="font-headline font-black text-3xl tracking-tighter block">{percent}%</span>
                        <span className="text-[9px] font-label font-bold text-muted-foreground uppercase tracking-widest opacity-40">Efficiency</span>
                    </div>
                </div>
                
                <div className="relative w-full h-4 bg-muted/10 rounded-full overflow-hidden border border-muted/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percent, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full shadow-glow"
                      style={{ backgroundColor: goal.color, boxShadow: `0 0 10px ${goal.color}30` }}
                    />
                </div>

                <AnimatePresence>
                  {depositGoalId === goal.id && (
                    <DepositModal goal={goal} onClose={() => setDepositGoalId(null)} />
                  )}
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                         <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/10">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[9px] font-label font-black uppercase tracking-widest">Active Velocity</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDepositGoalId(depositGoalId === goal.id ? null : goal.id)}
                            className="px-6 py-2.5 bg-foreground text-background rounded-2xl text-[10px] font-label font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                        >
                            Update
                        </button>
                        <button
                            onClick={() => {
                                if(window.confirm(`Permanently delete the objective "${goal.name}"?`)) {
                                    deleteGoal.mutate(goal.id);
                                }
                            }}
                            className="p-2.5 bg-muted/10 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
