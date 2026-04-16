// ─── App-wide State & Data Context ────────────────────────────────────────
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Google from "./google";
import {
  MOCK_TRANSACTIONS, MOCK_INVOICES, MOCK_TAX_QUARTERS, MOCK_RECEIPTS,
} from "./mockData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const configured = Google.isConfigured();

  const [signedIn, setSignedIn]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [invoices, setInvoices]         = useState(MOCK_INVOICES);
  const [taxQuarters, setTaxQuarters]   = useState(MOCK_TAX_QUARTERS);
  const [receipts, setReceipts]         = useState(MOCK_RECEIPTS);
  const [toast, setToast]               = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Auth init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;
    Google.initGoogleAuth().catch(console.error);
  }, [configured]);

  const handleSignIn = async () => {
    try {
      await Google.signIn();
      setSignedIn(true);
      await refreshAll();
      showToast("Connected to Google!");
    } catch (e) {
      showToast("Sign-in failed: " + e.message, "error");
    }
  };

  const handleSignOut = () => {
    Google.signOut();
    setSignedIn(false);
    setTransactions(MOCK_TRANSACTIONS);
    setInvoices(MOCK_INVOICES);
    setTaxQuarters(MOCK_TAX_QUARTERS);
    setReceipts(MOCK_RECEIPTS);
    showToast("Signed out — showing demo data");
  };

  // ── Fetch all data ────────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    if (!Google.isSignedIn()) return;
    setLoading(true);
    try {
      const [txs, invs, tqs, recs] = await Promise.all([
        Google.getTransactions(),
        Google.getInvoices(),
        Google.getTaxQuarters(),
        Google.getReceipts(),
      ]);
      if (txs.length)  setTransactions(txs);
      if (invs.length) setInvoices(invs);
      if (tqs.length)  setTaxQuarters(tqs);
      setReceipts(recs);
    } catch (e) {
      showToast("Failed to load data: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ── Transactions ──────────────────────────────────────────────────────────
  const addTransaction = async (tx) => {
    if (Google.isSignedIn()) {
      const saved = await Google.addTransaction(tx);
      setTransactions(prev => [saved, ...prev]);
      showToast("Transaction saved to Google Sheets ✓");
    } else {
      const fake = { ...tx, id: `TX-${Date.now()}`, quarter: Google.getQuarter(tx.date), vat: tx.type === "income" ? tx.amount * 0.19 : tx.vat || 0 };
      setTransactions(prev => [fake, ...prev]);
      showToast("Demo mode — not saved to Sheets");
    }
  };

  const deleteTransaction = async (id) => {
    if (Google.isSignedIn()) {
      await Google.deleteTransaction(id);
      showToast("Transaction deleted");
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ── Invoices ──────────────────────────────────────────────────────────────
  const addInvoice = async (inv) => {
    if (Google.isSignedIn()) {
      const saved = await Google.addInvoice(inv);
      setInvoices(prev => [saved, ...prev]);
      showToast("Invoice saved to Google Sheets ✓");
      return saved;
    } else {
      const fake = { ...inv, id: `INV-${String(invoices.length + 1).padStart(3,"0")}`, vat: inv.netAmount * 0.19, total: inv.netAmount * 1.19 };
      setInvoices(prev => [fake, ...prev]);
      showToast("Demo mode — not saved to Sheets");
      return fake;
    }
  };

  const updateInvoiceStatus = async (id, status) => {
    if (Google.isSignedIn()) await Google.updateInvoiceStatus(id, status);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    showToast(`Invoice marked as ${status}`);
  };

  // ── Tax Quarters ──────────────────────────────────────────────────────────
  const toggleTaxField = async (quarter, year, field) => {
    const current = taxQuarters.find(q => q.quarter === quarter && q.year === year);
    if (!current) return;
    const newVal = !current[field];
    if (Google.isSignedIn()) await Google.updateTaxQuarter(quarter, year, field, newVal);
    setTaxQuarters(prev => prev.map(q =>
      q.quarter === quarter && q.year === year ? { ...q, [field]: newVal } : q
    ));
  };

  // ── Receipt Upload ────────────────────────────────────────────────────────
  const uploadReceipt = async (file, transactionId) => {
    if (!Google.isSignedIn()) {
      showToast("Connect Google to upload receipts", "error");
      return null;
    }
    try {
      const result = await Google.uploadReceipt(file, transactionId);
      showToast("Receipt uploaded to Google Drive ✓");
      await refreshAll();
      return result;
    } catch (e) {
      showToast("Upload failed: " + e.message, "error");
      return null;
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useCallback(() => {
    const income   = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const vatCollected  = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.vat, 0);
    const vatDeductible = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.vat, 0);
    return { income, expenses, profit: income - expenses, vatCollected, vatDeductible, vatOwed: vatCollected - vatDeductible };
  }, [transactions]);

  return (
    <AppContext.Provider value={{
      configured, signedIn, loading, toast,
      transactions, invoices, taxQuarters, receipts,
      handleSignIn, handleSignOut, refreshAll,
      addTransaction, deleteTransaction,
      addInvoice, updateInvoiceStatus,
      toggleTaxField, uploadReceipt,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
