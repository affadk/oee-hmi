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
  // Diameter viewBox — semua elemen teks dihitung sebagai fraksi diameter
  // sehingga ukuran font selalu relatif & proporsional terhadap circular chart
  // (SVG scaling: teks ikut membesar/mengecil bersama chart).
  const diameter = isLarge ? 210 : 176;
  const strokeWidth = Math.round(diameter * 0.09);
  // Rasio font relatif terhadap diameter — diperbesar dari sebelumnya:
  // value ~23% diameter, label ~10.5% diameter.
  const valueFontSize = diameter * 0.23;
  const labelFontSize = diameter * 0.105;
  const textGap = diameter * 0.03;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const trackColor = isDark ? '#1e293b' : '#cbd5e1';

  // Blok teks tengah di-center vertikal di sekitar titik tengah chart.
  // Karena dirender sebagai SVG <text> dalam viewBox yang sama,
  // ukurannya otomatis relatif & ikut skala bersama circular chart.
  const cx = diameter / 2;
  const cy = diameter / 2;
  const blockHeight = valueFontSize + textGap + labelFontSize;
  const valueCenterY = cy - blockHeight / 2 + valueFontSize / 2;
  const labelCenterY = cy + blockHeight / 2 - labelFontSize / 2;

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center cursor-pointer select-none transition-transform hover:scale-102 min-h-0 min-w-0 shrink-0 h-full max-h-full ${
        isLarge ? 'p-2' : 'p-0.5'
      }`}
      title={`${label}: ${value}% (Click for calculation formula)`}
    >
      <div className="flex items-center justify-center min-h-0 min-w-0" style={{ flex: '1 1 0', aspectRatio: '1 / 1', maxWidth: '100%', maxHeight: '100%' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${diameter} ${diameter}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible block">
          {/* Background circle track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Value Progress Arc (starts from 12 o'clock, clockwise) */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-700 ease-out"
          />

          {/* Center Text — font-size dalam unit viewBox => relatif terhadap chart */}
          <text
            x={cx}
            y={valueCenterY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={valueFontSize}
            fontWeight={800}
            letterSpacing="-0.02em"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
          >
            {Math.round(value)}%
          </text>
          <text
            x={cx}
            y={labelCenterY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={labelFontSize}
            fontWeight={700}
            letterSpacing="0.08em"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
          >
            {label.toUpperCase()}
          </text>
        </svg>
      </div>
      {rawLines && rawLines.length > 0 ? (
        <div className="flex flex-col items-center space-y-0 font-mono shrink-0" style={{ marginTop: '0.6vh', fontSize: 'clamp(11px, 1.7vh, 14px)', lineHeight: 1.35 }}>
          {rawLines.map((line, idx) => {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              const key = line.slice(0, colonIndex).trim();
              const val = line.slice(colonIndex + 1).trim();
              return (
                <div key={idx} className="flex items-center gap-1 whitespace-nowrap">
                  <span className={`font-bold font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {key}:
                  </span>
                  <span className={`font-semibold ${
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
                className={`whitespace-nowrap ${isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}`}
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

  const trackColor = isDark ? '#1e293b' : '#cbd5e1';
  const progressColor = '#eab308'; // Werum PAS-X yellow/amber tachometer arc
  const needleColor = isDark ? '#cbd5e1' : '#334155';
  const pivotFill = isDark ? '#e2e8f0' : '#1e293b';
  const pivotStroke = isDark ? '#0f172a' : '#ffffff';
  const needleAngle = ratio * 180 - 90;

  return (
    <div className="flex items-center justify-center select-none w-full h-full">
      <div className="relative w-full h-full" style={{ aspectRatio: `${width} / ${height}`, maxWidth: '100%', maxHeight: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMax meet" className="overflow-visible block">
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

          {/* Needle Marker Indicator — SVG agar ikut skala container */}
          <g transform={`rotate(${needleAngle} ${cx} ${cy})`} className="transition-all duration-700">
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - (radius + 6)}
              stroke={needleColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </g>

          {/* Pivot circle */}
          <circle cx={cx} cy={cy} r={7} fill={pivotFill} stroke={pivotStroke} strokeWidth={2} />
        </svg>
      </div>
    </div>
  );
};
