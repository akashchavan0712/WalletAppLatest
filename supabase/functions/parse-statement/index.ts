import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ─── CORS ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ───────────────────────────────────────────────────────────

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("Authorization");
  if (!h) return null;
  const [scheme, token] = h.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function verifyUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { data, error } = await sb.auth.getUser(token);
  return error || !data?.user ? null : data.user;
}

function stripDataUrl(b64: string): string {
  const idx = b64.indexOf(",");
  if (idx !== -1 && b64.slice(0, idx).includes("base64")) {
    return b64.slice(idx + 1);
  }
  return b64;
}

// ─── Gemini Integration ──────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are an expert Indian financial document parser. You will receive a PDF of a bank statement, UPI export, or credit card statement.

Your task: Extract EVERY transaction row from the document and return structured JSON.

IMPORTANT RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no code fences.
2. Use this exact shape:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "merchant or narration text",
      "amount": 123.45,
      "type": "income" | "expense",
      "category": "category name"
    }
  ]
}

DATE RULES:
- Convert ALL dates to YYYY-MM-DD format.
- Indian formats like DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY are common — handle them.
- If only month/year available, use the 1st of the month.

AMOUNT RULES:
- amount must be a positive number (never negative).
- Use "type" to distinguish income vs expense.
- Ignore opening/closing balance rows — only extract actual transactions.
- If columns show Debit and Credit separately, use the non-empty one and set type accordingly.
- Credit / CR / Credited / Received / Refund / Cashback → type: "income"
- Debit / DR / Debited / Paid / Sent → type: "expense"

CATEGORY RULES — assign one of these categories based on the merchant/description:
- "Food & Dining" — Swiggy, Zomato, restaurants, cafes, grocery, Zepto, Blinkit, BigBasket
- "Shopping" — Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, retail stores
- "Transport" — Uber, Ola, Rapido, petrol, IRCTC, metro, flights, parking, toll
- "Entertainment" — Netflix, Spotify, Hotstar, BookMyShow, PVR, gaming
- "Housing" — Rent, maintenance, society, furniture, home items
- "Bills & Utilities" — Electricity, mobile recharge, broadband, gas, DTH, Airtel, Jio
- "Healthcare" — Pharmacy, hospital, doctor, gym, insurance, 1mg, Practo
- "Education" — School, college, Udemy, Coursera, books, exam fees
- "Salary" — Salary, payroll, wages, stipend
- "Freelancing" — Freelance payments, consulting, invoices
- "Income" — Other credits, refunds, cashback, interest received
- "Miscellaneous" — Anything that doesn't fit above

SKIP THESE (do NOT include as transactions):
- Opening/closing balance lines
- Page headers, footers, account summaries
- "Total" or "Grand Total" rows
- Account number, IFSC, branch information
- Statement period headers

Extract ALL transactions — do not skip any valid transaction row.`;

function cleanAIJsonResponse(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/,\s*([}\]])/g, "$1");
}

function parseAIJsonResponse(text: string): Record<string, unknown> {
  const cleaned = cleanAIJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse Gemini response as JSON");
    return JSON.parse(match[0].replace(/,\s*([}\]])/g, "$1"));
  }
}

async function callGemini(base64Pdf: string): Promise<Transaction[]> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("Missing GEMINI_API_KEY secret");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Low for deterministic extraction
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();

  // Extract text from response
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.parts?.find(
      (p: Record<string, unknown>) => typeof p?.text === "string"
    )?.text;

  if (typeof text !== "string") {
    throw new Error("Gemini returned no text content");
  }

  const parsed = parseAIJsonResponse(text);
  const txArray = parsed?.transactions;
  if (!Array.isArray(txArray)) {
    throw new Error("Response missing 'transactions' array");
  }

  // Validate and normalize
  const VALID_CATEGORIES = new Set([
    "Food & Dining", "Shopping", "Transport", "Entertainment",
    "Housing", "Bills & Utilities", "Healthcare", "Education",
    "Salary", "Freelancing", "Income", "Miscellaneous",
  ]);

  const transactions: Transaction[] = [];

  for (const raw of txArray) {
    if (!raw || typeof raw !== "object") continue;

    const t = raw as Record<string, unknown>;
    const type = t.type;
    const date = t.date;
    const description = t.description;
    const amount = t.amount;
    const category = t.category;

    // Type guard
    if (type !== "income" && type !== "expense") continue;
    if (typeof date !== "string" || date.length < 8) continue;
    if (typeof description !== "string" || description.length < 1) continue;

    const amountNum =
      typeof amount === "number" ? amount : Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) continue;

    // Normalize category
    const cat =
      typeof category === "string" && VALID_CATEGORIES.has(category)
        ? category
        : "Miscellaneous";

    transactions.push({
      date,
      description: description.slice(0, 120),
      amount: Math.round(amountNum * 100) / 100, // 2 decimal places
      type,
      category: cat,
    });
  }

  return transactions;
}

// ─── Main Handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Auth check (temporarily bypassed for testing)
    const token = getBearerToken(req);
    console.log("Request token present:", !!token);

    // 2. Parse body
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON body" }, 400);

    const raw = body.base64_pdf ?? body.base64 ?? body.pdf_base64;
    if (typeof raw !== "string" || raw.length < 100) {
      return json({ error: "Missing or invalid base64_pdf field" }, 400);
    }

    // 3. Call Gemini
    const base64Pdf = stripDataUrl(raw);
    const transactions = await callGemini(base64Pdf);

    return json({ transactions, count: transactions.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("parse-statement error:", message);
    return json({ error: message }, 500);
  }
});
