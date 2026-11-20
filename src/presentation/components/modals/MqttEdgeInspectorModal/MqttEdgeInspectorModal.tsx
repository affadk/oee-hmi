// /src/presentation/components/modals/MqttEdgeInspectorModal/MqttEdgeInspectorModal.tsx
import type { DeviceCommandKind } from '../../../../domain/entities/backend/Device';
// STM32H723 Edge Controller Terminal — koordinator modal.
// State, log console, dan publish job tetap di sini; rendering tab
// didelegasikan ke sub-components tabs/ + MqttConsole via ctx.

import React, { useEffect, useMemo, useState } from 'react';
import { X, Terminal, ChevronRight } from 'lucide-react';
import { MachineConfig } from '../../../../domain/index';
import { useTheme } from '../../../providers/ThemeProvider';
import { connectionWord } from '../../../utils/statusWords';
import {
  NAV,
  FSM_LABEL,
  makeSkins,
  nowClock,
  type TabKey,
  type ConsoleLine,
  type MqttEdgeTabContext,
} from './tabShared';
import { RingkasanTab } from './tabs/RingkasanTab';
import { PerangkatTab } from './tabs/PerangkatTab';
import { JaringanTab } from './tabs/JaringanTab';
import { ProduksiTab } from './tabs/ProduksiTab';
import { KontrolTab } from './tabs/KontrolTab';
import { TelemetriTab } from './tabs/TelemetriTab';
import { KesehatanTab } from './tabs/KesehatanTab';
import { MqttConsole } from './MqttConsole';

interface MqttEdgeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: MachineConfig;
  onSendCommand: (cmd: DeviceCommandKind) => void;
  onSendJobConfig: (wo: string, product: string, operator: string, target: number, cycleTimeSec?: number) => void;
  useBackend?: boolean;
}

