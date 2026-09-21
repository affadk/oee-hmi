import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { HourlyDataPoint } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface EChartsProdVsTargetProps {
  hourlyTrends: HourlyDataPoint[];
  totalTargetQty?: number;
  totalCount?: number;
}

export const EChartsProdVsTarget: React.FC<EChartsProdVsTargetProps> = ({
  hourlyTrends,
  totalTargetQty,
  totalCount,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Toggle between Hourly throughput (pcs/jam) vs Cumulative progress (pcs total akumulasi)
  const [viewMode, setViewMode] = useState<'HOURLY' | 'CUMULATIVE'>('HOURLY');

  // Use all hours provided in trend series
  const displayTrends = hourlyTrends;

  // Calculate cumulative time series data
  const cumulativeData = useMemo(() => {
    let cumTarget = 0;
    let cumActual = 0;
    let cumGood = 0;
    let cumReject = 0;

    return displayTrends.map((d) => {
      cumTarget += d.target;
      cumActual += d.actual;
      cumGood += d.good;
      cumReject += d.reject;
      return {
        hour: d.hour,
        target: cumTarget,
        actual: cumActual,
        good: cumGood,
        reject: cumReject,
        hourlyTarget: d.target,
        hourlyActual: d.actual,
      };
    });
  }, [displayTrends]);

  const hourlyTarget = displayTrends[0]?.target ?? 125;
  const effectiveTotalTarget = totalTargetQty ?? cumulativeData[cumulativeData.length - 1]?.target ?? 1000;
  const effectiveTotalActual = totalCount ?? cumulativeData[cumulativeData.length - 1]?.actual ?? 945;

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const hours = displayTrends.map((d) => d.hour);
    const targetData = viewMode === 'HOURLY' 
      ? displayTrends.map((d) => d.target) 
      : cumulativeData.map((d) => d.target);
    const actualData = viewMode === 'HOURLY' 
      ? displayTrends.map((d) => d.actual) 
      : cumulativeData.map((d) => d.actual);

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
          const idx = params[0]?.dataIndex ?? 0;
          const orig = displayTrends[idx];
          const cum = cumulativeData[idx];

          let tip = `<div class="font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}">Pukul ${params[0]?.axisValue} ${viewMode === 'CUMULATIVE' ? '(Akumulasi)' : '(Per Jam)'}</div>`;
          
          params.forEach((p: any) => {
            tip += `
              <div class="flex items-center justify-between gap-3 text-xs py-0.5">
                <span style="color:${p.color}">■ ${p.seriesName}:</span>
                <span class="font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}">${Number(p.value).toLocaleString()} pcs</span>
              </div>
            `;
          });

          if (orig && cum) {
            const achPct = pTargetOrAch(viewMode === 'HOURLY' ? orig.actual : cum.actual, viewMode === 'HOURLY' ? orig.target : cum.target);
            const delta = (viewMode === 'HOURLY' ? orig.actual : cum.actual) - (viewMode === 'HOURLY' ? orig.target : cum.target);
            
            tip += `
              <div class="mt-1.5 pt-1.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} text-[11px] font-mono space-y-0.5">
                <div class="flex justify-between">
                  <span class="${isDark ? 'text-slate-400' : 'text-slate-500'}">Pencapaian:</span>
                  <span class="font-bold ${achPct >= 90 ? 'text-emerald-500' : 'text-amber-500'}">${achPct.toFixed(1)}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="${isDark ? 'text-slate-400' : 'text-slate-500'}">Selisih (Variance):</span>
                  <span class="font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${delta >= 0 ? `+${delta}` : delta} pcs</span>
                </div>
                ${viewMode === 'HOURLY' ? `
                  <div class="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Good: ${orig.good} pcs</span>
                    <span>Reject: ${orig.reject} pcs</span>
                  </div>
                ` : `
                  <div class="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Target Akhir Shift:</span>
                    <span>${effectiveTotalTarget.toLocaleString()} pcs</span>
                  </div>
                `}
              </div>
            `;
          }

          return tip;
        },
      },
      grid: {
        left: '4%',
        right: '3%',
        top: '12%',
        bottom: '8%',
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
          fontFamily: 'monospace',
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: (val) => {
          if (viewMode === 'HOURLY') {
            return Math.ceil(Math.max(val.max * 1.15, 140) / 20) * 20;
          }
          return Math.ceil(Math.max(val.max * 1.1, effectiveTotalTarget) / 100) * 100;
        },
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
          type: viewMode === 'HOURLY' ? 'bar' : 'line',
          barGap: '20%',
          barMaxWidth: 16,
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: '#2563eb',
          },
          itemStyle: {
            color: '#2563eb',
            borderRadius: [2, 2, 0, 0],
          },
          data: targetData,
        },
        {
          name: 'Actual',
          type: viewMode === 'HOURLY' ? 'bar' : 'line',
          barMaxWidth: 16,
          smooth: viewMode === 'CUMULATIVE',
          areaStyle: viewMode === 'CUMULATIVE' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
            ]),
          } : undefined,
          lineStyle: {
            width: 2.5,
            color: '#10b981',
          },
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
  }, [displayTrends, cumulativeData, viewMode, isDark, effectiveTotalTarget]);

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header with Title, Mode Toggle & Legend */}
      <div className="flex flex-wrap items-center justify-between mb-1 pb-1 gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Production vs Target
          </h3>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            Target: {hourlyTarget}/h • Total: {effectiveTotalTarget.toLocaleString()} pcs
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Per Jam vs Akumulasi */}
          <div className={`flex rounded-lg p-0.5 border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('HOURLY')}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                viewMode === 'HOURLY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Jam
            </button>
            <button
              onClick={() => setViewMode('CUMULATIVE')}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                viewMode === 'CUMULATIVE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Akumulasi
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs">
            <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2 h-2 rounded-[2px] bg-[#2563eb]"></span> Target
            </span>
            <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2 h-2 rounded-[2px] bg-[#10b981]"></span> Actual
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[140px]" ref={chartRef} />
    </div>
  );
};

function pTargetOrAch(act: number, tgt: number): number {
  return tgt > 0 ? (act / tgt) * 100 : 0;
}

