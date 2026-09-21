// /src/components/fullscreen/PasXProgressStrip.tsx

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MachineConfig, CalculatedOeeMetrics } from '../../types';

interface PasXProgressStripProps {
  machine: MachineConfig;
  metrics: CalculatedOeeMetrics;
}

interface TimelineEvent {
  key: string;
  type: 'Breakdown' | 'Active' | 'Changeover' | 'Waiting' | 'Undefined';
  label: string;
  startTime: string;
  endTime: string;
  duration: string;
  color: string;
  startHourFraction: number;
  durationFraction: number;
}

const SHIFT_EVENTS: TimelineEvent[] = [
  { key: '0295837101', type: 'Active', label: 'Normal Production Run', startTime: '2026/09/20 - 10:00 PM', endTime: '2026/09/20 - 11:15 PM', duration: '1h 15m', color: '#48a43f', startHourFraction: 0, durationFraction: 1.25 },
  { key: '0295837120', type: 'Changeover', label: 'Blister Film Roll Setup', startTime: '2026/09/20 - 11:15 PM', endTime: '2026/09/21 - 00:05 AM', duration: '50m', color: '#eab308', startHourFraction: 1.25, durationFraction: 0.85 },
  { key: '0295837144', type: 'Active', label: 'High Speed Packaging Run', startTime: '2026/09/21 - 00:05 AM', endTime: '2026/09/21 - 00:37 AM', duration: '32m', color: '#48a43f', startHourFraction: 2.1, durationFraction: 0.55 },
  { key: '0295837182', type: 'Breakdown', label: 'Feeder Jam & Jam Sensor Error', startTime: '2026/09/21 - 00:37 AM', endTime: '2026/09/21 - 01:05 AM', duration: '28m', color: '#dc2626', startHourFraction: 2.65, durationFraction: 0.47 },
  { key: '0295837201', type: 'Active', label: 'Continuous Blister Sealing (Current)', startTime: '2026/09/21 - 01:05 AM', endTime: '2026/09/21 - 02:20 AM', duration: '1h 15m', color: '#48a43f', startHourFraction: 3.12, durationFraction: 1.25 },
  { key: '0295837225', type: 'Waiting', label: 'Waiting for Batch Verification', startTime: '2026/09/21 - 02:20 AM', endTime: '2026/09/21 - 02:34 AM', duration: '14m', color: '#eab308', startHourFraction: 4.37, durationFraction: 0.23 },
  { key: '0295837240', type: 'Active', label: 'Production Run (Shift Peak)', startTime: '2026/09/21 - 02:34 AM', endTime: '2026/09/21 - 03:30 AM', duration: '56m', color: '#48a43f', startHourFraction: 4.6, durationFraction: 0.93 },
  { key: '0295837265', type: 'Changeover', label: 'Secondary Foil Splice & Inspection', startTime: '2026/09/21 - 03:30 AM', endTime: '2026/09/21 - 04:28 AM', duration: '58m', color: '#eab308', startHourFraction: 5.53, durationFraction: 0.97 },
  { key: '0295837290', type: 'Breakdown', label: 'Cartoner Chute Sensor Offset', startTime: '2026/09/21 - 04:28 AM', endTime: '2026/09/21 - 04:40 AM', duration: '12m', color: '#dc2626', startHourFraction: 6.5, durationFraction: 0.2 },
  { key: '0295837310', type: 'Active', label: 'Final Shift Run & Batch Close', startTime: '2026/09/21 - 04:40 AM', endTime: '2026/09/21 - 06:35 AM', duration: '1h 55m', color: '#48a43f', startHourFraction: 6.7, durationFraction: 1.9 },
];

const getEventColorTheme = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'Active':
      return { bannerBg: 'bg-emerald-50 dark:bg-emerald-950/40', bannerBorder: 'border-emerald-400 dark:border-emerald-600', badgeBg: 'bg-[#48a43f]', badgeText: 'text-white', accentText: 'text-emerald-700 dark:text-emerald-300', highlightBorder: '#48a43f' };
    case 'Breakdown':
      return { bannerBg: 'bg-rose-50 dark:bg-rose-950/40', bannerBorder: 'border-rose-400 dark:border-rose-600', badgeBg: 'bg-[#dc2626]', badgeText: 'text-white', accentText: 'text-rose-700 dark:text-rose-300', highlightBorder: '#dc2626' };
    case 'Changeover':
    case 'Waiting':
      return { bannerBg: 'bg-amber-50 dark:bg-amber-950/40', bannerBorder: 'border-amber-400 dark:border-amber-600', badgeBg: 'bg-[#eab308]', badgeText: 'text-slate-900 font-bold', accentText: 'text-amber-800 dark:text-amber-300', highlightBorder: '#eab308' };
    default:
      return { bannerBg: 'bg-slate-50 dark:bg-slate-900/60', bannerBorder: 'border-slate-300 dark:border-slate-700', badgeBg: 'bg-slate-600', badgeText: 'text-white', accentText: 'text-slate-700 dark:text-slate-300', highlightBorder: '#64748b' };
  }
};

