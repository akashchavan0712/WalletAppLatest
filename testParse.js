function parseAmount(text) {
  const cleaned = text.replace(/,/g, "");

  const explicitMatch = cleaned.match(/(?:₹|rs\.?|inr)\s*([\d]+(?:\.\d{1,2})?)/i);
  if (explicitMatch) {
    const num = parseFloat(explicitMatch[1]);
    if (num > 0 && num < 10000000) return num;
  }

  const endMatch = cleaned.match(/[\s]([\d]+(?:\.\d{1,2})?)(?:[ \t]*(?:cr|dr|credit|debit))?$/i);
  if (endMatch) {
    const num = parseFloat(endMatch[1]);
    if (num > 0 && num < 10000000) return num;
  }

  let noTime = cleaned.replace(/\b\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\b/gi, "");
  noTime = noTime.replace(/\b\d{6,}\b/g, "");

  const fallbackPatterns = [
    /([\d]+(?:\.\d{1,2})?)/g,
  ];

  const amounts = [];
  let match;
  while ((match = fallbackPatterns[0].exec(noTime)) !== null) {
    const num = parseFloat(match[1]);
    if (num > 0 && num < 10000000) {
      amounts.push(num);
    }
  }

  let filtered = amounts.filter((a) => a > 0); // changed to > 0 to see if it fixes
  if (filtered.length > 1) {
    filtered = filtered.filter(a => !(a >= 2000 && a <= 2040 && Number.isInteger(a)));
  }

  if (filtered.length === 0) return null;

  const withDecimals = filtered.filter(a => !Number.isInteger(a));
  if (withDecimals.length > 0) {
    return withDecimals[withDecimals.length - 1];
  }

  return filtered[filtered.length - 1];
}

console.log("1. 'Paid to Swiggy 25.51':", parseAmount("Paid to Swiggy 25.51"));
console.log("2. '01 Mar 2026 Zomato ₹25.51':", parseAmount("01 Mar 2026 Zomato ₹25.51"));
console.log("3. '01/03/26 12:45 UPI Trx 100':", parseAmount("01/03/26 12:45 UPI Trx 100"));
console.log("4. 'Received from John 0.75':", parseAmount("Received from John 0.75"));
console.log("5. '01 Mar, 2026 Paid to APPLE MEDIA SERVICES ₹169':", parseAmount("01 Mar, 2026 Paid to APPLE MEDIA SERVICES ₹169"));
