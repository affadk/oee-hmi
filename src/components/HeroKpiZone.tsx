import React from 'react';
import { 
  Gauge, 
  Timer, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info,
  Award
} from 'lucide-react';
import { CalculatedOeeMetrics, MachineConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

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

  const getStatusColor = (val: number, target: number) => {
    if (val >= target) {
      return {
        text: isDark ? 'text-emerald-400' : 'text-emerald-700',
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50/80',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-300',
        stroke: '#10b981',
      };
    }
    if (val >= target - 5) {
      return {
        text: isDark ? 'text-amber-400' : 'text-amber-700',
        bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50/80',
        border: isDark ? 'border-amber-500/30' : 'border-amber-300',
        stroke: '#f59e0b',
      };
    }
    return {
      text: isDark ? 'text-rose-400' : 'text-rose-700',
      bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50/80',
      border: isDark ? 'border-rose-500/30' : 'border-rose-300',
      stroke: '#f43f5e',
    };
  };

  const oeeColor = getStatusColor(metrics.oeePct, machine.targetOee);
  const availColor = getStatusColor(metrics.availabilityPct, machine.targetAvailability);
  const perfColor = getStatusColor(metrics.performancePct, machine.targetPerformance);
  const qualColor = getStatusColor(metrics.qualityPct, machine.targetQuality);

  // Calculation parameters for AVA, QUA, and PER
  const totalCount = machine.telemetry?.tot ?? machine.totalCount;
  const rejectCount = machine.telemetry?.rej ?? machine.rejectCount;
  const goodCount = Math.max(0, totalCount - rejectCount);
  const runTimeMin = machine.telemetry?.run ? Math.round(machine.telemetry.run / 60) : metrics.runTimeMin;
  const plannedTimeMin = metrics.plannedProductionTimeMin;
  const downtimeMin = machine.telemetry?.dt ? Math.round(machine.telemetry.dt / 60) : metrics.downtimeMin;
  const runTimeSec = machine.telemetry?.run ?? (runTimeMin * 60);
  const targetCycleTimeSec = machine.idealCycleTimeSec || 9.0;
  const currentRate = machine.actualHourlyRate || 203;
  const theoreticalHourlyOutput = targetCycleTimeSec > 0 ? Math.round(3600 / targetCycleTimeSec) : 400;
  const actualCycleTimeSec = currentRate > 0 ? (3600 / currentRate).toFixed(1) : (targetCycleTimeSec * 1.97).toFixed(1);

  // SVG mini gauge renderer — ukuran relatif terhadap tinggi section container
  const renderGauge = (pct: number, colorStroke: string, rawLines?: string[], size = 148) => {
    const radius = (size - 20) / 2 - 4;
    const strokeWidth = Math.max(10, Math.round(size * 0.07));
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(100, Math.max(0, pct));
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const valueFont = size >= 170 ? 'text-2xl' : 'text-xl';

    return (
      <div className="flex flex-col items-center justify-center shrink-0 h-full">
        <div className="relative flex items-center justify-center w-auto h-full aspect-square" style={{ width: size, height: size, maxWidth: '100%' }}>
          <svg width={size} height={size} className="-rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colorStroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className={`absolute font-mono font-bold ${valueFont} leading-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {pct.toFixed(1)}%
          </span>
        </div>
        {rawLines && rawLines.length > 0 && (
          <div className="flex flex-col items-center mt-2 space-y-0.5 font-mono text-[11px] leading-[1.35] text-center">
            {rawLines.map((line, idx) => {
              const colonIndex = line.indexOf(':');
              if (colonIndex !== -1) {
                const key = line.slice(0, colonIndex).trim();
                const val = line.slice(colonIndex + 1).trim();
                return (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-400 uppercase tracking-wide">
                      {key}:
                    </span>
                    <span className={`font-semibold text-xs ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      {val}
                    </span>
                  </div>
                );
              }
              return (
                <span key={idx} className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>
                  {line}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <section 
      id="hero-kpi-zone" 
      className={`rounded-xl border p-4 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between pb-3 mb-3 border-b gap-3 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <Gauge className="w-4 h-4 text-blue-500" />
            Core OEE & Primary Components
          </h2>
          <span className={`hidden lg:inline text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            A × P × Q
          </span>
          {/* Keterangan warna — simplify, di header, fokus */}
          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] leading-none ${
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
        </div>

        {/* Global OEE Benchmark Badge & TEEP */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>World Class Target: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>85.0%</strong></span>
          </div>

          {teepEnabled && (
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded border ${
              isDark 
                ? 'bg-purple-950/70 border-purple-800/80 text-purple-300' 
                : 'bg-purple-50 border-purple-200 text-purple-800'
            }`}>
              <span>TEEP: <strong className={`font-mono ${isDark ? 'text-purple-100' : 'text-purple-950'}`}>{metrics.teepPct}%</strong></span>
              <span className={`text-[10px] ${isDark ? 'text-purple-400/80' : 'text-purple-600'}`}>Util: {metrics.calendarUtilizationPct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 4 Hero KPIs — proporsional: gap & padding diselaraskan, kartu tinggi konsisten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. OEE Card — tanpa rincian a/p/q, circle diperbesar relatif terhadap tinggi section */}
        <div 
          id="kpi-card-oee"
          className={`relative p-3.5 rounded-xl border ${oeeColor.border} ${oeeColor.bg} flex flex-col justify-between min-h-[228px] transition-all hover:shadow-md group`}
        >
          <div className="flex items-center justify-between gap-3 flex-1 min-h-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Overall OEE</span>
                <button
                  onClick={() => onOpenFormula('OEE')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Formula: Availability × Performance × Quality"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Overall Equipment Effectiveness</p>
            </div>
            {renderGauge(metrics.oeePct, oeeColor.stroke, undefined, 196)}
          </div>

          <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/60' : 'border-slate-200'
          }`}>
            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Target: <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.targetOee}%</span>
            </div>
            <div className={`flex items-center gap-0.5 font-mono font-semibold ${
              metrics.oeeGap >= 0 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700' 
                : isDark ? 'text-rose-400' : 'text-rose-700'
            }`}>
              {metrics.oeeGap >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{metrics.oeeGap >= 0 ? `+${metrics.oeeGap}%` : `${metrics.oeeGap}%`}</span>
            </div>
          </div>
        </div>

        {/* 2. Availability Card */}
        <div 
          id="kpi-card-availability"
          className={`relative p-3.5 rounded-xl border ${availColor.border} ${availColor.bg} flex flex-col justify-between min-h-[158px] transition-all hover:shadow-md group`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-500 shrink-0" />
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Availability</span>
                <button
                  onClick={() => onOpenFormula('Availability')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Formula: Run Time / Planned Production Time"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operating time efficiency</p>
            </div>
            {renderGauge(metrics.availabilityPct, availColor.stroke, [
              `run: ${runTimeMin}m`,
              `plan: ${plannedTimeMin}m`,
              `dt: ${downtimeMin}m`,
            ])}
          </div>

          <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/60' : 'border-slate-200'
          }`}>
            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Target: <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.targetAvailability}%</span>
            </div>
            <div className={`flex items-center gap-0.5 font-mono font-semibold ${
              metrics.availabilityGap >= 0 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700' 
                : isDark ? 'text-rose-400' : 'text-rose-700'
            }`}>
              {metrics.availabilityGap >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{metrics.availabilityGap >= 0 ? `+${metrics.availabilityGap}%` : `${metrics.availabilityGap}%`}</span>
            </div>
          </div>
        </div>

        {/* 3. Performance Card — A × P × Q urutan benar */}
        <div 
          id="kpi-card-performance"
          className={`relative p-3.5 rounded-xl border ${perfColor.border} ${perfColor.bg} flex flex-col justify-between min-h-[158px] transition-all hover:shadow-md group`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Performance</span>
                <button
                  onClick={() => onOpenFormula('Performance')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Formula: (Ideal Cycle Time × Total Count) / Run Time"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Operating speed vs ideal</p>
            </div>
            {renderGauge(metrics.performancePct, perfColor.stroke, [
              `act: ${currentRate} pcs/h`,
              `tgt: ${theoreticalHourlyOutput} pcs/h`,
              `cyc: ${actualCycleTimeSec}s`,
            ])}
          </div>

          <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/60' : 'border-slate-200'
          }`}>
            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Target: <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.targetPerformance}%</span>
            </div>
            <div className={`flex items-center gap-0.5 font-mono font-semibold ${
              metrics.performanceGap >= 0 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700' 
                : isDark ? 'text-rose-400' : 'text-rose-700'
            }`}>
              {metrics.performanceGap >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{metrics.performanceGap >= 0 ? `+${metrics.performanceGap}%` : `${metrics.performanceGap}%`}</span>
            </div>
          </div>
        </div>

        {/* 4. Quality Card — A × P × Q urutan benar */}
        <div 
          id="kpi-card-quality"
          className={`relative p-3.5 rounded-xl border ${qualColor.border} ${qualColor.bg} flex flex-col justify-between min-h-[158px] transition-all hover:shadow-md group`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Quality</span>
                <button
                  onClick={() => onOpenFormula('Quality')}
                  className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Formula: Good Count / Total Count"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Good output proportion</p>
            </div>
            {renderGauge(metrics.qualityPct, qualColor.stroke, [
              `good: ${goodCount.toLocaleString()} pcs`,
              `tot: ${totalCount.toLocaleString()} pcs`,
              `rej: ${rejectCount.toLocaleString()} pcs`,
            ])}
          </div>

          <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800/60' : 'border-slate-200'
          }`}>
            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Target: <span className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.targetQuality}%</span>
            </div>
            <div className={`flex items-center gap-0.5 font-mono font-semibold ${
              metrics.qualityGap >= 0 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700' 
                : isDark ? 'text-rose-400' : 'text-rose-700'
            }`}>
              {metrics.qualityGap >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{metrics.qualityGap >= 0 ? `+${metrics.qualityGap}%` : `${metrics.qualityGap}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
