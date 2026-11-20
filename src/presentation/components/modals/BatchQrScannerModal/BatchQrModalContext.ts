// /src/presentation/components/modals/BatchQrScannerModal/BatchQrModalContext.ts
// Shared interfaces for BatchQrScannerModal sub-components.

import type React from 'react';
import type { QrBatchStep, BatchDraft, QrProductPreset, QrOperatorPreset, QrSchedulePreset } from '../../../../domain/entities/BatchQr';
import type { OperatorRecord, ProductRecord } from '../../../../domain/entities/backend/Device';
import type { AckWaitState } from '../../../../domain/entities/backend/WorkOrder';
import type { MachineConfig } from '../../../../domain/index';

export interface BatchQrModalContext {
  // State
  step: QrBatchStep;
  stepIndex: number;
  draft: BatchDraft;
  /** unit 003: lane backend (4 badge zona / WO) vs simulasi. */
  backendMode: boolean;
  /** unit 003 FR-003: 4 zona lengkap = syarat konfirmasi initiate. */
  draftComplete: boolean;
  /** unit 003 FR-005/006: status tunggu ACK edge. */
  ackWait: AckWaitState | null;
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
  onScanProduct: (p: QrProductPreset) => void;
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
  /** unit 003: konfirmasi eksplisit panel 4 zona → validate + initiate (tulisan ke edge). */
  onConfirmInitiate: () => void;
  /** unit 003: pilih master nyata (pengganti scan badge, bukan katalog demo). */
  onPickProduct: (p: ProductRecord) => void;
  onPickOperator: (op: OperatorRecord) => void;
  onPickBoundMachine: () => void;
}
