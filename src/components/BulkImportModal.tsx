import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Loader2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  FileUp,
  Check,
  Sparkles,
  Bot,
  Cpu,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useBulkAddTransactions } from "@/hooks/useBulkImport";
import {
  parseStatement,
  ALL_CATEGORIES,
  type ParsedTransaction,
  type ParseResult,
} from "@/lib/statementParser";
import { formatCurrency } from "@/lib/data";
import { toast } from "sonner";

type Step = "upload" | "review" | "importing" | "done";

function isInternalTransfer(tx: ParsedTransaction): boolean {
  const description = tx.description.toLowerCase();
  return (
    description.includes("self transfer") ||
    description.includes("transfer to state bank of india") ||
    description.includes("transfer to sbi") ||
    description.includes("state bank of india 4044") ||
    description.includes("sbi 4044") ||
    (description.includes("state bank of india") && /\b4044\b/.test(description)) ||
    description.includes("own account") ||
    description.includes("to self")
  );
}

export default function BulkImportModal() {
  const { showBulkImportModal, setShowBulkImportModal } = useAppStore();
  const bulkAdd = useBulkAddTransactions();

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setIsDragging(false);
    setIsParsing(false);
    setParseResult(null);
    setTransactions([]);
    setImportProgress(0);
    setImportedCount(0);
  }, []);

  const handleClose = useCallback(() => {
    setShowBulkImportModal(false);
    // Reset after animation
    setTimeout(reset, 300);
  }, [setShowBulkImportModal, reset]);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "pdf" && ext !== "csv") {
      toast.error("Please upload a PDF or CSV file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max 10MB.");
      return;
    }

    setIsParsing(true);
    try {
      const result = await parseStatement(file);
      setParseResult(result);
      setTransactions(result.transactions);

      if (result.transactions.length > 0) {
        setStep("review");
        toast.success(`Found ${result.transactions.length} transactions!`);
      } else {
        toast.error("No transactions found in this file.");
        if (result.warnings.length > 0) {
          result.warnings.forEach((w) => toast.warning(w));
        }
      }
    } catch (err) {
      toast.error("Failed to parse file. Please check the format.");
      console.error("Parse error:", err);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleFile]
  );

  const toggleTransaction = useCallback((index: number) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, selected: !tx.selected } : tx
      )
    );
  }, []);

  const toggleAll = useCallback((selected: boolean) => {
    setTransactions((prev) => prev.map((tx) => ({ ...tx, selected })));
  }, []);

  const updateCategory = useCallback((index: number, category: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, category, confidence: "high" as const } : tx
      )
    );
  }, []);

  const removeTransaction = useCallback((index: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleImport = useCallback(async () => {
    const selected = transactions.filter((tx) => tx.selected);
    if (selected.length === 0) {
      toast.error("No transactions selected");
      return;
    }

    setStep("importing");
    setImportProgress(0);

    // Simulate progress since bulk insert is fast
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 8, 90));
    }, 100);

    try {
      const result = await bulkAdd.mutateAsync(transactions);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportedCount(result.count);

      setTimeout(() => {
        setStep("done");
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      toast.error(err.message || "Import failed");
      setStep("review");
    }
  }, [transactions, bulkAdd]);

  // ─── Computed values ───────────────────────────────────────────────

  const selectedTransactions = transactions.filter((tx) => tx.selected);
  const selectedCount = selectedTransactions.length;
  const expenseTransactions = selectedTransactions.filter(
    (tx) => tx.type === "expense"
  );
  const incomeTransactions = selectedTransactions.filter(
    (tx) => tx.type === "income"
  );
  const internalTransferTransactions = expenseTransactions.filter(isInternalTransfer);
  const expenseCount = expenseTransactions.length;
  const incomeCount = incomeTransactions.length;
  const internalTransferCount = internalTransferTransactions.length;
  const totalFlow = selectedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalSpent = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalInternalTransfers = internalTransferTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );
  const netAmount = totalReceived - totalSpent;
  const netExcludingTransfers = totalReceived - (totalSpent - totalInternalTransfers);

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {showBulkImportModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step !== "importing" ? handleClose : undefined}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0.2 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-[680px] glass-card p-0 max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  {step === "review" && (
                    <button
                      onClick={() => {
                        setStep("upload");
                        setTransactions([]);
                        setParseResult(null);
                      }}
                      className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <h2 className="font-display font-bold text-lg text-foreground">
                      {step === "upload" && "Import Statement"}
                      {step === "review" && "Review Transactions"}
                      {step === "importing" && "Importing..."}
                      {step === "done" && "Import Complete!"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step === "upload" &&
                        "Upload a bank statement or UPI export"}
                      {step === "review" && (
                        <span className="flex items-center gap-2">
                          {parseResult?.fileName} · {transactions.length} transactions found
                          {parseResult?.parsedVia === "ai" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[hsl(142_71%_45%/0.1)] text-[hsl(142_71%_45%)] text-[9px] font-semibold uppercase tracking-wider">
                              <Bot className="w-2.5 h-2.5" />
                              AI-Powered
                            </span>
                          ) : parseResult?.parsedVia === "regex" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[hsl(38_92%_50%/0.1)] text-[hsl(38_92%_50%)] text-[9px] font-semibold uppercase tracking-wider">
                              <Cpu className="w-2.5 h-2.5" />
                              Text-Based
                            </span>
                          ) : null}
                        </span>
                      )}
                      {step === "importing" && "Please wait while we add your transactions"}
                      {step === "done" &&
                        `${importedCount} transactions imported successfully`}
                    </p>
                  </div>
                </div>
                {step !== "importing" && (
                  <button
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/60 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* ── Step 1: Upload ─────────────────────────────── */}
                  {step === "upload" && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-6"
                    >
                      {/* Drop zone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                          transition-all duration-300 group
                          ${
                            isDragging
                              ? "border-primary bg-primary/5 scale-[1.02]"
                              : "border-border hover:border-primary/50 hover:bg-secondary/20"
                          }
                          ${isParsing ? "pointer-events-none opacity-60" : ""}
                        `}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.csv"
                          onChange={handleFileInput}
                          className="hidden"
                        />

                        {isParsing ? (
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Analyzing your statement...
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Extracting transactions & detecting categories
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <FileUp className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Drop your statement here
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                or click to browse · PDF, CSV · Max 10MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Supported formats */}
                      <div className="mt-6 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Supported Sources
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { name: "GPay", icon: "💳" },
                            { name: "CRED", icon: "💎" },
                            { name: "SuperMoney", icon: "⚡" },
                            { name: "SBI", icon: "🏛️" },
                            { name: "HDFC", icon: "🏦" },
                            { name: "ICICI", icon: "🏧" },
                          ].map((source) => (
                            <div
                              key={source.name}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50"
                            >
                              <span className="text-sm">{source.icon}</span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {source.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Warnings from previous parse */}
                      {parseResult?.warnings && parseResult.warnings.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-[hsl(38_92%_50%/0.1)] border border-[hsl(38_92%_50%/0.2)]">
                          {parseResult.warnings.map((w, i) => (
                            <p
                              key={i}
                              className="text-xs text-[hsl(38_92%_50%)] flex items-start gap-2"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 2: Review ─────────────────────────────── */}
                  {step === "review" && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col"
                    >
                      {/* Summary bar */}
                      <div className="px-5 py-3 bg-secondary/20 border-b border-border flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">
                            {selectedCount} selected
                          </span>
                          <span>
                            {formatCurrency(totalSpent)} spent
                          </span>
                          <span className="text-[hsl(142_71%_45%)]">
                            {formatCurrency(totalReceived)} received
                          </span>
                          <span
                            className={
                              netAmount < 0
                                ? "text-[hsl(0_72%_51%)]"
                                : "text-[hsl(142_71%_45%)]"
                            }
                          >
                            {formatCurrency(Math.abs(netAmount))}{" "}
                            {netAmount < 0 ? "net outflow" : "net inflow"}
                          </span>
                          <span>
                            {formatCurrency(totalFlow)} flow
                          </span>
                          <span className="text-[hsl(0_72%_51%)]">
                            {expenseCount} expenses
                          </span>
                          <span className="text-[hsl(142_71%_45%)]">
                            {incomeCount} income
                          </span>
                          {internalTransferCount > 0 && (
                            <span title="Detected self or own-account transfers in selected expenses">
                              {formatCurrency(totalInternalTransfers)} self transfers
                            </span>
                          )}
                          {internalTransferCount > 0 && (
                            <span
                              className={
                                netExcludingTransfers < 0
                                  ? "text-[hsl(0_72%_51%)]"
                                  : "text-[hsl(142_71%_45%)]"
                              }
                            >
                              {formatCurrency(Math.abs(netExcludingTransfers))} adjusted{" "}
                              {netExcludingTransfers < 0 ? "outflow" : "inflow"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAll(true)}
                            className="text-[10px] font-medium text-primary hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-muted-foreground/30">|</span>
                          <button
                            onClick={() => toggleAll(false)}
                            className="text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      {/* Warnings */}
                      {parseResult?.warnings && parseResult.warnings.length > 0 && (
                        <div className="px-5 py-2 bg-[hsl(38_92%_50%/0.05)] border-b border-[hsl(38_92%_50%/0.15)]">
                          {parseResult.warnings.map((w, i) => (
                            <p
                              key={i}
                              className="text-[11px] text-[hsl(38_92%_50%)] flex items-center gap-1.5"
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {w}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Transaction list */}
                      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                        {transactions.map((tx, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-3 px-5 py-3 transition-all ${
                              tx.selected
                                ? "hover:bg-secondary/20"
                                : "opacity-40 bg-secondary/5"
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleTransaction(i)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                tx.selected
                                  ? "bg-primary border-primary"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {tx.selected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>

                            {/* Confidence dot */}
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                tx.confidence === "high"
                                  ? "bg-[hsl(142_71%_45%)]"
                                  : tx.confidence === "medium"
                                  ? "bg-[hsl(38_92%_50%)]"
                                  : "bg-[hsl(0_72%_51%)]"
                              }`}
                              title={`${tx.confidence} confidence match`}
                            />

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {tx.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(tx.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>

                            {/* Category dropdown */}
                            <div className="relative shrink-0">
                              <select
                                value={tx.category}
                                onChange={(e) =>
                                  updateCategory(i, e.target.value)
                                }
                                className="appearance-none text-[10px] font-medium bg-secondary/60 border border-border rounded-md pl-2 pr-6 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                              >
                                {ALL_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>

                            {/* Type badge */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                                tx.type === "income"
                                  ? "bg-[hsl(142_71%_45%/0.1)] text-[hsl(142_71%_45%)]"
                                  : "bg-[hsl(0_72%_51%/0.1)] text-[hsl(0_72%_51%)]"
                              }`}
                            >
                              {tx.type === "income" ? "CR" : "DR"}
                            </span>

                            {/* Amount */}
                            <span className="text-xs font-semibold text-foreground tabular-nums shrink-0 w-20 text-right">
                              {formatCurrency(tx.amount)}
                            </span>

                            {/* Remove */}
                            <button
                              onClick={() => removeTransaction(i)}
                              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 3: Importing ──────────────────────────── */}
                  {step === "importing" && (
                    <motion.div
                      key="importing"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-10 flex flex-col items-center gap-6"
                    >
                      <div className="relative w-20 h-20">
                        <svg
                          className="w-20 h-20 -rotate-90"
                          viewBox="0 0 80 80"
                        >
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="hsl(var(--secondary))"
                            strokeWidth="4"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 36 * (1 - importProgress / 100)
                            }`}
                            className="transition-all duration-300"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                          {importProgress}%
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Adding {selectedCount} transactions...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This won't take long
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 4: Done ───────────────────────────────── */}
                  {step === "done" && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-10 flex flex-col items-center gap-5"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          bounce: 0.5,
                          delay: 0.1,
                        }}
                        className="w-16 h-16 rounded-2xl bg-[hsl(142_71%_45%/0.1)] flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-8 h-8 text-[hsl(142_71%_45%)]" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-base font-bold text-foreground">
                          All done! 🎉
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-semibold text-foreground">
                            {importedCount}
                          </span>{" "}
                          transactions have been added to your wallet.
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="mt-2 px-6 py-2.5 rounded-lg gradient-primary text-white font-medium text-sm shadow-lg shadow-[hsl(217_91%_60%/0.2)] hover:shadow-[hsl(217_91%_60%/0.3)] transition-shadow"
                      >
                        View Transactions
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer (only in review step) */}
              {step === "review" && (
                <div className="p-5 border-t border-border shrink-0 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    {parseResult?.parsedVia === "ai" ? (
                      <>
                        <Bot className="w-3 h-3 text-[hsl(142_71%_45%)]" />
                        AI-extracted with categories · click to change
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-primary" />
                        Categories auto-detected · click to change
                      </>
                    )}
                  </p>
                  <button
                    onClick={handleImport}
                    disabled={selectedCount === 0 || bulkAdd.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg shadow-[hsl(217_91%_60%/0.2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[hsl(217_91%_60%/0.3)]"
                  >
                    {bulkAdd.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Import {selectedCount} Transactions
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
