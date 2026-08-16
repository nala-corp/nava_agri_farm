import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { Expense, Income, ExpenseCategory } from '../../types';

export const FinanceManager: React.FC = () => {
  const { activeCycle, cycles, openQuickAction, refreshData } = useApp();

  const [filterCycleId, setFilterCycleId] = useState<string>(activeCycle?.id || 'all');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income'>('overview');

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

  // Financial calculations
  const totalExpense = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = allIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

  // Cost per plant calculation if cycle selected
  const activeCycleData = filterCycleId !== 'all' ? cycles.find(c => c.id === filterCycleId) : activeCycle;
  const plantCount = activeCycleData?.plantCount || 1;
  const costPerPlant = Math.round(totalExpense / plantCount);

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    allExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + (Number(e.amount) || 0);
    });
    return cats;
  }, [allExpenses]);

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

  return (
    <div className="space-y-5">
      
      {/* 1. HEADER & FILTER */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Laporan Keuangan & Analisa Usaha Tani
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pencatatan arus kas riil, HPP per tanaman, dan kalkulasi laba-rugi budidaya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openQuickAction('add_expense')}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 cursor-pointer"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> + Catat Biaya
            </button>
            <button
              onClick={() => openQuickAction('add_income')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
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

      {/* 2. SUMMARY FINANCIAL METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Income */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Total Pendapatan</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Dari {allIncome.length} transaksi penjualan
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Total Pengeluaran (Beban)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 font-mono">
            Rp {totalExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Saprotan, tenaga kerja, operasional
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">Laba / (Rugi) Bersih</span>
            <TrendingUp className={`w-4 h-4 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
            Rp {netProfit.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Margin: <strong className="text-slate-800">{profitMargin}%</strong>
          </div>
        </div>

        {/* Cost Per Plant (HPP) */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span className="font-medium">HPP per Pohon Tanaman</span>
            <span className="text-gray-400 text-xs font-mono">HPP</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
            Rp {costPerPlant.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Berdasarkan {plantCount.toLocaleString('id-ID')} populasi
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
            Struktur Biaya
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
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800">Distribusi Beban Biaya Produksi (Berdasarkan Kategori)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(expenseByCategory).map(([cat, amount]) => {
                const numAmount = Number(amount) || 0;
                const percent = totalExpense > 0 ? Math.round((numAmount / totalExpense) * 100) : 0;
                const labels: Record<string, string> = {
                  bibit: 'Bibit & Benih',
                  pupuk: 'Pupuk Kimia & Organik',
                  pestisida: 'Pestisida & Obat-obatan',
                  alat_perlengkapan: 'Alat & Perlengkapan Bedengan',
                  tenaga_kerja: 'Upah Tenaga Kerja & Harian',
                  air_irigasi: 'Air & Pengairan',
                  listrik_bbm: 'Listrik & BBM Pompa',
                  transportasi: 'Transportasi & Pengangkutan',
                  sewa_lahan: 'Sewa Lahan & Fasilitas',
                  lainnya: 'Biaya Lain-lain'
                };

                return (
                  <div key={cat} className="p-3.5 bg-[#f9faf8] rounded-xl border border-[#e1e5db] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{labels[cat] || cat}</span>
                      <span className="font-mono font-bold text-slate-800">Rp {numAmount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="w-full bg-[#e9ece6] rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>

                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Porsi Total Biaya</span>
                      <span className="font-mono font-semibold text-emerald-700">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES TABLE */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
                <tr>
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Kategori</th>
                  <th className="px-4 py-2.5">Keterangan / Keperluan</th>
                  <th className="px-4 py-2.5">Total Biaya</th>
                  <th className="px-4 py-2.5">Catatan</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9ece6] font-mono">
                {allExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#f9faf8]">
                    <td className="px-4 py-3 font-sans text-gray-500">{exp.date}</td>
                    <td className="px-4 py-3 font-sans capitalize">
                      <span className="px-2 py-0.5 rounded bg-[#f3f5f0] border border-[#e1e5db] text-[10px] text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-800">{exp.description}</td>
                    <td className="px-4 py-3 font-bold text-rose-700">Rp {exp.amount.toLocaleString('id-ID')}</td>
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
                ))}
              </tbody>
            </table>
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
                    <option value="alat_perlengkapan">Alat & Perlengkapan</option>
                    <option value="tenaga_kerja">Upah Tenaga Kerja</option>
                    <option value="air_irigasi">Air Irigasi</option>
                    <option value="listrik_bbm">Listrik & BBM</option>
                    <option value="transportasi">Transportasi</option>
                    <option value="sewa_lahan">Sewa Lahan</option>
                    <option value="lainnya">Lain-lain</option>
                  </select>
                </div>
              </div>

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
                <label className="block text-gray-600 mb-1 font-medium">Total Biaya (Rp)</label>
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

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e9ece6]">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE EXPENSE CONFIRMATION */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hapus Catatan Biaya</h3>
                <p className="text-[11px] text-gray-500">Mencegah data salah input</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1 text-slate-700">
              <p>Apakah Anda yakin ingin menghapus data pengeluaran ini?</p>
              <div className="font-bold text-slate-800 text-xs mt-1">{expenseToDelete.description}</div>
              <div className="text-[11px] text-rose-700 font-mono font-bold">
                Rp {expenseToDelete.amount.toLocaleString('id-ID')} ({expenseToDelete.date})
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExpense}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Ya, Hapus Data
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
                  <label className="block text-gray-600 mb-1 font-medium">Status Pembayaran</label>
                  <select
                    value={editingIncome.paymentStatus}
                    onChange={e => setEditingIncome({ ...editingIncome, paymentStatus: e.target.value as any })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white font-semibold"
                  >
                    <option value="paid">LUNAS (Diterima)</option>
                    <option value="pending">TEMPO / Belum Lunas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Pembeli / Pihak Pembayar</label>
                <input
                  type="text"
                  value={editingIncome.buyerName || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, buyerName: e.target.value })}
                  placeholder="Contoh: Pak Haji Bandi (Pasar Induk)"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Keterangan Penjualan / Komoditas</label>
                <input
                  type="text"
                  value={editingIncome.description}
                  onChange={e => setEditingIncome({ ...editingIncome, description: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Total Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingIncome.amount}
                  onChange={e => setEditingIncome({ ...editingIncome, amount: Number(e.target.value) })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Kualitas / Timbangan</label>
                <textarea
                  value={editingIncome.notes || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e9ece6]">
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE INCOME CONFIRMATION */}
      {incomeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hapus Catatan Penjualan</h3>
                <p className="text-[11px] text-gray-500">Mencegah data salah input</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1 text-slate-700">
              <p>Apakah Anda yakin ingin menghapus data penjualan/pemasukan ini?</p>
              <div className="font-bold text-slate-800 text-xs mt-1">{incomeToDelete.description}</div>
              <div className="text-[11px] text-emerald-800 font-mono font-bold">
                Rp {incomeToDelete.amount.toLocaleString('id-ID')} ({incomeToDelete.date})
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIncomeToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteIncome}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
