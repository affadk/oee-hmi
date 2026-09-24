// /src/components/fullscreen/BatchQrScannerModal.tsx
//
// Setup Batch Produksi via QR Code — dibangun ulang sebagai wizard 5 langkah:
//   1 Produk & Cycle Time → 2 Mesin & Line → 3 Operator → 4 Jadwal Shift → 5 Review & Terapkan
//
// - Satu batch = 4 identitas QR (produk, mesin, operator, shift).
// - Setiap langkah: kartu preset + kolom input QR manual (label / JSON / key=value)
//   yang di-parse oleh domain `parseQrString`.
// - Langkah Review menampilkan diff lama → baru dan menerapkan semuanya
//   dalam satu aksi batch (switch mesin + SET_JOB_CONFIG + shift override).
// - Full theme support: seluruh warna lewat `useTheme()` + token `tx()` —
//   tidak ada lagi warna dark yang bocor ke light mode.
// - A11y: role=dialog, aria-modal, Esc/backdrop untuk tutup, fokus awal,
//   langkah memakai aria-current, toast memakai aria-live.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  UserCheck,
  Calendar,
  ClipboardCheck,
  ScanLine,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  MonitorSmartphone,
} from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import { tx, cx, themeTokens } from '../../styles/themeTokens';
import type { MachineConfig } from '../../../domain/index';
import {
  QR_PRODUCT_CATALOG,
  QR_OPERATOR_CATALOG,
  QR_SCHEDULE_CATALOG,
  parseQrString,
  formatOperatorDisplay,
  scheduleToShiftOverride,
  type BatchDraft,
  type QrBatchStep,
  type QrOperatorPreset,
  type QrSchedulePreset,
} from '../../../domain/entities/BatchQr';

export interface BatchShiftOverride {
  shiftStart: string;
  shiftEnd: string;
  breakWindow: string;
  breakMin: number;
}

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
    cycleTimeSec?: number,
    shiftOverride?: BatchShiftOverride,
  ) => Promise<void>;
  /** Backend lane: ganti Terapkan-MQTT dengan pilih WO antrean. */
  backendMode?: boolean;
  /** Daftar WO antrean untuk validasi; kosong = tidak dikenal, teruskan ke preview. */
  pendingWorkOrderIds?: string[];
  onSelectWorkOrder?: (woId: string) => void;
}

const STEPS: Array<{ id: QrBatchStep; index: number; label: string; short: string }> = [
  { id: 'PRODUCT', index: 0, label: 'Produk & Cycle Time', short: 'Produk' },
  { id: 'MACHINE', index: 1, label: 'Mesin & Line', short: 'Mesin' },
  { id: 'OPERATOR', index: 2, label: 'Operator ID', short: 'Operator' },
  { id: 'SCHEDULE', index: 3, label: 'Jadwal Shift', short: 'Shift' },
  { id: 'REVIEW', index: 4, label: 'Review & Terapkan', short: 'Review' },
];

const STEP_ICONS = [Layers, Cpu, UserCheck, Calendar, ClipboardCheck] as const;

interface Toast {
  kind: 'success' | 'error' | 'info';
  message: string;
}

function draftFromMachine(machine: MachineConfig): BatchDraft {
  const job = machine.jobConfig;
  const productMatch =
    QR_PRODUCT_CATALOG.find((p) => p.productName === (job?.productName || machine.currentProduct)) ??
    QR_PRODUCT_CATALOG[1] ??
    QR_PRODUCT_CATALOG[0];
  if (!productMatch) throw new Error('Katalog produk QR kosong.');
  const operatorName = job?.operatorName || '—';
  const operatorId = job?.operatorId || '—';
  const operatorMatch =
    QR_OPERATOR_CATALOG.find((o) => o.operatorId === operatorId || o.operatorName === operatorName) ??
    ({ code: 'QR-CUSTOM', operatorName, operatorId } as QrOperatorPreset);
  const scheduleMatch =
    QR_SCHEDULE_CATALOG.find((s) => s.shiftStart === job?.shiftStart && s.shiftEnd === job?.shiftEnd) ??
    QR_SCHEDULE_CATALOG[0];
  if (!scheduleMatch) throw new Error('Katalog shift QR kosong.');
  return { product: productMatch, machineId: machine.id, operator: operatorMatch, schedule: scheduleMatch };
}

