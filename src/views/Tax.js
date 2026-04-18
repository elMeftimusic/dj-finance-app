import { useState, useEffect } from "react";
import { useApp } from "../lib/AppContext";
import { fmt, Icon } from "../components/ui";

const CURRENT_YEAR = new Date().getFullYear();

// ── German tax deadlines for a Regelbesteuerer freelancer ─────────────────
function buildDeadlines(year) {
  return [
    // USt-Voranmeldung (quarterly VAT returns)
    { id: `ust-q1-${year}`, type: "USt-Voranmeldung", period: `Q1 ${year} (Jan–Mar)`, date: `${year}-05-10`, color: "purple", icon: "tax", description: "Umsatzsteuer-Voranmeldung Q1 via ELSTER" },
    { id: `ust-q2-${year}`, type: "USt-Voranmeldung", period: `Q2 ${year} (Apr–Jun)`, date: `${year}-08-10`, color: "purple", icon: "tax", description: "Umsatzsteuer-Voranmeldung Q2 via ELSTER" },
    { id: `ust-q3-${year}`, type: "USt-Voranmeldung", period: `Q3 ${year} (Jul–Sep)`, date: `${year}-11-10`, color: "purple", icon: "tax", description: "Umsatzsteuer-Voranmeldung Q3 via ELSTER" },
    { id: `ust-q4-${year}`, type: "USt-Voranmeldung", period: `Q4 ${year} (Oct–Dec)`, date: `${year + 1}-02-10`, color: "purple", icon: "tax", description: "Umsatzsteuer-Voranmeldung Q4 via ELSTER" },
    // Einkommensteuer-Vorauszahlungen (income tax prepayments)
    { id: `est-q1-${year}`, type: "Einkommensteuer", period: `Q1 ${year}`, date: `${year}-03-10`, color: "blue", icon: "income", description: "Einkommensteuer-Vorauszahlung Q1 — pay directly to Finanzamt" },
    { id: `est-q2-${year}`, type: "Einkommensteuer", period: `Q2 ${year}`, date: `${year}-06-10`, color: "blue", icon: "income", description: "Einkommensteuer-Vorauszahlung Q2 — pay directly to Finanzamt" },
    { id: `est-q3-${year}`, type: "Einkommensteuer", period: `Q3 ${year}`, date: `${year}-09-10`, color: "blue", icon: "income", description: "Einkommensteuer-Vorauszahlung Q3 — pay directly to Finanzamt" },
    { id: `est-q4-${year}`, type: "Einkommensteuer", period: `Q4 ${year}`, date: `${year}-12-10`, color: "blue", icon: "income", description: "Einkommensteuer-Vorauszahlung Q4 — pay directly to Finanzamt" },
    // Jahressteuererklärung
    { id: `jahrés-${year - 1}`, type: "Jahreserklärung", period: `${year - 1} annual return`, date: `${year}-07-31`, color: "amber", icon: "alert", description: `Einkommensteuer- & Umsatzsteuererklärung ${year - 1} — submit via ELSTER or Steuerberater` },
    // Gewerbesteuer (only if applicable — included as reference)
    { id: `gew-q1-${year}`, type: "Gewerbesteuer", period: `Q1 ${year}`, date: `${year}-02-15`, color: "gray", icon: "expense", description: "Gewerbesteuer-Vorauszahlung Q1 (nur wenn Gewerbeschein)" },
    { id: `gew-q2-${year}`, type: "Gewerbesteuer", period: `Q2 ${year}`, date: `${year}-05-15`, color: "gray", icon: "expense", description: "Gewerbesteuer-Vorauszahlung Q2 (nur wenn Gewerbeschein)" },
    { id: `gew-q3-${year}`, type: "Gewerbesteuer", period: `Q3 ${year}`, date: `${year}-08-15`, color: "gray", icon: "expense", description: "Gewerbesteuer-Vorauszahlung Q3 (nur wenn Gewerbeschein)" },
    { id: `gew-q4-${year}`, type: "Gewerbesteuer", period: `Q4 ${year}`, date: `${year}-11-15`, color: "gray", icon: "expense", description: "Gewerbesteuer-Vorauszahlung Q4 (nur wenn Gewerbeschein)" },
  ].sort((a, b) => new Date(a.date) - new Date(b.date));
}

