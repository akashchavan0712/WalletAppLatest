import * as pdfjsLib from "pdfjs-dist";
import Papa from "papaparse";

// Use CDN worker for pdfjs — works on Netlify without bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ─── Types ───────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  confidence: "high" | "medium" | "low";
  originalLine?: string; // raw text for debugging
  selected: boolean; // user can toggle include/exclude
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  source: "pdf" | "csv";
  fileName: string;
  warnings: string[];
}

// ─── Category Keyword Engine ─────────────────────────────────────────

interface CategoryRule {
  category: string;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "Food & Dining",
    keywords: [
      "swiggy", "zomato", "dominos", "mcdonald", "mcdonalds", "burger king",
      "kfc", "pizza hut", "subway", "starbucks", "cafe", "restaurant",
      "food", "dining", "eat", "biryani", "chai", "bakery", "barbeque",
      "haldiram", "bikanervala", "dunkin", "baskin", "ice cream",
      "zepto", "blinkit", "instamart", "bigbasket", "grofers", "grocery",
      "dmart", "supermarket", "fresh", "meat", "vegetables",
    ],
  },
  {
    category: "Shopping",
    keywords: [
      "amazon", "flipkart", "myntra", "ajio", "meesho", "snapdeal",
      "nykaa", "tata cliq", "croma", "reliance digital", "vijay sales",
      "mall", "shop", "store", "mart", "retail", "purchase",
      "decathlon", "h&m", "zara", "uniqlo", "lifestyle",
    ],
  },
  {
    category: "Transport",
    keywords: [
      "uber", "ola", "rapido", "auto", "cab", "taxi", "ride",
      "petrol", "diesel", "fuel", "hp petrol", "indian oil", "bharat petroleum",
      "irctc", "railway", "train", "metro", "bus", "redbus",
      "indigo", "spicejet", "air india", "vistara", "flight", "airline",
      "parking", "toll", "fastag",
    ],
  },
  {
    category: "Entertainment",
    keywords: [
      "netflix", "spotify", "hotstar", "disney", "prime video", "amazon prime",
      "youtube", "zee5", "sonyliv", "jiocinema", "mubi",
      "bookmyshow", "pvr", "inox", "movie", "cinema", "theatre",
      "game", "gaming", "steam", "playstation", "xbox",
    ],
  },
  {
    category: "Housing",
    keywords: [
      "rent", "maintenance", "society", "housing", "flat", "apartment",
      "broker", "deposit", "landlord", "pg ", "hostel",
      "furniture", "ikea", "home centre", "pepperfry", "urban ladder",
    ],
  },
  {
    category: "Bills & Utilities",
    keywords: [
      "electricity", "electric", "power", "bescom", "tata power", "adani",
      "airtel", "jio", "vodafone", "vi ", "bsnl", "recharge", "mobile",
      "wifi", "broadband", "internet", "act fibernet",
      "water", "gas", "piped gas", "lpg", "cylinder",
      "postpaid", "prepaid", "bill pay", "dth", "tata sky",
    ],
  },
  {
    category: "Healthcare",
    keywords: [
      "apollo", "pharmacy", "pharma", "medical", "medicine", "medic",
      "hospital", "clinic", "doctor", "dr ", "dental", "dentist",
      "diagnostic", "lab", "test", "pathology", "netmeds", "1mg",
      "practo", "healthian", "gym", "fitness", "cult.fit", "cure.fit",
      "insurance", "health insurance",
    ],
  },
  {
    category: "Education",
    keywords: [
      "school", "college", "university", "tuition", "coaching",
      "udemy", "coursera", "unacademy", "byju", "vedantu",
      "book", "stationery", "exam", "fee",
    ],
  },
  {
    category: "Salary",
    keywords: [
      "salary", "payroll", "wages", "stipend",
    ],
  },
  {
    category: "Freelancing",
    keywords: [
      "freelance", "consulting", "project payment", "invoice",
    ],
  },
];

