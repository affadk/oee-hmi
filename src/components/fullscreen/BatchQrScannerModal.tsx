import React, { useState } from 'react';
import { QrCode, X, CheckCircle, Layers, Cpu, UserCheck, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { MachineConfig } from '../../types';

interface BatchQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: MachineConfig;
  allMachines: MachineConfig[];
  onSwitchMachine: (id: string) => void;
  onApplyJobConfig: (
    wo: string,
    product: string,
    operator: string,
    target: number,
    cycleTimeSec?: number
  ) => Promise<void>;
}

const PRESET_QR_CODES = {
  PRODUCTS: [
    { code: 'QR-PRD-00', productName: 'Sodium Tablets 500mg', workOrder: 'WO-2026-0920-00', cycleTimeSec: 9, targetQty: 12500 },
    { code: 'QR-PRD-01', productName: 'Flange Housing B-20', workOrder: 'WO-2026-0920-01', cycleTimeSec: 45, targetQty: 560 },
    { code: 'QR-PRD-02', productName: 'Drive Shaft Type-C', workOrder: 'WO-2026-0920-02', cycleTimeSec: 30, targetQty: 840 },
    { code: 'QR-PRD-03', productName: 'Brake Disc Rotor 240mm', workOrder: 'WO-2026-0920-03', cycleTimeSec: 60, targetQty: 420 },
  ],
  OPERATORS: [
    { code: 'QR-OP-01', operatorName: 'Budi Santoso', operatorId: 'OP-4021' },
    { code: 'QR-OP-02', operatorName: 'Agus Wijaya', operatorId: 'OP-4108' },
    { code: 'QR-OP-03', operatorName: 'Siti Rahmawati', operatorId: 'OP-3995' },
  ],
  SCHEDULES: [
    {
      code: 'QR-SCH-01',
      shiftName: 'Shift 1 (Pagi)',
      shiftStart: '07:00',
      shiftEnd: '15:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      breakMin: 60,
    },
    {
      code: 'QR-SCH-02',
      shiftName: 'Shift 2 (Siang)',
      shiftStart: '15:00',
      shiftEnd: '23:00',
      breakStart: '18:00',
      breakEnd: '19:00',
      breakMin: 60,
    },
  ],
};