export const PasXProgressStrip: React.FC<PasXProgressStripProps> = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent>(SHIFT_EVENTS[4]);
  const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'];
  const selectedTheme = getEventColorTheme(selectedEvent.type);
  const selectedCenterPct = Math.min(98, Math.max(2, ((selectedEvent.startHourFraction + selectedEvent.durationFraction / 2) / 10) * 100));

  return (
    <div
      id="shift-progress-fullwidth-card"
      className={`h-full min-h-0 w-full p-[clamp(8px,1vh,12px)] rounded-xl border shadow-sm transition-colors flex flex-col overflow-hidden ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header — padding & font relatif vh/vw — min 12px */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pb-[0.8vh] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Progress & Shift Timeline</h4>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">Shift 3 (22:00 - 08:00) · 21 Sep 2026 01:25:37</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#48a43f]" /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Active</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#eab308]" /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Changeover</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#dc2626]" /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Breakdown</span></div>
        </div>
      </div>

      {/* Horizontal grid — detail dibuat kompak proporsional dengan grafik */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-[0.8vw] pt-[0.6vh] overflow-hidden items-center">
        {/* LEFT: Detail — disederhanakan: min 12px */}
        <div className="col-span-12 lg:col-span-4 min-h-0 flex items-center overflow-hidden self-center">
          <div className={`border rounded-md px-2.5 py-1.5 flex items-center gap-2 shadow-sm transition-all duration-200 w-full overflow-hidden ${selectedTheme.bannerBg} ${selectedTheme.bannerBorder}`}>
            <span className={`${selectedTheme.badgeBg} ${selectedTheme.badgeText} px-2 py-1 font-bold rounded text-xs uppercase tracking-wide shadow-xs shrink-0 leading-none`}>{selectedEvent.type}</span>
            <div className="min-w-0 flex-1 flex flex-col gap-0.5 overflow-hidden">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-none truncate">{selectedEvent.label}</span>
              <span className="font-mono text-xs leading-none truncate text-slate-600 dark:text-slate-300">
                {selectedEvent.startTime.split(' - ')[1] || selectedEvent.startTime} — {selectedEvent.endTime.split(' - ')[1] || selectedEvent.endTime} · {selectedEvent.duration}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Timeline — 8 cols, tinggi relatif vh */}
        <div className="col-span-12 lg:col-span-8 min-h-0 flex flex-col justify-center gap-[0.6vh] overflow-hidden">
          {/* Pointer */}
          <div className="relative w-full h-[0.8vh] min-h-[6px] shrink-0 pointer-events-none">
            <div style={{ left: `${selectedCenterPct}%` }} className="absolute -bottom-0.5 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-30">
              <div className="w-0 h-0 border-x-[0.4vw] border-x-transparent border-t-[0.6vh] drop-shadow-md" style={{ borderTopColor: selectedEvent.color }} />
            </div>
          </div>

          {/* Timeline bar — tinggi relatif vh */}
          <div className="w-full h-[clamp(22px,3.2vh,38px)] rounded-md flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner relative shrink-0 overflow-hidden">
            {SHIFT_EVENTS.map((evt) => {
              const widthPct = (evt.durationFraction / 10) * 100;
              const isSelected = selectedEvent.key === evt.key;
              return (
                <button
                  key={evt.key}
                  type="button"
                  onClick={() => setSelectedEvent(evt)}
                  title={`${evt.type} (${evt.duration}): ${evt.label}`}
                  style={{ width: `${widthPct}%`, backgroundColor: evt.color, boxShadow: isSelected ? `0 0 0 3px #2563eb, 0 0 12px ${evt.color}` : undefined }}
                  className={`h-full transition-all cursor-pointer border-r border-black/10 focus:outline-none relative shrink-0 ${isSelected ? 'ring-4 ring-blue-600 dark:ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 z-20 scale-y-[1.12] -translate-y-0.5 rounded-xs brightness-110 shadow-lg' : 'hover:brightness-110 hover:opacity-95'}`}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-white shadow-md animate-ping opacity-75 absolute" />
                      <span className="w-2 h-2 rounded-full bg-white shadow-md relative" />
                    </span>
                  )}
                </button>
              );
            })}
            <div style={{ width: '13.8%' }} className="h-full bg-slate-200 dark:bg-slate-800 rounded-r-md shrink-0" title="End of shift planned" />
            {/* Live indicator */}
            <div className="absolute -top-1.5 bottom-0 w-0.5 bg-amber-400 z-40 shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none" style={{ left: '34.2%' }} title="Metadata Current Time: 21 Sep 2026 01:25:37">
              <span className="absolute -top-4 -translate-x-1/2 bg-amber-400 text-slate-950 font-bold font-mono text-[8px] px-1 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-950 animate-ping" />LIVE 01:25
              </span>
            </div>
          </div>

          {/* Hour ticks — min 11px */}
          <div className="flex justify-between text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 px-1 shrink-0">
            {hours.map((hr, idx) => {
              const isLiveHour = hr === '01:00';
              return (
                <span key={idx} className={`text-center whitespace-nowrap ${isLiveHour ? 'text-amber-500 dark:text-amber-400 font-extrabold scale-110' : 'font-semibold'}`}>{hr}</span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
