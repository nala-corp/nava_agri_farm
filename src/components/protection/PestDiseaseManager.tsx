import React, { useState, useMemo, useRef } from 'react';
import {
  Bug,
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  FileSpreadsheet,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Check,
  X,
  Droplets,
  FlaskConical,
  Sprout,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import {
  PestType,
  DiseaseType,
  PestObservation,
  DiseaseObservation,
  SOPTreatmentStep
} from '../../types';

export const PestDiseaseManager: React.FC = () => {
  const { activeCycle, cycles, openQuickAction, refreshData } = useApp();

  const [filterCycleId, setFilterCycleId] = useState<string>(activeCycle?.id || 'all');
  const [activeTab, setActiveTab] = useState<'observations' | 'catalog' | 'cycle_monitor'>('observations');
  const [catalogSubTab, setCatalogSubTab] = useState<'all' | 'pest' | 'disease'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');

  // Excel file upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local state for modals
  const [viewItem, setViewItem] = useState<{ type: 'pest' | 'disease'; data: PestType | DiseaseType } | null>(null);
  const [editPest, setEditPest] = useState<PestType | null>(null);
  const [editDisease, setEditDisease] = useState<DiseaseType | null>(null);
  const [showAddPestModal, setShowAddPestModal] = useState(false);
  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ type: 'pest' | 'disease' | 'pest_obs' | 'disease_obs'; id: string; name: string } | null>(null);

  // Form states for adding/editing Pest
  const [pestName, setPestName] = useState('');
  const [pestScientificName, setPestScientificName] = useState('');
  const [pestTargetCrops, setPestTargetCrops] = useState('Cabai, Tomat, Terung');
  const [pestSymptoms, setPestSymptoms] = useState('');
  const [pestRecommendedTreatment, setPestRecommendedTreatment] = useState('');
  const [pestSteps, setPestSteps] = useState<SOPTreatmentStep[]>([]);

  // Form states for adding/editing Disease
  const [diseaseName, setDiseaseName] = useState('');
  const [diseasePathogenType, setDiseasePathogenType] = useState<'fungus' | 'bacteria' | 'virus' | 'nematode' | 'nutrient_deficiency'>('fungus');
  const [diseaseTargetCrops, setDiseaseTargetCrops] = useState('Cabai, Tomat');
  const [diseaseSymptoms, setDiseaseSymptoms] = useState('');
  const [diseaseRecommendedTreatment, setDiseaseRecommendedTreatment] = useState('');
  const [diseaseSteps, setDiseaseSteps] = useState<SOPTreatmentStep[]>([]);

  // Fetch observations & Catalog
  const pestObs = useMemo(() => {
    return StorageService.getPestObservations(filterCycleId === 'all' ? undefined : filterCycleId);
  }, [filterCycleId, activeCycle]);

  const diseaseObs = useMemo(() => {
    return StorageService.getDiseaseObservations(filterCycleId === 'all' ? undefined : filterCycleId);
  }, [filterCycleId, activeCycle]);

  const pestCatalog = useMemo(() => StorageService.getPests(), [editPest, showAddPestModal, deleteModal]);
  const diseaseCatalog = useMemo(() => StorageService.getDiseases(), [editDisease, showAddDiseaseModal, deleteModal]);

  // Unique target crops from catalog
  const availableCropFilters = useMemo(() => {
    const cropsSet = new Set<string>();
    pestCatalog.forEach(p => p.targetCrops.forEach(c => cropsSet.add(c.trim())));
    diseaseCatalog.forEach(d => d.targetCrops.forEach(c => cropsSet.add(c.trim())));
    return Array.from(cropsSet).filter(Boolean);
  }, [pestCatalog, diseaseCatalog]);

  // Filtered Catalog
  const filteredPests = useMemo(() => {
    return pestCatalog.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.scientificName && p.scientificName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recommendedTreatment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCrop = selectedCropFilter === 'all' || p.targetCrops.some(c => c.toLowerCase().includes(selectedCropFilter.toLowerCase()));
      return matchSearch && matchCrop;
    });
  }, [pestCatalog, searchQuery, selectedCropFilter]);

  const filteredDiseases = useMemo(() => {
    return diseaseCatalog.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.pathogenType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.recommendedTreatment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCrop = selectedCropFilter === 'all' || d.targetCrops.some(c => c.toLowerCase().includes(selectedCropFilter.toLowerCase()));
      return matchSearch && matchCrop;
    });
  }, [diseaseCatalog, searchQuery, selectedCropFilter]);

  // Summary Metrics
  const totalIncidents = pestObs.length + diseaseObs.length;
  const unresolvedCount = pestObs.filter(p => !p.resolved).length + diseaseObs.filter(d => !d.resolved).length;
  const severeCount = pestObs.filter(p => p.severity === 'parah').length + diseaseObs.filter(d => d.severity === 'parah').length;

  // Cycle Exposure Statistics for "Monitor Siklus Terdampak"
  const cycleExposureStats = useMemo(() => {
    return cycles.map(cycle => {
      const cPestObs = StorageService.getPestObservations(cycle.id);
      const cDisObs = StorageService.getDiseaseObservations(cycle.id);
      const totalObs = cPestObs.length + cDisObs.length;
      const unresolved = cPestObs.filter(p => !p.resolved).length + cDisObs.filter(d => !d.resolved).length;
      const severe = cPestObs.filter(p => p.severity === 'parah').length + cDisObs.filter(d => d.severity === 'parah').length;
      
      const pestNames = Array.from(new Set(cPestObs.map(p => p.pestName)));
      const diseaseNames = Array.from(new Set(cDisObs.map(d => d.diseaseName)));

      return {
        cycle,
        totalObs,
        unresolved,
        severe,
        pestCount: cPestObs.length,
        diseaseCount: cDisObs.length,
        pestNames,
        diseaseNames
      };
    });
  }, [cycles, pestObs, diseaseObs]);

  // ----------------------------------------------------
  // HANDLERS FOR PEST CRUD
  // ----------------------------------------------------
  const handleOpenAddPest = () => {
    setPestName('');
    setPestScientificName('');
    setPestTargetCrops('Cabai, Tomat');
    setPestSymptoms('');
    setPestRecommendedTreatment('');
    setPestSteps([
      {
        stepNumber: 1,
        stageName: 'Pencegahan / Serangan Awal',
        actionType: 'spray',
        treatmentName: 'Aplikasi Insektisida Kontak',
        recommendedProduct: 'Abamektin 18 EC',
        activeIngredient: 'Abamectin',
        dosage: '0.5 - 1.0 ml / liter',
        applicationInterval: '4-5 hari sekali',
        timingNotes: 'Semprot pada bagian bawah daun saat pagi/sore hari'
      }
    ]);
    setShowAddPestModal(true);
  };

  const handleOpenEditPest = (pest: PestType) => {
    setEditPest(pest);
    setPestName(pest.name);
    setPestScientificName(pest.scientificName || '');
    setPestTargetCrops(pest.targetCrops.join(', '));
    setPestSymptoms(pest.symptoms);
    setPestRecommendedTreatment(pest.recommendedTreatment);
    setPestSteps(pest.treatmentSteps ? JSON.parse(JSON.stringify(pest.treatmentSteps)) : [
      {
        stepNumber: 1,
        stageName: 'Tindakan Pengendalian',
        actionType: 'spray',
        treatmentName: 'Aplikasi Spray Insektisida',
        recommendedProduct: pest.recommendedTreatment.split(' ')[0] || 'Insektisida',
        dosage: '1 ml / liter',
        applicationInterval: '4 hari sekali'
      }
    ]);
  };

  const handleSavePest = (e: React.FormEvent) => {
    e.preventDefault();
    const cropsArray = pestTargetCrops.split(',').map(c => c.trim()).filter(Boolean);
    const updated: PestType = {
      id: editPest ? editPest.id : `pest-${Date.now()}`,
      name: pestName.trim(),
      scientificName: pestScientificName.trim() || undefined,
      targetCrops: cropsArray.length > 0 ? cropsArray : ['Umum'],
      symptoms: pestSymptoms.trim(),
      recommendedTreatment: pestRecommendedTreatment.trim(),
      treatmentSteps: pestSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    };

    StorageService.savePest(updated);
    setEditPest(null);
    setShowAddPestModal(false);
    refreshData();
  };

  // ----------------------------------------------------
  // HANDLERS FOR DISEASE CRUD
  // ----------------------------------------------------
  const handleOpenAddDisease = () => {
    setDiseaseName('');
    setDiseasePathogenType('fungus');
    setDiseaseTargetCrops('Cabai, Tomat');
    setDiseaseSymptoms('');
    setDiseaseRecommendedTreatment('');
    setDiseaseSteps([
      {
        stepNumber: 1,
        stageName: 'Pencegahan & Pengendalian',
        actionType: 'kocor',
        treatmentName: 'Kocor Fungisida Sistemik',
        recommendedProduct: 'Mancozeb 80% / Metalaksil',
        activeIngredient: 'Mancozeb + Metalaxyl',
        dosage: '2 - 3 gr / liter air (200 ml/tanaman)',
        applicationInterval: '7 hari sekali',
        timingNotes: 'Kocorkan di area perakaran saat tanah cukup lembab'
      }
    ]);
    setShowAddDiseaseModal(true);
  };

  const handleOpenEditDisease = (disease: DiseaseType) => {
    setEditDisease(disease);
    setDiseaseName(disease.name);
    setDiseasePathogenType(disease.pathogenType);
    setDiseaseTargetCrops(disease.targetCrops.join(', '));
    setDiseaseSymptoms(disease.symptoms);
    setDiseaseRecommendedTreatment(disease.recommendedTreatment);
    setDiseaseSteps(disease.treatmentSteps ? JSON.parse(JSON.stringify(disease.treatmentSteps)) : [
      {
        stepNumber: 1,
        stageName: 'Tindakan Pengendalian',
        actionType: 'kocor',
        treatmentName: 'Aplikasi Fungisida / Bakterisida',
        recommendedProduct: disease.recommendedTreatment.split(' ')[0] || 'Fungisida',
        dosage: '2 gr / liter',
        applicationInterval: '5 hari sekali'
      }
    ]);
  };

  const handleSaveDisease = (e: React.FormEvent) => {
    e.preventDefault();
    const cropsArray = diseaseTargetCrops.split(',').map(c => c.trim()).filter(Boolean);
    const updated: DiseaseType = {
      id: editDisease ? editDisease.id : `dis-${Date.now()}`,
      name: diseaseName.trim(),
      pathogenType: diseasePathogenType,
      targetCrops: cropsArray.length > 0 ? cropsArray : ['Umum'],
      symptoms: diseaseSymptoms.trim(),
      recommendedTreatment: diseaseRecommendedTreatment.trim(),
      treatmentSteps: diseaseSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    };

    StorageService.saveDisease(updated);
    setEditDisease(null);
    setShowAddDiseaseModal(false);
    refreshData();
  };

  // ----------------------------------------------------
  // STEP MANAGEMENT HELPERS
  // ----------------------------------------------------
  const handleAddPestStep = () => {
    setPestSteps([
      ...pestSteps,
      {
        stepNumber: pestSteps.length + 1,
        stageName: 'Tahap Lanjutan',
        actionType: 'spray',
        treatmentName: '',
        recommendedProduct: '',
        activeIngredient: '',
        dosage: '1 ml/liter',
        applicationInterval: '4 hari sekali',
        timingNotes: ''
      }
    ]);
  };

  const handleRemovePestStep = (index: number) => {
    setPestSteps(pestSteps.filter((_, i) => i !== index));
  };

  const handleAddDiseaseStep = () => {
    setDiseaseSteps([
      ...diseaseSteps,
      {
        stepNumber: diseaseSteps.length + 1,
        stageName: 'Tahap Lanjutan',
        actionType: 'kocor',
        treatmentName: '',
        recommendedProduct: '',
        activeIngredient: '',
        dosage: '2 gr/liter',
        applicationInterval: '5 hari sekali',
        timingNotes: ''
      }
    ]);
  };

  const handleRemoveDiseaseStep = (index: number) => {
    setDiseaseSteps(diseaseSteps.filter((_, i) => i !== index));
  };

  // ----------------------------------------------------
  // OBSERVATION ACTIONS (TOGGLE RESOLVED & DELETE)
  // ----------------------------------------------------
  const handleTogglePestObsResolved = (obs: PestObservation) => {
    StorageService.updatePestObservation({
      ...obs,
      resolved: !obs.resolved
    });
    refreshData();
  };

  const handleToggleDiseaseObsResolved = (obs: DiseaseObservation) => {
    StorageService.updateDiseaseObservation({
      ...obs,
      resolved: !obs.resolved
    });
    refreshData();
  };

  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'pest') StorageService.deletePest(deleteModal.id);
    else if (deleteModal.type === 'disease') StorageService.deleteDisease(deleteModal.id);
    else if (deleteModal.type === 'pest_obs') StorageService.deletePestObservation(deleteModal.id);
    else if (deleteModal.type === 'disease_obs') StorageService.deleteDiseaseObservation(deleteModal.id);

    setDeleteModal(null);
    refreshData();
  };

  // ----------------------------------------------------
  // EXCEL IMPORT & EXPORT HANDLERS
  // ----------------------------------------------------
  const handleExportExcel = () => {
    ExcelService.exportOPTToExcel();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await ExcelService.importFromExcel(file);
    if (res.success) {
      setImportStatusMessage({ type: 'success', text: res.message });
      refreshData();
    } else {
      setImportStatusMessage({ type: 'error', text: res.message });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      setImportStatusMessage(null);
    }, 6000);
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER & ACTION TOOLBAR */}
      <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
          <div>
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Pengendalian Hama & Penyakit Tanaman (OPT) & SOP
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pencatatan temuan OPT lapangan, SOP penanganan bertahap (Spray/Kocor), monitor siklus terpapar, dan ekspor/impor Excel.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden File Input for Excel Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {/* Excel Export Button */}
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-white border border-[#e1e5db] hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Unduh Katalog OPT, SOP Spray/Kocor, dan Catatan Temuan ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor Excel</span>
            </button>

            {/* Excel Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-white border border-[#e1e5db] hover:bg-emerald-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Impor / Pulihkan data Katalog OPT dari file Excel (.xlsx)"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Impor Excel</span>
            </button>

            {/* Quick Log Findings */}
            <button
              onClick={() => openQuickAction('add_pest_obs')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 border border-amber-200 cursor-pointer shadow-xs"
            >
              <Bug className="w-3.5 h-3.5" /> + Catat Hama
            </button>
            <button
              onClick={() => openQuickAction('add_disease_obs')}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 cursor-pointer shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> + Catat Penyakit
            </button>
          </div>
        </div>

        {/* IMPORT STATUS TOAST NOTIFICATION */}
        {importStatusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
              importStatusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{importStatusMessage.text}</span>
            </div>
            <button
              onClick={() => setImportStatusMessage(null)}
              className="text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter Cycle & Tab Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 font-medium">Filter Siklus:</span>
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

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('observations')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'observations'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
              }`}
            >
              Riwayat Temuan ({totalIncidents})
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
              }`}
            >
              Katalog OPT & SOP ({pestCatalog.length + diseaseCatalog.length})
            </button>
            <button
              onClick={() => setActiveTab('cycle_monitor')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'cycle_monitor'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
              }`}
            >
              Monitor Siklus Terpapar ({cycles.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-gray-500 font-medium mb-1">Total Insiden OPT</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">{totalIncidents}</div>
          <div className="text-[11px] text-gray-400 mt-2">
            {pestObs.length} Hama • {diseaseObs.length} Penyakit
          </div>
        </div>

        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-gray-500 font-medium mb-1">Belum Terselesaikan</div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${unresolvedCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {unresolvedCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Perlu tindakan pengendalian</div>
        </div>

        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-gray-500 font-medium mb-1">Serangan Tingkat Parah</div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${severeCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {severeCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Dampak &gt; 15% populasi</div>
        </div>

        <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-gray-500 font-medium mb-1">Master Database OPT</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono">
            {pestCatalog.length + diseaseCatalog.length}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Lengkap dengan SOP Spray & Kocor</div>
        </div>
      </div>

      {/* 3. TAB 1: RIWAYAT TEMUAN OBSERVASI */}
      {activeTab === 'observations' && (
        <div className="bg-white border border-[#e9ece6] rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="px-5 py-3.5 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-sm text-slate-800">
              Daftar Catatan Temuan Hama & Penyakit di Lapangan
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Menampilkan {pestObs.length + diseaseObs.length} catatan temuan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="text-[11px] text-gray-500 uppercase bg-[#f9faf8] border-b border-[#e9ece6]">
                <tr>
                  <th className="px-4 py-3">Tanggal & Hari</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Nama Hama / Penyakit</th>
                  <th className="px-4 py-3">Siklus & Lahan</th>
                  <th className="px-4 py-3">Keparahan</th>
                  <th className="px-4 py-3">Terdampak</th>
                  <th className="px-4 py-3">Tindakan SOP Dilakukan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9ece6]">
                {pestObs.map(p => {
                  const cycle = cycles.find(c => c.id === p.cycleId);
                  return (
                    <tr key={p.id} className="hover:bg-[#f9faf8]">
                      <td className="px-4 py-3 font-sans">
                        <span className="font-semibold text-slate-800">H+{p.dayOffset}</span>
                        <div className="text-[10px] text-gray-500">{p.date}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                          HAMA
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {p.pestName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="font-medium text-slate-800 block truncate max-w-[140px]">
                          {cycle ? cycle.fieldName : p.cycleId}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {cycle?.cropTypeName} ({cycle?.varietyName})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            p.severity === 'parah'
                              ? 'bg-rose-100 text-rose-800'
                              : p.severity === 'sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{p.affectedPlantsCount} pohon</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={p.actionTaken || p.notes || '-'}>
                        {p.actionTaken || p.notes || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePestObsResolved(p)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border flex items-center gap-1 transition-colors ${
                            p.resolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk mengubah status penyelesaian"
                        >
                          {p.resolved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" /> Tuntas
                            </>
                          ) : (
                            'Aktif'
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteModal({ type: 'pest_obs', id: p.id, name: `Temuan ${p.pestName} (${p.date})` })}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Hapus Temuan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {diseaseObs.map(d => {
                  const cycle = cycles.find(c => c.id === d.cycleId);
                  return (
                    <tr key={d.id} className="hover:bg-[#f9faf8]">
                      <td className="px-4 py-3 font-sans">
                        <span className="font-semibold text-slate-800">H+{d.dayOffset}</span>
                        <div className="text-[10px] text-gray-500">{d.date}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold">
                          PENYAKIT
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {d.diseaseName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="font-medium text-slate-800 block truncate max-w-[140px]">
                          {cycle ? cycle.fieldName : d.cycleId}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {cycle?.cropTypeName} ({cycle?.varietyName})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            d.severity === 'parah'
                              ? 'bg-rose-100 text-rose-800'
                              : d.severity === 'sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {d.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{d.affectedPlantsCount} pohon</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={d.actionTaken || d.notes || '-'}>
                        {d.actionTaken || d.notes || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleDiseaseObsResolved(d)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border flex items-center gap-1 transition-colors ${
                            d.resolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk mengubah status penyelesaian"
                        >
                          {d.resolved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" /> Tuntas
                            </>
                          ) : (
                            'Aktif'
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteModal({ type: 'disease_obs', id: d.id, name: `Temuan ${d.diseaseName} (${d.date})` })}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Hapus Temuan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {pestObs.length === 0 && diseaseObs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                      <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      Belum ada catatan temuan hama atau penyakit pada siklus yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: KATALOG OPT & SOP TAHAPAN PENANGANAN */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Catalog Filter Controls & Add Buttons */}
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari hama, penyakit, gejala, atau obat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#f9faf8] border border-[#e1e5db] rounded-xl text-xs text-slate-800 placeholder-gray-400 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* Add Master OPT Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleOpenAddPest}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Hama Baru
                </button>
                <button
                  onClick={handleOpenAddDisease}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Penyakit Baru
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e9ece6] text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">Tipe:</span>
                <button
                  onClick={() => setCatalogSubTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    catalogSubTab === 'all' ? 'bg-emerald-700 text-white font-bold' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
                  }`}
                >
                  Semua ({pestCatalog.length + diseaseCatalog.length})
                </button>
                <button
                  onClick={() => setCatalogSubTab('pest')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    catalogSubTab === 'pest' ? 'bg-amber-600 text-white font-bold' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
                  }`}
                >
                  Hama Saja ({pestCatalog.length})
                </button>
                <button
                  onClick={() => setCatalogSubTab('disease')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    catalogSubTab === 'disease' ? 'bg-rose-600 text-white font-bold' : 'bg-[#f3f5f0] text-slate-600 hover:bg-[#e9ece6]'
                  }`}
                >
                  Penyakit Saja ({diseaseCatalog.length})
                </button>
              </div>

              {availableCropFilters.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Komoditas:</span>
                  <select
                    value={selectedCropFilter}
                    onChange={e => setSelectedCropFilter(e.target.value)}
                    className="bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium"
                  >
                    <option value="all">Semua Tanaman</option>
                    {availableCropFilters.map(crop => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PESTS LIST */}
            {(catalogSubTab === 'all' || catalogSubTab === 'pest') &&
              filteredPests.map(pest => (
                <div
                  key={pest.id}
                  className="bg-white border border-[#e9ece6] hover:border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                          <Bug className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-sm">{pest.name}</h4>
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-bold uppercase font-mono">
                              HAMA
                            </span>
                          </div>
                          {pest.scientificName && (
                            <span className="italic text-gray-400 text-xs block">{pest.scientificName}</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons: View SOP, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewItem({ type: 'pest', data: pest })}
                          className="p-1.5 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 cursor-pointer"
                          title="Lihat SOP Penanganan Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditPest(pest)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                          title="Edit Hama & SOP"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ type: 'pest', id: pest.id, name: pest.name })}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer"
                          title="Hapus Hama dari Katalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Target Crops Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-gray-400 font-medium">Sasaran:</span>
                      {pest.targetCrops.map((tc, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#f3f5f0] border border-[#e1e5db] text-slate-700 font-medium">
                          {tc}
                        </span>
                      ))}
                    </div>

                    {/* Symptoms */}
                    <div className="p-2.5 bg-[#f9faf8] rounded-xl border border-[#e9ece6] text-xs text-gray-600">
                      <strong className="text-slate-800 block text-[11px] mb-0.5">Gejala Serangan:</strong>
                      <p className="line-clamp-2">{pest.symptoms}</p>
                    </div>

                    {/* SOP Treatment Steps Highlights */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-emerald-900 font-semibold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          Tahapan SOP Penanganan ({pest.treatmentSteps?.length || 0} Langkah):
                        </strong>
                      </div>

                      {pest.treatmentSteps && pest.treatmentSteps.length > 0 ? (
                        <div className="space-y-1.5">
                          {pest.treatmentSteps.slice(0, 2).map((st, sidx) => (
                            <div
                              key={sidx}
                              className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-[11px] text-emerald-950 flex items-start gap-2"
                            >
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                {st.stepNumber}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold truncate">{st.treatmentName}</span>
                                  <span className="px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-900 text-[9px] font-bold uppercase">
                                    {st.actionType}
                                  </span>
                                </div>
                                <div className="text-gray-600 text-[10px] mt-0.5 truncate">
                                  Obat: {st.recommendedProduct || '-'} • Dosis: {st.dosage || '-'} • Interval: {st.applicationInterval || '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                          {pest.treatmentSteps.length > 2 && (
                            <button
                              onClick={() => setViewItem({ type: 'pest', data: pest })}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer block text-center w-full"
                            >
                              + Lihat {pest.treatmentSteps.length - 2} Langkah SOP Lainnya →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-[11px]">
                          {pest.recommendedTreatment}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* DISEASES LIST */}
            {(catalogSubTab === 'all' || catalogSubTab === 'disease') &&
              filteredDiseases.map(disease => (
                <div
                  key={disease.id}
                  className="bg-white border border-[#e9ece6] hover:border-rose-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-sm">{disease.name}</h4>
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] rounded font-bold uppercase font-mono">
                              {disease.pathogenType}
                            </span>
                          </div>
                          <span className="text-gray-400 text-xs block">Patogen: {disease.pathogenType}</span>
                        </div>
                      </div>

                      {/* Action buttons: View SOP, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewItem({ type: 'disease', data: disease })}
                          className="p-1.5 rounded-lg bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 cursor-pointer"
                          title="Lihat SOP Penanganan Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditDisease(disease)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                          title="Edit Penyakit & SOP"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ type: 'disease', id: disease.id, name: disease.name })}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer"
                          title="Hapus Penyakit dari Katalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Target Crops Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-gray-400 font-medium">Sasaran:</span>
                      {disease.targetCrops.map((tc, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#f3f5f0] border border-[#e1e5db] text-slate-700 font-medium">
                          {tc}
                        </span>
                      ))}
                    </div>

                    {/* Symptoms */}
                    <div className="p-2.5 bg-[#f9faf8] rounded-xl border border-[#e9ece6] text-xs text-gray-600">
                      <strong className="text-slate-800 block text-[11px] mb-0.5">Gejala Serangan:</strong>
                      <p className="line-clamp-2">{disease.symptoms}</p>
                    </div>

                    {/* SOP Treatment Steps Highlights */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-emerald-900 font-semibold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          Tahapan SOP Penanganan ({disease.treatmentSteps?.length || 0} Langkah):
                        </strong>
                      </div>

                      {disease.treatmentSteps && disease.treatmentSteps.length > 0 ? (
                        <div className="space-y-1.5">
                          {disease.treatmentSteps.slice(0, 2).map((st, sidx) => (
                            <div
                              key={sidx}
                              className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-[11px] text-emerald-950 flex items-start gap-2"
                            >
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                {st.stepNumber}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold truncate">{st.treatmentName}</span>
                                  <span className="px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-900 text-[9px] font-bold uppercase">
                                    {st.actionType}
                                  </span>
                                </div>
                                <div className="text-gray-600 text-[10px] mt-0.5 truncate">
                                  Obat: {st.recommendedProduct || '-'} • Dosis: {st.dosage || '-'} • Interval: {st.applicationInterval || '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                          {disease.treatmentSteps.length > 2 && (
                            <button
                              onClick={() => setViewItem({ type: 'disease', data: disease })}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer block text-center w-full"
                            >
                              + Lihat {disease.treatmentSteps.length - 2} Langkah SOP Lainnya →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-[11px]">
                          {disease.recommendedTreatment}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {filteredPests.length === 0 && filteredDiseases.length === 0 && (
            <div className="p-8 text-center bg-white border border-[#e9ece6] rounded-2xl text-gray-500 text-xs">
              Tidak ditemukan data OPT yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: MONITOR SIKLUS TERPAPAR */}
      {activeTab === 'cycle_monitor' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                Matriks Paparan Hama & Penyakit per Siklus Budidaya
              </h3>
              <p className="text-xs text-gray-500">
                Memantau riwayat serangan OPT di setiap siklus untuk evaluasi sanitasi & rotasi bahan aktif.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {cycleExposureStats.map(({ cycle, totalObs, unresolved, severe, pestCount, diseaseCount, pestNames, diseaseNames }) => (
                <div
                  key={cycle.id}
                  className={`bg-white border rounded-2xl p-4 space-y-3 shadow-xs flex flex-col justify-between ${
                    totalObs > 0 ? 'border-amber-200' : 'border-[#e9ece6]'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1 bg-[#f9faf8] border border-[#e1e5db] rounded-xl">
                          {cycle.cropIcon}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {cycle.fieldName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {cycle.cropTypeName} — {cycle.varietyName}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f3f5f0] text-emerald-900 border border-[#e1e5db]">
                        {cycle.cycleCode}
                      </span>
                    </div>

                    {/* Stats Metrics */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#f9faf8] border border-[#e9ece6] text-center text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Total Insiden</span>
                        <strong className="font-mono text-slate-800">{totalObs}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Aktif</span>
                        <strong className={`font-mono ${unresolved > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {unresolved}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Parah</span>
                        <strong className={`font-mono ${severe > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {severe}
                        </strong>
                      </div>
                    </div>

                    {/* Pest & Disease Tags */}
                    <div className="space-y-1 text-xs">
                      <div className="text-[11px] text-gray-600">
                        <strong className="text-amber-800">Hama ({pestCount}):</strong>{' '}
                        {pestNames.length > 0 ? pestNames.join(', ') : <span className="text-gray-400">Tidak ada</span>}
                      </div>
                      <div className="text-[11px] text-gray-600">
                        <strong className="text-rose-800">Penyakit ({diseaseCount}):</strong>{' '}
                        {diseaseNames.length > 0 ? diseaseNames.join(', ') : <span className="text-gray-400">Tidak ada</span>}
                      </div>
                    </div>
                  </div>

                  {/* Filter / View Button */}
                  <div className="pt-2 border-t border-[#e9ece6]">
                    <button
                      onClick={() => {
                        setFilterCycleId(cycle.id);
                        setActiveTab('observations');
                      }}
                      className="w-full py-1.5 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 text-xs font-semibold text-center cursor-pointer transition-colors"
                    >
                      Buka Riwayat Temuan Siklus Ini →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: VIEW FULL SOP DETAIL (PEST OR DISEASE) */}
      {/* ======================================================== */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col text-slate-800 shadow-2xl overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#e9ece6] bg-[#f9faf8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    viewItem.type === 'pest'
                      ? 'bg-amber-50 border border-amber-200 text-amber-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {viewItem.type === 'pest' ? <Bug className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                    {viewItem.data.name}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase font-mono ${
                        viewItem.type === 'pest' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {viewItem.type === 'pest' ? 'HAMA' : (viewItem.data as DiseaseType).pathogenType}
                    </span>
                  </h3>
                  <p className="text-gray-500 text-[11px]">
                    {viewItem.type === 'pest'
                      ? (viewItem.data as PestType).scientificName || 'Katalog Hama'
                      : `Penyakit Patogen: ${(viewItem.data as DiseaseType).pathogenType}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="p-1.5 text-gray-400 hover:text-slate-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Target Crops & Symptoms */}
              <div className="space-y-2 bg-[#f9faf8] p-3.5 rounded-xl border border-[#e9ece6]">
                <div>
                  <span className="text-gray-400 block text-[10px] font-medium uppercase">Komoditas Sasaran</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {viewItem.data.targetCrops.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border border-[#e1e5db] font-semibold text-slate-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e9ece6]">
                  <span className="text-gray-400 block text-[10px] font-medium uppercase">Gejala Serangan & Diagnosa</span>
                  <p className="text-gray-700 mt-0.5 leading-relaxed">{viewItem.data.symptoms}</p>
                </div>
              </div>

              {/* Sequential SOP Treatment Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Tahapan SOP Tindakan Pengendalian & Pencegahan
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {viewItem.data.treatmentSteps?.length || 0} Tahap Penanganan
                  </span>
                </div>

                {viewItem.data.treatmentSteps && viewItem.data.treatmentSteps.length > 0 ? (
                  <div className="space-y-2.5">
                    {viewItem.data.treatmentSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-[#e9ece6] shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                              {step.stepNumber}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">{step.treatmentName}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              step.actionType === 'spray'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : step.actionType === 'kocor'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {step.actionType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-[#f9faf8] p-2.5 rounded-lg border border-[#e9ece6]">
                          <div>
                            Obat / Produk: <strong className="text-slate-800 block truncate">{step.recommendedProduct || '-'}</strong>
                          </div>
                          <div>
                            Bahan Aktif: <strong className="text-slate-800 block truncate">{step.activeIngredient || '-'}</strong>
                          </div>
                          <div>
                            Dosis Aplikasi: <strong className="text-slate-800 block">{step.dosage || '-'}</strong>
                          </div>
                          <div>
                            Interval / Frekuensi: <strong className="text-slate-800 block">{step.applicationInterval || '-'}</strong>
                          </div>
                        </div>

                        {step.timingNotes && (
                          <div className="text-[11px] text-amber-900 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                            <strong>Waktu & Teknik Aplikasi:</strong> {step.timingNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                    <strong className="block text-slate-800 mb-0.5">Rekomendasi Penanganan:</strong>
                    {viewItem.data.recommendedTreatment}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e9ece6] bg-[#f9faf8] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-4 py-2 bg-white border border-[#e1e5db] hover:bg-[#f3f5f0] text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT PEST WITH DYNAMIC SOP STEPS */}
      {/* ======================================================== */}
      {(showAddPestModal || editPest) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-800 text-xs shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#e9ece6] bg-[#f9faf8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {editPest ? `Edit Katalog Hama: ${editPest.name}` : 'Tambah Hama & SOP Penanganan Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddPestModal(false);
                  setEditPest(null);
                }}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePest} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Nama Hama *</label>
                  <input
                    type="text"
                    value={pestName}
                    onChange={e => setPestName(e.target.value)}
                    placeholder="Contoh: Thrips, Kutu Kebul, Ulat Grayak..."
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Nama Ilmiah (Opsional)</label>
                  <input
                    type="text"
                    value={pestScientificName}
                    onChange={e => setPestScientificName(e.target.value)}
                    placeholder="Contoh: Thrips parvispinus..."
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 italic focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Komoditas Sasaran (Pisahkan koma)</label>
                <input
                  type="text"
                  value={pestTargetCrops}
                  onChange={e => setPestTargetCrops(e.target.value)}
                  placeholder="Contoh: Cabai, Tomat, Terung, Melon"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Gejala Serangan *</label>
                <textarea
                  value={pestSymptoms}
                  onChange={e => setPestSymptoms(e.target.value)}
                  rows={2}
                  placeholder="Deskripsikan ciri kerusakan pada daun, bunga, atau buah..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Ringkasan Rekomendasi Penanganan *</label>
                <input
                  type="text"
                  value={pestRecommendedTreatment}
                  onChange={e => setPestRecommendedTreatment(e.target.value)}
                  placeholder="Contoh: Rotasi spray abamektin dan imidakloprid..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              {/* Dynamic SOP Treatment Steps Builder */}
              <div className="space-y-3 pt-2 border-t border-[#e9ece6]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-700" />
                    Tahapan SOP Spray / Kocor / Mekanis ({pestSteps.length} Langkah):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPestStep}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Tahap
                  </button>
                </div>

                <div className="space-y-3">
                  {pestSteps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-[#f9faf8] border border-[#e1e5db] rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          Tahap {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={step.actionType}
                            onChange={e => {
                              const updated = [...pestSteps];
                              updated[idx].actionType = e.target.value as any;
                              setPestSteps(updated);
                            }}
                            className="bg-white border border-[#e1e5db] rounded-lg px-2 py-0.5 text-xs font-semibold"
                          >
                            <option value="spray">SPRAY (Semprot)</option>
                            <option value="kocor">KOCOR (Siram Akar)</option>
                            <option value="mekanis">MEKANIS (Perangkap/Petik)</option>
                            <option value="biologis">BIOLOGIS (Agens Hayati)</option>
                            <option value="kultur_teknis">KULTUR TEKNIS</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemovePestStep(idx)}
                            className="text-gray-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nama Tindakan (misal: Spray Kontak Awal)"
                          value={step.treatmentName}
                          onChange={e => {
                            const updated = [...pestSteps];
                            updated[idx].treatmentName = e.target.value;
                            setPestSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs font-medium"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Produk / Merk Obat (misal: Pegasus / Agrimec)"
                          value={step.recommendedProduct || ''}
                          onChange={e => {
                            const updated = [...pestSteps];
                            updated[idx].recommendedProduct = e.target.value;
                            setPestSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Bahan Aktif"
                          value={step.activeIngredient || ''}
                          onChange={e => {
                            const updated = [...pestSteps];
                            updated[idx].activeIngredient = e.target.value;
                            setPestSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Dosis (misal: 1 ml/L)"
                          value={step.dosage || ''}
                          onChange={e => {
                            const updated = [...pestSteps];
                            updated[idx].dosage = e.target.value;
                            setPestSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Interval (misal: 4 hari)"
                          value={step.applicationInterval || ''}
                          onChange={e => {
                            const updated = [...pestSteps];
                            updated[idx].applicationInterval = e.target.value;
                            setPestSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan Waktu & Aplikasi (misal: Semprot sore hari di bawah daun)"
                        value={step.timingNotes || ''}
                        onChange={e => {
                          const updated = [...pestSteps];
                          updated[idx].timingNotes = e.target.value;
                          setPestSteps(updated);
                        }}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPestModal(false);
                    setEditPest(null);
                  }}
                  className="px-4 py-2 bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan Katalog Hama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT DISEASE WITH DYNAMIC SOP STEPS */}
      {/* ======================================================== */}
      {(showAddDiseaseModal || editDisease) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-800 text-xs shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#e9ece6] bg-[#f9faf8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {editDisease ? `Edit Katalog Penyakit: ${editDisease.name}` : 'Tambah Penyakit & SOP Penanganan Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddDiseaseModal(false);
                  setEditDisease(null);
                }}
                className="p-1 text-gray-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDisease} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Nama Penyakit *</label>
                  <input
                    type="text"
                    value={diseaseName}
                    onChange={e => setDiseaseName(e.target.value)}
                    placeholder="Contoh: Antraknosa (Patek), Layu Bakteri, Virus Gemini..."
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Jenis Patogen</label>
                  <select
                    value={diseasePathogenType}
                    onChange={e => setDiseasePathogenType(e.target.value as any)}
                    className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  >
                    <option value="fungus">Jamur / Fungi</option>
                    <option value="bacteria">Bakteri</option>
                    <option value="virus">Virus</option>
                    <option value="nematode">Nematoda</option>
                    <option value="nutrient_deficiency">Defisiensi Nutrisi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Komoditas Sasaran (Pisahkan koma)</label>
                <input
                  type="text"
                  value={diseaseTargetCrops}
                  onChange={e => setDiseaseTargetCrops(e.target.value)}
                  placeholder="Contoh: Cabai, Tomat, Terung"
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Gejala Serangan *</label>
                <textarea
                  value={diseaseSymptoms}
                  onChange={e => setDiseaseSymptoms(e.target.value)}
                  rows={2}
                  placeholder="Deskripsikan ciri bercak daun, busuk buah, layu, atau perubahan warna..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Ringkasan Rekomendasi Penanganan *</label>
                <input
                  type="text"
                  value={diseaseRecommendedTreatment}
                  onChange={e => setDiseaseRecommendedTreatment(e.target.value)}
                  placeholder="Contoh: Kocor fungisida sistemik dan spray tembaga hidroksida..."
                  className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-xl px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  required
                />
              </div>

              {/* Dynamic SOP Treatment Steps Builder */}
              <div className="space-y-3 pt-2 border-t border-[#e9ece6]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                    Tahapan SOP Spray / Kocor / Mekanis ({diseaseSteps.length} Langkah):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDiseaseStep}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Tahap
                  </button>
                </div>

                <div className="space-y-3">
                  {diseaseSteps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-[#f9faf8] border border-[#e1e5db] rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          Tahap {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={step.actionType}
                            onChange={e => {
                              const updated = [...diseaseSteps];
                              updated[idx].actionType = e.target.value as any;
                              setDiseaseSteps(updated);
                            }}
                            className="bg-white border border-[#e1e5db] rounded-lg px-2 py-0.5 text-xs font-semibold"
                          >
                            <option value="kocor">KOCOR (Siram Akar)</option>
                            <option value="spray">SPRAY (Semprot)</option>
                            <option value="mekanis">MEKANIS (Eradikasi Tanaman)</option>
                            <option value="biologis">BIOLOGIS (Trichoderma)</option>
                            <option value="kultur_teknis">KULTUR TEKNIS</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveDiseaseStep(idx)}
                            className="text-gray-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nama Tindakan (misal: Kocor Fungisida Sistemik)"
                          value={step.treatmentName}
                          onChange={e => {
                            const updated = [...diseaseSteps];
                            updated[idx].treatmentName = e.target.value;
                            setDiseaseSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs font-medium"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Produk / Merk Obat (misal: Mancozeb / Nativo)"
                          value={step.recommendedProduct || ''}
                          onChange={e => {
                            const updated = [...diseaseSteps];
                            updated[idx].recommendedProduct = e.target.value;
                            setDiseaseSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Bahan Aktif"
                          value={step.activeIngredient || ''}
                          onChange={e => {
                            const updated = [...diseaseSteps];
                            updated[idx].activeIngredient = e.target.value;
                            setDiseaseSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Dosis (misal: 2 gr/L)"
                          value={step.dosage || ''}
                          onChange={e => {
                            const updated = [...diseaseSteps];
                            updated[idx].dosage = e.target.value;
                            setDiseaseSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Interval (misal: 5 hari)"
                          value={step.applicationInterval || ''}
                          onChange={e => {
                            const updated = [...diseaseSteps];
                            updated[idx].applicationInterval = e.target.value;
                            setDiseaseSteps(updated);
                          }}
                          className="bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan Waktu & Aplikasi (misal: Kocor di leher batang pagi hari)"
                        value={step.timingNotes || ''}
                        onChange={e => {
                          const updated = [...diseaseSteps];
                          updated[idx].timingNotes = e.target.value;
                          setDiseaseSteps(updated);
                        }}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDiseaseModal(false);
                    setEditDisease(null);
                  }}
                  className="px-4 py-2 bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan Katalog Penyakit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-sm p-5 text-slate-800 text-xs shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus</h3>
                <p className="text-[11px] text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus <strong>"{deleteModal.name}"</strong>?
            </p>

            <div className="pt-3 border-t border-[#e9ece6] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-3.5 py-2 rounded-xl bg-[#f3f5f0] text-slate-700 hover:bg-[#e9ece6] font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs"
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
