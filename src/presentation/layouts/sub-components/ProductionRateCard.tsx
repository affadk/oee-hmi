// /src/presentation/layouts/sub-components/ProductionRateCard.tsx
// Production rate card — tachometer gauge + live/target rate numbers (right upper panel).

import React from 'react';
import { PasXTachometerGauge } from '../../components/charts/PasXTachometerGauge';
import { fluid } from '../../utils/fluidType';

export interface ProductionRateCardProps {
  currentRate: number;
  targetRate: number;
  targetCycleTimeSec: number;
  actualCycleTimeSec: string;
  speedEffRatio: number;
  speedEffPct: number;
  speedEffColor: string;
  isDark: boolean;
}

export const ProductionRateCard: React.FC<ProductionRateCardProps> = ({
  currentRate,
  targetRate,
  targetCycleTimeSec,
  actualCycleTimeSec,

  speedEffPct,
  speedEffColor,
  isDark,
}) => {
  return (
    <div
      id="production-rate-card"
      className={`p-[clamp(8px,1vh,12px)] rounded-xl border shadow-sm transition-colors flex-1 min-h-0 overflow-hidden flex flex-col ${
        isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-[0.6vh] shrink-0">
        <h3 className={`font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontSize: fluid(14, 2.1, 19) }}>Production Rate</h3>
        <span className={`font-mono font-semibold px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>
          CT: {targetCycleTimeSec}s · Target: {targetRate} pcs/h
        </span>
      </div>

      {/* Layered body: tachometer chart di belakang, angka di depon */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Chart layer (belakang) */}
        <div className="absolute inset-x-0 bottom-[0.5vh] top-[26%] flex items-end justify-center pb-[0.2vh] pointer-events-none" aria-hidden="true">
          <div className="max-h-full" style={{ width: 'min(90%, 320px)', aspectRatio: '196 / 108' }}>
            <PasXTachometerGauge currentRate={currentRate} targetRate={targetRate} />
          </div>
        </div>

        {/* Numbers layer (depan) */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-[0.5vw] pt-[0.4vh] pointer-events-none">
          <div className="flex flex-col drop-shadow-sm">
            <span className={`font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: fluid(26, 4.2, 44) }}>{currentRate}</span>
            <span className={`font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontSize: fluid(11, 1.7, 15) }}>Current Rate (pcs/h)</span>
            <span className={`font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>Actual: {actualCycleTimeSec}s/pcs</span>
          </div>
          <div className="flex flex-col items-end drop-shadow-sm text-right">
            <span className={`font-black font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: fluid(26, 4.2, 44) }}>{targetRate}</span>
            <span className={`font-semibold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontSize: fluid(11, 1.7, 15) }}>Target Rate (pcs/h)</span>
            <span className={`font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontSize: fluid(11, 1.6, 14) }}>Ideal: {targetCycleTimeSec}s/pcs</span>
          </div>
        </div>

        {/* Speed Eff indicator */}
        <div className="absolute bottom-[0.4vh] right-[0.5vw] z-10 flex flex-col items-end drop-shadow-sm text-right pointer-events-none">
          <span className={`font-mono font-black leading-none ${speedEffColor}`} style={{ fontSize: fluid(28, 4.6, 48) }}>{speedEffPct}%</span>
          <span className={`font-semibold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontSize: fluid(11, 1.7, 15) }}>Speed Eff</span>
        </div>
      </div>

      {/* Footer: cycle time formula */}
      <div className="flex items-center justify-center font-mono font-semibold mt-[0.4vh] pt-[0.6vh] border-t border-slate-100 dark:border-slate-800 shrink-0" style={{ fontSize: fluid(11, 1.6, 14) }}>
        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
          3600 / {targetCycleTimeSec}s = {targetRate} pcs/h
        </span>
      </div>
    </div>
  );
};
