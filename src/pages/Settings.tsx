import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  RefreshCw,
  Plus,
  Trash2,
  Sun,
  Moon,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProfile,
  useUpdateProfile,
  useCategories,
  useRecurringTransactions,
  useAddRecurringTransaction,
  useDeleteRecurringTransaction,
} from "@/hooks/useTransactions";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/data";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function ProfileSection() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState("");
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    if (!displayName.trim()) return;
    updateProfile.mutate(
      { display_name: displayName.trim() },
      {
        onSuccess: () => {
          toast.success("Profile updated!");
          setEditing(false);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Profile</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Email
          </label>
          <p className="text-sm text-foreground mt-1">{user?.email}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Display Name
          </label>
          {editing ? (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-secondary/60 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Your name"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="px-3 py-2 rounded-lg gradient-primary text-white text-sm"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-2 rounded-xl bg-secondary text-muted-foreground text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-foreground">
                {profile?.display_name || "Not set"}
              </p>
              <button
                onClick={() => {
                  setDisplayName(profile?.display_name || "");
                  setEditing(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordSection() {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    // Verify current password first
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPw,
    });
    if (reAuthError) {
      toast.error("Current password is incorrect");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
    setLoading(false);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">
          Change Password
        </h3>
      </div>
      <div className="space-y-3">
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Current Password"
          className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
        />
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New Password"
          minLength={6}
          className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
        />
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Confirm New Password"
          className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
        />
        <button
          onClick={handleChangePassword}
          disabled={loading || !currentPw || !newPw || !confirmPw}
          className="w-full py-3 rounded-lg gradient-primary text-white font-medium text-sm shadow-lg shadow-[hsl(217_91%_60%/0.2)] disabled:opacity-40"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

function ThemeSection() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        {theme === "dark" ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
        <h3 className="font-display font-semibold text-foreground">
          Appearance
        </h3>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground font-medium">Theme</p>
          <p className="text-xs text-muted-foreground">
            {theme === "dark" ? "Dark mode" : "Light mode"} is active
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="relative w-14 h-8 rounded-full bg-secondary transition-colors"
        >
          <motion.div
            className="absolute top-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center"
            animate={{ left: theme === "dark" ? 4 : 30 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-primary-foreground" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-primary-foreground" />
            )}
          </motion.div>
        </button>
      </div>
    </div>
  );
}

function RecurringSection() {
  const { data: recurring = [] } = useRecurringTransactions();
  const { data: categories = [] } = useCategories();
  const addRecurring = useAddRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [type, setType] = useState("expense");

  const handleAdd = () => {
    if (!name || !amount || !category) return;
    addRecurring.mutate(
      {
        name,
        amount: parseFloat(amount),
        type,
        category,
        frequency,
        next_due_date: new Date().toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          toast.success("Recurring transaction added!");
          setName("");
          setAmount("");
          setCategory("");
          setShowForm(false);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            Recurring Transactions
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center text-white shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 mb-4 pb-4 border-b border-border"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. House Rent, SIP, Maid Charge"
            className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="bg-secondary border-none rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize ${
                  type === t
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  category === cat.name
                    ? "ring-2 ring-primary bg-primary/20 text-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!name || !amount || !category || addRecurring.isPending}
            className="w-full py-3 rounded-lg gradient-primary text-white font-medium text-sm shadow-lg shadow-[hsl(217_91%_60%/0.2)] disabled:opacity-40"
          >
            {addRecurring.isPending ? "Adding..." : "Add Recurring"}
          </button>
        </motion.div>
      )}

      {recurring.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">
          No recurring transactions yet. Add things like rent, SIPs, subscriptions.
        </p>
      ) : (
        <div className="space-y-2">
          {recurring.map((r) => {
            const cat = categories.find((c) => c.name === r.category);
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <span className="text-lg">{cat?.icon || "📦"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {r.frequency} · {r.type}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(r.amount)}
                </p>
                <button
                  onClick={() =>
                    deleteRecurring.mutate(r.id, {
                      onSuccess: () => toast.success("Deleted"),
                    })
                  }
                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.h2
        variants={item}
        className="font-display font-bold text-2xl text-foreground"
      >
        Settings
      </motion.h2>

      <motion.div variants={item}>
        <ProfileSection />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PasswordSection />
        <ThemeSection />
      </motion.div>

      <motion.div variants={item}>
        <RecurringSection />
      </motion.div>
    </motion.div>
  );
}
