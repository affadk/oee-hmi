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
  startHourFraction: number; // 0 to 10 (representing hours 22..8)
  durationFraction: number;
}

const SHIFT_EVENTS: TimelineEvent[] = [
  {
    key: '0295837101',
    type: 'Active',
    label: 'Normal Production Run',
    startTime: '2026/09/20 - 10:00 PM',
    endTime: '2026/09/20 - 11:15 PM',
    duration: '1h 15m',
    color: '#48a43f', // Green
    startHourFraction: 0,
    durationFraction: 1.25,
  },
  {
    key: '0295837120',
    type: 'Changeover',
    label: 'Blister Film Roll Setup',
    startTime: '2026/09/20 - 11:15 PM',
    endTime: '2026/09/21 - 00:05 AM',
    duration: '50m',
    color: '#eab308', // Yellow
    startHourFraction: 1.25,
    durationFraction: 0.85,
  },
  {
    key: '0295837144',
    type: 'Active',
    label: 'High Speed Packaging Run',
    startTime: '2026/09/21 - 00:05 AM',
    endTime: '2026/09/21 - 00:37 AM',
    duration: '32m',
    color: '#48a43f',
    startHourFraction: 2.1,
    durationFraction: 0.55,
  },
  {
    key: '0295837182',
    type: 'Breakdown',
    label: 'Feeder Jam & Jam Sensor Error',
    startTime: '2026/09/21 - 00:37 AM',
    endTime: '2026/09/21 - 01:05 AM',
    duration: '28m',
    color: '#dc2626', // Red
    startHourFraction: 2.65,
    durationFraction: 0.47,
  },
  {
    key: '0295837201',
    type: 'Active',
    label: 'Continuous Blister Sealing (Current)',
    startTime: '2026/09/21 - 01:05 AM',
    endTime: '2026/09/21 - 02:20 AM',
    duration: '1h 15m',
    color: '#48a43f',
    startHourFraction: 3.12,
    durationFraction: 1.25,
  },
  {
    key: '0295837225',
    type: 'Waiting',
    label: 'Waiting for Batch Verification',
    startTime: '2026/09/21 - 02:20 AM',
    endTime: '2026/09/21 - 02:34 AM',
    duration: '14m',
    color: '#eab308',
    startHourFraction: 4.37,
    durationFraction: 0.23,
  },
  {
    key: '0295837240',
    type: 'Active',
    label: 'Production Run (Shift Peak)',
    startTime: '2026/09/21 - 02:34 AM',
    endTime: '2026/09/21 - 03:30 AM',
    duration: '56m',
    color: '#48a43f',
    startHourFraction: 4.6,
    durationFraction: 0.93,
  },
  {
    key: '0295837265',
    type: 'Changeover',
    label: 'Secondary Foil Splice & Inspection',
    startTime: '2026/09/21 - 03:30 AM',
    endTime: '2026/09/21 - 04:28 AM',
    duration: '58m',
    color: '#eab308',
    startHourFraction: 5.53,
    durationFraction: 0.97,
  },
  {
    key: '0295837290',
    type: 'Breakdown',
    label: 'Cartoner Chute Sensor Offset',
    startTime: '2026/09/21 - 04:28 AM',
    endTime: '2026/09/21 - 04:40 AM',
    duration: '12m',
    color: '#dc2626',
    startHourFraction: 6.5,
    durationFraction: 0.2,
  },
  {
    key: '0295837310',
    type: 'Active',
    label: 'Final Shift Run & Batch Close',
    startTime: '2026/09/21 - 04:40 AM',
    endTime: '2026/09/21 - 06:35 AM',
    duration: '1h 55m',
    color: '#48a43f',
    startHourFraction: 6.7,
    durationFraction: 1.9,
  },
];

// Helper for event type styling
const getEventColorTheme = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'Active':
      return {
        bannerBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        bannerBorder: 'border-emerald-400 dark:border-emerald-600',
        badgeBg: 'bg-[#48a43f]',
        badgeText: 'text-white',
        accentText: 'text-emerald-700 dark:text-emerald-300',
        highlightBorder: '#48a43f',
      };
    case 'Breakdown':
      return {
        bannerBg: 'bg-rose-50 dark:bg-rose-950/40',
        bannerBorder: 'border-rose-400 dark:border-rose-600',
        badgeBg: 'bg-[#dc2626]',
        badgeText: 'text-white',
        accentText: 'text-rose-700 dark:text-rose-300',
        highlightBorder: '#dc2626',
      };
    case 'Changeover':
    case 'Waiting':
      return {
        bannerBg: 'bg-amber-50 dark:bg-amber-950/40',
        bannerBorder: 'border-amber-400 dark:border-amber-600',
        badgeBg: 'bg-[#eab308]',
        badgeText: 'text-slate-900 font-bold',
        accentText: 'text-amber-800 dark:text-amber-300',
        highlightBorder: '#eab308',
      };
    default:
      return {
        bannerBg: 'bg-slate-50 dark:bg-slate-900/60',
        bannerBorder: 'border-slate-300 dark:border-slate-700',
        badgeBg: 'bg-slate-600',
        badgeText: 'text-white',
        accentText: 'text-slate-700 dark:text-slate-300',
        highlightBorder: '#64748b',
      };
  }
};

