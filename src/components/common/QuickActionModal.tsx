import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Sprout,
  Activity,
  Bug,
  AlertCircle,
  CircleDollarSign,
  TrendingUp,
  ShoppingBag,
  Boxes,
  CheckCircle2,
  Layers,
  Calendar
} from 'lucide-react';
import { useApp, QuickActionType } from '../../context/AppContext';
import { StorageService } from '../../services/storage';

export const QuickActionModal: React.FC = () => {
  const {
    quickActionModalOpen,
    quickActionDefaultType,
    closeQuickAction,
    activeCycle,
    fields,
    crops,
    sops,
    inventory,
    refreshData,
    setActiveCycleId
  } = useApp();

  const [selectedAction, setSelectedAction] = useState<QuickActionType | null>(null);

  // Form states
  // Monitoring form
  const [monDate, setMonDate] = useState(new Date().toISOString().split('T')[0]);
  const [monInspected, setMonInspected] = useState('200');
  const [monHealthy, setMonHealthy] = useState('195');
  const [monAttention, setMonAttention] = useState('3');
  const [monProblem, setMonProblem] = useState('2');
  const [monDead] = useState('0');
  const [monPest] = useState('2');
  const [monDisease] = useState('0');
  const [monMoisture, setMonMoisture] = useState('65');
  const [monPh, setMonPh] = useState('6.4');
  const [monHeight, setMonHeight] = useState('35');
  const [monNotes, setMonNotes] = useState('');

  // Pest observation form
  const [pestName, setPestName] = useState('Thrips (Thrips parvispinus)');
  const [pestSeverity, setPestSeverity] = useState<'ringan' | 'sedang' | 'parah'>('ringan');
  const [pestCount, setPestCount] = useState('10');
  const [pestAction, setPestAction] = useState('Semprot Abamektin sore hari');
  const [pestNotes, setPestNotes] = useState('');

  // Disease observation form
  const [disName, setDisName] = useState('Antraknosa / Patek');
  const [disSeverity, setDisSeverity] = useState<'ringan' | 'sedang' | 'parah'>('ringan');
  const [disCount, setDisCount] = useState('5');
  const [disAction, setDisAction] = useState('Semprot Mankozeb 2g/L');
  const [disNotes, setDisNotes] = useState('');

  // Expense form
  const [expCategory, setExpCategory] = useState<any>('pupuk');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Income form
  const [incSource, setIncSource] = useState<any>('harvest_sale');
  const [incDesc, setIncDesc] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incBuyer, setIncBuyer] = useState('');

  // Harvest form
  const [hrvDate, setHrvDate] = useState(new Date().toISOString().split('T')[0]);
  const [hrvGradeA, setHrvGradeA] = useState('100');
  const [hrvGradeB, setHrvGradeB] = useState('30');
  const [hrvGradeC, setHrvGradeC] = useState('10');
  const [hrvPriceA, setHrvPriceA] = useState('35000');
  const [hrvPriceB, setHrvPriceB] = useState('28000');
  const [hrvPriceC, setHrvPriceC] = useState('15000');
  const [hrvBuyer, setHrvBuyer] = useState('Juragan Pasar');
  const [hrvNotes, setHrvNotes] = useState('');

  // Inventory transaction form
  const [invItemId, setInvItemId] = useState(inventory[0]?.id || '');
  const [invType, setInvType] = useState<'stock_in' | 'stock_out' | 'adjustment'>('stock_in');
  const [invQty, setInvQty] = useState('10');
  const [invReason, setInvReason] = useState('Restock pembelian baru');

  // Create cycle form
  const [cycFieldId, setCycFieldId] = useState(fields[0]?.id || '');
  const [cycCropId, setCycCropId] = useState(crops[0]?.id || '');
  const [cycVarietyId, setCycVarietyId] = useState(crops[0]?.varieties[0]?.id || '');
  const [cycPlantCount, setCycPlantCount] = useState('5000');
  
  // Default: Land prep starts 21 days before planting
  const getInitialDates = () => {
    const today = new Date();
    const planting = new Date(today);
    planting.setDate(today.getDate() + 7); // Planting in 7 days
    const prep = new Date(planting);
    prep.setDate(planting.getDate() - 21); // Land prep 21 days before planting
    return {
      prepStr: prep.toISOString().split('T')[0],
      plantStr: planting.toISOString().split('T')[0]
    };
  };

  const initialDates = getInitialDates();
  const [cycLandPrepStartDate, setCycLandPrepStartDate] = useState(initialDates.prepStr);
  const [cycStartDate, setCycStartDate] = useState(initialDates.plantStr);
  const [cycEstHarvestDate, setCycEstHarvestDate] = useState('');
  const [cycSOPTemplateId, setCycSOPTemplateId] = useState(sops[0]?.id || '');
  const [cycSOPVersionId, setCycSOPVersionId] = useState(sops[0]?.versions[0]?.id || '');
  const [cycNotes, setCycNotes] = useState('');

  // Helper to adjust land prep duration preset
  const handleSetPrepDuration = (days: number) => {
    const planting = new Date(cycStartDate || new Date());
    planting.setDate(planting.getDate() - days);
    setCycLandPrepStartDate(planting.toISOString().split('T')[0]);
  };

  // Calculate actual prep duration days
  const prepDurationDays = useMemo(() => {
    if (!cycLandPrepStartDate || !cycStartDate) return 0;
    const prep = new Date(cycLandPrepStartDate);
    const plant = new Date(cycStartDate);
    const diff = Math.floor((plant.getTime() - prep.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [cycLandPrepStartDate, cycStartDate]);

  // Sync with default action or reset
  useEffect(() => {
    if (quickActionDefaultType) {
      setSelectedAction(quickActionDefaultType);
    } else {
      setSelectedAction(null);
    }
  }, [quickActionDefaultType, quickActionModalOpen]);

  // Auto set estimated harvest date when crop changes
  useEffect(() => {
    const selectedCrop = crops.find(c => c.id === cycCropId);
    if (selectedCrop && selectedCrop.varieties.length > 0) {
      const variety = selectedCrop.varieties.find(v => v.id === cycVarietyId) || selectedCrop.varieties[0];
      if (variety) {
        const start = new Date(cycStartDate || new Date());
        start.setDate(start.getDate() + (variety.averageMaturityDays || 75));
        setCycEstHarvestDate(start.toISOString().split('T')[0]);
      }
    }
  }, [cycCropId, cycVarietyId, cycStartDate]);

  // Update SOP version dropdown when template changes
  useEffect(() => {
    const selectedSop = sops.find(s => s.id === cycSOPTemplateId);
    if (selectedSop && selectedSop.versions.length > 0) {
      const activeVer = selectedSop.versions.find(v => v.id === selectedSop.activeVersionId) || selectedSop.versions[0];
      setCycSOPVersionId(activeVer.id);
    }
  }, [cycSOPTemplateId, sops]);

  if (!quickActionModalOpen) return null;

  const handleCreateMonitoring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    StorageService.addMonitoringRecord({
      cycleId: activeCycle.id,
      date: monDate,
      dayOffset: Math.floor((new Date(monDate).getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 3600 * 24)),
      plantsInspected: Number(monInspected) || 0,
      healthyCount: Number(monHealthy) || 0,
      attentionCount: Number(monAttention) || 0,
      problematicCount: Number(monProblem) || 0,
      deadCount: Number(monDead) || 0,
      pestAffectedCount: Number(monPest) || 0,
      diseaseAffectedCount: Number(monDisease) || 0,
      averageHeightCm: Number(monHeight) || 0,
      soilMoisturePercent: Number(monMoisture) || 0,
      soilPh: Number(monPh) || 0,
      notes: monNotes
    });

    refreshData();
    closeQuickAction();
  };

  const handleCreatePestObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    StorageService.addPestObservation({
      cycleId: activeCycle.id,
      pestTypeId: 'pest-custom',
      date: new Date().toISOString().split('T')[0],
      dayOffset: Math.max(0, Math.floor((new Date().getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 3600 * 24))),
      pestName: pestName,
      severity: pestSeverity,
      affectedPlantsCount: Number(pestCount) || 1,
      actionTaken: pestAction,
      resolved: false,
      notes: pestNotes
    });

    refreshData();
    closeQuickAction();
  };

  const handleCreateDiseaseObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    StorageService.addDiseaseObservation({
      cycleId: activeCycle.id,
      diseaseTypeId: 'dis-custom',
      date: new Date().toISOString().split('T')[0],
      dayOffset: Math.max(0, Math.floor((new Date().getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 3600 * 24))),
      diseaseName: disName,
      severity: disSeverity,
      affectedPlantsCount: Number(disCount) || 1,
      actionTaken: disAction,
      resolved: false,
      notes: disNotes
    });

    refreshData();
    closeQuickAction();
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    StorageService.addExpense({
      cycleId: activeCycle.id,
      date: new Date().toISOString().split('T')[0],
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount) || 0
    });

    refreshData();
    closeQuickAction();
  };

  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    StorageService.addIncome({
      cycleId: activeCycle.id,
      date: new Date().toISOString().split('T')[0],
      source: (incSource as any) || 'harvest_sale',
      description: incDesc,
      amount: Number(incAmount) || 0,
      buyerName: incBuyer || undefined,
      paymentStatus: 'paid'
    });

    refreshData();
    closeQuickAction();
  };

  const handleCreateHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    const wA = Number(hrvGradeA) || 0;
    const wB = Number(hrvGradeB) || 0;
    const wC = Number(hrvGradeC) || 0;
    const pA = Number(hrvPriceA) || 0;
    const pB = Number(hrvPriceB) || 0;
    const pC = Number(hrvPriceC) || 0;

    const subA = wA * pA;
    const subB = wB * pB;
    const subC = wC * pC;
    const totalWeight = wA + wB + wC;
    const totalSales = subA + subB + subC;

    StorageService.addHarvest({
      cycleId: activeCycle.id,
      cycleCode: activeCycle.cycleCode,
      fieldName: activeCycle.fieldName,
      cropName: activeCycle.cropTypeName,
      varietyName: activeCycle.varietyName,
      date: hrvDate,
      dayOffset: Math.max(0, Math.floor((new Date(hrvDate).getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 3600 * 24))),
      totalWeightKg: totalWeight,
      grades: [
        { grade: 'Grade A (Super)', weightKg: wA, unitPrice: pA, subtotal: subA },
        { grade: 'Grade B (Medium)', weightKg: wB, unitPrice: pB, subtotal: subB },
        { grade: 'Grade C (Kecil/Off)', weightKg: wC, unitPrice: pC, subtotal: subC }
      ],
      totalSalesAmount: totalSales,
      buyerName: hrvBuyer,
      qualityNotes: hrvNotes
    });

    refreshData();
    closeQuickAction();
  };

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    const field = fields.find(f => f.id === cycFieldId) || fields[0];
    const crop = crops.find(c => c.id === cycCropId) || crops[0];
    const variety = crop.varieties.find(v => v.id === cycVarietyId) || crop.varieties[0];
    const sopTemplate = sops.find(s => s.id === cycSOPTemplateId) || sops[0];
    const sopVersion = sopTemplate.versions.find(v => v.id === cycSOPVersionId) || sopTemplate.versions[0];

    const newCycle = StorageService.createCultivationCycle(
      {
        fieldId: field.id,
        fieldName: field.name,
        cropTypeId: crop.id,
        cropTypeName: crop.name,
        cropIcon: crop.icon,
        varietyId: variety.id,
        varietyName: variety.name,
        plantCount: Number(cycPlantCount) || 1000,
        landPrepStartDate: cycLandPrepStartDate,
        startDate: cycStartDate,
        estimatedHarvestDate: cycEstHarvestDate || cycStartDate,
        sopTemplateId: sopTemplate.id,
        sopVersionId: sopVersion.id,
        status: 'active',
        notes: cycNotes
      },
      sopTemplate,
      sopVersion
    );

    setActiveCycleId(newCycle.id);
    refreshData();
    closeQuickAction();
  };

  const handleInventoryTx = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === invItemId);
    if (!item) return;

    const qty = Number(invQty) || 0;
    if (invType === 'stock_in') {
      item.currentStock += qty;
    } else if (invType === 'stock_out') {
      item.currentStock = Math.max(0, item.currentStock - qty);
    } else if (invType === 'adjustment') {
      item.currentStock = qty;
    }
    item.updatedAt = new Date().toISOString();
    StorageService.saveInventoryItem(item);

    StorageService.addInventoryTransaction({
      inventoryItemId: item.id,
      itemName: item.name,
      type: invType,
      quantity: qty,
      unitPrice: item.unitPrice,
      totalCost: qty * item.unitPrice,
      reason: invReason,
      date: new Date().toISOString().split('T')[0]
    });

    refreshData();
    closeQuickAction();
  };

  const actionsList: { id: QuickActionType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
    {
      id: 'add_monitoring',
      label: 'Catat Monitoring Harian',
      icon: <Activity className="w-5 h-5 text-emerald-700" />,
      desc: 'Inspeksi tanaman sehat, perhatian, hama, pH & tinggi',
      color: 'hover:border-emerald-300 hover:bg-emerald-50/50'
    },
    {
      id: 'add_harvest',
      label: 'Catat Hasil Panen',
      icon: <ShoppingBag className="w-5 h-5 text-amber-600" />,
      desc: 'Timbang Grade A/B/C, pembeli & nominal penjualan',
      color: 'hover:border-amber-300 hover:bg-amber-50/50'
    },
    {
      id: 'add_pest_obs',
      label: 'Observasi Hama',
      icon: <Bug className="w-5 h-5 text-red-600" />,
      desc: 'Deteksi serangan thrips, kutu daun, ulat & tindakan',
      color: 'hover:border-red-300 hover:bg-red-50/50'
    },
    {
      id: 'add_disease_obs',
      label: 'Observasi Penyakit',
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      desc: 'Layu bakteri, antraknosa, bercak daun & fungisida',
      color: 'hover:border-orange-300 hover:bg-orange-50/50'
    },
    {
      id: 'add_expense',
      label: 'Catat Pengeluaran',
      icon: <CircleDollarSign className="w-5 h-5 text-red-600" />,
      desc: 'Biaya pupuk, benih, mulsa, tenaga kerja & bbm',
      color: 'hover:border-red-300 hover:bg-red-50/50'
    },
    {
      id: 'add_income',
      label: 'Catat Pemasukan Lain',
      icon: <TrendingUp className="w-5 h-5 text-teal-600" />,
      desc: 'Penjualan sampingan, bibit, atau subsidi',
      color: 'hover:border-teal-300 hover:bg-teal-50/50'
    },
    {
      id: 'add_inventory_stock',
      label: 'Transaksi Stok Inventaris',
      icon: <Boxes className="w-5 h-5 text-indigo-600" />,
      desc: 'Masuk stok baru, keluar, atau penyesuaian opname',
      color: 'hover:border-indigo-300 hover:bg-indigo-50/50'
    },
    {
      id: 'create_cycle',
      label: 'Buat Siklus Budidaya Baru',
      icon: <Sprout className="w-5 h-5 text-emerald-700" />,
      desc: 'Lahan + Tanaman + Kunci Snapshot SOP Versi Terpilih',
      color: 'hover:border-emerald-300 hover:bg-emerald-50/50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-auto text-slate-800 animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {selectedAction ? actionsList.find(a => a.id === selectedAction)?.label : 'Menu Aksi Cepat'}
              </h2>
              {activeCycle && (
                <p className="text-[11px] text-gray-500">
                  Target Konteks: <span className="text-emerald-700 font-medium">{activeCycle.fieldName.split('—')[0]} ({activeCycle.varietyName})</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={closeQuickAction}
            className="p-1.5 text-gray-400 hover:text-slate-700 rounded-lg hover:bg-[#f3f5f0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {!selectedAction ? (
            /* ACTION SELECTOR GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {actionsList.map((act) => (
                <button
                  key={act.id}
                  onClick={() => setSelectedAction(act.id)}
                  className={`p-3.5 rounded-xl border border-[#e9ece6] bg-[#f9faf8] text-left flex items-start gap-3 transition-all cursor-pointer ${act.color}`}
                >
                  <div className="p-2 rounded-lg bg-white border border-[#e1e5db] shrink-0 shadow-2xs">
                    {act.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-slate-800">{act.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{act.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* ACTION FORMS */
            <div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold mb-4 flex items-center gap-1 cursor-pointer"
              >
                ← Kembali ke Pilihan Aksi
              </button>

              {/* 1. MONITORING FORM */}
              {selectedAction === 'add_monitoring' && (
                <form onSubmit={handleCreateMonitoring} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Tanggal</label>
                      <input
                        type="date"
                        value={monDate}
                        onChange={e => setMonDate(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Tanaman Disampling</label>
                      <input
                        type="number"
                        value={monInspected}
                        onChange={e => setMonInspected(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6]">
                    <div>
                      <label className="block text-emerald-700 mb-1 font-semibold">Sehat</label>
                      <input
                        type="number"
                        value={monHealthy}
                        onChange={e => setMonHealthy(e.target.value)}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-amber-700 mb-1 font-semibold">Perhatian</label>
                      <input
                        type="number"
                        value={monAttention}
                        onChange={e => setMonAttention(e.target.value)}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-red-600 mb-1 font-semibold">Bermasalah</label>
                      <input
                        type="number"
                        value={monProblem}
                        onChange={e => setMonProblem(e.target.value)}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Kelembaban (%)</label>
                      <input
                        type="number"
                        value={monMoisture}
                        onChange={e => setMonMoisture(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">pH Tanah</label>
                      <input
                        type="number"
                        step="0.1"
                        value={monPh}
                        onChange={e => setMonPh(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Rata-rata Tinggi (cm)</label>
                      <input
                        type="number"
                        value={monHeight}
                        onChange={e => setMonHeight(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Catatan Observasi</label>
                    <textarea
                      value={monNotes}
                      onChange={e => setMonNotes(e.target.value)}
                      placeholder="Contoh: Daun bawah agak menguning, tanah lembab terjaga..."
                      rows={2}
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Catatan Monitoring
                  </button>
                </form>
              )}

              {/* 2. HARVEST FORM */}
              {selectedAction === 'add_harvest' && (
                <form onSubmit={handleCreateHarvest} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Tanggal Panen</label>
                    <input
                      type="date"
                      value={hrvDate}
                      onChange={e => setHrvDate(e.target.value)}
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2 bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6]">
                    <div className="text-slate-800 font-semibold text-[11px] uppercase tracking-wider">Rincian Timbangan & Harga</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-emerald-700 mb-0.5 font-medium">Grade A (Super) - kg</label>
                        <input
                          type="number"
                          value={hrvGradeA}
                          onChange={e => setHrvGradeA(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-0.5 font-medium">Harga / kg (Rp)</label>
                        <input
                          type="number"
                          value={hrvPriceA}
                          onChange={e => setHrvPriceA(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-amber-700 mb-0.5 font-medium">Grade B (Medium) - kg</label>
                        <input
                          type="number"
                          value={hrvGradeB}
                          onChange={e => setHrvGradeB(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-0.5 font-medium">Harga / kg (Rp)</label>
                        <input
                          type="number"
                          value={hrvPriceB}
                          onChange={e => setHrvPriceB(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-600 mb-0.5 font-medium">Grade C / BS (kg)</label>
                        <input
                          type="number"
                          value={hrvGradeC}
                          onChange={e => setHrvGradeC(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 mb-0.5 font-medium">Harga / kg (Rp)</label>
                        <input
                          type="number"
                          value={hrvPriceC}
                          onChange={e => setHrvPriceC(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Pembeli / Pengepul</label>
                      <input
                        type="text"
                        value={hrvBuyer}
                        onChange={e => setHrvBuyer(e.target.value)}
                        placeholder="Nama tengkulak / pasar"
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Catatan Kualitas</label>
                      <input
                        type="text"
                        value={hrvNotes}
                        onChange={e => setHrvNotes(e.target.value)}
                        placeholder="Kulit mulus, padat"
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Data Panen & Auto-Catat Pemasukan
                  </button>
                </form>
              )}

              {/* 3. PEST OBSERVATION */}
              {selectedAction === 'add_pest_obs' && (
                <form onSubmit={handleCreatePestObs} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Jenis Hama</label>
                    <input
                      type="text"
                      value={pestName}
                      onChange={e => setPestName(e.target.value)}
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Tingkat Keparahan</label>
                      <select
                        value={pestSeverity}
                        onChange={e => setPestSeverity(e.target.value as any)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        <option value="ringan">Ringan (&lt; 5% populasi)</option>
                        <option value="sedang">Sedang (5-20% populasi)</option>
                        <option value="parah">Parah (&gt; 20% populasi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Tanaman Terdampak</label>
                      <input
                        type="number"
                        value={pestCount}
                        onChange={e => setPestCount(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Tindakan Pengendalian</label>
                    <input
                      type="text"
                      value={pestAction}
                      onChange={e => setPestAction(e.target.value)}
                      placeholder="Contoh: Semprot abamektin 0.5ml/L sore hari"
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Observasi Hama
                  </button>
                </form>
              )}

              {/* 4. DISEASE OBSERVATION */}
              {selectedAction === 'add_disease_obs' && (
                <form onSubmit={handleCreateDiseaseObs} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Jenis Penyakit</label>
                    <input
                      type="text"
                      value={disName}
                      onChange={e => setDisName(e.target.value)}
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Tingkat Keparahan</label>
                      <select
                        value={disSeverity}
                        onChange={e => setDisSeverity(e.target.value as any)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        <option value="ringan">Ringan (Bercak awal)</option>
                        <option value="sedang">Sedang (Menyebar beberapa tanaman)</option>
                        <option value="parah">Parah (Layu meluas)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Tanaman Terinfeksi</label>
                      <input
                        type="number"
                        value={disCount}
                        onChange={e => setDisCount(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Tindakan Pengobatan</label>
                    <input
                      type="text"
                      value={disAction}
                      onChange={e => setDisAction(e.target.value)}
                      placeholder="Cabut tanaman layu & kocor tembaga hidroksida"
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Observasi Penyakit
                  </button>
                </form>
              )}

              {/* 5. EXPENSE FORM */}
              {selectedAction === 'add_expense' && (
                <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Kategori Biaya</label>
                      <select
                        value={expCategory}
                        onChange={e => setExpCategory(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        <option value="pupuk">Pupuk</option>
                        <option value="bibit">Bibit / Benih</option>
                        <option value="pestisida">Pestisida / Obat</option>
                        <option value="alat_perlengkapan">Alat & Perlengkapan</option>
                        <option value="tenaga_kerja">Tenaga Kerja / Upah</option>
                        <option value="air_irigasi">Air & Irigasi</option>
                        <option value="listrik_bbm">Listrik / BBM</option>
                        <option value="transportasi">Transportasi</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Nominal (Rp)</label>
                      <input
                        type="number"
                        value={expAmount}
                        onChange={e => setExpAmount(e.target.value)}
                        placeholder="Contoh: 250000"
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Deskripsi / Keterangan</label>
                    <input
                      type="text"
                      value={expDesc}
                      onChange={e => setExpDesc(e.target.value)}
                      placeholder="Pembelian 1 sak NPK Mutiara..."
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Pengeluaran
                  </button>
                </form>
              )}

              {/* 6. INCOME FORM */}
              {selectedAction === 'add_income' && (
                <form onSubmit={handleCreateIncome} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Sumber Pemasukan</label>
                      <select
                        value={incSource}
                        onChange={e => setIncSource(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        <option value="harvest_sale">Penjualan Panen</option>
                        <option value="seedling_sale">Penjualan Bibit</option>
                        <option value="byproduct">Hasil Sampingan</option>
                        <option value="subsidy">Subsidi / Bantuan</option>
                        <option value="other">Lain-lain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Nominal (Rp)</label>
                      <input
                        type="number"
                        value={incAmount}
                        onChange={e => setIncAmount(e.target.value)}
                        placeholder="Contoh: 1500000"
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Keterangan Pemasukan</label>
                    <input
                      type="text"
                      value={incDesc}
                      onChange={e => setIncDesc(e.target.value)}
                      placeholder="Penjualan daun bawang tumpangsari..."
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan Pemasukan
                  </button>
                </form>
              )}

              {/* 7. INVENTORY TRANSACTION */}
              {selectedAction === 'add_inventory_stock' && (
                <form onSubmit={handleInventoryTx} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Pilih Barang Inventaris</label>
                    <select
                      value={invItemId}
                      onChange={e => setInvItemId(e.target.value)}
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    >
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.currentStock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Jenis Transaksi</label>
                      <select
                        value={invType}
                        onChange={e => setInvType(e.target.value as any)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        <option value="stock_in">Stok Masuk (+)</option>
                        <option value="stock_out">Stok Keluar (-)</option>
                        <option value="adjustment">Penyesuaian Opname (=)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Jumlah</label>
                      <input
                        type="number"
                        value={invQty}
                        onChange={e => setInvQty(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Alasan / Keterangan</label>
                    <input
                      type="text"
                      value={invReason}
                      onChange={e => setInvReason(e.target.value)}
                      placeholder="Contoh: Pembelian toko tani Subur..."
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Proses Transaksi Stok
                  </button>
                </form>
              )}

              {/* 8. CREATE CULTIVATION CYCLE WITH SOP SNAPSHOT */}
              {selectedAction === 'create_cycle' && (
                <form onSubmit={handleCreateCycle} className="space-y-3.5 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    <p className="font-semibold text-xs mb-0.5 flex items-center gap-1.5 text-emerald-800">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      Arsitektur Kunci Snapshot SOP
                    </p>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Sistem akan membuat salinan permanen (snapshot) dari versi SOP yang Anda pilih. Modifikasi SOP master di masa depan tidak akan mengubah riwayat siklus ini.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Pilih Lahan</label>
                      <select
                        value={cycFieldId}
                        onChange={e => setCycFieldId(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        {fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Jenis Tanaman</label>
                      <select
                        value={cycCropId}
                        onChange={e => {
                          setCycCropId(e.target.value);
                          const crop = crops.find(c => c.id === e.target.value);
                          if (crop && crop.varieties.length > 0) {
                            setCycVarietyId(crop.varieties[0].id);
                          }
                        }}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        {crops.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Varietas</label>
                      <select
                        value={cycVarietyId}
                        onChange={e => setCycVarietyId(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                      >
                        {crops.find(c => c.id === cycCropId)?.varieties.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-medium">Populasi Tanaman (Pohon)</label>
                      <input
                        type="number"
                        value={cycPlantCount}
                        onChange={e => setCycPlantCount(e.target.value)}
                        className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* TIMELINE & LAND PREPARATION SECTION */}
                  <div className="bg-[#f9faf8] p-3.5 rounded-xl border border-[#e1e5db] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-emerald-900 font-bold flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        Jadwal Siklus (Mulai dari Pengolahan Lahan)
                      </label>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-semibold">
                        Durasi Olah Lahan: {prepDurationDays > 0 ? `${prepDurationDays} Hari` : '0 Hari'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-700 mb-1 font-semibold text-[11px]">
                          1. Tanggal Mulai Pengolahan Lahan
                        </label>
                        <input
                          type="date"
                          value={cycLandPrepStartDate}
                          onChange={e => setCycLandPrepStartDate(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-emerald-600 shadow-2xs"
                          required
                        />
                        <span className="text-[10px] text-gray-500 mt-0.5 block">
                          Monitoring dimulai sejak hari pertama pengolahan tanah
                        </span>
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-1 font-semibold text-[11px]">
                          2. Tanggal Penanaman Bibit (H-0)
                        </label>
                        <input
                          type="date"
                          value={cycStartDate}
                          onChange={e => setCycStartDate(e.target.value)}
                          className="w-full bg-white border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-emerald-600 shadow-2xs"
                          required
                        />
                        <span className="text-[10px] text-gray-500 mt-0.5 block">
                          Titik awal H-0 bibit pindah tanam ke bedengan
                        </span>
                      </div>
                    </div>

                    {/* Quick Duration Presets for Land Prep */}
                    <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                      <span className="text-gray-500">Preset Waktu Olah Lahan:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[14, 21, 30, 45].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => handleSetPrepDuration(days)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border ${
                              prepDurationDays === days
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-[#e1e5db] hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            {days} Hari
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1 font-semibold text-[11px]">
                        3. Estimasi Tanggal Panen Perdana
                      </label>
                      <input
                        type="date"
                        value={cycEstHarvestDate}
                        onChange={e => setCycEstHarvestDate(e.target.value)}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-emerald-600 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#f9faf8] p-3 rounded-xl border border-[#e9ece6]">
                    <div>
                      <label className="block text-emerald-800 mb-1 font-semibold">Pilih Standar SOP</label>
                      <select
                        value={cycSOPTemplateId}
                        onChange={e => setCycSOPTemplateId(e.target.value)}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                      >
                        {sops.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-emerald-800 mb-1 font-semibold">Versi SOP Snapshot</label>
                      <select
                        value={cycSOPVersionId}
                        onChange={e => setCycSOPVersionId(e.target.value)}
                        className="w-full bg-white border border-[#e1e5db] rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-emerald-600"
                      >
                        {sops.find(s => s.id === cycSOPTemplateId)?.versions.map(v => (
                          <option key={v.id} value={v.id}>{v.versionNumber} ({v.status})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Catatan Siklus (Opsional)</label>
                    <textarea
                      value={cycNotes}
                      onChange={e => setCycNotes(e.target.value)}
                      placeholder="Kondisi cuaca, sistem irigasi, tujuan target panen..."
                      rows={2}
                      className="w-full bg-[#f9faf8] border border-[#e1e5db] rounded-lg px-3 py-2 text-slate-800 focus:outline-emerald-600 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Kunci Snapshot & Luncurkan Siklus Budidaya
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
