import { useApp } from "../lib/AppContext";
import { fmt, Icon } from "../components/ui";

export default function Tax() {
  const { taxQuarters, toggleTaxField, transactions, stats } = useApp();
  const s = stats();

  const quarterStats = (q) => {
    const txs = transactions.filter(t => t.quarter === q.quarter);
    const inc = txs.filter(t => t.type === "income").reduce((s, t) => s + t.vat, 0);
    const exp = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.vat, 0);
    return { vatCollected: inc, vatDeductible: exp, vatOwed: inc - exp };
  };

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5">

      {/* Annual overview */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">2026 VAT Overview</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Collected from clients (19%)</span>
            <span className="text-sm font-bold text-emerald-400">{fmt(s.vatCollected)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Paid on expenses (deductible)</span>
            <span className="text-sm font-bold text-blue-400">– {fmt(s.vatDeductible)}</span>
          </div>
          <div className="border-t border-gray-600 pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-white">Net VAT to pay Finanzamt</span>
            <span className="text-lg font-bold text-amber-400">{fmt(s.vatOwed)}</span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/30 p-4 text-xs text-gray-400 leading-relaxed">
        <span className="text-gray-200 font-semibold">How it works:</span> As a Regelbesteuerer you collect 19% VAT on your gig fees, subtract the VAT you paid on business expenses, and pay the difference to the Finanzamt via <span className="text-purple-300">ELSTER</span> every quarter.
      </div>

      {/* Quarterly cards */}
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quarterly Voranmeldung</div>

      {taxQuarters.map(q => {
        const qs = quarterStats(q);
        const days = daysUntil(q.deadline);
        const allDone = q.voranmeldungFiled && q.paymentSent;
        const urgent = days <= 14 && days > 0 && !allDone;
        const overdue = days <= 0 && !allDone;

        return (
          <div key={q.quarter} className={`rounded-2xl border p-4 transition-all ${
            allDone ? "border-emerald-500/30 bg-emerald-500/5" :
            overdue ? "border-red-500/30 bg-red-500/5" :
            urgent  ? "border-amber-500/30 bg-amber-500/5" :
                      "border-gray-700 bg-gray-800/40"
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{q.quarter} {q.year}</span>
                  {allDone && <span className="text-xs text-emerald-400 font-medium">✓ All done</span>}
                  {overdue && <span className="text-xs text-red-400 font-medium">⚠ Overdue</span>}
                  {urgent && <span className="text-xs text-amber-400 font-medium">⚡ {days}d left</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Due {q.deadline}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{fmt(qs.vatOwed > 0 ? qs.vatOwed : q.estimatedAmount)}</div>
                <div className="text-xs text-gray-500">to pay</div>
              </div>
            </div>

            {/* VAT breakdown for this quarter */}
            {(qs.vatCollected > 0 || qs.vatDeductible > 0) && (
              <div className="bg-gray-900/60 rounded-xl p-3 mb-3 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-400">
                  <span>VAT collected</span><span className="text-emerald-400">{fmt(qs.vatCollected)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>VAT deductible</span><span className="text-blue-400">– {fmt(qs.vatDeductible)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold border-t border-gray-700 pt-1.5">
                  <span>Net owed</span><span>{fmt(qs.vatOwed)}</span>
                </div>
              </div>
            )}

            {/* Toggle buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toggleTaxField(q.quarter, q.year, "voranmeldungFiled")}
                className={`flex items-center gap-2 justify-center py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  q.voranmeldungFiled
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-emerald-500/30"
                }`}>
                <Icon name="check" size={14} />
                {q.voranmeldungFiled ? "Filed ✓" : "Mark Filed"}
              </button>
              <button onClick={() => toggleTaxField(q.quarter, q.year, "paymentSent")}
                className={`flex items-center gap-2 justify-center py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  q.paymentSent
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                    : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-blue-500/30"
                }`}>
                <Icon name="income" size={14} />
                {q.paymentSent ? "Paid ✓" : "Mark Paid"}
              </button>
            </div>
          </div>
        );
      })}

      {/* ELSTER tip */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-gray-400 leading-relaxed">
        <span className="text-purple-300 font-semibold">💡 ELSTER tip:</span> File your Umsatzsteuer-Voranmeldung at{" "}
        <span className="text-purple-300 underline">elster.de</span> — deadline is always the 10th of the month after quarter end. If you miss it, there's a late fee of up to 10% of the VAT owed.
      </div>
    </div>
  );
}
