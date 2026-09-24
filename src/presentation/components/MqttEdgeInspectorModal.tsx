import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Terminal,
  Cpu,
  Radio,
  Send,
  RotateCcw,
  Play,
  Pause,
  Copy,
  Check,
  LayoutDashboard,
  Network,
  Factory,
  Gamepad2,
  HeartPulse,
  Activity,
  Wifi,
  Save,
  PlugZap,
  ShieldCheck,
  Clock,
  ChevronRight,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { MachineConfig } from '../../domain/index';
import { useTheme } from '../providers/ThemeProvider';

interface MqttEdgeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: MachineConfig;
  onSendCommand: (cmd: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => void;
  onSendJobConfig: (wo: string, product: string, operator: string, target: number, cycleTimeSec?: number) => void;
  useBackend?: boolean;
}

type TabKey = 'RINGKASAN' | 'PERANGKAT' | 'JARINGAN' | 'PRODUKSI' | 'KONTROL' | 'TELEMETRI' | 'KESEHATAN';

interface ConsoleLine {
  ts: string;
  kind: 'TX' | 'RX' | 'SYS';
  text: string;
}

const NAV: Array<{ key: TabKey; label: string; desc: string; icon: React.ElementType; accent: string }> = [
  { key: 'RINGKASAN', label: 'Ringkasan', desc: 'Status & job aktif', icon: LayoutDashboard, accent: 'text-sky-500' },
  { key: 'PERANGKAT', label: 'Perangkat Edge', desc: 'MCU, I/O & storage', icon: Cpu, accent: 'text-violet-500' },
  { key: 'JARINGAN', label: 'Jaringan MQTT', desc: 'Broker, topik & QoS', icon: Network, accent: 'text-blue-500' },
  { key: 'PRODUKSI', label: 'Konfigurasi Produksi', desc: 'WO, produk & shift', icon: Factory, accent: 'text-purple-500' },
  { key: 'KONTROL', label: 'Kontrol Mesin', desc: 'FSM & perintah', icon: Gamepad2, accent: 'text-emerald-500' },
  { key: 'TELEMETRI', label: 'Telemetri Live', desc: 'Frame & decoding', icon: Radio, accent: 'text-cyan-500' },
  { key: 'KESEHATAN', label: 'Kesehatan Edge', desc: 'FreeRTOS & heap', icon: HeartPulse, accent: 'text-amber-500' },
];

const FSM_LABEL: Record<number, string> = {
  0: 'UNCONFIGURED',
  1: 'READY',
  2: 'RUNNING',
  3: 'PLANNED_DT',
  4: 'UNPLANNED_DT',
  5: 'BATCH_FINISHED',
};

