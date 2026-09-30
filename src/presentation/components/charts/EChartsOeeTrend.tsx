// /src/presentation/components/echarts/EChartsOeeTrend.tsx

import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkAreaComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { TooltipComponentFormatterCallbackParams } from 'echarts';
import { HourlyDataPoint } from '../../../domain/index';
import { useTheme } from '../../providers/ThemeProvider';
import { Radio } from 'lucide-react';
import { fluid, containerScale, scaledFont } from '../../utils/fluidType';
import { streamWord } from '../../utils/statusWords';

echarts.use([LineChart, GridComponent, TooltipComponent, MarkAreaComponent, CanvasRenderer]);

interface EChartsOeeTrendProps {
  hourlyTrends: HourlyDataPoint[];
  isBuffered?: boolean;
  title?: string;
  height?: number;
  shiftStart?: string;
  shiftEnd?: string;
  showBenchmark?: boolean;
  breakTimeWindow?: string;
  /** Live 5m overlay (B5 aggregate, B2 history fallback); null = hidden. */
  livePoints?: Array<{ timestamp: string; oee: number }> | null;
}

export const EChartsOeeTrend: React.FC<EChartsOeeTrendProps> = ({
  hourlyTrends,
  isBuffered = false,
  title = 'OEE Shift Trend',
  height,
  shiftStart,
  shiftEnd,
  showBenchmark = false,
  breakTimeWindow,
  livePoints = null,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Tampilkan jam saja (HH:mm) — tanggal sudah ada di timestamp header.
  // Backend mengirim bucket ISO (2026-09-22T10:00:00.000Z), seed memakai "HH:mm".
  const formatHourLabel = (raw: string): string => {
    if (!raw) return '--';
    const tIdx = raw.indexOf('T');
    if (tIdx >= 0 && raw.length >= tIdx + 6) return raw.slice(tIdx + 1, tIdx + 6);
    const m = raw.match(/(\d{2}:\d{2})/);
    if (m) return m[1] ?? raw;
    return raw;
  };

  const toMinutes = (hhmm: string): number | null => {
    const m = hhmm.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };

  // Urutkan menaik + batasi ke jendela shift (Mulai–Selesai).
  // Backend mengembalikan 72 bucket terakhir tanpa filter waktu, jadi tanpa ini
  // grafik tampil acak / lintas hari dan judul (start - end) bisa terbalik.
  const visibleTrends = useMemo(() => {
    const sorted = [...hourlyTrends].sort((a, b) => {
      const ta = Date.parse(a.hour);
      const tb = Date.parse(b.hour);
      if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
      return a.hour.localeCompare(b.hour);
    });
    const sMin = shiftStart ? toMinutes(shiftStart) : null;
    const eMin = shiftEnd ? toMinutes(shiftEnd) : null;
    if (sMin == null || eMin == null) return sorted;
    return sorted.filter((d) => {
      const t = toMinutes(formatHourLabel(d.hour));
      if (t == null) return true;
      if (eMin <= sMin) return t >= sMin || t <= eMin; // shift malam melewati tengah malam
      return t >= sMin && t <= eMin;
    });
  }, [hourlyTrends, shiftStart, shiftEnd]);

  const startHour = visibleTrends.length > 0 ? formatHourLabel(visibleTrends[0]?.hour ?? '') : '00:00';
  const endHour = visibleTrends.length > 0 ? formatHourLabel(visibleTrends[visibleTrends.length - 1]?.hour ?? '') : '08:00';

  // Ukur kontainer aktual (bukan viewport): font canvas ECharts harus angka,
  // jadi skala dihitung dari box terukur terhadap referensi desain 860x250.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const trendK = containerScale(box.w, box.h, 860, 250);
  const fsAxis = scaledFont(12, trendK, 10, 17);
  const fsTip = scaledFont(13, trendK, 11, 17);
  const fsMark = scaledFont(12, trendK, 10, 16);

  // Jendela istirahat (planned downtime) "02:00 - 03:00" -> menit, untuk markArea + tooltip.
  // Di luar jendela ini = waktu running.
  const breakRange = useMemo(() => {
    if (!breakTimeWindow) return null;
    const m = breakTimeWindow.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const s = (Number(m[1]) % 24) * 60 + (Number(m[2]) % 60);
    let e = (Number(m[3]) % 24) * 60 + (Number(m[4]) % 60);
    if (e <= s) e += 24 * 60;
    return { s, e };
  }, [breakTimeWindow]);

  const isBreakHour = (hhmm: string): boolean => {
    if (!breakRange) return false;
    const t = toMinutes(hhmm);
    if (t == null) return false;
    const span = breakRange.e - breakRange.s;
    if (span >= 24 * 60) return true;
    // samakan basis hari: geser t ke dekat s bila jendela melewati tengah malam
    let tt = t;
    if (breakRange.e > 24 * 60 && tt < breakRange.s) tt += 24 * 60;
    return tt >= breakRange.s && tt <= breakRange.e;
  };

  useEffect(() => {
    if (!chartRef.current) return;
    const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const hours = visibleTrends.map((d) => formatHourLabel(d.hour));
    const oeeData = visibleTrends.map((d) => d.oee);
    const availData = visibleTrends.map((d) => d.availability);
    const perfData = visibleTrends.map((d) => d.performance);
    const qualData = visibleTrends.map((d) => d.quality);

    // Overlay live 5m (B5/B2): petakan ke label sumbu-X yang terlihat, null = gap.
    const liveData: Array<number | null> = hours.map(() => null);
    let hasLive = false;
    for (const p of livePoints ?? []) {
      const idx = hours.indexOf(formatHourLabel(p.timestamp));
      if (idx >= 0) {
        liveData[idx] = p.oee;
        hasLive = true;
      }
    }

    // Arsiran biru pada jam-jam istirahat (planned downtime); sisanya = running.
    // SCOPE FREEZE 2026-09-25 (produk D2): grafik HANYA menandai jam produksi
    // + istirahat. JANGAN tambah shading breakdown tak terjadwal / tombol fisik
    // → timeline realtime tanpa persetujuan eksplisit produk.
    // markArea memakai label kategori sumbu-X yang terlihat agar selalu menempel.
    const breakLabels = hours.filter((h) => isBreakHour(h));
    const breakMarkArea =
      breakLabels.length > 0
        ? {
            silent: true,
            itemStyle: {
              color: '#2563eb',
              opacity: 0.12,
              borderColor: '#2563eb',
              borderWidth: 1,
              borderType: 'dashed' as const,
            },
            label: {
              show: true,
              formatter: 'Istirahat',
              position: 'insideTop' as const,
              color: '#60a5fa',
              fontSize: fsMark,
              fontFamily: 'Inter, sans-serif',
            },
            data: [
              [{ xAxis: breakLabels[0] }, { xAxis: breakLabels[breakLabels.length - 1] }] as [
                { xAxis: string },
                { xAxis: string },
              ],
            ],
          }
        : undefined;

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#0b1528' : '#ffffff',
        borderColor: isDark ? '#1e3a5f' : '#cbd5e1',
        borderWidth: 1,
        textStyle: {
          color: isDark ? '#e2e8f0' : '#0f172a',
          fontSize: fsTip,
          fontFamily: 'Inter, sans-serif',
        },
        formatter: (params: TooltipComponentFormatterCallbackParams) => {
          if (!Array.isArray(params)) return '';
          // axisValue is present at runtime on axis-trigger frames but absent
          // from echarts' TopLevelFormatterParams type — read defensively.
          const axisValue = (params[0] as { axisValue?: unknown } | undefined)?.axisValue;
          const inBreak = isBreakHour(String(axisValue ?? ''));
          // G9: status FSM backend per bucket bila ada; fallback komplemen-istirahat.
          const trendIdx = hours.indexOf(String(axisValue ?? ''));
          const backendState = trendIdx >= 0 ? visibleTrends[trendIdx]?.backendState ?? null : null;
          const stateLabel = backendState ?? (inBreak ? 'Istirahat' : 'Berjalan');
          let tip = `<div class="font-bold mb-1 font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}">Time: ${String(axisValue ?? '')} · ${stateLabel}</div>`;
          params.forEach((p) => {
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
        axisTick: {
          alignWithLabel: true,
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#1e293b' : '#cbd5e1',
          },
        },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: fsAxis,
          fontFamily: 'monospace',
          hideOverlap: true,
          margin: 8,
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
          fontSize: fsAxis,
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
          ...(breakMarkArea ? { markArea: breakMarkArea } : {}),
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
        ...(hasLive
          ? [
              {
                name: 'Live 5m',
                type: 'line' as const,
                smooth: true,
                symbol: 'none',
                lineStyle: {
                  width: 2,
                  color: '#22d3ee',
                  type: 'dashed' as const,
                },
                data: liveData,
              },
            ]
          : []),
      ],
    };

    // notMerge=true agar sumbu-X selalu mengikuti panjang data terbaru
    // (realtime): tidak ada sisa label lama yang bikin grafik terpotong di awal.
    chartInstance.setOption(option, true);

    const el = chartRef.current;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) =>
        Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1
          ? prev
          : { w: r.width, h: r.height },
   );
};

    measure();
    const ro = new ResizeObserver(() => {
      chartInstance.resize();
      measure();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chartInstance.dispose();
    };
  }, [visibleTrends, livePoints, isDark, box.w, box.h]);

  return (
    <div className={`rounded-xl p-3.5 shadow-lg flex flex-col h-full border ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header with Title & Legend */}
      <div className="flex flex-wrap items-center justify-between mb-1 pb-1 gap-2">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: fluid(13, 1.9, 17) }}>
            {title} <span className={`font-mono font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>({startHour} - {endHour})</span>
          </h3>
          <span className={`font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold border ${
            isBuffered
              ? isDark ? 'bg-amber-950/60 text-amber-400 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-300'
              : isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
          }`} style={{ fontSize: fluid(10, 1.4, 13) }}>
            <Radio className="w-2.5 h-2.5" />
            {streamWord(isBuffered)}
          </span>
          {showBenchmark && (
            <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold" style={{ fontSize: fluid(10, 1.4, 13) }}>
              Target Benchmark 85%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3" style={{ fontSize: fluid(10, 1.5, 14) }}>
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
          {breakRange && (
            <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2 h-2 rounded-[2px] bg-[#2563eb]"></span> Istirahat
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas — flex-1 mengisi sisa tinggi kartu (full), bukan fixed px */}
      <div
        className="flex-1 w-full min-h-0"
        style={height ? { minHeight: `${height}px` } : { minHeight: 0 }}
        ref={chartRef}
      />
    </div>
  );
};

export default EChartsOeeTrend;
