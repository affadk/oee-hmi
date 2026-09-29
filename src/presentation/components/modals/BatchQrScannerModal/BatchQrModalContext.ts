// /src/presentation/components/modals/BatchQrScannerModal/BatchQrModalContext.ts
// Shared interfaces for BatchQrScannerModal sub-components.

import type React from 'react';
import type { QrBatchStep, BatchDraft, QrOperatorPreset, QrSchedulePreset } from '../../../../domain/entities/BatchQr';
import type { OperatorRecord, ProductRecord } from '../../../../domain/entities/backend/Device';
import type { MachineConfig } from '../../../../domain/index';

export interface BatchQrModalContext {
  // State
  step: QrBatchStep;
  stepIndex: number;
  draft: BatchDraft;
  manualQr: string;
  scanningCode: string | null;
  applying: boolean;
  applied: boolean;
  scannedWo: string | null;
  resolvingWo: boolean;
  cameraError: string | null;
  theme: 'dark' | 'light';
  isDark: boolean;

  // Current (active) machine values for diff / badge
  current: {
    productName: string;
    workOrder: string;
    cycleTimeSec: number;
    targetQty: number;
    machineId: string;
    machineName: string;
    operatorDisplay: string;
    shiftLabel: string;
    breakLabel: string;
  };

  // Derived
  targetRate: number;
  draftOperatorDisplay: string;
  draftShiftLabel: string;
  changed: boolean;

  // Data
  machine: MachineConfig;
  allMachines: MachineConfig[];
  /** B4: backend master catalog; null/empty = static QR fallback. */
  catalog?: { products: ProductRecord[]; operators: OperatorRecord[] } | null;

  // Actions
  setStep: (id: QrBatchStep) => void;
  setManualQr: (val: string) => void;
  setDraft: React.Dispatch<React.SetStateAction<BatchDraft>>;
  onScanProduct: (p: BatchDraft['product']) => void;
  onScanMachine: (m: MachineConfig) => void;
  onScanOperator: (op: QrOperatorPreset) => void;
  onScanSchedule: (sch: QrSchedulePreset) => void;
  onBack: () => void;
  onNext: () => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  onProceedToSetup?: () => void;
  onPreviewWorkOrder?: (woId: string) => Promise<void>;

  // Form handlers
  applyParsedQr: (raw: string) => void;
  submitWoForPreview: (raw: string) => Promise<void>;
}
