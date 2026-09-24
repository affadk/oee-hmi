// /src/presentation/components/modals/MqttEdgeInspectorModal/tabs/PerangkatTab.tsx
// Tab Perangkat — identitas perangkat, antarmuka jaringan W5500, sensor & penyimpanan.

import React from 'react';
import { Cpu, Wifi, Activity, Save } from 'lucide-react';
import type { MqttEdgeTabContext } from '../tabShared';
import { Field, TextInput } from '../tabShared';

interface PerangkatTabProps {
  ctx: MqttEdgeTabContext;
  devName: string;
  setDevName: (v: string) => void;
  devLine: string;
  setDevLine: (v: string) => void;
  devArea: string;
  setDevArea: (v: string) => void;
  dhcp: boolean;
  setDhcp: (v: boolean) => void;
  ipAddr: string;
  setIpAddr: (v: string) => void;
  gateway: string;
  setGateway: (v: string) => void;
  tempOffset: number;
  setTempOffset: (v: number) => void;
  rpmSource: string;
  setRpmSource: (v: string) => void;
  fifoEnable: boolean;
  setFifoEnable: (v: boolean) => void;
}

export const PerangkatTab: React.FC<PerangkatTabProps> = ({
  ctx,
  devName,
  setDevName,
  devLine,
  setDevLine,
  devArea,
  setDevArea,
  dhcp,
  setDhcp,
  ipAddr,
  setIpAddr,
  gateway,
  setGateway,
  tempOffset,
  setTempOffset,
  rpmSource,
  setRpmSource,
  fifoEnable,
  setFifoEnable,
}) => {
  const { machine, topicPrefix, pushLog, isDark, skins, useBackend } = ctx;
  const { panel, label, value, inputCls } = skins;

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border ${panel}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Cpu className="w-4 h-4 text-violet-500" /> Identitas perangkat</h3>
        <p className={`text-[11px] mt-1 ${label}`}>Nama dan lokasi logis — tersimpan di <code className="font-mono">/cfg/device.bin</code> (LittleFS) bersama CRC32.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Field labelText="Device ID (MQTT, read-only)" labelCls={label} node={<input value={machine.deviceId} readOnly className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono opacity-70 ${inputCls}`} />} hint="Dipakai sebagai segmen topik & client-id default." />
          <Field labelText="Nama perangkat" labelCls={label} node={<TextInput val={devName} set={setDevName} inputCls={inputCls} />} />
          <Field labelText="Line produksi" labelCls={label} node={<TextInput val={devLine} set={setDevLine} inputCls={inputCls} />} />
          <Field labelText="Area / stasiun" labelCls={label} node={<TextInput val={devArea} set={setDevArea} inputCls={inputCls} />} />
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
            <Field labelText="IP statis" labelCls={label} node={<TextInput val={ipAddr} set={setIpAddr} inputCls={inputCls} />} />
            <Field labelText="Gateway" labelCls={label} node={<TextInput val={gateway} set={setGateway} inputCls={inputCls} />} />
          </div>
          <p className={`text-[11px] mt-2 font-mono ${label}`}>MAC 02:80:E3:…:51 · Link 100F · SPI 33MHz</p>
        </div>
        <div className={`p-4 rounded-xl border ${panel}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${value}`}><Activity className="w-4 h-4 text-cyan-500" /> Sensor & penyimpanan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Field
              labelText="Sumber RPM"
              labelCls={label}
              node={
                <select value={rpmSource} onChange={(e) => setRpmSource(e.target.value)} className={`w-full border rounded-lg px-2.5 py-2 text-sm font-mono outline-none ${inputCls}`}>
                  <option>Modbus PLC HR-4001</option>
                  <option>Pulse counter PC6</option>
                  {!useBackend && <option>Simulasi internal</option>}
                </select>
              }
            />
            <Field labelText="Offset suhu (°C)" labelCls={label} node={<TextInput val={tempOffset} set={setTempOffset} type="number" inputCls={inputCls} />} hint="Kalibrasi NTC → tmp_x10." />
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
  );
};
