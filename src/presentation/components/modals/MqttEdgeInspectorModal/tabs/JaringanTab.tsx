// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/JaringanTab.tsx
// Tab Jaringan — broker MQTT, peta topik, tes koneksi.

import React from 'react';
import { Network, FileJson, PlugZap } from 'lucide-react';
import type { MqttEdgeTabContext } from '../tabShared';
import { Field, TextInput } from '../tabShared';

interface JaringanTabProps {
  ctx: MqttEdgeTabContext;
  brokerHost: string;
  setBrokerHost: (v: string) => void;
  brokerPort: number;
  setBrokerPort: (v: number) => void;
  clientId: string;
  setClientId: (v: string) => void;
  setTopicPrefix: (v: string) => void;
  setQos: (v: 0 | 1 | 2) => void;
  keepAlive: number;
  setKeepAlive: (v: number) => void;
  useTls: boolean;
  setUseTls: (v: boolean) => void;
  mqttUser: string;
  setMqttUser: (v: string) => void;
}

export const JaringanTab: React.FC<JaringanTabProps> = ({
  ctx,
  brokerHost,
  setBrokerHost,
  brokerPort,
  setBrokerPort,
  clientId,
  setClientId,
  setTopicPrefix,
  setQos,
  keepAlive,
  setKeepAlive,
  useTls,
  setUseTls,
  mqttUser,
  setMqttUser,
}) => {
  const { machine, topicPrefix, qos, pushLog, isDark, skins } = ctx;
  const { panel, label, value, inputCls } = skins;

  const topics: Array<[string, string, string]> = [
    ['telemetry', `${topicPrefix}/telemetry`, 'edge → cloud · 1s'],
    ['command', `${topicPrefix}/command`, 'cloud → edge · substring'],
    ['config', `${topicPrefix}/config`, 'cloud → edge · QoS 1'],
    ['ack', `${topicPrefix}/ack`, 'edge → cloud · tx result'],
    ['health', `${topicPrefix}/health`, 'edge → cloud · 5s'],
    ['status', `${topicPrefix}/status`, 'LWT retain'],
  ];

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border ${panel}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Network className="w-4 h-4 text-blue-500" /> Broker MQTT</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <Field labelText="Host / IP" labelCls={label} node={<TextInput val={brokerHost} set={setBrokerHost} inputCls={inputCls} />} />
          <Field labelText="Port" labelCls={label} node={<TextInput val={brokerPort} set={setBrokerPort} type="number" inputCls={inputCls} />} />
          <Field labelText="Keep-alive (s)" labelCls={label} node={<TextInput val={keepAlive} set={setKeepAlive} type="number" inputCls={inputCls} />} />
          <Field
            labelText="QoS default"
            labelCls={label}
            node={
              <select value={qos} onChange={(e) => setQos(Number(e.target.value) as 0 | 1 | 2)} className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono outline-none ${inputCls}`}>
                <option value={0}>0 — at most once</option>
                <option value={1}>1 — at least once</option>
                <option value={2}>2 — exactly once</option>
              </select>
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Field labelText="Client ID" labelCls={label} node={<TextInput val={clientId} set={setClientId} inputCls={inputCls} />} hint="Unik per perangkat, dipakai untuk sesi persisten." />
          <Field labelText="User" labelCls={label} node={<TextInput val={mqttUser} set={setMqttUser} inputCls={inputCls} />} />
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
          {topics.map(([k, tp, d]) => (
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
  );
};
