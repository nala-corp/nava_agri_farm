import React, { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Building,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Database,
  CloudUpload,
  CloudDownload,
  Activity,
  Check,
  Server,
  Copy,
  ExternalLink,
  Code,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { SupabaseService } from '../../services/supabaseService';
import { SUPABASE_SQL_SCHEMA } from '../../constants/supabaseSql';

export const SettingsManager: React.FC = () => {
  const { settings, refreshData, syncWithSupabase, pullFromSupabase } = useApp();

  const [farmName, setFarmName] = useState(settings.farmName || 'Nusantara Agro Farm');
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'Pak Budi Hartono');
  const [operatorName, setOperatorName] = useState((settings as any).operatorName || 'Agronomist & Tim Kebun');
  const [location, setLocation] = useState((settings as any).location || 'Karanganyar, Jawa Tengah');
  const [currency, setCurrency] = useState(settings.currency || 'IDR');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Supabase state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isPullingDb, setIsPullingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ checked: boolean; success: boolean; message: string } | null>(null);
  const [isSqlCopied, setIsSqlCopied] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  useEffect(() => {
    // Initial silent ping to verify database connection
    SupabaseService.testConnection().then(res => {
      setDbStatus({ checked: true, success: res.success, message: res.message });
    });
  }, []);

  const handleTestConnection = async () => {
    setIsTestingDb(true);
    const res = await SupabaseService.testConnection();
    setDbStatus({ checked: true, success: res.success, message: res.message });
    setIsTestingDb(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsSqlCopied(true);
    setTimeout(() => setIsSqlCopied(false), 3000);
  };

  const handleDownloadSqlFile = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supabase-schema.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingDb(true);
    try {
      const res = await syncWithSupabase();
      setImportStatus({
        type: res.success ? 'success' : 'error',
        message: res.message
      });
      if (res.success) {
        setDbStatus({ checked: true, success: true, message: 'Database tersinkronisasi aktif!' });
      }
    } catch (e: any) {
      setImportStatus({
        type: 'error',
        message: `Gagal menyinkronkan: ${e.message}`
      });
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPullingDb(true);
    try {
      const res = await pullFromSupabase();
      setImportStatus({
        type: res.success ? 'success' : 'error',
        message: res.message
      });
      refreshData();
    } catch (e: any) {
      setImportStatus({
        type: 'error',
        message: `Gagal memuat: ${e.message}`
      });
    } finally {
      setIsPullingDb(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings({
      ...settings,
      farmName,
      ownerName,
      currency,
      ...{ operatorName, location }
    });
    refreshData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      ExcelService.exportToExcel();
      setImportStatus({
        type: 'success',
        message: 'File Excel (.xlsx) berhasil digenerate dan diunduh ke perangkat Anda!'
      });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `Gagal mengekspor data Excel: ${err.message}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await ExcelService.importFromExcel(file);
      if (result.success) {
        setImportStatus({
          type: 'success',
          message: result.message
        });
        refreshData();
      } else {
        setImportStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `Kesalahan saat membaca file Excel: ${err.message}`
      });
    } finally {
      setIsImporting(false);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset data aplikasi ke data bawaan demo? Seluruh perubahan lokal akan dikembalikan.')) {
      StorageService.resetToSeedData();
      refreshData();
      alert('Data telah direset ke setelan awal.');
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            Pengaturan Sistem & Integrasi Database
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Kelola profil kebun, sinkronisasi cloud Supabase (PostgreSQL), dan pencadangan data multi-sheet Excel (.xlsx).
        </p>
      </div>

      {/* 2. SUPABASE DATABASE STATUS & SYNC */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-800">
              Integrasi Cloud Database Supabase (PostgreSQL)
            </h3>
          </div>
          {dbStatus && (
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                dbStatus.success
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus.success ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {dbStatus.success ? 'Terkoneksi Aktif' : 'Perlu Setup / Verifikasi'}
            </span>
          )}
        </div>

        <div className="p-4 bg-[#f9faf8] border border-[#e1e5db] rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-700" /> Endpoint Supabase:
              </div>
              <div className="font-mono text-[11px] text-gray-600 mt-0.5 break-all">
                https://wznkngfafhhmzkfrlczg.supabase.co
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isTestingDb}
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin text-emerald-600' : ''}`} />
                {isTestingDb ? 'Memeriksa...' : 'Cek Koneksi'}
              </button>
            </div>
          </div>

          {dbStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                dbStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {dbStatus.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold">{dbStatus.message}</div>
                {!dbStatus.success && (
                  <div className="text-[11px] text-amber-800/90 leading-relaxed pt-1 space-y-1 border-t border-amber-200/60 mt-1">
                    <p className="font-medium text-amber-900">Solusi jika muncul "Failed to fetch" atau tabel belum dibuat:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1">
                      <li><strong>Proyek Baru Dibuat</strong>: Tunggu 1–2 menit agar project Supabase selesai booting (status Active).</li>
                      <li><strong>Buat Tabel Skema</strong>: Salin skrip SQL di bawah lalu jalankan di menu <strong>SQL Editor</strong> Supabase.</li>
                      <li><strong>Browser Shield</strong>: Pastikan ekstensi Adblock / Brave Shield tidak memblokir domain <code className="bg-amber-100 px-1 py-0.5 rounded">supabase.co</code>.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick SQL Schema Box */}
          <div className="bg-white border border-[#e1e5db] rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">Skrip Skema SQL Supabase (19 Tabel)</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isSqlCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {isSqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-300 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Lihat Skrip
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSqlFile}
                  className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-300 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Unduh .sql
                </button>
                <a
                  href="https://supabase.com/dashboard/project/wznkngfafhhmzkfrlczg/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buka SQL Editor Supabase
                </a>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Buka link <strong>SQL Editor Supabase</strong> di atas, klik <strong>New Query</strong>, tempelkan skrip SQL (klik tombol <em>Salin Skrip SQL</em>), lalu klik <strong>Run</strong> untuk membuat seluruh tabel secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncingDb}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncingDb ? 'animate-bounce' : ''}`} />
              {isSyncingDb ? 'Menyinkronkan ke Supabase...' : 'Upload Semua Data Lokal ke Supabase'}
            </button>

            <button
              onClick={handlePullFromSupabase}
              disabled={isPullingDb}
              className="px-3.5 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <CloudDownload className={`w-4 h-4 ${isPullingDb ? 'animate-bounce' : ''}`} />
              {isPullingDb ? 'Mengambil Data...' : 'Tarik Data Terbaru dari Supabase'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. FARM PROFILE FORM */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-3 border-b border-[#e9ece6]">
          <Building className="w-4 h-4 text-emerald-700" /> Profil Kebun & Pengelola
        </h3>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Pengaturan profil berhasil disimpan!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Nama Pemilik / Owner Kebun <span className="text-emerald-700 font-bold">*</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Contoh: Pak Budi Hartono"
                className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3.5 py-2 text-slate-800 font-bold focus:outline-emerald-600 focus:bg-white"
                required
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Ditampilkan di header atas dan seluruh lembar laporan resmi.
              </span>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Nama Usaha / Kebun Tani <span className="text-emerald-700 font-bold">*</span>
              </label>
              <input
                type="text"
                value={farmName}
                onChange={e => setFarmName(e.target.value)}
                placeholder="Contoh: Nusantara Agro Farm"
                className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3.5 py-2 text-slate-800 font-bold focus:outline-emerald-600 focus:bg-white"
                required
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Nama entitas kebun atau brand pertanian.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Nama Tim Agronomis / Kepala Kebun</label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="Contoh: Agronomist & Tim Kebun"
                className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3.5 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">Lokasi Kebun / Domisili</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Contoh: Karanganyar, Jawa Tengah"
                className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3.5 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Simpan Perubahan Pemilik & Profil
          </button>
        </form>
      </div>

      {/* 4. EXCEL BACKUP & RESTORE */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Ekspor & Impor Cadangan Offline (Excel .xlsx)
          </h3>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Multi-Sheet XLSX
          </span>
        </div>

        {importStatus && (
          <div
            className={`p-3 text-xs rounded-xl flex items-center gap-2 border ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#f9faf8] border border-[#e1e5db] rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-800">Ekspor ke Format Excel (.xlsx)</h4>
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Unduh seluruh data siklus, master komoditas, plot lahan, inventaris, log panen, pemantauan harian, dan keuangan ke dalam buku kerja Excel dengan sheet-sheet terpisah yang rapi dan mudah dibaca.
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              {isExporting ? 'Memproses Ekspor...' : 'Unduh Data Excel (.xlsx)'}
            </button>
          </div>

          <div className="p-4 bg-[#f9faf8] border border-[#e1e5db] rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-800">Impor & Pulihkan dari Excel (.xlsx)</h4>
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Unggah berkas Excel (.xlsx) cadangan untuk memulihkan master data dan seluruh catatan operasional kebun secara otomatis.
              </p>
            </div>

            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Sedang Membaca...' : 'Pilih File Excel (.xlsx)'}</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset Option */}
        <div className="pt-3 border-t border-[#e9ece6] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700">Setel Ulang Data Demo</div>
            <div className="text-[11px] text-gray-400">Kembalikan aplikasi ke dataset awal bawaan sistem.</div>
          </div>
          <button
            onClick={handleResetToDefault}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Data Demo
          </button>
        </div>
      </div>

      {/* SQL SCHEMA VIEWER MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    Skrip SQL Skema Supabase (19 Tabel PostgreSQL)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Jalankan skrip ini sekali di SQL Editor Supabase untuk membuat seluruh tabel dan kebijakan akses.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-gray-500">
                Panjang skrip: ~19 tabel, RLS policies, dan indeks relasi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  {isSqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isSqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Semua SQL'}
                </button>
                <button
                  onClick={handleDownloadSqlFile}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh .sql
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


