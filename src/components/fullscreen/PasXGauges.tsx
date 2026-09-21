// /src/components/fullscreen/PasXGauges.tsx

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface PasXDonutGaugeProps {
  label: string; // e.g. "OEE", "AVA", "QUA", "PER"
  value: number; // e.g. 65, 98, 72
  size?: 'large' | 'medium';
  color?: string; // e.g. '#48a43f' (green) or '#eab308' (yellow)
  subtitle?: string; // e.g. "219m / 420m"
  rawLines?: string[]; // raw calculation numbers stacked vertically
  onClick?: () => void;
}

export const PasXDonutGauge: React.FC<PasXDonutGaugeProps> = ({
  label,
  value,
  size = 'medium',
  color = '#48a43f',
  subtitle,
  rawLines,
  onClick,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isLarge = size === 'large';
  const diameter = isLarge ? 140 : 176;
  const strokeWidth = isLarge ? 15 : 16;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const trackColor = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center cursor-pointer select-none transition-transform hover:scale-102 ${
        isLarge ? 'p-2' : 'p-1'
      }`}
      title={`${label}: ${value}% (Click for calculation formula)`}
    >
      <div className="relative flex items-center justify-center" style={{ width: diameter, height: diameter }}>
        <svg width={diameter} height={diameter} className="overflow-visible">
          {/* Background circle track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Value Progress Arc (starts from 12 o'clock, clockwise) */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
            className="transition-all duration-700 ease-out"
          />

        </svg>

        {/* Center Text (Value % and Label) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={`font-sans font-extrabold leading-none tracking-tight ${
              isLarge ? 'text-4xl sm:text-5xl' : 'text-[26px] sm:text-[30px]'
            }`}
            style={{ color }}
          >
            {Math.round(value)}%
          </span>
          <span
            className={`font-sans font-bold uppercase tracking-wider mt-1 ${
              isLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            }`}
            style={{ color }}
          >
            {label}
          </span>
        </div>
      </div>
      {rawLines && rawLines.length > 0 ? (
        <div className="flex flex-col items-center mt-2 space-y-0.5 font-mono text-xs leading-relaxed">
          {rawLines.map((line, idx) => {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              const key = line.slice(0, colonIndex).trim();
              const val = line.slice(colonIndex + 1).trim();
              return (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-400">
                    {key}:
                  </span>
                  <span className={`text-xs font-semibold ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {val}
                  </span>
                </div>
              );
            }
            return (
              <span
                key={idx}
                className={`text-xs ${isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}`}
              >
                {line}
              </span>
            );
          })}
        </div>
      ) : subtitle ? (
        <span className={`text-xs font-mono font-medium mt-1 text-center whitespace-nowrap ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {subtitle}
        </span>
      ) : null}
    </div>
  );
};

interface PasXTachometerGaugeProps {
  currentRate: number; // e.g. 203
  targetRate: number;  // e.g. 400
  unit?: string;       // e.g. "pcs/h"
}

export const PasXTachometerGauge: React.FC<PasXTachometerGaugeProps> = ({
  currentRate,
  targetRate,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const width = 196;
  const height = 108;
  const strokeWidth = 18;
  const radius = 76;
  const cx = width / 2;
  const cy = height - 4;

  // Semi-circle arc length = PI * radius
  const arcLength = Math.PI * radius;
  const ratio = targetRate > 0 ? Math.min(1, Math.max(0, currentRate / targetRate)) : 0;
  const strokeDashoffset = arcLength - ratio * arcLength;

  const trackColor = isDark ? '#1e293b' : '#e2e8f0';
  const progressColor = '#eab308'; // Werum PAS-X yellow/amber tachometer arc

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          {/* Background Semi-circle Arc (from 180 deg to 0 deg) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />

          {/* Progress Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Needle Marker Indicator */}
        <div
          className="absolute origin-bottom transition-transform duration-700 pointer-events-none"
          style={{
            left: cx - 1.5,
            bottom: 5,
            width: 3,
            height: radius + 6,
            transform: `rotate(${ratio * 180 - 90}deg)`,
          }}
        >
          <div className="w-full h-full bg-slate-700 dark:bg-slate-300 rounded-t-full shadow-sm" />
        </div>

        {/* Pivot circle */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-slate-800 dark:bg-slate-200 border-2 border-white dark:border-slate-900 shadow-md"
          style={{ left: cx - 7, bottom: 0 }}
        />
      </div>
    </div>
  );
};
