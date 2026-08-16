import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  ShieldCheck,
  Compass,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Power,
  PowerOff,
  Smile,
  FileSpreadsheet,
  X,
  Calendar,
  Sprout,
  Scale,
  Clock,
  Layers,
  AlertCircle,
  Tag,
  Hash,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Field, CropType, CultivationCycle, Variety, CycleStatus, SOPStage } from '../../types';
import { StorageService } from '../../services/storage';
import { ExcelService } from '../../services/excelService';

// PRESET EMOJI ICONS FOR EASY SELECTION
const EMOJI_PRESETS = {
  Sayuran: ['🌶️', '🍅', '🥬', '🥒', '🍆', '🥦', '🥕', '🧅', '🧄', '🥔', '🌽', '🫑', '🫛'],
  Buah: ['🍉', '🍈', '🍓', '🍋', '🍊', '🍌', '🍍', '🥭', '🥑', '🍇', '🍎', '🫐', '🍑', '🍐'],
  'Herba & Pangan': ['🌿', '🌱', '🌾', '🍃', '🪴', '☕', '🫖', '🎋', '🍄', '🌻', '🌸', '🌴']
};

export const CycleFieldManager: React.FC = () => {
  const { fields, crops, cycles, activeCycleId, refreshData, openQuickAction, setActiveCycleId } = useApp();

  const [activeTab, setActiveTab] = useState<'cycles' | 'fields' | 'crops'>('cycles');

  // MODAL STATES FOR CYCLES
  const [viewCycle, setViewCycle] = useState<CultivationCycle | null>(null);
  const [editCycle, setEditCycle] = useState<CultivationCycle | null>(null);
  const [deleteCycleId, setDeleteCycleId] = useState<string | null>(null);

  // MODAL STATES FOR CROPS
  const [viewCrop, setViewCrop] = useState<CropType | null>(null);
  const [editCrop, setEditCrop] = useState<CropType | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [deleteCropId, setDeleteCropId] = useState<string | null>(null);

  // MODAL STATES FOR FIELDS
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [viewField, setViewField] = useState<Field | null>(null);
  const [editField, setEditField] = useState<Field | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  // FIELD FORM STATE
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState(1000);
  const [fieldSoil, setFieldSoil] = useState('Lempung Berpasir');
  const [fieldLocation, setFieldLocation] = useState('Blok Selatan');
  const [fieldWater, setFieldWater] = useState('Irigasi / Sumur Bor');

  // CROP ADD FORM STATE
  const [newCropName, setNewCropName] = useState('');
  const [newCropIcon, setNewCropIcon] = useState('🌿');
  const [newCropCategory, setNewCropCategory] = useState<'vegetable' | 'fruit' | 'herb' | 'other'>('vegetable');
  const [newCropVarieties, setNewCropVarieties] = useState([
    { name: '', averageMaturityDays: 60, estimatedYieldPerPlantKg: 1.0 }
  ]);

  // EDIT CROP FORM STATE
  const [editingCropName, setEditingCropName] = useState('');
  const [editingCropIcon, setEditingCropIcon] = useState('');
  const [editingCropCategory, setEditingCropCategory] = useState('vegetable');
  const [editingCropIsActive, setEditingCropIsActive] = useState(true);
  const [editingVarieties, setEditingVarieties] = useState<Variety[]>([]);

  // EDIT CYCLE FORM STATE
  const [editCycleVariety, setEditCycleVariety] = useState('');
  const [editCyclePlantCount, setEditCyclePlantCount] = useState(1000);
  const [editCycleLandPrepDate, setEditCycleLandPrepDate] = useState('');
  const [editCycleStartDate, setEditCycleStartDate] = useState('');
  const [editCycleHarvestDate, setEditCycleHarvestDate] = useState('');
  const [editCycleActiveStageId, setEditCycleActiveStageId] = useState('');
  const [editCycleStatus, setEditCycleStatus] = useState<CycleStatus>('active');
  const [editCycleNotes, setEditCycleNotes] = useState('');

  // STAGE DURATION ADJUSTMENT IN MODAL
  const [editingStageCycleId, setEditingStageCycleId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<SOPStage | null>(null);
  const [editingStageStart, setEditingStageStart] = useState<number>(0);
  const [editingStageEnd, setEditingStageEnd] = useState<number>(0);

  // ----------------------------------------------------
  // CYCLE HANDLERS
  // ----------------------------------------------------
  const handleOpenEditCycle = (cycle: CultivationCycle) => {
    setEditCycle(cycle);
    setEditCycleVariety(cycle.varietyName);
    setEditCyclePlantCount(cycle.plantCount);
    setEditCycleLandPrepDate(cycle.landPrepStartDate || '');
    setEditCycleStartDate(cycle.startDate);
    setEditCycleHarvestDate(cycle.estimatedHarvestDate || (cycle as any).expectedHarvestDate || '');
    setEditCycleActiveStageId(cycle.activeStageId || '');
    setEditCycleStatus(cycle.status);
    setEditCycleNotes(cycle.notes || '');
  };

  const handleSaveEditCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCycle) return;

    const updated: CultivationCycle = {
      ...editCycle,
      varietyName: editCycleVariety,
      plantCount: Number(editCyclePlantCount) || 1,
      landPrepStartDate: editCycleLandPrepDate || undefined,
      startDate: editCycleStartDate,
      estimatedHarvestDate: editCycleHarvestDate,
      activeStageId: editCycleActiveStageId || undefined,
      status: editCycleStatus,
      notes: editCycleNotes
    };

    StorageService.updateCycle(updated);
    refreshData();
    setEditCycle(null);
  };

  const handleQuickSwitchStage = (cycleId: string, stageId: string | null) => {
    StorageService.setActiveStageForCycle(cycleId, stageId);
    refreshData();
    if (viewCycle && viewCycle.id === cycleId) {
      const updatedCycle = StorageService.getCycles().find(c => c.id === cycleId);
      if (updatedCycle) setViewCycle(updatedCycle);
    }
  };

  const handleOpenEditStageDuration = (cycleId: string, stage: SOPStage) => {
    setEditingStageCycleId(cycleId);
    setEditingStage(stage);
    setEditingStageStart(stage.targetStartDay);
    setEditingStageEnd(stage.targetEndDay);
  };

  const handleSaveStageDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStageCycleId || !editingStage) return;

    StorageService.updateCycleStageTargetDays(
      editingStageCycleId,
      editingStage.id,
      Number(editingStageStart),
      Number(editingStageEnd)
    );
    refreshData();
    if (viewCycle && viewCycle.id === editingStageCycleId) {
      const updatedCycle = StorageService.getCycles().find(c => c.id === editingStageCycleId);
      if (updatedCycle) setViewCycle(updatedCycle);
    }
    setEditingStage(null);
    setEditingStageCycleId(null);
  };

  const handleToggleCycleStatus = (cycle: CultivationCycle) => {
    const nextStatus: CycleStatus = cycle.status === 'active' ? 'archived' : 'active';
    const updated: CultivationCycle = {
      ...cycle,
      status: nextStatus
    };
    StorageService.updateCycle(updated);

    // If activated, we can also make it current active context
    if (nextStatus === 'active') {
      setActiveCycleId(cycle.id);
    }
    refreshData();
  };

  const handleConfirmDeleteCycle = () => {
    if (!deleteCycleId) return;
    StorageService.deleteCycle(deleteCycleId);
    refreshData();
    setDeleteCycleId(null);
  };

  // ----------------------------------------------------
  // CROP HANDLERS
  // ----------------------------------------------------
  const handleOpenAddCrop = () => {
    setNewCropName('');
    setNewCropIcon('🌿');
    setNewCropCategory('vegetable');
    setNewCropVarieties([
      { name: '', averageMaturityDays: 60, estimatedYieldPerPlantKg: 1.0 }
    ]);
    setShowAddCropModal(true);
  };

  const handleAddVarietyRow = () => {
    setNewCropVarieties([
      ...newCropVarieties,
      { name: '', averageMaturityDays: 60, estimatedYieldPerPlantKg: 1.0 }
    ]);
  };

  const handleRemoveVarietyRow = (index: number) => {
    if (newCropVarieties.length <= 1) return;
    setNewCropVarieties(newCropVarieties.filter((_, i) => i !== index));
  };

  const handleSaveNewCrop = (e: React.FormEvent) => {
    e.preventDefault();
    const cropId = `crop-${Date.now()}`;
    const validVars = newCropVarieties
      .filter(v => v.name.trim().length > 0)
      .map((v, i) => ({
        id: `var-${Date.now()}-${i}`,
        cropTypeId: cropId,
        name: v.name.trim(),
        averageMaturityDays: Number(v.averageMaturityDays) || 60,
        estimatedYieldPerPlantKg: Number(v.estimatedYieldPerPlantKg) || 1.0
      }));

    if (validVars.length === 0) {
      validVars.push({
        id: `var-${Date.now()}-0`,
        cropTypeId: cropId,
        name: 'Varietas Utama',
        averageMaturityDays: 60,
        estimatedYieldPerPlantKg: 1.0
      });
    }

    const newCrop: CropType = {
      id: cropId,
      name: newCropName.trim(),
      icon: newCropIcon || '🌿',
      category: newCropCategory,
      isActive: true,
      varieties: validVars
    };

    StorageService.saveCrop(newCrop);
    refreshData();
    setShowAddCropModal(false);
  };

  const handleOpenEditCrop = (crop: CropType) => {
    setEditCrop(crop);
    setEditingCropName(crop.name);
    setEditingCropIcon(crop.icon);
    setEditingCropCategory(crop.category);
    setEditingCropIsActive(crop.isActive !== false);
    setEditingVarieties(crop.varieties ? JSON.parse(JSON.stringify(crop.varieties)) : []);
  };

  const handleAddEditVarietyRow = () => {
    if (!editCrop) return;
    setEditingVarieties([
      ...editingVarieties,
      {
        id: `var-${Date.now()}-${editingVarieties.length}`,
        cropTypeId: editCrop.id,
        name: '',
        averageMaturityDays: 60,
        estimatedYieldPerPlantKg: 1.0
      }
    ]);
  };

  const handleRemoveEditVarietyRow = (index: number) => {
    if (editingVarieties.length <= 1) return;
    setEditingVarieties(editingVarieties.filter((_, i) => i !== index));
  };

  const handleSaveEditCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCrop) return;

    const validVars = editingVarieties
      .filter(v => v.name.trim().length > 0)
      .map(v => ({
        ...v,
        name: v.name.trim(),
        averageMaturityDays: Number(v.averageMaturityDays) || 60,
        estimatedYieldPerPlantKg: Number(v.estimatedYieldPerPlantKg) || 1.0
      }));

    const updatedCrop: CropType = {
      ...editCrop,
      name: editingCropName.trim(),
      icon: editingCropIcon || '🌿',
      category: editingCropCategory,
      isActive: editingCropIsActive,
      varieties: validVars.length > 0 ? validVars : [
        {
          id: `var-${editCrop.id}-0`,
          cropTypeId: editCrop.id,
          name: 'Varietas Standar',
          averageMaturityDays: 60,
          estimatedYieldPerPlantKg: 1.0
        }
      ]
    };

    StorageService.saveCrop(updatedCrop);
    refreshData();
    setEditCrop(null);
  };

  const handleToggleCropStatus = (crop: CropType) => {
    const updatedCrop: CropType = {
      ...crop,
      isActive: crop.isActive === false ? true : false
    };
    StorageService.saveCrop(updatedCrop);
    refreshData();
  };

  const handleConfirmDeleteCrop = () => {
    if (!deleteCropId) return;
    StorageService.deleteCrop(deleteCropId);
    refreshData();
    setDeleteCropId(null);
  };

  // ----------------------------------------------------
  // FIELD HANDLERS
  // ----------------------------------------------------
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    const newField: Field = {
      id: `fld-${Date.now()}`,
      name: fieldName,
      location: fieldLocation,
      areaM2: Number(fieldArea),
      soilType: fieldSoil,
      waterSource: fieldWater,
      notes: fieldLocation,
      createdAt: new Date().toISOString().split('T')[0]
    };
    StorageService.saveField(newField);
    refreshData();
    setShowAddFieldModal(false);
    setFieldName('');
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & SUMMARY ACTIONS */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Master Data: Lahan, Komoditas & Siklus Budidaya
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelola siklus budidaya aktif, master jenis komoditas multi-varietas, dan plot lahan secara dinamis.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => ExcelService.exportToExcel()}
              className="px-3 py-2 rounded-xl bg-white border border-[#e1e5db] hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Unduh data ke file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => openQuickAction('create_cycle')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Mulai Siklus Baru
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('cycles')}
            className={`px-3.5 py-2 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cycles'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Siklus Budidaya ({cycles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('crops')}
            className={`px-3.5 py-2 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'crops'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Komoditas ({crops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3.5 py-2 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'fields'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Lahan & Plot ({fields.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SIKLUS BUDIDAYA (VIEW, EDIT, DELETE, TOGGLE AKTIF) */}
      {/* ======================================================== */}
      {activeTab === 'cycles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.map((cycle) => {
              const isSelectedActive = activeCycleId === cycle.id;
              const isStatusActive = cycle.status === 'active';

              return (
                <div
                  key={cycle.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all ${
                    isSelectedActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                      : 'border-[#e9ece6] hover:border-emerald-200'
                  }`}
                >
                  {/* Top Bar: Icon, Code, Status, and Active Selector */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#f9faf8] border border-[#e1e5db] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                        {cycle.cropIcon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-[#f3f5f0] text-emerald-900 px-2 py-0.5 rounded border border-[#e1e5db]">
                            {cycle.cycleCode}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              isStatusActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {cycle.status.toUpperCase()}
                          </span>
                          {isSelectedActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                              SEDANG DIPILIH
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm mt-1 truncate">
                          {cycle.cropTypeName} — {cycle.varietyName}
                        </h3>
                      </div>
                    </div>

                    {/* Quick Selection Button */}
                    <button
                      onClick={() => setActiveCycleId(cycle.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        isSelectedActive
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title="Pilih siklus ini sebagai fokus pantauan aplikasi"
                    >
                      {isSelectedActive ? '✓ Terpilih' : 'Pilih Fokus'}
                    </button>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-[#e9ece6] text-gray-600">
                    <div>
                      Lahan: <strong className="text-slate-800 block truncate">{cycle.fieldName}</strong>
                    </div>
                    <div>
                      Populasi:{' '}
                      <strong className="text-slate-800 block">
                        {cycle.plantCount.toLocaleString('id-ID')} Pohon
                      </strong>
                    </div>
                    <div>
                      Mulai Olah Lahan:{' '}
                      <strong className="text-slate-800 block">{cycle.landPrepStartDate || '-'}</strong>
                    </div>
                    <div>
                      Tgl Tanam (H-0): <strong className="text-slate-800 block">{cycle.startDate}</strong>
                    </div>
                  </div>

                  {/* Active Stage & SOP Snapshot Badge */}
                  <div className="p-2.5 bg-[#f9faf8] rounded-xl border border-[#e9ece6] text-[11px] text-gray-600 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">
                          SOP: <strong className="text-emerald-800 font-mono">{cycle.sopSnapshot?.versionNumber || 'V1.0'}</strong> ({cycle.sopSnapshot?.stages?.length || 0} Fase)
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium shrink-0">Snapshot</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[11px] pt-1 border-t border-[#e9ece6]/60">
                      <span className="text-gray-500">Tahapan Aktif:</span>
                      <span className="font-semibold text-emerald-800 truncate">
                        {cycle.activeStageId
                          ? cycle.sopSnapshot?.stages?.find(s => s.id === cycle.activeStageId)?.name || 'Tahap Aktif'
                          : 'Otomatis (Sesuai Kalender)'}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: VIEW, EDIT, DELETE, JADIKAN AKTIF / NON AKTIF */}
                  <div className="pt-2 border-t border-[#e9ece6] flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {/* View Action */}
                      <button
                        onClick={() => setViewCycle(cycle)}
                        className="p-2 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Lihat Detail Siklus & SOP"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-700" />
                        <span className="hidden sm:inline">Detail</span>
                      </button>

                      {/* Edit Action */}
                      <button
                        onClick={() => handleOpenEditCycle(cycle)}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit Data Siklus"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() => setDeleteCycleId(cycle.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Hapus Siklus"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>

                    {/* Toggle Aktif / Non Aktif */}
                    <button
                      onClick={() => handleToggleCycleStatus(cycle)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        isStatusActive
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                      }`}
                    >
                      {isStatusActive ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5 text-gray-500" />
                          <span>Arsipkan (Non-Aktif)</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Jadikan Aktif</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {cycles.length === 0 && (
            <div className="bg-white border border-[#e9ece6] rounded-2xl p-8 text-center space-y-3">
              <Sprout className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Siklus Budidaya</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Mulai siklus budidaya baru untuk mengaktifkan snapshot SOP otomatis, jadwal tugas harian, dan log panen.
              </p>
              <button
                onClick={() => openQuickAction('create_cycle')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Mulai Siklus Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MASTER KOMODITAS (ICON PICKER, VIEW, EDIT, DELETE, STATUS) */}
      {/* ======================================================== */}
      {activeTab === 'crops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-500">
              Daftar master komoditas dapat disesuaikan tanpa batas (Sayuran, Buah, Herbal, Pangan) dengan pemilihan ikon mudah.
            </p>
            <button
              onClick={handleOpenAddCrop}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> + Tambah Komoditas Baru
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((c) => {
              const isCropActive = c.isActive !== false;

              return (
                <div
                  key={c.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs flex flex-col justify-between transition-all ${
                    isCropActive ? 'border-[#e9ece6]' : 'border-gray-200 bg-gray-50/50 opacity-85'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Icon & Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#f9faf8] border border-[#e1e5db] flex items-center justify-center text-3xl shrink-0 shadow-2xs">
                          {c.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                isCropActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {isCropActive ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                            {c.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Varieties List */}
                    <div className="text-xs text-gray-600">
                      <span className="text-gray-500 block mb-1 text-[11px] font-medium">
                        Daftar Varietas ({c.varieties?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.varieties && c.varieties.length > 0 ? (
                          c.varieties.map((v) => (
                            <span
                              key={v.id}
                              className="px-2.5 py-0.5 rounded-lg bg-[#f3f5f0] border border-[#e1e5db] text-[11px] text-slate-700 font-medium"
                            >
                              {v.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">Belum ada varietas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: View, Edit, Delete, Toggle Active */}
                  <div className="pt-3 border-t border-[#e9ece6] flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      {/* View Button */}
                      <button
                        onClick={() => setViewCrop(c)}
                        className="p-1.5 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold cursor-pointer"
                        title="Lihat Detail Komoditas"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-700" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditCrop(c)}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold cursor-pointer"
                        title="Edit Komoditas & Varietas"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteCropId(c.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold cursor-pointer"
                        title="Hapus Komoditas"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>

                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleCropStatus(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border flex items-center gap-1 transition-colors ${
                        isCropActive
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      }`}
                    >
                      {isCropActive ? 'Non-Aktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: FIELDS / PLOT LIST */}
      {/* ======================================================== */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddFieldModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> + Tambah Lahan Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fields.map((f) => (
              <div key={f.id} className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" /> {f.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      (f as any).status === 'active_cultivation'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-[#f3f5f0] text-gray-600'
                    }`}
                  >
                    {(f as any).status === 'active_cultivation' ? 'SEDANG DITANAMI' : 'TERSEDIA'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    Luas: <strong className="text-slate-800">{f.areaM2.toLocaleString('id-ID')} m²</strong>
                  </div>
                  <div>
                    Jenis Tanah: <strong className="text-slate-800">{f.soilType}</strong>
                  </div>
                  <div>
                    Sumber Air: <strong className="text-slate-800">{f.waterSource}</strong>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 pt-2 border-t border-[#e9ece6]">
                  {f.location || f.notes || 'Blok Terdata'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: VIEW CYCLE DETAIL */}
      {/* ======================================================== */}
      {viewCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col text-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#e9ece6] bg-[#f9faf8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#e1e5db] flex items-center justify-center text-2xl shadow-2xs">
                  {viewCycle.cropIcon}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">
                    Detail Siklus: {viewCycle.cycleCode}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {viewCycle.cropTypeName} — {viewCycle.varietyName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewCycle(null)}
                className="p-1.5 text-gray-400 hover:text-slate-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#f9faf8] p-3.5 rounded-xl border border-[#e9ece6]">
                <div>
                  <span className="text-gray-500 block text-[11px]">Status Siklus</span>
                  <span className="font-bold text-emerald-800 uppercase font-mono">{viewCycle.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Populasi Tanaman</span>
                  <span className="font-bold text-slate-800">{viewCycle.plantCount.toLocaleString('id-ID')} Pohon</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Lahan / Blok</span>
                  <span className="font-bold text-slate-800">{viewCycle.fieldName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Mulai Olah Lahan</span>
                  <span className="font-bold text-slate-800">{viewCycle.landPrepStartDate || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Tanggal Tanam (H-0)</span>
                  <span className="font-bold text-slate-800">{viewCycle.startDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Target Panen</span>
                  <span className="font-bold text-slate-800">
                    {viewCycle.estimatedHarvestDate || (viewCycle as any).expectedHarvestDate || '-'}
                  </span>
                </div>
              </div>

              {/* SOP Snapshot Stages & Tasks with Interactive Switch */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Snapshot SOP: {viewCycle.sopSnapshot?.templateName || viewCycle.cropTypeName} ({viewCycle.sopSnapshot?.versionNumber || 'V1.0'})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleQuickSwitchStage(viewCycle.id, null)}
                    className="text-[10px] text-gray-500 hover:text-emerald-700 font-semibold cursor-pointer underline"
                    title="Kembalikan tahapan aktif ke mode otomatis kalender"
                  >
                    Reset ke Otomatis
                  </button>
                </div>

                <div className="space-y-2">
                  {viewCycle.sopSnapshot?.stages?.map((stage, sidx) => {
                    const isStageActive = viewCycle.activeStageId === stage.id;
                    const startLabel = stage.targetStartDay >= 0 ? `H+${stage.targetStartDay}` : `H${stage.targetStartDay}`;
                    const endLabel = stage.targetEndDay >= 0 ? `H+${stage.targetEndDay}` : `H${stage.targetEndDay}`;

                    return (
                      <div
                        key={stage.id || sidx}
                        className={`p-3 rounded-xl space-y-2 border transition-all ${
                          isStageActive
                            ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                            : 'bg-white border-[#e9ece6]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-emerald-950 font-semibold">
                              Fase {sidx + 1}: {stage.name}
                            </strong>
                            {isStageActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold tracking-wider">
                                AKTIF
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-600 bg-white/80 px-2 py-0.5 rounded border border-[#e1e5db]">
                              {startLabel} s/d {endLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditStageDuration(viewCycle.id, stage)}
                              className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                              title="Sesuaikan jumlah hari tahap ini untuk lahan ini"
                            >
                              Ubah Hari
                            </button>
                            {!isStageActive ? (
                              <button
                                type="button"
                                onClick={() => handleQuickSwitchStage(viewCycle.id, stage.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                              >
                                Pindah ke Tahap Ini
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold">✓ Sedang Berjalan</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {stage.tasks?.map((t, tidx) => (
                            <div
                              key={t.id || tidx}
                              className="flex items-center justify-between text-[11px] text-gray-600 pl-2 border-l-2 border-emerald-300"
                            >
                              <span>• {t.name} (H{t.targetDayOffset >= 0 ? `+${t.targetDayOffset}` : t.targetDayOffset})</span>
                              <span className="text-[10px] text-gray-400 font-mono">{t.taskType}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {viewCycle.notes && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-amber-900">
                  <span className="font-bold block text-[11px] mb-0.5">Catatan Tambahan:</span>
                  <p className="text-xs">{viewCycle.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e9ece6] bg-[#f9faf8] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewCycle(null)}
                className="px-4 py-2 bg-white border border-[#e1e5db] hover:bg-[#f3f5f0] text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1B: EDIT STAGE DURATION DI SIKLUS */}
      {/* ======================================================== */}
      {editingStage && editingStageCycleId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-sm p-4 sm:p-5 text-slate-800 text-xs shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#e9ece6]">
              <h3 className="font-bold text-sm text-slate-800">
                Sesuaikan Durasi: {editingStage.name}
              </h3>
              <button
                onClick={() => setEditingStage(null)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-500 text-[11px]">
              Sesuaikan target rentang hari untuk tahapan ini khusus pada siklus lahan ini (misal pengolahan lahan 30 hari vs 21 hari).
            </p>

            <form onSubmit={handleSaveStageDuration} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Target Mulai (Offset Hari)</label>
                  <input
                    type="number"
                    value={editingStageStart}
                    onChange={e => setEditingStageStart(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono text-center font-bold"
                    placeholder="Contoh: -30 atau 1"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {editingStageStart < 0 ? `${Math.abs(editingStageStart)} hari pra-tanam` : `H+${editingStageStart}`}
                  </span>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Target Akhir (Offset Hari)</label>
                  <input
                    type="number"
                    value={editingStageEnd}
                    onChange={e => setEditingStageEnd(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono text-center font-bold"
                    placeholder="Contoh: -1 atau 20"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {editingStageEnd < 0 ? `${Math.abs(editingStageEnd)} hari pra-tanam` : `H+${editingStageEnd}`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-3 py-1.5 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Simpan Durasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT CYCLE */}
      {/* ======================================================== */}
      {editCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-lg p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Edit Siklus: {editCycle.cycleCode}</h3>
              </div>
              <button
                onClick={() => setEditCycle(null)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCycle} className="space-y-3.5">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Varietas</label>
                <input
                  type="text"
                  value={editCycleVariety}
                  onChange={e => setEditCycleVariety(e.target.value)}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Populasi Tanaman (Pohon)</label>
                  <input
                    type="number"
                    value={editCyclePlantCount}
                    onChange={e => setEditCyclePlantCount(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Status Siklus</label>
                  <select
                    value={editCycleStatus}
                    onChange={e => setEditCycleStatus(e.target.value as CycleStatus)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="active">ACTIVE (Aktif Berjalan)</option>
                    <option value="completed">COMPLETED (Selesai Panen)</option>
                    <option value="archived">ARCHIVED (Diarsipkan)</option>
                    <option value="draft">DRAFT (Rancangan)</option>
                  </select>
                </div>
              </div>

              {/* TIMELINE DATES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f9faf8] p-3 rounded-xl border border-[#e1e5db]">
                <div>
                  <label className="block text-gray-700 mb-1 font-semibold text-[11px]">
                    Tanggal Mulai Pengolahan Lahan
                  </label>
                  <input
                    type="date"
                    value={editCycleLandPrepDate}
                    onChange={e => setEditCycleLandPrepDate(e.target.value)}
                    className="w-full bg-white border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 font-semibold text-[11px]">
                    Tanggal Mulai Tanam (H-0)
                  </label>
                  <input
                    type="date"
                    value={editCycleStartDate}
                    onChange={e => setEditCycleStartDate(e.target.value)}
                    className="w-full bg-white border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-700 mb-1 font-semibold text-[11px]">
                    Estimasi Tanggal Panen Perdana
                  </label>
                  <input
                    type="date"
                    value={editCycleHarvestDate}
                    onChange={e => setEditCycleHarvestDate(e.target.value)}
                    className="w-full bg-white border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* ACTIVE STAGE SELECTION */}
              <div>
                <label className="block text-gray-700 mb-1 font-semibold">
                  Tahapan Siklus SOP yang Aktif Saat Ini
                </label>
                <select
                  value={editCycleActiveStageId}
                  onChange={e => setEditCycleActiveStageId(e.target.value)}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                >
                  <option value="">Otomatis Sesuai Kalender Umur Tanaman</option>
                  {editCycle.sopSnapshot?.stages?.map((stage, idx) => (
                    <option key={stage.id} value={stage.id}>
                      Fase {idx + 1}: {stage.name} (H{stage.targetStartDay >= 0 ? `+${stage.targetStartDay}` : stage.targetStartDay} s/d H+{stage.targetEndDay})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Anda bisa mengubah tahapan aktif sewaktu-waktu jika kondisi riil lapangan berbeda.
                </span>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Catatan Siklus</label>
                <textarea
                  value={editCycleNotes}
                  onChange={e => setEditCycleNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  placeholder="Kondisi cuaca awal tanam, perlakuan khusus..."
                />
              </div>

              <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCycle(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE CYCLE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteCycleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-rose-900">Konfirmasi Hapus Siklus</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus siklus budidaya ini? Seluruh tugas SOP yang dihasilkan untuk siklus ini juga akan dihapus.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCycleId(null)}
                className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCycle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs"
              >
                Ya, Hapus Siklus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: VIEW CROP DETAIL */}
      {/* ======================================================== */}
      {viewCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-lg p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f9faf8] border border-[#e1e5db] flex items-center justify-center text-3xl">
                  {viewCrop.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">{viewCrop.name}</h3>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">{viewCrop.category}</span>
                </div>
              </div>
              <button
                onClick={() => setViewCrop(null)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6]">
                <span className="text-gray-500">Status Komoditas:</span>
                <span className={`font-bold px-2 py-0.5 rounded font-mono ${
                  viewCrop.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {viewCrop.isActive !== false ? 'AKTIF' : 'NON-AKTIF'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Daftar Varietas Terdaftar:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewCrop.varieties?.map((v, idx) => (
                    <div key={v.id || idx} className="p-3 bg-[#f9faf8] border border-[#e1e5db] rounded-xl flex items-center justify-between">
                      <div>
                        <strong className="text-slate-800 block text-xs">{v.name}</strong>
                        <span className="text-[10px] text-gray-500">
                          Est. Umur Panen: {v.averageMaturityDays} hari | Potensi: {v.estimatedYieldPerPlantKg} kg/pohon
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {v.seedProducer || 'Sertifikasi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e9ece6] flex justify-end">
              <button
                onClick={() => setViewCrop(null)}
                className="px-4 py-2 bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: ADD NEW CROP (WITH EASY EMOJI PICKER) */}
      {/* ======================================================== */}
      {showAddCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-slate-800 text-xs shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#e9ece6] bg-[#f9faf8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800">Tambah Master Komoditas Baru</h3>
              </div>
              <button
                onClick={() => setShowAddCropModal(false)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCrop} className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* EMOJI PICKER PRESETS */}
              <div>
                <label className="block text-gray-700 mb-1.5 font-bold flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-700" />
                  Pilih Ikon Komoditas (Klik salah satu untuk mengganti):
                </label>

                {/* Display Current Icon */}
                <div className="flex items-center gap-3 mb-2 p-2.5 bg-[#f9faf8] rounded-xl border border-[#e1e5db]">
                  <div className="w-12 h-12 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-3xl shadow-xs">
                    {newCropIcon}
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block">Ikon Terpilih saat ini</span>
                    <input
                      type="text"
                      value={newCropIcon}
                      onChange={e => setNewCropIcon(e.target.value)}
                      placeholder="Ketik emoji sendiri..."
                      className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-slate-800 text-xs mt-0.5"
                    />
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2 bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6]">
                  {Object.entries(EMOJI_PRESETS).map(([catName, emojis]) => (
                    <div key={catName}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        {catName}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {emojis.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => setNewCropIcon(emoji)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                              newCropIcon === emoji
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 scale-110 shadow-xs'
                                : 'bg-white hover:bg-emerald-50 border border-[#e1e5db] hover:scale-105'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CROP NAME & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-gray-600 mb-1 font-medium">Nama Komoditas</label>
                  <input
                    type="text"
                    value={newCropName}
                    onChange={e => setNewCropName(e.target.value)}
                    placeholder="Contoh: Semangka, Melon, Selada..."
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Kategori</label>
                  <select
                    value={newCropCategory}
                    onChange={e => setNewCropCategory(e.target.value as any)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="vegetable">Sayuran</option>
                    <option value="fruit">Buah-buahan</option>
                    <option value="herb">Herbal / Rempah</option>
                    <option value="other">Pangan / Lainnya</option>
                  </select>
                </div>
              </div>

              {/* VARIETIES SECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-700 font-bold">Daftar Varietas</label>
                  <button
                    type="button"
                    onClick={handleAddVarietyRow}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Baris Varietas
                  </button>
                </div>

                <div className="space-y-2">
                  {newCropVarieties.map((v, index) => (
                    <div
                      key={index}
                      className="p-2.5 bg-[#f9faf8] border border-[#e1e5db] rounded-xl grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={v.name}
                          onChange={e => {
                            const updated = [...newCropVarieties];
                            updated[index].name = e.target.value;
                            setNewCropVarieties(updated);
                          }}
                          placeholder="Nama Varietas (mis: Madu)"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={v.averageMaturityDays}
                          onChange={e => {
                            const updated = [...newCropVarieties];
                            updated[index].averageMaturityDays = Number(e.target.value);
                            setNewCropVarieties(updated);
                          }}
                          placeholder="Hari Panen"
                          title="Estimasi Umur Panen (Hari)"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.1"
                          value={v.estimatedYieldPerPlantKg}
                          onChange={e => {
                            const updated = [...newCropVarieties];
                            updated[index].estimatedYieldPerPlantKg = Number(e.target.value);
                            setNewCropVarieties(updated);
                          }}
                          placeholder="kg/phn"
                          title="Estimasi Hasil per Pohon (kg)"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-mono"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVarietyRow(index)}
                          disabled={newCropVarieties.length <= 1}
                          className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCropModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white cursor-pointer shadow-xs"
                >
                  Simpan Komoditas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: EDIT CROP (WITH EASY EMOJI PICKER & VARIETIES) */}
      {/* ======================================================== */}
      {editCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-slate-800 text-xs shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#e9ece6] bg-[#f9faf8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Edit Komoditas: {editCrop.name}</h3>
              </div>
              <button
                onClick={() => setEditCrop(null)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCrop} className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* EMOJI PICKER PRESETS */}
              <div>
                <label className="block text-gray-700 mb-1.5 font-bold flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-700" />
                  Ganti Ikon Komoditas:
                </label>

                {/* Display Current Icon */}
                <div className="flex items-center gap-3 mb-2 p-2.5 bg-[#f9faf8] rounded-xl border border-[#e1e5db]">
                  <div className="w-12 h-12 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-3xl shadow-xs">
                    {editingCropIcon}
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block">Ikon Saat Ini</span>
                    <input
                      type="text"
                      value={editingCropIcon}
                      onChange={e => setEditingCropIcon(e.target.value)}
                      className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-slate-800 text-xs mt-0.5"
                    />
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2 bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6]">
                  {Object.entries(EMOJI_PRESETS).map(([catName, emojis]) => (
                    <div key={catName}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        {catName}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {emojis.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => setEditingCropIcon(emoji)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                              editingCropIcon === emoji
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 scale-110 shadow-xs'
                                : 'bg-white hover:bg-emerald-50 border border-[#e1e5db] hover:scale-105'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NAME, CATEGORY & STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-gray-600 mb-1 font-medium">Nama Komoditas</label>
                  <input
                    type="text"
                    value={editingCropName}
                    onChange={e => setEditingCropName(e.target.value)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Kategori</label>
                  <select
                    value={editingCropCategory}
                    onChange={e => setEditingCropCategory(e.target.value)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="vegetable">Sayuran</option>
                    <option value="fruit">Buah-buahan</option>
                    <option value="herb">Herbal / Rempah</option>
                    <option value="other">Pangan / Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#f9faf8] p-3 rounded-xl border border-[#e1e5db]">
                <input
                  type="checkbox"
                  id="cropActiveCheck"
                  checked={editingCropIsActive}
                  onChange={e => setEditingCropIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="cropActiveCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Komoditas Aktif Digunakan di Perkebunan
                </label>
              </div>

              {/* VARIETIES SECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-700 font-bold">Kelola Daftar Varietas</label>
                  <button
                    type="button"
                    onClick={handleAddEditVarietyRow}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Varietas
                  </button>
                </div>

                <div className="space-y-2">
                  {editingVarieties.map((v, index) => (
                    <div
                      key={v.id || index}
                      className="p-2.5 bg-[#f9faf8] border border-[#e1e5db] rounded-xl grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={v.name}
                          onChange={e => {
                            const updated = [...editingVarieties];
                            updated[index].name = e.target.value;
                            setEditingVarieties(updated);
                          }}
                          placeholder="Nama Varietas"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={v.averageMaturityDays}
                          onChange={e => {
                            const updated = [...editingVarieties];
                            updated[index].averageMaturityDays = Number(e.target.value);
                            setEditingVarieties(updated);
                          }}
                          placeholder="Hari Panen"
                          title="Estimasi Umur Panen (Hari)"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.1"
                          value={v.estimatedYieldPerPlantKg}
                          onChange={e => {
                            const updated = [...editingVarieties];
                            updated[index].estimatedYieldPerPlantKg = Number(e.target.value);
                            setEditingVarieties(updated);
                          }}
                          placeholder="kg/phn"
                          title="Estimasi Hasil per Pohon (kg)"
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center font-mono"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEditVarietyRow(index)}
                          disabled={editingVarieties.length <= 1}
                          className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCrop(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: DELETE CROP CONFIRMATION */}
      {/* ======================================================== */}
      {deleteCropId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-rose-900">Konfirmasi Hapus Komoditas</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus komoditas ini dari master data perkebunan?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCropId(null)}
                className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCrop}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs"
              >
                Ya, Hapus Komoditas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 8: ADD FIELD */}
      {/* ======================================================== */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-md p-5 text-slate-800 text-xs shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#e9ece6]">
              <h3 className="text-sm font-bold text-slate-800">Tambah Lahan / Plot Baru</h3>
              <button
                onClick={() => setShowAddFieldModal(false)}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nama Lahan / Blok</label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  placeholder="Contoh: Lahan Blok Barat 02"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Luas (m²)</label>
                  <input
                    type="number"
                    value={fieldArea}
                    onChange={e => setFieldArea(Number(e.target.value))}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Jenis Tanah</label>
                  <input
                    type="text"
                    value={fieldSoil}
                    onChange={e => setFieldSoil(e.target.value)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Sumber Air & Irigasi</label>
                <input
                  type="text"
                  value={fieldWater}
                  onChange={e => setFieldWater(e.target.value)}
                  placeholder="Sumur bor, bendungan, tandon..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Lokasi / Keterangan</label>
                <input
                  type="text"
                  value={fieldLocation}
                  onChange={e => setFieldLocation(e.target.value)}
                  placeholder="Dekat tandon utama, elevasi 400 mdpl..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white cursor-pointer shadow-xs"
                >
                  Simpan Lahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
