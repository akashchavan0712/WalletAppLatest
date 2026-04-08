import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useMonthlyTransactions, useTransactions, useCategories, useSavingsGoals } from "@/hooks/useTransactions";

import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import SpendingChart from "./SpendingChart";
import MobileWeeklyVelocity from "./MobileWeeklyVelocity";
import MobileCapitalCommitments from "./MobileCapitalCommitments";
import BudgetRings from "./BudgetRings";
import SavingsGoals from "./SavingsGoals";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function abbreviateAmount(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return amount.toFixed(0);
}

export default function MobileDashboard() {
  const { data: monthlyTransactions = [] } = useMonthlyTransactions();
  const { data: allTransactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: goals = [] } = useSavingsGoals();
  const { setShowAddModal, setActiveTab } = useAppStore();


  const stats = useMemo(() => {
    const totalIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthlyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Momentum calculation
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
      balance,
      cashflow: balance,
      momentum: momentum.toFixed(1),
      isPositiveMomentum: momentum >= 0,
    };
  }, [monthlyTransactions]);

  // Budget data for the rings section
  const budgetData = useMemo(() => {
    const spent = allTransactions
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return categories
      .filter((c) => c.budget)
      .map((c) => ({
        ...c,
        spent: spent[c.name] || 0,
        percent: Math.min(((spent[c.name] || 0) / (c.budget || 1)) * 100, 100),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);
  }, [allTransactions, categories]);

  // Format balance with split decimals
  const balanceParts = useMemo(() => {
    const formatted = formatCurrency(stats.balance);
    const dotIndex = formatted.lastIndexOf('.');
    if (dotIndex === -1) return { whole: formatted, decimal: '00' };
    return {
      whole: formatted.substring(0, dotIndex),
      decimal: formatted.substring(dotIndex + 1),
    };
  }, [stats.balance]);

  const currencySymbol = useMemo(() => {
    const currency = typeof window !== "undefined" ? localStorage.getItem("finflow-currency") || "INR" : "INR";
    const symbols: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
    return symbols[currency] || "$";
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mobile-dashboard-wrapper pb-28 space-y-5"
    >
      {/* ─── Hero: Current Liquidity ─── */}
      <motion.section variants={item} className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Current Liquidity
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[2.6rem] font-black text-foreground tracking-tighter leading-none flex items-baseline" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {balanceParts.whole}
            <span className="text-xl opacity-40 ml-0.5">.{balanceParts.decimal}</span>
          </h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            stats.isPositiveMomentum
              ? "text-emerald-400"
              : "text-rose-400"
          }`}>
            <TrendingUp className={`w-3 h-3 ${!stats.isPositiveMomentum && "rotate-180"}`} />
            {stats.isPositiveMomentum ? "+" : ""}{stats.momentum}%
          </div>
        </div>
      </motion.section>

      {/* ─── Income / Expense Dual Cards ─── */}
      <motion.section variants={item} className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="mobile-stat-card mobile-stat-income">
          <div className="mobile-stat-icon-wrap income-icon">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Income</p>
          <p className="text-lg font-black tracking-tight text-foreground mt-0.5">
            {currencySymbol}{abbreviateAmount(stats.income)}
          </p>
        </div>

        {/* Expense Card */}
        <div className="mobile-stat-card mobile-stat-expense">
          <div className="mobile-stat-icon-wrap expense-icon">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Expenses</p>
          <p className="text-lg font-black tracking-tight text-foreground mt-0.5">
            {currencySymbol}{abbreviateAmount(stats.expense)}
          </p>
        </div>
      </motion.section>

      {/* ─── Monthly Cashflow Card ─── */}
      <motion.section variants={item}>
        <div className="mobile-cashflow-card">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 mb-1">Monthly Cashflow</p>
            <p className="text-3xl font-black tracking-tighter">
              {stats.cashflow >= 0 ? "+" : ""}{formatCurrency(stats.cashflow)}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("analytics")}
            className="mobile-cashflow-btn"
          >
            Optimize
          </button>
        </div>
      </motion.section>

      {/* ─── Spending Trajectory ─── */}
      <motion.section variants={item}>
        <div className="mobile-chart-container">
          <SpendingChart daysToDisplay={7} />
        </div>
      </motion.section>

      {/* ─── Weekly Velocity ─── */}
      <motion.section variants={item} className="px-1">
        <MobileWeeklyVelocity />
      </motion.section>

      {/* ─── Active Budgets (Horizontal Scroll) ─── */}
      <motion.section variants={item}>
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-lg font-black tracking-tight text-foreground">Active Budgets</h3>
          <button
            onClick={() => setActiveTab("budgets")}
            className="text-xs font-bold text-blue-400"
          >
            View All
          </button>
        </div>
        <div className="mobile-budget-scroll no-scrollbar">
          {budgetData.length === 0 ? (
            <div className="mobile-budget-empty">
              <p className="text-xs text-muted-foreground opacity-60">No active budgets</p>
              <button
                onClick={() => setActiveTab("budgets")}
                className="text-xs font-bold text-blue-400 mt-1"
              >
                Set up budgets →
              </button>
            </div>
          ) : (
            budgetData.map((b, i) => {
              const radius = 32;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (b.percent / 100) * circumference;

              return (
                <div key={b.id} className="mobile-budget-ring-item">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(var(--muted)/0.15)" strokeWidth="6" />
                      <motion.circle
                        cx="40" cy="40" r={radius} fill="none"
                        stroke={b.color}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 + 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black tracking-tighter text-foreground">{Math.round(b.percent)}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1.5 text-center truncate max-w-[80px]">
                    {b.name}
                  </p>
                  <p className="text-[10px] font-bold text-foreground text-center">
                    {formatCurrency(b.spent)} <span className="text-muted-foreground opacity-50">/ {abbreviateAmount(b.budget || 0)}</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      {/* ─── Capital Commitments ─── */}
      <motion.section variants={item} className="px-1">
        <MobileCapitalCommitments />
      </motion.section>

      {/* ─── Savings Objectives ─── */}
      <motion.section variants={item}>
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-lg font-black tracking-tight text-foreground">Savings Objectives</h3>
        </div>
        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="mobile-savings-empty">
              <p className="text-xs text-muted-foreground opacity-60 text-center">No savings goals yet</p>
            </div>
          ) : (
            goals.slice(0, 3).map((goal, i) => {
              const percent = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
              return (
                <div key={goal.id} className="mobile-savings-item">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                      {goal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{goal.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                      </p>
                    </div>
                    <span className="text-sm font-black" style={{ color: goal.color }}>{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percent, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
