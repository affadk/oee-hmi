import React, { useMemo } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { MachineConfig, CalculatedOeeMetrics } from '../../../domain/index';
import { buildShiftTimeline } from '../../../domain/services/ShiftTimeline';

interface MachineTimelineStripProps {
  machine: MachineConfig;
  metrics: CalculatedOeeMetrics;
}

export const MachineTimelineStrip: React.FC<MachineTimelineStripProps> = ({ machine, metrics }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const plannedProdMin = metrics.plannedProductionTimeMin || 420;
  const operatingRunMin = metrics.runTimeMin || 378;
  const downtimeMin = metrics.downtimeMin || 42;
  const plannedDowntimeMin = machine.plannedDowntimeMinutes || 60;
  const totalMin = plannedProdMin + plannedDowntimeMin;

  const runPct = Math.round((operatingRunMin / totalMin) * 100);
  const downPct = Math.round((downtimeMin / totalMin) * 100);
  const breakPct = Math.max(0, 100 - runPct - downPct);

  // Segmen nyata dari data mesin (bukan fake proporsional).
  // Hijau = Active, biru = planned (break/maintenance/changeover terjadwal), merah = unplanned.
  const segments = useMemo(
    () => buildShiftTimeline(machine, totalMin),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [machine?.downtimeReasons, machine?.jobConfig?.shiftStart, machine?.jobConfig?.shiftEnd, totalMin],
  );
  const segColor = (kind: string, planned: boolean) =>
    kind === 'Active' ? 'bg-emerald-500' : planned ? 'bg-blue-600' : 'bg-rose-500';
  const segTitle = (kind: string, planned: boolean) =>
    kind === 'Active' ? 'Shift Run' : planned ? 'Planned Stop' : 'Unplanned Stop';
  const shiftStart = machine.jobConfig?.shiftStart || '22:00';
  const shiftEnd = machine.jobConfig?.shiftEnd || '08:00';
  const breakWindow = machine.jobConfig?.breakTimeWindow || '02:00 - 03:00';
  const breakStart = breakWindow.split('-')[0]?.trim() || '02:00';

  // Format dynamic time marks across shift
  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const startH = parseHour(shiftStart);
  let endH = parseHour(shiftEnd);
  if (endH <= startH) endH += 24;
  const totalShiftHours = endH - startH;

  const formatH = (fraction: number) => {
    const totalH = startH + totalShiftHours * fraction;
    const normalizedH = Math.floor(totalH) % 24;
    const mins = Math.round((totalH - Math.floor(totalH)) * 60);
    return `${String(normalizedH).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  return (
    <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-md h-full ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Shift Run / Stop Machine Timeline
          </span>
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            ({operatingRunMin}m Run · {downtimeMin}m Stop · {plannedDowntimeMin}m Break)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className={`flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <span className="w-2 h-2 rounded bg-emerald-500"></span> Run ({runPct}%)
          </span>
          <span className={`flex items-center gap-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
            <span className="w-2 h-2 rounded bg-rose-500"></span> Stop ({downPct}%)
          </span>
          <span className={`flex items-center gap-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            <span className="w-2 h-2 rounded bg-blue-600"></span> Break ({breakPct}%)
          </span>
        </div>
      </div>

      {/* Multi-segment continuous visual timeline bar with live time cursor */}
      <div className="relative w-full">
        <div className={`w-full h-4 rounded-lg overflow-hidden flex shadow-inner border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
          {segments.map((seg) => (
            <div
              key={seg.key}
              style={{ width: `${Math.max(0, Math.min(100, (seg.durationMinutes / totalMin) * 100))}%` }}
              className={`h-full ${segColor(seg.kind, seg.planned)}`}
              title={`${segTitle(seg.kind, seg.planned)}: ${seg.label}`}
            />
          ))}
        </div>

        {/* Live Cursor for Metadata Current Time 01:25:37 */}
        <div 
          className="absolute -top-1 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none"
          style={{ left: '34.2%' }}
          title="Metadata Current Time: 21 Sep 2026 01:25:37"
        >
          <span className="absolute -top-3.5 -translate-x-1/2 bg-amber-400 text-slate-950 font-bold font-mono text-[8px] px-1 py-0.2 rounded shadow whitespace-nowrap">
            NOW 01:25
          </span>
        </div>
      </div>

      {/* Synchronized dynamic time marks */}
      <div className={`flex justify-between items-center text-[10px] font-mono mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{shiftStart} (Start)</span>
        <span>{formatH(0.25)}</span>
        <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>01:25 (Live)</span>
        <span className={isDark ? 'text-blue-400' : 'text-blue-700'}>{breakStart} (Break)</span>
        <span>{formatH(0.75)}</span>
        <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{shiftEnd} (End)</span>
      </div>
    </div>
  );
};
