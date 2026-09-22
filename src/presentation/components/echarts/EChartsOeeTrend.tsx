// /src/presentation/components/echarts/EChartsOeeTrend.tsx

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { HourlyDataPoint } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';
import { Radio } from 'lucide-react';

interface EChartsOeeTrendProps {
  hourlyTrends: HourlyDataPoint[];
  isBuffered?: boolean;
  title?: string;
  height?: number;
}

export const EChartsOeeTrend: React.FC<EChartsOeeTrendProps> = ({
  hourlyTrends,
  isBuffered = false,
  title = 'OEE Shift Trend',
  height,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const startHour = hourlyTrends.length > 0 ? hourlyTrends[0].hour : '00:00';
  const endHour = hourlyTrends.length > 0 ? hourlyTrends[hourlyTrends.length - 1].hour : '08:00';

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const hours = hourlyTrends.map((d) => d.hour);
    const oeeData = hourlyTrends.map((d) => d.oee);
    const availData = hourlyTrends.map((d) => d.availability);
    const perfData = hourlyTrends.map((d) => d.performance);
    const qualData = hourlyTrends.map((d) => d.quality);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
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
          let tip = `<div class="font-bold mb-1 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}">Time: ${params[0]?.axisValue}</div>`;
          params.forEach((p: any) => {
            tip += `
              <div class="flex items-center justify-between gap-3 text-xs py-0.5">
                <span style="color:${p.color}">● ${p.seriesName}:</span>
                <span class="font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}">${Number(p.value).toFixed(1)}%</span>
              </div>
            `;
          });
          return tip;
        },
      },
      grid: {
        left: '4%',
        right: '3%',
        top: '10%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLine: {
          lineStyle: {
            color: isDark ? '#1e293b' : '#cbd5e1',
          },
        },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: 10,
          fontFamily: 'monospace',
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%',
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: 10,
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#162744' : '#e2e8f0',
            type: 'solid',
          },
        },
      },
      series: [
        {
          name: 'OEE',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#10b981',
          },
          lineStyle: {
            width: 2.5,
            color: '#10b981',
          },
          data: oeeData,
        },
        {
          name: 'Availability',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: {
            color: '#00c0fa',
          },
          lineStyle: {
            width: 2,
            color: '#00c0fa',
          },
          data: availData,
        },
        {
          name: 'Performance',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: {
            color: '#f59e0b',
          },
          lineStyle: {
            width: 2,
            color: '#f59e0b',
          },
          data: perfData,
        },
        {
          name: 'Quality',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: {
            color: '#a855f7',
          },
          lineStyle: {
            width: 2,
            color: '#a855f7',
          },
          data: qualData,
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
  }, [hourlyTrends, isDark]);

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header with Title & Legend */}
      <div className="flex flex-wrap items-center justify-between mb-1 pb-1 gap-2">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {title} <span className={`font-mono text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({startHour} - {endHour})</span>
          </h3>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold border ${
            isBuffered
              ? isDark ? 'bg-amber-950/60 text-amber-400 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
              : isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
          }`}>
            <Radio className="w-2.5 h-2.5" />
            {isBuffered ? 'BUFFERED' : 'LIVE'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-[10px] sm:text-xs">
          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> OEE
          </span>
          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2 h-2 rounded-full bg-[#00c0fa]"></span> Availability
          </span>
          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Performance
          </span>
          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Quality
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        className="flex-1 w-full"
        style={{ minHeight: height ? `${height}px` : '150px' }}
        ref={chartRef}
      />
    </div>
  );
};

