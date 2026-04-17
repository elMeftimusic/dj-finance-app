// ─── PIN Lock Screen ───────────────────────────────────────────────────────
// Protects the app with a 4-digit PIN.
// Default PIN is 1234 — change it in Settings once you're in.
// PIN is stored hashed in localStorage.

import { useState, useEffect } from "react";
import { Icon } from "./ui";

const DEFAULT_PIN = "2579";
const STORAGE_KEY = "djfinance_pin_hash";
const SESSION_KEY = "djfinance_unlocked";

// Simple hash — not cryptographic but fine for a personal app
function hashPin(pin) {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function getStoredHash() {
  // If no PIN set yet, use default
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return hashPin(DEFAULT_PIN);
  return stored;
}

// Call this once to reset to default PIN (clears any corrupted stored PIN)
export function resetToDefaultPin() {
  localStorage.removeItem(STORAGE_KEY);
}

export function checkPin(pin) {
  return hashPin(pin) === getStoredHash();
}

export function setNewPin(pin) {
  localStorage.setItem(STORAGE_KEY, hashPin(pin));
}

export function isUsingDefaultPin() {
  return getStoredHash() === hashPin(DEFAULT_PIN);
}

export default function PinLock({ onUnlock }) {
  const [digits, setDigits]   = useState([]);
  const [error, setError]     = useState(false);
  const [shake, setShake]     = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]   = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Lockout after 5 wrong attempts
  useEffect(() => {
    if (!locked) return;
    let t = 30;
    setLockTimer(t);
    const interval = setInterval(() => {
      t--;
      setLockTimer(t);
      if (t <= 0) {
        setLocked(false);
        setAttempts(0);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleDigit = (d) => {
    if (locked) return;
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    setError(false);

    if (next.length === 4) {
      setTimeout(() => {
        const pin = next.join("");
        if (checkPin(pin)) {
          sessionStorage.setItem(SESSION_KEY, "1");
          onUnlock();
        } else {
          setShake(true);
          setError(true);
          setAttempts(a => {
            const newA = a + 1;
            if (newA >= 5) setLocked(true);
            return newA;
          });
          setTimeout(() => {
            setDigits([]);
            setShake(false);
          }, 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setDigits(d => d.slice(0, -1));
    setError(false);
  };

  const KEYS = [
    [1,2,3],
    [4,5,6],
    [7,8,9],
    [null, 0, "del"],
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-8"
      style={{ maxWidth: 430, margin: "0 auto" }}>

      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
          <Icon name="music" size={30} />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">DJ Finance</div>
        <div className="text-sm text-gray-500 mt-1">Enter your PIN to continue</div>
      </div>

      {/* Dots */}
      <div className={`flex gap-5 mb-10 transition-all ${shake ? "animate-bounce" : ""}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            i < digits.length
              ? error ? "bg-red-500 border-red-500" : "bg-purple-500 border-purple-500"
              : "bg-transparent border-gray-600"
          }`} />
        ))}
      </div>

      {/* Error / lockout message */}
      {error && !locked && (
        <div className="text-red-400 text-sm mb-6 font-medium">
          Wrong PIN {attempts >= 3 ? `(${5 - attempts} attempts left)` : ""}
        </div>
      )}
      {locked && (
        <div className="text-red-400 text-sm mb-6 font-medium text-center">
          Too many attempts. Try again in {lockTimer}s
        </div>
      )}
      {!error && !locked && <div className="mb-6 h-5" />}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {KEYS.flat().map((key, i) => {
          if (key === null) return <div key={i} />;
          if (key === "del") return (
            <button key={i} onClick={handleDelete}
              className="h-16 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-800 active:bg-gray-700 transition-colors">
              <Icon name="x" size={20} />
            </button>
          );
          return (
            <button key={i} onClick={() => handleDigit(key)}
              disabled={locked}
              className={`h-16 rounded-2xl text-xl font-semibold text-white transition-all active:scale-95 ${
                locked ? "bg-gray-800 text-gray-600" : "bg-gray-800 hover:bg-gray-700 active:bg-purple-600"
              }`}>
              {key}
            </button>
          );
        })}
      </div>

    </div>
  );
}
