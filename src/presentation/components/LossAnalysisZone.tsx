// /src/components/LossAnalysisZone.tsx — style OEE Shift Overview

import React, { useState } from 'react';
import { MachineConfig, CalculatedOeeMetrics } from '../../domain/index';
import { formatNumber } from '../../domain/services/OeeCalculator';
import { useTheme } from '../providers/ThemeProvider';

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

  const unplannedItems = downtimeReasons.filter(d => d.type !== 'PLANNED' && d.category !== 'Planned');
  const plannedItems = downtimeReasons.filter(d => d.type === 'PLANNED' || d.category === 'Planned');
  const totalUnplannedMin = unplannedItems.reduce((acc, cur) => acc + cur.durationMinutes, 0);
  const totalPlannedMin = plannedItems.reduce((acc, cur) => acc + cur.durationMinutes, 0);

  const filteredDowntimeReasons = downtimeReasons.filter(item => {
    const isItemPlanned = item.type === 'PLANNED' || item.category === 'Planned';
    if (downtimeFilter === 'UNPLANNED') return !isItemPlanned;
    if (downtimeFilter === 'PLANNED') return isItemPlanned;
    return true;
  });

  const totalDowntimeMinutes = filteredDowntimeReasons.reduce((acc, cur) => acc + cur.durationMinutes, 0);
  const maxDowntime = Math.max(...filteredDowntimeReasons.map(d => d.durationMinutes), 1);
  const totalRejectCount = rejectReasons.reduce((acc, cur) => acc + cur.count, 0);
  const maxReject = Math.max(...rejectReasons.map(r => r.count), 1);

  const cardClass = `rounded-xl border p-[clamp(8px,1vh,14px)] shadow-sm transition-colors min-w-0 max-w-full ${
    isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
  }`;
  const innerClass = `rounded-lg border p-3 min-w-0 ${isDark ? 'bg-[#132238] border-slate-800' : 'bg-[#eef2f7] border-[#c9d3df]'}`;

  const steps = [
    { label: 'Potensi Ideal', value: '100.0%', sub: 'Planned Time', tone: 'text-blue-500' },
    { label: 'Downtime', value: `-${(100 - metrics.availabilityPct).toFixed(1)}%`, sub: lossUnitMode === 'TIME' ? `${metrics.downtimeMin}m stop` : `~${metrics.availabilityLossPcs} pcs`, tone: 'text-rose-500' },
    { label: 'Speed Loss', value: `-${(100 - metrics.performancePct).toFixed(1)}%`, sub: lossUnitMode === 'TIME' ? `${metrics.performanceLossMin}m slow` : `~${metrics.performanceLossPcs} pcs`, tone: 'text-amber-500' },
    { label: 'Defect Scrap', value: `-${(100 - metrics.qualityPct).toFixed(1)}%`, sub: `${machine.rejectCount} pcs`, tone: 'text-purple-500' },
    { label: 'Hasil OEE', value: `${metrics.oeePct.toFixed(1)}%`, sub: 'Avail × Perf × Qual', tone: 'text-emerald-500' },
  ];

  return (
    <section id="loss-analysis-zone" className={cardClass}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Loss Analysis & Six Big Losses
          </h2>
          <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Efficiency Loss: <strong className="text-rose-500 font-bold">-{(100 - metrics.oeePct).toFixed(1)}%</strong>
          </p>
        </div>
        <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs font-semibold ${isDark ? 'bg-[#132238] border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
          <span className={`audit-caption px-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loss as:</span>
          <button
            onClick={() => setLossUnitMode('TIME')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${lossUnitMode === 'TIME' ? 'bg-[#1a3464] text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Time (min)
          </button>
          <button
            onClick={() => setLossUnitMode('UNITS')}
            className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${lossUnitMode === 'UNITS' ? 'bg-[#1a3464] text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Units (pcs)
          </button>
        </div>
      </div>

      {/* Waterfall bridge — 5 steps, responsif agar fit width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 mb-3">
        {steps.map((s, i) => (
          <div key={i} className={`${innerClass} text-center !p-2`}>
            <span className={`audit-micro font-bold uppercase tracking-wide block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{i + 1}. {s.label}</span>
            <strong className={`audit-value font-mono font-black block ${s.tone}`}>{s.value}</strong>
            <span className={`audit-micro font-mono block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
        <div className={innerClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500">1. Downtime Loss</span>
            <span className={`audit-micro px-2 py-0.5 rounded font-mono border ${isDark ? 'bg-rose-950/40 text-rose-300 border-rose-800/50' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>Avail: {metrics.availabilityPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="audit-display font-black font-mono text-rose-500">{lossUnitMode === 'TIME' ? `${metrics.downtimeMin} min` : `${formatNumber(metrics.availabilityLossPcs)} pcs`}</span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lossUnitMode === 'TIME' ? `(~${metrics.availabilityLossPcs} pcs)` : `(~${metrics.downtimeMin} min)`}</span>
          </div>
          <div className="flex items-center justify-between mt-1 audit-caption font-mono">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Unplanned: <strong className="text-rose-500">{metrics.downtimeMin}m</strong></span>
            <span className={`px-1.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>Planned: {machine.plannedDowntimeMinutes || 0}m</span>
          </div>
          <div className={`w-full h-2 rounded-md overflow-hidden mt-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="bg-rose-600 h-full rounded-full" style={{ width: '65%' }}></div>
          </div>
          <div className={`audit-caption font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{unplannedItems[0]?.label || downtimeReasons[0]?.label || 'Breakdown'}</strong></div>
        </div>

        <div className={innerClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500">2. Speed Loss</span>
            <span className={`audit-micro px-2 py-0.5 rounded font-mono border ${isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800/50' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>Perf: {metrics.performancePct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="audit-display font-black font-mono text-amber-500">{lossUnitMode === 'TIME' ? `${metrics.performanceLossMin} min` : `${formatNumber(metrics.performanceLossPcs)} pcs`}</span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lossUnitMode === 'TIME' ? `(~${metrics.performanceLossPcs} pcs)` : `(~${metrics.performanceLossMin} min)`}</span>
          </div>
          <p className={`audit-caption font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Slow cycles & minor stops (&lt;5 min)</p>
          <div className={`w-full h-2 rounded-md overflow-hidden mt-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }}></div>
          </div>
          <div className={`audit-caption font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gap: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{(machine.actualCycleTimeSec - machine.idealCycleTimeSec).toFixed(1)}s / stroke</strong></div>
        </div>

        <div className={innerClass}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-500">3. Defect Loss</span>
            <span className={`audit-micro px-2 py-0.5 rounded font-mono border ${isDark ? 'bg-purple-950/40 text-purple-300 border-purple-800/50' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>Qual: {metrics.qualityPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="audit-display font-black font-mono text-purple-500">{lossUnitMode === 'UNITS' ? `${machine.rejectCount} pcs` : `${Math.round((machine.rejectCount * machine.idealCycleTimeSec) / 60)} min`}</span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lossUnitMode === 'UNITS' ? `(~${Math.round((machine.rejectCount * machine.idealCycleTimeSec) / 60)} min)` : `(${machine.rejectCount} pcs)`}</span>
          </div>
          <p className={`audit-caption font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Startup rejects & scrap</p>
          <div className={`w-full h-2 rounded-md overflow-hidden mt-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '35%' }}></div>
          </div>
          <div className={`audit-caption font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{rejectReasons[0]?.label.split('/')[0] || 'Dimension'}</strong></div>
        </div>
      </div>

      {/* Pareto */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        <div className={`lg:col-span-7 rounded-lg p-3 border ${isDark ? 'bg-[#132238]/60 border-slate-800' : 'bg-[#eef2f7] border-[#c9d3df]'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Downtime Breakdown & Pareto</span>
            <div className={`flex flex-wrap items-center p-0.5 rounded-lg border audit-caption font-bold max-w-full ${isDark ? 'bg-[#0f1b2e] border-slate-700' : 'bg-white border-slate-300'}`}>
              {(['ALL', 'UNPLANNED', 'PLANNED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDowntimeFilter(f)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    downtimeFilter === f
                      ? f === 'UNPLANNED' ? 'bg-rose-600 text-white' : f === 'PLANNED' ? 'bg-[#1a3464] text-white' : isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-900'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'ALL' ? `Semua (${totalUnplannedMin + totalPlannedMin}m)` : f === 'UNPLANNED' ? `Unplanned (${totalUnplannedMin}m)` : `Planned (${totalPlannedMin}m)`}
                </button>
              ))}
            </div>
          </div>
          <div className={`px-2.5 py-1.5 rounded audit-caption font-mono mb-2 border ${isDark ? 'bg-[#0f1b2e] text-slate-300 border-slate-800' : 'bg-white text-slate-700 border-slate-200'}`}>
            ISO 22400: Planned mengurangi Shift Time, Unplanned mengurangi Run Time. <strong className="ml-2">Total: {totalDowntimeMinutes} min</strong>
          </div>
          <div className="space-y-2 mt-2">
            {filteredDowntimeReasons.length === 0 ? (
              <div className={`p-4 text-center text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tidak ada downtime pada filter ini</div>
            ) : (
              filteredDowntimeReasons.map((item, idx) => {
                const pctOfMax = (item.durationMinutes / maxDowntime) * 100;
                const pctOfTotal = totalDowntimeMinutes > 0 ? ((item.durationMinutes / totalDowntimeMinutes) * 100).toFixed(1) : '0';
                const isItemPlanned = item.type === 'PLANNED' || item.category === 'Planned';
                return (
                  <div key={item.id} className="text-xs min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`w-4 h-4 rounded audit-micro font-mono font-bold flex items-center justify-center border shrink-0 ${isDark ? 'bg-[#0f1b2e] text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-300'}`}>{idx + 1}</span>
                        <span className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                        <span className={`audit-micro px-1.5 rounded font-mono font-bold border shrink-0 ${isItemPlanned ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                          {isItemPlanned ? 'PLANNED' : 'UNPLANNED'}
                        </span>
                        <span className={`audit-micro px-1.5 py-0.5 rounded font-mono shrink-0 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'}`}>{item.category}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono">
                        <strong className={isItemPlanned ? 'text-blue-500' : 'text-rose-500'}>{lossUnitMode === 'TIME' ? `${item.durationMinutes} min` : `${item.equivalentLossPcs} pcs`}</strong>
                        <span className={`audit-caption ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({pctOfTotal}%)</span>
                      </div>
                    </div>
                    <div className={`w-full h-2 rounded-md overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className={`h-full rounded-full ${isItemPlanned ? 'bg-blue-500' : 'bg-rose-600'}`} style={{ width: `${pctOfMax}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`lg:col-span-5 rounded-lg p-3 border ${isDark ? 'bg-[#132238]/60 border-slate-800' : 'bg-[#eef2f7] border-[#c9d3df]'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Reject & Scrap Breakdown</span>
            <span className={`audit-caption font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total: {totalRejectCount} pcs</span>
          </div>
          <div className="space-y-2 mt-2">
            {rejectReasons.map((item, idx) => {
              const pctOfMax = (item.count / maxReject) * 100;
              return (
                <div key={item.id} className="text-xs min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`w-4 h-4 rounded audit-micro font-mono font-bold flex items-center justify-center border shrink-0 ${isDark ? 'bg-[#0f1b2e] text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-300'}`}>{idx + 1}</span>
                      <span className={`font-bold truncate max-w-[170px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 font-mono">
                      <strong className="text-purple-500">{item.count} pcs</strong>
                      <span className={`audit-caption ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className={`w-full h-2 rounded-md overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pctOfMax}%` }} />
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
