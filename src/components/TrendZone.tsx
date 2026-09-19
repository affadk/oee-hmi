import React, { useState } from 'react';
import { 
  LineChart, 
  TrendingUp
} from 'lucide-react';
import { HourlyDataPoint } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TrendZoneProps {
  hourlyTrends: HourlyDataPoint[];
  targetOee: number;
}

export const TrendZone: React.FC<TrendZoneProps> = ({ hourlyTrends, targetOee }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeMetric, setActiveMetric] = useState<'OEE' | 'AVAIL' | 'PERF' | 'QUAL' | 'ALL'>('OEE');
  const [hoveredHour, setHoveredHour] = useState<HourlyDataPoint | null>(null);

  // Calculate SVG chart coordinates
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const minVal = 0;
  const maxVal = 100;

  // Convert (index, value) to SVG coordinate
  const getX = (index: number) => {
    return paddingLeft + (index / (hourlyTrends.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return paddingTop + chartHeight - ((clamped - minVal) / (maxVal - minVal)) * chartHeight;
  };

  // Generate SVG path string
  const createPath = (dataKey: 'oee' | 'availability' | 'performance' | 'quality') => {
    return hourlyTrends.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt[dataKey]);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Target OEE line Y
  const targetY = getY(targetOee);

  // Production bar calculations for right chart
  const maxProd = Math.max(...hourlyTrends.map(h => Math.max(h.target, h.actual)), 150);

  return (
    <section id="trend-zone" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. OEE Hourly Trend (6 Cols) */}
      <div className={`lg:col-span-6 rounded-xl border p-4 transition-colors flex flex-col justify-between ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b gap-2 ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <LineChart className="w-4 h-4 text-blue-500" />
                OEE & Component Hourly Trend
              </h2>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shift timeline from 08:00 to 15:00</span>
            </div>

            {/* Filter line toggles */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setActiveMetric('OEE')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  activeMetric === 'OEE' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                OEE
              </button>
              <button
                onClick={() => setActiveMetric('ALL')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  activeMetric === 'ALL' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All 3
              </button>
            </div>
          </div>

          {/* SVG Trend Chart */}
          <div className="relative w-full h-[180px]">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              {/* Horizontal grid lines: 100%, 80%, 60%, 40%, 20% */}
              {[100, 80, 60, 40, 20].map((v) => {
                const y = getY(v);
                return (
                  <g key={v}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke={isDark ? "#1e293b" : "#e2e8f0"}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      fill={isDark ? "#64748b" : "#94a3b8"}
                      fontSize="9"
                      fontFamily="IBM Plex Mono"
                      textAnchor="end"
                    >
                      {v}%
                    </text>
                  </g>
                );
              })}

              {/* Target Line (Dashed Red/Amber) */}
              <line
                x1={paddingLeft}
                y1={targetY}
                x2={svgWidth - paddingRight}
                y2={targetY}
                stroke={isDark ? "#f59e0b" : "#d97706"}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - paddingRight + 4}
                y={targetY + 3}
                fill={isDark ? "#f59e0b" : "#d97706"}
                fontSize="9"
                fontFamily="IBM Plex Mono"
              >
                Target {targetOee}%
              </text>

              {/* Component Lines if ALL is selected */}
              {activeMetric === 'ALL' && (
                <>
                  {/* Availability (Emerald) */}
                  <path
                    d={createPath('availability')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity={isDark ? "0.8" : "0.9"}
                  />
                  {/* Performance (Amber) */}
                  <path
                    d={createPath('performance')}
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity={isDark ? "0.8" : "0.9"}
                  />
                  {/* Quality (Purple) */}
                  <path
                    d={createPath('quality')}
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity={isDark ? "0.8" : "0.9"}
                  />
                </>
              )}

              {/* Main OEE Curve */}
              <path
                d={createPath('oee')}
                fill="none"
                stroke={isDark ? "#38bdf8" : "#0284c7"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots and interactive points */}
              {hourlyTrends.map((pt, idx) => {
                const x = getX(idx);
                const y = getY(pt.oee);
                const isHovered = hoveredHour?.hour === pt.hour;

                return (
                  <g key={pt.hour} className="cursor-pointer">
                    {/* Hit area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="transparent"
                      onMouseEnter={() => setHoveredHour(pt)}
                      onMouseLeave={() => setHoveredHour(null)}
                    />
                    {/* Visual dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? "5" : "3.5"}
                      fill={pt.oee >= targetOee ? (isDark ? "#38bdf8" : "#0284c7") : "#f43f5e"}
                      stroke={isDark ? "#0f172a" : "#ffffff"}
                      strokeWidth="2"
                    />
                    {/* Hour label below */}
                    <text
                      x={x}
                      y={svgHeight - 8}
                      fill={isHovered ? (isDark ? "#38bdf8" : "#0284c7") : (isDark ? "#94a3b8" : "#64748b")}
                      fontSize="10"
                      fontFamily="IBM Plex Mono"
                      textAnchor="middle"
                      fontWeight={isHovered ? "bold" : "normal"}
                    >
                      {pt.hour}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Trend Legend / Hover readout */}
        <div className={`mt-2 pt-2 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3 text-[11px]">
            <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              <span className={`w-2.5 h-1 rounded-full ${isDark ? 'bg-sky-400' : 'bg-sky-600'}`}></span>
              OEE Curve
            </span>
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              <span className={`w-2.5 h-0.5 border-t border-dashed ${isDark ? 'border-amber-400' : 'border-amber-600'}`}></span>
              Target ({targetOee}%)
            </span>
            {activeMetric === 'ALL' && (
              <span className={`hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Green: Avail | Yellow: Perf | Purple: Qual
              </span>
            )}
          </div>

          {hoveredHour ? (
            <div className={`px-2 py-0.5 rounded border text-[11px] font-mono ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              {hoveredHour.hour} → OEE: <strong className={isDark ? 'text-sky-300' : 'text-sky-700'}>{hoveredHour.oee}%</strong> (A:{hoveredHour.availability}% P:{hoveredHour.performance}% Q:{hoveredHour.quality}%)
            </div>
          ) : (
            <div className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Hover nodes to inspect values
            </div>
          )}
        </div>
      </div>

      {/* 2. Production Hourly Output Trend (Target vs Actual vs Reject) (6 Cols) */}
      <div className={`lg:col-span-6 rounded-xl border p-4 transition-colors flex flex-col justify-between ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className={`flex items-center justify-between pb-3 mb-2 border-b ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Hourly Production: Actual vs Target & Reject
              </h2>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hourly throughput (pcs/hr)</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                Good
              </span>
              <span className={`flex items-center gap-1 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                Reject
              </span>
              <span className={`flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                <span className={`w-3 h-0.5 border-t border-dashed ${isDark ? 'border-amber-400' : 'border-amber-600'}`}></span>
                Target (125)
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-[180px] flex items-end justify-between gap-1.5 pt-4 pb-2 px-1">
            {hourlyTrends.map((h) => {
              const targetHeight = (h.target / maxProd) * 100;
              const goodHeight = (h.good / maxProd) * 100;
              const rejectHeight = (h.reject / maxProd) * 100;

              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className={`absolute -top-10 text-[10px] font-mono px-2 py-1 rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-900 text-white border-slate-800'
                  }`}>
                    {h.hour}: Act {h.actual} | Good {h.good} | Rej {h.reject}
                  </div>

                  {/* Target reference line indicator */}
                  <div 
                    className="absolute w-full border-t border-dashed border-amber-500/70 z-10 pointer-events-none"
                    style={{ bottom: `${targetHeight}%` }}
                  />

                  {/* Stacked bar: Good on bottom, Reject on top */}
                  <div className="w-full max-w-[28px] flex flex-col justify-end h-full">
                    {/* Reject portion */}
                    <div 
                      className="w-full bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${rejectHeight}%` }}
                    />
                    {/* Good portion */}
                    <div 
                      className="w-full bg-emerald-500 rounded-b-sm transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${goodHeight}%` }}
                    />
                  </div>

                  {/* Hour label */}
                  <span className={`text-[10px] font-mono mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {h.hour.split(':')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className={`mt-2 pt-2 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
        }`}>
          <span>Target Hourly Rate: <strong className={`font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>125 pcs/hr</strong></span>
          <span>Max Actual: <strong className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>130 pcs/hr (13:00)</strong></span>
        </div>
      </div>
    </section>
  );
};