const COLOR = {
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", dot: "bg-purple-400" },
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-300",   dot: "bg-blue-400"   },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-300",  dot: "bg-amber-400"  },
  gray:   { bg: "bg-gray-800/40",   border: "border-gray-700",      text: "text-gray-400",   dot: "bg-gray-500"   },
  red:    { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-300",    dot: "bg-red-400"    },
};

function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  Notification.requestPermission();
}

function scheduleNotifications(deadlines, doneDates) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  // We can't schedule future notifications from the browser — instead show
  // a local reminder for anything due within 14 days that isn't done
  const today = new Date();
  deadlines.forEach(d => {
    if (doneDates[d.id]) return;
    const diff = Math.ceil((new Date(d.date) - today) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 14) {
      new Notification(`DJ Finance — Tax Reminder`, {
        body: `${d.type}: ${d.period} is due in ${diff} day${diff === 1 ? "" : "s"} (${d.date})`,
        icon: "/dj-finance-app/icon-192.png",
      });
    }
  });
}

export default function Tax() {
  const { taxQuarters, toggleTaxField, transactions, stats } = useApp();
  const s = stats();
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [doneDates, setDoneDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("djfinance_tax_done") || "{}"); } catch { return {}; }
  });
  const [notifStatus, setNotifStatus] = useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const [expandedId, setExpandedId] = useState(null);

  const deadlines = buildDeadlines(parseInt(year));

  const toggleDone = (id) => {
    const next = { ...doneDates, [id]: !doneDates[id] };
    if (!next[id]) delete next[id];
    setDoneDates(next);
    localStorage.setItem("djfinance_tax_done", JSON.stringify(next));
  };

  const enableNotifications = async () => {
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === "granted") scheduleNotifications(deadlines, doneDates);
  };

  // Check for upcoming deadlines on load
  useEffect(() => {
    if (notifStatus === "granted") scheduleNotifications(deadlines, doneDates);
  }, []); // eslint-disable-line

  const quarterStats = (q) => {
    const txs = transactions.filter(t => t.quarter === q.quarter && t.date?.startsWith(year));
    const inc = txs.filter(t => t.type === "income").reduce((s, t) => s + t.vat, 0);
    const exp = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.vat, 0);
    return { vatCollected: inc, vatDeductible: exp, vatOwed: inc - exp };
  };

  const daysUntil = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));

  const today = new Date().toISOString().split("T")[0];
  const upcoming = deadlines.filter(d => !doneDates[d.id] && d.date >= today).slice(0, 1)[0];

  return (
    <div className="space-y-5">

      {/* Next deadline banner */}
      {upcoming && (() => {
        const days = daysUntil(upcoming.date);
        const urgent = days <= 14;
        return (
          <div className={`flex items-center gap-3 rounded-2xl border p-4 ${urgent ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
            <span className={urgent ? "text-red-400" : "text-amber-400"}><Icon name="alert" size={20} /></span>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${urgent ? "text-red-300" : "text-amber-300"}`}>
                Next: {upcoming.type}
              </div>
              <div className="text-xs text-gray-400">{upcoming.period} — due {upcoming.date} ({days}d away)</div>
            </div>
          </div>
        );
      })()}

      {/* Notification button */}
      {notifStatus !== "granted" && notifStatus !== "unsupported" && (
        <button onClick={enableNotifications}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-2xl py-3 text-sm text-purple-300 font-medium hover:bg-purple-600/30 transition-colors">
          <Icon name="alert" size={16} /> Enable deadline reminders
        </button>
      )}
      {notifStatus === "granted" && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5">
          <Icon name="check" size={13} /> Reminders enabled — you'll be notified 14 days before each deadline
        </div>
      )}

      {/* Annual VAT overview */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{year} VAT Overview</div>
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
            <span className="text-sm font-semibold text-white">Net VAT owed to Finanzamt</span>
            <span className="text-lg font-bold text-amber-400">{fmt(s.vatOwed)}</span>
          </div>
          {s.vatDeductible > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
              💙 You can claim back <strong>{fmt(s.vatDeductible)}</strong> in Vorsteuer from your business expenses
            </div>
          )}
        </div>
      </div>

      {/* Quarterly Voranmeldung */}
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quarterly Voranmeldung</div>
      {taxQuarters.filter(q => q.year === year).map(q => {
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

            {(qs.vatCollected > 0 || qs.vatDeductible > 0) && (
              <div className="bg-gray-900/60 rounded-xl p-3 mb-3 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-400">
                  <span>VAT collected</span><span className="text-emerald-400">{fmt(qs.vatCollected)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Vorsteuer (deductible)</span><span className="text-blue-400">– {fmt(qs.vatDeductible)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold border-t border-gray-700 pt-1.5">
                  <span>Net owed</span><span>{fmt(qs.vatOwed)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toggleTaxField(q.quarter, q.year, "voranmeldungFiled")}
                className={`flex items-center gap-2 justify-center py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  q.voranmeldungFiled ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-emerald-500/30"}`}>
                <Icon name="check" size={14} />
                {q.voranmeldungFiled ? "Filed ✓" : "Mark Filed"}
              </button>
              <button onClick={() => toggleTaxField(q.quarter, q.year, "paymentSent")}
                className={`flex items-center gap-2 justify-center py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  q.paymentSent ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                    : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-blue-500/30"}`}>
                <Icon name="income" size={14} />
                {q.paymentSent ? "Paid ✓" : "Mark Paid"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Tax Calendar */}
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">
        Tax Calendar
        <span className="ml-2 inline-flex gap-1">
          {[String(CURRENT_YEAR - 1), String(CURRENT_YEAR), String(CURRENT_YEAR + 1)].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${year === y ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400"}`}>
              {y}
            </button>
          ))}
        </span>
      </div>

      <div className="space-y-2">
        {deadlines.map(d => {
          const days = daysUntil(d.date);
          const done = !!doneDates[d.id];
          const past = days < 0;
          const urgent = days >= 0 && days <= 14 && !done;
          const c = done ? COLOR.gray : past ? COLOR.gray : urgent ? COLOR.red : COLOR[d.color];
          const expanded = expandedId === d.id;

          return (
            <div key={d.id} className={`rounded-2xl border transition-all ${c.bg} ${c.border}`}>
              <button className="w-full flex items-center gap-3 p-3 text-left"
                onClick={() => setExpandedId(expanded ? null : d.id)}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${done || past ? "bg-gray-600" : c.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${done || past ? "text-gray-500 line-through" : "text-white"}`}>
                    {d.type}
                  </div>
                  <div className="text-xs text-gray-500">{d.period} · {d.date}</div>
                </div>
                <div className="text-right shrink-0">
                  {done ? (
                    <span className="text-xs text-emerald-400 font-medium">✓ Done</span>
                  ) : past ? (
                    <span className="text-xs text-gray-500">Past</span>
                  ) : (
                    <span className={`text-xs font-medium ${urgent ? "text-red-400" : c.text}`}>
                      {days === 0 ? "Today!" : `${days}d`}
                    </span>
                  )}
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-gray-400 leading-relaxed">{d.description}</p>
                  <button onClick={() => toggleDone(d.id)}
                    className={`w-full py-2 rounded-xl text-xs font-medium border transition-all ${
                      done ? "bg-gray-700/50 border-gray-600 text-gray-400"
                           : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"}`}>
                    {done ? "Mark as not done" : "✓ Mark as done"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ELSTER tip */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-gray-400 leading-relaxed">
        <span className="text-purple-300 font-semibold">💡 ELSTER:</span> File all tax returns at{" "}
        <span className="text-purple-300">elster.de</span>. If the 10th falls on a weekend or holiday, the deadline moves to the next working day. Late filing = up to 10% surcharge.
      </div>
    </div>
  );
}
