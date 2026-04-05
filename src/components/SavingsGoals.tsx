import { useState } from "react";
import { formatCurrency } from "@/lib/data";
import { useSavingsGoals, useAddSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/useTransactions";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, TrendingUp, Minus } from "lucide-react";
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
          toast.success("Savings goal created!");
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
      className="space-y-4 pb-4 mb-4 border-b border-border"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Goal name (e.g. Vacation, New Car)"
        className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
        autoFocus
      />
      <input
        type="number"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="Target amount (₹)"
        className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Icon</p>
        <div className="flex flex-wrap gap-2">
          {goalIcons.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                icon === i ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary/40 hover:bg-secondary/60"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Color</p>
        <div className="flex gap-2">
          {goalColors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${
                color === c ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !target || addGoal.isPending}
          className="flex-1 py-2.5 rounded-lg gradient-primary text-white font-medium text-sm shadow-lg shadow-[hsl(217_91%_60%/0.2)] disabled:opacity-40"
        >
          {addGoal.isPending ? "Creating..." : "Create Goal"}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors">
          Cancel
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
          toast.success(mode === "add" ? `₹${val.toLocaleString("en-IN")} added!` : `₹${val.toLocaleString("en-IN")} withdrawn`);
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
      className="space-y-3 mt-3 p-4 rounded-lg bg-secondary/30 border border-border"
    >
      <div className="flex gap-1 p-0.5 bg-secondary/60 rounded-md">
        {(["add", "withdraw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
              mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "add" ? "Deposit" : "Withdraw"}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (₹)"
        className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!amount || updateGoal.isPending}
          className="flex-1 py-2 rounded-lg gradient-primary text-white font-medium text-xs shadow-sm disabled:opacity-40"
        >
          {updateGoal.isPending ? "Saving..." : mode === "add" ? "Deposit" : "Withdraw"}
        </button>
        <button onClick={onClose} className="px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-xs">
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
      <div className="glass-card p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-4">Savings Goals</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm text-foreground">Savings Goals</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center text-white shadow-sm"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {showForm && <AddGoalForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Summary bar */}
      {goals.length > 0 && !compact && (
        <div className="p-3 rounded-lg bg-secondary/30 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">Total Progress</span>
            <span className="text-[11px] font-semibold text-primary">
              {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm font-medium text-foreground mb-1">No savings goals yet</p>
          <p className="text-xs text-muted-foreground mb-3">Set a target to start tracking your progress</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-primary font-medium hover:underline"
          >
            + Create your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, i) => {
            const percent = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
            const isComplete = percent >= 100;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">{goal.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatCurrency(goal.current)} of {formatCurrency(goal.target)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-display font-bold ${isComplete ? "text-[hsl(142_71%_45%)]" : "text-primary"}`}>
                        {isComplete ? "✓" : `${percent}%`}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDepositGoalId(depositGoalId === goal.id ? null : goal.id)}
                          className="p-1 rounded hover:bg-primary/20 text-primary transition-colors"
                          title="Add/Withdraw funds"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteGoal.mutate(goal.id, { onSuccess: () => toast.success("Goal deleted") })}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percent, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>
                </div>
                <AnimatePresence>
                  {depositGoalId === goal.id && (
                    <DepositModal goal={goal} onClose={() => setDepositGoalId(null)} />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
