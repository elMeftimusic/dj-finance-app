import { useState, useRef } from "react";
import { useApp } from "../lib/AppContext";
import { Icon, Btn } from "../components/ui";
import { EXPENSE_CATEGORIES } from "../lib/mockData";
import { scanReceipt, isScanningAvailable } from "../lib/scanReceipt";

const today = new Date().toISOString().split("T")[0];

export default function Receipts() {
  const { receipts, addTransaction, uploadReceipt, signedIn } = useApp();
  const [dragging, setDragging]         = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview]           = useState(null);
  const [form, setForm]                 = useState({ amount: "", vendor: "", category: "Equipment", date: today, vat: "" });
  const [uploading, setUploading]       = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [scanResult, setScanResult]     = useState(null); // { confidence }
  const fileRef = useRef();
  const cameraRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setScanResult(null);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Auto-scan if API key is available
    if (isScanningAvailable() && file.type.startsWith("image/")) {
      setScanning(true);
      try {
        const result = await scanReceipt(file);
        setForm(f => ({
          ...f,
          vendor:   result.vendor   || f.vendor,
          date:     result.date     || f.date,
          amount:   result.amount   || f.amount,
          vat:      result.vat      || f.vat,
          category: result.category || f.category,
        }));
        setScanResult({ confidence: result.confidence });
      } catch (e) {
        console.error("Scan failed:", e);
        setScanResult({ confidence: "error", error: e.message });
      } finally {
        setScanning(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!form.amount || !form.vendor) return;
    setUploading(true);
    try {
      // 1. Add expense transaction
      const txId = `TX-${Date.now()}`;
      await addTransaction({
        id: txId,
        type: "expense",
        date: form.date,
        amount: parseFloat(form.amount),
        vat: parseFloat(form.vat) || 0,
        description: form.vendor,
        category: form.category,
      });

      // 2. Upload receipt to Drive (if signed in) — expense always saved regardless
      if (selectedFile && signedIn) {
        await uploadReceipt(selectedFile, txId);
      }

      // Reset
      setSelectedFile(null);
      setPreview(null);
      setScanResult(null);
      setForm({ amount: "", vendor: "", category: "Equipment", date: today, vat: "" });
    } finally {
      setUploading(false);
    }
  };

  // Group receipts by file name prefix for display
  const receiptList = receipts.slice(0, 20);

  const confidenceColor = {
    high:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low:    "text-red-400 bg-red-500/10 border-red-500/20",
    error:  "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="space-y-5">

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          dragging ? "border-purple-500 bg-purple-500/10" : selectedFile ? "border-purple-500/50 bg-purple-500/5" : "border-gray-700 hover:border-gray-600"
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt="receipt" className="max-h-32 mx-auto rounded-xl object-contain" />
            <div className="text-sm text-purple-300 font-medium">{selectedFile?.name}</div>
            <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setPreview(null); setScanResult(null); }}
              className="text-xs text-gray-500 underline">Remove</button>
          </div>
        ) : selectedFile ? (
          <div className="space-y-2">
            <div className="text-4xl">📄</div>
            <div className="text-sm text-purple-300 font-medium">{selectedFile.name}</div>
            <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setScanResult(null); }}
              className="text-xs text-gray-500 underline">Remove</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-gray-500"><Icon name="camera" size={36} /></span>
            <div>
              <div className="text-sm text-gray-300 font-medium">Photo or upload a Rechnung</div>
              <div className="text-xs text-gray-500 mt-1">
                {isScanningAvailable() ? "AI will auto-read the values ✨" : "Tap here or drag & drop"}
              </div>
            </div>
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => cameraRef.current?.click()}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                <Icon name="camera" size={14} /> Camera
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                <Icon name="upload" size={14} /> File
              </button>
            </div>
          </div>
        )}
        {/* Hidden inputs */}
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* AI scanning indicator */}
      {scanning && (
        <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="text-sm text-purple-300">Reading receipt with AI…</div>
        </div>
      )}

      {/* Scan result badge */}
      {scanResult && !scanning && (
        <div className={`flex items-center gap-2 border rounded-2xl px-4 py-2.5 text-xs font-medium ${confidenceColor[scanResult.confidence] || confidenceColor.low}`}>
          {scanResult.confidence === "error" ? (
            <><Icon name="x" size={13} /> Could not read receipt — please fill in manually</>
          ) : (
            <><span>✨</span> AI filled the form ({scanResult.confidence} confidence) — please verify before saving</>
          )}
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {selectedFile ? "Receipt Details" : "Add Expense Manually"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Vendor / Händler</label>
            <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="e.g. Saturn" value={form.vendor} onChange={e => set("vendor", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Date</label>
            <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Total Amount (€)</label>
            <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="142.80" value={form.amount} onChange={e => set("amount", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">VAT on receipt (€)</label>
            <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="22.80" value={form.vat} onChange={e => set("vat", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Category</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            value={form.category} onChange={e => set("category", e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Btn onClick={handleSave} className="w-full" size="lg"
          disabled={uploading || scanning || !form.amount || !form.vendor}>
          {uploading ? "Saving…" : selectedFile ? (signedIn ? "Save & Upload to Drive ☁" : "Save (connect Google to upload)") : "Save Expense"}
        </Btn>
        {!signedIn && selectedFile && (
          <p className="text-xs text-center text-gray-500">Receipt photo won't be uploaded until you connect Google</p>
        )}
      </div>

      {/* Existing receipts */}
      {receiptList.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Uploaded Receipts</div>
          <div className="space-y-2">
            {receiptList.map(r => (
              <div key={r.id} className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 shrink-0 text-lg">
                  {r.name?.endsWith(".pdf") ? "📄" : "🖼"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.createdTime?.split("T")[0]}</div>
                </div>
                {r.webViewLink && r.webViewLink !== "#" && (
                  <a href={r.webViewLink} target="_blank" rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors shrink-0">
                    <Icon name="link" size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
