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

AMOUNT RULES:
- amount must be a positive number (never negative).
- Use "type" to distinguish income vs expense.

CATEGORY RULES:
- "Food & Dining", "Shopping", "Transport", "Entertainment", "Housing", "Bills & Utilities", "Healthcare", "Education", "Salary", "Freelancing", "Income", "Miscellaneous".`;

function cleanAIJsonResponse(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/,\s*([}\]])/g, "$1");
}

function parseAIJsonResponse(text: string): { transactions?: unknown } {
  const cleaned = cleanAIJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse Gemini response as JSON");
    return JSON.parse(match[0].replace(/,\s*([}\]])/g, "$1"));
  }
}

export default async (req: Request) => {
  // Handle Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const base64Pdf = body.base64_pdf;

    if (!base64Pdf) {
      return new Response(JSON.stringify({ error: "Missing base64_pdf" }), { status: 400 });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY setup in Netlify" }), { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    
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
          temperature: 0.1,
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
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => typeof p?.text === "string"
      )?.text;

    if (typeof text !== "string") {
      throw new Error("Gemini returned no text content");
    }

    const parsed = parseAIJsonResponse(text);

    const txArray = parsed?.transactions || [];
    const transactions = txArray
      .filter((t: any) => t && typeof t === "object" && (t.type === "income" || t.type === "expense") && t.date && t.amount > 0)
      .map((t: any) => ({
        date: t.date,
        description: t.description.slice(0, 120),
        amount: Math.round(t.amount * 100) / 100,
        type: t.type,
        category: t.category || "Miscellaneous",
      }));

    return new Response(JSON.stringify({ transactions }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Netlify Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
};
