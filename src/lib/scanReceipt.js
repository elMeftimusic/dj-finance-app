// ─── AI Receipt Scanner ────────────────────────────────────────────────────
// Sends a receipt image to Claude and extracts structured expense data.
// Requires REACT_APP_ANTHROPIC_API_KEY in your environment variables.

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || "";

export function isScanningAvailable() {
  return Boolean(API_KEY);
}

/**
 * Analyze a receipt image and return extracted fields.
 * @param {File} file - The image file (jpeg, png, webp, gif)
 * @returns {Promise<{ vendor, date, amount, vat, category, confidence }>}
 */
export async function scanReceipt(file) {
  if (!API_KEY) throw new Error("No Anthropic API key configured");

  // Convert file to base64
  const base64 = await fileToBase64(file);
  const mediaType = file.type || "image/jpeg";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: `You are analyzing a receipt or invoice image for a German DJ's expense tracking app.

Extract the following information and respond ONLY with a valid JSON object, no explanation:

{
  "vendor": "name of the store or supplier",
  "date": "YYYY-MM-DD format (today if unclear: ${new Date().toISOString().split("T")[0]})",
  "totalAmount": <total amount as a number, including VAT if shown>,
  "vatAmount": <VAT/MwSt amount as a number, or null if not shown>,
  "category": <one of: "Equipment", "Software", "Travel", "Accommodation", "Marketing", "Music / Samples", "Studio", "Clothing / Costume", "Phone / Internet", "Accountant", "Other">,
  "confidence": <"high", "medium", or "low" based on how clearly you could read the receipt>
}

Rules:
- All amounts must be numbers (not strings), in euros
- If the receipt shows Brutto (gross/total) and Netto, use the Brutto as totalAmount
- If you cannot read the receipt clearly, use your best guess and set confidence to "low"
- The category should match what a DJ would buy for business`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse receipt data from Claude response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    vendor: parsed.vendor || "",
    date: parsed.date || new Date().toISOString().split("T")[0],
    amount: parsed.totalAmount != null ? String(parsed.totalAmount) : "",
    vat: parsed.vatAmount != null ? String(parsed.vatAmount) : "",
    category: parsed.category || "Other",
    confidence: parsed.confidence || "medium",
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data:image/...;base64, prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