export const MqttEdgeInspectorModal: React.FC<MqttEdgeInspectorModalProps> = ({
  isOpen,
  onClose,
  machine,
  onSendCommand,
  onSendJobConfig,
  useBackend,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const skins = makeSkins(isDark);
  const { label, value } = skins;

  const [activeTab, setActiveTab] = useState<TabKey>('RINGKASAN');
  const [isPretty, setIsPretty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([
    { ts: nowClock(), kind: 'SYS', text: `Terminal tersambung — relay backend oee/device/${machine.deviceId}/#` },
  ]);

  // ---- Perangkat Edge (local draft, diinisialisasi dari machine) ----
  const [devName, setDevName] = useState(machine.name);
  const [devLine, setDevLine] = useState(machine.line ?? 'Machining Line 2');
  const [devArea, setDevArea] = useState(machine.area ?? 'Machining & Turning');
  const [dhcp, setDhcp] = useState(true);
  const [ipAddr, setIpAddr] = useState('192.168.10.51');
  const [gateway, setGateway] = useState('192.168.10.1');
  const [tempOffset, setTempOffset] = useState(0);
  const [rpmSource, setRpmSource] = useState('Modbus PLC HR-4001');
  const [fifoEnable, setFifoEnable] = useState(true);

  // ---- Jaringan MQTT (local draft) ----
  const [brokerHost, setBrokerHost] = useState('192.168.10.100');
  const [brokerPort, setBrokerPort] = useState(1883);
  const [clientId, setClientId] = useState(`edge-${machine.deviceId.toLowerCase()}`);
  const [topicPrefix, setTopicPrefix] = useState(`oee/device/${machine.deviceId}`);
  const [qos, setQos] = useState<0 | 1 | 2>(1);
  const [keepAlive, setKeepAlive] = useState(30);
  const [useTls, setUseTls] = useState(false);
  const [mqttUser, setMqttUser] = useState('oee-edge');

  // ---- Produksi / Job (draft, sinkron ke machine.jobConfig) ----
  const [wo, setWo] = useState(machine.jobConfig?.workOrder ?? '—');
  const [productId, setProductId] = useState(machine.jobConfig?.productId ?? '—');
  const [productName, setProductName] = useState(machine.jobConfig?.productName ?? machine.currentProduct ?? '—');
  const [operatorId, setOperatorId] = useState(machine.jobConfig?.operatorId ?? '—');
  const [operatorName, setOperatorName] = useState(machine.jobConfig?.operatorName ?? '—');
  const [stdCycle, setStdCycle] = useState(machine.jobConfig?.standardCycleTimeSec ?? machine.idealCycleTimeSec ?? 0);
  const [targetQty, setTargetQty] = useState(machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 0);
  const [shiftStart, setShiftStart] = useState(machine.jobConfig?.shiftStart ?? '—');
  const [shiftEnd, setShiftEnd] = useState(machine.jobConfig?.shiftEnd ?? '—');
  const [breakMin, setBreakMin] = useState(machine.jobConfig?.plannedBreakMin ?? 0);

  // Sinkron ulang draft hanya saat ganti perangkat (bukan saat live telemetry pulse),
  // agar ketikan user tidak tertimpa update simulasi 3.5s.
  useEffect(() => {
    setDevName(machine.name);
    setDevLine(machine.line ?? 'Machining Line 2');
    setDevArea(machine.area ?? 'Machining & Turning');
    setClientId(`edge-${machine.deviceId.toLowerCase()}`);
    setTopicPrefix(`oee/device/${machine.deviceId}`);
    setWo(machine.jobConfig?.workOrder ?? '—');
    setProductId(machine.jobConfig?.productId ?? '—');
    setProductName(machine.jobConfig?.productName ?? machine.currentProduct ?? '—');
    setOperatorId(machine.jobConfig?.operatorId ?? '—');
    setOperatorName(machine.jobConfig?.operatorName ?? '—');
    setStdCycle(machine.jobConfig?.standardCycleTimeSec ?? machine.idealCycleTimeSec ?? 0);
    setTargetQty(machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 0);
    setShiftStart(machine.jobConfig?.shiftStart ?? '—');
    setShiftEnd(machine.jobConfig?.shiftEnd ?? '—');
    setBreakMin(machine.jobConfig?.plannedBreakMin ?? 0);
    // DISENGAJA: sinkron hanya saat ganti perangkat ([machine.id]) agar ketikan
    // tidak tertimpa pulse telemetri.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine.id]);

  const t = machine.telemetry;
  const h = machine.health;
  const fsmLabel = FSM_LABEL[t.st] ?? `ST-${t.st}`;

  const pushLog = (kind: ConsoleLine['kind'], text: string) =>
    setConsoleLog((prev) => [...prev.slice(-60), { ts: nowClock(), kind, text }]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const wireTelemetry = useMemo(() => JSON.stringify(t), [t]);
  const prettyTelemetry = useMemo(() => JSON.stringify(t, null, 2), [t]);

  const plannedOperatingSec = Math.max(0, 8 * 3600 - breakMin * 60);
  const txId = useMemo(() => `tx-${Date.now().toString(36)}`, [wo, productId, targetQty]);
  const jobPayload = useMemo(
    () =>
      JSON.stringify(
        {
          command: 'SET_JOB_CONFIG',
          transaction_id: txId,
          work_order: wo,
          product: { id: productId, name: productName, std_cycle_time_sec: Number(stdCycle) },
          operator: { id: operatorId, name: operatorName },
          shift_plan: {
            shift_start: `${shiftStart}:00Z`,
            shift_end: `${shiftEnd}:00Z`,
            planned_break_min: Number(breakMin),
            planned_operating_sec: plannedOperatingSec,
            target_qty: Number(targetQty),
          },
        },
        null,
        2,
      ),
    [txId, wo, productId, productName, stdCycle, operatorId, operatorName, shiftStart, shiftEnd, breakMin, plannedOperatingSec, targetQty],
  );

  const jobDirty =
    wo !== machine.jobConfig?.workOrder ||
    productName !== machine.jobConfig?.productName ||
    operatorName !== machine.jobConfig?.operatorName ||
    Number(targetQty) !== machine.jobConfig?.targetQuantity ||
    Number(stdCycle) !== machine.jobConfig?.standardCycleTimeSec;

  const jobValid = wo.trim().length > 0 && productName.trim().length > 0 && Number(targetQty) > 0 && Number(stdCycle) > 0;

  const sendCmd = (cmd: DeviceCommandKind) => {
    pushLog('TX', `POST /api/v1/devices/${machine.deviceId}/command → "${cmd}"`);
    onSendCommand(cmd);
    pushLog('RX', `ACK backend: FSM event ${cmd === 'RESET_COUNTER' ? 'EVENT_BUTTON_RESET' : cmd === 'PAUSE' ? 'FSM→UNPLANNED_DT' : 'FSM→RUNNING'} diteruskan ke edge`);
  };

  const publishJob = () => {
    if (!jobValid) return;
    pushLog('TX', `POST job-config ${wo} / ${productName} / target ${targetQty} (relay backend → ${topicPrefix}/config)`);
    onSendJobConfig(wo, productName, operatorName, Number(targetQty), Number(stdCycle));
    pushLog('RX', `ACK backend: job.bin ditulis + CRC32 OK (${txId})`);
  };

  const resetJobDraft = () => {
    const job = machine.jobConfig;
    setWo(job?.workOrder ?? '—');
    setProductName(job?.productName ?? '—');
    setProductId(job?.productId ?? '—');
    setOperatorName(job?.operatorName ?? '—');
    setOperatorId(job?.operatorId ?? '—');
    setTargetQty(job?.targetQuantity ?? 0);
    setStdCycle(job?.standardCycleTimeSec ?? 0);
  };

  // Early-return HARUS setelah semua hooks (Rules of Hooks).
  if (!isOpen) return null;

  const ctx: MqttEdgeTabContext = {
    machine,
    t,
    h,
    fsmLabel,
    isDark,
    skins,
    topicPrefix,
    qos,
    useBackend,
    pushLog,
    sendCmd,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="STM32H723 Edge Controller Terminal">
      <div className={`w-full max-w-6xl h-[93vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'bg-[#0b1528] border-[#1e3a5f] text-slate-200' : 'bg-[#f3f5f9] border-slate-300 text-slate-900'}`}>
        {/* ===== Header ===== */}
        <div className={`flex items-center gap-3 px-4 sm:px-5 py-3 border-b shrink-0 ${isDark ? 'border-[#162744] bg-[#080e1c]' : 'border-slate-200 bg-white'}`}>
          <div className={`p-2 rounded-xl border shrink-0 ${isDark ? 'bg-blue-950/70 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
            <Terminal className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-bold text-sm sm:text-base truncate ${value}`}>STM32H723 · Edge Controller Terminal</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${machine.connectionStatus === 'ONLINE' ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300') : 'bg-rose-100 text-rose-700 border-rose-300'}`}>
                ● {connectionWord(machine.connectionStatus)} · W5500
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                FSM: {fsmLabel}
              </span>
              {t.is_buffered && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold bg-amber-100 text-amber-800 border-amber-300">
                  DATA TERTUNDA (FIFO)
                </span>
              )}
            </div>
            <p className={`text-[11px] font-mono truncate mt-0.5 ${label}`}>
              {topicPrefix}/# · {brokerHost}:{brokerPort} · QoS {qos} · {machine.deviceId}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup terminal" className={`p-2 rounded-lg transition-colors shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== Body: sidebar + content ===== */}
        <div className="flex-1 flex min-h-0 flex-col md:flex-row">
          {/* Sidebar */}
          <nav className={`shrink-0 md:w-60 border-b md:border-b-0 md:border-r ${isDark ? 'border-[#162744] bg-[#070c18]' : 'border-slate-200 bg-white'} p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto`} aria-label="Navigasi terminal">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = activeTab === n.key;
              return (
                <button type="button"
                  key={n.key}
                  onClick={() => setActiveTab(n.key)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all whitespace-nowrap md:whitespace-normal min-w-[180px] md:min-w-0 border ${
                    active
                      ? isDark ? 'bg-blue-950/60 border-blue-800' : 'bg-blue-50 border-blue-300'
                      : 'border-transparent hover:bg-slate-500/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${n.accent}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-xs font-bold leading-tight ${value}`}>{n.label}</span>
                    <span className={`block text-[10px] leading-tight truncate ${label}`}>{n.desc}</span>
                  </span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  {n.key === 'PRODUKSI' && jobDirty && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Ada perubahan belum dipublish" />}
                </button>
              );
            })}
            {/* Mini device card */}
            <div className={`hidden md:block mt-auto p-3 rounded-xl border text-[11px] font-mono ${skins.panel}`}>
              <div className={`font-bold text-xs mb-1 font-sans ${value}`}>{machine.deviceId}</div>
              <div className={label}>STM32H723ZGT6 @ 550MHz</div>
              <div className={label}>Heap {h.heap_free.toLocaleString('id-ID')} B</div>
              <div className={h.stale_count > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                {h.tasks_healthy}/{h.tasks_total} tasks OK
              </div>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              {activeTab === 'RINGKASAN' && <RingkasanTab ctx={ctx} setActiveTab={setActiveTab} />}
              {activeTab === 'PERANGKAT' && (
                <PerangkatTab
                  ctx={ctx}
                  devName={devName}
                  setDevName={setDevName}
                  devLine={devLine}
                  setDevLine={setDevLine}
                  devArea={devArea}
                  setDevArea={setDevArea}
                  dhcp={dhcp}
                  setDhcp={setDhcp}
                  ipAddr={ipAddr}
                  setIpAddr={setIpAddr}
                  gateway={gateway}
                  setGateway={setGateway}
                  tempOffset={tempOffset}
                  setTempOffset={setTempOffset}
                  rpmSource={rpmSource}
                  setRpmSource={setRpmSource}
                  fifoEnable={fifoEnable}
                  setFifoEnable={setFifoEnable}
                />
              )}
              {activeTab === 'JARINGAN' && (
                <JaringanTab
                  ctx={ctx}
                  brokerHost={brokerHost}
                  setBrokerHost={setBrokerHost}
                  brokerPort={brokerPort}
                  setBrokerPort={setBrokerPort}
                  clientId={clientId}
                  setClientId={setClientId}
                  setTopicPrefix={setTopicPrefix}
                  setQos={setQos}
                  keepAlive={keepAlive}
                  setKeepAlive={setKeepAlive}
                  useTls={useTls}
                  setUseTls={setUseTls}
                  mqttUser={mqttUser}
                  setMqttUser={setMqttUser}
                />
              )}
              {activeTab === 'PRODUKSI' && (
                <ProduksiTab
                  ctx={ctx}
                  wo={wo}
                  setWo={setWo}
                  productId={productId}
                  setProductId={setProductId}
                  productName={productName}
                  setProductName={setProductName}
                  operatorId={operatorId}
                  setOperatorId={setOperatorId}
                  operatorName={operatorName}
                  setOperatorName={setOperatorName}
                  stdCycle={stdCycle}
                  setStdCycle={setStdCycle}
                  targetQty={targetQty}
                  setTargetQty={setTargetQty}
                  shiftStart={shiftStart}
                  setShiftStart={setShiftStart}
                  shiftEnd={shiftEnd}
                  setShiftEnd={setShiftEnd}
                  breakMin={breakMin}
                  setBreakMin={setBreakMin}
                  plannedOperatingSec={plannedOperatingSec}
                  jobPayload={jobPayload}
                  jobDirty={jobDirty}
                  jobValid={jobValid}
                  copied={copied}
                  handleCopy={handleCopy}
                  publishJob={publishJob}
                  onResetDraft={resetJobDraft}
                />
              )}
              {activeTab === 'KONTROL' && <KontrolTab ctx={ctx} confirmReset={confirmReset} setConfirmReset={setConfirmReset} />}
              {activeTab === 'TELEMETRI' && (
                <TelemetriTab
                  ctx={ctx}
                  isPretty={isPretty}
                  setIsPretty={setIsPretty}
                  copied={copied}
                  handleCopy={handleCopy}
                  wireTelemetry={wireTelemetry}
                  prettyTelemetry={prettyTelemetry}
                />
              )}
              {activeTab === 'KESEHATAN' && <KesehatanTab ctx={ctx} />}
            </div>

            {/* ===== Console ===== */}
            <MqttConsole consoleLog={consoleLog} onClear={() => setConsoleLog([])} isDark={isDark} />
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className={`px-4 py-2.5 border-t flex items-center gap-2 text-[11px] font-mono shrink-0 ${isDark ? 'border-[#162744] bg-[#080e1c] text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
          <span className="truncate">FW STM32H723ZGT6 v0.3.1 · LittleFS + CRC32 · OSPI FIFO {fifoEnable ? 'ON' : 'OFF'}</span>
          {jobDirty && <span className="text-amber-500 font-bold shrink-0">● job belum dipublish</span>}
          <button type="button" onClick={onClose} className={`ml-auto px-4 py-1.5 rounded-lg font-bold font-sans text-xs shrink-0 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
