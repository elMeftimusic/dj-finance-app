// ─── Google API Integration ────────────────────────────────────────────────
// This file handles all communication with Google Sheets (data) and
// Google Drive (receipt file uploads).
//
// SETUP: Copy .env.example to .env and fill in your credentials.
// See SETUP_GUIDE.md for step-by-step instructions.

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || "";
const DRIVE_FOLDER_ID = process.env.REACT_APP_DRIVE_FOLDER_ID || "";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

// Sheet names inside the Google Spreadsheet
export const SHEETS = {
  TRANSACTIONS: "Transactions",
  INVOICES: "Invoices",
  TAX_QUARTERS: "TaxQuarters",
  SETTINGS: "Settings",
};

// ─── Auth ──────────────────────────────────────────────────────────────────
let tokenClient = null;
let accessToken = null;

const AUTOSIGNIN_KEY = "djfinance_autosignin";

export function isConfigured() {
  return Boolean(CLIENT_ID && SPREADSHEET_ID);
}

export function isSignedIn() {
  return Boolean(accessToken);
}

export function hasAutoSignIn() {
  return localStorage.getItem(AUTOSIGNIN_KEY) === "1";
}

export async function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Identity Services not loaded"));
      return;
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {}, // set per-call below
    });
    resolve(tokenClient);
  });
}

// Attempt silent sign-in — no popup. Works if Google session cookie is still valid.
export function silentSignIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error("Auth not initialized")); return; }
    const timeout = setTimeout(() => reject(new Error("Silent sign-in timed out")), 5000);
    tokenClient.callback = (resp) => {
      clearTimeout(timeout);
      if (resp.error) { reject(resp); return; }
      accessToken = resp.access_token;
      scheduleTokenRefresh();
      resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

export function signIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error("Auth not initialized")); return; }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(resp); return; }
      accessToken = resp.access_token;
      localStorage.setItem(AUTOSIGNIN_KEY, "1");
      scheduleTokenRefresh();
      resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
}

// Auto-refresh token every 45 minutes (tokens last 60 min)
let refreshTimer = null;
function scheduleTokenRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try { await silentSignIn(); } catch { /* token expired, user will see disconnect */ }
  }, 45 * 60 * 1000);
}

export function signOut() {
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
  localStorage.removeItem(AUTOSIGNIN_KEY);
}

// ─── Sheets API Helpers ────────────────────────────────────────────────────
async function sheetsRequest(method, path, body = null) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Sheets API error: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Transactions ──────────────────────────────────────────────────────────
// Columns: id | type | date | amount | vat | description | category | quarter | receiptId

export async function getTransactions() {
  const data = await sheetsRequest("GET", `/values/${SHEETS.TRANSACTIONS}!A2:I`);
  const rows = data.values || [];
  return rows.map((r) => ({
    id: r[0],
    type: r[1],       // "income" | "expense"
    date: r[2],
    amount: parseFloat(r[3]) || 0,
    vat: parseFloat(r[4]) || 0,
    description: r[5] || "",
    category: r[6] || "",
    quarter: r[7] || "",
    receiptId: r[8] || "",
  }));
}

export async function addTransaction(tx) {
  const id = `TX-${Date.now()}`;
  const quarter = getQuarter(tx.date);
  const vatAmount = tx.type === "income" ? tx.amount * 0.19 : tx.vat || 0;
  const row = [id, tx.type, tx.date, tx.amount, vatAmount, tx.description, tx.category, quarter, tx.receiptId || ""];
  await sheetsRequest("POST", `/values/${SHEETS.TRANSACTIONS}!A:I:append?valueInputOption=RAW`, {
    values: [row],
  });
  return { ...tx, id, quarter, vat: vatAmount };
}

export async function deleteTransaction(id) {
  // Get all rows, find matching, clear it
  const data = await sheetsRequest("GET", `/values/${SHEETS.TRANSACTIONS}!A:A`);
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex < 1) return;
  await sheetsRequest("POST", `/values/${SHEETS.TRANSACTIONS}!A${rowIndex + 1}:I${rowIndex + 1}:clear`, {});
}

// ─── Invoices ──────────────────────────────────────────────────────────────
// Columns: id | date | client | clientAddress | description | netAmount | vat | total | status | notes

export async function getInvoices() {
  const data = await sheetsRequest("GET", `/values/${SHEETS.INVOICES}!A2:J`);
  const rows = data.values || [];
  return rows.map((r) => ({
    id: r[0],
    date: r[1],
    client: r[2] || "",
    clientAddress: r[3] || "",
    description: r[4] || "",
    netAmount: parseFloat(r[5]) || 0,
    vat: parseFloat(r[6]) || 0,
    total: parseFloat(r[7]) || 0,
    status: r[8] || "pending",
    notes: r[9] || "",
  }));
}

