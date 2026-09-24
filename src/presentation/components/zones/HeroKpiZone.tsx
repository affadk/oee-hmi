// /src/components/HeroKpiZone.tsx — mengikuti style OEE Shift Overview
// Kartu #0f1b2e / white, gauge PasXDonutGauge, progress #48a43f + rose-600

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { CalculatedOeeMetrics, MachineConfig } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';
import { PasXDonutGauge } from '../charts/PasXDonutGauge';

interface HeroKpiZoneProps {
  metrics: CalculatedOeeMetrics;
  machine: MachineConfig;
  teepEnabled: boolean;
  onOpenFormula: (metricName: string) => void;
}

export const HeroKpiZone: React.FC<HeroKpiZoneProps> = ({
  metrics,
  machine,
  teepEnabled,
  onOpenFormula,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getGaugeColor = (val: number, target: number) => {
    if (val >= target) return '#10b981';
    if (val >= target - 5) return '#f59e0b';
    return '#f43f5e';
  };

  const oeeValue = metrics.oeePct ?? 0;
  const availValue = metrics.availabilityPct ?? 0;
  const perfValue = metrics.performancePct ?? 0;
  const qualValue = metrics.qualityPct ?? 0;

  const oeeGaugeColor = getGaugeColor(oeeValue, machine.targetOee ?? 0);
  const availGaugeColor = getGaugeColor(availValue, machine.targetAvailability ?? 0);
  const perfGaugeColor = getGaugeColor(perfValue, machine.targetPerformance ?? 0);
  const qualGaugeColor = getGaugeColor(qualValue, machine.targetQuality ?? 0);

  const totalCount = machine.telemetry?.tot ?? machine.totalCount ?? 0;
  const rejectCount = machine.telemetry?.rej ?? machine.rejectCount ?? 0;
  const goodCount = Math.max(0, totalCount - rejectCount);
  const runTimeMin = machine.telemetry?.run ? Math.round(machine.telemetry.run / 60) : (metrics.runTimeMin || 0);
  const plannedTimeMin = metrics.plannedProductionTimeMin || 1;
  const downtimeMin = machine.telemetry?.dt ? Math.round(machine.telemetry.dt / 60) : (metrics.downtimeMin || 0);
  const targetCycleTimeSec = machine.idealCycleTimeSec || 0;
  const currentRate = machine.actualHourlyRate || 0;
  const theoreticalHourlyOutput = targetCycleTimeSec > 0 ? Math.round(3600 / targetCycleTimeSec) : 0;
  const actualCycleTimeSec = currentRate > 0 ? (3600 / currentRate).toFixed(1) : '0.0';

  const targetPcs = machine.jobConfig?.targetQuantity ?? machine.targetCount ?? 0;
  const actualPcs = totalCount;
  const rejectPcs = rejectCount;
  const goodPcs = goodCount;

  return (
    <section
      id="hero-kpi-zone"
      className={`min-w-0 max-w-full p-[clamp(8px,1vh,14px)] rounded-xl border shadow-sm transition-colors ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-[0.8vw] pb-[1vh] border-b border-slate-200 dark:border-slate-800 mb-[0.6vh]">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={`text-base sm:text-[15px] font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Key performance indicators
          </h2>
          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs leading-none font-medium ${
            isDark ? 'bg-slate-800/70 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Target</span>
            <span className={`w-px h-3 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>−5%</span>
            <span className={`w-px h-3 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Kritis</span>
          </span>
          {teepEnabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30">
              TEEP: {metrics.teepPct}% · Util: {metrics.calendarUtilizationPct}%
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenFormula('OEE')}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
        >
          <HelpCircle className="w-4 h-4" />
          Formula Help
        </button>
      </div>

      {/* Gauges Row */}
      <div className="flex flex-wrap items-stretch justify-around gap-[0.8vw] min-w-0 py-[0.6vh] overflow-hidden">
        <div className="min-h-[190px] flex">
          <PasXDonutGauge label="OEE" value={oeeValue} size="large" color={oeeGaugeColor} onClick={() => onOpenFormula('OEE')} />
        </div>
        <div className="flex items-stretch justify-center gap-4 sm:gap-8 flex-wrap min-w-0">
          <div className="min-h-[190px] flex">
            <PasXDonutGauge
              label="AVA"
              value={availValue}
              size="medium"
              color={availGaugeColor}
              rawLines={[`run: ${runTimeMin}m`, `plan: ${plannedTimeMin}m`, `dt: ${downtimeMin}m`]}
              onClick={() => onOpenFormula('Availability')}
            />
          </div>
          <div className="min-h-[190px] flex">
            <PasXDonutGauge
              label="PER"
              value={perfValue}
              size="medium"
              color={perfGaugeColor}
              rawLines={[`act: ${currentRate} pcs/h`, `tgt: ${theoreticalHourlyOutput} pcs/h`, `cyc: ${actualCycleTimeSec}s`]}
              onClick={() => onOpenFormula('Performance')}
            />
          </div>
          <div className="min-h-[190px] flex">
            <PasXDonutGauge
              label="QUA"
              value={qualValue}
              size="medium"
              color={qualGaugeColor}
              rawLines={[`good: ${goodPcs.toLocaleString()} pcs`, `tot: ${actualPcs.toLocaleString()} pcs`, `rej: ${rejectPcs.toLocaleString()} pcs`]}
              onClick={() => onOpenFormula('Quality')}
            />
          </div>
        </div>
        {/* Gap badges — gaya shift: mono kecil */}
        <div className="w-full flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
          {[
            { label: 'OEE', gap: metrics.oeeGap, target: machine.targetOee },
            { label: 'AVA', gap: metrics.availabilityGap, target: machine.targetAvailability },
            { label: 'PER', gap: metrics.performanceGap, target: machine.targetPerformance },
            { label: 'QUA', gap: metrics.qualityGap, target: machine.targetQuality },
          ].map((g) => (
            <span key={g.label} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="font-bold">{g.label}</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>tgt {g.target}%</span>
              <strong className={g.gap >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {g.gap >= 0 ? `+${g.gap}%` : `${g.gap}%`}
              </strong>
            </span>
          ))}
          <span className={`ml-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>World Class Target: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>85.0%</strong></span>
        </div>
      </div>

      {/* Progress Bar + Angka ala Shift Overview */}
      <div className="mt-auto pt-[1vh] border-t border-slate-200 dark:border-slate-800 space-y-[0.8vh]">
        <div className="w-full flex items-center gap-2.5">
          <div className="flex-1 h-[14px] rounded-md overflow-hidden flex bg-slate-300 dark:bg-slate-800 border border-slate-400/40 dark:border-transparent shadow-inner relative">
            <div
              style={{ width: `${targetPcs > 0 ? Math.min(100, (goodPcs / targetPcs) * 100) : 0}%` }}
              className="h-full bg-[#48a43f] transition-all duration-700 ease-out"
              title={`Good: ${goodPcs.toLocaleString()} pcs`}
            />
            <div
              style={{ width: `${targetPcs > 0 ? Math.min(100, (rejectPcs / targetPcs) * 100) : 0}%` }}
              className="h-full bg-rose-600 transition-all duration-700 ease-out"
              title={`Reject: ${rejectPcs.toLocaleString()} pcs`}
            />
          </div>
          <span className={`audit-display font-mono font-black tabular-nums leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {targetPcs > 0 ? Math.round((actualPcs / targetPcs) * 100) : 0}%
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-[0.8vw]">
          <div className="flex items-baseline gap-2">
            <span className={`audit-display font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{actualPcs.toLocaleString()}</span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Actual</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xs font-sans font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Good:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 audit-display font-black">{goodPcs.toLocaleString()}</strong>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xs font-sans font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reject:</span>
              <strong className="text-rose-600 dark:text-rose-400 audit-display font-black">{rejectPcs.toLocaleString()}</strong>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`audit-display font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{targetPcs.toLocaleString()}</span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Target</span>
          </div>
        </div>
      </div>
    </section>
  );
};
