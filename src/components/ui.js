// ─── Shared UI Components ──────────────────────────────────────────────────

export const fmt = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n || 0);

export const Icon = ({ name, size = 20 }) => {
  const icons = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    income:    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />,
    expense:   <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />,
    tax:       <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />,
    invoice:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    receipt:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    settings:  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    music:     <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
    upload:    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
    check:     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    alert:     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    plus:      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    camera:    <><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round" /></>,
    trash:     <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    download:  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    google:    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" stroke="none" />,
    refresh:   <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    x:         <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    chevron:   <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />,
    link:      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {icons[name]}
    </svg>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    paid:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    overdue: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] || map.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const MiniCard = ({ label, value, sub, color = "blue", icon }) => {
  const colors = {
    blue:   "from-blue-600/30 to-blue-500/10 border-blue-500/30 text-blue-300",
    green:  "from-emerald-600/30 to-emerald-500/10 border-emerald-500/30 text-emerald-300",
    red:    "from-red-600/30 to-red-500/10 border-red-500/30 text-red-300",
    amber:  "from-amber-600/30 to-amber-500/10 border-amber-500/30 text-amber-300",
    purple: "from-purple-600/30 to-purple-500/10 border-purple-500/30 text-purple-300",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
};

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ maxWidth: 420, margin: "0 auto" }}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full bg-gray-900 border border-gray-700 rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">
          <Icon name="x" size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs text-gray-400 mb-1 block">{label}</label>}
    <input
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
      {...props}
    />
  </div>
);

export const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="text-xs text-gray-400 mb-1 block">{label}</label>}
    <select
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Btn = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    secondary: "bg-gray-700 hover:bg-gray-600 text-gray-200",
    danger: "bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400",
    success: "bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30",
  };
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-base px-5 py-3" };
  return (
    <button className={`rounded-xl font-medium transition-all flex items-center gap-2 justify-center ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Toast = ({ toast }) => {
  if (!toast) return null;
  const colors = {
    success: "bg-emerald-900 border-emerald-500/40 text-emerald-300",
    error:   "bg-red-900 border-red-500/40 text-red-300",
  };
  return (
    <div className={`fixed top-4 left-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${colors[toast.type] || colors.success}`}
      style={{ maxWidth: 380, margin: "0 auto" }}>
      {toast.msg}
    </div>
  );
};
