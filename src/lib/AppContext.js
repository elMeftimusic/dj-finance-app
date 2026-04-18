// ─── App-wide State & Data Context ────────────────────────────────────────
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as Google from "./google";
import { MOCK_TAX_QUARTERS } from "./mockData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const configured = Google.isConfigured();

  const [signedIn, setSignedIn]         = useState(false);
  const [authReady, setAuthReady]       = useState(false); // true once we know auth state
  const [loading, setLoading]           = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices]         = useState([]);
  const [taxQuarters, setTaxQuarters]   = useState(MOCK_TAX_QUARTERS);
  const [receipts, setReceipts]         = useState([]);
  const [toast, setToast]               = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Auth init — wait for Google script, then auto sign in silently ────────
  useEffect(() => {
    if (!configured) {
      setAuthReady(true);
      return;
    }

    const init = async () => {
      try {
        await Google.initGoogleAuth();
        if (Google.hasAutoSignIn()) {
          try {
            await Google.silentSignIn();
            setSignedIn(true);
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
            } finally {
              setLoading(false);
            }
          } catch {
            // Silent sign-in failed — user needs to tap "Sign in"
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAuthReady(true); // always mark ready so the app renders
      }
    };

    if (window.google) {
      init();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener("load", init);
        return () => script.removeEventListener("load", init);
      } else {
        setAuthReady(true); // no script found, just show the app
      }
    }
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
    setTransactions([]);
    setInvoices([]);
    setTaxQuarters(MOCK_TAX_QUARTERS);
    setReceipts([]);
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
    if (!Google.isSignedIn()) {
      showToast("Sign in with Google first", "error");
      return;
    }
    const saved = await Google.addTransaction(tx);
    setTransactions(prev => [saved, ...prev]);
    showToast("Transaction saved ✓");
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
    if (!Google.isSignedIn()) {
      // Still generate a local invoice for PDF download even without Google
      const fake = {
        ...inv,
        id: `INV-${String(Date.now()).slice(-4)}`,
        vat: inv.netAmount * 0.19,
        total: inv.netAmount * 1.19,
        status: "pending",
      };
      setInvoices(prev => [fake, ...prev]);
      showToast("Invoice created (sign in to save to Sheets)");
      return fake;
    }
    const saved = await Google.addInvoice(inv);
    setInvoices(prev => [saved, ...prev]);
    showToast("Invoice saved to Google Sheets ✓");
    return saved;
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
      showToast("Sign in with Google to upload receipts", "error");
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

  // ── Loading screen while auth resolves ───────────────────────────────────
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4"
        style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="text-white font-bold text-lg tracking-tight">DJ Finance</div>
        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      configured, signedIn, authReady, loading, toast,
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
