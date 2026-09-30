// /src/components/fullscreen/PasXProgressStrip.tsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../../../providers/ThemeProvider";
import { MachineConfig, CalculatedOeeMetrics } from "../../../../../domain/index";
import {
  buildShiftTimeline,
  clockLabel,
  formatDuration,
  type TimelineKind,
  type TimelineSegment,
} from "../../../../../domain/services/ShiftTimeline";

interface PasXProgressStripProps {
  machine: MachineConfig;
  metrics: CalculatedOeeMetrics;
  /** true = lane backend: kursor murni jam dinding (tanpa loop demo). */
  useBackend?: boolean;
  /** Fase 2 server timeline (§3.2); null = client buildShiftTimeline. */
  serverSegments?: TimelineSegment[] | null;
}

interface TimelineEvent {
  key: string;
  type:
    | "Breakdown"
    | "Active"
    | "Changeover"
    | "Waiting"
    | "Planned"
    | "Undefined";
  label: string;
  startTime: string;
  endTime: string;
  duration: string;
  color: string;
  startHourFraction: number;
  durationFraction: number;
}

const KIND_COLOR: Record<TimelineKind, string> = {
  Active: "#48a43f",
  Changeover: "#eab308",
  Waiting: "#eab308",
  Breakdown: "#dc2626",
  Planned: "#2563eb",
  Undefined: "#64748b",
};

const getEventColorTheme = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "Active":
      return {
        bannerBg: "bg-emerald-50 dark:bg-[#0a211a]",
        bannerBorder: "border-emerald-500/60 dark:border-[#157a55]",
        badgeBg: "bg-[#22c55e]",
        badgeText: "text-[#052e16]",
        accentText: "text-emerald-700 dark:text-emerald-300",
        highlightBorder: "#22c55e",
      };
    case "Breakdown":
      return {
        bannerBg: "bg-rose-50 dark:bg-[#241114]",
        bannerBorder: "border-rose-500/60 dark:border-[#a12335]",
        badgeBg: "bg-[#ef4444]",
        badgeText: "text-white",
        accentText: "text-rose-700 dark:text-rose-300",
        highlightBorder: "#ef4444",
      };
    case "Changeover":
    case "Waiting":
      return {
        bannerBg: "bg-amber-50 dark:bg-[#211a08]",
        bannerBorder: "border-amber-500/60 dark:border-[#8a6d1c]",
        badgeBg: "bg-[#eab308]",
        badgeText: "text-[#451a03]",
        accentText: "text-amber-800 dark:text-amber-300",
        highlightBorder: "#eab308",
      };
    case "Planned":
      return {
        bannerBg: "bg-blue-50 dark:bg-[#0e1c33]",
        bannerBorder: "border-blue-500/60 dark:border-[#1d4ed8]",
        badgeBg: "bg-[#2563eb]",
        badgeText: "text-white",
        accentText: "text-blue-700 dark:text-blue-300",
        highlightBorder: "#2563eb",
      };
    default:
      return {
        bannerBg: "bg-slate-100 dark:bg-[#131a26]",
        bannerBorder: "border-slate-400/60 dark:border-slate-600",
        badgeBg: "bg-slate-500",
        badgeText: "text-white",
        accentText: "text-slate-700 dark:text-slate-300",
        highlightBorder: "#64748b",
      };
  }
};

const parseShiftHM = (hm: string | undefined, fallbackMin: number): number => {
  if (!hm) return fallbackMin;
  const m = hm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallbackMin;
  return (
    (parseInt(m[1] ?? "0", 10) % 24) * 60 + (parseInt(m[2] ?? "0", 10) % 60)
  );
};

