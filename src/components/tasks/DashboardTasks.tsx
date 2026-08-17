import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Boxes,
  Camera,
  FileText,
  Play,
  RotateCcw,
  ShieldAlert,
  Search,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CycleTask, SOPTaskField } from '../../types';
import { StorageService } from '../../services/storage';
import { TaskChecklistModal } from './TaskChecklistModal';

export const DashboardTasks: React.FC = () => {
  const { activeCycle, tasks, refreshData, calculateCycleDay, inventory } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<CycleTask | null>(null);

  const cycleDay = activeCycle
    ? calculateCycleDay(activeCycle.startDate, activeCycle.landPrepStartDate)
    : { dayNumber: 0, label: 'H-0' };

  // Filter tasks belonging to active cycle
  const cycleTasks = useMemo(() => {
    if (!activeCycle) return [];
    return tasks.filter(t => t.cycleId === activeCycle.id);
  }, [tasks, activeCycle]);

  // Distinct stage names
  const stageOptions = useMemo(() => {
    const set = new Set<string>();
    cycleTasks.forEach(t => {
      if (t.stageName) set.add(t.stageName);
    });
    return Array.from(set);
  }, [cycleTasks]);

  // Categorize & search tasks
  const filteredTasks = useMemo(() => {
    return cycleTasks.filter(task => {
      // Stage filter
      if (stageFilter !== 'all' && task.stageName !== stageFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && task.taskType !== typeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = task.taskName.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchStage = task.stageName.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchStage) return false;
      }

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'completed') return task.status === 'completed';
      if (statusFilter === 'overdue') return task.status === 'overdue';
      
      if (statusFilter === 'today') {
        return task.status === 'pending' && task.dayOffset <= cycleDay.dayNumber;
      }
      if (statusFilter === 'upcoming') {
        return task.status === 'pending' && task.dayOffset > cycleDay.dayNumber;
      }

      return true;
    });
  }, [cycleTasks, statusFilter, typeFilter, stageFilter, searchQuery, cycleDay]);

  const taskCounts = useMemo(() => {
    const todayCount = cycleTasks.filter(t => t.status === 'pending' && t.dayOffset <= cycleDay.dayNumber).length;
    const upcomingCount = cycleTasks.filter(t => t.status === 'pending' && t.dayOffset > cycleDay.dayNumber).length;
    const overdueCount = cycleTasks.filter(t => t.status === 'overdue').length;
    const completedCount = cycleTasks.filter(t => t.status === 'completed').length;
    return { todayCount, upcomingCount, overdueCount, completedCount, total: cycleTasks.length };
  }, [cycleTasks, cycleDay]);

  // Quick Action: One click mark done
  const handleQuickMarkDone = (task: CycleTask, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.quickCompleteTask(task.id, {}, 'Diselesaikan secara cepat dari daftar tugas.');
    refreshData();
  };

  // Quick Action: Revert / Batalkan status selesai
  const handleRevertTask = (task: CycleTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Batalkan status selesai untuk "${task.taskName}" dan kembalikan ke status belum dikerjakan?`)) {
      StorageService.revertTask(task.id);
      refreshData();
    }
  };

  return (
    <div className="space-y-5">
      
      {/* HEADER & FILTER BAR */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-700" />
              Daftar Tugas & Checklist Harian SOP
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Siklus: <span className="text-emerald-700 font-semibold">{activeCycle?.fieldName} — {activeCycle?.varietyName}</span> ({cycleDay.label})
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama tugas atau kegiatan..."
              className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Dropdown Filters: Fase & Tipe */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Fase SOP:</span>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">Semua Fase ({stageOptions.length})</option>
              {stageOptions.map(stg => (
                <option key={stg} value={stg}>{stg}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Tipe Tugas:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">Semua Tipe</option>
              <option value="monitoring">Monitoring & Inspeksi</option>
              <option value="fertilization">Pemupukan & Nutrisi</option>
              <option value="irrigation">Irigasi & Pengairan</option>
              <option value="pest_treatment">Pengendalian Hama</option>
              <option value="disease_treatment">Pengendalian Penyakit</option>
              <option value="planting">Penanaman & Pembibitan</option>
              <option value="maintenance">Pemeliharaan / Wiwit</option>
              <option value="harvest">Panen</option>
              <option value="checklist">Checklist</option>
            </select>
          </div>
        </div>

        {/* STATUS TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-[#e9ece6]">
          <button
            type="button"
            onClick={() => setStatusFilter('today')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Hari Ini ({taskCounts.todayCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'upcoming'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Mendatang ({taskCounts.upcomingCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Terlambat ({taskCounts.overdueCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai ({taskCounts.completedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6]'
            }`}
          >
            Semua ({taskCounts.total})
          </button>
        </div>
      </div>

      {/* TASK LIST CARDS WITH CHECKLIST & UNDO ACTIONS */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isToday = task.dayOffset === cycleDay.dayNumber;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskForModal(task)}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group ${
                  isCompleted
                    ? 'border-[#e9ece6] bg-[#fbfcfb] opacity-80 hover:opacity-100 hover:border-emerald-300'
                    : isToday
                    ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                    : 'border-[#e9ece6] hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-[#f3f5f0] text-slate-700 border border-[#e1e5db]'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-700" /> : `H${task.dayOffset >= 0 ? `+${task.dayOffset}` : task.dayOffset}`}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-900">
                        {task.taskName}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-[#f3f5f0] text-slate-600 border border-[#e1e5db]">
                        {task.taskType}
                      </span>
                      {task.priority === 'critical' && !isCompleted && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                          KRITIS
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Stage & Schedule Info */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2 flex-wrap">
                      <span>Fase: <strong className="text-slate-700">{task.stageName}</strong></span>
                      <span>•</span>
                      <span>Jadwal: {task.scheduledDate} (Pukul {task.deadlineTime || '10:00'} WIB)</span>
                      {task.fields?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200/50">
                            {task.fields.length} checklist item kegiatan
                          </span>
                        </>
                      )}
                    </div>

                    {/* Inline checklist summary if has fields */}
                    {task.fields && task.fields.length > 0 && !isCompleted && (
                      <div className="mt-2.5 p-2 bg-[#f9faf8] rounded-xl border border-[#e9ece6] flex items-center gap-2 flex-wrap text-[11px] text-gray-600">
                        <span className="font-semibold text-slate-700">Checklist Field:</span>
                        {task.fields.slice(0, 3).map((f, fIdx) => (
                          <span key={fIdx} className="bg-white px-2 py-0.5 rounded border border-[#e1e5db] text-[10px] text-slate-700">
                            ✓ {f.label}
                          </span>
                        ))}
                        {task.fields.length > 3 && (
                          <span className="text-[10px] text-gray-400 font-mono">+{task.fields.length - 3} lainnya</span>
                        )}
                      </div>
                    )}

                    {/* Submission summary if completed */}
                    {isCompleted && task.submission && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-[11px] text-slate-700">
                        <div className="font-semibold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Telah diselesaikan {task.completedAt ? `pada ${new Date(task.completedAt).toLocaleString('id-ID')}` : ''}
                        </div>
                        {task.submission.notes && (
                          <p className="text-gray-600 mt-0.5">Catatan: {task.submission.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {!isCompleted ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskForModal(task);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Checklist / Selesai
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickMarkDone(task, e)}
                        className="px-2.5 py-2 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold cursor-pointer"
                        title="Tandai langsung selesai dengan cepat"
                      >
                        ✓ Kilat
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskForModal(task);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-medium cursor-pointer"
                      >
                        Lihat Data
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRevertTask(task, e)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Batalkan status selesai jika ada kesalahan input"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Batal Selesai
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white border border-[#e9ece6] rounded-2xl text-gray-400 text-xs shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            Tidak ada tugas yang sesuai dengan filter yang dipilih.
          </div>
        )}
      </div>

      {/* TASK CHECKLIST MODAL */}
      <TaskChecklistModal
        task={selectedTaskForModal}
        isOpen={!!selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        inventory={inventory}
        cyclePlantCount={activeCycle?.plantCount}
        onSuccess={() => {
          refreshData();
        }}
      />

    </div>
  );
};
