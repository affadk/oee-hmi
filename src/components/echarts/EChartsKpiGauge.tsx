import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../../context/ThemeContext';

interface EChartsKpiGaugeProps {
  title: string;
  value: number; // e.g. 82.4
  target: number; // e.g. 85.0
  gap: number; // e.g. -2.6
  color: string; // e.g. '#10b981'
  onClick?: () => void;
}

export const EChartsKpiGauge: React.FC<EChartsKpiGaugeProps> = ({
  title,
  value,
  target,
  gap,
  color,
  onClick,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const trackColor = isDark ? '#17253b' : '#e2e8f0';

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
              value: value,
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
      className={`rounded-xl p-3 flex items-center justify-between transition-colors cursor-pointer select-none flex-1 min-w-[200px] border shadow-md ${
        isDark
          ? 'bg-[#0b1528] border-[#162744] hover:border-slate-700 text-white'
          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
      }`}
    >
      {/* Donut Gauge with Center Value */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
        <div ref={chartRef} className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`font-sans font-bold text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Metric Details */}
      <div className="ml-3 sm:ml-4 flex-1">
        <div className={`font-bold text-base sm:text-lg tracking-wide mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </div>
        <div className={`text-xs font-medium flex items-center gap-1.5 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>Target</span>
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{target.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-rose-500">
          <span>▼</span>
          <span>{gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}</span>
          <span className={`font-normal ml-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>vs Target</span>
        </div>
      </div>
    </div>
  );
};
