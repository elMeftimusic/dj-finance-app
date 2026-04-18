import { useApp } from "../lib/AppContext";
import { fmt, Icon, MiniCard } from "../components/ui";

export default function Dashboard() {
  const { stats, taxQuarters, transactions, signedIn, handleSignIn, configured } = useApp();
  const s = stats();

  const nextUnfiled = taxQuarters.find(q => !q.voranmeldungFiled && q.estimatedAmount > 0);

  const today = new Date();
  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Monthly chart data
  const monthlyData = [
    { m: "Jan", inc: 0, exp: 0 }, { m: "Feb", inc: 0, exp: 0 },
    { m: "Mar", inc: 0, exp: 0 }, { m: "Apr", inc: 0, exp: 0 },
    { m: "May", inc: 0, exp: 0 }, { m: "Jun", inc: 0, exp: 0 },
  ];
  transactions.forEach(t => {
    const mo = new Date(t.date).getMonth();
    if (mo > 5) return;
    if (t.type === "income")  monthlyData[mo].inc += t.amount;
    if (t.type === "expense") monthlyData[mo].exp += t.amount;
  });
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.inc, d.exp)), 1);

  return (
    <div className="space-y-5">

      {/* Sign in prompt — shown when not connected */}
      {configured && !signedIn && (
        <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
          <span className="text-gray-400"><Icon name="google" size={20} /></span>
          <div className="flex-1">
            <div className="text-gray-300 font-semibold text-sm">Not connected</div>
            <div className="text-gray-500 text-xs">Sign in to load your data</div>
          </div>
          <button onClick={handleSignIn} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors">
            Sign in
          </button>
        </div>
      )}

      {/* Deadline alerts */}
      {nextUnfiled && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <span className="text-amber-400 shrink-0"><Icon name="alert" size={20} /></span>
          <div>
            <div className="text-amber-300 font-semibold text-sm">Upcoming USt-Voranmeldung</div>
            <div className="text-gray-400 text-xs">
              {nextUnfiled.quarter} {nextUnfiled.year} — due <span className="text-amber-300 font-medium">{nextUnfiled.deadline}</span>
              {" "}({daysUntil(nextUnfiled.deadline)} days) · est. {fmt(nextUnfiled.estimatedAmount)}
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <MiniCard label="Income" value={fmt(s.income)} sub="2026 YTD" color="green"
          icon={<Icon name="income" size={18} />} />
        <MiniCard label="Expenses" value={fmt(s.expenses)} sub="2026 YTD" color="red"
          icon={<Icon name="expense" size={18} />} />
        <MiniCard label="Net Profit" value={fmt(s.profit)} sub="before tax" color="blue"
          icon={<Icon name="music" size={18} />} />
        <MiniCard label="VAT Owed" value={fmt(s.vatOwed)} sub="to Finanzamt" color="amber"
          icon={<Icon name="tax" size={18} />} />
      </div>

      {/* Finanzamt gauge */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-purple-500/5 p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-purple-300">What you owe the Finanzamt</span>
          <span className="text-purple-400"><Icon name="tax" size={18} /></span>
        </div>
        <div className="text-4xl font-bold text-white mt-3 mb-1">{fmt(s.vatOwed)}</div>
        <div className="text-xs text-gray-400 mb-4">VAT collected minus deductible VAT on expenses</div>
        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((s.vatOwed / 2000) * 100, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1.5">
          <span>€0</span><span>€2,000</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Collected (income)</div>
            <div className="text-sm font-bold text-emerald-400">{fmt(s.vatCollected)}</div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Deductible (expenses)</div>
            <div className="text-sm font-bold text-blue-400">{fmt(s.vatDeductible)}</div>
          </div>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Monthly Overview</div>
        <div className="flex items-end gap-1.5 h-20">
          {monthlyData.map(d => (
            <div key={d.m} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end" style={{ height: 64 }}>
                <div className="flex-1 bg-emerald-500/70 rounded-t transition-all"
                  style={{ height: `${(d.inc / maxVal) * 100}%`, minHeight: d.inc ? 2 : 0 }} />
                <div className="flex-1 bg-red-500/50 rounded-t transition-all"
                  style={{ height: `${(d.exp / maxVal) * 100}%`, minHeight: d.exp ? 2 : 0 }} />
              </div>
              <span className="text-xs text-gray-500">{d.m}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Income</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Expenses</span>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent</div>
        <div className="space-y-2">
          {transactions.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                <Icon name={t.type === "income" ? "income" : "expense"} size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate">{t.description}</div>
                <div className="text-xs text-gray-500">{t.date} · {t.category}</div>
              </div>
              <div className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
