// /src/presentation/components/charts/PasXDonutGauge.tsx
// Donut gauge component — circular progress with center value + label text.
// Extracted from PasXGauges.tsx for single-responsibility.

import React from "react";
import { useTheme } from "../../providers/ThemeProvider";

export interface PasXDonutGaugeProps {
  label: string; // e.g. "OEE", "AVA", "QUA", "PER"
  value: number; // e.g. 65, 98, 72
  size?: "large" | "medium";
  color?: string; // e.g. '#48a43f' (green) or '#eab308' (yellow)
  subtitle?: string; // e.g. "219m / 420m"
  rawLines?: string[]; // raw calculation numbers stacked vertically
  onClick?: () => void;
}

export const PasXDonutGauge: React.FC<PasXDonutGaugeProps> = ({
  label,
  value,
  size = "medium",
  color = "#48a43f",
  subtitle,
  rawLines,
  onClick,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isLarge = size === "large";
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

  const trackColor = isDark ? "#1e293b" : "#cbd5e1";

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
      className={`flex flex-col items-center justify-center cursor-pointer select-none transition-transform hover:scale-102 min-h-0 min-w-0 ${
        isLarge ? "shrink-0 p-2" : "shrink p-0.5"
      } h-full max-h-full max-w-full`}
      title={`${label}: ${value}% (Click for calculation formula)`}
      style={{ flex: isLarge ? "0 0 auto" : "1 1 0" }}
    >
      <div
        className="flex items-center justify-center min-h-0 min-w-0"
        style={{
          flex: "1 1 0",
          aspectRatio: "1 / 1",
          maxWidth: "100%",
          maxHeight: "100%",
          minWidth: isLarge ? "200px" : "120px",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${diameter} ${diameter}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible block"
        >
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
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
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
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {label.toUpperCase()}
          </text>
        </svg>
      </div>
      {rawLines && rawLines.length > 0 ? (
        <div
          className="flex flex-col items-center space-y-0 font-mono shrink-0"
          style={{
            marginTop: "0.6vh",
            fontSize: "clamp(11px, 1.7vh, 14px)",
            lineHeight: 1.35,
          }}
        >
          {rawLines.map((line, idx) => {
            const colonIndex = line.indexOf(":");
            if (colonIndex !== -1) {
              const key = line.slice(0, colonIndex).trim();
              const val = line.slice(colonIndex + 1).trim();
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 whitespace-nowrap"
                >
                  <span
                    className={`font-bold font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {key}:
                  </span>
                  <span
                    className={`font-semibold ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {val}
                  </span>
                </div>
              );
            }
            return (
              <span
                key={idx}
                className={`whitespace-nowrap ${isDark ? "text-slate-300 font-medium" : "text-slate-600 font-medium"}`}
              >
                {line}
              </span>
            );
          })}
        </div>
      ) : subtitle ? (
        <span
          className={`text-xs font-mono font-medium mt-1 text-center whitespace-nowrap ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {subtitle}
        </span>
      ) : null}
    </div>
  );
};
