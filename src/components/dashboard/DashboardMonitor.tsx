import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Droplets,
  Thermometer,
  Layers,
  Calendar,
  Sprout,
  ArrowRight,
  TrendingUp,
  Bug,
  Plus,
  Compass,
  FileCheck2,
  Sliders,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { SOPStage } from '../../types';

export const DashboardMonitor: React.FC = () => {
  const {
    activeCycle,
    calculateCycleDay,
    tasks,
    inventory,
    setActiveTab,
    openQuickAction,
    refreshData
  } = useApp();

  // STAGE MANAGEMENT MODAL STATE
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStageToEdit, setSelectedStageToEdit] = useState<SOPStage | null>(null);
  const [editStartDay, setEditStartDay] = useState<number>(0);
  const [editEndDay, setEditEndDay] = useState<number>(0);

  const cycleDay = activeCycle
    ? calculateCycleDay(activeCycle.startDate, activeCycle.landPrepStartDate)
    : { dayNumber: 0, label: 'H-0', isLandPrep: false, displayStatus: 'Belum Tanam' };

  // Fetch monitoring for active cycle
  const monitoringRecords = useMemo(() => {
    return activeCycle ? StorageService.getMonitoringRecords(activeCycle.id) : [];
  }, [activeCycle]);

  // Fetch pest & disease observations for active cycle
  const pestObs = useMemo(() => {
    return activeCycle ? StorageService.getPestObservations(activeCycle.id) : [];
  }, [activeCycle]);

  const diseaseObs = useMemo(() => {
    return activeCycle ? StorageService.getDiseaseObservations(activeCycle.id) : [];
  }, [activeCycle]);

  // Cycle specific tasks
  const cycleTasks = useMemo(() => {
    return activeCycle ? tasks.filter(t => t.cycleId === activeCycle.id) : [];
  }, [activeCycle, tasks]);

  const completedTasks = cycleTasks.filter(t => t.status === 'completed');
  const pendingTasks = cycleTasks.filter(t => t.status === 'pending');
  const overdueTasks = cycleTasks.filter(t => t.status === 'overdue');
  const taskProgressPercent = cycleTasks.length > 0 ? Math.round((completedTasks.length / cycleTasks.length) * 100) : 0;

  // Latest monitoring record
  const latestMon = monitoringRecords[0];

  // Plant stats calculation
  const totalPlants = activeCycle?.plantCount || 0;
  const healthyCount = latestMon ? Math.round((latestMon.healthyCount / (latestMon.plantsInspected || 1)) * totalPlants) : Math.round(totalPlants * 0.96);
  const attentionCount = latestMon ? Math.round((latestMon.attentionCount / (latestMon.plantsInspected || 1)) * totalPlants) : Math.round(totalPlants * 0.03);
  const problemCount = latestMon ? Math.round((latestMon.problematicCount / (latestMon.plantsInspected || 1)) * totalPlants) : Math.round(totalPlants * 0.01);
  const deadCount = latestMon ? latestMon.deadCount : 0;
  const survivalRate = totalPlants > 0 ? (((totalPlants - deadCount) / totalPlants) * 100).toFixed(1) : '100';

  // Determine current active stage from manual override OR SOP snapshot timeline
  const currentStage = useMemo(() => {
    if (!activeCycle?.sopSnapshot?.stages) return null;
    if (activeCycle.activeStageId) {
      const found = activeCycle.sopSnapshot.stages.find(s => s.id === activeCycle.activeStageId);
      if (found) return found;
    }
    const currentDay = cycleDay.dayNumber;
    return (
      activeCycle.sopSnapshot.stages.find(
        s => currentDay >= s.targetStartDay && currentDay <= s.targetEndDay
      ) || activeCycle.sopSnapshot.stages[0]
    );
  }, [activeCycle, cycleDay]);

  const handleOpenStageEditor = (stage: SOPStage) => {
    setSelectedStageToEdit(stage);
    setEditStartDay(stage.targetStartDay);
    setEditEndDay(stage.targetEndDay);
    setShowStageModal(true);
  };

  const handleSetActiveStage = (stageId: string | null) => {
    if (!activeCycle) return;
    StorageService.setActiveStageForCycle(activeCycle.id, stageId);
    refreshData();
  };

  const handleSaveStageDays = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !selectedStageToEdit) return;

    StorageService.updateCycleStageTargetDays(
      activeCycle.id,
      selectedStageToEdit.id,
      Number(editStartDay),
      Number(editEndDay)
    );
    refreshData();
    setShowStageModal(false);
    setSelectedStageToEdit(null);
  };

  if (!activeCycle) {
    return (
      <div className="p-8 text-center bg-white border border-[#e9ece6] rounded-2xl shadow-xs">
        <Sprout className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Belum Ada Siklus Budidaya Aktif</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
          Mulai dengan membuat siklus budidaya pertama untuk lahan dan tanaman Anda.
        </p>
        <button
          onClick={() => openQuickAction('create_cycle')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-sm shadow-emerald-200"
        >
          + Buat Siklus Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* 1. HERO CONTEXT CARD & CURRENT STAGE BANNER */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          
          {/* Main Cycle Info */}
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-xs">
              {activeCycle.cropIcon}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold bg-[#f3f5f0] text-emerald-900 px-2 py-0.5 rounded-md border border-[#e1e5db]">
                  {activeCycle.cycleCode}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                    cycleDay.isLandPrep
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {cycleDay.label} ({cycleDay.displayStatus})
                </span>
                {activeCycle.landPrepStartDate && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-medium">
                    <Compass className="w-3 h-3" /> Olah Lahan: {activeCycle.landPrepStartDate}
                  </span>
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Tanam (H-0): {activeCycle.startDate}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mt-1 tracking-tight">
                {activeCycle.cropTypeName} — <span className="text-emerald-700 font-semibold">{activeCycle.varietyName}</span>
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                Lokasi: <span className="text-slate-700 font-medium">{activeCycle.fieldName}</span> • Populasi: <span className="text-slate-800 font-semibold">{activeCycle.plantCount.toLocaleString('id-ID')}</span> tanaman
              </p>
            </div>
          </div>

          {/* SOP Snapshot Badge & Progress */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#e9ece6]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Snapshot SOP:</span>
              <span className="text-xs font-mono font-bold bg-[#f3f5f0] text-emerald-800 px-2 py-1 rounded-lg border border-[#e1e5db] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {activeCycle.sopSnapshot?.versionNumber || 'V1.0'}
              </span>
            </div>

            <div className="text-left lg:text-right">
              <div className="text-[11px] text-gray-500">
                Progres Pelaksanaan SOP: <span className="font-bold text-slate-800">{completedTasks.length} / {cycleTasks.length} Tugas ({taskProgressPercent}%)</span>
              </div>
              <div className="w-44 bg-[#f3f5f0] rounded-full h-2 mt-1.5 overflow-hidden border border-[#e1e5db]">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* STAGES TIMELINE HORIZONTAL - INTERACTIVE & CLICKABLE */}
        <div className="mt-5 pt-4 border-t border-[#e9ece6]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-gray-500 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              Tahapan Siklus SOP ({activeCycle.sopSnapshot?.stages?.length || 0} Fase)
              <span className="text-[10px] text-gray-400 font-normal normal-case hidden sm:inline">
                (Klik fase untuk pindah aktif atau sesuaikan hari)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeCycle.activeStageId && (
                <button
                  type="button"
                  onClick={() => handleSetActiveStage(null)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                  title="Kembalikan tahapan aktif ke kalkulasi otomatis umur tanaman"
                >
                  Mode Otomatis
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (activeCycle.sopSnapshot?.stages?.[0]) {
                    handleOpenStageEditor(activeCycle.sopSnapshot.stages[0]);
                  }
                }}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sliders className="w-3 h-3" />
                Atur Fase SOP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {activeCycle.sopSnapshot?.stages?.map((stage) => {
              const isCurrent = currentStage?.id === stage.id;
              const isPast = cycleDay.dayNumber > stage.targetEndDay;
              const isManualActive = activeCycle.activeStageId === stage.id;
              const startLabel = stage.targetStartDay >= 0 ? `H+${stage.targetStartDay}` : `H${stage.targetStartDay}`;
              const endLabel = stage.targetEndDay >= 0 ? `H+${stage.targetEndDay}` : `H${stage.targetEndDay}`;

              return (
                <button
                  type="button"
                  key={stage.id}
                  onClick={() => handleOpenStageEditor(stage)}
                  className={`p-2.5 rounded-xl border transition-all text-left group cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : isPast
                      ? 'bg-[#fbfcfb] border-[#e9ece6] hover:border-emerald-300'
                      : 'bg-white border-[#e9ece6] hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-gray-500">{startLabel} - {endLabel}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold text-[9px] flex items-center gap-0.5">
                        {isManualActive ? 'AKTIF (MANUAL)' : 'AKTIF'}
                      </span>
                    )}
                    {isPast && !isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <div className={`text-xs font-semibold truncate ${isCurrent ? 'text-emerald-950 font-bold' : 'text-slate-700'}`}>
                    {stage.name}
                  </div>
                  <div className="text-[9px] text-gray-400 group-hover:text-emerald-700 mt-1 flex items-center justify-between">
                    <span>{stage.tasks?.length || 0} kegiatan</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-semibold">Ubah →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* STAGE ADJUSTMENT & SWITCHING MODAL */}
      {showStageModal && selectedStageToEdit && activeCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Pengaturan Fase: {selectedStageToEdit.name}
                </h3>
              </div>
              <button
                onClick={() => setShowStageModal(false)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Switch Action */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block text-xs">Pindah Status Tahapan Aktif</span>
                  <span className="text-[11px] text-emerald-800">
                    Jadikan fase <strong>{selectedStageToEdit.name}</strong> sebagai fase yang sedang berjalan saat ini di lapangan.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {activeCycle.activeStageId === selectedStageToEdit.id ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Sedang Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSetActiveStage(null);
                        setShowStageModal(false);
                      }}
                      className="text-xs text-gray-600 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Reset ke Otomatis
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleSetActiveStage(selectedStageToEdit.id);
                      setShowStageModal(false);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Jadikan Tahap Aktif Sekarang
                  </button>
                )}
              </div>
            </div>

            {/* Stage Duration Form */}
            <form onSubmit={handleSaveStageDays} className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Sesuaikan Target Hari Pada Siklus Ini</span>
                <span className="text-[10px] text-gray-500">Khusus Siklus {activeCycle.cycleCode}</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Ubah rentang waktu fase jika kondisi riil lapangan berbeda (misal olah lahan butuh 30 hari atau 21 hari).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Mulai (Offset Hari)</label>
                  <input
                    type="number"
                    value={editStartDay}
                    onChange={e => setEditStartDay(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono text-center font-bold text-sm"
                    placeholder="Contoh: -30 atau 1"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5 text-center">
                    {editStartDay < 0 ? `${Math.abs(editStartDay)} hari pra-tanam` : `H+${editStartDay}`}
                  </span>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Selesai (Offset Hari)</label>
                  <input
                    type="number"
                    value={editEndDay}
                    onChange={e => setEditEndDay(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono text-center font-bold text-sm"
                    placeholder="Contoh: -1 atau 20"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5 text-center">
                    {editEndDay < 0 ? `${Math.abs(editEndDay)} hari pra-tanam` : `H+${editEndDay}`}
                  </span>
                </div>
              </div>

              {/* Tasks preview in this stage */}
              <div className="bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6] space-y-1.5">
                <span className="font-bold text-gray-700 text-[11px] block">
                  Daftar Tugas Standar Pada Fase Ini:
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {selectedStageToEdit.tasks?.map((t, idx) => (
                    <div key={t.id || idx} className="text-[11px] text-gray-600 flex items-center justify-between">
                      <span className="truncate">• {t.name}</span>
                      <span className="font-mono text-[10px] text-gray-400 shrink-0">H{t.targetDayOffset >= 0 ? `+${t.targetDayOffset}` : t.targetDayOffset}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Simpan Durasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PLANT HEALTH STATUS & KEY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Tanaman & Survival Rate */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-medium">Populasi & Survival</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
            {totalPlants.toLocaleString('id-ID')} <span className="text-xs font-sans text-gray-400 font-normal">pohon</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#e9ece6]">
            <span className="text-gray-500">Survival Rate</span>
            <span className="font-bold text-emerald-700 font-mono">{survivalRate}%</span>
          </div>
        </div>

        {/* Card 2: Kondisi Tanaman Sehat */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-medium">Kondisi Sehat</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
            {healthyCount.toLocaleString('id-ID')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#e9ece6]">
            <span className="text-gray-500">Porsi Populasi</span>
            <span className="font-semibold text-slate-700">
              {totalPlants > 0 ? Math.round((healthyCount / totalPlants) * 100) : 100}%
            </span>
          </div>
        </div>

        {/* Card 3: Perhatian & Bermasalah */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-medium">Perhatian & Sakit</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 font-mono">
            {(attentionCount + problemCount).toLocaleString('id-ID')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#e9ece6]">
            <span className="text-gray-500">Perhatian: {attentionCount}</span>
            <span className="text-red-600 font-medium">Bermasalah: {problemCount}</span>
          </div>
        </div>

        {/* Card 4: Insiden Hama & Penyakit Aktif */}
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-medium">Insiden Hama / Penyakit</span>
            <Bug className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 font-mono">
            {pestObs.filter(p => !p.resolved).length + diseaseObs.filter(d => !d.resolved).length} <span className="text-xs font-sans text-gray-400 font-normal">kasus aktif</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#e9ece6]">
            <span className="text-gray-500">Status Terbaru</span>
            <span className="text-slate-700 font-medium">{pestObs.length > 0 ? pestObs[0].severity : 'Nihil'}</span>
          </div>
        </div>

      </div>

      {/* 3. TODAY'S ACTIONS & LATEST MONITORING METERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Tasks Pending for this Cycle (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">Tugas SOP Siklus Ini ({pendingTasks.length} Menunggu)</h3>
              </div>
              <button
                onClick={() => setActiveTab('dashboard_tasks')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua Tugas →
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {pendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-[#fbfcfb] hover:bg-[#f3f5f0] border border-[#e9ece6] flex items-start justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        H{task.dayOffset >= 0 ? `+${task.dayOffset}` : task.dayOffset}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {task.taskName}
                      </span>
                      {task.priority === 'critical' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                          KRITIS
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1.5">
                      <span>Fase: {task.stageName}</span>
                      <span>•</span>
                      <span>Target: {task.deadlineTime || '12:00'} WIB</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('dashboard_tasks')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Kerjakan
                  </button>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  Semua tugas SOP untuk fase saat ini telah selesai dikerjakan!
                </div>
              )}
            </div>
          </div>

          {/* RECENT MONITORING RECORDS TABLE */}
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">Riwayat Monitoring Harian</h3>
              </div>
              <button
                onClick={() => openQuickAction('add_monitoring')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Catat Monitoring Baru
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
                  <tr>
                    <th className="px-3 py-2">Hari & Tgl</th>
                    <th className="px-3 py-2">Sampling</th>
                    <th className="px-3 py-2">Sehat / Sakit</th>
                    <th className="px-3 py-2">pH / Lembab</th>
                    <th className="px-3 py-2">Tinggi Rata2</th>
                    <th className="px-3 py-2">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2ed]">
                  {monitoringRecords.map((m) => (
                    <tr key={m.id} className="hover:bg-[#f3f5f0]">
                      <td className="px-3 py-2.5 font-medium">
                        <span className="font-mono text-emerald-800 font-bold">H+{m.dayOffset}</span>
                        <div className="text-[10px] text-gray-400">{m.date}</div>
                      </td>
                      <td className="px-3 py-2.5">{m.plantsInspected} pohon</td>
                      <td className="px-3 py-2.5">
                        <span className="text-emerald-700 font-bold">{m.healthyCount}</span> / <span className="text-amber-600">{m.attentionCount}</span> / <span className="text-red-600">{m.problematicCount}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">
                        pH {m.soilPh || '-'} • {m.soilMoisturePercent || '-'}%
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">
                        {m.averageHeightCm ? `${m.averageHeightCm} cm` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate" title={m.notes}>
                        {m.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Agronomy Metrics & Quick Diagnostics (1 Col) */}
        <div className="space-y-4">
          
          {/* LATEST SOIL & CLIMATE METERS */}
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-[#e9ece6]">
              <Droplets className="w-4 h-4 text-teal-600" />
              Parameter Agronomi Terkini
            </h3>

            {/* Moisture Meter */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Kelembaban Tanah</span>
                <span className="font-mono font-bold text-slate-800">{latestMon?.soilMoisturePercent || 65}%</span>
              </div>
              <div className="w-full bg-[#f3f5f0] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full" 
                  style={{ width: `${latestMon?.soilMoisturePercent || 65}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Kering (&lt;40%)</span>
                <span className="text-emerald-700 font-medium">Ideal (60-75%)</span>
                <span>Jenuh (&gt;85%)</span>
              </div>
            </div>

            {/* pH Meter */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Tingkat Kemasaman (pH)</span>
                <span className="font-mono font-bold text-slate-800">pH {latestMon?.soilPh || 6.4}</span>
              </div>
              <div className="w-full bg-[#f3f5f0] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${((latestMon?.soilPh || 6.4) / 14) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Asam (&lt;5.5)</span>
                <span className="text-emerald-700 font-medium">Optimal (6.0 - 7.0)</span>
                <span>Basa (&gt;7.5)</span>
              </div>
            </div>

            {/* Plant Height Growth Metric */}
            <div className="p-3 rounded-xl bg-[#f9faf8] border border-[#e1e5db]">
              <div className="text-[11px] text-gray-500">Rata-rata Tinggi Tanaman</div>
              <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">
                {latestMon?.averageHeightCm || 38} <span className="text-xs font-normal text-gray-400">cm</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                ✓ Sesuai kurva pertumbuhan vegetatif standar SOP
              </div>
            </div>
          </div>

          {/* ACTIVE PEST & DISEASE ALERTS */}
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e9ece6]">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-slate-800">Proteksi Tanaman</h3>
              </div>
              <button
                onClick={() => openQuickAction('add_pest_obs')}
                className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
              >
                + Lapor Hama
              </button>
            </div>

            {pestObs.length > 0 ? (
              pestObs.slice(0, 2).map((obs) => (
                <div key={obs.id} className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs">
                  <div className="flex items-center justify-between font-semibold text-red-800">
                    <span>{obs.pestName}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                      {obs.severity}
                    </span>
                  </div>
                  <p className="text-red-700 text-[11px] mt-1">
                    {obs.affectedPlantsCount} tanaman terindikasi. {obs.actionTaken}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                Tidak ada laporan hama aktif.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
