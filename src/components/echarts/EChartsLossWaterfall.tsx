import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, TrendingDown } from 'lucide-react';

interface EChartsLossWaterfallProps {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  availabilityLossPcs?: number;
  performanceLossPcs?: number;
  qualityLossPcs?: number;
}

export const EChartsLossWaterfall: React.FC<EChartsLossWaterfallProps> = ({
  oee,
  availability,
  performance,
  quality,
  availabilityLossPcs,
  performanceLossPcs,
  qualityLossPcs,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Calculate percentage loss contribution from 100% capacity
  // 100% Potential -> - Avail Loss -> - Perf Loss -> - Quality Loss = OEE %
  const availLossPct = Number(Math.max(0, 100 - availability).toFixed(1));
  const perfLossPct = Number(Math.max(0, 100 - performance).toFixed(1));
  const qualLossPct = Number(Math.max(0, 100 - quality).toFixed(1));
  const finalOeePct = Number(oee.toFixed(1));

  // In a standard step-down waterfall:
  // Step 0: Ideal Potential = 100 (base: 0, val: 100)
  // Step 1: Availability Loss = -availLossPct (base: 100 - availLossPct, val: availLossPct)
  // Step 2: Performance Loss = -perfLossPct (base: 100 - availLossPct - perfLossPct, val: perfLossPct)
  // Step 3: Quality Loss = -qualLossPct (base: finalOeePct, val: qualLossPct)
  // Step 4: Final OEE = finalOeePct (base: 0, val: finalOeePct)
  const afterAvail = Math.max(0, 100 - availLossPct);
  const afterPerf = Math.max(0, afterAvail - perfLossPct);
  const baseData = [
    0, // Ideal
    afterAvail, // Downtime loss base
    afterPerf, // Speed loss base
    finalOeePct, // Quality loss base
    0, // Final OEE base
  ];

  const barData = [
    100,
    availLossPct,
    perfLossPct,
    qualLossPct,
    finalOeePct,
  ];

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const categories = ['Ideal', 'Down', 'Speed', 'Scrap', 'OEE'];
    const fullLabels = ['100% Potential', 'Downtime Loss', 'Speed Loss', 'Defect Loss', 'Actual OEE'];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#0b1528' : '#ffffff',
        borderColor: isDark ? '#1e3a5f' : '#cbd5e1',
        borderWidth: 1,
        textStyle: {
          color: isDark ? '#e2e8f0' : '#0f172a',
          fontSize: 11,
        },
        formatter: (params: any) => {
          const tar = params[1] || params[0];
          const idx = tar.dataIndex;
          let extra = '';
          if (idx === 1 && availabilityLossPcs) extra = `<br/><span class="text-slate-400">Equivalent: ~${availabilityLossPcs.toLocaleString()} pcs</span>`;
          if (idx === 2 && performanceLossPcs) extra = `<br/><span class="text-slate-400">Equivalent: ~${performanceLossPcs.toLocaleString()} pcs</span>`;
          if (idx === 3 && qualityLossPcs) extra = `<br/><span class="text-slate-400">Rejects: ${qualityLossPcs.toLocaleString()} pcs</span>`;

          const prefix = idx > 0 && idx < 4 ? '-' : '';
          return `
            <div class="font-bold mb-0.5">${fullLabels[idx]}</div>
            <div class="font-mono text-xs">
              Impact: <strong class="${idx === 0 ? 'text-blue-400' : idx === 4 ? 'text-emerald-400' : 'text-rose-400'}">
                ${prefix}${tar.value}%
              </strong>
              ${extra}
            </div>
          `;
        },
      },
      grid: {
        top: 24,
        left: 8,
        right: 12,
        bottom: 22,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: isDark ? '#1e3a5f' : '#cbd5e1' } },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 10,
          fontWeight: 600,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitNumber: 4,
        axisLabel: {
          color: isDark ? '#64748b' : '#94a3b8',
          fontSize: 9,
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#162744' : '#f1f5f9',
            type: 'dashed',
          },
        },
      },
      series: [
        // Transparent base to make bars float (waterfall behavior)
        {
          name: 'Placeholder',
          type: 'bar',
          stack: 'Total',
          silent: true,
          itemStyle: {
            borderColor: 'transparent',
            color: 'transparent',
          },
          emphasis: {
            itemStyle: {
              borderColor: 'transparent',
              color: 'transparent',
            },
          },
          data: baseData,
        },
        // Floating Loss / Output bars
        {
          name: 'Value',
          type: 'bar',
          stack: 'Total',
          barWidth: '55%',
          label: {
            show: true,
            position: 'top',
            formatter: (param: any) => {
              const idx = param.dataIndex;
              if (idx === 0) return '100%';
              if (idx === 4) return `${param.value}%`;
              return `-${param.value}%`;
            },
            color: isDark ? '#e2e8f0' : '#1e293b',
            fontSize: 9,
            fontWeight: 'bold',
            fontFamily: 'monospace',
          },
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (params: any) => {
              const idx = params.dataIndex;
              if (idx === 0) return '#3b82f6'; // 100% Ideal - Blue
              if (idx === 1) return '#f43f5e'; // Downtime loss - Rose
              if (idx === 2) return '#f97316'; // Speed loss - Orange
              if (idx === 3) return '#eab308'; // Quality reject - Amber
              return '#10b981'; // Final OEE - Emerald
            },
          },
          data: barData,
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
  }, [availability, performance, quality, oee, isDark]);

  const totalLoss = Number((100 - oee).toFixed(1));

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1 pb-1">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            OEE Loss Waterfall
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-medium">Gap:</span>
          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
            -{totalLoss}%
          </span>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="flex-1 w-full min-h-[110px] relative">
        <div ref={chartRef} className="w-full h-full" />
      </div>

      {/* Audit Footnote */}
      <div className={`pt-1 border-t flex items-center justify-between text-[10px] font-mono ${
        isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Avail -{availLossPct}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          Speed -{perfLossPct}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Scrap -{qualLossPct}%
        </span>
      </div>
    </div>
  );
};
