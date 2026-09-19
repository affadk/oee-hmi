import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Cpu, 
  Radio, 
  Send, 
  RotateCcw, 
  Play, 
  Pause, 
  Sliders, 
  Copy,
  Check
} from 'lucide-react';
import { MachineConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface MqttEdgeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: MachineConfig;
  onSendCommand: (cmd: 'RESET_COUNTER' | 'PAUSE' | 'RESUME') => void;
  onSendJobConfig: (wo: string, product: string, operator: string, target: number) => void;
}

export const MqttEdgeInspectorModal: React.FC<MqttEdgeInspectorModalProps> = ({
  isOpen,
  onClose,
  machine,
  onSendCommand,
  onSendJobConfig,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'COMMAND' | 'CONFIG' | 'HEALTH'>('TELEMETRY');
  const [isPretty, setIsPretty] = useState(false);
  const [copied, setCopied] = useState(false);

  // Config test form
  const [woInput, setWoInput] = useState('WO-2026-0901-01');
  const [productInput, setProductInput] = useState(machine.currentProduct || 'Product A');
  const [operatorInput, setOperatorInput] = useState('Ahmad S.');
  const [targetQtyInput, setTargetQtyInput] = useState(1000);

  if (!isOpen) return null;

  // Build current compact JSON according to net_mqtt.c:32 (b0d1067)
  const nowTs = Math.floor(Date.now() / 1000);
  const stateEnum = machine.status === 'RUNNING' ? 2 : machine.status === 'DOWN' ? 4 : machine.status === 'IDLE' ? 3 : 1;
  const oeeX100 = Math.round(82.4 * 100);
  const aX100 = Math.round(91.2 * 100);
  const pX100 = Math.round(94.5 * 100);
  const qX100 = Math.round(95.6 * 100);
  const cyc10ms = Math.round(machine.actualCycleTimeSec * 100);
  const runSec = 378 * 60;
  const dtSec = 42 * 60;

  const rawTelemetryObj = {
    ts: nowTs,
    st: stateEnum,
    tot: machine.totalCount,
    rej: machine.rejectCount,
    cyc: cyc10ms,
    run: runSec,
    dt: dtSec,
    oee: oeeX100,
    a: aX100,
    p: pX100,
    q: qX100,
    alm: machine.status === 'DOWN' ? 104 : 0,
    rpm: 1500,
    tmp: 423,
    di: 5,
    is_buffered: false,
  };

  const wireTelemetryStr = JSON.stringify(rawTelemetryObj);
  const prettyTelemetryStr = JSON.stringify(rawTelemetryObj, null, 2);

  const healthObj = {
    timestamp: nowTs,
    heap_free: 42000,
    tasks_healthy: 8,
    tasks_total: 9,
    stale_tasks: [
      { name: 'Watchdog', age_ms: 100, alive: 1 },
      { name: 'SensorIO', age_ms: 5, alive: 1 },
      { name: 'OEECalc', age_ms: 2, alive: 1 },
      { name: 'ModbusPLC', age_ms: 80, alive: 1 },
      { name: 'StorageFlash', age_ms: 12, alive: 1 },
      { name: 'StorageSD', age_ms: 15, alive: 1 },
      { name: 'LCD', age_ms: 20, alive: 1 },
      { name: 'Network', age_ms: 1, alive: 1 },
      { name: 'HttpServer', age_ms: 4294967295, alive: 0 },
    ],
    stale_count: 1,
    event_flags: 3,
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md">
      <div className={`border rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#0b1528] border-[#1e3a5f] text-slate-200' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors ${
          isDark ? 'border-[#162744] bg-[#080e1c]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-blue-950/80 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  STM32H723 MQTT Edge Controller Terminal
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  isDark ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}>
                  W5500 SPI2 Online
                </span>
              </div>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Topic: oee/device/STM32-OEE-01/# • Broker 192.168.10.100:1883 • QoS 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className={`flex border-b px-4 gap-1 overflow-x-auto ${
          isDark ? 'border-[#162744] bg-[#070c18]' : 'border-slate-200 bg-slate-100/70'
        }`}>
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-3.5 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'TELEMETRY'
                ? 'border-blue-500 text-blue-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            1. Telemetry (Live / FIFO)
          </button>
          <button
            onClick={() => setActiveTab('COMMAND')}
            className={`px-3.5 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'COMMAND'
                ? 'border-emerald-500 text-emerald-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            2. Commands (Edge FSM)
          </button>
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`px-3.5 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CONFIG'
                ? 'border-purple-500 text-purple-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            3. SET_JOB_CONFIG
          </button>
          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`px-3.5 py-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'HEALTH'
                ? 'border-amber-500 text-amber-500'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            4. Edge Health (FreeRTOS)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'TELEMETRY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Topic: <span className="text-blue-500 font-semibold">oee/device/STM32-OEE-01/telemetry</span> (QoS 1)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPretty(!isPretty)}
                    className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isPretty ? 'Compact Wire View' : 'Pretty JSON View'}
                  </button>
                  <button
                    onClick={() => handleCopy(isPretty ? prettyTelemetryStr : wireTelemetryStr)}
                    className={`px-2.5 py-1 rounded text-xs border flex items-center gap-1 transition-colors ${
                      isDark 
                        ? 'bg-blue-900/60 hover:bg-blue-800 text-blue-300 border-blue-700' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                    }`}
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Frame'}
                  </button>
                </div>
              </div>

              {/* Terminal Code Block */}
              <div className="bg-[#050811] p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
                <pre>{isPretty ? prettyTelemetryStr : wireTelemetryStr}</pre>
              </div>

              {/* Data Field Breakdown Table matching Markdown §5 */}
              <div className={`border rounded-xl overflow-hidden text-xs ${isDark ? 'border-[#162744]' : 'border-slate-200'}`}>
                <table className="w-full text-left font-mono">
                  <thead className={`border-b ${isDark ? 'bg-[#080e1c] text-slate-400 border-[#162744]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <tr>
                      <th className="p-2 pl-3">Field</th>
                      <th className="p-2">Current Value</th>
                      <th className="p-2">Scaling / Unit</th>
                      <th className="p-2">SSoT Meaning</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#162744]/60 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">ts</td>
                      <td className={`p-2 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{nowTs}</td>
                      <td className="p-2">Unix epoch (s)</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sample time (preserved offline in OSPI FIFO)</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">st</td>
                      <td className="p-2 font-mono text-emerald-500">{stateEnum} (RUNNING)</td>
                      <td className="p-2">enum 0..5</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>MachineState_t (2 = RUNNING, 4 = UNPLANNED_DT)</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">tot / rej</td>
                      <td className={`p-2 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{machine.totalCount} / {machine.rejectCount}</td>
                      <td className="p-2">pcs (u32)</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total count & Reject count</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">cyc</td>
                      <td className={`p-2 font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{cyc10ms}</td>
                      <td className="p-2">0.01s (10ms)</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Last cycle: {(cyc10ms / 100).toFixed(2)}s (Current Cycle 10.8s)</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">oee / a / p / q</td>
                      <td className={`p-2 font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>8240 / 9120 / 9450 / 9560</td>
                      <td className="p-2">x100 %</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>OEE 82.4%, Avail 91.2%, Perf 94.5%, Qual 95.6%</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">run / dt</td>
                      <td className={`p-2 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{runSec}s / {dtSec}s</td>
                      <td className="p-2">detik (u32)</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Run Time 378 min, Downtime 42 min</td>
                    </tr>
                    <tr>
                      <td className="p-2 pl-3 text-sky-500 font-bold">is_buffered</td>
                      <td className="p-2 font-mono text-emerald-500">false</td>
                      <td className="p-2">boolean</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Live stream (false) vs Flash FIFO drain (true)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'COMMAND' && (
            <div className="space-y-4">
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Play className="w-4 h-4 text-emerald-500" />
                  MQTT Command Dispatcher (Topic: oee/device/STM32-OEE-01/command)
                </div>
                <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Payload text-contains substring matching per <code className={`font-mono ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>task_network.c:117</code>.
                  Edge controller posts directly to <code className={`font-mono ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>hQueueSystemEvent 16</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* RESET_COUNTER */}
                <button
                  onClick={() => onSendCommand('RESET_COUNTER')}
                  className={`p-3.5 rounded-xl border text-left transition-all group ${
                    isDark 
                      ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-600' 
                      : 'bg-white hover:bg-slate-50 border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <RotateCcw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>EVENT_BUTTON_RESET</span>
                  </div>
                  <div className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>RESET_COUNTER</div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Resets total, good, and reject counters to zero for new batch.
                  </p>
                </button>

                {/* PAUSE */}
                <button
                  onClick={() => onSendCommand('PAUSE')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isDark 
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800' 
                      : 'bg-rose-50 hover:bg-rose-100 border-rose-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Pause className="w-5 h-5 text-rose-500" />
                    <span className={`text-[10px] font-mono ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>FSM → UNPLANNED_DT</span>
                  </div>
                  <div className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>PAUSE</div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Transitions FSM to Unplanned Downtime; increments downtime counter.
                  </p>
                </button>

                {/* RESUME */}
                <button
                  onClick={() => onSendCommand('RESUME')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isDark 
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800' 
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Play className="w-5 h-5 text-emerald-500" />
                    <span className={`text-[10px] font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>FSM → RUNNING</span>
                  </div>
                  <div className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>RESUME</div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Transitions FSM back to Running state and resumes cycle timers.
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'CONFIG' && (
            <div className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                isDark ? 'bg-[#080e1c] border-[#162744]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Sliders className="w-4 h-4 text-purple-500" />
                  SET_JOB_CONFIG Payload (Backend MQTT QoS 1 Only)
                </div>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Writes 8 production parameters to LittleFS <code className={isDark ? 'text-purple-300' : 'text-purple-700'}>/cfg/job.bin</code> with IEEE CRC32.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Work Order (WO ID)</label>
                  <input
                    type="text"
                    value={woInput}
                    onChange={(e) => setWoInput(e.target.value)}
                    className={`w-full border rounded-lg p-2 font-mono ${
                      isDark ? 'bg-[#050811] border-[#162744] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Product Name</label>
                  <input
                    type="text"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    className={`w-full border rounded-lg p-2 font-mono ${
                      isDark ? 'bg-[#050811] border-[#162744] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Operator Name</label>
                  <input
                    type="text"
                    value={operatorInput}
                    onChange={(e) => setOperatorInput(e.target.value)}
                    className={`w-full border rounded-lg p-2 font-mono ${
                      isDark ? 'bg-[#050811] border-[#162744] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Target Quantity (pcs)</label>
                  <input
                    type="number"
                    value={targetQtyInput}
                    onChange={(e) => setTargetQtyInput(Number(e.target.value))}
                    className={`w-full border rounded-lg p-2 font-mono ${
                      isDark ? 'bg-[#050811] border-[#162744] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onSendJobConfig(woInput, productInput, operatorInput, targetQtyInput);
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Publish SET_JOB_CONFIG & Await Ack
                </button>
              </div>
            </div>
          )}

          {activeTab === 'HEALTH' && (
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  Topic: <span className="text-amber-500 font-semibold">oee/device/STM32-OEE-01/health</span> (5s period)
                </span>
                <span className="text-emerald-500 font-semibold">FreeRTOS Heap Free: 42,000 bytes</span>
              </div>
              <div className="bg-[#050811] p-3 rounded-xl border border-slate-800 text-amber-300 leading-relaxed overflow-x-auto">
                <pre>{JSON.stringify(healthObj, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between text-xs transition-colors ${
          isDark ? 'border-[#162744] bg-[#080e1c] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <span>Firmware Target: STM32H723ZGT6 @ 550MHz • IIoT Edge Controller</span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
