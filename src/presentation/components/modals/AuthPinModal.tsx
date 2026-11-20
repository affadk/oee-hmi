import React, { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

interface AuthPinModalProps {
  isOpen: boolean;
  error?: string;
  /** login = operator_id+password (020); change-password = gerbang rotasi (spec 043). */
  mode?: 'login' | 'change-password';
  /** Countdown 429 Retry-After; submit nonaktif selama > 0 (FR-003). */
  retryAfterSec?: number;
  onClose: () => void;
  onSubmit: (operatorId: string, password: string) => Promise<void>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
}

/**
 * Modal auth operator. Nama file/komponen dipertahankan (diff minimal);
 * kontrak backend 020: password, bukan PIN numerik. Gaya visual tetap.
 */
export const AuthPinModal: React.FC<AuthPinModalProps> = ({
  isOpen,
  error,
  mode = 'login',
  retryAfterSec = 0,
  onClose,
  onSubmit,
  onChangePassword,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isRotation = mode === 'change-password';
  const locked = retryAfterSec > 0;
  const canSubmit = isRotation
    ? password.length >= 8 && newPassword.length >= 8
    : operatorId.trim().length > 0 && password.length >= 8;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || locked || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isRotation) {
        await onChangePassword?.(password, newPassword);
        setNewPassword('');
      } else {
        await onSubmit(operatorId.trim(), password);
      }
      setPassword('');
    } catch {
      // error surfaced via props.error (hook state) — modal tetap terbuka
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full border rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500 ${
    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;
  const labelClass = `block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={isRotation ? 'Ganti password operator' : 'Login operator'}>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm border rounded-xl p-5 shadow-2xl ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LockKeyhole className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold">{isRotation ? 'Ganti Password Wajib' : 'Operator Authorization'}</h3>
          </div>
          <button type="button" onClick={onClose} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          {!isRotation && (
            <label className="block">
              <span className={labelClass}>Operator ID</span>
              <input
                value={operatorId}
                onChange={(event) => setOperatorId(event.target.value)}
                placeholder="OPR-1001"
                autoComplete="username"
                required
                className={inputClass}
              />
            </label>
          )}
          <label className="block">
            <span className={labelClass}>{isRotation ? 'Password saat ini' : 'Password'}</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={isRotation ? 'current-password' : 'current-password'}
              minLength={8}
              required
              autoFocus
              className={inputClass}
            />
          </label>
          {isRotation && (
            <label className="block">
              <span className={labelClass}>Password baru (min 8)</span>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className={inputClass}
              />
            </label>
          )}
          {locked && (
            <p className="text-amber-500 font-semibold" role="status">
              Terlalu banyak percobaan. Coba lagi dalam {retryAfterSec} detik.
            </p>
          )}
          {error && <p className="text-rose-500 font-semibold" role="alert">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-2 rounded-lg border font-semibold ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!canSubmit || locked || isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses…' : isRotation ? 'Ganti & Login Ulang' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
};
