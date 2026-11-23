import React, { useState } from 'react';
import { X, PlusCircle, AlertOctagon } from 'lucide-react';
import { DowntimeReasonItem } from '../../../domain/index';
import type { DowntimeCategory, DowntimeEvent } from '../../../domain/entities/backend/Telemetry';
import { useTheme } from '../../providers/ThemeProvider';

/** Input pelabelan downtime backend: wajib menunjuk eventId yang masih terbuka/belum dilabel. */
export interface BackendDowntimeLabelInput {
  backendEventId: number;
  category: DowntimeCategory;
  label: string;
  durationMinutes: number;
  notes?: string;
}

interface LogEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  onAddDowntime: (item: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'> | BackendDowntimeLabelInput) => void;
  /** true = lane backend: downtime diambil dari daftar labelable, tab defect disembunyikan. */
  isBackendMode?: boolean;
  /** Event downtime yang bisa dilabel (dari listLabelableDowntimesUseCase). */
  labelableDowntimes?: DowntimeEvent[];
  /** FR-007: gate capability downtime.reason.label. */
  labelDisabled?: boolean;
  gateReason?: string;
}

const SIX_BIG_LOSSES_CATEGORIES: DowntimeCategory[] = [
  'EQUIPMENT_FAILURE',
  'SETUP_AND_ADJUSTMENT',
  'IDLING_AND_MINOR_STOPPAGE',
  'REDUCED_SPEED',
  'PROCESS_DEFECT',
  'MATERIAL_SHORTAGE',
  'PLANNED_MAINTENANCE',
  'REST_BREAK',
  'CLEANING_5S',
  'OTHER',
];

export const LogEventModal: React.FC<LogEventModalProps> = ({
  isOpen,
  onClose,
  machineId,
  onAddDowntime,
  isBackendMode = false,
  labelableDowntimes = [],
  labelDisabled = false,
  gateReason,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Downtime form state (lane simulasi)
  const [dtCategory, setDtCategory] = useState<DowntimeReasonItem['category']>('Breakdown');
  const [dtLabel, setDtLabel] = useState('');
  const [dtDuration, setDtDuration] = useState(10);

  // Backend labeling form state (POST /downtime-events/:id/reason)
  const [beEventId, setBeEventId] = useState<number | ''>('');
  const [beCategory, setBeCategory] = useState<DowntimeCategory>('EQUIPMENT_FAILURE');
  const [beReason, setBeReason] = useState('');
  const [beNotes, setBeNotes] = useState('');

  if (!isOpen) return null;

  const handleDowntimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBackendMode) {
      if (typeof beEventId !== 'number' || beReason.trim().length < 3) return;
      const target = labelableDowntimes.find((d) => d.id === beEventId);
      onAddDowntime({
        backendEventId: beEventId,
        category: beCategory,
        label: beReason.trim(),
        durationMinutes: target?.endTime
          ? Math.max(1, Math.round((new Date(target.endTime).getTime() - new Date(target.startTime).getTime()) / 60000))
          : 1,
        notes: beNotes.trim() || undefined,
      });
      setBeReason('');
      setBeNotes('');
      onClose();
      return;
    }
    if (!dtLabel.trim()) return;
    onAddDowntime({
      category: dtCategory,
      label: dtLabel.trim(),
      durationMinutes: Number(dtDuration),
    });
    setDtLabel('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`border rounded-xl max-w-lg w-full p-5 shadow-2xl transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-500" />
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Log Floor Event / Loss for {machineId}</h3>
          </div>
          <button type="button" 
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          {isBackendMode ? (
          <form onSubmit={handleDowntimeSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Downtime Event (belum dilabel)</label>
              <select
                value={beEventId}
                onChange={(e) => setBeEventId(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="">— pilih event —</option>
                {labelableDowntimes.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.id} · {new Date(d.startTime).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })} · {(d.machineId ?? d.deviceId ?? '').toString()}
                  </option>
                ))}
              </select>
              {labelableDowntimes.length === 0 && (
                <p className={`mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tidak ada downtime yang perlu dilabel saat ini.</p>
              )}
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Kategori Six Big Losses</label>
              <select
                value={beCategory}
                onChange={(e) => setBeCategory(e.target.value as DowntimeCategory)}
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {SIX_BIG_LOSSES_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Reason / Description (min 3 karakter)</label>
              <input
                type="text"
                value={beReason}
                onChange={(e) => setBeReason(e.target.value)}
                placeholder="e.g. Pahat aus dan patah saat batch 3"
                required
                minLength={3}
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Notes (opsional, maks 500)</label>
              <input
                type="text"
                value={beNotes}
                onChange={(e) => setBeNotes(e.target.value)}
                placeholder="Catatan tambahan operator"
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={labelDisabled}
                title={labelDisabled ? gateReason : undefined}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <AlertOctagon className="w-4 h-4" />
                Label Downtime
              </button>
            </div>
          </form>
          ) : (
          <form onSubmit={handleDowntimeSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Downtime Category</label>
              <select
                value={dtCategory}
                onChange={(e) => setDtCategory(e.target.value as DowntimeReasonItem['category'])}
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="Breakdown">Breakdown (Equipment Failure)</option>
                <option value="Material">Material Starvation / Wait</option>
                <option value="Changeover">Changeover & Setup</option>
                <option value="Adjustment">Adjustment & Tuning</option>
                <option value="Other">Other Minor Stop</option>
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Reason / Description</label>
              <input
                type="text"
                value={dtLabel}
                onChange={(e) => setDtLabel(e.target.value)}
                placeholder="e.g. Die pinch sensor misalignment"
                required
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Duration (Minutes)</label>
              <input
                type="number"
                min="1"
                max="240"
                value={dtDuration}
                onChange={(e) => setDtDuration(Number(e.target.value))}
                className={`w-full border rounded-lg p-2.5 font-mono focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={labelDisabled}
                title={labelDisabled ? gateReason : undefined}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <AlertOctagon className="w-4 h-4" />
                Add Downtime
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