export function categorizeTransaction(
  description: string,
  userCategories?: Array<{ name: string; keywords?: string[] }>
): { category: string; confidence: "high" | "medium" | "low" } {
  const desc = description.toLowerCase().trim();

  // Try user-defined categories first (if any have custom keyword matching)
  if (userCategories) {
    for (const uc of userCategories) {
      if (desc.includes(uc.name.toLowerCase())) {
        return { category: uc.name, confidence: "high" };
      }
    }
  }

  // Try built-in rules
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (desc.includes(keyword)) {
        return { category: rule.category, confidence: "high" };
      }
    }
  }

  // Heuristic: if description has UPI-style merchant patterns
  const upiMatch = desc.match(/(?:upi[/-])([a-z0-9.]+)/);
  if (upiMatch) {
    const merchant = upiMatch[1];
    for (const rule of CATEGORY_RULES) {
      for (const keyword of rule.keywords) {
        if (merchant.includes(keyword)) {
          return { category: rule.category, confidence: "medium" };
        }
      }
    }
  }

  // Check if it looks like income
  const incomePatterns = [
    /(?:credit|credited|cr\b|received|refund|cashback|neft\s*cr|imps\s*cr|rtgs\s*cr)/i
  ];
  for (const p of incomePatterns) {
    if (p.test(desc)) {
      return { category: "Income", confidence: "low" };
    }
  }

  return { category: "Miscellaneous", confidence: "low" };
}

// ─── Date Parsing ────────────────────────────────────────────────────

const DATE_PATTERNS = [
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/,
  // DD/MM/YY or DD-MM-YY
  /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})\b/,
  // YYYY-MM-DD (ISO)
  /(\d{4})-(\d{2})-(\d{2})/,
  // DD Mon YYYY or DD-Mon-YYYY (e.g., 15 Jan 2024, 15-Jan-2024)
  /(\d{1,2})[\s\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-,]*(\d{4})/i,
  // Mon DD, YYYY
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s]+(\d{1,2})[\s,]*(\d{4})/i,
];

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    // ISO format: YYYY-MM-DD
    if (pattern === DATE_PATTERNS[2]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    // DD Mon YYYY
    if (pattern === DATE_PATTERNS[3]) {
      const day = match[1].padStart(2, "0");
      const month = MONTH_MAP[match[2].toLowerCase().slice(0, 3)];
      const year = match[3];
      if (month) return `${year}-${month}-${day}`;
    }

    // Mon DD, YYYY
    if (pattern === DATE_PATTERNS[4]) {
      const month = MONTH_MAP[match[1].toLowerCase().slice(0, 3)];
      const day = match[2].padStart(2, "0");
      const year = match[3];
      if (month) return `${year}-${month}-${day}`;
    }

    // DD/MM/YY
    if (pattern === DATE_PATTERNS[1]) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      let year = match[3];
      const yearNum = parseInt(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
      if (parseInt(month) >= 1 && parseInt(month) <= 12) {
        return `${year}-${month}-${day}`;
      }
    }

    // DD/MM/YYYY
    if (pattern === DATE_PATTERNS[0]) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      if (parseInt(month) >= 1 && parseInt(month) <= 12) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  return null;
}

// ─── Amount Parsing ──────────────────────────────────────────────────

function parseAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, "");

  // 1. Try explicit currency symbols first (highest confidence)
  const explicitMatch = cleaned.match(/(?:₹|rs\.?|inr)\s*([\d]+(?:\.\d{1,2})?)/i);
  if (explicitMatch) {
    const num = parseFloat(explicitMatch[1]);
    if (num > 0 && num < 10000000) return num;
  }

  // 2. Try looking for amounts at the end of the line (bank statements right-align amounts)
  const endMatch = cleaned.match(/[\s]([\d]+(?:\.\d{1,2})?)(?:[ \t]*(?:cr|dr|credit|debit))?$/i);
  if (endMatch) {
    const num = parseFloat(endMatch[1]);
    if (num > 0 && num < 10000000) return num;
  }

  // 3. Prevent extracting times (e.g. 08:45 AM -> 45) or dates
  let noTime = cleaned.replace(/\b\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\b/gi, "");
  // Prevent extracting long IDs
  noTime = noTime.replace(/\b\d{6,}\b/g, "");

  const fallbackPatterns = [
    /([\d]+(?:\.\d{1,2})?)/g,
  ];

  const amounts: number[] = [];
  let match;
  while ((match = fallbackPatterns[0].exec(noTime)) !== null) {
    const num = parseFloat(match[1]);
    // Ignore exactly 4 digit numbers that look like years (2010-2030) if there are other candidates
    if (num > 0 && num < 10000000) {
      amounts.push(num);
    }
  }

  // Also filter out years if there is more than 1 candidate to avoid picking dates over small amounts
  let filtered = amounts.filter((a) => a > 0);
  if (filtered.length > 1) {
    filtered = filtered.filter(a => !(a >= 2000 && a <= 2040 && Number.isInteger(a)));
  }

  if (filtered.length === 0) return null;

  // Prioritize numbers that have decimals (amounts usually have cents)
  const withDecimals = filtered.filter(a => !Number.isInteger(a));
  if (withDecimals.length > 0) {
    // If multiple decimals, pick the last one (rightmost)
    return withDecimals[withDecimals.length - 1];
  }

  // If no explicit symbol, no end-of-line match, and no decimals, pick the LAST number
  // (Bank statements format amounts on the far right column)
  return filtered[filtered.length - 1];
}

// ─── Transaction Type Detection ──────────────────────────────────────

function detectType(text: string): "income" | "expense" {
  const lower = text.toLowerCase();

  const creditPatterns = [
    /\bcr\b/i, /\bcredit\b/i, /\bcredited\b/i, /\breceived(?: from)?\b/i,
    /\brefund\b/i, /\bcashback\b/i, /\binward\b/i,
    /neft\s*cr/i, /imps\s*cr/i, /rtgs\s*cr/i,
  ];

  for (const p of creditPatterns) {
    if (p.test(lower)) return "income";
  }

  return "expense";
}

// ─── PDF Parsing ─────────────────────────────────────────────────────

async function extractPDFText(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y position to reconstruct lines, allowing a 4px tolerance
    const itemsByY: Array<{ y: number; items: Array<{ x: number; text: string }> }> = [];

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const text = (item as any).str.trim();
      if (!text) continue;

      const y = Math.round((item as any).transform[5]);
      const x = (item as any).transform[4];

      // Find a bucket within a 4px difference
      let bucket = itemsByY.find(b => Math.abs(b.y - y) <= 4);
      if (!bucket) {
        bucket = { y, items: [] };
        itemsByY.push(bucket);
      }
      bucket.items.push({ x, text });
    }

    // Sort buckets by Y descending (top to bottom)
    itemsByY.sort((a, b) => b.y - a.y);

    for (const bucket of itemsByY) {
      const lineItems = bucket.items.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map((i) => i.text).join(" ").trim();
      if (lineText.length > 0) {
        lines.push(lineText);
      }
    }
  }

  return lines;
}

