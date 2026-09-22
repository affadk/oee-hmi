import React, { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

interface AuthPinModalProps {
  isOpen: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (pin: string, operatorId?: string) => Promise<void>;
}

export const AuthPinModal: React.FC<AuthPinModalProps> = ({ isOpen, error, onClose, onSubmit }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pin, setPin] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pin.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(pin.trim(), operatorId.trim() || undefined);
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Operator PIN">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm border rounded-xl p-5 shadow-2xl ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LockKeyhole className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold">Operator Authorization</h3>
          </div>
          <button type="button" onClick={onClose} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <label className="block">
            <span className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Operator ID</span>
            <input
              value={operatorId}
              onChange={(event) => setOperatorId(event.target.value)}
              placeholder="Optional"
              className={`w-full border rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </label>
          <label className="block">
            <span className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>PIN</span>
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric"
              type="password"
              autoFocus
              className={`w-full border rounded-lg px-3 py-2 text-lg font-mono tracking-[0.35em] outline-none focus:border-blue-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </label>
          {error && <p className="text-rose-500 font-semibold">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-2 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || pin.length < 4}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold"
          >
            {isSubmitting ? 'Checking…' : 'Authorize'}
          </button>
        </div>
      </form>
    </div>
  );
};
