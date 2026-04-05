-- Add missing foreign key constraint on recurring_transactions.user_id
ALTER TABLE public.recurring_transactions
  ADD CONSTRAINT recurring_transactions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