export async function parsePDF(file: File): Promise<ParseResult> {
  const warnings: string[] = [];
  const lines = await extractPDFText(file);

  if (lines.length === 0) {
    warnings.push("No text could be extracted. This PDF may be a scanned image.");
    return { transactions: [], source: "pdf", fileName: file.name, warnings };
  }

  const transactions: ParsedTransaction[] = [];
  let currentDate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : "";

    // Try to find a date in this line
    const dateInLine = parseDate(line);

    // Strict sub-line prevention: In bank statements and Google Pay, 
    // a valid transaction block almost always starts with a Date.
    // If the line lacks a Date, it's likely a sub-line (e.g. "UPI Transaction ID").
    // We only proceed if there's a Date OR an explicit currency symbol indicating a floating amount.
    const hasExplicitCurrency = /(?:₹|rs\.?|inr)/i.test(line);
    if (!dateInLine && !hasExplicitCurrency) {
      continue;
    }

    if (dateInLine) {
      currentDate = dateInLine;
    }

    // Try to extract an amount
    // We need at least a date and an amount to make a transaction
    const amount = parseAmount(line);
    if (amount === null || amount <= 0.01) continue;

    // Skip lines that look like balance/header rows or useless sub-lines
    const skipPatterns = [
      /opening balance/i, /closing balance/i, /available balance/i,
      /^total$/i, /total amount due/i, /page\s+\d/i, /statement of account/i, 
      /account\s*no\./i, /branch code/i, /ifsc code/i, /customer\s*id/i,
      /upi transaction id/i, /^paid by/i, /^debited from/i, /^credited to/i,
    ];
    if (skipPatterns.some((p) => p.test(line.trim()))) continue;

    // Use the current date or try to find one
    const txDate = dateInLine || currentDate;
    if (!txDate) continue;

    // Extract description: remove date and amount portions
    let description = line;
    // Remove date portion
    for (const pattern of DATE_PATTERNS) {
      description = description.replace(pattern, "").trim();
    }
    // Remove amount-like numbers at the end
    description = description
      .replace(/[\d,]+\.\d{2}\s*(cr|dr)?$/gi, "")
      .replace(/₹\s*[\d,]+/g, "")
      .replace(/rs\.?\s*[\d,]+/gi, "")
      .trim();

    // Clean up description
    description = description
      .replace(/\s+/g, " ")
      .replace(/^[\-\|\/]+/, "")
      .replace(/[\-\|\/]+$/, "")
      .trim();

    if (description.length < 2) {
      // Try next line as description
      description = nextLine.replace(/[\d,]+\.\d{2}/g, "").trim();
    }

    if (description.length < 2) {
      description = `Transaction on ${txDate}`;
    }

    // Detect type
    const type = detectType(line);

    // Auto-categorize
    const { category, confidence } = categorizeTransaction(description);

    // For income detected by type, override category if it was misc
    const finalCategory = type === "income" && category === "Miscellaneous"
      ? "Income"
      : category;

    transactions.push({
      date: txDate,
      description: description.slice(0, 100), // cap length
      amount,
      type,
      category: finalCategory,
      confidence,
      originalLine: line,
      selected: true,
    });
  }

  // Deduplicate: same date + amount + description
  const seen = new Set<string>();
  const deduped = transactions.filter((tx) => {
    const key = `${tx.date}-${tx.amount}-${tx.description.slice(0, 20)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0 && lines.length > 0) {
    warnings.push(
      "Text was extracted but no transactions could be parsed. " +
      "The format may not be supported yet."
    );
  }

  return {
    transactions: deduped,
    source: "pdf",
    fileName: file.name,
    warnings,
  };
}

// ─── CSV Parsing ─────────────────────────────────────────────────────

// Common column header aliases across bank/UPI CSV exports
const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["date", "transaction date", "txn date", "value date", "posting date", "trans date", "transaction_date"],
  amount: ["amount", "debit amount", "credit amount", "transaction amount", "txn amount", "withdrawal", "deposit", "debit", "credit", "amount (inr)", "transaction_amount"],
  description: ["description", "narration", "particulars", "detail", "details", "remark", "remarks", "transaction details", "transaction_description", "note", "reference"],
  type: ["type", "transaction type", "txn type", "cr/dr", "dr/cr", "transaction_type"],
  debit: ["debit", "debit amount", "withdrawal", "debit_amount"],
  credit: ["credit", "credit amount", "deposit", "credit_amount"],
};

function findColumn(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().trim() === alias.toLowerCase()
    );
    if (idx !== -1) return idx;
  }
  // Partial match fallback
  for (const alias of aliases) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().trim().includes(alias.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

export async function parseCSV(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length < 2) {
          resolve({
            transactions: [],
            source: "csv",
            fileName: file.name,
            warnings: ["CSV file is empty or has no data rows."],
          });
          return;
        }

        // Find header row (first row with recognizable column names)
        let headerRowIdx = 0;
        let headers: string[] = [];
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const row = rows[i];
          const hasDate = row.some((cell) =>
            COLUMN_ALIASES.date.some((a) =>
              cell.toLowerCase().trim().includes(a)
            )
          );
          if (hasDate) {
            headerRowIdx = i;
            headers = row.map((h) => h.trim());
            break;
          }
        }

        if (headers.length === 0) {
          headers = rows[0].map((h) => h.trim());
        }

        const dateCol = findColumn(headers, COLUMN_ALIASES.date);
        const descCol = findColumn(headers, COLUMN_ALIASES.description);
        const amountCol = findColumn(headers, COLUMN_ALIASES.amount);
        const typeCol = findColumn(headers, COLUMN_ALIASES.type);
        const debitCol = findColumn(headers, COLUMN_ALIASES.debit);
        const creditCol = findColumn(headers, COLUMN_ALIASES.credit);

        if (dateCol === -1) {
          warnings.push("Could not find a 'Date' column. Check your CSV format.");
        }

        const transactions: ParsedTransaction[] = [];

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 2) continue;

          // Parse date
          let date: string | null = null;
          if (dateCol !== -1 && row[dateCol]) {
            date = parseDate(row[dateCol]);
          }
          if (!date) {
            // Try to find date in any cell
            for (const cell of row) {
              date = parseDate(cell);
              if (date) break;
            }
          }
          if (!date) continue;

          // Parse amount and type
          let amount: number | null = null;
          let type: "income" | "expense" = "expense";

          if (debitCol !== -1 && creditCol !== -1) {
            // Separate debit/credit columns
            const debitAmt = parseAmount(row[debitCol] || "");
            const creditAmt = parseAmount(row[creditCol] || "");
            if (creditAmt && creditAmt > 0) {
              amount = creditAmt;
              type = "income";
            } else if (debitAmt && debitAmt > 0) {
              amount = debitAmt;
              type = "expense";
            }
          } else if (amountCol !== -1) {
            amount = parseAmount(row[amountCol] || "");
            // Check type column or detect from text
            if (typeCol !== -1 && row[typeCol]) {
              type = /cr|credit|deposit/i.test(row[typeCol]) ? "income" : "expense";
            } else {
              type = detectType(row.join(" "));
            }
          }

          if (!amount || amount <= 0.01) continue;

          // Parse description
          let description = descCol !== -1 ? (row[descCol] || "").trim() : "";
          if (!description) {
            // Use all non-date, non-amount cells as description
            description = row
              .filter((_, idx) => idx !== dateCol && idx !== amountCol && idx !== debitCol && idx !== creditCol)
              .join(" ")
              .trim();
          }
          if (!description) description = `Transaction on ${date}`;

          const { category, confidence } = categorizeTransaction(description);
          const finalCategory = type === "income" && category === "Miscellaneous"
            ? "Income"
            : category;

          transactions.push({
            date,
            description: description.slice(0, 100),
            amount,
            type,
            category: finalCategory,
            confidence,
            originalLine: row.join(","),
            selected: true,
          });
        }

        if (transactions.length === 0 && rows.length > 1) {
          warnings.push(
            "Rows were found but no transactions could be parsed. Check column headers."
          );
        }

        resolve({
          transactions,
          source: "csv",
          fileName: file.name,
          warnings,
        });
      },
      error: (error: Error) => {
        resolve({
          transactions: [],
          source: "csv",
          fileName: file.name,
          warnings: [`CSV parsing error: ${error.message}`],
        });
      },
    });
  });
}

// ─── Main Parse Function ─────────────────────────────────────────────

export async function parseStatement(file: File): Promise<ParseResult> {
  const ext = file.name.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    return parsePDF(file);
  }
  if (ext === "csv") {
    return parseCSV(file);
  }

  return {
    transactions: [],
    source: "csv",
    fileName: file.name,
    warnings: [`Unsupported file format: .${ext}. Please upload a PDF or CSV file.`],
  };
}

// ─── Available Categories (for the edit dropdown) ────────────────────

export const ALL_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transport",
  "Entertainment",
  "Housing",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Salary",
  "Freelancing",
  "Business",
  "Income",
  "Miscellaneous",
];
