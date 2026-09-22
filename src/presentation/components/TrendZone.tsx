// /src/components/TrendZone.tsx — style OEE Shift Overview

import React, { useState } from 'react';
import { HourlyDataPoint } from '../../domain/index';
import { useTheme } from '../providers/ThemeProvider';

interface TrendZoneProps {
  hourlyTrends: HourlyDataPoint[];
  targetOee: number;
  totalTargetQty?: number;
  totalCount?: number;
}

export const TrendZone: React.FC<TrendZoneProps> = ({
  hourlyTrends,
  targetOee,
  totalTargetQty,
  totalCount
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeMetric, setActiveMetric] = useState<'OEE' | 'ALL'>('OEE');
  const [hoveredHour, setHoveredHour] = useState<HourlyDataPoint | null>(null);

  const hourlyTarget = hourlyTrends[0]?.target ?? 125;
  const maxActualItem = hourlyTrends.reduce(
    (max, cur) => (cur.actual > max.actual ? cur : max),
    hourlyTrends[0] || { actual: 0, hour: '--' } as HourlyDataPoint
  );
  const totalActualOutput = totalCount ?? hourlyTrends.reduce((sum, h) => sum + h.actual, 0);
  const effectiveTotalTarget = totalTargetQty ?? (hourlyTarget * hourlyTrends.length);

  const svgWidth = 600;
  const svgHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / Math.max(1, hourlyTrends.length - 1)) * chartWidth;
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return paddingTop + chartHeight - (clamped / 100) * chartHeight;
  };
  const createPath = (dataKey: 'oee' | 'availability' | 'performance' | 'quality') => {
    return hourlyTrends.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt[dataKey]);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };
  const targetY = getY(targetOee);
  const maxProd = Math.max(...hourlyTrends.map(h => Math.max(h.target, h.actual)), 150);

  const cardClass = `lg:col-span-6 min-w-0 rounded-xl border p-[clamp(8px,1vh,14px)] shadow-sm transition-colors flex flex-col justify-between ${
    isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
  }`;

  return (
    <section id="trend-zone" className="grid grid-cols-1 lg:grid-cols-12 gap-[1vh] lg:gap-[0.9vw] min-w-0 max-w-full">
      {/* OEE Trend */}
      <div className={cardClass}>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>OEE Shift Trend</h2>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {hourlyTrends.length > 0 ? hourlyTrends[0].hour : '22:00'} → {hourlyTrends.length > 0 ? hourlyTrends[hourlyTrends.length - 1].hour : '08:00'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">Target {targetOee}%</span>
              <div className="flex items-center gap-1 audit-caption font-bold">
                <button onClick={() => setActiveMetric('OEE')} className={`px-2 py-0.5 rounded cursor-pointer ${activeMetric === 'OEE' ? 'bg-[#1a3464] text-white' : isDark ? 'bg-[#132238] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>OEE</button>
                <button onClick={() => setActiveMetric('ALL')} className={`px-2 py-0.5 rounded cursor-pointer ${activeMetric === 'ALL' ? 'bg-[#1a3464] text-white' : isDark ? 'bg-[#132238] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>All 3</button>
              </div>
            </div>
          </div>

          <div className="relative w-full h-[180px]">
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              {[100, 80, 60, 40, 20].map((v) => {
                const y = getY(v);
                return (
                  <g key={v}>
                    <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                    <text x={paddingLeft - 8} y={y + 3} fill={isDark ? '#94a3b8' : '#475569'} fontSize="9" fontFamily="monospace" textAnchor="end">{v}%</text>
                  </g>
                );
              })}
              <line x1={paddingLeft} y1={targetY} x2={svgWidth - paddingRight} y2={targetY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
              {activeMetric === 'ALL' && (
                <>
                  <path d={createPath('availability')} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.85" />
                  <path d={createPath('performance')} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.85" />
                  <path d={createPath('quality')} fill="none" stroke="#9333ea" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.85" />
                </>
              )}
              <path d={createPath('oee')} fill="none" stroke={isDark ? '#38bdf8' : '#2563eb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {hourlyTrends.map((pt, idx) => {
                const x = getX(idx);
                const y = getY(pt.oee);
                const isHovered = hoveredHour?.hour === pt.hour;
                return (
                  <g key={pt.hour} className="cursor-pointer">
                    <circle cx={x} cy={y} r="12" fill="transparent" onMouseEnter={() => setHoveredHour(pt)} onMouseLeave={() => setHoveredHour(null)} />
                    <circle cx={x} cy={y} r={isHovered ? '5' : '3.5'} fill={pt.oee >= targetOee ? (isDark ? '#38bdf8' : '#2563eb') : '#f43f5e'} stroke={isDark ? '#0f1b2e' : '#ffffff'} strokeWidth="2" />
                    <text x={x} y={svgHeight - 8} fill={isHovered ? (isDark ? '#38bdf8' : '#2563eb') : isDark ? '#94a3b8' : '#475569'} fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight={isHovered ? 'bold' : 'normal'}>{pt.hour}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 audit-caption font-mono">
            <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400"><span className="w-2.5 h-1 rounded-full bg-blue-600 dark:bg-sky-400"></span>OEE</span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><span className="w-2.5 h-0.5 border-t border-dashed border-amber-500"></span>Target ({targetOee}%)</span>
            {activeMetric === 'ALL' && <span className={isDark ? 'text-slate-500' : 'text-slate-600'}>A:green P:yellow Q:purple</span>}
          </div>
          {hoveredHour ? (
            <div className={`px-2 py-0.5 rounded border audit-caption font-mono ${isDark ? 'bg-[#132238] border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
              {hoveredHour.hour} → OEE: <strong className="text-blue-600 dark:text-sky-300">{hoveredHour.oee}%</strong> (A:{hoveredHour.availability}% P:{hoveredHour.performance}% Q:{hoveredHour.quality}%)
            </div>
          ) : (
            <div className={`audit-caption font-mono ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Hover nodes to inspect</div>
          )}
        </div>
      </div>

      {/* Production hourly */}
      <div className={cardClass}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="min-w-0">
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Hourly Production</h2>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actual vs Target & Reject (pcs/hr)</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><span className="w-2.5 h-2.5 bg-[#48a43f] rounded-xs"></span>Good</span>
              <span className="flex items-center gap-1 text-rose-500"><span className="w-2.5 h-2.5 bg-rose-600 rounded-xs"></span>Reject</span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><span className="w-3 h-0.5 border-t border-dashed border-amber-500"></span>Target ({hourlyTarget}/h)</span>
            </div>
          </div>

          <div className="h-[180px] flex items-end justify-between gap-1.5 min-w-0 pt-4 pb-2 px-1">
            {hourlyTrends.map((h) => {
              const targetHeight = (h.target / maxProd) * 100;
              const goodHeight = (h.good / maxProd) * 100;
              const rejectHeight = (h.reject / maxProd) * 100;
              return (
                <div key={h.hour} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group relative">
                  <div className={`absolute -top-10 audit-micro font-mono px-2 py-1 rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap ${isDark ? 'bg-[#132238] text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-300'}`}>
                    {h.hour}: Act {h.actual} | Good {h.good} | Rej {h.reject}
                  </div>
                  <div className="absolute w-full border-t border-dashed border-amber-500/70 z-10 pointer-events-none" style={{ bottom: `${targetHeight}%` }} />
                  <div className="w-full max-w-[28px] flex flex-col justify-end h-full">
                    <div className="w-full bg-rose-600 rounded-t-xs transition-all duration-300 group-hover:brightness-110" style={{ height: `${rejectHeight}%` }} />
                    <div className="w-full bg-[#48a43f] rounded-b-xs transition-all duration-300 group-hover:brightness-110" style={{ height: `${goodHeight}%` }} />
                  </div>
                  <span className={`audit-micro font-mono mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{h.hour.split(':')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Target Rate: <strong className="text-amber-500">{hourlyTarget} pcs/hr</strong> <span className="opacity-80 ml-1">(Shift: {effectiveTotalTarget.toLocaleString()} pcs)</span></span>
          <span>Max: <strong className="text-emerald-500">{maxActualItem.actual} pcs/hr ({maxActualItem.hour})</strong> <span className="opacity-80 ml-1">• Total: {totalActualOutput.toLocaleString()} pcs</span></span>
        </div>
      </div>
    </section>
  );
};
