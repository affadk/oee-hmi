import React from 'react';
import { X, BookOpen, Info, Award } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FormulaHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightMetric?: string;
}

export const FormulaHelpModal: React.FC<FormulaHelpModalProps> = ({
  isOpen,
  onClose,
  highlightMetric,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              OEE Formulation & Manufacturing Standards (ISO 22400)
            </h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Core Takeaway Box */}
          <div className={`border rounded-lg p-3.5 ${
            isDark ? 'bg-blue-950/40 border-blue-800/80 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className={`font-bold text-sm flex items-center gap-1.5 mb-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              <Info className="w-4 h-4 text-blue-500" />
              Kenapa jangan hanya menampilkan "OEE = 82%"?
            </div>
            <p className={`leading-relaxed ${isDark ? 'text-blue-200/90' : 'text-blue-800/90'}`}>
              Angka OEE tunggal tidak menjelaskan apakah masalah utamanya adalah <strong>downtime mesin (Availability)</strong>, 
              <strong>kecepatan mesin di bawah ideal (Performance)</strong>, atau <strong>produk cacat/reject (Quality)</strong>. 
              Dashboard yang efektif wajib menguraikan ketiga faktor dan loss root-causenya.
            </p>
          </div>

          {/* Formulas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Availability */}
            <div className={`p-3 rounded-lg border transition-colors ${
              highlightMetric === 'Availability' 
                ? (isDark ? 'bg-blue-950/60 border-blue-400' : 'bg-blue-50 border-blue-400') 
                : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')
            }`}>
              <div className={`font-bold text-xs mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>1. Availability</div>
              <div className={`p-2 rounded border font-mono text-[11px] text-center my-2 ${
                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                Run Time <br />
                <span className={`border-t block mt-1 pt-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>Planned Production Time</span>
              </div>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Mengukur efektivitas waktu operasional terhadap waktu yang direncanakan. Menangkap kerugian Breakdown & Setup.
              </p>
            </div>

            {/* Performance */}
            <div className={`p-3 rounded-lg border transition-colors ${
              highlightMetric === 'Performance' 
                ? (isDark ? 'bg-blue-950/60 border-blue-400' : 'bg-blue-50 border-blue-400') 
                : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')
            }`}>
              <div className={`font-bold text-xs mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>2. Performance</div>
              <div className={`p-2 rounded border font-mono text-[11px] text-center my-2 ${
                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                Ideal Cycle × Total Count <br />
                <span className={`border-t block mt-1 pt-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>Run Time (Operating Time)</span>
              </div>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Mengukur kecepatan aktual dibanding kecepatan ideal. Menangkap kerugian Slow Cycles & Small Stops (&lt;5 min).
              </p>
            </div>

            {/* Quality */}
            <div className={`p-3 rounded-lg border transition-colors ${
              highlightMetric === 'Quality' 
                ? (isDark ? 'bg-blue-950/60 border-blue-400' : 'bg-blue-50 border-blue-400') 
                : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')
            }`}>
              <div className={`font-bold text-xs mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>3. Quality</div>
              <div className={`p-2 rounded border font-mono text-[11px] text-center my-2 ${
                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                Good Count <br />
                <span className={`border-t block mt-1 pt-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>Total Count (Good + Reject)</span>
              </div>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Proporsi produk yang lolos QC tanpa cacat terhadap total produksi. Menangkap kerugian Scrap & Rework.
              </p>
            </div>
          </div>

          {/* Master OEE Equation */}
          <div className={`border rounded-lg p-3 text-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className={`font-mono text-sm font-bold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              OEE = Availability (91.2%) × Performance (94.5%) × Quality (95.6%) = 82.4%
            </div>
          </div>

          {/* Production vs Target Reconciliation Section */}
          <div className={`p-3.5 rounded-lg border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`font-semibold mb-2 flex items-center justify-between ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <span>Hubungan Konsistensi: Target Per-Jam (Hourly) vs Total Target Qty:</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Audit-Ready</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="font-bold text-blue-400 mb-1">1. Rumus Target Per-Jam:</div>
                <div>Target / Jam = Total Target Qty ÷ Jam Kerja Shift</div>
                <div className="text-[10px] text-slate-500 mt-1">Contoh: 1.000 pcs ÷ 8 jam = 125 pcs/jam (atau 840 pcs ÷ 8 = 105 pcs/jam)</div>
              </div>
              <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="font-bold text-emerald-400 mb-1">2. Konsistensi Total Akumulasi:</div>
                <div>Total Actual = ∑ (Output Actual per Jam)</div>
                <div className="text-[10px] text-slate-500 mt-1">114 + 118 + 122 + 126 + 105 + 115 + 128 + 117 = 945 pcs (94.5%)</div>
              </div>
            </div>
          </div>

          {/* Time Cascade Diagram & Downtime Classification */}
          <div className={`p-3.5 rounded-lg border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`font-semibold mb-2 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>Klasifikasi Downtime (ISO 22400 / SEMI E10):</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Planned vs Unplanned</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-[11px]">
              <div className={`p-2.5 rounded border ${isDark ? 'bg-blue-950/30 border-blue-800/60 text-slate-300' : 'bg-blue-50/70 border-blue-200 text-slate-800'}`}>
                <div className="font-bold text-blue-400 mb-1 flex items-center justify-between">
                  <span>1. Planned Downtime (Scheduled)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono">Excluded from OEE</span>
                </div>
                <div className="text-slate-400 mb-1">Downtime yang sudah dijadwalkan & disetujui sebelumnya:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400">
                  <li>Istirahat makan (Meal break) & shift briefing</li>
                  <li>Autonomous maintenance (5S cleaning mingguan)</li>
                  <li>Planned preventive maintenance (PM berkala)</li>
                </ul>
                <div className="mt-2 text-[10px] font-mono text-blue-300">
                  Efek: Planned Prod Time = Total Shift - Planned Downtime
                </div>
              </div>

              <div className={`p-2.5 rounded border ${isDark ? 'bg-rose-950/30 border-rose-800/60 text-slate-300' : 'bg-rose-50/70 border-rose-200 text-slate-800'}`}>
                <div className="font-bold text-rose-400 mb-1 flex items-center justify-between">
                  <span>2. Unplanned Downtime (Unscheduled)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono">Reduces Availability</span>
                </div>
                <div className="text-slate-400 mb-1">Kejadian tak terduga yang menghentikan mesin:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400">
                  <li>Kerusakan mesin (Motor trip, sensor fail, pump leak)</li>
                  <li>Part jam, feeder macet, mold misalignment</li>
                  <li>Kekurangan material, tunggu operator/teknisi</li>
                </ul>
                <div className="mt-2 text-[10px] font-mono text-rose-300">
                  Efek: Availability % = (Planned Prod Time - Unplanned DT) ÷ Planned Prod Time
                </div>
              </div>
            </div>

            <pre className={`font-mono text-[11px] overflow-x-auto leading-relaxed p-2 rounded ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-600 border border-slate-200'}`}>
{`Total Shift Time (480 min)
│
├── [PLANNED DOWNTIME] (Meal & Briefing: 60 min) ──> Dikeluarkan dari denominator OEE
│
└── Planned Production Time (420 min) ──> Denominator Availability
       │
       ├── [UNPLANNED DOWNTIME] (Sensor Fault, Feeder Jam: 42 min) ──> Kerugian Availability
       │
       └── Operating Run Time (378 min) ──> Mesin benar-benar menghasilkan output`}
            </pre>
          </div>

          {/* World Class Benchmark */}
          <div className={`border-t pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2 ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Award className="w-4 h-4 text-amber-500" />
              World Class Benchmark: OEE &ge; 85%, Avail &ge; 90%, Perf &ge; 95%, Quality &ge; 99.9%
            </span>
            <button
              onClick={onClose}
              className={`px-3 py-1 rounded border transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
