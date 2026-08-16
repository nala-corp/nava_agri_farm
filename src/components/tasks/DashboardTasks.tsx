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
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CycleTask, SOPTaskField } from '../../types';
import { StorageService } from '../../services/storage';

export const DashboardTasks: React.FC = () => {
  const { activeCycle, tasks, refreshData, calculateCycleDay, inventory } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [executingTask, setExecutingTask] = useState<CycleTask | null>(null);

  // Execution form state
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [deviationNotes, setDeviationNotes] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [validationWarnings, setValidationWarnings] = useState<{ fieldLabel: string; message: string }[]>([]);

  const cycleDay = activeCycle ? calculateCycleDay(activeCycle.startDate) : { dayNumber: 0, label: 'H-0' };

  // Filter tasks belonging to active cycle
  const cycleTasks = useMemo(() => {
    if (!activeCycle) return [];
    return tasks.filter(t => t.cycleId === activeCycle.id);
  }, [tasks, activeCycle]);

  // Categorize tasks
  const filteredTasks = useMemo(() => {
    return cycleTasks.filter(task => {
      // Type filter
      if (typeFilter !== 'all' && task.taskType !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'completed') return task.status === 'completed';
      if (statusFilter === 'overdue') return task.status === 'overdue';
      
      if (statusFilter === 'today') {
        // Task matching today's cycle day or pending past
        return task.status === 'pending' && task.dayOffset <= cycleDay.dayNumber;
      }
      if (statusFilter === 'upcoming') {
        return task.status === 'pending' && task.dayOffset > cycleDay.dayNumber;
      }

      return true;
    });
  }, [cycleTasks, statusFilter, typeFilter, cycleDay]);

  const taskCounts = useMemo(() => {
    const todayCount = cycleTasks.filter(t => t.status === 'pending' && t.dayOffset <= cycleDay.dayNumber).length;
    const upcomingCount = cycleTasks.filter(t => t.status === 'pending' && t.dayOffset > cycleDay.dayNumber).length;
    const overdueCount = cycleTasks.filter(t => t.status === 'overdue').length;
    const completedCount = cycleTasks.filter(t => t.status === 'completed').length;
    return { todayCount, upcomingCount, overdueCount, completedCount, total: cycleTasks.length };
  }, [cycleTasks, cycleDay]);

  // Open task execution modal
  const handleStartTask = (task: CycleTask) => {
    setExecutingTask(task);
    setValidationWarnings([]);
    setDeviationNotes('');
    setTaskNotes('');

    // Pre-populate default values if any
    const initialValues: Record<string, any> = {};
    task.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        initialValues[f.name] = f.defaultValue;
      } else if (f.sopStandardExpected !== undefined) {
        initialValues[f.name] = f.sopStandardExpected;
      } else if (f.type === 'number' && f.sopStandardMin !== undefined) {
        initialValues[f.name] = f.sopStandardMin;
      }
    });
    setFieldValues(initialValues);
  };

  // Validate fields in real-time as values change
  const handleFieldValueChange = (fieldName: string, value: any, fieldObj: SOPTaskField) => {
    const updated = { ...fieldValues, [fieldName]: value };
    setFieldValues(updated);

    if (!executingTask) return;

    // Check SOP validation rules
    const warnings: { fieldLabel: string; message: string }[] = [];

    executingTask.validationRules.forEach(rule => {
      if (rule.fieldId === fieldObj.id) {
        const numVal = Number(value);
        if (!isNaN(numVal)) {
          if (rule.minValue !== undefined && numVal < rule.minValue) {
            warnings.push({ fieldLabel: fieldObj.label, message: rule.warningMessage || `Nilai kurang dari standar minimum (${rule.minValue})` });
          }
          if (rule.maxValue !== undefined && numVal > rule.maxValue) {
            warnings.push({ fieldLabel: fieldObj.label, message: rule.warningMessage || `Nilai melebihi batas maksimum (${rule.maxValue})` });
          }
        }
      }
    });

    // Also check standard min/max on field definition
    if (fieldObj.type === 'number') {
      const numVal = Number(value);
      if (!isNaN(numVal)) {
        if (fieldObj.sopStandardMin !== undefined && numVal < fieldObj.sopStandardMin) {
          warnings.push({ fieldLabel: fieldObj.label, message: `Di bawah standar SOP (${fieldObj.sopStandardMin} ${fieldObj.unit || ''})` });
        }
        if (fieldObj.sopStandardMax !== undefined && numVal > fieldObj.sopStandardMax) {
          warnings.push({ fieldLabel: fieldObj.label, message: `Melebihi standar SOP (${fieldObj.sopStandardMax} ${fieldObj.unit || ''})` });
        }
      }
    }

    setValidationWarnings(warnings);
  };

  // Submit task completion
  const handleCompleteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingTask || !activeCycle) return;

    StorageService.executeTask(
      executingTask.id,
      {
        cycleId: activeCycle.id,
        submittedBy: 'Pak Budi (Owner)',
        fieldValues,
        deviationNotes: validationWarnings.length > 0 ? deviationNotes : undefined,
        notes: taskNotes
      },
      true // Auto-deduct inventory
    );

    refreshData();
    setExecutingTask(null);
  };

  // Linked inventory item preview
  const linkedItem = executingTask?.linkedInventoryItemId
    ? inventory.find(i => i.id === executingTask.linkedInventoryItemId)
    : null;

  return (
    <div className="space-y-5">
      
      {/* HEADER & FILTER BAR */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e9ece6]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-700" />
              Dashboard Eksekusi Tugas SOP
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Siklus: <span className="text-emerald-700 font-semibold">{activeCycle?.fieldName} — {activeCycle?.varietyName}</span> ({cycleDay.label})
            </p>
          </div>

          {/* Task Type Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Tipe Tugas:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-600 focus:bg-white"
            >
              <option value="all">Semua Tipe</option>
              <option value="monitoring">Monitoring</option>
              <option value="fertilization">Pemupukan</option>
              <option value="irrigation">Irigasi & Air</option>
              <option value="pest_treatment">Pengendalian Hama</option>
              <option value="disease_treatment">Pengendalian Penyakit</option>
              <option value="planting">Penanaman</option>
              <option value="maintenance">Pemeliharaan / Wiwit</option>
              <option value="harvest">Panen</option>
              <option value="checklist">Checklist</option>
            </select>
          </div>
        </div>

        {/* STATUS TABS */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 text-xs">
          <button
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

      {/* TASK LIST CARDS */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isToday = task.dayOffset === cycleDay.dayNumber;

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-[#e9ece6] opacity-75'
                    : isToday
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-[#e9ece6] hover:border-emerald-200'
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
                      <span className="text-xs font-semibold text-slate-800">
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

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2 flex-wrap">
                      <span>Fase: <strong className="text-slate-700">{task.stageName}</strong></span>
                      <span>•</span>
                      <span>Jadwal: {task.scheduledDate} (Pukul {task.deadlineTime || '12:00'} WIB)</span>
                      {task.fields.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">{task.fields.length} parameter input SOP</span>
                        </>
                      )}
                    </div>

                    {/* Submission summary if completed */}
                    {isCompleted && task.submission && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#f9faf8] border border-[#e1e5db] text-[11px] text-slate-700">
                        <div className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Diselesaikan {task.completedAt ? new Date(task.completedAt).toLocaleDateString('id-ID') : ''}
                        </div>
                        {task.submission.notes && <p className="text-gray-500 mt-0.5">Catatan: {task.submission.notes}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {!isCompleted ? (
                    <button
                      onClick={() => handleStartTask(task)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Eksekusi Tugas
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTask(task)}
                      className="px-3 py-1.5 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Lihat Hasil
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white border border-[#e9ece6] rounded-2xl text-gray-400 text-xs shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            Tidak ada tugas yang sesuai dengan filter yang dipilih.
          </div>
        )}
      </div>

      {/* DYNAMIC TASK EXECUTION MODAL WITH SOP VALIDATION */}
      {executingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-auto text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  H{executingTask.dayOffset >= 0 ? `+${executingTask.dayOffset}` : executingTask.dayOffset} — {executingTask.stageName}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {executingTask.taskName}
                </h3>
              </div>
              <button
                onClick={() => setExecutingTask(null)}
                className="p-1.5 text-gray-400 hover:text-slate-700 rounded-lg hover:bg-[#f3f5f0] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body & Dynamic Fields */}
            <form onSubmit={handleCompleteTask} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Task Description */}
              <div className="p-3 bg-[#f9faf8] rounded-xl border border-[#e1e5db] text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-800">Petunjuk SOP: </span>
                {executingTask.description}
              </div>

              {/* Linked Inventory Auto Deduction Warning */}
              {linkedItem && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-2.5">
                  <Boxes className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-teal-900">Integrasi Stok Otomatis: </span>
                    <p className="text-teal-800 text-[11px] mt-0.5">
                      Tugas ini terhubung ke inventaris <strong className="text-teal-950">{linkedItem.name}</strong> (Stok saat ini: {linkedItem.currentStock} {linkedItem.unit}). Stok akan otomatis terpotong saat tugas diselesaikan.
                    </p>
                  </div>
                </div>
              )}

              {/* DYNAMIC SOP INPUT FIELDS */}
              {executingTask.fields.length > 0 ? (
                <div className="space-y-3.5 pt-1">
                  <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    Parameter Input SOP
                  </div>

                  {executingTask.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-700 font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.unit && <span className="text-[10px] text-gray-400">({field.unit})</span>}
                      </div>

                      {/* Render based on field type */}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          step="any"
                          value={fieldValues[field.name] !== undefined ? fieldValues[field.name] : ''}
                          onChange={e => handleFieldValueChange(field.name, e.target.value, field)}
                          className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                          required={field.required}
                        />
                      )}

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={fieldValues[field.name] || ''}
                          onChange={e => handleFieldValueChange(field.name, e.target.value, field)}
                          className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                          required={field.required}
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={fieldValues[field.name] || ''}
                          onChange={e => handleFieldValueChange(field.name, e.target.value, field)}
                          className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                          required={field.required}
                        >
                          <option value="">-- Pilih {field.label} --</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          value={fieldValues[field.name] || ''}
                          onChange={e => handleFieldValueChange(field.name, e.target.value, field)}
                          rows={2}
                          className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                          required={field.required}
                        />
                      )}

                      {field.type === 'photo' && (
                        <div className="p-3 border border-dashed border-[#d2d7cb] rounded-xl text-center bg-[#fbfcfb]">
                          <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-[11px] text-gray-500">Dokumentasi foto lapangan tersimpan di galeri siklus</p>
                        </div>
                      )}

                      {field.description && (
                        <p className="text-[10px] text-gray-400">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#f9faf8] text-gray-500 text-center">
                  Tugas checklist standar (tidak memerlukan parameter input khusus).
                </div>
              )}

              {/* SOP STANDARD VALIDATION WARNINGS */}
              {validationWarnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    Peringatan Deviasi Standar SOP
                  </div>
                  {validationWarnings.map((w, idx) => (
                    <div key={idx} className="text-amber-800 text-[11px] pl-5">
                      • <strong>{w.fieldLabel}:</strong> {w.message}
                    </div>
                  ))}

                  <div className="pt-2 border-t border-amber-200">
                    <label className="block text-amber-900 text-[11px] font-semibold mb-1">
                      Alasan Deviasi / Penyesuaian Lapangan:
                    </label>
                    <input
                      type="text"
                      value={deviationNotes}
                      onChange={e => setDeviationNotes(e.target.value)}
                      placeholder="Contoh: Tanaman kekurangan hara makro, dinaikkan sementara..."
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-amber-600"
                      required
                    />
                  </div>
                </div>
              )}

              {/* General Task Notes */}
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Pelaksanaan (Opsional)</label>
                <textarea
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  placeholder="Catatan kendala lapangan, kondisi cuaca saat aplikasi..."
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExecutingTask(null)}
                  className="px-4 py-2 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Selesaikan & Rekam Tugas SOP
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
