import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ParsedTransaction } from "@/lib/statementParser";

export function useBulkAddTransactions() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transactions: ParsedTransaction[]) => {
      if (!user) throw new Error("Not authenticated");

      const selected = transactions.filter((tx) => tx.selected);
      if (selected.length === 0) throw new Error("No transactions selected");

      // Supabase supports batch inserts — insert all at once
      const rows = selected.map((tx) => ({
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        description: tx.description,
        date: tx.date,
        user_id: user.id,
      }));

      // Insert in batches of 50 to avoid request size limits
      const BATCH_SIZE = 50;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from("transactions").insert(batch);
        if (error) throw error;
      }

      return { count: selected.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
