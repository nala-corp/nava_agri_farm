import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  AlertCircle,
  Wrench,
  Layers,
  Sprout,
  HelpCircle,
  Filter,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { Expense, Income, ExpenseCategory } from '../../types';

export const FinanceManager: React.FC = () => {
  const { activeCycle, cycles, openQuickAction, refreshData } = useApp();

  const [filterCycleId, setFilterCycleId] = useState<string>(activeCycle?.id || 'all');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income'>('overview');
  const [expenseFilterType, setExpenseFilterType] = useState<'all' | 'operational' | 'capital'>('all');

  // Modals state for Edit and Delete
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

  // Fetch all expenses and income
  const allExpenses = useMemo(() => {
    return StorageService.getExpenses(filterCycleId === 'all' ? undefined : filterCycleId);
  }, [filterCycleId, activeCycle]);

  const allIncome = useMemo(() => {
    return StorageService.getIncome(filterCycleId === 'all' ? undefined : filterCycleId);
  }, [filterCycleId, activeCycle]);

  // 1. Separate Operational Expenses (Cycle Variable Cost) from Capital/Equipment Expenses (Assets)
  const operationalExpenses = useMemo(() => {
    return allExpenses.filter(e => e.category !== 'alat_perlengkapan');
  }, [allExpenses]);

  const capitalExpenses = useMemo(() => {
    return allExpenses.filter(e => e.category === 'alat_perlengkapan');
  }, [allExpenses]);

  const totalOperationalExpense = operationalExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCapitalExpense = capitalExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpense = totalOperationalExpense + totalCapitalExpense; // Total Arus Kas Keluar

  const totalIncome = allIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  
  // Operational Profit (Based purely on Operational HPP)
  const operationalProfit = totalIncome - totalOperationalExpense;
  const operationalProfitMargin = totalIncome > 0 ? ((operationalProfit / totalIncome) * 100).toFixed(1) : '0';

  // Net Cash Flow (After all cash expenses including tool purchases)
  const netCashFlow = totalIncome - totalExpense;

  // Cost per plant calculation based STRICTLY on Operational Expenses
  const activeCycleData = filterCycleId !== 'all' ? cycles.find(c => c.id === filterCycleId) : activeCycle;
  const plantCount = activeCycleData?.plantCount || 1;
  const costPerPlant = Math.round(totalOperationalExpense / plantCount);

  // Operational breakdown by category (for HPP)
  const operationalByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    operationalExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + (Number(e.amount) || 0);
    });
    return cats;
  }, [operationalExpenses]);

  // Filtered expense list for tab 2
  const displayedExpenses = useMemo(() => {
    if (expenseFilterType === 'operational') return operationalExpenses;
    if (expenseFilterType === 'capital') return capitalExpenses;
    return allExpenses;
  }, [expenseFilterType, allExpenses, operationalExpenses, capitalExpenses]);

  // Handle Edit & Delete Expense
  const handleSaveEditedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    StorageService.updateExpense({
      ...editingExpense,
      amount: Number(editingExpense.amount)
    });
    refreshData();
    setEditingExpense(null);
  };

  const handleConfirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    StorageService.deleteExpense(expenseToDelete.id);
    refreshData();
    setExpenseToDelete(null);
  };

  // Handle Edit & Delete Income
  const handleSaveEditedIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome) return;

    StorageService.updateIncome({
      ...editingIncome,
      amount: Number(editingIncome.amount)
    });
    refreshData();
    setEditingIncome(null);
  };

  const handleConfirmDeleteIncome = () => {
    if (!incomeToDelete) return;
    StorageService.deleteIncome(incomeToDelete.id);
    refreshData();
    setIncomeToDelete(null);
  };

  const categoryLabels: Record<string, string> = {
    bibit: 'Bibit & Benih',
    pupuk: 'Pupuk Kimia & Organik',
    pestisida: 'Pestisida & Obat-obatan',
    alat_perlengkapan: 'Alat & Perlengkapan Bedengan (Aset)',
    tenaga_kerja: 'Upah Tenaga Kerja & Harian',
    air_irigasi: 'Air & Pengairan',
    listrik_bbm: 'Listrik & BBM Pompa',
    transportasi: 'Transportasi & Pengangkutan',
    sewa_lahan: 'Sewa Lahan & Fasilitas',
    lainnya: 'Biaya Operasional Lainnya'
  };

  return (
    <div className="space-y-5">
      
      {/* 1. HEADER & FILTER */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Laporan Keuangan & Analisa HPP Usaha Tani
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pemisahan Biaya Operasional (HPP per Pohon) vs Belanja Alat & Perlengkapan (Aset Berulang).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openQuickAction('add_expense')}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 cursor-pointer shadow-2xs transition-colors"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> + Catat Biaya
            </button>
            <button
              onClick={() => openQuickAction('add_income')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> + Catat Penjualan
            </button>
          </div>
        </div>

        {/* Cycle Filter Dropdown */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-600 font-medium">Filter Berdasarkan Siklus:</span>
          <select
            value={filterCycleId}
            onChange={e => setFilterCycleId(e.target.value)}
            className="bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
          >
            <option value="all">Semua Siklus Budidaya (Keseluruhan Kebun)</option>
            {cycles.map(c => (
              <option key={c.id} value={c.id}>
                {c.cycleCode} — {c.fieldName} ({c.cropTypeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. SUMMARY FINANCIAL METRICS WITH SEPARATION OF TOOLS VS OPERATIONAL */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Income */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Total Pendapatan</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-800 font-mono">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Dari {allIncome.length} transaksi panen
          </div>
        </div>

        {/* Operational Expense (HPP Component) */}
        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-900 text-xs mb-1">
            <span className="font-bold flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-rose-600" />
              Biaya Operasional (HPP)
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-700 font-mono">
            Rp {totalOperationalExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Saprotan, pupuk & upah harian
          </div>
        </div>

        {/* Capital Expense / Tools (Non-HPP) */}
        <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xs bg-sky-50/20">
          <div className="flex items-center justify-between text-sky-900 text-xs mb-1">
            <span className="font-bold flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-sky-600" />
              Alat & Perlengkapan
            </span>
            <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">Aset</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-sky-800 font-mono">
            Rp {totalCapitalExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-sky-700/80 mt-2">
            Aset berulang (Non-HPP Pohon)
          </div>
        </div>

        {/* Cost Per Plant (Accurate HPP) */}
        <div className="bg-white border border-emerald-300 rounded-2xl p-4 shadow-xs bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-950 text-xs mb-1">
            <span className="font-bold">HPP per Pohon Tanaman</span>
            <span className="text-emerald-800 text-[10px] font-mono font-bold bg-emerald-100 px-1.5 py-0.5 rounded">HPP Murni</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-900 font-mono">
            Rp {costPerPlant.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-800/80 mt-2 font-medium">
            {plantCount.toLocaleString('id-ID')} populasi bibit
          </div>
        </div>

        {/* Operational Profit */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Laba Siklus (Operasional)</span>
            <TrendingUp className={`w-4 h-4 ${operationalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${operationalProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
            Rp {operationalProfit.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Margin: <strong className="text-slate-800">{operationalProfitMargin}%</strong>
          </div>
        </div>

      </div>

      {/* 3. TABS: OVERVIEW & TABLES */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* TAB BUTTONS */}
        <div className="flex items-center gap-2 border-b border-[#e9ece6] pb-3 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-emerald-700 text-white' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
            }`}
          >
            Struktur Biaya & HPP
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'expenses' ? 'bg-emerald-700 text-white' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
            }`}
          >
            Daftar Pengeluaran ({allExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              activeTab === 'income' ? 'bg-emerald-700 text-white' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
            }`}
          >
            Daftar Pemasukan / Penjualan ({allIncome.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & BREAKDOWN BARS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Notice / Policy Explanation */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-emerald-900">Kebijakan Pemisahan Akuntansi Pertanian:</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Pengeluaran kategori <strong>Alat & Perlengkapan Bedengan</strong> (seperti pompa, selang drip, sprayer, paranet, cangkul) dikelompokkan sebagai <strong>Aset Tetap / Modal Usaha</strong> yang digunakan berulang lintas siklus. Kategori ini <strong>tidak dimasukkan ke dalam HPP per Pohon Tanaman</strong> sehingga nilai HPP per pohon mencerminkan biaya produksi riil tanpa distorsi.
                </p>
              </div>
            </div>

            {/* Section A: Biaya Operasional (HPP) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  1. Rincian Biaya Operasional Siklus (Komponen HPP per Pohon)
                </h3>
                <span className="text-xs font-mono font-bold text-rose-700">
                  Total: Rp {totalOperationalExpense.toLocaleString('id-ID')}
                </span>
              </div>

              {Object.keys(operationalByCategory).length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 bg-[#f9faf8] rounded-xl border border-dashed border-[#e1e5db]">
                  Belum ada catatan biaya operasional untuk filter ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {Object.entries(operationalByCategory).map(([cat, amount]) => {
                    const numAmount = Number(amount) || 0;
                    const percent = totalOperationalExpense > 0 ? Math.round((numAmount / totalOperationalExpense) * 100) : 0;
                    const costPerPlantPortion = Math.round(numAmount / plantCount);

                    return (
                      <div key={cat} className="p-3.5 bg-[#f9faf8] rounded-xl border border-[#e1e5db] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{categoryLabels[cat] || cat}</span>
                          <span className="font-mono font-bold text-slate-800">Rp {numAmount.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="w-full bg-[#e9ece6] rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>

                        <div className="text-[10px] text-gray-500 flex justify-between">
                          <span>Kontribusi ke HPP: <strong className="text-slate-700 font-mono">Rp {costPerPlantPortion.toLocaleString('id-ID')}/pohon</strong></span>
                          <span className="font-mono font-bold text-emerald-700">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section B: Investasi Alat & Perlengkapan (Aset Berulang / Non-HPP) */}
            <div className="space-y-3 pt-4 border-t border-[#e9ece6]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-sky-700" />
                    2. Investasi Alat & Perlengkapan Bedengan (Aset Berulang / Non-HPP)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Peralatan yang memiliki masa pakai panjang & dapat digunakan kembali untuk siklus-siklus berikutnya.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
                  Total Aset: Rp {totalCapitalExpense.toLocaleString('id-ID')}
                </span>
              </div>

              {capitalExpenses.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 bg-[#f9faf8] rounded-xl border border-[#e1e5db]">
                  Tidak ada pengeluaran alat & perlengkapan pada siklus ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {capitalExpenses.map(item => (
                    <div key={item.id} className="p-3 bg-sky-50/40 rounded-xl border border-sky-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{item.description}</span>
                        <span className="font-mono text-sky-800">Rp {item.amount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-sky-100">
                        <span>Tgl Beli: {item.date}</span>
                        <span className="text-sky-700 font-medium">Aset Kebun</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Cash Summary */}
            <div className="p-4 bg-[#f8faf6] rounded-xl border border-[#e1e5db] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-gray-600">Total Pengeluaran Kas Fisik (Operasional + Belanja Alat):</span>
                <span className="font-mono font-bold text-slate-800 ml-2">Rp {totalExpense.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-gray-600">Arus Kas Bersih Usaha:</span>
                <span className={`font-mono font-bold ml-2 ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Rp {netCashFlow.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: EXPENSES TABLE WITH FILTER TYPE */}
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            
            {/* Sub-filter chips */}
            <div className="flex items-center gap-2 text-xs pb-1">
              <span className="text-gray-500 text-[11px] font-medium">Tampilkan:</span>
              <button
                onClick={() => setExpenseFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  expenseFilterType === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6]'
                }`}
              >
                Semua ({allExpenses.length})
              </button>
              <button
                onClick={() => setExpenseFilterType('operational')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  expenseFilterType === 'operational'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Sprout className="w-3 h-3" /> Biaya Operasional / HPP ({operationalExpenses.length})
              </button>
              <button
                onClick={() => setExpenseFilterType('capital')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  expenseFilterType === 'capital'
                    ? 'bg-sky-700 text-white'
                    : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
                }`}
              >
                <Wrench className="w-3 h-3" /> Alat & Perlengkapan / Aset ({capitalExpenses.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
                  <tr>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5">Peruntukan HPP</th>
                    <th className="px-4 py-2.5">Keterangan / Keperluan</th>
                    <th className="px-4 py-2.5">Total Biaya</th>
                    <th className="px-4 py-2.5">Catatan</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9ece6] font-mono">
                  {displayedExpenses.map((exp) => {
                    const isTool = exp.category === 'alat_perlengkapan';
                    return (
                      <tr key={exp.id} className="hover:bg-[#f9faf8]">
                        <td className="px-4 py-3 font-sans text-gray-500">{exp.date}</td>
                        <td className="px-4 py-3 font-sans capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isTool
                              ? 'bg-sky-50 text-sky-900 border-sky-200'
                              : 'bg-[#f3f5f0] border-[#e1e5db] text-slate-700'
                          }`}>
                            {categoryLabels[exp.category] || exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          {isTool ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              Non-HPP (Aset)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                              Masuk HPP Pohon
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <div className="font-medium text-slate-800">{exp.description}</div>
                          {filterCycleId === 'all' && exp.cycleId && (
                            <div className="text-[10px] text-emerald-800 font-semibold mt-0.5 flex items-center gap-1">
                              <span>🌱 {cycles.find(c => c.id === exp.cycleId)?.fieldName?.split('—')[0]?.trim() || 'Kebun'}</span>
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-3 font-bold ${isTool ? 'text-sky-800' : 'text-rose-700'}`}>
                          Rp {exp.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 font-sans text-gray-500 max-w-[160px] truncate">{exp.notes || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingExpense({ ...exp })}
                              className="p-1 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 border border-[#e1e5db] cursor-pointer shadow-2xs transition-colors"
                              title="Edit Catatan Pengeluaran"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer shadow-2xs transition-colors"
                              title="Hapus Catatan Pengeluaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INCOME TABLE */}
        {activeTab === 'income' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
                <tr>
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Sumber / Pembeli</th>
                  <th className="px-4 py-2.5">Keterangan</th>
                  <th className="px-4 py-2.5">Total Diterima</th>
                  <th className="px-4 py-2.5">Status Bayar</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9ece6] font-mono">
                {allIncome.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#f9faf8]">
                    <td className="px-4 py-3 font-sans text-gray-500">{inc.date}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-800">{inc.buyerName || inc.source}</td>
                    <td className="px-4 py-3 font-sans text-slate-700">{inc.description}</td>
                    <td className="px-4 py-3 font-bold text-emerald-800">Rp {inc.amount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inc.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {inc.paymentStatus === 'paid' ? 'LUNAS' : 'TEMPO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingIncome({ ...inc })}
                          className="p-1 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 border border-[#e1e5db] cursor-pointer shadow-2xs transition-colors"
                          title="Edit Catatan Penjualan/Pemasukan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIncomeToDelete(inc)}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer shadow-2xs transition-colors"
                          title="Hapus Catatan Penjualan/Pemasukan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL: EDIT EXPENSE */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#e9ece6] pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-700" />
                Edit Catatan Pengeluaran
              </h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedExpense} className="space-y-3">
              {/* PEMILIHAN KEBUN / SIKLUS (BISA PINDAH SIKLUS JIKA SALAH INPUT) */}
              <div>
                <label className="block text-emerald-800 mb-1 font-semibold flex items-center justify-between">
                  <span>Kebun / Siklus Budidaya</span>
                  <span className="text-[10px] text-gray-500 font-normal">Pindah jika salah input kebun</span>
                </label>
                <select
                  value={editingExpense.cycleId || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, cycleId: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-emerald-600 focus:bg-white"
                  required
                >
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fieldName} ({c.cropTypeName} - {c.varietyName}) [{c.cycleCode}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Tanggal</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Kategori</label>
                  <select
                    value={editingExpense.category}
                    onChange={e => setEditingExpense({ ...editingExpense, category: e.target.value as ExpenseCategory })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="bibit">Bibit & Benih</option>
                    <option value="pupuk">Pupuk</option>
                    <option value="pestisida">Pestisida</option>
                    <option value="alat_perlengkapan">Alat & Perlengkapan (Aset)</option>
                    <option value="tenaga_kerja">Upah Tenaga Kerja</option>
                    <option value="air_irigasi">Air Irigasi</option>
                    <option value="listrik_bbm">Listrik & BBM</option>
                    <option value="transportasi">Transportasi</option>
                    <option value="sewa_lahan">Sewa Lahan</option>
                    <option value="lainnya">Lain-lain</option>
                  </select>
                </div>
              </div>

              {editingExpense.category === 'alat_perlengkapan' && (
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900">
                  ℹ️ Pengeluaran ini dicatat sebagai <strong>Aset Alat</strong> dan tidak akan membebani HPP per pohon tanaman.
                </div>
              )}

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Keterangan / Keperluan</label>
                <input
                  type="text"
                  value={editingExpense.description}
                  onChange={e => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingExpense.amount}
                  onChange={e => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={editingExpense.notes || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e9ece6]">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE EXPENSE */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              Hapus Pengeluaran?
            </div>
            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus catatan pengeluaran <strong className="text-slate-800 font-bold">{expenseToDelete.description}</strong> sebesar <strong className="text-rose-700 font-mono">Rp {expenseToDelete.amount.toLocaleString('id-ID')}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e9ece6]">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExpense}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INCOME */}
      {editingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#e9ece6] pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-700" />
                Edit Catatan Penjualan / Pemasukan
              </h3>
              <button
                onClick={() => setEditingIncome(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedIncome} className="space-y-3">
              {/* PEMILIHAN KEBUN / SIKLUS (BISA PINDAH JIKA SALAH INPUT) */}
              <div>
                <label className="block text-emerald-800 mb-1 font-semibold flex items-center justify-between">
                  <span>Kebun / Siklus Budidaya</span>
                  <span className="text-[10px] text-gray-500 font-normal">Pindah jika salah input kebun</span>
                </label>
                <select
                  value={editingIncome.cycleId || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, cycleId: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-emerald-600 focus:bg-white"
                  required
                >
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fieldName} ({c.cropTypeName} - {c.varietyName}) [{c.cycleCode}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Tanggal</label>
                  <input
                    type="date"
                    value={editingIncome.date}
                    onChange={e => setEditingIncome({ ...editingIncome, date: e.target.value })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Sumber / Kategori</label>
                  <select
                    value={editingIncome.source}
                    onChange={e => setEditingIncome({ ...editingIncome, source: e.target.value as any })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="harvest_sale">Penjualan Hasil Panen</option>
                    <option value="seedling_sale">Penjualan Bibit</option>
                    <option value="byproduct">Hasil Olahan / Sampingan</option>
                    <option value="subsidy">Subsidi / Bantuan</option>
                    <option value="other">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Pembeli / Tengkulak / Kios</label>
                <input
                  type="text"
                  value={editingIncome.buyerName || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, buyerName: e.target.value })}
                  placeholder="Contoh: Pak Haji Anwar (Pasar Induk)"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Keterangan / Rincian Penjualan</label>
                <input
                  type="text"
                  value={editingIncome.description}
                  onChange={e => setEditingIncome({ ...editingIncome, description: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Nominal Total (Rp)</label>
                  <input
                    type="number"
                    value={editingIncome.amount}
                    onChange={e => setEditingIncome({ ...editingIncome, amount: Number(e.target.value) })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Status Pembayaran</label>
                  <select
                    value={editingIncome.paymentStatus}
                    onChange={e => setEditingIncome({ ...editingIncome, paymentStatus: e.target.value as any })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="paid">LUNAS (Cash / Transfer)</option>
                    <option value="pending">TEMPO (Hutang Dagang)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={editingIncome.notes || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e9ece6]">
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE INCOME */}
      {incomeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              Hapus Pemasukan?
            </div>
            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus catatan penjualan <strong className="text-slate-800 font-bold">{incomeToDelete.description}</strong> sebesar <strong className="text-emerald-700 font-mono">Rp {incomeToDelete.amount.toLocaleString('id-ID')}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e9ece6]">
              <button
                type="button"
                onClick={() => setIncomeToDelete(null)}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteIncome}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceManager;
