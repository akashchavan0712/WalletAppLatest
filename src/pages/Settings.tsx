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
  Download,
  ShieldAlert,
  Globe,
  Palette
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProfile,
  useUpdateProfile,
  useCategories,
  useRecurringTransactions,
  useAddRecurringTransaction,
  useDeleteRecurringTransaction,
  useResetAccount,
  useTransactions,
} from "@/hooks/useTransactions";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/data";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
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
          toast.success("Profile updated");
          setEditing(false);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-headline font-black text-xl tracking-tighter text-foreground uppercase">Identity</h3>
            <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">Personal Authentication Data</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-1.5">
          <label className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest pl-1">
            Registered Email
          </label>
          <div className="w-full bg-[#0f172a]/20 border border-muted/10 rounded-2xl px-6 py-4">
             <p className="text-sm font-headline font-medium text-foreground opacity-60">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest pl-1">
            Display Alias
          </label>
          {editing ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-3.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline font-medium"
                placeholder="Alias"
                autoFocus
              />
              <button onClick={handleSave} className="px-6 rounded-2xl bg-foreground text-background font-label font-black text-[10px] uppercase tracking-widest shadow-lg">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 rounded-2xl bg-muted/10 text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-4">
               <p className="text-sm font-headline font-black text-foreground">{profile?.display_name || "Anonymous User"}</p>
               <button onClick={() => { setDisplayName(profile?.display_name || ""); setEditing(true); }} className="text-[10px] font-label font-bold text-primary uppercase tracking-widest hover:underline">Revise</button>
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
    if (!currentPw || newPw.length < 6 || newPw !== confirmPw) {
      toast.error("Valid authentication data required");
      return;
    }
    setLoading(true);
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPw,
    });
    if (reAuthError) {
      toast.error("Current authentication failed");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else {
      toast.success("Security credentials updated");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
    setLoading(false);
  };

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Lock className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-headline font-black text-xl tracking-tighter text-foreground uppercase">Security</h3>
            <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">Credential Management</p>
        </div>
      </div>
      <div className="space-y-4">
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Current Secret Key"
          className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline"
        />
        <div className="grid grid-cols-2 gap-4">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New Secret"
              className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline"
            />
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Verify Secret"
              className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline"
            />
        </div>
        <button
          onClick={handleChangePassword}
          disabled={loading || !currentPw || !newPw || !confirmPw}
          className="w-full py-4 rounded-2xl bg-foreground text-background font-label font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-20 hover:opacity-90 transition-all"
        >
          {loading ? "Synchronizing Security..." : "Commit Security Credentials"}
        </button>
      </div>
    </div>
  );
}

function ThemeSection() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Palette className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-headline font-black text-xl tracking-tighter text-foreground uppercase">Appearance</h3>
            <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">Visual Environment Tokens</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-6 bg-muted/5 border border-muted/10 rounded-[2rem]">
        <div>
          <p className="text-sm font-headline font-black text-foreground uppercase">Lumina System</p>
          <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">
            {theme === "dark" ? "Nocturnal Protocol Active" : "Diurnal Protocol Active"}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="relative w-16 h-9 rounded-full bg-[#0f172a] border border-muted/20 shadow-inner"
        >
          <motion.div
            className="absolute top-1 w-7 h-7 rounded-full bg-foreground flex items-center justify-center shadow-lg"
            animate={{ left: theme === "dark" ? 4 : 33 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-background" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-background" />
            )}
          </motion.div>
        </button>
      </div>
    </div>
  );
}

function CurrencySection() {
  const { currency, setCurrency } = useAppStore();

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
            <Globe className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-headline font-black text-xl tracking-tighter text-foreground uppercase">Localization</h3>
            <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">Global Monetary Protocol</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-6 bg-muted/5 border border-muted/10 rounded-[2rem]">
        <div>
          <p className="text-sm font-headline font-black text-foreground uppercase">Monetary Unit</p>
          <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">Global Precision Horizon</p>
        </div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bg-[#0f172a] border border-muted/20 rounded-xl px-5 py-2.5 text-[10px] font-label font-black uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer shadow-lg"
        >
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>
    </div>
  );
}

