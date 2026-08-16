import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Layers,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SOPTemplate,
  SOPVersion,
  SOPStage,
  SOPTask,
  SOPTaskField,
  TaskType,
  FieldInputType
} from '../../types';
import { StorageService } from '../../services/storage';
import { ExcelService } from '../../services/excelService';

export const SopManager: React.FC = () => {
  const { sops, crops, inventory, refreshData } = useApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(sops[0]?.id || '');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  // Modals
  const [editingStage, setEditingStage] = useState<SOPStage | null>(null);
  const [editingTask, setEditingTask] = useState<{ stageId: string; task: SOPTask } | null>(null);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedExcelData, setImportedExcelData] = useState<{
    templateName: string;
    versionNumber: string;
    stageCount: number;
    taskCount: number;
    message: string;
    importedVersion?: SOPVersion;
    importedTemplate?: SOPTemplate;
  } | null>(null);

  // New Template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCropId, setNewTemplateCropId] = useState(crops[0]?.id || '');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // New Version form state
  const [newVersionNumber, setNewVersionNumber] = useState('V2.2');
  const [newVersionChangelog, setNewVersionChangelog] = useState('');

  const currentTemplate = useMemo(() => {
    return sops.find(s => s.id === selectedTemplateId) || sops[0] || null;
  }, [sops, selectedTemplateId]);

  const currentVersion = useMemo(() => {
    if (!currentTemplate) return null;
    if (selectedVersionId) {
      return currentTemplate.versions.find(v => v.id === selectedVersionId) || currentTemplate.versions[0] || null;
    }
    return currentTemplate.versions.find(v => v.id === currentTemplate.activeVersionId) || currentTemplate.versions[0] || null;
  }, [currentTemplate, selectedVersionId]);

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  // CREATE NEW TEMPLATE
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const crop = crops.find(c => c.id === newTemplateCropId) || crops[0];
    const templateId = `sop-${Date.now()}`;
    const initialVersionId = `ver-${Date.now()}-v1.0`;

    const newTemplate: SOPTemplate = {
      id: templateId,
      name: newTemplateName,
      cropTypeId: crop.id,
      cropTypeName: crop.name,
      description: newTemplateDesc,
      activeVersionId: initialVersionId,
      createdAt: new Date().toISOString(),
      versions: [
        {
          id: initialVersionId,
          templateId,
          versionNumber: 'V1.0',
          status: 'published',
          changelog: 'Versi rilis inisial standar operasional.',
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          stages: [
            {
              id: `stg-${Date.now()}-1`,
              sopVersionId: initialVersionId,
              name: '1. Persiapan & Pengolahan Tanah',
              order: 1,
              targetStartDay: -14,
              targetEndDay: 0,
              tasks: [
                {
                  id: `tsk-${Date.now()}-1`,
                  stageId: `stg-${Date.now()}-1`,
                  name: 'Penggemburan & Pupuk Dasar',
                  taskType: 'fertilization',
                  targetDayOffset: -7,
                  targetTime: '08:00',
                  description: 'Gemburkan tanah bedengan dan tabur pupuk kandang matang.',
                  priority: 'high',
                  order: 1,
                  fields: [],
                  validationRules: []
                }
              ]
            }
          ]
        }
      ]
    };

    StorageService.saveSOPTemplate(newTemplate);
    refreshData();
    setSelectedTemplateId(templateId);
    setSelectedVersionId(initialVersionId);
    setShowCreateTemplateModal(false);
  };

  // CREATE NEW VERSION (SNAPSHOT SAFE CLONING)
  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate || !currentVersion) return;

    const newVerId = `ver-${Date.now()}-${newVersionNumber.toLowerCase().replace('.', '_')}`;
    // Deep clone stages from existing version
    const clonedStages = JSON.parse(JSON.stringify(currentVersion.stages));

    const newVersion: SOPVersion = {
      id: newVerId,
      templateId: currentTemplate.id,
      versionNumber: newVersionNumber,
      status: 'draft',
      changelog: newVersionChangelog || 'Pembaruan parameter standar SOP.',
      createdAt: new Date().toISOString(),
      stages: clonedStages
    };

    currentTemplate.versions.push(newVersion);
    StorageService.saveSOPTemplate(currentTemplate);
    refreshData();
    setSelectedVersionId(newVerId);
    setShowCreateVersionModal(false);
  };

  // PUBLISH VERSION
  const handlePublishVersion = () => {
    if (!currentTemplate || !currentVersion) return;
    currentVersion.status = 'published';
    currentVersion.publishedAt = new Date().toISOString();
    currentTemplate.activeVersionId = currentVersion.id;
    StorageService.saveSOPTemplate(currentTemplate);
    refreshData();
  };

  // EXPORT SOP TO EXCEL (.XLSX)
  const handleExportExcel = () => {
    if (!currentTemplate || !currentVersion) return;
    try {
      ExcelService.exportSOPToExcel(currentTemplate, currentVersion);
    } catch (e: any) {
      alert(`Gagal mengekspor SOP ke Excel: ${e.message}`);
    }
  };

  // ANALYZE IMPORTED EXCEL FILE
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportingExcel(true);
    setImportError(null);
    setImportedExcelData(null);

    try {
      const result = await ExcelService.importSOPFromExcel(file);
      if (result.success && result.importedVersion) {
        setImportedExcelData({
          templateName: result.templateName || currentTemplate?.name || 'SOP Terimpor',
          versionNumber: result.versionNumber || 'V1.0-Excel',
          stageCount: result.stageCount || 0,
          taskCount: result.taskCount || 0,
          message: result.message,
          importedVersion: result.importedVersion,
          importedTemplate: result.importedTemplate
        });
      } else {
        setImportError(result.message || 'Format file Excel tidak sesuai standar SOP.');
      }
    } catch (err: any) {
      setImportError(`Gagal membaca berkas Excel: ${err.message || 'File korup'}`);
    } finally {
      setIsImportingExcel(false);
      e.target.value = '';
    }
  };

  // APPLY IMPORTED EXCEL VERSION
  const handleApplyImport = () => {
    if (!currentTemplate || !importedExcelData?.importedVersion) return;
    try {
      const newVerId = `ver-${Date.now()}-excel`;
      const importedVer: SOPVersion = {
        ...importedExcelData.importedVersion,
        id: newVerId,
        templateId: currentTemplate.id,
        versionNumber: `${importedExcelData.versionNumber.replace(/-Imported|-Excel/g, '')}-Imp`,
        status: 'draft',
        changelog: `Diimpor dari file Excel pada ${new Date().toLocaleDateString('id-ID')}`,
        createdAt: new Date().toISOString(),
        stages: importedExcelData.importedVersion.stages.map(stage => ({
          ...stage,
          sopVersionId: newVerId
        }))
      };

      currentTemplate.versions.push(importedVer);
      StorageService.saveSOPTemplate(currentTemplate);
      refreshData();
      setSelectedVersionId(newVerId);
      setShowImportModal(false);
      setImportedExcelData(null);
      setImportError(null);
    } catch (e: any) {
      alert(`Gagal menerapkan SOP dari Excel: ${e.message}`);
    }
  };

  // ADD STAGE
  const handleAddStage = () => {
    if (!currentTemplate || !currentVersion) return;
    const newStage: SOPStage = {
      id: `stg-${Date.now()}`,
      sopVersionId: currentVersion.id,
      name: `${currentVersion.stages.length + 1}. Fase Baru`,
      order: currentVersion.stages.length + 1,
      targetStartDay: 0,
      targetEndDay: 14,
      tasks: []
    };
    currentVersion.stages.push(newStage);
    StorageService.saveSOPTemplate(currentTemplate);
    refreshData();
  };

  // SAVE EDITED STAGE
  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate || !currentVersion || !editingStage) return;
    const idx = currentVersion.stages.findIndex(s => s.id === editingStage.id);
    if (idx >= 0) {
      currentVersion.stages[idx] = editingStage;
      StorageService.saveSOPTemplate(currentTemplate);
      refreshData();
    }
    setEditingStage(null);
  };

  // DELETE STAGE
  const handleDeleteStage = (stageId: string) => {
    if (!currentTemplate || !currentVersion) return;
    currentVersion.stages = currentVersion.stages.filter(s => s.id !== stageId);
    StorageService.saveSOPTemplate(currentTemplate);
    refreshData();
  };

  // ADD TASK TO STAGE
  const handleAddTask = (stageId: string) => {
    if (!currentTemplate || !currentVersion) return;
    const stage = currentVersion.stages.find(s => s.id === stageId);
    if (!stage) return;

    const newTask: SOPTask = {
      id: `tsk-${Date.now()}`,
      stageId,
      name: 'Tugas Baru SOP',
      taskType: 'monitoring',
      targetDayOffset: stage.targetStartDay,
      targetTime: '08:00',
      description: 'Lakukan instruksi operasional sesuai standar budidaya.',
      priority: 'medium',
      order: stage.tasks.length + 1,
      fields: [
        {
          id: `fld-${Date.now()}-1`,
          name: 'param_value',
          label: 'Parameter Nilai',
          type: 'number',
          required: true,
          sopStandardMin: 10,
          sopStandardMax: 50
        }
      ],
      validationRules: []
    };

    stage.tasks.push(newTask);
    StorageService.saveSOPTemplate(currentTemplate);
    refreshData();
  };

  // SAVE EDITED TASK
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplate || !currentVersion || !editingTask) return;
    const stage = currentVersion.stages.find(s => s.id === editingTask.stageId);
    if (stage) {
      const idx = stage.tasks.findIndex(t => t.id === editingTask.task.id);
      if (idx >= 0) {
        stage.tasks[idx] = editingTask.task;
        StorageService.saveSOPTemplate(currentTemplate);
        refreshData();
      }
    }
    setEditingTask(null);
  };

  // DELETE TASK
  const handleDeleteTask = (stageId: string, taskId: string) => {
    if (!currentTemplate || !currentVersion) return;
    const stage = currentVersion.stages.find(s => s.id === stageId);
    if (stage) {
      stage.tasks = stage.tasks.filter(t => t.id !== taskId);
      StorageService.saveSOPTemplate(currentTemplate);
      refreshData();
    }
  };

  // ADD FIELD TO EDITING TASK
  const handleAddFieldToTask = () => {
    if (!editingTask) return;
    const newField: SOPTaskField = {
      id: `fld-${Date.now()}`,
      name: `custom_field_${editingTask.task.fields.length + 1}`,
      label: 'Nama Parameter Baru',
      type: 'number',
      required: true
    };
    setEditingTask({
      ...editingTask,
      task: {
        ...editingTask.task,
        fields: [...editingTask.task.fields, newField]
      }
    });
  };

  return (
    <div className="space-y-5">
      
      {/* 1. SOP SELECTOR & VERSION CONTROL HEADER */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                SOP Builder & Versioning Engine
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pemilik mendefinisikan SOP lengkap dengan tahapan, jadwal offset (H+), formulir dinamis & validasi standar.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setImportedExcelData(null);
                setImportError(null);
                setShowImportModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-[#e1e5db] cursor-pointer shadow-xs transition-colors"
              title="Impor master SOP dari berkas spreadsheet Excel (.xlsx)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" /> Impor dari Excel
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-[#e1e5db] cursor-pointer shadow-xs transition-colors"
              title="Ekspor SOP format spreadsheet Excel (.xlsx) dengan tabel tahapan & tugas"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Ekspor ke Excel (.xlsx)
            </button>

            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> SOP Tanaman Baru
            </button>
          </div>
        </div>

        {/* SOP TEMPLATE & VERSION SWITCHER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Template Selector */}
          <div>
            <label className="block text-gray-600 text-xs mb-1 font-medium">Pilih Master SOP</label>
            <select
              value={selectedTemplateId}
              onChange={e => {
                setSelectedTemplateId(e.target.value);
                const t = sops.find(s => s.id === e.target.value);
                if (t) setSelectedVersionId(t.activeVersionId);
              }}
              className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
            >
              {sops.map(s => (
                <option key={s.id} value={s.id}>{s.cropTypeName} — {s.name}</option>
              ))}
            </select>
          </div>

          {/* Version Selector */}
          <div>
            <label className="block text-gray-600 text-xs mb-1 font-medium flex items-center justify-between">
              <span>Versi SOP ({currentTemplate?.versions.length} Versi)</span>
              {currentVersion?.status === 'published' ? (
                <span className="text-[10px] text-emerald-800 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> PUBLISHED
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-mono font-bold">DRAFT</span>
              )}
            </label>
            <select
              value={selectedVersionId || currentTemplate?.activeVersionId}
              onChange={e => setSelectedVersionId(e.target.value)}
              className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-emerald-600 focus:bg-white"
            >
              {currentTemplate?.versions.map(v => (
                <option key={v.id} value={v.id}>
                  {v.versionNumber} — {v.status.toUpperCase()} ({v.publishedAt || v.createdAt.split('T')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Version Action Toolbar */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowCreateVersionModal(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#e1e5db] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-700" />
              + Buat Versi Baru (Draft)
            </button>

            {currentVersion?.status === 'draft' && (
              <button
                onClick={handlePublishVersion}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Publish Versi Ini
              </button>
            )}
          </div>

        </div>

        {/* Changelog / Notes */}
        {currentVersion && (
          <div className="p-3 bg-[#f9faf8] rounded-xl border border-[#e9ece6] text-xs text-gray-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Catatan Versi {currentVersion.versionNumber}: </span>
              <span className="text-gray-500">{currentVersion.changelog || 'Tidak ada catatan perubahan.'}</span>
            </div>
          </div>
        )}

      </div>

      {/* 2. VISUAL SOP STAGES & TASKS TREE BUILDER */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-800">
              Struktur Tahapan & Tugas ({currentVersion?.stages.length || 0} Fase Budidaya)
            </h3>
          </div>

          <button
            onClick={handleAddStage}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f3f5f0] text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-[#e1e5db] shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" /> + Tambah Tahapan / Fase
          </button>
        </div>

        {/* STAGES LIST */}
        {currentVersion?.stages.map((stage) => {
          const isExpanded = expandedStages[stage.id] !== false; // default expanded

          return (
            <div
              key={stage.id}
              className="bg-white border border-[#e9ece6] rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              {/* STAGE HEADER BAR */}
              <div className="px-4 py-3 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between gap-3">
                <div 
                  onClick={() => toggleStage(stage.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${!isExpanded ? '-rotate-90' : ''}`} />
                  <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {stage.name}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-emerald-800 border border-[#e1e5db]">
                    H{stage.targetStartDay >= 0 ? `+${stage.targetStartDay}` : stage.targetStartDay} s/d H+{stage.targetEndDay}
                  </span>
                  <span className="text-[11px] text-gray-500 hidden sm:inline">
                    ({stage.tasks.length} Tugas SOP)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAddTask(stage.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 border border-emerald-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> + Tugas
                  </button>

                  <button
                    onClick={() => setEditingStage(stage)}
                    className="p-1.5 text-gray-500 hover:text-slate-800 rounded-lg hover:bg-[#e9ece6] cursor-pointer"
                    title="Edit Fase"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteStage(stage.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Hapus Fase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TASKS INSIDE STAGE */}
              {isExpanded && (
                <div className="p-3 sm:p-4 space-y-2.5 divide-y divide-[#e9ece6]">
                  {stage.tasks.length > 0 ? (
                    stage.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f3f5f0] text-emerald-800 border border-[#e1e5db]">
                              H{task.targetDayOffset >= 0 ? `+${task.targetDayOffset}` : task.targetDayOffset}
                            </span>
                            <span className="font-semibold text-xs text-slate-800">
                              {task.name}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#f3f5f0] text-gray-600 border border-[#e1e5db]">
                              {task.taskType}
                            </span>
                            {task.priority === 'critical' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                KRITIS
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-1 leading-snug">
                            {task.description}
                          </p>

                          {/* Dynamic Fields summary */}
                          {task.fields.length > 0 && (
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1.5 flex-wrap">
                              <span className="text-gray-600 font-medium">Input Field:</span>
                              {task.fields.map(f => (
                                <span key={f.id} className="bg-[#f9faf8] px-1.5 py-0.5 rounded border border-[#e1e5db] text-slate-700 font-mono text-[10px]">
                                  {f.label} {f.unit ? `(${f.unit})` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => setEditingTask({ stageId: stage.id, task })}
                            className="px-2.5 py-1 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-medium flex items-center gap-1 border border-[#e1e5db] cursor-pointer"
                          >
                            <Edit className="w-3 h-3" /> Konfigurasi Form & Standar
                          </button>
                          <button
                            onClick={() => handleDeleteTask(stage.id, task.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-gray-400">
                      Belum ada tugas pada tahapan ini. Klik "+ Tugas" untuk menambahkan.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* MODAL: EDIT TASK FORM & DYNAMIC FIELDS */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-auto text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150">
            
            <div className="px-5 py-4 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                Konfigurasi Tugas & Parameter SOP
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 text-gray-400 hover:text-slate-700 rounded-lg hover:bg-[#f3f5f0] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Nama Tugas SOP</label>
                  <input
                    type="text"
                    value={editingTask.task.name}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, name: e.target.value }
                    })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Tipe Tugas</label>
                  <select
                    value={editingTask.task.taskType}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, taskType: e.target.value as TaskType }
                    })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="monitoring">Monitoring</option>
                    <option value="fertilization">Pemupukan</option>
                    <option value="irrigation">Irigasi</option>
                    <option value="pest_treatment">Pengendalian Hama</option>
                    <option value="disease_treatment">Pengendalian Penyakit</option>
                    <option value="planting">Penanaman</option>
                    <option value="maintenance">Pemeliharaan</option>
                    <option value="harvest">Panen</option>
                    <option value="checklist">Checklist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Target Hari Offset (H+N)</label>
                  <input
                    type="number"
                    value={editingTask.task.targetDayOffset}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, targetDayOffset: Number(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Target Waktu (WIB)</label>
                  <input
                    type="time"
                    value={editingTask.task.targetTime || '08:00'}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, targetTime: e.target.value }
                    })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Prioritas</label>
                  <select
                    value={editingTask.task.priority}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, priority: e.target.value as any }
                    })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="critical">Kritis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Instruksi & Prosedur Pelaksanaan</label>
                <textarea
                  value={editingTask.task.description}
                  onChange={e => setEditingTask({
                    ...editingTask,
                    task: { ...editingTask.task, description: e.target.value }
                  })}
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 leading-relaxed focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              {/* LINKED INVENTORY */}
              <div className="p-3 bg-[#f9faf8] rounded-xl border border-[#e9ece6]">
                <label className="block text-indigo-700 font-semibold mb-1">Hubungkan ke Item Inventaris (Auto-Potong Stok):</label>
                <select
                  value={editingTask.task.linkedInventoryItemId || ''}
                  onChange={e => setEditingTask({
                    ...editingTask,
                    task: { ...editingTask.task, linkedInventoryItemId: e.target.value || undefined }
                  })}
                  className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                >
                  <option value="">-- Tidak Terhubung ke Inventaris --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.category} - {item.unit})</option>
                  ))}
                </select>
              </div>

              {/* DYNAMIC FIELD CONFIGURATOR */}
              <div className="space-y-3 pt-2 border-t border-[#e9ece6]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    Formulir Input & Standar Validasi Lapangan ({editingTask.task.fields.length} Field)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFieldToTask}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 cursor-pointer"
                  >
                    + Tambah Field
                  </button>
                </div>

                {editingTask.task.fields.map((field, fIndex) => (
                  <div key={field.id} className="p-3 bg-[#f9faf8] rounded-xl border border-[#e1e5db] space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-600 text-[10px] mb-0.5 font-medium">Label Input</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => {
                            const updated = [...editingTask.task.fields];
                            updated[fIndex].label = e.target.value;
                            setEditingTask({
                              ...editingTask,
                              task: { ...editingTask.task, fields: updated }
                            });
                          }}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-600 text-[10px] mb-0.5 font-medium">Tipe Input</label>
                        <select
                          value={field.type}
                          onChange={e => {
                            const updated = [...editingTask.task.fields];
                            updated[fIndex].type = e.target.value as FieldInputType;
                            setEditingTask({
                              ...editingTask,
                              task: { ...editingTask.task, fields: updated }
                            });
                          }}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1 text-slate-800 focus:outline-emerald-600"
                        >
                          <option value="number">Angka (Number)</option>
                          <option value="text">Teks Singkat</option>
                          <option value="select">Pilihan (Dropdown)</option>
                          <option value="textarea">Teks Panjang</option>
                          <option value="photo">Upload Foto</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-600 text-[10px] mb-0.5 font-medium">Satuan / Unit</label>
                        <input
                          type="text"
                          value={field.unit || ''}
                          onChange={e => {
                            const updated = [...editingTask.task.fields];
                            updated[fIndex].unit = e.target.value;
                            setEditingTask({
                              ...editingTask,
                              task: { ...editingTask.task, fields: updated }
                            });
                          }}
                          placeholder="kg, liter, pH, cm"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                    </div>

                    {/* SOP Standard Min/Max thresholds */}
                    {field.type === 'number' && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e9ece6]">
                        <div>
                          <label className="block text-emerald-800 text-[10px] mb-0.5 font-semibold">Standar Min SOP</label>
                          <input
                            type="number"
                            value={field.sopStandardMin !== undefined ? field.sopStandardMin : ''}
                            onChange={e => {
                              const updated = [...editingTask.task.fields];
                              updated[fIndex].sopStandardMin = e.target.value !== '' ? Number(e.target.value) : undefined;
                              setEditingTask({
                                ...editingTask,
                                task: { ...editingTask.task, fields: updated }
                              });
                            }}
                            className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1 text-slate-800 font-mono focus:outline-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-emerald-800 text-[10px] mb-0.5 font-semibold">Standar Max SOP</label>
                          <input
                            type="number"
                            value={field.sopStandardMax !== undefined ? field.sopStandardMax : ''}
                            onChange={e => {
                              const updated = [...editingTask.task.fields];
                              updated[fIndex].sopStandardMax = e.target.value !== '' ? Number(e.target.value) : undefined;
                              setEditingTask({
                                ...editingTask,
                                task: { ...editingTask.task, fields: updated }
                              });
                            }}
                            className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1 text-slate-800 font-mono focus:outline-emerald-600"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingTask.task.fields.filter((_, i) => i !== fIndex);
                          setEditingTask({
                            ...editingTask,
                            task: { ...editingTask.task, fields: updated }
                          });
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Hapus Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e9ece6]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan Tugas
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDIT STAGE */}
      {editingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Edit Fase / Tahapan SOP</h3>
            <form onSubmit={handleSaveStage} className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Fase</label>
                <input
                  type="text"
                  value={editingStage.name}
                  onChange={e => setEditingStage({ ...editingStage, name: e.target.value })}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Mulai (H+N)</label>
                  <input
                    type="number"
                    value={editingStage.targetStartDay}
                    onChange={e => setEditingStage({ ...editingStage, targetStartDay: Number(e.target.value) || 0 })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Selesai (H+N)</label>
                  <input
                    type="number"
                    value={editingStage.targetEndDay}
                    onChange={e => setEditingStage({ ...editingStage, targetEndDay: Number(e.target.value) || 0 })}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW TEMPLATE */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Buat Master SOP Tanaman Baru</h3>
            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Jenis Tanaman</label>
                <select
                  value={newTemplateCropId}
                  onChange={e => setNewTemplateCropId(e.target.value)}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                >
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama SOP</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Contoh: SOP Budidaya Melon Hidroponik V1.0"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Deskripsi Standar</label>
                <textarea
                  value={newTemplateDesc}
                  onChange={e => setNewTemplateDesc(e.target.value)}
                  placeholder="Prosedur standar budidaya dari semai sampai panen..."
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Buat Master SOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW VERSION */}
      {showCreateVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Buat Versi SOP Baru (Draft)</h3>
            <p className="text-[11px] text-gray-500 mb-3">
              Versi baru akan menyalin seluruh struktur dari {currentVersion?.versionNumber} tanpa mengubah riwayat siklus budidaya yang sedang berjalan.
            </p>
            <form onSubmit={handleCreateVersion} className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nomor Versi Baru</label>
                <input
                  type="text"
                  value={newVersionNumber}
                  onChange={e => setNewVersionNumber(e.target.value)}
                  placeholder="Contoh: V2.2 atau V3.0"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Perubahan (Changelog)</label>
                <textarea
                  value={newVersionChangelog}
                  onChange={e => setNewVersionChangelog(e.target.value)}
                  placeholder="Contoh: Penyesuaian dosis pupuk generatif & penambahan monitoring hama H+14..."
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateVersionModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-white cursor-pointer shadow-xs"
                >
                  Kloning & Buat Versi Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT SOP WORKFLOW WITH EXCEL (.XLSX) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl p-5 text-slate-800 text-xs shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e9ece6] pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-700" />
                Impor SOP dari Lembar Kerja Excel (.xlsx)
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              Unggah file Excel hasil ekspor atau template SOP (format sheet: <code>Ringkasan_SOP</code>, <code>Fase_Tahapan</code>, <code>Daftar_Tugas_SOP</code>). SOP yang diimpor akan ditambahkan secara aman sebagai versi <strong>DRAFT</strong> baru pada master SOP terpilih.
            </p>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{importError}</div>
              </div>
            )}

            {/* FILE UPLOAD BOX */}
            <div className="border-2 border-dashed border-[#d5dacd] hover:border-emerald-500 rounded-2xl p-5 text-center bg-[#fbfcf9] transition-colors">
              <input
                type="file"
                id="excel-sop-upload"
                accept=".xlsx, .xls"
                onChange={handleExcelFileChange}
                className="hidden"
                disabled={isImportingExcel}
              />
              <label
                htmlFor="excel-sop-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-emerald-800 hover:underline text-xs">
                    {isImportingExcel ? 'Sedang membaca file Excel...' : 'Klik untuk memilih file Excel (.xlsx)'}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">Mendukung format Microsoft Excel (.xlsx / .xls)</p>
                </div>
              </label>
            </div>

            {/* PREVIEW OF IMPORTED DATA */}
            {importedExcelData && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Struktur SOP Valid & Terverifikasi
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-gray-500 block">Nama SOP:</span>
                    <strong className="text-slate-800">{importedExcelData.templateName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Versi Dokumen:</span>
                    <strong className="text-emerald-800 font-mono">{importedExcelData.versionNumber}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Jumlah Fase / Tahapan:</span>
                    <strong className="text-slate-800">{importedExcelData.stageCount} Fase</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Total Kegiatan / Tugas:</span>
                    <strong className="text-slate-800">{importedExcelData.taskCount} Tugas Operasional</strong>
                  </div>
                </div>
                <p className="text-[10.5px] text-emerald-800 italic">
                  {importedExcelData.message}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-[#e9ece6]">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportedExcelData(null);
                  setImportError(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] cursor-pointer font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                disabled={!importedExcelData || isImportingExcel}
                className={`px-5 py-2 rounded-xl font-semibold text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 ${
                  importedExcelData && !isImportingExcel
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terapkan Sebagai Versi Draft
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
