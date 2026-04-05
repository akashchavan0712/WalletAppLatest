import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, Sparkles, ArrowUpRight, ArrowDownLeft, Zap, PiggyBank, Receipt, CalendarDays } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import StatCard from "@/components/StatCard";
import TransactionList from "@/components/TransactionList";
import SpendingChart from "@/components/SpendingChart";
import BudgetRings from "@/components/BudgetRings";
import SavingsGoals from "@/components/SavingsGoals";

import WeeklyChart from "@/components/WeeklyChart";
import AddExpenseModal from "@/components/AddExpenseModal";
import SettingsPage from "@/pages/Settings";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/data";
import { useTransactions, useMonthlyTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useTransactions";
import { motion } from "framer-motion";

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

function QuickActions({ onAddExpense }: { onAddExpense: () => void }) {
  const { setActiveTab } = useAppStore();
  const actions = [
    { label: "Add Expense", icon: ArrowUpRight, onClick: onAddExpense, color: "text-[hsl(0_72%_51%)]", bg: "bg-[hsl(0_72%_51%/0.1)]" },
    { label: "Add Income", icon: ArrowDownLeft, onClick: onAddExpense, color: "text-[hsl(142_71%_45%)]", bg: "bg-[hsl(142_71%_45%/0.1)]" },
    { label: "Budgets", icon: PiggyBank, onClick: () => setActiveTab("budgets"), color: "text-[hsl(258_90%_66%)]", bg: "bg-[hsl(258_90%_66%/0.1)]" },
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

function DashboardView() {
  const { setShowAddModal } = useAppStore();
  const { data: monthlyTransactions = [] } = useMonthlyTransactions();
  const { data: transactions = [] } = useTransactions();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const totalIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthlyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {getGreeting()}, {displayName}
          </p>
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-foreground">{getCurrentMonth()} Overview</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => signOut()}
            className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg shadow-[hsl(217_91%_60%/0.2)] hover:shadow-[hsl(217_91%_60%/0.3)] transition-shadow duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </motion.button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Balance" value={formatCurrency(balance)} change={balance >= 0 ? "You're on track ✓" : "Over budget ✗"} changeType={balance >= 0 ? "positive" : "negative"} icon={Wallet} />
        <StatCard title="Income" value={formatCurrency(totalIncome)} change="Salary + Freelance" changeType="positive" icon={TrendingUp} gradient="gradient-income" />
        <StatCard title="Expenses" value={formatCurrency(totalExpense)} change={`${monthlyTransactions.filter(t => t.type === 'expense').length} transactions`} changeType="negative" icon={TrendingDown} gradient="gradient-expense" />
      </motion.div>

      {/* Charts + Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <QuickActions onAddExpense={() => setShowAddModal(true)} />
      </motion.div>

      {/* Weekly + Monthly Summary */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>
        <MonthlySummary income={totalIncome} expense={totalExpense} />
      </motion.div>

      {/* Transactions + Budgets + Goals */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TransactionList limit={6} />
        </div>
        <div className="space-y-5">
          <BudgetRings />
          <TopSpending transactions={monthlyTransactions} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function TransactionsView() {
  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-foreground">All Transactions</h2>
      <TransactionList showHeader={false} />
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
  const { activeTab } = useAppStore();

  const views: Record<string, JSX.Element> = {
    dashboard: <DashboardView />,
    transactions: <TransactionsView />,
    analytics: <AnalyticsView />,
    budgets: <BudgetsView />,
    settings: <SettingsPage />,
  };

  return (
    <div className="flex min-h-screen relative bg-background">
      {/* Very subtle ambient light */}
      <div className="floating-orb w-[500px] h-[500px] bg-[hsl(var(--primary))] top-[-20%] right-[10%]" />
      <div className="floating-orb w-[400px] h-[400px] bg-[hsl(var(--violet))] bottom-[10%] left-[5%]" style={{ animationDelay: '-8s' }} />
      
      <Sidebar />
      <main className="flex-1 p-5 lg:p-10 pb-24 lg:pb-10 overflow-y-auto">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {views[activeTab] || <DashboardView />}
        </motion.div>
      </main>
      <MobileNav />
      <AddExpenseModal />
    </div>
  );
}
