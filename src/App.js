import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./lib/AppContext";
import { Icon, Toast } from "./components/ui";
import Dashboard from "./views/Dashboard";
import Finances  from "./views/Finances";
import Tax       from "./views/Tax";
import Invoices  from "./views/Invoices";
import Receipts  from "./views/Receipts";
import Settings  from "./views/Settings";
import PinLock, { resetToDefaultPin } from "./components/PinLock";

const TABS = [
  { id: "dashboard", label: "Home",     icon: "dashboard" },
  { id: "finances",  label: "Finances", icon: "income"    },
  { id: "tax",       label: "Tax",      icon: "tax"       },
  { id: "invoices",  label: "Invoices", icon: "invoice"   },
  { id: "receipts",  label: "Receipts", icon: "camera"    },
];

const VIEWS = {
  dashboard: <Dashboard />,
  finances:  <Finances  />,
  tax:       <Tax       />,
  invoices:  <Invoices  />,
  receipts:  <Receipts  />,
  settings:  <Settings  />,
};

const TITLES = {
  dashboard: "Overview",
  finances:  "Income & Expenses",
  tax:       "Umsatzsteuer",
  invoices:  "Invoices",
  receipts:  "Receipts",
  settings:  "Settings",
};

function AppShell() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast, taxQuarters } = useApp();

  // Badge: count unresolved quarters with amount > 0
  const taxAlert = taxQuarters.filter(q => (!q.voranmeldungFiled || !q.paymentSent) && q.estimatedAmount > 0).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col" style={{ maxWidth: 430, margin: "0 auto", position: "relative" }}>

      <Toast toast={toast} />

      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center">
              <Icon name="music" size={15} />
            </div>
            <span className="text-lg font-bold tracking-tight">DJ Finance</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5 ml-9.5">{TITLES[activeTab]}</div>
        </div>
        <button onClick={() => setActiveTab("settings")}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            activeTab === "settings" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}>
          <Icon name="settings" size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        {VIEWS[activeTab]}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/80"
        style={{ maxWidth: 430, margin: "0 auto" }}>
        <div className="flex justify-around px-2 py-2 pb-safe">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const badge = tab.id === "tax" && taxAlert > 0 ? taxAlert : 0;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all relative ${
                  isActive ? "text-purple-400" : "text-gray-600 hover:text-gray-400"
                }`}>
                {badge > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full text-xs flex items-center justify-center text-black font-bold leading-none">
                    {badge}
                  </span>
                )}
                <Icon name={tab.icon} size={22} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-purple-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // One-time PIN reset — clears any corrupted stored PIN from previous sessions
  useEffect(() => {
    const resetDone = localStorage.getItem("djfinance_pin_reset_v3");
    if (!resetDone) {
      resetToDefaultPin();
      localStorage.setItem("djfinance_pin_reset_v3", "1");
    }
  }, []);

  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem("djfinance_unlocked") === "1"
  );

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