export const BatchQrScannerModal: React.FC<BatchQrScannerModalProps> = ({
  isOpen,
  onClose,
  machine,
  allMachines,
  onSwitchMachine,
  onApplyJobConfig,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'PRODUCT' | 'MACHINE' | 'OPERATOR' | 'SCHEDULE'>('PRODUCT');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentWo = machine.jobConfig?.workOrder || 'WO-2026-0920-01';
  const currentProduct = machine.jobConfig?.productName || machine.currentProduct || 'Product A';
  const currentOp = machine.jobConfig?.operatorName || 'Budi Santoso';
  const currentTarget = machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 560;

  const handleApplyProduct = async (p: typeof PRESET_QR_CODES.PRODUCTS[0]) => {
    await onApplyJobConfig(p.workOrder, p.productName, currentOp, p.targetQty, p.cycleTimeSec);
    setNotification(`Berhasil scan QR Produk: ${p.productName} (CT: ${p.cycleTimeSec}s, Target: ${p.targetQty} pcs)`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleApplyMachine = (machineId: string, name: string) => {
    onSwitchMachine(machineId);
    setNotification(`Berhasil scan QR Mesin: ${name}`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleApplyOperator = async (op: typeof PRESET_QR_CODES.OPERATORS[0]) => {
    await onApplyJobConfig(currentWo, currentProduct, `${op.operatorName} (${op.operatorId})`, currentTarget);
    setNotification(`Berhasil scan QR Operator Badge: ${op.operatorName} (${op.operatorId})`);
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl rounded-2xl p-5 shadow-2xl border ${
        isDark ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Setup Batch Produksi via QR Code
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  4 Identitas Batch
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih atau simulasikan pemindaian QR Code fisik dari lembar instruksi kerja (Job Sheet)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {notification}
          </div>
        )}

        {/* Current Active Parameters from 4 QR */}
        <div className={`p-3 rounded-xl border mb-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">1. Mesin & Line</span>
            <strong className="text-slate-200 block truncate">{machine.name}</strong>
            <span className="text-[10px] text-blue-400">{machine.line || 'Line 2'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">2. Part & Target</span>
            <strong className="text-slate-200 block truncate">{currentProduct}</strong>
            <span className="text-[10px] text-amber-400">Target: {currentTarget} pcs</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">3. Operator</span>
            <strong className="text-slate-200 block truncate">{currentOp}</strong>
            <span className="text-[10px] text-emerald-400">{machine.jobConfig?.operatorId || 'OP-4021'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">4. Shift & Break</span>
            <strong className="text-slate-200 block truncate">
              {machine.jobConfig?.shiftStart || '07:00'} - {machine.jobConfig?.shiftEnd || '15:00'}
            </strong>
            <span className="text-[10px] text-purple-400">Istirahat: 12:00-13:00 (60m)</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-700/50 mb-4 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PRODUCT')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'PRODUCT'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Produk & Cycle Time
          </button>
          <button
            onClick={() => setActiveTab('MACHINE')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'MACHINE'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            2. Mesin & Line
          </button>
          <button
            onClick={() => setActiveTab('OPERATOR')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'OPERATOR'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            3. Operator ID
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SCHEDULE'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            4. Jadwal Shift
          </button>
        </div>

        {/* Tab Content Presets */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {activeTab === 'PRODUCT' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_QR_CODES.PRODUCTS.map((p) => (
                <div
                  key={p.code}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    currentProduct === p.productName
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                      : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>{p.code}</span>
                      <span className="font-bold text-amber-400">{p.cycleTimeSec}s CT</span>
                    </div>
                    <strong className="text-xs text-slate-200 block mb-1">{p.productName}</strong>
                    <div className="text-[11px] font-mono text-slate-400 mb-2">Target: {p.targetQty} pcs</div>
                  </div>
                  <button
                    onClick={() => handleApplyProduct(p)}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR Produk Ini
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'MACHINE' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {allMachines.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    machine.id === m.id
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                      : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>QR-{m.deviceId || m.id}</span>
                      <span className="text-blue-400 font-bold">{m.deviceId || m.id}</span>
                    </div>
                    <strong className="text-xs text-slate-200 block mb-1">{m.name}</strong>
                    <div className="text-[11px] text-slate-400 mb-2">{m.line || 'Production Line'}</div>
                  </div>
                  <button
                    onClick={() => handleApplyMachine(m.id, m.name)}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR Mesin Ini
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'OPERATOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_QR_CODES.OPERATORS.map((op) => (
                <div
                  key={op.code}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    currentOp.includes(op.operatorName)
                      ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                      : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>{op.code}</span>
                      <span className="text-emerald-400 font-bold">{op.operatorId}</span>
                    </div>
                    <strong className="text-xs text-slate-200 block mb-1">{op.operatorName}</strong>
                    <div className="text-[11px] text-slate-400 mb-2">Shift Operator</div>
                  </div>
                  <button
                    onClick={() => handleApplyOperator(op)}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR Badge Ini
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'SCHEDULE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_QR_CODES.SCHEDULES.map((sch) => (
                <div
                  key={sch.code}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>{sch.code}</span>
                      <span className="text-purple-400 font-bold">{sch.shiftName}</span>
                    </div>
                    <strong className="text-xs text-slate-200 block mb-1">
                      Jam Produksi: {sch.shiftStart} - {sch.shiftEnd}
                    </strong>
                    <div className="text-[11px] font-mono text-slate-400 mb-2">
                      Jam Istirahat: {sch.breakStart} - {sch.breakEnd} ({sch.breakMin}m)
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNotification(`Berhasil scan QR Shift: ${sch.shiftName}`);
                      setTimeout(() => setNotification(null), 2500);
                    }}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR Shift Ini
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <span>* Sinkronisasi parameter produk, target qty, dan siklus standar ke sistem OEE.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
