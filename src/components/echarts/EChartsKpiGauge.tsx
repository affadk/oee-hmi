// /src/presentation/components/echarts/EChartsKpiGauge.tsx

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../../context/ThemeContext';

interface EChartsKpiGaugeProps {
  title: string;
  value: number; // e.g. 82.4
  subtitle?: string; // e.g. "A × P × Q" or "Run / Planned"
  ratingBadge?: string; // e.g. "Good", "World Class", "Normal"
  color: string; // e.g. '#10b981'
  onClick?: () => void;
}

export const EChartsKpiGauge: React.FC<EChartsKpiGaugeProps> = ({
  title,
  value,
  subtitle,
  ratingBadge,
  color,
  onClick,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const trackColor = isDark ? '#1a2e4c' : '#e2e8f0';

  const getThemeStyles = () => {
    if (color.includes('10b981') || color.includes('emerald') || color.includes('green')) {
      return {
        card: isDark
          ? 'bg-gradient-to-br from-[#0c2f28]/95 via-[#10273f] to-[#0c1c30] border-emerald-500/50 hover:border-emerald-400 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/20'
          : 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-400 shadow-md shadow-emerald-100 ring-1 ring-emerald-400/20',
        titleText: isDark ? 'text-emerald-300' : 'text-emerald-800',
        badge: isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (color.includes('0ea5e9') || color.includes('3b82f6') || color.includes('sky') || color.includes('blue')) {
      return {
        card: isDark
          ? 'bg-gradient-to-br from-[#0b2d4c]/95 via-[#10273f] to-[#0c1c30] border-sky-500/50 hover:border-sky-400 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/20'
          : 'bg-sky-50/90 border-sky-300 hover:border-sky-400 shadow-md shadow-sky-100 ring-1 ring-sky-400/20',
        titleText: isDark ? 'text-sky-300' : 'text-sky-800',
        badge: isDark ? 'bg-sky-950/80 text-sky-300 border-sky-800/60' : 'bg-sky-100 text-sky-800 border-sky-300',
      };
    }
    if (color.includes('f59e0b') || color.includes('amber') || color.includes('orange') || color.includes('eab308')) {
      return {
        card: isDark
          ? 'bg-gradient-to-br from-[#3b2408]/95 via-[#1f2538] to-[#0c1c30] border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/20'
          : 'bg-amber-50/90 border-amber-300 hover:border-amber-400 shadow-md shadow-amber-100 ring-1 ring-amber-400/20',
        titleText: isDark ? 'text-amber-300' : 'text-amber-800',
        badge: isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' : 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
    if (color.includes('a855f7') || color.includes('purple') || color.includes('8b5cf6') || color.includes('d946ef')) {
      return {
        card: isDark
          ? 'bg-gradient-to-br from-[#2f1345]/95 via-[#19223a] to-[#0c1c30] border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/20'
          : 'bg-purple-50/90 border-purple-300 hover:border-purple-400 shadow-md shadow-purple-100 ring-1 ring-purple-400/20',
        titleText: isDark ? 'text-purple-300' : 'text-purple-800',
        badge: isDark ? 'bg-purple-950/80 text-purple-300 border-purple-800/60' : 'bg-purple-100 text-purple-800 border-purple-300',
      };
    }
    return {
      card: isDark
        ? 'bg-[#10243d] border-[#1f3f6b] hover:border-slate-600 shadow-md'
        : 'bg-slate-50 border-slate-300 hover:border-slate-400 shadow-sm',
      titleText: isDark ? 'text-white' : 'text-slate-900',
      badge: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300',
    };
  };

  const themeStyles = getThemeStyles();

  // Determine standard rating if not provided
  const computedRating = ratingBadge || (value >= 85 ? 'World Class' : value >= 75 ? 'Optimal' : 'Needs Action');

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const option: echarts.EChartsOption = {
      series: [
        {
          type: 'pie',
          radius: ['72%', '92%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          silent: true,
          label: {
            show: false,
          },
          data: [
            {
              value: Math.min(100, Math.max(0, value)),
              itemStyle: {
                color: color,
                borderRadius: 4,
              },
            },
            {
              value: Math.max(0, 100 - value),
              itemStyle: {
                color: trackColor,
              },
            },
          ],
        },
      ],
    };

    chartInstance.setOption(option);

    const ro = new ResizeObserver(() => {
      chartInstance.resize();
    });
    ro.observe(chartRef.current);

    return () => {
      ro.disconnect();
      chartInstance.dispose();
    };
  }, [value, color, trackColor, isDark]);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer select-none flex-1 min-w-[200px] border ${themeStyles.card}`}
    >
      {/* Donut Gauge with Center Value */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
        <div ref={chartRef} className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`font-mono font-bold text-base sm:text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Metric Details */}
      <div className="ml-3 sm:ml-4 flex-1">
        <div className={`font-bold text-base sm:text-lg tracking-wide mb-1 flex items-center gap-1.5 ${themeStyles.titleText}`}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span>{title}</span>
        </div>
        
        {subtitle && (
          <div className={`text-[11px] font-mono mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitle}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${themeStyles.badge}`}>
            {computedRating}
          </span>
        </div>
      </div>
    </div>
  );
};

