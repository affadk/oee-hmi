import React, { useState } from 'react';
import { X, PlusCircle, AlertOctagon, ShieldAlert } from 'lucide-react';
import { DowntimeReasonItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface LogEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  onAddDowntime: (item: Omit<DowntimeReasonItem, 'id' | 'equivalentLossPcs'>) => void;
  onAddReject: (reason: string, count: number) => void;
}

export const LogEventModal: React.FC<LogEventModalProps> = ({
  isOpen,
  onClose,
  machineId,
  onAddDowntime,
  onAddReject,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<'DOWNTIME' | 'DEFECT'>('DOWNTIME');
  
  // Downtime form state
  const [dtCategory, setDtCategory] = useState<DowntimeReasonItem['category']>('Breakdown');
  const [dtLabel, setDtLabel] = useState('');
  const [dtDuration, setDtDuration] = useState(10);

  // Defect form state
  const [defectReason, setDefectReason] = useState('Dimension / Hole Off-center');
  const [defectCount, setDefectCount] = useState(5);

  if (!isOpen) return null;

  const handleDowntimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dtLabel.trim()) return;
    onAddDowntime({
      category: dtCategory,
      label: dtLabel.trim(),
      durationMinutes: Number(dtDuration),
      occurrences: 1,
    });
    setDtLabel('');
    onClose();
  };

  const handleDefectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReject(defectReason, Number(defectCount));
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
          <button 
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className={`flex border-b mt-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={() => setTab('DOWNTIME')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
              tab === 'DOWNTIME'
                ? 'border-rose-500 text-rose-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Log Downtime (Minutes)
          </button>
          <button
            type="button"
            onClick={() => setTab('DEFECT')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
              tab === 'DEFECT'
                ? 'border-purple-500 text-purple-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Log Defect / Scrap (Pieces)
          </button>
        </div>

        {tab === 'DOWNTIME' ? (
          <form onSubmit={handleDowntimeSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Downtime Category</label>
              <select
                value={dtCategory}
                onChange={(e) => setDtCategory(e.target.value as any)}
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
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <AlertOctagon className="w-4 h-4" />
                Add Downtime
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDefectSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Defect Reason</label>
              <select
                value={defectReason}
                onChange={(e) => setDefectReason(e.target.value)}
                className={`w-full border rounded-lg p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="Dimension / Hole Off-center">Dimension / Hole Off-center</option>
                <option value="Surface Scratches & Burrs">Surface Scratches & Burrs</option>
                <option value="Forming Crack / Wrinkle">Forming Crack / Wrinkle</option>
                <option value="Other Minor Flaws">Other Minor Flaws</option>
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Quantity Rejected (Pieces)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={defectCount}
                onChange={(e) => setDefectCount(Number(e.target.value))}
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
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                Log Defect Scrap
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
