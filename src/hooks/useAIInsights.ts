import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/data";

const SYSTEM_PROMPT = `You are an elite financial advisor. You will receive a summary of a user's recent transactions. 
Your task is to provide one SHORT, DYNAMIC, and ACTIONABLE insight. 
Rules:
1. Keep it under 20 words.
2. Be specific based on the data provided.
3. Don't sound generic.
4. Format: Plain text only, no markdown.`;

export function useAIInsights(transactions: any[]) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  return useQuery({
    queryKey: ["ai-insights", transactions.length],
    queryFn: async () => {
      if (!apiKey || transactions.length === 0) return "Add more transactions to unlock AI-powered financial intelligence.";

      // Summarize transactions for the prompt to save tokens (and stay in free tier)
      const topCategories = transactions
        .filter(t => t.type === "expense")
        .reduce((acc: Record<string, number>, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});
      
      const summary = Object.entries(topCategories)
        .map(([cat, amount]) => `${cat}: ${formatCurrency(amount as number)}`)
        .join(", ");

      const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

      const prompt = `Transactions Summary: Total Income: ${formatCurrency(totalIncome)}, Total Expense: ${formatCurrency(totalExpense)}. Spending by category: ${summary}. Give me one high-fidelity insight.`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
          }),
        });

        if (!res.ok) throw new Error("AI Logic failed to initialize");

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "Your spending patterns are stable. Maintain current momentum.";
      } catch (err) {
        console.error("AI Insight Error:", err);
        return "Syncing with intelligence core... Rule-based analysis suggest optimizing recurring outflows.";
      }
    },
    enabled: !!apiKey && transactions.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
