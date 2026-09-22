// /src/presentation/components/fullscreen/QualityRejectAnalysisPanel.tsx

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { AlertOctagon } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';

interface QualityRejectAnalysisPanelProps {
  totalRejects?: number;
}

const REJECT_DATA = [
  { name: 'Dimensional Defect', value: 18, color: '#f43f5e' },
  { name: 'Scratch / Surface', value: 12, color: '#fb923c' },
  { name: 'Burr / Flash', value: 7, color: '#eab308' },
  { name: 'Other Rejects', value: 4, color: '#94a3b8' },
];

export const QualityRejectAnalysisPanel: React.FC<QualityRejectAnalysisPanelProps> = ({
  totalRejects = 41,
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
          return `<div class="font-bold">${params.name}: <span class="font-mono ${isDark ? 'text-white' : 'text-slate-900'}">${params.value} pcs (${params.percent}%)</span></div>`;
        },
      },
      series: [
        {
          name: 'Rejects',
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 3,
            borderColor: isDark ? '#0b1528' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          data: REJECT_DATA.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color },
          })),
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
  }, [isDark]);

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col justify-between h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/20 dark:border-slate-700/40">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Reject Breakdown
          </h3>
        </div>
        <span className="text-[11px] font-mono text-rose-400 font-bold">
          {totalRejects} pcs (4.3%)
        </span>
      </div>

      {/* Donut & Legend side by side */}
      <div className="flex items-center justify-between gap-2 flex-1 my-1">
        {/* Chart Canvas */}
        <div className="relative w-28 h-24 sm:w-32 sm:h-28 shrink-0">
          <div ref={chartRef} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-4">
            <span className={`font-mono font-bold text-sm sm:text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalRejects}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
              Rejects
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1 text-xs">
          {REJECT_DATA.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-mono font-semibold ml-2 text-right text-slate-300">
                {item.value} <span className="text-[10px] text-slate-500 font-normal">pcs</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
