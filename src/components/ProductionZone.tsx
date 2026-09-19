import React from 'react';
import { 
  Boxes, 
  CheckCircle2, 
  XCircle, 
  Target, 
  TrendingUp, 
  Clock3 
} from 'lucide-react';
import { CalculatedOeeMetrics, MachineConfig } from '../types';
import { formatNumber } from '../utils/oeeMath';
import { useTheme } from '../context/ThemeContext';

interface ProductionZoneProps {
  metrics: CalculatedOeeMetrics;
  machine: MachineConfig;
}

export const ProductionZone: React.FC<ProductionZoneProps> = ({ metrics, machine }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const goodRatio = machine.totalCount > 0 ? (machine.goodCount / machine.totalCount) * 100 : 0;
  const rejectRatio = machine.totalCount > 0 ? (machine.rejectCount / machine.totalCount) * 100 : 0;

  // Speed delta
  const cycleTimeDelta = Number((machine.actualCycleTimeSec - machine.idealCycleTimeSec).toFixed(1));

  return (
    <section 
      id="production-kpi-zone" 
      className={`rounded-xl border p-4 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Boxes className="w-4 h-4 text-blue-500" />
          Production Output & Speed Performance
        </h2>
        <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Product: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{machine.currentProduct.split(' ')[0]}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Target */}
        <div className={`rounded-lg p-3 border ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Target className="w-3.5 h-3.5 text-blue-500" />
            <span>Target Plan</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatNumber(machine.targetCount)}
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Shift scheduled quota</div>
        </div>

        {/* 2. Actual Total Count */}
        <div className={`rounded-lg p-3 border ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Boxes className={`w-3.5 h-3.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
            <span>Actual Total</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {formatNumber(machine.totalCount)}
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total stroke counter</div>
        </div>

        {/* 3. Good Count */}
        <div className={`rounded-lg p-3 border ${
          isDark 
            ? 'bg-emerald-950/20 border-emerald-500/20' 
            : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Good Output</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {formatNumber(machine.goodCount)}
            </span>
            <span className={`text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>pcs</span>
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
            {goodRatio.toFixed(1)}% of total
          </div>
        </div>

        {/* 4. Reject Count */}
        <div className={`rounded-lg p-3 border ${
          isDark 
            ? 'bg-rose-950/20 border-rose-500/20' 
            : 'bg-rose-50/80 border-rose-200'
        }`}>
          <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Reject / Defect</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
              {formatNumber(machine.rejectCount)}
            </span>
            <span className={`text-xs ${isDark ? 'text-rose-400/70' : 'text-rose-600'}`}>pcs</span>
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-rose-400/80' : 'text-rose-700'}`}>
            {rejectRatio.toFixed(1)}% reject rate
          </div>
        </div>

        {/* 5. Achievement % */}
        <div className={`rounded-lg p-3 border ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Achievement</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {metrics.achievementPct}%
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, metrics.achievementPct)}%` }}
            />
          </div>
        </div>

        {/* 6. Cycle Time & Speed Metric */}
        <div className={`rounded-lg p-3 border ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Clock3 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Cycle Time</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-xl font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              {machine.actualCycleTimeSec}s
            </span>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ ideal {machine.idealCycleTimeSec}s</span>
          </div>
          <div className={`text-[10px] mt-1 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Rate: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{machine.actualHourlyRate}/h</strong></span>
            <span className={
              cycleTimeDelta <= 0 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold' 
                : isDark ? 'text-rose-400 font-semibold' : 'text-rose-700 font-semibold'
            }>
              {cycleTimeDelta > 0 ? `+${cycleTimeDelta}s` : `${cycleTimeDelta}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Production Ratio Bar: Good vs Reject */}
      <div className={`mt-3 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className={`flex items-center gap-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            Good Output ({formatNumber(machine.goodCount)} pcs)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            Reject Output ({formatNumber(machine.rejectCount)} pcs)
          </span>
        </div>

        <div className="w-full sm:w-80 flex items-center gap-2">
          <div className={`h-2 w-full rounded-full overflow-hidden flex ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${goodRatio}%` }}
              title={`Good: ${goodRatio.toFixed(1)}%`}
            />
            <div 
              className="bg-rose-500 h-full transition-all duration-500" 
              style={{ width: `${rejectRatio}%` }}
              title={`Reject: ${rejectRatio.toFixed(1)}%`}
            />
          </div>
          <span className={`font-mono text-[11px] whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
            Yield {goodRatio.toFixed(1)}%
          </span>
        </div>
      </div>
    </section>
  );
};