export const BatchQrScannerModal: React.FC<BatchQrScannerModalProps> = ({
  isOpen,
  onClose,
  machine,
  allMachines,
  onSwitchMachine,
  onApplyJobConfig,
  backendMode = false,
  pendingWorkOrderIds = [],
  onSelectWorkOrder,
}) => {
  const { isDark, theme, setTheme } = useTheme();

  const [step, setStep] = useState<QrBatchStep>('PRODUCT');
  const [draft, setDraft] = useState<BatchDraft>(() => draftFromMachine(machine));
  const [manualQr, setManualQr] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [scanningCode, setScanningCode] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset draft setiap kali modal dibuka agar selalu sinkron dengan mesin aktif.
  useEffect(() => {
    if (isOpen) {
      setDraft(draftFromMachine(machine));
      setStep('PRODUCT');
      setManualQr('');
      setToast(null);
      setScanningCode(null);
      setApplying(false);
      setApplied(false);
      // Fokus ke kolom QR setelah mount untuk alur keyboard.
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return undefined;
    // DISENGAJA: reset draft hanya saat dibuka — machine sengaja di luar deps
    // agar pulse telemetri tidak me-reset draft saat modal terbuka.
    // (exhaustive-deps tidak terpasang: typescript-eslint belum mendukung TS 7.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Esc untuk tutup + kunci scroll body selama modal terbuka.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [isOpen, onClose]);

  const showToast = useCallback((kind: Toast['kind'], message: string, ms = 2800) => {
    setToast({ kind, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const stepIndex = useMemo(() => STEPS.find((s) => s.id === step)?.index ?? 0, [step]);

  // Nilai aktif saat ini (dari mesin) untuk badge "Aktif" dan diff Review.
  const current = useMemo(() => {
    const job = machine.jobConfig;
    return {
      productName: job?.productName || machine.currentProduct || '-',
      workOrder: job?.workOrder || '-',
      cycleTimeSec: job?.standardCycleTimeSec ?? machine.idealCycleTimeSec ?? 0,
      targetQty: job?.targetQuantity ?? machine.targetCount ?? 0,
      machineId: machine.id,
      machineName: machine.name,
      operatorDisplay: `${job?.operatorName || '-'} (${job?.operatorId || '-'})`,
      shiftLabel: `${job?.shiftStart || '-'} - ${job?.shiftEnd || '-'}`,
      breakLabel: job?.breakTimeWindow || `${job?.plannedBreakMin ?? 60}m`,
    };
  }, [machine]);

  const simulateScan = useCallback(
    (code: string, apply: () => void, label: string) => {
      setScanningCode(code);
      if (scanTimer.current) clearTimeout(scanTimer.current);
      scanTimer.current = setTimeout(() => {
        setScanningCode(null);
        apply();
        showToast('success', `Berhasil scan ${label}`);
      }, 450);
    },
    [showToast],
  );

  const applyParsedQr = useCallback(
    (raw: string) => {
      let parsed;
      try {
        parsed = parseQrString(raw);
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'QR tidak valid.');
        return;
      }
      if (parsed.kind === 'PRODUCT' && parsed.product) {
        const p = parsed.product;
        // Produk custom (di luar katalog) tetap bisa dipakai — daftarkan sementara ke draft.
        setDraft((d) => ({ ...d, product: p }));
        setStep('PRODUCT');
        showToast('success', `QR Produk dikenali: ${p.productName} (CT ${p.cycleTimeSec}s, target ${p.targetQty})`);
      } else if (parsed.kind === 'OPERATOR' && parsed.operator) {
        setDraft((d) => ({ ...d, operator: parsed.operator as QrOperatorPreset }));
        setStep('OPERATOR');
        showToast('success', `QR Operator dikenali: ${formatOperatorDisplay(parsed.operator as QrOperatorPreset)}`);
      } else if (parsed.kind === 'SCHEDULE' && parsed.schedule) {
        setDraft((d) => ({ ...d, schedule: parsed.schedule as QrSchedulePreset }));
        setStep('SCHEDULE');
        showToast('success', `QR Shift dikenali: ${(parsed.schedule as QrSchedulePreset).shiftName}`);
      } else if (parsed.kind === 'MACHINE' && parsed.machineId) {
        const found = allMachines.find(
          (m) => m.id === parsed.machineId || m.deviceId === parsed.machineId,
        );
        if (!found) {
          showToast('error', `Mesin "${parsed.machineId}" tidak terdaftar di dashboard ini.`);
          return;
        }
        setDraft((d) => ({ ...d, machineId: found.id }));
        setStep('MACHINE');
        showToast('success', `QR Mesin dikenali: ${found.name}`);
      }
      setManualQr('');
    },
    [allMachines, showToast],
  );

  const handleApplyBatch = useCallback(async () => {
    setApplying(true);
    try {
      if (draft.machineId !== machine.id) {
        onSwitchMachine(draft.machineId);
      }
      await onApplyJobConfig(
        draft.product.workOrder,
        draft.product.productName,
        formatOperatorDisplay(draft.operator),
        draft.product.targetQty,
        draft.product.cycleTimeSec,
        scheduleToShiftOverride(draft.schedule),
      );
      setApplied(true);
      showToast('success', 'Batch diterapkan — parameter OEE tersinkronisasi.', 3500);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menerapkan batch.');
    } finally {
      setApplying(false);
    }
  }, [draft, machine.id, onSwitchMachine, onApplyJobConfig, showToast]);

  const handleReset = useCallback(() => {
    setDraft(draftFromMachine(machine));
    setApplied(false);
    showToast('info', 'Draft dikembalikan ke konfigurasi mesin aktif.');
  }, [machine, showToast]);

  // Backend lane: WO hasil scan dicocokkan ke antrean, lalu dipratinjau di
  // ProductionSetupModal — tanpa SET_JOB_CONFIG MQTT.
  const handleSelectWorkOrder = useCallback(() => {
    const woId = draft.product.workOrder.trim();
    if (!woId) {
      showToast('error', 'Draft belum memuat nomor WO — scan QR produk dahulu.');
      return;
    }
    if (pendingWorkOrderIds.length > 0 && !pendingWorkOrderIds.includes(woId)) {
      showToast('error', `WO ${woId} tidak ada di antrean backend.`);
      return;
    }
    onSelectWorkOrder?.(woId);
  }, [draft.product.workOrder, onSelectWorkOrder, pendingWorkOrderIds, showToast]);

  if (!isOpen) return null;

  const goStep = (id: QrBatchStep) => {
    setStep(id);
    setApplied(false);
  };

  const cardBase = cx(
    'p-3 rounded-xl border flex flex-col justify-between transition-all text-left w-full',
    tx(themeTokens.cardInset, isDark),
    tx(themeTokens.cardHover, isDark),
  );
  const manualPlaceholder =
    step === 'PRODUCT'
      ? 'Tempel QR produk — cth: QR-PRD-01 atau WO=WO-9;PRD=Flange;CT=45;TARGET=560'
      : step === 'OPERATOR'
        ? 'Tempel QR badge — cth: QR-OP-02 atau {"type":"OPERATOR",...}'
        : step === 'SCHEDULE'
          ? 'Tempel QR shift — cth: QR-SCH-02'
          : step === 'MACHINE'
            ? 'Tempel QR mesin — cth: QR-MC-STM32-OEE-01'
            : 'Tempel kode QR apa pun — otomatis diarahkan ke langkah yang tepat';

  const targetRate = draft.product.cycleTimeSec > 0 ? Math.round(3600 / draft.product.cycleTimeSec) : 0;
  const draftOperatorDisplay = formatOperatorDisplay(draft.operator);
  const draftShiftLabel = `${draft.schedule.shiftStart} - ${draft.schedule.shiftEnd}`;
  const changed =
    draft.product.productName !== current.productName ||
    draft.machineId !== current.machineId ||
    draftOperatorDisplay !== current.operatorDisplay ||
    draft.product.targetQty !== current.targetQty ||
    draftShiftLabel !== current.shiftLabel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-qr-title"
        aria-describedby="batch-qr-desc"
        className={cx(
          'relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-2xl p-5 shadow-2xl border',
          isDark ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900',
        )}
      >
        {/* Header */}
        <div className={cx('flex items-center justify-between gap-3 pb-3 border-b mb-4', tx(themeTokens.divider, isDark))}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="batch-qr-title" className="text-base font-bold flex items-center gap-2 flex-wrap">
                Setup Batch Produksi via QR Code
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  4 Identitas Batch
                </span>
              </h2>
              <p id="batch-qr-desc" className={cx('text-xs', tx(themeTokens.textMuted, isDark))}>
                Pindai atau pilih QR Produk → Mesin → Operator → Shift, lalu terapkan sekaligus di Review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
              aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
              className={cx('p-1.5 rounded-lg transition-colors cursor-pointer', tx(themeTokens.closeButton, isDark))}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              aria-label="Tutup dialog setup batch"
              className={cx('p-1.5 rounded-lg transition-colors cursor-pointer', tx(themeTokens.closeButton, isDark))}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        <ol className="flex items-center gap-1 mb-4 overflow-x-auto" aria-label="Langkah setup batch">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? Layers;
            const isActive = s.id === step;
            const isDone =
              (s.id === 'PRODUCT' && stepIndex > 0) ||
              (s.id === 'MACHINE' && stepIndex > 1) ||
              (s.id === 'OPERATOR' && stepIndex > 2) ||
              (s.id === 'SCHEDULE' && stepIndex > 3);
            return (
              <li key={s.id} className="flex items-center gap-1 shrink-0">
                {i > 0 && <span className={cx('w-3 h-px mx-0.5', isDark ? 'bg-slate-700' : 'bg-slate-300')} aria-hidden="true" />}
                <button
                  type="button"
                  onClick={() => goStep(s.id)}
                  aria-current={isActive ? 'step' : undefined}
                  title={s.label}
                  className={cx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border',
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : isDone
                        ? isDark
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : isDark
                          ? 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-100',
                  )}
                >
                  <span
                    className={cx(
                      'w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0',
                      isActive ? 'bg-white/25 text-white' : isDone ? '' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {isDone && !isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.short}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Toast */}
        <div aria-live="polite" className="shrink-0">
          {toast && (
            <div
              className={cx(
                'mb-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 font-medium',
                toast.kind === 'success' &&
                  (isDark
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700'),
                toast.kind === 'error' &&
                  (isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-300 text-rose-700'),
                toast.kind === 'info' &&
                  (isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700'),
              )}
            >
              {toast.kind === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : toast.kind === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <ScanLine className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}
        </div>

        {/* Ringkasan draft aktif — selalu terlihat */}
        <div
          className={cx(
            'p-3 rounded-xl border mb-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono shrink-0',
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200',
          )}
        >
          {[
            {
              label: '1. Mesin',
              value: allMachines.find((m) => m.id === draft.machineId)?.name ?? draft.machineId,
              sub: allMachines.find((m) => m.id === draft.machineId)?.line ?? '',
              subClass: 'text-blue-500 dark:text-blue-400',
              dirty: draft.machineId !== current.machineId,
            },
            {
              label: '2. Part & Target',
              value: draft.product.productName,
              sub: `Target: ${draft.product.targetQty.toLocaleString()} pcs · CT ${draft.product.cycleTimeSec}s`,
              subClass: 'text-amber-600 dark:text-amber-400',
              dirty: draft.product.productName !== current.productName || draft.product.targetQty !== current.targetQty,
            },
            {
              label: '3. Operator',
              value: draft.operator.operatorName,
              sub: draft.operator.operatorId,
              subClass: 'text-emerald-600 dark:text-emerald-400',
              dirty: draftOperatorDisplay !== current.operatorDisplay,
            },
            {
              label: '4. Shift & Break',
              value: draftShiftLabel,
              sub: `${draft.schedule.breakStart}-${draft.schedule.breakEnd} (${draft.schedule.breakMin}m)`,
              subClass: 'text-purple-600 dark:text-purple-400',
              dirty: draftShiftLabel !== current.shiftLabel,
            },
          ].map((cell) => (
            <div key={cell.label}>
              <span className={cx('text-[10px] block uppercase tracking-wide', tx(themeTokens.textFaint, isDark))}>
                {cell.label}
                {cell.dirty && <span className="ml-1 text-amber-600 dark:text-amber-400">•baru</span>}
              </span>
              <strong className={cx('block truncate text-xs', tx(themeTokens.textStrong, isDark))} title={cell.value}>
                {cell.value}
              </strong>
              <span className={cx('text-[10px]', cell.subClass)}>{cell.sub}</span>
            </div>
          ))}
        </div>

        {/* Input QR manual — berlaku untuk semua langkah */}
        <form
          className="flex gap-2 mb-3 shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualQr.trim()) applyParsedQr(manualQr);
          }}
        >
          <div className="relative flex-1">
            <ScanLine
              className={cx('w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none', tx(themeTokens.textFaint, isDark))}
            />
            <input
              ref={inputRef}
              value={manualQr}
              onChange={(e) => setManualQr(e.target.value)}
              placeholder={manualPlaceholder}
              aria-label="Tempel atau ketik kode QR"
              spellCheck={false}
              autoComplete="off"
              className={cx(
                'w-full pl-8 pr-3 py-2 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                tx(themeTokens.input, isDark),
              )}
            />
          </div>
          <button
            type="submit"
            disabled={!manualQr.trim()}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parse & Isi</span>
            <span className="sm:hidden">Parse</span>
          </button>
        </form>

        {/* Isi langkah */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 min-h-[180px]">
          {step === 'PRODUCT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Pilih produk">
              {QR_PRODUCT_CATALOG.map((p) => {
                const selected = draft.product.code === p.code;
                const isActive = current.productName === p.productName;
                const scanning = scanningCode === p.code;
                return (
                  <div key={p.code} className={cx(cardBase, selected && themeTokens.selectedCard)}>
                    <div>
                      <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, isDark))}>
                        <span>{p.code}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{p.cycleTimeSec}s CT</span>
                      </div>
                      <strong className={cx('text-xs block mb-0.5', tx(themeTokens.textBody, isDark))}>
                        {p.productName}
                        {isActive && (
                          <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </strong>
                      <div className={cx('text-[11px] font-mono mb-1', tx(themeTokens.textMuted, isDark))}>
                        {p.workOrder} · Target {p.targetQty.toLocaleString()} pcs · {Math.round(3600 / p.cycleTimeSec)} pcs/h
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() =>
                        simulateScan(p.code, () => setDraft((d) => ({ ...d, product: p })), `QR Produk: ${p.productName}`)
                      }
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      {scanning ? 'Memindai…' : selected ? 'Dipilih — Pindai Ulang' : 'Scan QR Produk Ini'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'MACHINE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Pilih mesin">
              {allMachines.map((m) => {
                const selected = draft.machineId === m.id;
                const isActive = current.machineId === m.id;
                const code = `QR-MC-${m.deviceId || m.id}`;
                const scanning = scanningCode === code;
                return (
                  <div key={m.id} className={cx(cardBase, selected && themeTokens.selectedCard)}>
                    <div>
                      <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, isDark))}>
                        <span>{code}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{m.deviceId || m.id}</span>
                      </div>
                      <strong className={cx('text-xs block mb-0.5', tx(themeTokens.textBody, isDark))}>
                        {m.name}
                        {isActive && (
                          <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </strong>
                      <div className={cx('text-[11px] mb-1 flex items-center gap-1.5', tx(themeTokens.textMuted, isDark))}>
                        <span>{m.line || 'Production Line'}</span>
                        <span
                          className={cx(
                            'inline-flex items-center gap-1 font-mono text-[10px]',
                            m.status === 'RUNNING' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          <span className={cx('w-1.5 h-1.5 rounded-full', m.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-rose-500')} />
                          {m.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() => simulateScan(code, () => setDraft((d) => ({ ...d, machineId: m.id })), `QR Mesin: ${m.name}`)}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      {scanning ? 'Memindai…' : selected ? 'Dipilih — Pindai Ulang' : 'Scan QR Mesin Ini'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'OPERATOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Pilih operator">
              {QR_OPERATOR_CATALOG.map((op) => {
                const selected = draft.operator.code === op.code;
                const isActive = current.operatorDisplay.includes(op.operatorName);
                const scanning = scanningCode === op.code;
                return (
                  <div key={op.code} className={cx(cardBase, selected && themeTokens.selectedCard)}>
                    <div>
                      <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, isDark))}>
                        <span>{op.code}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{op.operatorId}</span>
                      </div>
                      <strong className={cx('text-xs block mb-1', tx(themeTokens.textBody, isDark))}>
                        {op.operatorName}
                        {isActive && (
                          <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </strong>
                      <div className={cx('text-[11px] mb-2', tx(themeTokens.textMuted, isDark))}>Shift Operator</div>
                    </div>
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() =>
                        simulateScan(op.code, () => setDraft((d) => ({ ...d, operator: op })), `QR Operator: ${op.operatorName}`)
                      }
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      {scanning ? 'Memindai…' : 'Scan Badge Ini'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'SCHEDULE' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Pilih jadwal shift">
              {QR_SCHEDULE_CATALOG.map((sch) => {
                const selected = draft.schedule.code === sch.code;
                const isActive = current.shiftLabel === `${sch.shiftStart} - ${sch.shiftEnd}`;
                const scanning = scanningCode === sch.code;
                return (
                  <div key={sch.code} className={cx(cardBase, selected && themeTokens.selectedCard)}>
                    <div>
                      <div className={cx('flex items-center justify-between text-[10px] font-mono mb-1', tx(themeTokens.textMuted, isDark))}>
                        <span>{sch.code}</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{sch.shiftName}</span>
                      </div>
                      <strong className={cx('text-xs block mb-1', tx(themeTokens.textBody, isDark))}>
                        {sch.shiftStart} - {sch.shiftEnd}
                        {isActive && (
                          <span className="ml-1.5 text-[10px] font-mono px-1.5 py-px rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </strong>
                      <div className={cx('text-[11px] font-mono mb-2', tx(themeTokens.textMuted, isDark))}>
                        Istirahat {sch.breakStart}-{sch.breakEnd} ({sch.breakMin}m)
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={() =>
                        simulateScan(sch.code, () => setDraft((d) => ({ ...d, schedule: sch })), `QR Shift: ${sch.shiftName}`)
                      }
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      {scanning ? 'Memindai…' : 'Scan QR Shift Ini'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'REVIEW' && (
            <div className={cx('rounded-xl border overflow-hidden', tx(themeTokens.borderSoft, isDark))}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={cx('font-mono uppercase text-[10px] tracking-wider', isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500')}>
                    <th className="text-left px-3 py-2 font-semibold">Identitas</th>
                    <th className="text-left px-3 py-2 font-semibold">Aktif Sekarang</th>
                    <th className="text-left px-3 py-2 font-semibold">Hasil Scan (Draft)</th>
                  </tr>
                </thead>
                <tbody className={cx('divide-y', isDark ? 'divide-slate-800' : 'divide-slate-100')}>
                  {[
                    { label: '1. Mesin & Line', old: `${current.machineName}`, next: allMachines.find((m) => m.id === draft.machineId)?.name ?? draft.machineId },
                    { label: '2. Produk / WO / CT', old: `${current.productName} · ${current.workOrder} · ${current.cycleTimeSec}s`, next: `${draft.product.productName} · ${draft.product.workOrder} · ${draft.product.cycleTimeSec}s` },
                    { label: 'Target Qty / Rate', old: `${current.targetQty.toLocaleString()} pcs`, next: `${draft.product.targetQty.toLocaleString()} pcs · ${targetRate} pcs/h` },
                    { label: '3. Operator', old: current.operatorDisplay, next: draftOperatorDisplay },
                    { label: '4. Shift / Istirahat', old: `${current.shiftLabel} (${current.breakLabel})`, next: `${draftShiftLabel} (${draft.schedule.breakStart}-${draft.schedule.breakEnd}, ${draft.schedule.breakMin}m)` },
                  ].map((row) => {
                    const isChanged = row.old !== row.next;
                    return (
                      <tr key={row.label} className={isChanged ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50/60') : undefined}>
                        <td className={cx('px-3 py-2 font-semibold whitespace-nowrap', tx(themeTokens.textMuted, isDark))}>{row.label}</td>
                        <td className={cx('px-3 py-2 font-mono', tx(themeTokens.textSecondary, isDark))}>{row.old}</td>
                        <td className="px-3 py-2 font-mono font-semibold">
                          <span className={isChanged ? 'text-amber-600 dark:text-amber-400' : tx(themeTokens.textBody, isDark)}>
                            {row.next}
                          </span>
                          {isChanged && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-px rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              berubah
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!changed && (
                <p className={cx('px-3 py-2 text-xs flex items-center gap-1.5', tx(themeTokens.textMuted, isDark))}>
                  <MonitorSmartphone className="w-3.5 h-3.5" />
                  Draft sama dengan konfigurasi aktif — tidak ada yang perlu diterapkan.
                </p>
              )}
              {applied && (
                <p className="px-3 py-2 text-xs flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Batch diterapkan — WO {draft.product.workOrder} · {draft.product.productName} · {draftOperatorDisplay}.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer navigasi */}
        <div className={cx('mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap', tx(themeTokens.divider, isDark))}>
          <button
            type="button"
            onClick={handleReset}
            title="Kembalikan draft ke konfigurasi aktif"
            className={cx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border',
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100',
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  const prevId = STEPS[stepIndex - 1]?.id;
                  if (prevId) goStep(prevId);
                }}
                className={cx('px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer', tx(themeTokens.footerButton, isDark))}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  const nextId = STEPS[stepIndex + 1]?.id;
                  if (nextId) goStep(nextId);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                Lanjut
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className={cx('px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer', tx(themeTokens.footerButton, isDark))}
                >
                  {applied ? 'Selesai' : 'Batal'}
                </button>
                {backendMode && onSelectWorkOrder ? (
                  <button
                    type="button"
                    onClick={handleSelectWorkOrder}
                    title="Pratinjau WO hasil scan di Setup Produksi (tanpa MQTT)"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Gunakan WO Ini
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyBatch}
                    disabled={applying || !changed}
                    title={!changed ? 'Tidak ada perubahan dari konfigurasi aktif' : 'Terapkan seluruh batch ke mesin'}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                    {applying ? 'Menerapkan…' : applied ? 'Terapkan Ulang' : 'Terapkan Batch'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <p className={cx('mt-2 text-[11px] font-mono', tx(themeTokens.textFaint, isDark))}>
          * Menerapkan batch mengirim SET_JOB_CONFIG (WO, produk, operator, target, cycle) + override shift ke edge controller.
        </p>
      </div>
    </div>
  );
};
