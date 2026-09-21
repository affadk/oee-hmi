import React, { useState } from 'react';
import { 
  TrendingDown, 
  AlertOctagon, 
  Timer, 
  Wrench, 
  CheckSquare,
  Filter,
  Info
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
  const [downtimeFilter, setDowntimeFilter] = useState<'ALL' | 'UNPLANNED' | 'PLANNED'>('ALL');

  const downtimeReasons = machine.downtimeReasons || [];
  const rejectReasons = machine.rejectReasons || [];

  // Categorize downtime items
  const unplannedItems = downtimeReasons.filter(d => d.type !== 'PLANNED' && d.category !== 'Planned');
  const plannedItems = downtimeReasons.filter(d => d.type === 'PLANNED' || d.category === 'Planned');

  const totalUnplannedMin = unplannedItems.reduce((acc, cur) => acc + cur.durationMinutes, 0);
  const totalPlannedMin = plannedItems.reduce((acc, cur) => acc + cur.durationMinutes, 0);

  // Filtered reasons based on tab
  const filteredDowntimeReasons = downtimeReasons.filter(item => {
    const isItemPlanned = item.type === 'PLANNED' || item.category === 'Planned';
    if (downtimeFilter === 'UNPLANNED') return !isItemPlanned;
    if (downtimeFilter === 'PLANNED') return isItemPlanned;
    return true;
  });

  // Total downtime sum for Pareto percentage calculation based on current filter
  const totalDowntimeMinutes = filteredDowntimeReasons.reduce((acc, cur) => acc + cur.durationMinutes, 0);
  const maxDowntime = Math.max(...filteredDowntimeReasons.map(d => d.durationMinutes), 1);

  // Reject sum
  const totalRejectCount = rejectReasons.reduce((acc, cur) => acc + cur.count, 0);
  const maxReject = Math.max(...rejectReasons.map(r => r.count), 1);

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

      {/* OEE Loss Waterfall Bridge Banner */}
      <div className={`mb-4 p-3.5 rounded-xl border ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              OEE Waterfall Loss Bridge (From 100% Potential to Actual OEE)
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Efficiency Loss: <strong className="text-rose-400 font-bold">-{(100 - metrics.oeePct).toFixed(1)}%</strong>
          </span>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {/* Step 1: 100% Ideal */}
          <div className={`p-2 rounded-lg border text-center ${
            isDark ? 'bg-blue-950/30 border-blue-800/60' : 'bg-blue-50 border-blue-200'
          }`}>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">1. Potensi Ideal</span>
            <strong className="text-sm sm:text-base font-mono font-bold text-blue-400 block">100.0%</strong>
            <span className="text-[9px] text-slate-400 block truncate">Planned Time</span>
          </div>

          {/* Step 2: Availability Loss */}
          <div className={`p-2 rounded-lg border text-center ${
            isDark ? 'bg-rose-950/30 border-rose-800/60' : 'bg-rose-50 border-rose-200'
          }`}>
            <span className="text-[10px] text-rose-400 uppercase font-semibold block">Downtime</span>
            <strong className="text-sm sm:text-base font-mono font-bold text-rose-400 block">
              -{(100 - metrics.availabilityPct).toFixed(1)}%
            </strong>
            <span className="text-[9px] text-slate-400 block truncate">
              {lossUnitMode === 'TIME' ? `${metrics.downtimeMin}m stop` : `~${metrics.availabilityLossPcs} pcs`}
            </span>
          </div>

          {/* Step 3: Performance Loss */}
          <div className={`p-2 rounded-lg border text-center ${
            isDark ? 'bg-orange-950/30 border-orange-800/60' : 'bg-orange-50 border-orange-200'
          }`}>
            <span className="text-[10px] text-orange-400 uppercase font-semibold block">Speed Loss</span>
            <strong className="text-sm sm:text-base font-mono font-bold text-orange-400 block">
              -{(100 - metrics.performancePct).toFixed(1)}%
            </strong>
            <span className="text-[9px] text-slate-400 block truncate">
              {lossUnitMode === 'TIME' ? `${metrics.performanceLossMin}m slow` : `~${metrics.performanceLossPcs} pcs`}
            </span>
          </div>

          {/* Step 4: Quality Loss */}
          <div className={`p-2 rounded-lg border text-center ${
            isDark ? 'bg-amber-950/30 border-amber-800/60' : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">Defect Scrap</span>
            <strong className="text-sm sm:text-base font-mono font-bold text-amber-400 block">
              -{(100 - metrics.qualityPct).toFixed(1)}%
            </strong>
            <span className="text-[9px] text-slate-400 block truncate">
              {machine.rejectCount} pcs defect
            </span>
          </div>

          {/* Step 5: Final OEE */}
          <div className={`p-2 rounded-lg border text-center ${
            isDark ? 'bg-emerald-950/40 border-emerald-800/80 shadow-inner' : 'bg-emerald-50 border-emerald-300'
          }`}>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Hasil OEE</span>
            <strong className="text-sm sm:text-base font-mono font-bold text-emerald-400 block">
              {metrics.oeePct.toFixed(1)}%
            </strong>
            <span className="text-[9px] text-emerald-500 font-semibold block truncate">Avail × Perf × Qual</span>
          </div>
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
                1. Unplanned Downtime (Loss)
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
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Unplanned: <strong className="text-rose-500">{metrics.downtimeMin}m</strong> (mengurangi OEE)
              </span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                Planned: {machine.plannedDowntimeMinutes || 60}m
              </span>
            </div>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-xs ${
            isDark ? 'border-slate-700/60 text-slate-300' : 'border-rose-200 text-slate-700'
          }`}>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span>Top Unplanned Cause:</span>
              <strong className={isDark ? 'text-rose-300' : 'text-rose-800'}>
                {unplannedItems[0]?.label || downtimeReasons[0]?.label || 'Breakdown'}
              </strong>
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
              <strong className={isDark ? 'text-purple-300' : 'text-purple-800'}>{rejectReasons[0]?.label.split('/')[0] || 'Dimension'}</strong>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Downtime Breakdown & Pareto
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Planned (dikecualikan dari OEE) vs Unplanned (mengurangi Availability)
              </p>
            </div>

            {/* Filter Tabs: All, Unplanned, Planned */}
            <div className={`flex items-center p-0.5 rounded-lg border text-[11px] font-medium ${
              isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setDowntimeFilter('ALL')}
                className={`px-2 py-0.5 rounded transition-all ${
                  downtimeFilter === 'ALL'
                    ? (isDark ? 'bg-slate-700 text-white font-bold' : 'bg-slate-200 text-slate-900 font-bold')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Semua ({totalUnplannedMin + totalPlannedMin}m)
              </button>
              <button
                type="button"
                onClick={() => setDowntimeFilter('UNPLANNED')}
                className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  downtimeFilter === 'UNPLANNED'
                    ? 'bg-rose-500 text-white font-bold'
                    : (isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-800')
                }`}
              >
                Unplanned ({totalUnplannedMin}m)
              </button>
              <button
                type="button"
                onClick={() => setDowntimeFilter('PLANNED')}
                className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  downtimeFilter === 'PLANNED'
                    ? 'bg-blue-600 text-white font-bold'
                    : (isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800')
                }`}
              >
                Planned ({totalPlannedMin}m)
              </button>
            </div>
          </div>

          {/* Audit Rule Explanation Banner */}
          <div className={`px-2.5 py-1.5 rounded text-[10px] mb-2.5 flex items-center justify-between border ${
            downtimeFilter === 'PLANNED'
              ? (isDark ? 'bg-blue-950/40 text-blue-300 border-blue-800/60' : 'bg-blue-50 text-blue-800 border-blue-200')
              : downtimeFilter === 'UNPLANNED'
              ? (isDark ? 'bg-rose-950/40 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
              : (isDark ? 'bg-slate-900/60 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200')
          }`}>
            <span className="flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0" />
              {downtimeFilter === 'PLANNED' 
                ? 'Planned Stops (istirahat, briefing, scheduled PM) tidak masuk denominator OEE Availability.'
                : downtimeFilter === 'UNPLANNED'
                ? 'Unplanned Stops (kerusakan, part macet, tunggu material) langsung memangkas Availability & OEE.'
                : 'ISO 22400: Planned Downtime mengurangi Shift Time, Unplanned Downtime mengurangi Run Time.'}
            </span>
            <span className="font-mono font-bold shrink-0 ml-2">Total: {totalDowntimeMinutes} min</span>
          </div>

          <div className="space-y-2 mt-2">
            {filteredDowntimeReasons.length === 0 ? (
              <div className={`p-4 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Tidak ada downtime pada filter ini
              </div>
            ) : (
              filteredDowntimeReasons.map((item, idx) => {
                const pctOfMax = (item.durationMinutes / maxDowntime) * 100;
                const pctOfTotal = totalDowntimeMinutes > 0 ? ((item.durationMinutes / totalDowntimeMinutes) * 100).toFixed(1) : 0;
                const isItemPlanned = item.type === 'PLANNED' || item.category === 'Planned';
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
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold border ${
                          isItemPlanned
                            ? (isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-300')
                            : (isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-700 border-rose-300')
                        }`}>
                          {isItemPlanned ? 'Planned' : 'Unplanned'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <strong className={isItemPlanned ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-rose-400' : 'text-rose-700')}>
                          {lossUnitMode === 'TIME' ? `${item.durationMinutes} min` : `${item.equivalentLossPcs} pcs`}
                        </strong>
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({pctOfTotal}%)</span>
                      </div>
                    </div>
                    {/* Pareto Bar */}
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isItemPlanned
                            ? 'bg-gradient-to-r from-blue-600 to-sky-400'
                            : 'bg-gradient-to-r from-rose-600 to-rose-400'
                        }`}
                        style={{ width: `${pctOfMax}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
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
            {rejectReasons.map((item, idx) => {
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
