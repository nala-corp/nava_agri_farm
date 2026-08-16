import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Wheat,
  Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { ExcelService } from '../../services/excelService';

export const ReportsAnalytics: React.FC = () => {
  const { cycles, tasks } = useApp();

  const [selectedCycleId, setSelectedCycleId] = useState<string>(cycles[0]?.id || '');

  const selectedCycle = useMemo(() => {
    return cycles.find(c => c.id === selectedCycleId) || cycles[0] || null;
  }, [cycles, selectedCycleId]);

  // Tasks for selected cycle
  const cycleTasks = useMemo(() => {
    return selectedCycle ? tasks.filter(t => t.cycleId === selectedCycle.id) : [];
  }, [selectedCycle, tasks]);

  const completedTasks = cycleTasks.filter(t => t.status === 'completed');
  const taskComplianceRate = cycleTasks.length > 0 ? Math.round((completedTasks.length / cycleTasks.length) * 100) : 0;

  // Financials for selected cycle
  const cycleExpenses = useMemo(() => {
    return selectedCycle ? StorageService.getExpenses(selectedCycle.id) : [];
  }, [selectedCycle]);

  const cycleIncome = useMemo(() => {
    return selectedCycle ? StorageService.getIncome(selectedCycle.id) : [];
  }, [selectedCycle]);

  const cycleHarvests = useMemo(() => {
    return selectedCycle ? StorageService.getHarvests(selectedCycle.id) : [];
  }, [selectedCycle]);

  const totalExpense = cycleExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalRevenue = cycleIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpense;
  const totalHarvestKg = cycleHarvests.reduce((sum, h) => sum + (Number(h.totalWeightKg) || 0), 0);

  const plantCount = selectedCycle?.plantCount || 1;
  const costPerPlant = Math.round(totalExpense / plantCount);
  const revenuePerPlant = Math.round(totalRevenue / plantCount);
  const yieldPerPlantGrams = totalHarvestKg > 0 ? Math.round((totalHarvestKg * 1000) / plantCount) : 0;

  // Export to Excel (.xlsx) using ExcelService
  const handleExportExcel = () => {
    if (!selectedCycle) return;
    ExcelService.exportCycleReportToExcel(selectedCycle);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* 1. HEADER & EXPORT TOOLBAR */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Laporan Evaluasi Siklus & Kepatuhan SOP
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Analisa komparasi target vs realisasi, efisiensi biaya, dan audit ketaatan standar operasional.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 cursor-pointer shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Ekspor Excel (.xlsx)
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* Cycle selector */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-600 font-medium">Pilih Siklus untuk Dievaluasi:</span>
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(e.target.value)}
            className="bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600 focus:bg-white"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>
                {c.cycleCode} — {c.fieldName} ({c.cropTypeName} {c.varietyName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCycle && (
        <>
          {/* 2. CYCLE SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Compliance Rate */}
            <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
                <span className="font-medium">Kepatuhan SOP</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono">
                {taskComplianceRate}%
              </div>
              <div className="text-[11px] text-gray-400 mt-2">
                {completedTasks.length} dari {cycleTasks.length} instruksi SOP terlaksana
              </div>
            </div>

            {/* Total Yield & Grams/Plant */}
            <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
                <span className="font-medium">Total Panen & Produktivitas</span>
                <Wheat className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
                {totalHarvestKg.toLocaleString('id-ID')} <span className="text-xs font-sans text-gray-500 font-normal">kg</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-2">
                Rata-rata <strong className="text-emerald-800">{yieldPerPlantGrams} gr/pohon</strong>
              </div>
            </div>

            {/* Cost per Plant vs Revenue per Plant */}
            <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
                <span className="font-medium">HPP vs Omset / Pohon</span>
                <Wallet className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-teal-800 font-mono">
                Rp {revenuePerPlant.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-gray-400 mt-2">
                HPP: Rp {costPerPlant.toLocaleString('id-ID')} / pohon
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
                <span className="font-medium">Laba / (Rugi) Bersih</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className={`text-xl sm:text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-gray-400 mt-2">
                Biaya: Rp {totalExpense.toLocaleString('id-ID')}
              </div>
            </div>

          </div>

          {/* 3. SOP AUDIT TRAIL & STAGE EXECUTION BREAKDOWN */}
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-[#e9ece6]">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Evaluasi Pelaksanaan Tahapan SOP (Snapshot {selectedCycle.sopSnapshot.versionNumber})
            </h3>

            <div className="space-y-3">
              {selectedCycle.sopSnapshot.stages.map((stage) => {
                const stageTasks = cycleTasks.filter(t => t.stageId === stage.id);
                const stageDone = stageTasks.filter(t => t.status === 'completed');
                const stagePct = stageTasks.length > 0 ? Math.round((stageDone.length / stageTasks.length) * 100) : 100;

                return (
                  <div key={stage.id} className="p-3.5 bg-[#f9faf8] rounded-xl border border-[#e1e5db]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="font-semibold text-slate-800">
                        {stage.name} <span className="text-[10px] font-mono text-gray-500">(H{stage.targetStartDay >= 0 ? `+${stage.targetStartDay}` : stage.targetStartDay} - H+{stage.targetEndDay})</span>
                      </div>
                      <div className="font-mono text-emerald-800 font-bold">
                        {stageDone.length} / {stageTasks.length} Tugas ({stagePct}%)
                      </div>
                    </div>

                    <div className="w-full bg-[#e9ece6] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${stagePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
