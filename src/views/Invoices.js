import { useState } from "react";
import { useApp } from "../lib/AppContext";
import { fmt, Icon, Modal, Input, Btn, StatusBadge } from "../components/ui";
import { generateInvoicePDF } from "../lib/pdfInvoice";

const today = new Date().toISOString().split("T")[0];

const OWNER_SETTINGS = {
  ownerName: "Moe [Last Name]",
  ownerAddress: "Musterstraße 1\n10115 Berlin",
  ownerEmail: "moe@example.com",
  ownerPhone: "+49 XXX XXXXXXX",
  taxNumber: "12/345/67890",
  bankName: "Your Bank",
  iban: "DE00 XXXX XXXX XXXX XXXX XX",
  bic: "XXXXXXXX",
};

function NewInvoiceModal({ onClose }) {
  const { addInvoice } = useApp();
  const [form, setForm] = useState({
    date: today,
    client: "",
    clientAddress: "",
    description: "",
    netAmount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const vat = (parseFloat(form.netAmount) || 0) * 0.19;
  const total = (parseFloat(form.netAmount) || 0) + vat;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.client || !form.netAmount || !form.description) return;
    setSaving(true);
    const saved = await addInvoice({ ...form, netAmount: parseFloat(form.netAmount) });
    setSaving(false);
    // Auto-download PDF
    generateInvoicePDF({ ...saved }, OWNER_SETTINGS);
    onClose();
  };

  return (
    <Modal title="New Invoice" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Invoice Date" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          <Input label="Net Amount (€)" type="number" placeholder="800" value={form.netAmount}
            onChange={e => set("netAmount", e.target.value)} />
        </div>
        <Input label="Client Name" placeholder="Club Tresor Berlin" value={form.client}
          onChange={e => set("client", e.target.value)} />
        <Input label="Client Address (optional)" placeholder="Köpenicker Str. 70, 10179 Berlin"
          value={form.clientAddress} onChange={e => set("clientAddress", e.target.value)} />
        <Input label="Service Description" placeholder="DJ Set – 4h – Closing Night"
          value={form.description} onChange={e => set("description", e.target.value)} />
        <Input label="Notes (optional)" placeholder="Payment due within 14 days"
          value={form.notes} onChange={e => set("notes", e.target.value)} />

        {/* Live preview */}
        {form.netAmount && (
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 space-y-2">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Preview</div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Net</span><span>{fmt(parseFloat(form.netAmount))}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>+ 19% MwSt.</span><span>{fmt(vat)}</span>
            </div>
            <div className="flex justify-between text-base text-white font-bold border-t border-gray-700 pt-2">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>
        )}

        <Btn onClick={submit} className="w-full" size="lg" disabled={saving || !form.client || !form.netAmount}>
          <Icon name="download" size={16} />
          {saving ? "Saving…" : "Save & Download PDF"}
        </Btn>
        <p className="text-xs text-gray-500 text-center">PDF auto-downloads. Edit your details in Settings before sending.</p>
      </div>
    </Modal>
  );
}

export default function Invoices() {
  const { invoices, updateInvoiceStatus } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{fmt(totalPaid)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Paid</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{fmt(totalPending)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Outstanding</div>
        </div>
      </div>

      {/* Filter + New */}
      <div className="flex gap-2">
        {["all", "pending", "paid"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"}`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={() => setShowNew(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors shrink-0">
          <Icon name="plus" size={14} /> New
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-10">No invoices yet</div>
        )}
        {filtered.map(inv => (
          <div key={inv.id} className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-white">{inv.client}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{inv.id} · {inv.date}</div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="text-xs text-gray-400 mb-3 line-clamp-1">{inv.description}</div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Net {fmt(inv.netAmount)} + {fmt(inv.vat)} VAT</span>
                <span className="text-white font-bold text-sm">{fmt(inv.total)}</span>
              </div>
            </div>
            <div className="flex border-t border-gray-700/50 divide-x divide-gray-700/50">
              <button onClick={() => generateInvoicePDF(inv, OWNER_SETTINGS)}
                className="flex-1 py-2.5 text-xs text-purple-400 hover:bg-purple-500/10 flex items-center justify-center gap-1.5 transition-colors">
                <Icon name="download" size={13} /> PDF
              </button>
              {inv.status === "pending" && (
                <button onClick={() => updateInvoiceStatus(inv.id, "paid")}
                  className="flex-1 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 transition-colors">
                  <Icon name="check" size={13} /> Mark Paid
                </button>
              )}
              {inv.status === "paid" && (
                <button onClick={() => updateInvoiceStatus(inv.id, "pending")}
                  className="flex-1 py-2.5 text-xs text-gray-400 hover:bg-gray-700 flex items-center justify-center gap-1.5 transition-colors">
                  Undo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNew && <NewInvoiceModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
