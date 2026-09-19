import React, { useState } from 'react';
import { 
  TrendingDown, 
  AlertOctagon, 
  Timer, 
  Wrench, 
  CheckSquare
} from 'lucide-react';
import { MachineConfig, CalculatedOeeMetrics } from '../types';
import { formatNumber } from '../utils/oeeMath';
import { useTheme } from '../context/ThemeContext';

interface LossAnalysisZoneProps {
  machine: MachineConfig;
  metrics: CalculatedOeeMetrics;
}

export const LossAnalysisZone: React.FC<LossAnalysisZoneProps> = ({ machine, metrics }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [lossUnitMode, setLossUnitMode] = useState<'TIME' | 'UNITS'>('TIME');

  // Total downtime sum for Pareto percentage calculation
  const totalDowntimeMinutes = machine.downtimeReasons.reduce((acc, cur) => acc + cur.durationMinutes, 0);
  const maxDowntime = Math.max(...machine.downtimeReasons.map(d => d.durationMinutes), 1);

  // Reject sum
  const totalRejectCount = machine.rejectReasons.reduce((acc, cur) => acc + cur.count, 0);
  const maxReject = Math.max(...machine.rejectReasons.map(r => r.count), 1);

  return (
    <section 
      id="loss-analysis-zone" 
      className={`rounded-xl border p-4 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b gap-2 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div>
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <TrendingDown className="w-4 h-4 text-rose-500" />
            Loss Analysis & Root-Cause Decomposition (Six Big Losses)
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Uncovers why OEE dropped: Availability downtime, speed reduction, or defect scrap
          </p>
        </div>

        {/* Loss Unit Toggle: Time (min) vs Units (pcs) */}
        <div className={`flex items-center gap-1.5 p-1 rounded-lg border text-xs ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <span className={`text-[11px] px-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Display Loss as:</span>
          <button
            id="btn-loss-unit-time"
            onClick={() => setLossUnitMode('TIME')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              lossUnitMode === 'TIME'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Time (Minutes)
          </button>
          <button
            id="btn-loss-unit-pcs"
            onClick={() => setLossUnitMode('UNITS')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              lossUnitMode === 'UNITS'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Output Units (Pieces)
          </button>
        </div>
      </div>

      {/* Top 3 Summary Pillars of Loss */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Pillar 1: Downtime Loss (Availability) */}
        <div className={`border rounded-xl p-3.5 flex flex-col justify-between ${
          isDark ? 'bg-slate-800/50 border-slate-700/70' : 'bg-rose-50/40 border-rose-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-rose-300' : 'text-rose-800'
              }`}>
                <Timer className="w-3.5 h-3.5 text-rose-500" />
                1. Downtime Loss (Availability)
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                isDark 
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800' 
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                Avail: {metrics.availabilityPct}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                {lossUnitMode === 'TIME' ? `${metrics.downtimeMin} min` : `${formatNumber(metrics.availabilityLossPcs)} pcs`}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lossUnitMode === 'TIME' ? `(~${metrics.availabilityLossPcs} pcs equiv)` : `(~${metrics.downtimeMin} min loss)`}
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Equipment stops, tool changes & material wait</p>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-xs ${
            isDark ? 'border-slate-700/60 text-slate-300' : 'border-rose-200 text-slate-700'
          }`}>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span>Top Reason:</span>
              <strong className={isDark ? 'text-rose-300' : 'text-rose-800'}>{machine.downtimeReasons[0]?.label || 'Breakdown'}</strong>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/80' : 'bg-rose-200'}`}>
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Performance Loss (Speed & Small Stops) */}
        <div className={`border rounded-xl p-3.5 flex flex-col justify-between ${
          isDark ? 'bg-slate-800/50 border-slate-700/70' : 'bg-amber-50/40 border-amber-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-amber-800'
              }`}>
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                2. Performance Loss (Speed)
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                isDark 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800' 
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                Perf: {metrics.performancePct}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {lossUnitMode === 'TIME' ? `${metrics.performanceLossMin} min` : `${formatNumber(metrics.performanceLossPcs)} pcs`}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lossUnitMode === 'TIME' ? `(~${metrics.performanceLossPcs} pcs lost)` : `(~${metrics.performanceLossMin} min equiv)`}
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Slow cycles, idling & minor stoppages (&lt;5 min)</p>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-xs ${
            isDark ? 'border-slate-700/60 text-slate-300' : 'border-amber-200 text-slate-700'
          }`}>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span>Cycle Gap:</span>
              <strong className={isDark ? 'text-amber-300' : 'text-amber-800'}>{(machine.actualCycleTimeSec - machine.idealCycleTimeSec).toFixed(1)}s per stroke</strong>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/80' : 'bg-amber-200'}`}>
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Quality Loss (Defects & Scrap) */}
        <div className={`border rounded-xl p-3.5 flex flex-col justify-between ${
          isDark ? 'bg-slate-800/50 border-slate-700/70' : 'bg-purple-50/40 border-purple-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-purple-300' : 'text-purple-800'
              }`}>
                <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                3. Quality Loss (Defects)
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                isDark 
                  ? 'bg-purple-950/80 text-purple-300 border-purple-800' 
                  : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}>
                Qual: {metrics.qualityPct}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                {lossUnitMode === 'UNITS' ? `${machine.rejectCount} pcs` : `${Math.round((machine.rejectCount * machine.idealCycleTimeSec) / 60)} min`}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lossUnitMode === 'UNITS' ? `(~${Math.round((machine.rejectCount * machine.idealCycleTimeSec) / 60)} min lost)` : `(${machine.rejectCount} pcs defect)`}
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Startup rejects, dimensional scrap & rework</p>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-xs ${
            isDark ? 'border-slate-700/60 text-slate-300' : 'border-purple-200 text-slate-700'
          }`}>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span>Top Defect:</span>
              <strong className={isDark ? 'text-purple-300' : 'text-purple-800'}>{machine.rejectReasons[0]?.label.split('/')[0] || 'Dimension'}</strong>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/80' : 'bg-purple-200'}`}>
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Pareto Analysis: Downtime Reasons vs Reject Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Downtime Reason Pareto (7 Cols) */}
        <div className={`lg:col-span-7 rounded-lg p-3 border ${
          isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              Downtime Reason Pareto (Largest Time Losses)
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total: {totalDowntimeMinutes} min
            </span>
          </div>

          <div className="space-y-2 mt-2">
            {machine.downtimeReasons.map((item, idx) => {
              const pctOfMax = (item.durationMinutes / maxDowntime) * 100;
              const pctOfTotal = totalDowntimeMinutes > 0 ? ((item.durationMinutes / totalDowntimeMinutes) * 100).toFixed(1) : 0;
              return (
                <div key={item.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
                        isDark 
                          ? 'bg-slate-800 text-slate-400 border-slate-700' 
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <strong className={isDark ? 'text-rose-400' : 'text-rose-700'}>
                        {lossUnitMode === 'TIME' ? `${item.durationMinutes} min` : `${item.equivalentLossPcs} pcs`}
                      </strong>
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({pctOfTotal}%)</span>
                    </div>
                  </div>
                  {/* Pareto Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div 
                      className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality Defect Reason Breakdown (5 Cols) */}
        <div className={`lg:col-span-5 rounded-lg p-3 border ${
          isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
              Reject & Scrap Breakdown
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Defect: {totalRejectCount} pcs
            </span>
          </div>

          <div className="space-y-2 mt-2">
            {machine.rejectReasons.map((item, idx) => {
              const pctOfMax = (item.count / maxReject) * 100;
              return (
                <div key={item.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
                        isDark 
                          ? 'bg-slate-800 text-slate-400 border-slate-700' 
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-medium truncate max-w-[170px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <strong className={isDark ? 'text-purple-400' : 'text-purple-700'}>{item.count} pcs</strong>
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({item.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