const formatHM = (totalMin: number): string => {
  const norm = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}`;
};

export const PasXProgressStrip: React.FC<PasXProgressStripProps> = ({
  machine,
  useBackend = false,
  serverSegments = null,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );

  // Real shift window (start → end) dari konfigurasi mesin.
  // Lane backend: null bila jobConfig kosong (tidak ada data dari API) —
  // tanpa fallback '22:00'/'08:00' yang memalsukan kanvas shift.
  const shiftStartStr = useBackend
    ? machine?.jobConfig?.shiftStart || null
    : (machine?.jobConfig?.shiftStart ?? "22:00");
  const shiftEndStr = useBackend
    ? machine?.jobConfig?.shiftEnd || null
    : (machine?.jobConfig?.shiftEnd ?? "08:00");

  const parseBackendHM = (hm: string | null): number | null => {
    if (!hm) return null;
    const m = hm.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return (parseInt(m[1] ?? "0", 10) % 24) * 60 + (parseInt(m[2] ?? "0", 10) % 60);
  };

  // For backend mode: ALL values null if no data from API (no hardcoded dummies).
  const startMin = useBackend
    ? parseBackendHM(shiftStartStr)
    : parseShiftHM(shiftStartStr ?? "22:00", 22 * 60);
  const endMinRaw = useBackend
    ? parseBackendHM(shiftEndStr)
    : parseShiftHM(shiftEndStr ?? "08:00", 8 * 60);
  // Overnight wrap berlaku untuk kedua lane (backend 22:00→06:00 tetap 8 jam).
  const endMin =
    endMinRaw != null && startMin != null && endMinRaw <= startMin
      ? endMinRaw + 24 * 60
      : endMinRaw;
  const windowMin =
    startMin != null && endMin != null
      ? Math.max(60, endMin - startMin)
      : null;
  const windowH = windowMin != null ? windowMin / 60 : null;

  // Segmen timeline nyata dari data mesin (downtimeReasons + window shift),
  // bukan mock statis. Changeover = label SETUP_AND_ADJUSTMENT, bukan FSM baru.
  // Fase 2: segmen server (§3.2) menang bila ada; fallback komposisi klien
  // hanya dari data nyata. Kalau window backend tidak ada => timeline kosong.
  const SHIFT_EVENTS: TimelineEvent[] = useMemo(() => {
    const hasWindow = windowMin != null && startMin != null;
    const segments =
      serverSegments ??
      (hasWindow ? buildShiftTimeline(machine, windowMin) : []);
    const base = startMin ?? 0;
    return segments.map((seg) => {
      const startClock = clockLabel(base, seg.startOffsetMin);
      const endClock = clockLabel(
        base,
        seg.startOffsetMin + seg.durationMinutes,
      );
      return {
        key: seg.key,
        type: seg.kind,
        label: seg.label,
        startTime: startClock,
        endTime: endClock,
        duration: formatDuration(seg.durationMinutes),
        color: KIND_COLOR[seg.kind],
        startHourFraction: seg.startOffsetMin / 60,
        durationFraction: seg.durationMinutes / 60,
      };
    });
  }, [machine, windowMin, serverSegments]);

  // Live clock — penanda real-time, refresh tiap detik
  const [now, setNow] = useState(() => new Date());
  const mountedRef = useRef<number | null>(null);
  if (mountedRef.current === null) mountedRef.current = Date.now();
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  // Safe calculations - handle null windowMin for backend mode with no data
  const nowMinOfDay =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let nowRelMin = 0;
  if (windowMin != null && startMin != null) {
    nowRelMin = nowMinOfDay - startMin;
    if (nowRelMin < 0) nowRelMin += 24 * 60;
  }
  const realFrac = windowMin ? nowRelMin / windowMin : 0;
  const realInside = realFrac >= 0 && realFrac <= 1;
  // Lane backend: kursor murni jam dinding. Di luar window shift, kursor
  // dijepit ke tepi (tanpa loop demo yang memalsukan posisi LIVE).
  // Lane simulasi: bila jam dinding di luar window, kursor berjalan
  // di dalam window mengikuti laju jam nyata (loop), agar penanda selalu tampil.
  const elapsedMin = Math.max(
    0,
    (now.getTime() - (mountedRef.current ?? now.getTime())) / 60000,
  );
  const demoRelMin = windowMin ? (windowMin * 0.3 + elapsedMin) % windowMin : 0;
  const useRealCursor = useBackend || realInside;
  const cursorRelMin = windowMin
    ? useRealCursor
      ? Math.min(Math.max(nowRelMin, 0), windowMin)
      : demoRelMin
    : 0;
  const livePct = windowMin
    ? Math.min(99, Math.max(1, (cursorRelMin / windowMin) * 100))
    : 0;
  const cursorClockMin = useRealCursor
    ? nowMinOfDay
    : windowMin && startMin != null
      ? (((startMin + demoRelMin) % 1440) + 1440) % 1440
      : 0;
  const cursorSec = useRealCursor
    ? now.getSeconds()
    : Math.floor((demoRelMin * 60) % 60);
  const liveLabel = windowMin
    ? `LIVE ${formatHM(cursorClockMin)}:${String(cursorSec).padStart(2, "0")}`
    : "LIVE --:--:--";
  const liveFullStamp = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${formatHM(nowMinOfDay)}:${String(now.getSeconds()).padStart(2, "0")}`;

  // Tick per jam dari start hingga end shift - handle null windowMin
  const hours: string[] = [];
  if (windowMin != null && startMin != null) {
    for (let m = 0; m <= windowMin + 1; m += 60)
      hours.push(formatHM(startMin + m));
  }
  const liveHour = windowMin
    ? formatHM(cursorClockMin - (cursorClockMin % 60))
    : "--:--";

  const shiftNumber =
    useBackend && !shiftStartStr
      ? "Shift -"
      : shiftStartStr === "22:00" || shiftStartStr === "23:00"
        ? "Shift 3"
        : shiftStartStr === "15:00" || shiftStartStr === "14:00"
          ? "Shift 2"
          : "Shift 1";

  // Segmen event dipetakan proporsional terhadap window shift (bukan 10 jam fixed)
  const segPct = (evt: TimelineEvent) => {
    if (windowH == null) return { startPct: 0, widthPct: 0 };
    const startPct = Math.min(
      100,
      Math.max(0, (evt.startHourFraction / windowH) * 100),
    );
    const widthPct = Math.max(
      0,
      Math.min((evt.durationFraction / windowH) * 100, 100 - startPct),
    );
    return { startPct, widthPct };
  };
  const usedPct = SHIFT_EVENTS.reduce(
    (acc, evt) => acc + segPct(evt).widthPct,
    0,
  );
  const fillerPct = Math.max(0, 100 - usedPct);

  // Auto-follow: bila tidak ada pilihan manual, ikuti segmen pada posisi kursor realtime.
  // Fallback ke segmen terdekat (pertama/terakhir) agar banner live tidak pernah
  // menghilang saat kursor tepat di tepi window (mis. jam dinding di luar shift
  // pada lane backend yang kursornya dijepit ke tepi).
  const cursorH = cursorRelMin / 60;
  const autoEvent =
    SHIFT_EVENTS.find(
      (evt) =>
        cursorH >= evt.startHourFraction &&
        cursorH < evt.startHourFraction + evt.durationFraction,
    ) ??
    (windowH != null && cursorH >= windowH
      ? SHIFT_EVENTS[SHIFT_EVENTS.length - 1]
      : SHIFT_EVENTS[0]) ??
    null;
  const displayEvent = selectedEvent ?? autoEvent;
  const isAutoFollow = selectedEvent === null && autoEvent !== null;
  const displayTheme = displayEvent
    ? getEventColorTheme(displayEvent.type)
    : null;

  return (
    <div
      id="shift-progress-fullwidth-card"
      className="h-full min-h-0 w-full flex flex-col overflow-hidden bg-transparent"
    >
      {/* Header — tanpa background section, hanya judul + legenda */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pb-[0.8vh] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h4
            className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Progress & Shift Timeline
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#48a43f]" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              Active
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#eab308]" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              Changeover
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#dc2626]" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              Breakdown
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 min-w-[10px] min-h-[10px] rounded-xs bg-[#2563eb]" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>
              Planned (Istirahat)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-header Shift — teks biasa, bukan badge; live stamp real-time */}
      <div className="shrink-0 pt-[0.6vh] flex flex-wrap items-baseline gap-x-2">
        <span
          className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-700"}`}
        >
          {shiftNumber}
        </span>
        <span
          className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          ({shiftStartStr ?? "-"} - {shiftEndStr ?? "-"}) · {liveFullStamp}
        </span>
      </div>

      {/* Horizontal grid — detail dibuat kompak proporsional dengan grafik */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-[0.8vw] pt-[0.6vh] overflow-hidden items-center">
        {/* LEFT: Detail — pilihan manual, atau otomatis mengikuti segmen pada kursor realtime */}
        <div className="col-span-12 lg:col-span-4 min-h-0 flex items-center overflow-hidden self-center">
          {displayEvent && displayTheme ? (
            <div
              className={`border rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-200 w-full overflow-hidden ${displayTheme.bannerBg} ${displayTheme.bannerBorder}`}
            >
              <span
                className={`${displayTheme.badgeBg} ${displayTheme.badgeText} px-2.5 py-1 font-extrabold rounded-md text-xs uppercase tracking-wide shrink-0 leading-none`}
              >
                {displayEvent.type}
              </span>
              <div className="min-w-0 flex-1 flex flex-col gap-1 overflow-hidden">
                <span className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight truncate">
                  {displayEvent.label}
                </span>
                <span className="font-mono text-xs leading-none truncate text-slate-500 dark:text-slate-400">
                  {displayEvent.startTime.split(" - ")[1] ||
                    displayEvent.startTime}{" "}
                  —{" "}
                  {displayEvent.endTime.split(" - ")[1] || displayEvent.endTime}{" "}
                  · {displayEvent.duration}
                </span>
              </div>
              {isAutoFollow && (
                <span
                  className="flex items-center gap-1 shrink-0 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap"
                  title="Mengikuti posisi waktu berjalan"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  LIVE
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-lg px-3 py-2 flex items-center gap-3 w-full overflow-hidden border border-dashed border-slate-300 dark:border-slate-700">
              <span className="px-2.5 py-1 font-extrabold rounded-md text-xs uppercase tracking-wide shrink-0 leading-none bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                —
              </span>
              <div className="min-w-0 flex-1 flex flex-col gap-1 overflow-hidden">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[15px] leading-tight truncate">
                  {SHIFT_EVENTS.length === 0
                    ? "Tidak ada data timeline dari backend"
                    : "Tidak ada segmen terpilih"}
                </span>
                <span className="font-mono text-xs leading-none truncate text-slate-400 dark:text-slate-500">
                  {SHIFT_EVENTS.length === 0
                    ? "0 segmen · menunggu data backend"
                    : `Klik segmen timeline untuk detail · ${liveLabel}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Timeline — 8 cols, tinggi relatif vh */}
        <div className="col-span-12 lg:col-span-8 min-h-0 flex flex-col justify-center gap-[0.6vh] overflow-hidden">
          {/* Pointer lane — hanya segitiga realtime (biru).
              Sembunyikan bila tidak ada window shift (backend tanpa data). */}
          {windowMin != null && (
            <div className="relative w-full h-[0.8vh] min-h-[6px] shrink-0 pointer-events-none">
              <div
                style={{ left: `${livePct}%` }}
                className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 z-40"
              >
                <div className="w-0 h-0 border-x-[0.5vw] border-x-transparent border-t-[0.7vh] border-t-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.9)]" />
              </div>
            </div>
          )}

          {/* Timeline bar — skala real window shift start → end, tinggi relatif vh */}
          <div className="w-full h-[clamp(22px,3.2vh,38px)] rounded-md flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner relative shrink-0 overflow-hidden">
            {SHIFT_EVENTS.map((evt) => {
              const { widthPct } = segPct(evt);
              const isSelected = selectedEvent?.key === evt.key;
              const isFollowed =
                selectedEvent === null && autoEvent?.key === evt.key;
              return (
                <button
                  key={evt.key}
                  type="button"
                  onClick={() =>
                    setSelectedEvent((prev) =>
                      prev?.key === evt.key ? null : evt,
                    )
                  }
                  title={`${evt.type} (${evt.duration}): ${evt.label}`}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: evt.color,
                    boxShadow: isSelected
                      ? `inset 0 0 0 3px ${evt.color}, inset 0 0 0 5px rgba(255,255,255,0.85), 0 0 14px ${evt.color}`
                      : isFollowed
                        ? `inset 0 0 0 2px ${evt.color}`
                        : undefined,
                  }}
                  className={`h-full transition-all cursor-pointer border-r border-black/10 focus:outline-none relative shrink-0 ${isSelected ? "z-20 brightness-110" : isFollowed ? "brightness-105" : "hover:brightness-110 hover:opacity-95"}`}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-white shadow-md animate-ping opacity-75 absolute" />
                      <span className="w-2 h-2 rounded-full bg-white shadow-md relative" />
                    </span>
                  )}
                </button>
              );
            })}
            <div
              style={{ width: `${fillerPct}%` }}
              className="h-full bg-slate-200 dark:bg-slate-800 rounded-r-md shrink-0"
              title={windowMin != null ? "End of shift planned" : "Tidak ada data shift"}
            />
            {/* Live marker biru — garis vertikal waktu berjalan (tanpa label).
                Berbeda dari select (border kotak + segitiga warna event):
                garis biru 3px setinggi bar, bergerak otomatis tiap detik. */}
            {windowMin != null && (
              <div
                className="absolute top-0 bottom-0 -translate-x-1/2 w-[3px] bg-gradient-to-b from-sky-300 via-blue-500 to-blue-600 z-40 shadow-[0_0_10px_rgba(59,130,246,0.95)] pointer-events-none transition-all duration-1000"
                style={{ left: `${livePct}%` }}
                title={
                  useRealCursor
                    ? `Waktu nyata: ${liveFullStamp}`
                    : `Jam operasional: ${liveLabel}`
                }
              />
            )}
            {SHIFT_EVENTS.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
                  Tidak ada data timeline dari backend
                </span>
              </div>
            )}
          </div>

          {/* Hour ticks — min 11px */}
          <div className="flex justify-between text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 px-1 shrink-0">
            {hours.map((hr, idx) => {
              const isLiveHour = hr === liveHour;
              return (
                <span
                  key={idx}
                  className={`text-center whitespace-nowrap ${isLiveHour ? "text-blue-600 dark:text-blue-400 font-extrabold scale-110" : "font-semibold"}`}
                >
                  {hr}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