function nowClock(): string {
  return new Date().toLocaleTimeString('id-ID', { hour12: false });
}

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
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

  const [activeTab, setActiveTab] = useState<TabKey>('RINGKASAN');
  const [isPretty, setIsPretty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([
    { ts: nowClock(), kind: 'SYS', text: `Terminal tersambung — subscribe oee/device/${machine.deviceId}/# (QoS 1)` },
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
    // tidak tertimpa pulse telemetri. (exhaustive-deps tidak terpasang:
    // typescript-eslint belum mendukung TS 7.)
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

  const sendCmd = (cmd: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => {
    pushLog('TX', `PUB ${topicPrefix}/command → "${cmd}" (QoS ${qos})`);
    onSendCommand(cmd);
    pushLog('RX', `ACK edge: FSM event ${cmd === 'RESET_COUNTER' ? 'EVENT_BUTTON_RESET' : cmd === 'PAUSE' ? 'FSM→UNPLANNED_DT' : 'FSM→RUNNING'} diterima`);
  };

  const publishJob = () => {
    if (!jobValid) return;
    pushLog('TX', `PUB ${topicPrefix}/config → SET_JOB_CONFIG ${wo} / ${productName} / target ${targetQty}`);
    onSendJobConfig(wo, productName, operatorName, Number(targetQty), Number(stdCycle));
    pushLog('RX', `ACK edge: job.bin ditulis + CRC32 OK (${txId})`);
  };

  const card = isDark ? 'bg-[#0d1830] border-[#1c3358]' : 'bg-white border-slate-200';
  const panel = isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200';
  const label = isDark ? 'text-slate-400' : 'text-slate-500';
  const value = isDark ? 'text-slate-100' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-[#050811] border-[#22395f] text-white placeholder:text-slate-600 focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500';

  const field = (labelText: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${label}`}>{labelText}</label>
      {node}
      {hint && <p className={`mt-1 text-[11px] ${label}`}>{hint}</p>}
    </div>
  );

  const textInput = <T extends string | number>(val: T, set: (v: T) => void, extra?: string, type: string = 'text') => (
    <input
      type={type}
      value={val}
      // Safe: every call site passes val and set of the same T (both string or both number).
      onChange={(e) => set((type === 'number' ? Number(e.target.value) : e.target.value) as T)}
      className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500/40 transition-colors ${inputCls} ${extra ?? ''}`}
    />
  );

  // Early-return HARUS setelah semua hooks (Rules of Hooks):
  // sebelumnya ada useMemo setelah return → crash
  // "Rendered more hooks than during the previous render" saat modal dibuka.
  if (!isOpen) return null;

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
                ● {machine.connectionStatus} · W5500
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                FSM: {fsmLabel}
              </span>
              {t.is_buffered && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold bg-amber-100 text-amber-800 border-amber-300">
                  FIFO DRAIN
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
            <div className={`hidden md:block mt-auto p-3 rounded-xl border text-[11px] font-mono ${panel}`}>
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
              {/* ===== RINGKASAN ===== */}
              {activeTab === 'RINGKASAN' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {[
                      { icon: Activity, t: 'Status FSM', v: fsmLabel, s: `st=${t.st} · alm=${t.alm}`, c: t.st === 2 ? 'text-emerald-500' : t.st === 4 ? 'text-rose-500' : 'text-amber-500' },
                      { icon: PlugZap, t: 'OEE Live (edge)', v: `${(t.oee / 100).toFixed(2)}%`, s: `A ${(t.a / 100).toFixed(1)} · P ${(t.p / 100).toFixed(1)} · Q ${(t.q / 100).toFixed(1)}`, c: 'text-violet-500' },
                      { icon: Factory, t: 'Counter', v: `${t.tot.toLocaleString('id-ID')} pcs`, s: `reject ${t.rej} · cyc ${(t.cyc / 100).toFixed(2)}s`, c: 'text-sky-500' },
                      { icon: HeartPulse, t: 'Edge Health', v: `${h.tasks_healthy}/${h.tasks_total}`, s: `heap ${(h.heap_free / 1024).toFixed(0)} KB · stale ${h.stale_count}`, c: h.stale_count ? 'text-amber-500' : 'text-emerald-500' },
                    ].map((s) => (
                      <div key={s.t} className={`p-3.5 rounded-xl border ${card}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <s.icon className={`w-4 h-4 ${s.c}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>{s.t}</span>
                        </div>
                        <div className={`text-lg font-extrabold font-mono ${value}`}>{s.v}</div>
                        <div className={`text-[11px] font-mono ${label}`}>{s.s}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border ${card}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${value}`}>Job aktif di edge</h3>
                        <button type="button" onClick={() => setActiveTab('PRODUKSI')} className="text-[11px] font-bold text-purple-500 hover:underline">Ubah →</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {[
                          ['Work Order', machine.jobConfig.workOrder],
                          ['Produk', machine.jobConfig.productName],
                          ['Operator', `${machine.jobConfig.operatorName} (${machine.jobConfig.operatorId})`],
                          ['Target', `${machine.jobConfig.targetQuantity.toLocaleString('id-ID')} pcs`],
                          ['Std cycle', `${machine.jobConfig.standardCycleTimeSec}s`],
                          ['Shift', `${machine.jobConfig.shiftStart}–${machine.jobConfig.shiftEnd}`],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div className={`text-[10px] uppercase tracking-wider font-semibold ${label}`}>{k}</div>
                            <div className={`font-mono font-semibold truncate ${value}`} title={String(v)}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${card}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${value}`}>Aksi cepat</h3>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => sendCmd('RESUME')} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Resume</button>
                        <button type="button" onClick={() => sendCmd('PAUSE')} className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Pause</button>
                        <button type="button" onClick={() => setActiveTab('TELEMETRI')} className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}><Radio className="w-3.5 h-3.5" /> Lihat frame</button>
                        <button type="button" onClick={() => setActiveTab('KESEHATAN')} className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}><HeartPulse className="w-3.5 h-3.5" /> Diagnostik</button>
                      </div>
                      <p className={`mt-2.5 text-[11px] leading-relaxed ${label}`}>
                        Run {fmtDur(t.run)} · Downtime {fmtDur(t.dt)} · Suhu {(t.tmp / 10).toFixed(1)}°C · RPM {t.rpm} · DI 0x{t.di.toString(16).toUpperCase().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== PERANGKAT ===== */}
              {activeTab === 'PERANGKAT' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${panel}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Cpu className="w-4 h-4 text-violet-500" /> Identitas perangkat</h3>
                    <p className={`text-[11px] mt-1 ${label}`}>Nama dan lokasi logis — tersimpan di <code className="font-mono">/cfg/device.bin</code> (LittleFS) bersama CRC32.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {field('Device ID (MQTT, read-only)', <input value={machine.deviceId} readOnly className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono opacity-70 ${inputCls}`} />, 'Dipakai sebagai segmen topik & client-id default.')}
                      {field('Nama perangkat', textInput(devName, setDevName))}
                      {field('Line produksi', textInput(devLine, setDevLine))}
                      {field('Area / stasiun', textInput(devArea, setDevArea))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border ${panel}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Wifi className="w-4 h-4 text-sky-500" /> Antarmuka jaringan (W5500 · SPI2)</h3>
                      <div className="flex items-center justify-between mt-2 mb-3">
                        <span className={`text-xs font-semibold ${value}`}>DHCP</span>
                        <button type="button" onClick={() => setDhcp(!dhcp)} aria-pressed={dhcp} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${dhcp ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}>
                          <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${dhcp ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {field('IP statis', textInput(ipAddr, setIpAddr))}
                        {field('Gateway', textInput(gateway, setGateway))}
                      </div>
                      <p className={`text-[11px] mt-2 font-mono ${label}`}>MAC 02:80:E3:…:51 · Link 100F · SPI 33MHz</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${panel}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Activity className="w-4 h-4 text-cyan-500" /> Sensor & penyimpanan</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {field('Sumber RPM', (
                          <select value={rpmSource} onChange={(e) => setRpmSource(e.target.value)} className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono outline-none ${inputCls}`}>
                            <option>Modbus PLC HR-4001</option>
                            <option>Pulse counter PC6</option>
                            {!useBackend && <option>Simulasi internal</option>}
                          </select>
                        ))}
                        {field('Offset suhu (°C)', textInput(tempOffset, setTempOffset, undefined, 'number'), 'Kalibrasi NTC → tmp_x10.')}
                      </div>
                      <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer">
                        <input type="checkbox" checked={fifoEnable} onChange={(e) => setFifoEnable(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        <span className={value}>Aktifkan buffer FIFO OSPI (tahan 7 hari offline, flag <code className="font-mono">is_buffered</code>)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className={`text-[11px] font-mono ${label}`}>MCU STM32H723ZGT6 · Cortex-M7 550MHz · FW v0.3.1 · FreeRTOS 10.6</p>
                    <button type="button"
                      onClick={() => { pushLog('TX', `PUB ${topicPrefix}/config → SET_DEVICE_CONFIG name="${devName}" ip=${dhcp ? 'dhcp' : ipAddr}`); pushLog('RX', 'ACK edge: device.bin ditulis + reboot netif'); }}
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Simpan ke Edge
                    </button>
                  </div>
                </div>
              )}

              {/* ===== JARINGAN ===== */}
              {activeTab === 'JARINGAN' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${panel}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Network className="w-4 h-4 text-blue-500" /> Broker MQTT</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {field('Host / IP', textInput(brokerHost, setBrokerHost))}
                      {field('Port', textInput(brokerPort, setBrokerPort, undefined, 'number'))}
                      {field('Keep-alive (s)', textInput(keepAlive, setKeepAlive, undefined, 'number'))}
                      {field('QoS default', (
                        <select value={qos} onChange={(e) => setQos(Number(e.target.value) as 0 | 1 | 2)} className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono outline-none ${inputCls}`}>
                          <option value={0}>0 — at most once</option>
                          <option value={1}>1 — at least once</option>
                          <option value={2}>2 — exactly once</option>
                        </select>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {field('Client ID', textInput(clientId, setClientId), 'Unik per perangkat, dipakai untuk sesi persisten.')}
                      {field('User', textInput(mqttUser, setMqttUser))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useTls} onChange={(e) => setUseTls(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        <span className={value}>TLS (8883) + validasi sertifikat</span>
                      </label>
                      <span className={`font-mono ${label}`}>LWT: {topicPrefix}/status → "offline" (retain)</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${panel}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2 ${value}`}><FileJson className="w-4 h-4 text-cyan-500" /> Peta topik (dari prefix)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      {[
                        ['telemetry', `${topicPrefix}/telemetry`, 'edge → cloud · 1s'],
                        ['command', `${topicPrefix}/command`, 'cloud → edge · substring'],
                        ['config', `${topicPrefix}/config`, 'cloud → edge · QoS 1'],
                        ['ack', `${topicPrefix}/ack`, 'edge → cloud · tx result'],
                        ['health', `${topicPrefix}/health`, 'edge → cloud · 5s'],
                        ['status', `${topicPrefix}/status`, 'LWT retain'],
                      ].map(([k, tp, d]) => (
                        <div key={k} className={`px-2.5 py-2 rounded-lg border ${isDark ? 'border-slate-800 bg-[#050811]' : 'border-slate-200 bg-white'}`}>
                          <div className="text-blue-500 font-bold">{tp}</div>
                          <div className={label}>{k} · {d}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button type="button" onClick={() => { pushLog('TX', `CONNECT mqtt://${brokerHost}:${brokerPort} id=${clientId} ka=${keepAlive}s`); pushLog('RX', 'CONNACK 0x00 — sesi persisten, 6 topik disubscribe'); }} className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5">
                        <PlugZap className="w-3.5 h-3.5" /> Tes koneksi
                      </button>
                      <button type="button" onClick={() => { setTopicPrefix(`oee/device/${machine.deviceId}`); setClientId(`edge-${machine.deviceId.toLowerCase()}`); pushLog('SYS', 'Prefix & client-id dikembalikan ke default perangkat'); }} className={`px-3.5 py-2 rounded-lg border text-xs font-bold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}>
                        Kembalikan default
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== PRODUKSI ===== */}
              {activeTab === 'PRODUKSI' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-start gap-2.5 ${jobDirty ? (isDark ? 'bg-amber-950/40 border-amber-800' : 'bg-amber-50 border-amber-300') : panel}`}>
                    <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${jobDirty ? 'text-amber-500' : 'text-emerald-500'}`} />
                    <div className="text-xs">
                      <div className={`font-bold ${value}`}>{jobDirty ? 'Ada perubahan belum dipublish ke edge' : 'Edge sinkron dengan job aktif'}</div>
                      <p className={label}>Publish menulis 8 parameter ke <code className="font-mono">/cfg/job.bin</code> + CRC32, lalu edge menjawab di <code className="font-mono">{topicPrefix}/ack</code> dengan transaction_id yang sama.</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${card}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${value}`}>Work order & produk</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {field('Work Order *', textInput(wo, setWo, 'Contoh: WO-2026-0920-01'))}
                      {field('Target qty (pcs) *', textInput(targetQty, setTargetQty, `Planned operating ${fmtDur(plannedOperatingSec)} → takt ≈ ${(plannedOperatingSec / Math.max(1, Number(targetQty))).toFixed(1)}s/pcs`, 'number'))}
                      {field('Product ID', textInput(productId, setProductId))}
                      {field('Nama produk *', textInput(productName, setProductName))}
                      {field('Std cycle time (detik) *', textInput(stdCycle, setStdCycle, `Ideal ${machine.idealCycleTimeSec}s · aktual ${(t.cyc / 100).toFixed(2)}s`, 'number'))}
                      {field('Estimasi rate', <input value={`${Math.round(3600 / Math.max(0.1, Number(stdCycle)))} pcs/jam`} readOnly className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono opacity-70 ${inputCls}`} />, '3600 / std_cycle_time.')}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${card}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${value}`}><Clock className="w-4 h-4 text-purple-500" /> Operator & shift</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {field('Operator ID', textInput(operatorId, setOperatorId))}
                      {field('Nama operator', textInput(operatorName, setOperatorName))}
                      {field('Istirahat terjadwal (mnt)', textInput(breakMin, setBreakMin, undefined, 'number'))}
                      {field('Shift mulai', textInput(shiftStart, setShiftStart))}
                      {field('Shift selesai', textInput(shiftEnd, setShiftEnd))}
                      {field('Operating (auto)', <input value={fmtDur(plannedOperatingSec)} readOnly className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono opacity-70 ${inputCls}`} />)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${panel}`}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${value}`}>Preview payload SET_JOB_CONFIG</h3>
                      <button type="button" onClick={() => handleCopy(jobPayload)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${isDark ? 'border-blue-800 text-blue-300 hover:bg-blue-950' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}`}>
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} {copied ? 'Disalin' : 'Salin JSON'}
                      </button>
                    </div>
                    <pre className={`p-3 rounded-xl border font-mono text-[11px] leading-relaxed overflow-x-auto ${isDark ? 'bg-[#050811] border-slate-800 text-emerald-300' : 'bg-white border-slate-200 text-emerald-800'}`}>{jobPayload}</pre>
                    {!jobValid && <p className="text-[11px] text-rose-500 font-semibold mt-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Lengkapi WO, produk, target &gt; 0, dan cycle &gt; 0.</p>}
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button"
                        onClick={() => { setWo(machine.jobConfig.workOrder); setProductName(machine.jobConfig.productName); setProductId(machine.jobConfig.productId); setOperatorName(machine.jobConfig.operatorName); setOperatorId(machine.jobConfig.operatorId); setTargetQty(machine.jobConfig.targetQuantity); setStdCycle(machine.jobConfig.standardCycleTimeSec); }}
                        className={`px-4 py-2 rounded-lg border text-xs font-bold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}
                      >
                        Reset
                      </button>
                      <button type="button" onClick={publishJob} disabled={!jobValid} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Publish & tunggu ACK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== KONTROL ===== */}
              {activeTab === 'KONTROL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button type="button" onClick={() => sendCmd('RESUME')} className={`p-4 rounded-xl border text-left transition-all ${isDark ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800' : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300'}`}>
                      <Play className="w-5 h-5 text-emerald-500 mb-2" />
                      <div className={`font-bold text-xs ${value}`}>RESUME</div>
                      <div className={`text-[10px] font-mono mt-0.5 ${label}`}>FSM → RUNNING</div>
                      <p className={`text-[11px] mt-1 ${label}`}>Lanjutkan timer siklus & akumulasi run-time.</p>
                    </button>
                    <button type="button" onClick={() => sendCmd('PAUSE')} className={`p-4 rounded-xl border text-left transition-all ${isDark ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800' : 'bg-rose-50 hover:bg-rose-100 border-rose-300'}`}>
                      <Pause className="w-5 h-5 text-rose-500 mb-2" />
                      <div className={`font-bold text-xs ${value}`}>PAUSE</div>
                      <div className={`text-[10px] font-mono mt-0.5 ${label}`}>FSM → UNPLANNED_DT</div>
                      <p className={`text-[11px] mt-1 ${label}`}>Hentikan siklus, mulai hitung downtime.</p>
                    </button>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-950/30 border-amber-800' : 'bg-amber-50 border-amber-300'}`}>
                      <RotateCcw className="w-5 h-5 text-amber-500 mb-2" />
                      <div className={`font-bold text-xs ${value}`}>RESET_COUNTER</div>
                      <div className={`text-[10px] font-mono mt-0.5 ${label}`}>EVENT_BUTTON_RESET</div>
                      <label className="flex items-center gap-1.5 mt-2 text-[11px] cursor-pointer">
                        <input type="checkbox" checked={confirmReset} onChange={(e) => setConfirmReset(e.target.checked)} className="w-3.5 h-3.5 accent-amber-600" />
                        <span className={label}>Saya paham counter dinolkan</span>
                      </label>
                      <button type="button" onClick={() => confirmReset && sendCmd('RESET_COUNTER')} disabled={!confirmReset} className="mt-2 w-full px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-[11px] font-bold">
                        Kirim reset
                      </button>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${panel}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${value}`}>Alur FSM edge (task_network.c)</h3>
                    <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] font-bold">
                      {['READY', 'RUNNING', 'PLANNED_DT', 'UNPLANNED_DT', 'BATCH_FINISHED'].map((s, i, arr) => (
                        <React.Fragment key={s}>
                          <span className={`px-2 py-1 rounded-lg border ${fsmLabel === s ? 'bg-blue-600 text-white border-blue-600' : isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}>{s}</span>
                          {i < arr.length - 1 && <span className={label}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <p className={`text-[11px] mt-2 ${label}`}>Payload perintah memakai pencocokan substring teks lalu diposting ke <code className="font-mono">hQueueSystemEvent[16]</code>. Posisi saat ini: <strong className="text-blue-500">{fsmLabel}</strong>.</p>
                  </div>
                </div>
              )}

              {/* ===== TELEMETRI ===== */}
              {activeTab === 'TELEMETRI' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className={`font-mono ${label}`}>Topik <span className="text-blue-500 font-bold">{topicPrefix}/telemetry</span> · QoS {qos} · 1s</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsPretty(!isPretty)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'}`}>
                        {isPretty ? 'Wire compact' : 'Pretty JSON'}
                      </button>
                      <button type="button" onClick={() => handleCopy(isPretty ? prettyTelemetry : wireTelemetry)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${isDark ? 'border-blue-800 text-blue-300' : 'border-blue-300 text-blue-700'}`}>
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} {copied ? 'Disalin' : 'Salin frame'}
                      </button>
                    </div>
                  </div>
                  <div className={`p-3.5 rounded-xl border font-mono text-[11px] leading-relaxed overflow-x-auto ${isDark ? 'bg-[#050811] border-slate-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-emerald-300'}`}>
                    <pre>{isPretty ? prettyTelemetry : wireTelemetry}</pre>
                  </div>
                  <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-[#1c3358]' : 'border-slate-200'}`}>
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className={`border-b ${isDark ? 'bg-[#080e1c] text-slate-400 border-[#1c3358]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <tr><th className="p-2 pl-3">Field</th><th className="p-2">Nilai live</th><th className="p-2">Skala</th><th className="p-2 hidden sm:table-cell">Makna</th></tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-[#1c3358]/60' : 'divide-slate-200'}`}>
                        {[
                          ['ts', String(t.ts), 'epoch (s)', new Date(t.ts * 1000).toLocaleString('id-ID')],
                          ['st', `${t.st} (${fsmLabel})`, 'enum 0..5', 'Status FSM edge'],
                          ['tot / rej', `${t.tot} / ${t.rej}`, 'pcs (u32)', `good ≈ ${t.tot - t.rej}`],
                          ['cyc', String(t.cyc), '×10ms', `siklus ${(t.cyc / 100).toFixed(2)}s`],
                          ['oee / a / p / q', `${t.oee}/${t.a}/${t.p}/${t.q}`, '×100 %', `${(t.oee / 100).toFixed(2)} / ${(t.a / 100).toFixed(1)} / ${(t.p / 100).toFixed(1)} / ${(t.q / 100).toFixed(1)}`],
                          ['run / dt', `${t.run}s / ${t.dt}s`, 'detik', `${fmtDur(t.run)} / ${fmtDur(t.dt)}`],
                          ['alm / rpm / tmp', `${t.alm} / ${t.rpm} / ${t.tmp}`, 'code/rpm/×0.1°C', t.alm === 0 ? 'normal' : `alarm ${t.alm}`],
                          ['di', `0x${t.di.toString(16).toUpperCase()}`, 'bitmask PC0..5', 'input digital'],
                          ['is_buffered', String(t.is_buffered), 'bool', t.is_buffered ? 'drain FIFO' : 'live stream'],
                        ].map(([f, v, s, m]) => (
                          <tr key={f}>
                            <td className="p-2 pl-3 text-sky-500 font-bold">{f}</td>
                            <td className={`p-2 font-bold ${value}`}>{v}</td>
                            <td className={`p-2 ${label}`}>{s}</td>
                            <td className={`p-2 hidden sm:table-cell ${label}`}>{m}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== KESEHATAN ===== */}
              {activeTab === 'KESEHATAN' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-xl border ${card}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>Heap bebas</div>
                      <div className={`font-mono font-extrabold text-lg ${value}`}>{h.heap_free.toLocaleString('id-ID')} B</div>
                      <div className={`h-1.5 rounded-full mt-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (h.heap_free / 262144) * 100)}%` }} />
                      </div>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${card}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>Tasks sehat</div>
                      <div className={`font-mono font-extrabold text-lg ${value}`}>{h.tasks_healthy}/{h.tasks_total}</div>
                      <div className={`text-[11px] font-mono ${h.stale_count ? 'text-amber-500' : 'text-emerald-500'}`}>{h.stale_count} stale</div>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${card}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${label}`}>Event flags</div>
                      <div className={`font-mono font-extrabold text-lg ${value}`}>0x{h.event_flags.toString(16).toUpperCase().padStart(4, '0')}</div>
                      <div className={`text-[11px] font-mono ${label}`}>periode 5s</div>
                    </div>
                  </div>
                  <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-[#1c3358]' : 'border-slate-200'}`}>
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className={`${isDark ? 'bg-[#080e1c] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <tr><th className="p-2 pl-3">Task</th><th className="p-2">Age</th><th className="p-2">State</th></tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-[#1c3358]/60' : 'divide-slate-200'}`}>
                        {h.stale_tasks.length === 0 && <tr><td colSpan={3} className={`p-3 text-center ${label}`}>Semua task FreeRTOS sehat — tidak ada stale task.</td></tr>}
                        {h.stale_tasks.map((s) => (
                          <tr key={s.name}>
                            <td className="p-2 pl-3 font-bold text-sky-500">{s.name}</td>
                            <td className={`p-2 ${value}`}>{s.age_ms.toLocaleString('id-ID')} ms</td>
                            <td className={`p-2 font-bold ${s.alive ? 'text-emerald-500' : 'text-rose-500'}`}>{s.alive ? '● ALIVE' : '● STALE'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={`p-3 rounded-xl border font-mono text-[11px] overflow-x-auto ${isDark ? 'bg-[#050811] border-slate-800 text-amber-300' : 'bg-slate-900 border-slate-800 text-amber-300'}`}>
                    <pre>{JSON.stringify(h, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Console ===== */}
            <div className={`border-t shrink-0 ${isDark ? 'border-[#162744] bg-[#050811]' : 'border-slate-200 bg-slate-900'}`}>
              <div className="flex items-center gap-2 px-3 pt-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Console MQTT</span>
                <span className="text-[10px] font-mono text-slate-500">{consoleLog.length} baris</span>
                <button type="button" onClick={() => setConsoleLog([])} className="ml-auto text-[10px] font-mono text-slate-500 hover:text-slate-300">bersihkan</button>
              </div>
              <div className="px-3 py-2 h-20 overflow-y-auto font-mono text-[11px] leading-relaxed" aria-live="polite">
                {consoleLog.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-600 shrink-0">{l.ts}</span>
                    <span className={`font-bold shrink-0 ${l.kind === 'TX' ? 'text-sky-400' : l.kind === 'RX' ? 'text-emerald-400' : 'text-slate-500'}`}>{l.kind}</span>
                    <span className="text-slate-300 break-all">{l.text}</span>
                  </div>
                ))}
              </div>
            </div>
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
