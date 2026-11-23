// /src/presentation/components/modals/MqttEdgeInspectorModal/tabShared.tsx

// Shared types, skins, and render helpers for MqttEdgeInspectorModal tabs.

import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Network,
  Factory,
  Gamepad2,
  Radio,
  HeartPulse,
} from 'lucide-react';
import type { MachineConfig } from '../../../../domain/index';

export type TabKey = 'RINGKASAN' | 'PERANGKAT' | 'JARINGAN' | 'PRODUKSI' | 'KONTROL' | 'TELEMETRI' | 'KESEHATAN';

export interface ConsoleLine {
  ts: string;
  kind: 'TX' | 'RX' | 'SYS';
  text: string;
}

export const NAV: Array<{ key: TabKey; label: string; desc: string; icon: React.ElementType; accent: string }> = [
  { key: 'RINGKASAN', label: 'Ringkasan', desc: 'Status & job aktif', icon: LayoutDashboard, accent: 'text-sky-500' },
  { key: 'PERANGKAT', label: 'Perangkat Edge', desc: 'MCU, I/O & storage', icon: Cpu, accent: 'text-violet-500' },
  { key: 'JARINGAN', label: 'Jaringan MQTT', desc: 'Broker, topik & QoS', icon: Network, accent: 'text-blue-500' },
  { key: 'PRODUKSI', label: 'Konfigurasi Produksi', desc: 'WO, produk & shift', icon: Factory, accent: 'text-purple-500' },
  { key: 'KONTROL', label: 'Kontrol Mesin', desc: 'FSM & perintah', icon: Gamepad2, accent: 'text-emerald-500' },
  { key: 'TELEMETRI', label: 'Telemetri Live', desc: 'Frame & decoding', icon: Radio, accent: 'text-cyan-500' },
  { key: 'KESEHATAN', label: 'Kesehatan Edge', desc: 'FreeRTOS & heap', icon: HeartPulse, accent: 'text-amber-500' },
];

export const FSM_LABEL: Record<number, string> = {
  0: 'UNCONFIGURED',
  1: 'READY',
  2: 'RUNNING',
  3: 'PLANNED_DT',
  4: 'UNPLANNED_DT',
  5: 'BATCH_FINISHED',
};

/** Theme-dependent class strings shared across tabs. */
export interface TabSkins {
  card: string;
  panel: string;
  label: string;
  value: string;
  inputCls: string;
}

export function makeSkins(isDark: boolean): TabSkins {
  return {
    card: isDark ? 'bg-[#0d1830] border-[#1c3358]' : 'bg-white border-slate-200',
    panel: isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200',
    label: isDark ? 'text-slate-400' : 'text-slate-500',
    value: isDark ? 'text-slate-100' : 'text-slate-900',
    inputCls: isDark
      ? 'bg-[#050811] border-[#22395f] text-white placeholder:text-slate-600 focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500',
  };
}

export function nowClock(): string {
  return new Date().toLocaleTimeString('id-ID', { hour12: false });
}

export function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

/** Labeled form field wrapper. */
export function Field({ labelText, node, hint, labelCls }: { labelText: string; node: React.ReactNode; hint?: string; labelCls: string }) {
  return (
    <div>
      <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${labelCls}`}>{labelText}</label>
      {node}
      {hint && <p className={`mt-1 text-[11px] ${labelCls}`}>{hint}</p>}
    </div>
  );
}

/** Generic text/number input with mono styling. */
export function TextInput<T extends string | number>({
  val,
  set,
  extra,
  type = 'text',
  inputCls,
}: {
  val: T;
  set: (v: T) => void;
  extra?: string;
  type?: string;
  inputCls: string;
}) {
  return (
    <input
      type={type}
      value={val}
      // Safe: set matches the concrete T of val at every call site.
      onChange={(e) => set((type === 'number' ? Number(e.target.value) : e.target.value) as T)}
      className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500/40 transition-colors ${inputCls} ${extra ?? ''}`}
    />
  );
}

/** Context passed from the modal coordinator into every tab. */
export interface MqttEdgeTabContext {
  machine: MachineConfig;
  t: NonNullable<MachineConfig['telemetry']>;
  h: NonNullable<MachineConfig['health']>;
  fsmLabel: string;
  isDark: boolean;
  skins: TabSkins;
  topicPrefix: string;
  qos: 0 | 1 | 2;
  useBackend?: boolean;
  pushLog: (kind: ConsoleLine['kind'], text: string) => void;
}