function DataExportSection() {
  const { data: transactions = [] } = useTransactions();

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("Monetary set is void");
      return;
    }
    const headers = ["Date", "Description", "Amount", "Type", "Category"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
      transactions.map((tx) => `${tx.date},"${tx.description}",${tx.amount},${tx.type},${tx.category}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `editorial_ledger_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
    toast.success("Intelligence export complete");
  };

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Download className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-headline font-black text-xl tracking-tighter text-foreground uppercase">Intelligence</h3>
            <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">Asset Data Extraction</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-headline font-black text-foreground uppercase mb-1">Monetary Dump</p>
        <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest leading-relaxed mb-6 opacity-60">
          Extract complete fiscal trajectory and granular transaction blocks in normalized CSV protocol.
        </p>
        <button
          onClick={handleExportCSV}
          className="w-full py-4 bg-[#0f172a] border border-primary/20 text-primary rounded-2xl flex items-center justify-center gap-3 text-[10px] font-label font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#0f172a]/80 transition-all"
        >
          <Download className="w-4 h-4" />
          Initialize Global Export
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
      { name, amount: parseFloat(amount), type, category, frequency, next_due_date: new Date().toISOString().split("T")[0] },
      { onSuccess: () => { toast.success("Velocity cycle active"); setName(""); setAmount(""); setShowForm(false); } }
    );
  };

  return (
    <div className="bg-background border border-muted/40 p-10 rounded-[3rem] shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <RefreshCw className="w-5 h-5" />
          </div>
          <div>
              <h3 className="font-headline font-black text-xl tracking-tighter text-foreground uppercase">Fiscal Cycles</h3>
              <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">Recurring Capital Trajectories</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all shadow-sm ${
            showForm ? "bg-muted text-muted-foreground" : "bg-[#0f172a] text-white border border-muted/40 hover:bg-[#1e293b]"
          }`}
        >
          <span className="text-[10px] font-label font-bold uppercase tracking-widest leading-none">{showForm ? "Close" : "New Cycle"}</span>
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-6 mb-8 pb-8 border-b border-muted/20"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent protocol, Energy surplus"
            className="w-full bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Capital Value"
              className="bg-[#0f172a]/40 border border-muted/20 rounded-2xl px-6 py-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-headline"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="bg-[#0f172a] border border-muted/20 rounded-2xl px-6 py-4 text-[10px] font-label font-black uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-lg cursor-pointer"
            >
              <option value="daily">Daily Loop</option>
              <option value="weekly">Weekly Loop</option>
              <option value="monthly">Monthly Cycle</option>
              <option value="yearly">Yearly Horizon</option>
            </select>
          </div>
          <div className="flex gap-1.5 p-1 bg-muted/10 rounded-2xl border border-muted/20">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-3 text-[10px] font-label font-black uppercase tracking-widest rounded-xl transition-all ${
                  type === t ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-label font-black uppercase transition-all border ${
                  category === cat.name ? "ring-2 ring-primary bg-primary/20 border-primary shadow-glow" : "bg-[#0f172a]/40 border-muted/20 text-muted-foreground hover:text-foreground"
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
            className="w-full py-4 rounded-2xl bg-foreground text-background font-label font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-20"
          >
            Initialize Recurring Cycle
          </button>
        </motion.div>
      )}

      {recurring.length === 0 && !showForm ? (
        <div className="p-10 bg-muted/5 border border-dashed border-muted/20 rounded-[2.5rem] text-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground opacity-20 mx-auto mb-4" />
            <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest">No Active Recurring Protocols</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {recurring.map((r) => {
            const cat = categories.find((c) => c.name === r.category);
            return (
              <div key={r.id} className="flex items-center gap-5 p-5 rounded-[2rem] bg-[#020617] border border-muted/20 hover:border-primary/20 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-muted/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">{cat?.icon || "📦"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline font-black text-foreground uppercase tracking-tight truncate">{r.name}</p>
                  <p className="text-[10px] font-label font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                    {r.frequency} · {r.type} Cycle
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-sm font-headline font-black text-foreground">{formatCurrency(r.amount)}</p>
                    <button onClick={() => deleteRecurring.mutate(r.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResetAccountSection() {
  const resetAccount = useResetAccount();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-[#020617] border border-rose-500/20 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(244,63,94,0.05)]">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-headline font-black text-xl tracking-tighter text-rose-500 uppercase">Critical Protocol</h3>
            <p className="text-[10px] font-label text-rose-500/60 uppercase tracking-widest mt-0.5">Account Termination / Reset</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-headline font-black text-foreground uppercase mb-1">Total Narrative Reset</p>
        <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest leading-relaxed mb-10 opacity-60">
          Permanently eradicate all fiscal blocks, saving objectives, and budget thresholds. This action is terminal and cannot be reversed by system restore.
        </p>
        
        {showConfirm ? (
          <div className="p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/20 text-center animate-in zoom-in-95 duration-200">
            <p className="text-sm font-headline font-black text-rose-500 uppercase tracking-tighter mb-6">Confirm Data Eradication?</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => resetAccount.mutate()}
                className="px-8 py-3 bg-rose-500 text-white text-[10px] font-label font-black uppercase rounded-2xl shadow-glow shadow-rose-500/30"
              >
                Execute
              </button>
              <button onClick={() => setShowConfirm(false)} className="px-8 py-3 bg-white/5 text-muted-foreground text-[10px] font-label font-black uppercase rounded-2xl">Abort</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 border border-rose-500/30 text-rose-500 bg-rose-500/5 rounded-2xl text-[10px] font-label font-black uppercase tracking-[0.3em] hover:bg-rose-500/10 transition-all"
          >
            Initialize Reset Sequence
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 pb-20">
      <div className="flex flex-col gap-2">
          <p className="text-[10px] font-label text-muted-foreground uppercase tracking-[0.4em]">Administrative</p>
          <h2 className="font-headline font-black text-5xl text-foreground tracking-tighter">System Console</h2>
          <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1 opacity-50">Global Parameters & Narrative Protocol</p>
      </div>

      <motion.div variants={item}>
        <ProfileSection />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PasswordSection />
        <ThemeSection />
        <CurrencySection />
        <DataExportSection />
      </motion.div>

      <motion.div variants={item}>
        <RecurringSection />
      </motion.div>
      
      <motion.div variants={item} className="max-w-2xl">
        <ResetAccountSection />
      </motion.div>
    </motion.div>
  );
}
