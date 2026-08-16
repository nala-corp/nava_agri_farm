import React, { useState, useMemo } from 'react';
import {
  Wheat,
  Plus,
  Scale,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';

export const HarvestManager: React.FC = () => {
  const { activeCycle, cycles, openQuickAction } = useApp();

  const [filterCycleId, setFilterCycleId] = useState<string>(activeCycle?.id || 'all');

  // Fetch harvests
  const harvestLogs = useMemo(() => {
    return StorageService.getHarvests(filterCycleId === 'all' ? undefined : filterCycleId);
  }, [filterCycleId, activeCycle]);

  // Aggregate metrics
  const totalYieldKg = harvestLogs.reduce((sum, h) => sum + (Number(h.totalWeightKg) || 0), 0);
  const totalRevenue = harvestLogs.reduce((sum, h) => sum + (Number(h.totalSalesAmount) || 0), 0);
  const averagePricePerKg = totalYieldKg > 0 ? Math.round(totalRevenue / totalYieldKg) : 0;

  // Active cycle plant count for yield per plant
  const activeCycleData = filterCycleId !== 'all' ? cycles.find(c => c.id === filterCycleId) : activeCycle;
  const plantCount = activeCycleData?.plantCount || 1;
  const yieldPerPlantGrams = totalYieldKg > 0 ? Math.round((totalYieldKg * 1000) / plantCount) : 0;

  // Grade breakdown summary
  const gradeSummary = useMemo(() => {
    let gradeAKg = 0;
    let gradeBKg = 0;
    let gradeCKg = 0;

    harvestLogs.forEach(h => {
      (h.grades || []).forEach(g => {
        if (g.grade.includes('A')) gradeAKg += Number(g.weightKg) || 0;
        if (g.grade.includes('B')) gradeBKg += Number(g.weightKg) || 0;
        if (g.grade.includes('C') || g.grade.includes('Reject')) gradeCKg += Number(g.weightKg) || 0;
      });
    });

    return { gradeAKg, gradeBKg, gradeCKg };
  }, [harvestLogs]);

  return (
    <div className="space-y-5">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <Wheat className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Pencatatan Panen & Grading Hasil
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Monitoring petikan berkala, grading kualitas (A/B/C), dan produktivitas per pohon.
            </p>
          </div>

          <button
            onClick={() => openQuickAction('add_harvest')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Catat Panen Baru
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-600 font-medium">Pilih Siklus:</span>
          <select
            value={filterCycleId}
            onChange={e => setFilterCycleId(e.target.value)}
            className="bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
          >
            <option value="all">Semua Siklus Budidaya</option>
            {cycles.map(c => (
              <option key={c.id} value={c.id}>
                {c.cycleCode} — {c.fieldName} ({c.cropTypeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Yield */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Total Akumulasi Panen</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono">
            {totalYieldKg.toLocaleString('id-ID')} <span className="text-xs font-sans text-gray-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Dari {harvestLogs.length} sesi pemetikan
          </div>
        </div>

        {/* Yield Per Plant */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Produktivitas per Pohon</span>
            <PackageCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-teal-800 font-mono">
            {yieldPerPlantGrams} <span className="text-xs font-sans text-gray-500 font-normal">gram / pohon</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Target SOP: 800 - 1.200 gram
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Total Nilai Penjualan</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Rata-rata Rp {averagePricePerKg.toLocaleString('id-ID')}/kg
          </div>
        </div>

        {/* Grade Quality Ratio */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Kualitas Grade A (Super)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono">
            {totalYieldKg > 0 ? Math.round((gradeSummary.gradeAKg / totalYieldKg) * 100) : 0}%
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Grade A: {gradeSummary.gradeAKg} kg • B: {gradeSummary.gradeBKg} kg
          </div>
        </div>

      </div>

      {/* 3. HARVEST LOG TABLE */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Riwayat Petikan & Penjualan ({harvestLogs.length} Catatan)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
              <tr>
                <th className="px-4 py-3">Tanggal & Hari</th>
                <th className="px-4 py-3">Komoditas & Varietas</th>
                <th className="px-4 py-3">Rincian Grading</th>
                <th className="px-4 py-3">Total Bobot</th>
                <th className="px-4 py-3">Total Pendapatan</th>
                <th className="px-4 py-3">Pembeli / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9ece6] font-mono">
              {harvestLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f9faf8]">
                  <td className="px-4 py-3 font-sans">
                    <span className="font-bold text-slate-800">H+{log.dayOffset}</span>
                    <div className="text-[10px] text-gray-500">{log.date}</div>
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className="font-medium text-slate-800">{log.cropName}</span>
                    <div className="text-[10px] text-gray-500">{log.varietyName}</div>
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(log.grades || []).map((g, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-[#f3f5f0] border border-[#e1e5db] text-[10px] text-slate-700">
                          {g.grade}: <strong className="text-emerald-800">{g.weightKg} kg</strong> (Rp {g.unitPrice.toLocaleString('id-ID')})
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800">
                    {log.totalWeightKg} kg
                  </td>

                  <td className="px-4 py-3 font-bold text-emerald-800">
                    Rp {log.totalSalesAmount.toLocaleString('id-ID')}
                  </td>

                  <td className="px-4 py-3 font-sans text-gray-500 max-w-[180px] truncate">
                    {log.buyerName || log.qualityNotes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
