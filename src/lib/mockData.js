// ─── Mock / Demo Data ──────────────────────────────────────────────────────
// Used when the app is in demo mode (no Google credentials configured)

export const MOCK_TRANSACTIONS = [];

export const MOCK_INVOICES = [];

export const MOCK_TAX_QUARTERS = [
  { quarter: "Q1", year: "2026", deadline: "2026-05-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 0, actualAmount: 0 },
  { quarter: "Q2", year: "2026", deadline: "2026-08-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 0, actualAmount: 0 },
  { quarter: "Q3", year: "2026", deadline: "2026-11-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 0, actualAmount: 0 },
  { quarter: "Q4", year: "2026", deadline: "2027-02-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 0, actualAmount: 0 },
];

export const MOCK_RECEIPTS = [];

export const EXPENSE_CATEGORIES = [
  "Equipment", "Software", "Travel", "Accommodation", "Marketing",
  "Music / Samples", "Studio", "Clothing / Costume", "Phone / Internet",
  "Accountant", "Other",
];

export const INCOME_CATEGORIES = [
  "Gig Fee", "Residency", "Teaching / Workshop", "Streaming Royalties",
  "Merchandise", "Other",
];
