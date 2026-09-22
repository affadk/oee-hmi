// /src/components/fullscreen/PasXProgressStrip.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { MachineConfig, CalculatedOeeMetrics } from '../../../domain/index';

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
      return { bannerBg: 'bg-emerald-50 dark:bg-[#0a211a]', bannerBorder: 'border-emerald-500/60 dark:border-[#157a55]', badgeBg: 'bg-[#22c55e]', badgeText: 'text-[#052e16]', accentText: 'text-emerald-700 dark:text-emerald-300', highlightBorder: '#22c55e' };
    case 'Breakdown':
      return { bannerBg: 'bg-rose-50 dark:bg-[#241114]', bannerBorder: 'border-rose-500/60 dark:border-[#a12335]', badgeBg: 'bg-[#ef4444]', badgeText: 'text-white', accentText: 'text-rose-700 dark:text-rose-300', highlightBorder: '#ef4444' };
    case 'Changeover':
    case 'Waiting':
      return { bannerBg: 'bg-amber-50 dark:bg-[#211a08]', bannerBorder: 'border-amber-500/60 dark:border-[#8a6d1c]', badgeBg: 'bg-[#eab308]', badgeText: 'text-[#451a03]', accentText: 'text-amber-800 dark:text-amber-300', highlightBorder: '#eab308' };
    default:
      return { bannerBg: 'bg-slate-100 dark:bg-[#131a26]', bannerBorder: 'border-slate-400/60 dark:border-slate-600', badgeBg: 'bg-slate-500', badgeText: 'text-white', accentText: 'text-slate-700 dark:text-slate-300', highlightBorder: '#64748b' };
  }
};

const parseShiftHM = (hm: string | undefined, fallbackMin: number): number => {
  if (!hm) return fallbackMin;
  const m = hm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallbackMin;
  return (parseInt(m[1], 10) % 24) * 60 + (parseInt(m[2], 10) % 60);
};

const formatHM = (totalMin: number): string => {
  const norm = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
};

