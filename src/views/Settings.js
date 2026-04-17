import { useState } from "react";
import { useApp } from "../lib/AppContext";
import { Icon, Btn } from "../components/ui";
import { setNewPin, checkPin } from "../components/PinLock";

const FIELD = ({ label, sublabel, ...props }) => (
  <div>
    <label className="text-xs text-gray-400 mb-0.5 block">{label}</label>
    {sublabel && <div className="text-xs text-gray-600 mb-1">{sublabel}</div>}
    <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
      {...props} />
  </div>
);

export default function Settings() {
  const { signedIn, handleSignIn, handleSignOut, configured, refreshAll, loading } = useApp();
  const [saved, setSaved] = useState(false);
  const [pinForm, setPinForm] = useState({ current: "", next: "", confirm: "" });
  const [pinMsg, setPinMsg] = useState(null);

  const changePin = () => {
    if (pinForm.next.length !== 4 || !/^\d{4}$/.test(pinForm.next)) {
      setPinMsg({ text: "PIN must be exactly 4 digits", ok: false }); return;
    }
    if (pinForm.next !== pinForm.confirm) {
      setPinMsg({ text: "PINs don't match", ok: false }); return;
    }
    if (!checkPin(pinForm.current)) {
      setPinMsg({ text: "Current PIN is wrong", ok: false }); return;
    }
    setNewPin(pinForm.next);
    setPinForm({ current: "", next: "", confirm: "" });
    setPinMsg({ text: "PIN changed!", ok: true });
    setTimeout(() => setPinMsg(null), 3000);
  };
  const [profile, setProfile] = useState({
    name: "Moe",
    lastName: "",
    address: "Musterstraße 1, 10115 Berlin",
    email: "moe@example.com",
    phone: "+49 XXX XXXXXXX",
    taxNumber: "12/345/67890",
    bankName: "Your Bank",
    iban: "DE00 XXXX XXXX XXXX XXXX XX",
    bic: "XXXXXXXX",
  });

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const save = () => {
    localStorage.setItem("djfinance_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">

      {/* Google connection */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Google Connection</div>
        {!configured ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">To connect Google Sheets & Drive, add your credentials to <code className="text-purple-300 bg-gray-900 px-1.5 py-0.5 rounded">.env</code></p>
            <div className="bg-gray-900 rounded-xl p-3 text-xs font-mono text-gray-400 space-y-1">
              <div><span className="text-purple-300">REACT_APP_GOOGLE_CLIENT_ID</span>=your_client_id</div>
              <div><span className="text-purple-300">REACT_APP_SPREADSHEET_ID</span>=your_sheet_id</div>
              <div><span className="text-purple-300">REACT_APP_DRIVE_FOLDER_ID</span>=your_folder_id</div>
            </div>
            <p className="text-xs text-gray-500">See SETUP_GUIDE.md for step-by-step instructions.</p>
          </div>
        ) : signedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div className="text-sm text-emerald-300 font-medium">Connected to Google</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={refreshAll} variant="secondary" disabled={loading}>
                <Icon name="refresh" size={15} /> {loading ? "Syncing…" : "Sync Data"}
              </Btn>
              <Btn onClick={handleSignOut} variant="danger">
                Sign Out
              </Btn>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Sign in with Google to sync data to Sheets and upload receipts to Drive.</p>
            <Btn onClick={handleSignIn} className="w-full">
              <Icon name="google" size={16} /> Sign in with Google
            </Btn>
          </div>
        )}
      </div>

      {/* Invoice profile */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5 space-y-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Details (for Invoices)</div>

        <div className="grid grid-cols-2 gap-3">
          <FIELD label="First Name" value={profile.name} onChange={e => set("name", e.target.value)} />
          <FIELD label="Last Name" value={profile.lastName} onChange={e => set("lastName", e.target.value)} />
        </div>
        <FIELD label="Address" value={profile.address} onChange={e => set("address", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <FIELD label="Email" type="email" value={profile.email} onChange={e => set("email", e.target.value)} />
          <FIELD label="Phone" value={profile.phone} onChange={e => set("phone", e.target.value)} />
        </div>
        <FIELD label="Steuernummer" sublabel="Format: 12/345/67890" value={profile.taxNumber}
          onChange={e => set("taxNumber", e.target.value)} />

        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Details</div>
          <FIELD label="Bank Name" value={profile.bankName} onChange={e => set("bankName", e.target.value)} />
          <FIELD label="IBAN" value={profile.iban} onChange={e => set("iban", e.target.value)} />
          <FIELD label="BIC / SWIFT" value={profile.bic} onChange={e => set("bic", e.target.value)} />
        </div>

        <Btn onClick={save} className="w-full" variant={saved ? "success" : "primary"}>
          {saved ? <><Icon name="check" size={16} /> Saved!</> : "Save Details"}
        </Btn>
        <p className="text-xs text-gray-500 text-center">These are saved locally and stamped on all invoice PDFs.</p>
      </div>

      {/* PIN */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5 space-y-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Change PIN</div>
        <FIELD label="Current PIN" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
          value={pinForm.current} onChange={e => setPinForm(f => ({ ...f, current: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <FIELD label="New PIN (4 digits)" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={pinForm.next} onChange={e => setPinForm(f => ({ ...f, next: e.target.value }))} />
          <FIELD label="Confirm new PIN" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={pinForm.confirm} onChange={e => setPinForm(f => ({ ...f, confirm: e.target.value }))} />
        </div>
        {pinMsg && (
          <div className={`text-xs font-medium px-3 py-2 rounded-xl ${pinMsg.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
            {pinMsg.text}
          </div>
        )}
        <Btn onClick={changePin} className="w-full" variant="secondary">
          <Icon name="check" size={15} /> Update PIN
        </Btn>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/30 p-4 text-xs text-gray-500 space-y-1.5">
        <div className="font-semibold text-gray-400">DJ Finance App</div>
        <div>Built for German Regelbesteuerer DJs · 19% MwSt.</div>
        <div>Quarterly USt-Voranmeldung tracking · Google Sheets sync</div>
        <div className="text-gray-600 pt-1">v1.0.0</div>
      </div>
    </div>
  );
}
