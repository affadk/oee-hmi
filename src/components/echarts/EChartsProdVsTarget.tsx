import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { HourlyDataPoint } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface EChartsProdVsTargetProps {
  hourlyTrends: HourlyDataPoint[];
}

export const EChartsProdVsTarget: React.FC<EChartsProdVsTargetProps> = ({ hourlyTrends }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Filter 08:00 to 14:00 to match image.png precisely
  const displayTrends = hourlyTrends.filter((d) =>
    ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].includes(d.hour)
  );

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const hours = displayTrends.map((d) => d.hour);
    const targetData = displayTrends.map((d) => d.target);
    const actualData = displayTrends.map((d) => d.actual);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: isDark ? '#0b1528' : '#ffffff',
        borderColor: isDark ? '#1e3a5f' : '#cbd5e1',
        borderWidth: 1,
        textStyle: {
          color: isDark ? '#e2e8f0' : '#0f172a',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          let tip = `<div class="font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}">${params[0]?.axisValue}</div>`;
          params.forEach((p: any) => {
            tip += `
              <div class="flex items-center justify-between gap-3 text-xs py-0.5">
                <span style="color:${p.color}">■ ${p.seriesName}:</span>
                <span class="font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}">${Number(p.value).toLocaleString()} pcs</span>
              </div>
            `;
          });
          return tip;
        },
      },
      grid: {
        left: '6%',
        right: '4%',
        top: '12%',
        bottom: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: {
          lineStyle: {
            color: isDark ? '#1e293b' : '#cbd5e1',
          },
        },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1250,
        interval: 250,
        axisLabel: {
          formatter: (val: number) => (val === 0 ? '0' : val.toLocaleString()),
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 10,
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#162744' : '#f1f5f9',
            type: 'solid',
          },
        },
      },
      series: [
        {
          name: 'Target',
          type: 'bar',
          barGap: '20%',
          barMaxWidth: 16,
          itemStyle: {
            color: '#2563eb',
            borderRadius: [2, 2, 0, 0],
          },
          data: targetData,
        },
        {
          name: 'Actual',
          type: 'bar',
          barMaxWidth: 16,
          itemStyle: {
            color: '#10b981',
            borderRadius: [2, 2, 0, 0],
          },
          data: actualData,
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
  }, [displayTrends, isDark]);

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header with Title & Legend matching image.png */}
      <div className="flex items-center justify-between mb-1 pb-1">
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Production vs Target
        </h3>
        <div className="flex items-center gap-3 text-[10px] sm:text-xs">
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2563eb]"></span> Target
          </span>
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#10b981]"></span> Actual
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[140px]" ref={chartRef} />
    </div>
  );
};
