import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Droplets,
  Thermometer,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { CultivationCycle, MonitoringRecord } from '../../types';
import { StorageService } from '../../services/storage';

interface PlantHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCycle: CultivationCycle;
  latestRecord?: MonitoringRecord;
  currentDayOffset: number;
  isLandPrep?: boolean;
  onSuccess: () => void;
}

export const PlantHealthModal: React.FC<PlantHealthModalProps> = ({
  isOpen,
  onClose,
  activeCycle,
  latestRecord,
  currentDayOffset,
  isLandPrep = false,
  onSuccess
}) => {
  const [totalPlants, setTotalPlants] = useState<number>(activeCycle.plantCount || 1000);
  const [healthyCount, setHealthyCount] = useState<number>(0);
  const [attentionCount, setAttentionCount] = useState<number>(0);
  const [problematicCount, setProblematicCount] = useState<number>(0);
  const [deadCount, setDeadCount] = useState<number>(0);

  // Soil & Growth
  const [soilPh, setSoilPh] = useState<number>(6.4);
  const [soilMoisture, setSoilMoisture] = useState<number>(65);
  const [avgHeight, setAvgHeight] = useState<number>(35);
  const [notes, setNotes] = useState<string>('');

  // Quick Pest/Disease incident
  const [hasPestIncident, setHasPestIncident] = useState(false);
  const [pestName, setPestName] = useState('Kutu Kebul (Bemisia tabaci)');
  const [pestSeverity, setPestSeverity] = useState<'ringan' | 'sedang' | 'parah'>('ringan');
  const [pestCount, setPestCount] = useState<number>(10);

  useEffect(() => {
    if (activeCycle) {
      const pop = activeCycle.plantCount || 1000;
      setTotalPlants(pop);

      if (latestRecord) {
        setHealthyCount(latestRecord.healthyCount ?? (isLandPrep ? 0 : Math.round(pop * 0.96)));
        setAttentionCount(latestRecord.attentionCount ?? 0);
        setProblematicCount(latestRecord.problematicCount ?? 0);
        setDeadCount(latestRecord.deadCount ?? 0);
        setSoilPh(latestRecord.soilPh ?? 6.4);
        setSoilMoisture(latestRecord.soilMoisturePercent ?? 65);
        setAvgHeight(latestRecord.averageHeightCm ?? 35);
        setNotes(latestRecord.notes ?? '');
      } else {
        if (isLandPrep) {
          setHealthyCount(0);
          setAttentionCount(0);
          setProblematicCount(0);
          setDeadCount(0);
        } else {
          setHealthyCount(Math.round(pop * 0.96));
          setAttentionCount(Math.round(pop * 0.03));
          setProblematicCount(Math.round(pop * 0.01));
          setDeadCount(0);
        }
      }
    }
  }, [activeCycle, latestRecord, isOpen, isLandPrep]);

  if (!isOpen) return null;

  // Real-time calculated survival rate
  const survivalRate = !isLandPrep && totalPlants > 0
    ? (((totalPlants - deadCount) / totalPlants) * 100).toFixed(1)
    : '100';

  const handleApplyPresetAllHealthy = () => {
    setHealthyCount(totalPlants);
    setAttentionCount(0);
    setProblematicCount(0);
    setDeadCount(0);
  };

  const handleApplyPresetNormal = () => {
    const dead = Math.round(totalPlants * 0.01);
    const prob = Math.round(totalPlants * 0.02);
    const att = Math.round(totalPlants * 0.04);
    const healthy = Math.max(0, totalPlants - dead - prob - att);
    setHealthyCount(healthy);
    setAttentionCount(att);
    setProblematicCount(prob);
    setDeadCount(dead);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Save plant health condition to storage & monitoring record
    StorageService.saveQuickPlantHealth(activeCycle.id, {
      totalPlants: Number(totalPlants),
      healthyCount: isLandPrep ? 0 : Number(healthyCount),
      attentionCount: isLandPrep ? 0 : Number(attentionCount),
      problematicCount: isLandPrep ? 0 : Number(problematicCount),
      deadCount: isLandPrep ? 0 : Number(deadCount),
      soilPh: Number(soilPh),
      soilMoisturePercent: Number(soilMoisture),
      averageHeightCm: Number(avgHeight),
      notes: notes || (isLandPrep ? 'Pembaruan kesiapan tanah dan target bibit olah lahan.' : 'Kondisi tanaman diperbarui langsung dari Dashboard.'),
      dayOffset: currentDayOffset
    });

    // 2. If pest incident logged
    if (hasPestIncident && !isLandPrep) {
      StorageService.addPestObservation({
        cycleId: activeCycle.id,
        pestTypeId: 'pest-custom',
        pestName,
        date: new Date().toISOString().split('T')[0],
        dayOffset: currentDayOffset,
        severity: pestSeverity,
        affectedPlantsCount: Number(pestCount),
        actionTaken: 'Inspeksi visual & rekomendasi tindakan penyemprotan SOP.',
        resolved: false,
        notes: `Tercatat saat perbaruan kondisi kesehatan tanaman: ${notes}`
      });
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#e9ece6] rounded-2xl w-full max-w-xl p-5 text-slate-800 text-xs shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLandPrep ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {isLandPrep ? 'Ubah Rencana Bibit & Kondisi Olah Lahan' : 'Ubah Kondisi & Nilai Kartu Dashboard'}
              </h3>
              <p className="text-[11px] text-gray-500">
                Siklus: {activeCycle.cropTypeName} ({activeCycle.varietyName}) — Lahan {activeCycle.fieldName}
              </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Notice for Land Prep */}
          {isLandPrep ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span>🌱</span> Fase Pengolahan Lahan (Pra-Tanam / H{currentDayOffset})
              </div>
              <p className="text-[11px] text-amber-800">
                Tanaman belum ditanam di bedengan lahan. Anda dapat mengatur <strong>Target Rencana Populasi Bibit</strong>, <strong>pH Tanah Awal</strong>, dan <strong>Kelembaban Tanah</strong>. Metrik kondisi tanaman sehat/sakit akan aktif otomatis pada hari penanaman (H-0).
              </p>
            </div>
          ) : (
            /* Quick Presets for Post Planting */
            <div className="flex items-center justify-between gap-2 bg-[#f9faf8] p-2.5 rounded-xl border border-[#e9ece6]">
              <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Template Cepat:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleApplyPresetAllHealthy}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  100% Sehat Semua
                </button>
                <button
                  type="button"
                  onClick={handleApplyPresetNormal}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 border border-[#e1e5db] rounded-lg text-[10px] font-medium cursor-pointer transition-colors"
                >
                  Distribusi Normal (93% Sehat)
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Total Population & Survival */}
          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                {isLandPrep ? '1. Target Rencana Populasi Bibit Tanam' : '1. Populasi Tanaman & Kelangsungan Hidup (Survival)'}
              </span>
              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                {isLandPrep ? 'Target Rencana' : `Survival: ${survivalRate}%`}
              </span>
            </div>

            <div className={`grid ${isLandPrep ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              <div>
                <label className="block text-gray-700 mb-1 font-semibold">
                  {isLandPrep ? 'Jumlah Bibit yang Direncanakan (Pohon)' : 'Total Populasi Awal (Pohon)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalPlants}
                  onChange={e => setTotalPlants(Number(e.target.value))}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-sm"
                  required
                />
              </div>

              {!isLandPrep && (
                <div>
                  <label className="block text-gray-700 mb-1 font-semibold">
                    Tanaman Mati / Sulam (Pohon)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deadCount}
                    onChange={e => setDeadCount(Number(e.target.value))}
                    className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 text-red-700 font-mono font-bold text-sm"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Health Breakdown (Only active post-planting) */}
          {!isLandPrep && (
            <div className="p-3.5 bg-[#fbfcfb] rounded-xl border border-[#e9ece6] space-y-3">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                2. Rincian Kondisi Kesehatan Tanaman Saat Ini
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-emerald-800 mb-1 font-bold text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Tanaman Sehat
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={healthyCount}
                    onChange={e => setHealthyCount(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-2 text-emerald-700 font-mono font-bold text-sm text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-800 mb-1 font-bold text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Butuh Perhatian
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attentionCount}
                    onChange={e => setAttentionCount(Number(e.target.value))}
                    className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-2 text-amber-700 font-mono font-bold text-sm text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-red-800 mb-1 font-bold text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Sakit / Bermasalah
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={problematicCount}
                    onChange={e => setProblematicCount(Number(e.target.value))}
                    className="w-full bg-white border border-red-300 rounded-xl px-2.5 py-2 text-red-700 font-mono font-bold text-sm text-center"
                    required
                  />
                </div>
              </div>

              <div className="text-[11px] text-gray-500 flex justify-between px-1">
                <span>Total Terdata: <strong className="text-slate-800">{(Number(healthyCount) + Number(attentionCount) + Number(problematicCount) + Number(deadCount)).toLocaleString('id-ID')}</strong> pohon</span>
                <span>Persentase Sehat: <strong className="text-emerald-700">{totalPlants > 0 ? Math.round((healthyCount / totalPlants) * 100) : 100}%</strong></span>
              </div>
            </div>
          )}

          {/* Section 3: Pest & Disease Incident Checkbox (Only post planting) */}
          {!isLandPrep && (
            <div className="p-3.5 bg-red-50/40 rounded-xl border border-red-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-red-900">
                  <input
                    type="checkbox"
                    checked={hasPestIncident}
                    onChange={e => setHasPestIncident(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <Bug className="w-4 h-4 text-red-600" />
                  Catat Kasus Serangan Hama / Penyakit Baru
                </label>
              </div>

              {hasPestIncident && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1 font-semibold">Nama Hama / Gejala</label>
                    <select
                      value={pestName}
                      onChange={e => setPestName(e.target.value)}
                      className="w-full bg-white border border-red-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="Kutu Kebul (Bemisia tabaci)">Kutu Kebul (Bemisia tabaci)</option>
                      <option value="Thrips (Thrips parvispinus)">Thrips (Thrips parvispinus)</option>
                      <option value="Ulat Grayak (Spodoptera)">Ulat Grayak (Spodoptera)</option>
                      <option value="Lalat Buah (Bactrocera)">Lalat Buah (Bactrocera)</option>
                      <option value="Antraknosa (Colletotrichum)">Antraknosa / Patek (Jamur)</option>
                      <option value="Layu Bakteri (Ralstonia)">Layu Bakteri</option>
                      <option value="Layu Fusarium (Fusarium)">Layu Fusarium</option>
                      <option value="Virus Kuning / Gemini">Virus Kuning (Gemini)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1 font-semibold">Tingkat Keparahan</label>
                    <select
                      value={pestSeverity}
                      onChange={e => setPestSeverity(e.target.value as any)}
                      className="w-full bg-white border border-red-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="ringan">Ringan (Terkendali)</option>
                      <option value="sedang">Sedang (Perlu Semprot)</option>
                      <option value="parah">Parah (Karantina)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-700 mb-1 font-semibold">Jumlah Tanaman Terdampak</label>
                    <input
                      type="number"
                      min="1"
                      value={pestCount}
                      onChange={e => setPestCount(Number(e.target.value))}
                      className="w-full bg-white border border-red-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono text-center font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Soil & Growth Parameters */}
          <div className="p-3.5 bg-[#f9faf8] rounded-xl border border-[#e9ece6] space-y-3">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-teal-600" />
              3. Parameter Agronomi & Pertumbuhan
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-gray-600 mb-1 text-[11px] font-medium">pH Tanah</label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="10"
                  value={soilPh}
                  onChange={e => setSoilPh(Number(e.target.value))}
                  className="w-full bg-white border border-[#e1e5db] rounded-xl px-2.5 py-1.5 text-slate-800 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 text-[11px] font-medium">Kelembaban (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={soilMoisture}
                  onChange={e => setSoilMoisture(Number(e.target.value))}
                  className="w-full bg-white border border-[#e1e5db] rounded-xl px-2.5 py-1.5 text-slate-800 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 text-[11px] font-medium">Tinggi Rata2 (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={avgHeight}
                  onChange={e => setAvgHeight(Number(e.target.value))}
                  className="w-full bg-white border border-[#e1e5db] rounded-xl px-2.5 py-1.5 text-slate-800 font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1 text-[11px] font-medium">Catatan Kondisi Lapangan</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Tanaman tumbuh serempak, daun hijau pekat, tidak ada gejala defisiensi boron."
                rows={2}
                className="w-full bg-white border border-[#e1e5db] rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#e9ece6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Terapkan ke Kartu Dashboard
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