export const PasXProgressStrip: React.FC<PasXProgressStripProps> = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Active highlighted event (defaults to the iconic Breakdown or currently running event)
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent>(SHIFT_EVENTS[4]); // Continuous Blister Sealing (Current 01:05 - 02:20)

  // Hours: 22, 23, 00, 01 (Live), 02, 03, 04, 05, 06, 07, 08
  const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'];

  const selectedTheme = getEventColorTheme(selectedEvent.type);

  // Calculate center percentage of selected segment for pointer pin
  const selectedCenterPct = Math.min(
    98,
    Math.max(2, ((selectedEvent.startHourFraction + selectedEvent.durationFraction / 2) / 10) * 100)
  );

  return (
    <div
      id="shift-progress-fullwidth-card"
      className={`p-3.5 sm:p-4 rounded-xl border shadow-sm transition-colors w-full flex flex-col justify-between ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header with Title, Status & Color Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Progress & Shift Timeline
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
            Shift 3 (22:00 - 08:00) · 21 Sep 2026 01:25:37
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#48a43f]" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#eab308]" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Changeover / Waiting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626]" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Breakdown</span>
          </div>
        </div>
      </div>

      {/* Selected Event Detail Banner - DYNAMIC THEME BASED ON SELECTED EVENT */}
      <div
        className={`my-2.5 border rounded-lg px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm transition-all duration-300 ${selectedTheme.bannerBg} ${selectedTheme.bannerBorder}`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`${selectedTheme.badgeBg} ${selectedTheme.badgeText} px-2.5 py-0.5 font-bold rounded text-[11px] uppercase tracking-wide shadow-xs`}
          >
            {selectedEvent.type} ({selectedEvent.duration})
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
            {selectedEvent.label}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border border-black/5 dark:border-white/10 font-semibold">
            {selectedEvent.startTime.split(' - ')[1] || selectedEvent.startTime} - {selectedEvent.endTime.split(' - ')[1] || selectedEvent.endTime}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
            Click segments below to inspect
          </span>
        </div>
      </div>

      {/* Full Width Multi-Segmented Timeline Bar with Pointer Pin & Selection Border */}
      <div className="mt-1 w-full relative">
        {/* Visual Pointer Arrow on top of the selected segment */}
        <div className="relative w-full h-2 pointer-events-none mb-1">
          <div
            style={{ left: `${selectedCenterPct}%` }}
            className="absolute -bottom-0.5 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-30"
          >
            <div
              className="w-0 h-0 border-x-5 border-x-transparent border-t-6 drop-shadow-md"
              style={{ borderTopColor: selectedEvent.color }}
            />
          </div>
        </div>

        {/* Multi-segmented timeline bar */}
        <div className="w-full h-8 sm:h-9 rounded-md flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner relative">
          {SHIFT_EVENTS.map((evt) => {
            const widthPct = (evt.durationFraction / 10) * 100;
            const isSelected = selectedEvent.key === evt.key;
            return (
              <button
                key={evt.key}
                type="button"
                onClick={() => setSelectedEvent(evt)}
                title={`${evt.type} (${evt.duration}): ${evt.label}`}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: evt.color,
                  boxShadow: isSelected
                    ? `0 0 0 3px #2563eb, 0 0 12px ${evt.color}`
                    : undefined,
                }}
                className={`h-full transition-all cursor-pointer border-r border-black/10 focus:outline-none relative ${
                  isSelected
                    ? 'ring-4 ring-blue-600 dark:ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 z-20 scale-y-115 -translate-y-0.5 rounded-xs brightness-110 shadow-lg'
                    : 'hover:brightness-110 hover:opacity-95'
                }`}
              >
                {/* Center pulse dot on selected segment to make active area unmistakable */}
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-white shadow-md animate-ping opacity-75" />
                    <span className="w-2 h-2 rounded-full bg-white shadow-md" />
                  </span>
                )}
              </button>
            );
          })}
          {/* Unallocated end segment */}
          <div style={{ width: '13.8%' }} className="h-full bg-slate-200 dark:bg-slate-800 rounded-r-md" title="End of shift planned" />

          {/* Live indicator line at Metadata current time 01:25:37 (34.2% across shift) */}
          <div
            className="absolute -top-1.5 bottom-0 w-0.5 bg-amber-400 z-40 shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none"
            style={{ left: '34.2%' }}
            title="Metadata Current Time: 21 Sep 2026 01:25:37"
          >
            <span className="absolute -top-4 -translate-x-1/2 bg-amber-400 text-slate-950 font-bold font-mono text-[8px] px-1 py-0.2 rounded shadow whitespace-nowrap flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-950 animate-ping" />
              LIVE 01:25
            </span>
          </div>
        </div>

        {/* Hour Tick Markers (22:00 ... 08:00) */}
        <div className="flex justify-between text-[11px] font-mono mt-2 text-slate-600 dark:text-slate-400 px-0.5">
          {hours.map((hr, idx) => {
            const isLiveHour = hr === '01:00';
            return (
              <span 
                key={idx} 
                className={`text-center transition-colors ${
                  isLiveHour 
                    ? 'text-amber-500 dark:text-amber-400 font-extrabold scale-110' 
                    : 'font-semibold'
                }`}
              >
                {hr}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
