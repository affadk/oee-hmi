import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../../providers/ThemeProvider';

interface EChartsComponentBreakdownProps {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export const EChartsComponentBreakdown: React.FC<EChartsComponentBreakdownProps> = ({
  oee,
  availability,
  performance,
  quality,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#0b1528' : '#ffffff',
        borderColor: isDark ? '#1e3a5f' : '#cbd5e1',
        borderWidth: 1,
        textStyle: {
          color: isDark ? '#e2e8f0' : '#0f172a',
          fontSize: 11,
        },
        formatter: (params: any) => {
          return `<div class="font-bold">${params.name}: <span class="font-mono ${isDark ? 'text-white' : 'text-slate-900'}">${params.value}%</span></div>`;
        },
      },
      series: [
        {
          name: 'OEE Breakdown',
          type: 'pie',
          radius: ['58%', '82%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 3,
            borderColor: isDark ? '#0b1528' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          data: [
            { value: Number(availability.toFixed(1)), name: 'Availability', itemStyle: { color: '#10b981' } },
            { value: Number(performance.toFixed(1)), name: 'Performance', itemStyle: { color: '#0284c7' } },
            { value: Number(quality.toFixed(1)), name: 'Quality', itemStyle: { color: '#f59e0b' } },
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
  }, [availability, performance, quality, isDark]);

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="mb-1 pb-1">
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          OEE Component Breakdown
        </h3>
      </div>

      {/* Donut Chart & Legend Side by Side — proporsional */}
      <div className="flex-1 flex items-center justify-between gap-3">
        {/* Donut with Center Text */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
          <div ref={chartRef} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`font-bold text-sm sm:text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {oee.toFixed(1)}%
            </span>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              OEE
            </span>
          </div>
        </div>

        {/* Legend List matching image.png */}
        <div className="flex-1 flex flex-col justify-center gap-2.5 pr-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
              Availability
            </span>
            <span className={`font-sans font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {availability.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
              Performance
            </span>
            <span className={`font-sans font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {performance.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
              Quality
            </span>
            <span className={`font-sans font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {quality.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
