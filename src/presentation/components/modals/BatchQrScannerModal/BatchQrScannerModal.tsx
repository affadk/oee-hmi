// /src/presentation/components/modals/BatchQrScannerModal/BatchQrScannerModal.tsx
//
// Setup Batch Produksi via QR Code — wizard 5 langkah (koordinator):
//   1 Produk & Cycle Time → 2 Mesin & Line → 3 Operator → 4 Jadwal Shift → 5 Review & Terapkan
//
// State, parsing QR, dan efek keyboard tetap di sini; rendering per-langkah
// didelegasikan ke sub-components (steps/, BatchQrStepper, QrDraftSummary,
// QrScanInput) melalui ctx: BatchQrModalContext.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  ClipboardCheck,
} from 'lucide-react';
import { useTheme } from '../../../providers/ThemeProvider';
import { tx, cx, themeTokens } from '../../../styles/themeTokens';
import type { MachineConfig } from '../../../../domain/index';
import type { OperatorRecord, ProductRecord } from '../../../../domain/entities/backend/Device';
import type {
  InitiateFromZonesResult,
  WorkOrderResolveResult,
  ZoneRawStrings,
} from '../../../../domain/entities/backend/WorkOrder';
import { QrCameraScanner } from '../../common/QrCameraScanner';
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
} from '../../../../domain/entities/BatchQr';
import { STEPS } from './BatchQrStepper';
import { BatchQrStepper } from './BatchQrStepper';
import { QrDraftSummary } from './QrDraftSummary';
import { QrScanInput } from './QrScanInput';
import { ProductStep } from './steps/ProductStep';
import { MachineStep } from './steps/MachineStep';
import { OperatorStep } from './steps/OperatorStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { ReviewStep } from './steps/ReviewStep';
import { BackendReviewStep } from './steps/BackendReviewStep';
import { buildZoneStrings } from '../../../../application/qrZones';
import type { BatchQrModalContext } from './BatchQrModalContext';

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
  /** Hasil resolve backend untuk WO yang dipindai; null = belum ada. */
  workOrderPreview?: { woId: string; result: WorkOrderResolveResult } | null;
  /** Resolve WO ke backend (menampilkan data backend, bukan mentah QR). */
  onPreviewWorkOrder?: (woId: string) => Promise<void>;
  /** Lanjut ke Setup Produksi dengan preview yang sudah dimuat. */
  onProceedToSetup?: () => void;
  /** B4: backend product/operator master; null/empty = static catalog fallback. */
  catalog?: { products: ProductRecord[]; operators: OperatorRecord[] } | null;
  /** LINE master mesin (§C.8 MACHINE zone); kosong = backend 400 yang menolak. */
  line?: string;
  /** unit 002 FR-004: sesi operator aktif (mismatch OID vs sesi → konfirmasi). */
  sessionOperatorId?: string | null;
  /** unit 002 FR-004: validate 4 zona → initiate WO + dispatch (§C.7/§C.8). */
  onInitiateFromZones?: (deviceId: string, zones: ZoneRawStrings) => Promise<InitiateFromZonesResult | void>;
}

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
  workOrderPreview = null,
  onPreviewWorkOrder,
  onProceedToSetup,
  catalog = null,
  line = '',
  sessionOperatorId = null,
  onInitiateFromZones,
}) => {
  const { isDark, theme, setTheme } = useTheme();

  const [step, setStep] = useState<QrBatchStep>('PRODUCT');
  const [draft, setDraft] = useState<BatchDraft>(() => draftFromMachine(machine));
  const [manualQr, setManualQr] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [scanningCode, setScanningCode] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  // Backend lane: WO hasil pindai + status resolve (review = data backend).
  const [scannedWo, setScannedWo] = useState<string | null>(null);
  const [resolvingWo, setResolvingWo] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
      setScannedWo(null);
      setResolvingWo(false);
      setCameraError(null);
      setInitiatedWo(null);
      setConfirmingOidMismatch(false);
      setCameraKey((k) => k + 1);
      // Fokus ke kolom QR setelah mount untuk alur keyboard.
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return undefined;
    // DISENGAJA: reset draft hanya saat dibuka — machine sengaja di luar deps
    // agar pulse telemetri tidak me-reset draft saat modal terbuka.
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

  // Backend lane: pindai → validasi format lokal → resolve ke backend.
  const submitWoForPreview = useCallback(async (raw: string) => {
    let woId = '';
    try {
      const parsed = parseQrString(raw);
      if (parsed.kind === 'PRODUCT' && parsed.product) woId = parsed.product.workOrder.trim();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'QR tidak valid.');
      return;
    }
    if (!woId) {
      showToast('error', 'QR ini tidak memuat nomor WO — pindai QR produk/WO.');
      return;
    }
    if (!onPreviewWorkOrder) {
      showToast('error', 'Pratinjau backend tidak tersedia.');
      return;
    }
    setScannedWo(woId);
    setResolvingWo(true);
    try {
      await onPreviewWorkOrder(woId);
      setStep('REVIEW');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : `WO ${woId} tidak dapat dimuat.`);
    } finally {
      setResolvingWo(false);
    }
  }, [onPreviewWorkOrder, showToast]);

  const handleCameraScan = useCallback((text: string) => {
    setManualQr(text);
    void submitWoForPreview(text);
  }, [submitWoForPreview]);

  // unit 002 FR-004/005: mismatch OID vs sesi → konfirmasi eksplisit (bukan tolak keras).
  const [confirmingOidMismatch, setConfirmingOidMismatch] = useState(false);
  const [initiatedWo, setInitiatedWo] = useState<string | null>(null);

  const handleInitiateFromZones = useCallback(async () => {
    if (!onInitiateFromZones) {
      showToast('error', 'Initiate work order tidak tersedia.');
      return;
    }
    const oid = draft.operator.operatorId?.trim();
    if (sessionOperatorId && oid && oid !== sessionOperatorId && !confirmingOidMismatch) {
      setConfirmingOidMismatch(true);
      return;
    }
    setApplying(true);
    setConfirmingOidMismatch(false);
    try {
      // Device target = mesin aktif (backend mengikat machineId via deviceId).
      if (draft.machineId !== machine.id) {
        showToast('error', 'Pilih mesin tujuan di langkah Mesin sebelum memulai produksi.');
        return;
      }
      const zones = buildZoneStrings(draft, { machineName: machine.name, line });
      const result = await onInitiateFromZones(machine.deviceId, zones);
      if (result) {
        setInitiatedWo(result.workOrder.woId);
        showToast(
          'success',
          result.idempotentDuplicate
            ? `WO ${result.workOrder.woId} sudah pernah dibuat (idempoten) — dispatch ulang.`
            : `WO ${result.workOrder.woId} dibuat dan di-dispatch ke mesin.`,
          4000,
        );
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Initiate work order gagal.');
    } finally {
      setApplying(false);
    }
  }, [onInitiateFromZones, draft, machine, line, sessionOperatorId, confirmingOidMismatch, showToast]);

  if (!isOpen) return null;

  const goStep = (id: QrBatchStep) => {
    setStep(id);
    setApplied(false);
  };

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

  // Konteks yang dibagikan ke semua sub-components.
  const ctx: BatchQrModalContext = {
    step,
    stepIndex,
    draft,
    manualQr,
    scanningCode,
    applying,
    applied,
    scannedWo,
    resolvingWo,
    cameraError,
    theme,
    isDark,
    current,
    targetRate,
    draftOperatorDisplay,
    draftShiftLabel,
    changed,
    machine,
    allMachines,
    catalog,
    setStep: goStep,
    setManualQr,
    setDraft,
    onScanProduct: (p) => simulateScan(p.code, () => setDraft((d) => ({ ...d, product: p })), `QR Produk: ${p.productName}`),
    onScanMachine: (m) => simulateScan(`QR-MC-${m.deviceId || m.id}`, () => setDraft((d) => ({ ...d, machineId: m.id })), `QR Mesin: ${m.name}`),
    onScanOperator: (op) => simulateScan(op.code, () => setDraft((d) => ({ ...d, operator: op })), `QR Operator: ${op.operatorName}`),
    onScanSchedule: (sch) => simulateScan(sch.code, () => setDraft((d) => ({ ...d, schedule: sch })), `QR Shift: ${sch.shiftName}`),
    onBack: () => {
      const prevId = STEPS[stepIndex - 1]?.id;
      if (prevId) goStep(prevId);
    },
    onNext: () => {
      // Backend lane: PRODUCT langsung ke REVIEW (langkah draft MQTT dilewati).
      if (backendMode && step === 'PRODUCT') {
        setStep('REVIEW');
        return;
      }
      const nextId = STEPS[stepIndex + 1]?.id;
      if (nextId) goStep(nextId);
    },
    onApply: handleApplyBatch,
    onReset: handleReset,
    onClose,
    onProceedToSetup,
    onPreviewWorkOrder,
    applyParsedQr,
    submitWoForPreview,
  };

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
        <BatchQrStepper ctx={ctx} />

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
        <QrDraftSummary ctx={ctx} />

        {/* Backend lane: kamera nyata + input manual → resolve WO (tanpa draft MQTT). */}
        {backendMode && (
          <div className="mb-3 space-y-2">
            <QrCameraScanner
              key={cameraKey}
              onScanned={handleCameraScan}
              onScanError={(msg) => setCameraError(msg)}
            />
            {cameraError && (
              <p className="text-[11px] font-mono opacity-70" role="status">{cameraError}</p>
            )}
            {scannedWo && !resolvingWo && (
              <button
                type="button"
                onClick={() => {
                  setScannedWo(null);
                  setCameraError(null);
                  setCameraKey((k) => k + 1);
                }}
                className={cx('text-[11px] font-mono underline opacity-80 hover:opacity-100 cursor-pointer', tx(themeTokens.textSecondary, isDark))}
              >
                Pindai ulang
              </button>
            )}
          </div>
        )}

        {/* Input QR manual — berlaku untuk semua langkah */}
        <QrScanInput ctx={ctx} placeholder={manualPlaceholder} inputRef={inputRef} backendMode={backendMode} />

        {/* Isi langkah */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 min-h-[180px]">
          {step === 'PRODUCT' && !backendMode && <ProductStep ctx={ctx} />}
          {step === 'MACHINE' && <MachineStep ctx={ctx} />}
          {step === 'OPERATOR' && <OperatorStep ctx={ctx} />}
          {step === 'SCHEDULE' && <ScheduleStep ctx={ctx} />}
          {step === 'REVIEW' && !backendMode && <ReviewStep ctx={ctx} />}
          {step === 'REVIEW' && backendMode && (
            <div className="space-y-2">
              <BackendReviewStep ctx={ctx} workOrderPreview={workOrderPreview} />
              {initiatedWo && (
                <p
                  className={cx(
                    'rounded-lg border p-2.5 text-xs font-mono flex items-center gap-2',
                    isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700',
                  )}
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Work order <strong>{initiatedWo}</strong> aktif — produksi berjalan.
                </p>
              )}
              {confirmingOidMismatch && (
                <div
                  className={cx(
                    'rounded-lg border p-3 text-xs space-y-2',
                    isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800',
                  )}
                  role="alert"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Operator QR berbeda dari sesi login
                  </p>
                  <p>
                    QR: <strong>{draft.operator.operatorName}</strong> ({draft.operator.operatorId})
                    {sessionOperatorId ? <> · sesi: <strong>{sessionOperatorId}</strong></> : null}
                  </p>
                  <p className="opacity-80">Lanjutkan hanya jika badge QR ini memang operator yang bertugas.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingOidMismatch(false)}
                      className={cx('px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border', isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100')}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleInitiateFromZones()}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Tetap lanjutkan
                    </button>
                  </div>
                </div>
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
                onClick={ctx.onBack}
                className={cx('px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer', tx(themeTokens.footerButton, isDark))}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={ctx.onNext}
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
                {backendMode && onInitiateFromZones ? (
                  <button
                    type="button"
                    onClick={() => void handleInitiateFromZones()}
                    disabled={applying || !!initiatedWo || confirmingOidMismatch}
                    title="Validasi 4 zona lalu buat work order + dispatch ke mesin"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                    {applying ? 'Memproses…' : initiatedWo ? `WO ${initiatedWo} Aktif` : 'Mulai Produksi (4 Zona QR)'}
                  </button>
                ) : backendMode && onProceedToSetup ? (
                  <button
                    type="button"
                    onClick={onProceedToSetup}
                    disabled={!workOrderPreview || workOrderPreview.woId !== scannedWo}
                    title="Tutup pemindai dan buka Setup Produksi dengan WO ini"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Mulai Setup Produksi
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
