import { useState, useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, Sparkles, ArrowUpRight, ArrowDownLeft, Zap, PiggyBank, Receipt, CalendarDays, FileUp, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MobileDashboard from "@/components/MobileDashboard";
import MobileHistory from "@/components/MobileHistory";
import MobileCalendar from "@/components/MobileCalendar";
import MobileWeeklyVelocity from "@/components/MobileWeeklyVelocity";
import StatCard from "@/components/StatCard";
import TransactionList from "@/components/TransactionList";
import SpendingChart from "@/components/SpendingChart";
import BudgetRings from "@/components/BudgetRings";
import SavingsGoals from "@/components/SavingsGoals";

import WeeklyChart from "@/components/WeeklyChart";
import AddExpenseModal from "@/components/AddExpenseModal";
import EditTransactionModal from "@/components/EditTransactionModal";
import BulkImportModal from "@/components/BulkImportModal";
import SettingsPage from "@/pages/Settings";
import CalendarView from "@/components/CalendarView";
import UpcomingBills from "@/components/UpcomingBills";
import UpcomingSubscriptions from "@/components/UpcomingSubscriptions";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/data";
import { useTransactions, useMonthlyTransactions, useAddTransaction } from "@/hooks/useTransactions";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useTransactions";
import { motion } from "framer-motion";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getCurrentMonth(): string {
  return new Date().toLocaleDateString("en-US", { month: "long" });
}

function QuickActions({ onAddExpense, onImportStatement }: { onAddExpense: () => void; onImportStatement: () => void }) {
  const { setActiveTab } = useAppStore();
  const actions = [
    { label: "Add Expense", icon: ArrowUpRight, onClick: onAddExpense, color: "text-[hsl(0_72%_51%)]", bg: "bg-[hsl(0_72%_51%/0.1)]" },
    { label: "Add Income", icon: ArrowDownLeft, onClick: onAddExpense, color: "text-[hsl(142_71%_45%)]", bg: "bg-[hsl(142_71%_45%/0.1)]" },
    { label: "Import", icon: FileUp, onClick: onImportStatement, color: "text-[hsl(258_90%_66%)]", bg: "bg-[hsl(258_90%_66%/0.1)]" },
    { label: "Analytics", icon: Zap, onClick: () => setActiveTab("analytics"), color: "text-[hsl(38_92%_50%)]", bg: "bg-[hsl(38_92%_50%/0.1)]" },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-semibold text-sm text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors text-left group"
          >
            <div className={`w-9 h-9 rounded-lg ${a.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
              <a.icon className={`w-4 h-4 ${a.color}`} />
            </div>
            <span className="text-xs font-medium text-foreground">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthlySummary({ income, expense }: { income: number; expense: number }) {
  const savings = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm text-foreground">{getCurrentMonth()} Summary</h3>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(142_71%_45%)]" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(0_72%_51%)]" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{formatCurrency(expense)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Net Savings</span>
          </div>
          <span className={`text-sm font-semibold ${savings >= 0 ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
            {savings >= 0 ? "+" : ""}{formatCurrency(savings)}
          </span>
        </div>
        <div className="mt-2 p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Savings Rate</span>
            <span className="text-[11px] font-semibold text-primary">{savingsRate}%</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopSpending({ transactions }: { transactions: Array<{ type: string; category: string; amount: number }> }) {
  const expenses = transactions.filter((t) => t.type === "expense");
  const byCategory: Record<string, number> = {};
  expenses.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });
  const sorted = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (sorted.length === 0) return null;

  const topTotal = sorted.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-semibold text-sm text-foreground mb-4">Top Spending</h3>
      <div className="space-y-3">
        {sorted.map(([cat, amount], i) => (
          <div key={cat} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground truncate">{cat}</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(amount)}</span>
              </div>
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{ width: `${(amount / topTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardView({ searchQuery }: { searchQuery: string }) {
  const { setShowAddModal, setShowBulkImportModal } = useAppStore();
  const { data: monthlyTransactions = [] } = useMonthlyTransactions();
  
  const stats = useMemo(() => {
    const totalIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthlyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    
    // Calculate momentum (last 7 days vs previous 7 days)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const currentWeekSpend = monthlyTransactions.filter(t => t.type === "expense" && new Date(t.date) >= oneWeekAgo).reduce((s, t) => s + t.amount, 0);
    const prevWeekSpend = monthlyTransactions.filter(t => t.type === "expense" && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo).reduce((s, t) => s + t.amount, 0);
    
    let momentum = 0;
    if (prevWeekSpend > 0) {
      momentum = ((prevWeekSpend - currentWeekSpend) / prevWeekSpend) * 100;
    }

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      momentum: momentum.toFixed(1),
      isPositiveMomentum: momentum >= 0
    };
  }, [monthlyTransactions]);

  const { data: aiInsight, isLoading: isAiLoading } = useAIInsights(monthlyTransactions);

  const insight = useMemo(() => {
    if (isAiLoading) return { title: "Synthesizing...", text: "Our intelligence core is analyzing your data." };
    
    return {
      title: "Editorial Insight",
      text: aiInsight || "Your spending patterns are stable. Maintain current momentum."
    };
  }, [aiInsight, isAiLoading]);

  return (
    <>
      {/* Mobile Dashboard - shown only on mobile */}
      <div className="lg:hidden">
        <MobileDashboard />
      </div>

      {/* Desktop Dashboard - hidden on mobile */}
      <motion.div variants={container} initial="hidden" animate="show" className="h-full hidden lg:flex flex-col gap-4">
      {/* Hero: Current Liquidity */}
      <motion.div variants={item} className="shrink-0">
        <p className="text-[10px] font-label uppercase tracking-[0.2em] text-muted-foreground mb-3">Available Capital</p>
        <div className="flex items-baseline gap-6 flex-wrap">
            <h1 className="text-5xl lg:text-7xl font-headline font-black text-foreground tracking-tighter flex items-baseline">
                {formatCurrency(stats.balance).split('.')[0]}
                <span className="text-3xl lg:text-4xl opacity-40 ml-1">.{formatCurrency(stats.balance).split('.')[1] || '00'}</span>
            </h1>
            <div className={`px-3 py-1.5 rounded-full font-label font-bold text-[10px] uppercase flex items-center gap-1.5 border ${
              stats.isPositiveMomentum 
              ? "bg-[hsl(161_100%_21%/0.15)] text-[hsl(161_100%_21%)] border-[hsl(161_100%_21%/0.2)]" 
              : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
                <TrendingUp className={`w-3.5 h-3.5 ${!stats.isPositiveMomentum && "rotate-180"}`} />
                Momentum {stats.isPositiveMomentum ? "+" : ""}{stats.momentum}%
            </div>
        </div>
      </motion.div>

      {/* Row 1: Specialized Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <StatCard 
          variant="editorial"
          title="Capital Inflow" 
          value={formatCurrency(stats.income)} 
          change={`${monthlyTransactions.filter(t => t.type === 'income').length} entries`} 
          changeType="positive" 
          icon={ArrowDownLeft} 
        />
        <StatCard 
          variant="editorial"
          title="Capital Outflow" 
          value={formatCurrency(stats.expense)} 
          change={`${monthlyTransactions.filter(t => t.type === 'expense').length} transactions`}
          changeType="negative" 
          icon={ArrowUpRight} 
        />
        <StatCard 
          variant="hero-dark"
          title="Net Cashflow"
          value={`${stats.balance >= 0 ? "+" : ""}${formatCurrency(stats.balance)}`}
          change={stats.balance >= 0 ? "Surplus ready for investment" : "Deficit detected"}
          icon={TrendingUp}
        />
      </motion.div>

      {/* Row 2: Intelligence Section (Stable Analytics) */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8 shrink-0">
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <SpendingChart />
          <div className="min-h-0">
            <BudgetRings />
          </div>
        </div>
        <div className="space-y-6 flex flex-col">
            <WeeklyChart />
            <UpcomingSubscriptions />
        </div>
      </motion.div>

      {/* Row 3: Command Center Ledger (The Elastic Row) */}
      <motion.div variants={item} className="flex-1 min-h-0">
        <TransactionList limit={15} showHeader={false} searchQuery={searchQuery} />
      </motion.div>

      {/* Row 4: Objectives (Compressed footer) */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8 shrink-0 pb-4">
        <div className="lg:col-span-2">
           <div className="bg-[hsl(161_100%_21%/0.1)] p-6 rounded-3xl border border-[hsl(161_100%_21%/0.15)] flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-[hsl(161_100%_21%)] flex items-center justify-center text-white shadow-lg">
                      <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-black text-foreground">{insight.title}</h3>
                    <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-0.5">{insight.text}</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-foreground text-background rounded-xl font-bold text-xs hover:opacity-90 transition-all">Details</button>
            </div>
        </div>
        <div className="hidden lg:flex items-center justify-between px-2">
            <div className="flex flex-col">
                <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest opacity-60">Status</span>
                <span className="text-xs font-label font-bold text-emerald-500 uppercase">Synchronized</span>
            </div>
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-label text-muted-foreground uppercase tracking-widest opacity-60">Version</span>
                <span className="text-xs font-label font-bold text-foreground">v2.4.0</span>
            </div>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}

function TransactionsView({ searchQuery, categoryFilter, setCategoryFilter }: { searchQuery: string, categoryFilter: string, setCategoryFilter: (cat: string) => void }) {
  const { data: monthlyTransactions = [] } = useMonthlyTransactions();
  const addTransaction = useAddTransaction();
  const totalIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthlyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const handleQuickAdd = (description: string, amount: number, category: string) => {
    addTransaction.mutate({
      description,
      amount,
      category,
      type: "expense",
      date: new Date().toISOString().split('T')[0]
    }, {
      onSuccess: () => toast.success(`Added ${description}`),
      onError: (err) => toast.error(err.message)
    });
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount", "Type"];
    const rows = monthlyTransactions.map(tx => [
      tx.date,
      tx.description,
      tx.category,
      tx.amount,
      tx.type
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { data: aiInsight, isLoading: isAiLoading } = useAIInsights(monthlyTransactions);

  const dynamicInsight = useMemo(() => {
    if (isAiLoading) return "Synthesizing intelligence...";
    return aiInsight || "Your spending patterns are stable. Maintain current momentum.";
  }, [aiInsight, isAiLoading]);

  return (
    <div className="space-y-10 pb-20">
      {/* Page Title & Stats Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <p className="text-[10px] font-label text-muted-foreground uppercase tracking-[0.3em] mb-2">Fiscal Ledger</p>
           <h1 className="text-5xl font-headline font-black text-foreground tracking-tighter">Transaction History</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Inflow Card */}
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4 min-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-label text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">Net Inflow</p>
                <p className="text-xl font-headline font-black text-foreground">{formatCurrency(totalIncome)}</p>
              </div>
           </div>
           
           {/* Outflow Card */}
           <div className="bg-muted/50 border border-muted/20 p-4 rounded-3xl flex items-center gap-4 min-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background shadow-lg">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-label text-muted-foreground uppercase tracking-widest font-bold">Monthly Outflow</p>
                <p className="text-xl font-headline font-black text-foreground">{formatCurrency(totalExpense)}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between py-2 border-b border-muted/10">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <button 
              onClick={() => setCategoryFilter("")}
              className={`px-5 py-2 rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-all ${!categoryFilter ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
            >
              All Categories
            </button>
            {["Technology", "Shopping", "Food & Dining", "Transport"].map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${categoryFilter === cat ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
              >
                {cat}
              </button>
            ))}
        </div>
        <div className="flex items-center gap-3">
            <p className="hidden md:block text-[10px] font-label text-muted-foreground uppercase tracking-widest">Showing {monthlyTransactions.length} items</p>
            <button onClick={handleExportCSV} className="text-[10px] font-label font-bold text-primary uppercase tracking-widest hover:underline">Export CSV</button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Table Area */}
        <div className="lg:col-span-3 space-y-8">
            <TransactionList showHeader={false} searchQuery={searchQuery} categoryFilter={categoryFilter} />
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-10">
            {/* Spending Intelligence Mockup */}
            <div className="bg-[#001D3D] dark:bg-[#000814] p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-2xl font-headline font-black tracking-tight mb-4 leading-tight">Spending Intelligence</h3>
                    <p className="text-sm opacity-70 mb-6 leading-relaxed">{dynamicInsight}</p>
                    <button className="w-full py-4 bg-white text-[#001D3D] rounded-2xl font-black text-sm hover:bg-opacity-90 transition-all shadow-xl">Review Reports</button>
                </div>
                {/* Decorative glow */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-400/30 transition-all" />
            </div>

            {/* Quick Add Template Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="font-headline font-black text-lg tracking-tight">Quick Add Template</h4>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                    <div 
                      onClick={() => handleQuickAdd("Morning Coffee", 350, "Food & Dining")}
                      className="p-5 bg-muted/30 border border-muted/20 rounded-3xl hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Morning Coffee</p>
                        <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">₹350 • Food & Dining</p>
                    </div>
                    <div 
                      onClick={() => handleQuickAdd("Lunch Break", 1200, "Food & Dining")}
                      className="p-5 bg-muted/30 border border-muted/20 rounded-3xl hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Lunch Break</p>
                        <p className="text-[10px] font-label text-muted-foreground uppercase tracking-widest mt-1">₹1,200 • Food & Dining</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-foreground">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SpendingChart />
        <WeeklyChart />
      </div>
    </div>
  );
}

function MobileAnalyticsView() {
  return (
    <div className="space-y-6 pb-28 pt-2 px-1">
      <h2 className="font-display font-black text-3xl tracking-tight text-foreground px-3">Analytics</h2>
      <div className="space-y-5">
        <div className="mobile-chart-container">
          <SpendingChart daysToDisplay={7} />
        </div>
        <div className="px-1">
          <MobileWeeklyVelocity />
        </div>
      </div>
    </div>
  );
}

function BudgetsView() {
  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-foreground">Budgets & Goals</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BudgetRings />
        <SavingsGoals />
      </div>
    </div>
  );
}



export default function Index() {
  const { activeTab, setShowAddModal, setShowBulkImportModal } = useAppStore();
  const auth = useAuth();
  const { signOut } = auth;
  const profile = useProfile();
  const userProfile = profile.data;
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const views: Record<string, JSX.Element> = {
    dashboard: <DashboardView searchQuery={searchQuery} />,
    transactions: (
      <>
        <div className="hidden lg:block"><TransactionsView searchQuery={searchQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} /></div>
        <div className="block lg:hidden"><MobileHistory searchQuery={searchQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} /></div>
      </>
    ),
    analytics: (
      <>
        <div className="hidden lg:block"><AnalyticsView /></div>
        <div className="block lg:hidden"><MobileAnalyticsView /></div>
      </>
    ),
    budgets: <BudgetsView />,
    calendar: (
      <>
        <div className="hidden lg:block"><CalendarView /></div>
        <div className="block lg:hidden"><MobileCalendar /></div>
      </>
    ),
    settings: <SettingsPage />,
  };

  return (
    <div className="flex min-h-screen relative bg-background">
      {/* Background Decoration (Subtle Grain/Gradient) */}
      <div className="fixed inset-0 pointer-events-none z-[0] opacity-30">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-muted/60 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full"></div>
      </div>
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 min-h-screen relative z-10 transition-all duration-300">
        {/* TopNavBar Component */}
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40 bg-background/70 backdrop-blur-3xl font-headline text-sm border-b border-muted/30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input 
                className="w-full bg-muted border-none rounded-full py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-foreground shadow-inner text-xs" 
                placeholder="Search transactions..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="editorial-gradient text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 duration-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
            <div className="flex items-center gap-1 border-l border-muted/50 pl-4">
              <button onClick={() => setShowBulkImportModal(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Import Statement">
                <FileUp className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Sparkles className="w-5 h-5" />
              </button>
              <button onClick={() => signOut()} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Sign out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-40 bg-background/80 backdrop-blur-2xl">
          <h1 className="font-black text-base text-foreground tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>Wallet Tracker</h1>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {(userProfile?.display_name || auth.user?.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1500px] mx-auto w-full relative z-10 px-4 lg:px-10 py-4 lg:py-8 overflow-x-hidden">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {views[activeTab] || <DashboardView searchQuery={searchQuery} />}
          </motion.div>
        </main>
      </div>

      <MobileNav />
      <AddExpenseModal />
      <EditTransactionModal />
      <BulkImportModal />
    </div>
  );
}
