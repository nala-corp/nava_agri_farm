import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  RotateCcw,
  Clock,
  Boxes,
  AlertTriangle,
  FileText,
  X,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import { CycleTask, SOPTaskField, InventoryItem } from '../../types';
import { StorageService } from '../../services/storage';

interface TaskChecklistModalProps {
  task: CycleTask | null;
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  cyclePlantCount?: number;
  onSuccess: () => void;
}

export const TaskChecklistModal: React.FC<TaskChecklistModalProps> = ({
  task,
  isOpen,
  onClose,
  inventory,
  cyclePlantCount = 1000,
  onSuccess
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [checklistChecks, setChecklistChecks] = useState<Record<string, boolean>>({});
  const [deviationNotes, setDeviationNotes] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [autoDeduct, setAutoDeduct] = useState<boolean>(true);
  const [validationWarnings, setValidationWarnings] = useState<
    { fieldLabel: string; message: string }[]
  >([]);

  useEffect(() => {
    if (task && isOpen) {
      const initialValues: Record<string, any> = {};
      const initialChecks: Record<string, boolean> = {};

      if (task.submission?.fieldValues) {
        setFieldValues(task.submission.fieldValues);
        setDeviationNotes(task.submission.deviationNotes || '');
        setTaskNotes(task.submission.notes || '');

        // Set checks
        task.fields.forEach(f => {
          initialChecks[f.id || f.name] = true;
        });
      } else {
        // Prepopulate defaults
        task.fields.forEach(f => {
          initialChecks[f.id || f.name] = false;
          if (f.defaultValue !== undefined) {
            initialValues[f.name] = f.defaultValue;
          } else if (f.sopStandardExpected !== undefined) {
            initialValues[f.name] = f.sopStandardExpected;
          } else if (f.type === 'number' && f.sopStandardMin !== undefined) {
            initialValues[f.name] = f.sopStandardMin;
          } else if (f.type === 'boolean') {
            initialValues[f.name] = true;
          }
        });
        setFieldValues(initialValues);
        setDeviationNotes('');
        setTaskNotes('');
      }

      setChecklistChecks(initialChecks);
      setValidationWarnings([]);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'completed';

  const linkedItem = task.linkedInventoryItemId
    ? inventory.find(i => i.id === task.linkedInventoryItemId)
    : null;

  // Toggle checklist check
  const handleToggleCheck = (fieldKey: string, fieldObj: SOPTaskField) => {
    const nextVal = !checklistChecks[fieldKey];
    setChecklistChecks(prev => ({ ...prev, [fieldKey]: nextVal }));

    if (fieldObj.type === 'boolean') {
      setFieldValues(prev => ({ ...prev, [fieldObj.name]: nextVal }));
    }
  };

  // Change input value
  const handleValueChange = (fieldName: string, value: any, fieldObj: SOPTaskField) => {
    const updated = { ...fieldValues, [fieldName]: value };
    setFieldValues(updated);

    // Auto mark as checked if filled
    if (value !== '' && value !== undefined) {
      setChecklistChecks(prev => ({ ...prev, [fieldObj.id || fieldObj.name]: true }));
    }

    // Check SOP standard validation
    const warnings: { fieldLabel: string; message: string }[] = [];
    if (fieldObj.type === 'number') {
      const numVal = Number(value);
      if (!isNaN(numVal)) {
        if (fieldObj.sopStandardMin !== undefined && numVal < fieldObj.sopStandardMin) {
          warnings.push({
            fieldLabel: fieldObj.label,
            message: `Di bawah standar SOP (Min: ${fieldObj.sopStandardMin} ${fieldObj.unit || ''})`
          });
        }
        if (fieldObj.sopStandardMax !== undefined && numVal > fieldObj.sopStandardMax) {
          warnings.push({
            fieldLabel: fieldObj.label,
            message: `Melebihi standar SOP (Maks: ${fieldObj.sopStandardMax} ${fieldObj.unit || ''})`
          });
        }
      }
    }
    setValidationWarnings(warnings);
  };

  // Mark all checklist items as completed
  const handleCheckAll = () => {
    const allChecked: Record<string, boolean> = {};
    task.fields.forEach(f => {
      allChecked[f.id || f.name] = true;
    });
    setChecklistChecks(allChecked);
  };

  // SUBMIT COMPLETE
  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();

    StorageService.executeTask(
      task.id,
      {
        cycleId: task.cycleId,
        submittedBy: 'Operator Lapangan (SOP Checklist)',
        fieldValues,
        deviationNotes: validationWarnings.length > 0 ? deviationNotes : undefined,
        notes: taskNotes
      },
      autoDeduct
    );

    onSuccess();
    onClose();
  };

  // REVERT / BATAL SELESAI
  const handleRevert = () => {
    if (confirm(`Batalkan status selesai untuk tugas "${task.taskName}" dan kembalikan ke status Menunggu?`)) {
      StorageService.revertTask(task.id);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl p-5 text-slate-800 text-xs shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
          <div className="flex items-start gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">
                  H{task.dayOffset >= 0 ? `+${task.dayOffset}` : task.dayOffset}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold uppercase">
                  Fase: {task.stageName}
                </span>
                {isCompleted && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                    SELESAI
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                {task.taskName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Description & Timing */}
        <div className="p-3 bg-[#f9faf8] rounded-xl border border-[#e9ece6] space-y-1.5">
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {task.description}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1 border-t border-[#e1e5db] flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Target: {task.scheduledDate} (Pukul {task.deadlineTime || '10:00'} WIB)
            </span>
            <span>•</span>
            <span>Prioritas: <strong className="uppercase text-slate-700">{task.priority}</strong></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleComplete} className="space-y-4">
          
          {/* Section: Interactive Daily Checklist Fields */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                Checklist & Parameter Kegiatan Harian ({task.fields?.length || 0} Item)
              </span>
              {task.fields?.length > 1 && !isCompleted && (
                <button
                  type="button"
                  onClick={handleCheckAll}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  Centang Semua
                </button>
              )}
            </div>

            {task.fields && task.fields.length > 0 ? (
              <div className="space-y-2">
                {task.fields.map((field, idx) => {
                  const fieldKey = field.id || field.name;
                  const isChecked = !!checklistChecks[fieldKey];

                  return (
                    <div
                      key={fieldKey || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20'
                          : 'bg-white border-[#e9ece6] hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Interactive Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleCheck(fieldKey, field)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-300 hover:border-emerald-500'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              onClick={() => handleToggleCheck(fieldKey, field)}
                              className={`font-semibold text-xs cursor-pointer ${
                                isChecked ? 'text-emerald-950 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {field.label}
                            </label>
                            {field.required && (
                              <span className="text-[10px] text-red-500 font-bold">Wajib</span>
                            )}
                          </div>

                          {field.description && (
                            <p className="text-[11px] text-gray-500">
                              {field.description}
                            </p>
                          )}

                          {/* Standard SOP Guide info */}
                          {(field.sopStandardExpected !== undefined ||
                            field.sopStandardMin !== undefined ||
                            field.sopStandardMax !== undefined) && (
                            <div className="text-[10px] font-mono text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-1">
                              <Info className="w-3 h-3 text-emerald-600" />
                              Standar SOP: {field.sopStandardExpected || `${field.sopStandardMin ?? '-'} s/d ${field.sopStandardMax ?? '-'}`} {field.unit || ''}
                            </div>
                          )}

                          {/* Specific input controls if type is not pure boolean */}
                          {field.type !== 'boolean' && (
                            <div className="mt-2 pt-1.5 border-t border-[#f0f2ed]/80">
                              {field.type === 'number' && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    step="any"
                                    value={fieldValues[field.name] ?? ''}
                                    onChange={e => handleValueChange(field.name, e.target.value, field)}
                                    placeholder={`Masukkan nilai (${field.unit || 'angka'})`}
                                    className="w-full max-w-[180px] bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-bold"
                                  />
                                  {field.unit && (
                                    <span className="text-xs text-gray-500 font-semibold">{field.unit}</span>
                                  )}
                                </div>
                              )}

                              {field.type === 'select' && (
                                <select
                                  value={fieldValues[field.name] ?? ''}
                                  onChange={e => handleValueChange(field.name, e.target.value, field)}
                                  className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                >
                                  <option value="">Pilih opsi...</option>
                                  {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {field.type === 'text' && (
                                <input
                                  type="text"
                                  value={fieldValues[field.name] ?? ''}
                                  onChange={e => handleValueChange(field.name, e.target.value, field)}
                                  placeholder="Tulis keterangan atau hasil pengerjaan..."
                                  className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                />
                              )}

                              {field.type === 'textarea' && (
                                <textarea
                                  value={fieldValues[field.name] ?? ''}
                                  onChange={e => handleValueChange(field.name, e.target.value, field)}
                                  rows={2}
                                  placeholder="Keterangan detail hasil inspeksi / tindakan..."
                                  className="w-full bg-white border border-[#e1e5db] rounded-lg p-2 text-xs text-slate-800"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback simple check if no fields defined */
              <div className="p-3 bg-white rounded-xl border border-[#e9ece6] flex items-center gap-3">
                <input
                  type="checkbox"
                  id="task_done_check"
                  checked={checklistChecks['default'] || isCompleted}
                  onChange={e => setChecklistChecks({ default: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="task_done_check" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Tandai seluruh instruksi pekerjaan "{task.taskName}" telah dilaksanakan dengan baik.
                </label>
              </div>
            )}
          </div>

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Penyimpangan dari Standar SOP Terdeteksi:
              </div>
              {validationWarnings.map((w, idx) => (
                <div key={idx} className="text-amber-800 text-[11px]">
                  • <strong>{w.fieldLabel}:</strong> {w.message}
                </div>
              ))}
              <div className="pt-1.5">
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                  Alasan Penyesuaian / Deviasi (Wajib Diisi):
                </label>
                <input
                  type="text"
                  value={deviationNotes}
                  onChange={e => setDeviationNotes(e.target.value)}
                  placeholder="Contoh: Kondisi tanah becek / tanaman menunjukkan gejala kerdil."
                  className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-800"
                  required
                />
              </div>
            </div>
          )}

          {/* Linked Inventory Deduction Preview */}
          {linkedItem && (
            <div className="p-3 bg-[#fbfcfb] rounded-xl border border-[#e9ece6] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-700" />
                <div>
                  <span className="font-semibold text-slate-800">
                    Bahan Terhubung: {linkedItem.name}
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    Stok Tersedia: {linkedItem.currentStock} {linkedItem.unit}
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-emerald-800 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={autoDeduct}
                  onChange={e => setAutoDeduct(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Kurangi Stok Otomatis
              </label>
            </div>
          )}

          {/* General Execution Notes */}
          <div>
            <label className="block text-gray-600 mb-1 text-[11px] font-semibold">
              Catatan Tambahan Pelaksanaan Harian:
            </label>
            <input
              type="text"
              value={taskNotes}
              onChange={e => setTaskNotes(e.target.value)}
              placeholder="Contoh: Selesai pkl 09.30 WIB oleh tim kebun blok A."
              className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          {/* Action Buttons: Selesai vs Batal Selesai */}
          <div className="pt-3 border-t border-[#e9ece6] flex items-center justify-between gap-2">
            <div>
              {isCompleted && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Batalkan Selesai (Reset ke Pending)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? 'Perbarui Data Selesai' : 'Simpan & Tandai Selesai'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
