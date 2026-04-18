import { useState, useMemo } from "react";
import { useApp } from "../lib/AppContext";
import { fmt, Icon, Modal, Input, Select, Btn } from "../components/ui";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/mockData";

const today = new Date().toISOString().split("T")[0];
const currentYear = new Date().getFullYear();

function AddTransactionModal({ onClose }) {
  const { addTransaction } = useApp();
  const [form, setForm] = useState({ type: "income", date: today, amount: "", vat: "", description: "", category: "Gig Fee" });
  const [saving, setSaving] = useState(false);

  const vatCalc = form.type === "income"
    ? (parseFloat(form.amount) || 0) * 0.19
    : parseFloat(form.vat) || 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || !form.description) return;
    setSaving(true);
    await addTransaction({ ...form, amount: parseFloat(form.amount), vat: vatCalc });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Add Transaction" onClose={onClose}>
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          {["income", "expense"].map(type => (
            <button key={type} onClick={() => { set("type", type); set("category", type === "income" ? "Gig Fee" : "Equipment"); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border ${
                form.type === type
                  ? type === "income" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-gray-800 border-gray-700 text-gray-400"
              }`}>
              {type === "income" ? "↑ Income" : "↓ Expense"}
            </button>
          ))}
        </div>

        <Input label="Description" placeholder="e.g. Club Gig – Tresor Berlin" value={form.description}
          onChange={e => set("description", e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          <Input label={form.type === "income" ? "Net Amount (€)" : "Amount (€)"}
            type="number" placeholder="800" value={form.amount}
            onChange={e => set("amount", e.target.value)} />
        </div>

        <Select label="Category" value={form.category} onChange={e => set("category", e.target.value)}>
          {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        {form.type === "expense" && (
          <Input label="VAT paid on this expense (€) — deductible" type="number" placeholder="0"
            value={form.vat} onChange={e => set("vat", e.target.value)} />
        )}

        {/* Preview */}
        {form.amount && (
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-700 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Net</span><span>{fmt(parseFloat(form.amount))}</span>
            </div>
            {form.type === "income" && (
              <div className="flex justify-between text-gray-400">
                <span>19% MwSt.</span><span>{fmt(vatCalc)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold border-t border-gray-700 pt-1.5">
              <span>{form.type === "income" ? "Invoice total" : "Total paid"}</span>
              <span>{fmt(parseFloat(form.amount) + (form.type === "income" ? vatCalc : 0))}</span>
            </div>
          </div>
        )}

        <Btn onClick={submit} className="w-full" size="lg" disabled={saving}>
          {saving ? "Saving…" : "Save Transaction"}
        </Btn>
      </div>
    </Modal>
  );
}

export default function Finances() {
  const { transactions, deleteTransaction } = useApp();
  const [filter, setFilter] = useState("all");
  const [year, setYear] = useState(String(currentYear));
  const [showAdd, setShowAdd] = useState(false);

  // Get all available years from transactions + current year
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => t.date?.split("-")[0]).filter(Boolean));
    years.add(String(currentYear));
    if (currentYear > 2025) years.add(String(currentYear - 1));
    return ["all", ...Array.from(years).sort((a, b) => b - a)];
  }, [transactions]);

  // Filter by year and type
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchYear = year === "all" || t.date?.startsWith(year);
      const matchType = filter === "all" || t.type === filter;
      return matchYear && matchType;
    });
  }, [transactions, year, filter]);

  // Stats for selected year
  const income   = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit   = income - expenses;
  const vatCollected  = filtered.filter(t => t.type === "income").reduce((s, t) => s + (t.vat || 0), 0);
  const vatDeductible = filtered.filter(t => t.type === "expense").reduce((s, t) => s + (t.vat || 0), 0);
  const vatOwed = vatCollected - vatDeductible;

  return (
    <div className="space-y-5">

      {/* Year selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {availableYears.map(y => (
          <button key={y} onClick={() => setYear(y)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              year === y ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}>
            {y === "all" ? "All years" : y}
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <div className="text-base font-bold text-emerald-400">{fmt(income)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Income</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
          <div className="text-base font-bold text-red-400">{fmt(expenses)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Expenses</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-center">
          <div className="text-base font-bold text-blue-400">{fmt(profit)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Profit</div>
        </div>
      </div>

      {/* VAT summary for year */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          VAT {year === "all" ? "(all years)" : year}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-sm font-bold text-emerald-400">{fmt(vatCollected)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Collected</div>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-400">{fmt(vatDeductible)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Deductible</div>
          </div>
          <div>
            <div className={`text-sm font-bold ${vatOwed >= 0 ? "text-amber-400" : "text-emerald-400"}`}>{fmt(vatOwed)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Owed</div>
          </div>
        </div>
      </div>

      {/* Type filter + Add */}
      <div className="flex gap-2">
        {["all", "income", "expense"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
              filter === f ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
            }`}>
            {f === "all" ? "All" : f === "income" ? "↑ Income" : "↓ Expenses"}
          </button>
        ))}
        <button onClick={() => setShowAdd(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors">
          <Icon name="plus" size={14} /> Add
        </button>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-10">
            No transactions{year !== "all" ? ` in ${year}` : ""} yet
          </div>
        )}
        {filtered.map(t => (
          <div key={t.id} className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                <Icon name={t.type === "income" ? "income" : "expense"} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate font-medium">{t.description}</div>
                <div className="text-xs text-gray-500">{t.date} · {t.category} · {t.quarter}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-bold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </div>
                <div className="text-xs text-gray-500">VAT {fmt(t.vat)}</div>
              </div>
            </div>
            <div className="flex border-t border-gray-700/50">
              <button onClick={() => deleteTransaction(t.id)}
                className="flex-1 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-colors">
                <Icon name="trash" size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
