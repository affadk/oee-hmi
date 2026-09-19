import React from 'react';
import { Factory } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ProductionSummaryPanelProps {
  target: number;
  actual: number;
  good: number;
  reject: number;
}

export const ProductionSummaryPanel: React.FC<ProductionSummaryPanelProps> = ({
  target,
  actual,
  good,
  reject,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const achievement = ((actual / target) * 100).toFixed(1);

  return (
    <div className={`rounded-xl p-3 shadow-lg flex flex-col justify-between h-full border transition-colors ${
      isDark ? 'bg-[#0b1528] border-[#162744]' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header matching image.png */}
      <div className="flex items-center gap-2 mb-1 pb-1">
        <div className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <Factory className="w-4 h-4" />
        </div>
        <h3 className={`font-bold text-xs sm:text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Production Summary
        </h3>
      </div>

      {/* 4 Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 py-1 text-center">
        {/* Target */}
        <div className="text-left">
          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target</span>
          <div className={`font-sans font-bold text-xs sm:text-sm md:text-base tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {target.toLocaleString()} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
        </div>

        {/* Actual */}
        <div className="text-left">
          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actual</span>
          <div className={`font-sans font-bold text-xs sm:text-sm md:text-base tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {actual.toLocaleString()} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
        </div>

        {/* Good */}
        <div className="text-left">
          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Good</span>
          <div className={`font-sans font-bold text-xs sm:text-sm md:text-base tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {good.toLocaleString()} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
        </div>

        {/* Reject */}
        <div className="text-left">
          <span className={`text-[10px] block leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reject</span>
          <div className={`font-sans font-bold text-xs sm:text-sm md:text-base tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {reject.toLocaleString()} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>pcs</span>
          </div>
        </div>
      </div>

      {/* Bottom Achievement Progress Bar */}
      <div className={`pt-1.5 flex items-center justify-between gap-3 border-t ${
        isDark ? 'border-[#162744]/60' : 'border-slate-100'
      }`}>
        <div className={`flex-1 h-2.5 rounded-full overflow-hidden p-0.5 ${
          isDark ? 'bg-[#101f38]' : 'bg-slate-100'
        }`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${Math.min(100, Number(achievement))}%` }}
          />
        </div>
        <div className="text-right shrink-0">
          <span className={`text-[10px] block leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Achievement</span>
          <span className={`font-sans font-bold text-xs sm:text-sm leading-none mt-0.5 inline-block ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {achievement}%
          </span>
        </div>
      </div>
    </div>
  );
};
