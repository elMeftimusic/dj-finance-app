// ─── Mock / Demo Data ──────────────────────────────────────────────────────
// Used when the app is in demo mode (no Google credentials configured)

export const MOCK_TRANSACTIONS = [
  { id: "TX-1", type: "income", date: "2026-01-15", amount: 800, vat: 152, description: "Gig – Club Tresor Berlin", category: "Gig Fee", quarter: "Q1", receiptId: "" },
  { id: "TX-2", type: "income", date: "2026-02-03", amount: 600, vat: 114, description: "Gig – Private Party Hamburg", category: "Gig Fee", quarter: "Q1", receiptId: "" },
  { id: "TX-3", type: "expense", date: "2026-01-20", amount: 120, vat: 22.8, description: "Headphones replacement", category: "Equipment", quarter: "Q1", receiptId: "" },
  { id: "TX-4", type: "expense", date: "2026-02-14", amount: 45, vat: 0, description: "Train – Hamburg", category: "Travel", quarter: "Q1", receiptId: "" },
  { id: "TX-5", type: "income", date: "2026-03-10", amount: 1200, vat: 228, description: "Gig – Festival Booking", category: "Gig Fee", quarter: "Q1", receiptId: "" },
  { id: "TX-6", type: "expense", date: "2026-03-22", amount: 299, vat: 56.81, description: "Ableton Live subscription", category: "Software", quarter: "Q1", receiptId: "" },
  { id: "TX-7", type: "income", date: "2026-04-05", amount: 950, vat: 180.5, description: "Gig – Bar25 Residency", category: "Gig Fee", quarter: "Q2", receiptId: "" },
  { id: "TX-8", type: "expense", date: "2026-04-10", amount: 80, vat: 15.2, description: "DJ Cable set", category: "Equipment", quarter: "Q2", receiptId: "" },
];

export const MOCK_INVOICES = [
  { id: "INV-001", date: "2026-01-15", client: "Club Tresor Berlin", clientAddress: "Köpenicker Str. 70, 10179 Berlin", description: "DJ Set – 5h – Closing Night", netAmount: 800, vat: 152, total: 952, status: "paid", notes: "" },
  { id: "INV-002", date: "2026-02-03", client: "Private Party Hamburg", clientAddress: "Reeperbahn 1, 20359 Hamburg", description: "DJ Set – 3h – Private Event", netAmount: 600, vat: 114, total: 714, status: "paid", notes: "" },
  { id: "INV-003", date: "2026-03-10", client: "Festival Booking GmbH", clientAddress: "Münchener Str. 12, 80335 München", description: "DJ Set – 2h – Main Stage", netAmount: 1200, vat: 228, total: 1428, status: "paid", notes: "" },
  { id: "INV-004", date: "2026-04-05", client: "Bar25 Residency", clientAddress: "Holzmarktstr. 25, 10243 Berlin", description: "Monthly Residency – April", netAmount: 950, vat: 180.5, total: 1130.5, status: "pending", notes: "" },
];

export const MOCK_TAX_QUARTERS = [
  { quarter: "Q1", year: "2026", deadline: "2026-05-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 414.39, actualAmount: 0 },
  { quarter: "Q2", year: "2026", deadline: "2026-08-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 165.3, actualAmount: 0 },
  { quarter: "Q3", year: "2026", deadline: "2026-11-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 0, actualAmount: 0 },
  { quarter: "Q4", year: "2026", deadline: "2027-02-10", voranmeldungFiled: false, paymentSent: false, estimatedAmount: 0, actualAmount: 0 },
];

export const MOCK_RECEIPTS = [
  { id: "receipt_1", name: "receipt_TX-3_saturn.jpg", createdTime: "2026-01-20", webViewLink: "#" },
  { id: "receipt_2", name: "receipt_TX-4_db_ticket.pdf", createdTime: "2026-02-14", webViewLink: "#" },
  { id: "receipt_3", name: "receipt_TX-6_ableton.pdf", createdTime: "2026-03-22", webViewLink: "#" },
];

export const EXPENSE_CATEGORIES = [
  "Equipment", "Software", "Travel", "Accommodation", "Marketing",
  "Music / Samples", "Studio", "Clothing / Costume", "Phone / Internet",
  "Accountant", "Other",
];

export const INCOME_CATEGORIES = [
  "Gig Fee", "Residency", "Teaching / Workshop", "Streaming Royalties",
  "Merchandise", "Other",
];