export async function addInvoice(inv) {
  // Auto-increment invoice number
  const existing = await getInvoices();
  const num = existing.length + 1;
  const id = `INV-${String(num).padStart(3, "0")}`;
  const vat = inv.netAmount * 0.19;
  const total = inv.netAmount + vat;
  const row = [id, inv.date, inv.client, inv.clientAddress || "", inv.description, inv.netAmount, vat, total, "pending", inv.notes || ""];
  await sheetsRequest("POST", `/values/${SHEETS.INVOICES}!A:J:append?valueInputOption=RAW`, {
    values: [row],
  });
  return { ...inv, id, vat, total };
}

export async function updateInvoiceStatus(id, status) {
  const data = await sheetsRequest("GET", `/values/${SHEETS.INVOICES}!A:A`);
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex < 1) return;
  await sheetsRequest("PUT", `/values/${SHEETS.INVOICES}!I${rowIndex + 1}?valueInputOption=RAW`, {
    values: [[status]],
  });
}

export async function deleteInvoice(id) {
  const data = await sheetsRequest("GET", `/values/${SHEETS.INVOICES}!A:A`);
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex < 1) return;
  await sheetsRequest("POST", `/values/${SHEETS.INVOICES}!A${rowIndex + 1}:J${rowIndex + 1}:clear`, {});
}

// ─── Tax Quarters ──────────────────────────────────────────────────────────
// Columns: quarter | year | deadline | voranmeldungFiled | paymentSent | estimatedAmount | actualAmount

export async function getTaxQuarters() {
  const data = await sheetsRequest("GET", `/values/${SHEETS.TAX_QUARTERS}!A2:G`);
  const rows = data.values || [];
  return rows.map((r) => ({
    quarter: r[0],
    year: r[1],
    deadline: r[2],
    voranmeldungFiled: r[3] === "TRUE",
    paymentSent: r[4] === "TRUE",
    estimatedAmount: parseFloat(r[5]) || 0,
    actualAmount: parseFloat(r[6]) || 0,
  }));
}

export async function updateTaxQuarter(quarter, year, field, value) {
  const data = await sheetsRequest("GET", `/values/${SHEETS.TAX_QUARTERS}!A:B`);
  const rows = data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === quarter && r[1] === year);
  if (rowIndex < 1) return;

  const colMap = {
    voranmeldungFiled: "D",
    paymentSent: "E",
    estimatedAmount: "F",
    actualAmount: "G",
  };
  const col = colMap[field];
  if (!col) return;
  const cellValue = typeof value === "boolean" ? String(value).toUpperCase() : value;
  await sheetsRequest("PUT", `/values/${SHEETS.TAX_QUARTERS}!${col}${rowIndex + 1}?valueInputOption=RAW`, {
    values: [[cellValue]],
  });
}

// ─── Drive File Upload ─────────────────────────────────────────────────────
export async function uploadReceipt(file, transactionId) {
  const metadata = {
    name: `receipt_${transactionId}_${file.name}`,
    parents: DRIVE_FOLDER_ID ? [DRIVE_FOLDER_ID] : [],
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  return res.json(); // { id, name, webViewLink }
}

export async function getReceipts() {
  if (!DRIVE_FOLDER_ID) return [];
  const query = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=createdTime desc`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

// ─── Spreadsheet Initialization ────────────────────────────────────────────
// Call once on first run to set up all sheet headers
export async function initializeSpreadsheet() {
  const headers = {
    [SHEETS.TRANSACTIONS]: [["ID", "Type", "Date", "Amount (Net)", "VAT", "Description", "Category", "Quarter", "Receipt ID"]],
    [SHEETS.INVOICES]: [["ID", "Date", "Client", "Client Address", "Description", "Net Amount", "VAT (19%)", "Total", "Status", "Notes"]],
    [SHEETS.TAX_QUARTERS]: [
      ["Quarter", "Year", "Deadline", "Voranmeldung Filed", "Payment Sent", "Estimated Amount", "Actual Amount"],
      ["Q1", "2026", "2026-05-10", "FALSE", "FALSE", "0", "0"],
      ["Q2", "2026", "2026-08-10", "FALSE", "FALSE", "0", "0"],
      ["Q3", "2026", "2026-11-10", "FALSE", "FALSE", "0", "0"],
      ["Q4", "2026", "2027-02-10", "FALSE", "FALSE", "0", "0"],
    ],
    [SHEETS.SETTINGS]: [["Key", "Value"], ["owner_name", "Moe"], ["vat_rate", "0.19"], ["year", "2026"]],
  };

  for (const [sheet, values] of Object.entries(headers)) {
    try {
      await sheetsRequest("POST", `/values/${sheet}!A1:append?valueInputOption=RAW`, { values });
    } catch {
      // Sheet may not exist yet — you need to create sheets manually in Google Sheets first
    }
  }
}

// ─── Utility ───────────────────────────────────────────────────────────────
export function getQuarter(dateStr) {
  const month = new Date(dateStr).getMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

export function calcVatOwed(transactions) {
  const collected = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.vat, 0);
  const deductible = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.vat, 0);
  return { collected, deductible, owed: collected - deductible };
}
