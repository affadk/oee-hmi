import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { RejectReasonItem } from '../../types';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface EChartsRejectReasonProps {
  rejectReasons: RejectReasonItem[];
  totalRejects: number;
}

export const EChartsRejectReason: React.FC<EChartsRejectReasonProps> = ({
  rejectReasons,
  totalRejects,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const defaultReasons = [
    { label: 'Dimension Error', count: 18, pct: 44, color: '#ef4444' },
    { label: 'Surface Defect', count: 12, pct: 29, color: '#f97316' },
    { label: 'Assembly Error', count: 7, pct: 17, color: '#eab308' },
    { label: 'Other', count: 4, pct: 10, color: '#0284c7' },
  ];

  const items = rejectReasons.length > 0
    ? rejectReasons.map((r, idx) => ({
        label: r.label,
        count: r.count,
        pct: r.percentage,
        color: ['#ef4444', '#f97316', '#eab308', '#0284c7', '#a855f7'][idx % 5],
      }))
    : defaultReasons;

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
          name: 'Reject Reasons',
          type: 'pie',
          radius: ['54%', '78%'],
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
          data: items.map((it) => ({
            name: it.label,
            value: it.count,
            itemStyle: { color: it.color },
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
  }, [items, isDark]);

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 pb-1">
        <BarChart3 className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Reject Reason
        </h3>
      </div>

      {/* Donut & Legend */}
      <div className="flex items-center justify-between gap-2 flex-1">
        {/* Donut with Center Text */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
          <div ref={chartRef} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`font-bold text-sm sm:text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalRejects} pcs
            </span>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Reject
            </span>
          </div>
        </div>

        {/* Legend matching image.png */}
        <div className="flex-1 space-y-1.5 text-xs pr-1">
          {items.map((it) => (
            <div key={it.label} className="flex items-center justify-between text-[11px]">
              <span className={`flex items-center gap-1.5 truncate max-w-[120px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: it.color }} />
                {it.label}
              </span>
              <span className={`font-semibold shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {it.count} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({it.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