export const PasXProgressStrip: React.FC<PasXProgressStripProps> = ({ machine }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Real shift window (start → end) dari konfigurasi mesin
  const shiftStartStr = machine?.jobConfig?.shiftStart ?? '22:00';
  const shiftEndStr = machine?.jobConfig?.shiftEnd ?? '08:00';
  const startMin = parseShiftHM(shiftStartStr, 22 * 60);
  const endMinRaw = parseShiftHM(shiftEndStr, 8 * 60);
  const endMin = endMinRaw <= startMin ? endMinRaw + 24 * 60 : endMinRaw;
  const windowMin = Math.max(60, endMin - startMin);
  const windowH = windowMin / 60;

  // Live clock — penanda real-time, refresh tiap detik
  const [now, setNow] = useState(() => new Date());
  const mountedRef = useRef<number | null>(null);
  if (mountedRef.current === null) mountedRef.current = Date.now();
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const nowMinOfDay = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let nowRelMin = nowMinOfDay - startMin;
  if (nowRelMin < 0) nowRelMin += 24 * 60;
  const realFrac = nowRelMin / windowMin;
  const realInside = realFrac >= 0 && realFrac <= 1;
  // Jam operasional demo: bila jam dinding di luar window shift, kursor berjalan
  // di dalam window mengikuti laju jam nyata (loop), agar penanda selalu tampil.
  const elapsedMin = Math.max(0, (now.getTime() - (mountedRef.current ?? now.getTime())) / 60000);
  const demoRelMin = (windowMin * 0.3 + elapsedMin) % windowMin;
  const useRealCursor = realInside;
  const cursorRelMin = useRealCursor ? Math.min(nowRelMin, windowMin) : demoRelMin;
  const livePct = Math.min(99, Math.max(1, (cursorRelMin / windowMin) * 100));
  const cursorClockMin = useRealCursor ? nowMinOfDay : (((startMin + demoRelMin) % 1440) + 1440) % 1440;
  const cursorSec = useRealCursor ? now.getSeconds() : Math.floor((demoRelMin * 60) % 60);
  const liveLabel = `LIVE ${formatHM(cursorClockMin)}:${String(cursorSec).padStart(2, '0')}`;
  const liveFullStamp = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${formatHM(nowMinOfDay)}:${String(now.getSeconds()).padStart(2, '0')}`;

  // Tick per jam dari start hingga end shift
  const hours: string[] = [];
  for (let m = 0; m <= windowMin + 1; m += 60) hours.push(formatHM(startMin + m));
  const liveHour = formatHM(cursorClockMin - (cursorClockMin % 60));

  const shiftNumber = shiftStartStr === '22:00' || shiftStartStr === '23:00' ? 'Shift 3' : shiftStartStr === '15:00' || shiftStartStr === '14:00' ? 'Shift 2' : 'Shift 1';

  // Segmen event dipetakan proporsional terhadap window shift (bukan 10 jam fixed)
  const segPct = (evt: TimelineEvent) => {
    const startPct = Math.min(100, Math.max(0, (evt.startHourFraction / windowH) * 100));
    const widthPct = Math.max(0, Math.min((evt.durationFraction / windowH) * 100, 100 - startPct));
    return { startPct, widthPct };
  };
  const usedPct = SHIFT_EVENTS.reduce((acc, evt) => acc + segPct(evt).widthPct, 0);
  const fillerPct = Math.max(0, 100 - usedPct);

  // Auto-follow: bila tidak ada pilihan manual, ikuti segmen pada posisi kursor realtime
  const cursorH = cursorRelMin / 60;
  const autoEvent = SHIFT_EVENTS.find(
    (evt) => cursorH >= evt.startHourFraction && cursorH < evt.startHourFraction + evt.durationFraction
  ) ?? null;
  const displayEvent = selectedEvent ?? autoEvent;
  const isAutoFollow = selectedEvent === null && autoEvent !== null;
  const displayTheme = displayEvent ? getEventColorTheme(displayEvent.type) : null;

  return (
    <div
      id="shift-progress-fullwidth-card"
      className="h-full min-h-0 w-full flex flex-col overflow-hidden bg-transparent"
    >
      {/* Header — tanpa background section, hanya judul + legenda */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pb-[0.8vh] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Progress & Shift Timeline</h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#48a43f]" /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Active</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#eab308]" /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Changeover</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#dc2626]" /><span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Breakdown</span></div>
        </div>
      </div>

      {/* Sub-header Shift — teks biasa, bukan badge; live stamp real-time */}
      <div className="shrink-0 pt-[0.6vh] flex flex-wrap items-baseline gap-x-2">
        <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{shiftNumber}</span>
        <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({shiftStartStr} - {shiftEndStr}) · {liveFullStamp}</span>
      </div>

      {/* Horizontal grid — detail dibuat kompak proporsional dengan grafik */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-[0.8vw] pt-[0.6vh] overflow-hidden items-center">
        {/* LEFT: Detail — pilihan manual, atau otomatis mengikuti segmen pada kursor realtime */}
        <div className="col-span-12 lg:col-span-4 min-h-0 flex items-center overflow-hidden self-center">
          {displayEvent && displayTheme ? (
          <div className={`border rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-200 w-full overflow-hidden ${displayTheme.bannerBg} ${displayTheme.bannerBorder}`}>
            <span className={`${displayTheme.badgeBg} ${displayTheme.badgeText} px-2.5 py-1 font-extrabold rounded-md text-xs uppercase tracking-wide shrink-0 leading-none`}>{displayEvent.type}</span>
            <div className="min-w-0 flex-1 flex flex-col gap-1 overflow-hidden">
              <span className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight truncate">{displayEvent.label}</span>
              <span className="font-mono text-xs leading-none truncate text-slate-500 dark:text-slate-400">
                {displayEvent.startTime.split(' - ')[1] || displayEvent.startTime} — {displayEvent.endTime.split(' - ')[1] || displayEvent.endTime} · {displayEvent.duration}
              </span>
            </div>
            {isAutoFollow && (
              <span className="flex items-center gap-1 shrink-0 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap" title="Mengikuti posisi waktu berjalan">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />LIVE
              </span>
            )}
          </div>
          ) : (
          <div className="rounded-lg px-3 py-2 flex items-center gap-3 w-full overflow-hidden border border-dashed border-slate-300 dark:border-slate-700">
            <span className="px-2.5 py-1 font-extrabold rounded-md text-xs uppercase tracking-wide shrink-0 leading-none bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">—</span>
            <div className="min-w-0 flex-1 flex flex-col gap-1 overflow-hidden">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[15px] leading-tight truncate">Tidak ada segmen terpilih</span>
              <span className="font-mono text-xs leading-none truncate text-slate-400 dark:text-slate-500">
                Klik segmen timeline untuk detail · {liveLabel}
              </span>
            </div>
          </div>
          )}
        </div>

        {/* RIGHT: Timeline — 8 cols, tinggi relatif vh */}
        <div className="col-span-12 lg:col-span-8 min-h-0 flex flex-col justify-center gap-[0.6vh] overflow-hidden">
          {/* Pointer lane — hanya segitiga realtime (biru).
              Segitiga select warna event dihapus agar tidak duplikat. */}
          <div className="relative w-full h-[0.8vh] min-h-[6px] shrink-0 pointer-events-none">
            <div style={{ left: `${livePct}%` }} className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 z-40">
              <div className="w-0 h-0 border-x-[0.5vw] border-x-transparent border-t-[0.7vh] border-t-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.9)]" />
            </div>
          </div>

          {/* Timeline bar — skala real window shift start → end, tinggi relatif vh */}
          <div className="w-full h-[clamp(22px,3.2vh,38px)] rounded-md flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner relative shrink-0 overflow-hidden">
            {SHIFT_EVENTS.map((evt) => {
              const { widthPct } = segPct(evt);
              const isSelected = selectedEvent?.key === evt.key;
              const isFollowed = selectedEvent === null && autoEvent?.key === evt.key;
              return (
                <button
                  key={evt.key}
                  type="button"
                  onClick={() => setSelectedEvent((prev) => (prev?.key === evt.key ? null : evt))}
                  title={`${evt.type} (${evt.duration}): ${evt.label}`}
                  style={{ width: `${widthPct}%`, backgroundColor: evt.color, boxShadow: isSelected ? `inset 0 0 0 3px ${evt.color}, inset 0 0 0 5px rgba(255,255,255,0.85), 0 0 14px ${evt.color}` : isFollowed ? `inset 0 0 0 2px ${evt.color}` : undefined }}
                  className={`h-full transition-all cursor-pointer border-r border-black/10 focus:outline-none relative shrink-0 ${isSelected ? 'z-20 brightness-110' : isFollowed ? 'brightness-105' : 'hover:brightness-110 hover:opacity-95'}`}
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
            <div style={{ width: `${fillerPct}%` }} className="h-full bg-slate-200 dark:bg-slate-800 rounded-r-md shrink-0" title="End of shift planned" />
            {/* Live marker biru — garis vertikal waktu berjalan (tanpa label).
                Berbeda dari select (border kotak + segitiga warna event):
                garis biru 3px setinggi bar, bergerak otomatis tiap detik. */}
            <div className="absolute top-0 bottom-0 -translate-x-1/2 w-[3px] bg-gradient-to-b from-sky-300 via-blue-500 to-blue-600 z-40 shadow-[0_0_10px_rgba(59,130,246,0.95)] pointer-events-none transition-all duration-1000" style={{ left: `${livePct}%` }} title={useRealCursor ? `Waktu nyata: ${liveFullStamp}` : `Jam operasional: ${liveLabel}`} />
          </div>

          {/* Hour ticks — min 11px */}
          <div className="flex justify-between text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 px-1 shrink-0">
            {hours.map((hr, idx) => {
              const isLiveHour = hr === liveHour;
              return (
                <span key={idx} className={`text-center whitespace-nowrap ${isLiveHour ? 'text-blue-600 dark:text-blue-400 font-extrabold scale-110' : 'font-semibold'}`}>{hr}</span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
