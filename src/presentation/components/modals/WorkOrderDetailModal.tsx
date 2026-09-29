import React from 'react';
import { X } from 'lucide-react';
import type { WorkOrderListItem } from '../../../domain/entities/backend/WorkOrder';
import { useTheme } from '../../providers/ThemeProvider';

interface WorkOrderDetailModalProps {
  isOpen: boolean;
  detail: WorkOrderListItem | null;
  onClose: () => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({ isOpen, detail, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  if (!isOpen || !detail) return null;

  const card = isDark ? 'bg-[#0d1830] border-[#1c3358]' : 'bg-white border-slate-200';
  const panel = isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200';
  const label = isDark ? 'text-slate-400' : 'text-slate-500';
  const value = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Work order detail">
      <div className={`w-full max-w-xl border rounded-2xl shadow-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className={`text-base font-bold font-mono ${value}`}>{detail.woId}</h3>
          <button type="button" onClick={onClose} aria-label="Tutup detail work order" className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 font-mono text-[11px]">
          {[
            ['Status', detail.status],
            ['Mesin', `${detail.machineName ?? '—'} (${detail.machineId})`],
            ['Produk', `${detail.productName ?? '—'} (${detail.productId ?? '—'})`],
            ['Operator', `${detail.operatorName ?? '—'} (${detail.operatorId ?? '—'})`],
            ['Target', `${detail.targetQty} pcs`],
            ['Dibuat', detail.createdAt],
            ['Mulai', detail.startTime ?? '—'],
            ['Selesai', detail.endTime ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className={`p-2 rounded-lg border ${panel}`}>
              <div className={label}>{k}</div>
              <div className={`font-bold mt-0.5 break-words ${value}`}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
