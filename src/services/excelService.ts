import * as XLSX from 'xlsx';
import { StorageService } from './storage';
import {
  CultivationCycle,
  Field,
  CropType,
  CycleTask,
  InventoryItem,
  Expense,
  Income,
  HarvestRecord,
  MonitoringRecord,
  PestType,
  DiseaseType,
  PestObservation,
  DiseaseObservation,
  SystemSettings,
  SOPTemplate,
  SOPVersion,
  SOPStage,
  SOPTask
} from '../types';

export class ExcelService {
  /**
   * Export all system data into a comprehensive multi-sheet Excel (.xlsx) file
   */
  public static exportToExcel(): void {
    const fields = StorageService.getFields();
    const crops = StorageService.getCrops();
    const cycles = StorageService.getCycles();
    const tasks = StorageService.getTasks();
    const inventory = StorageService.getInventory();
    const expenses = StorageService.getExpenses();
    const income = StorageService.getIncome();
    const harvests = StorageService.getHarvests();
    const monitoring = StorageService.getMonitoringRecords();
    const pests = StorageService.getPests();
    const diseases = StorageService.getDiseases();
    const pestObs = StorageService.getPestObservations();
    const diseaseObs = StorageService.getDiseaseObservations();
    const settings = StorageService.getSettings();
    const sops = StorageService.getSOPTemplates();

    const wb = XLSX.utils.book_new();

    // 1. Ringkasan Info Sheet
    const summaryData = [
      { Parameter: 'Nama Usaha / Kebun', Nilai: settings.farmName },
      { Parameter: 'Penanggung Jawab', Nilai: settings.ownerName || (settings as any).operatorName || '-' },
      { Parameter: 'Tanggal Ekspor', Nilai: new Date().toLocaleString('id-ID') },
      { Parameter: 'Total Siklus Budidaya', Nilai: cycles.length },
      { Parameter: 'Total Lahan / Plot', Nilai: fields.length },
      { Parameter: 'Total Master Komoditas', Nilai: crops.length },
      { Parameter: 'Total Item Inventaris', Nilai: inventory.length },
      { Parameter: 'Total Katalog Hama & Penyakit', Nilai: pests.length + diseases.length },
      { Parameter: 'Total Catatan Panen', Nilai: harvests.length },
      { Parameter: 'Total Pengeluaran Dicatat', Nilai: expenses.length },
      { Parameter: 'Total Pemasukan Dicatat', Nilai: income.length }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Info');

    // 2. Siklus Budidaya Sheet
    const cyclesData = cycles.map(c => ({
      'ID Siklus': c.id,
      'Kode Siklus': c.cycleCode,
      'Status': c.status.toUpperCase(),
      'Nama Lahan': c.fieldName,
      'Komoditas': c.cropTypeName,
      'Ikon': c.cropIcon,
      'Varietas': c.varietyName,
      'Populasi (Pohon)': c.plantCount,
      'Tanggal Tanam / Mulai': c.startDate,
      'Estimasi Panen': c.estimatedHarvestDate || (c as any).expectedHarvestDate || '-',
      'Realisasi Panen': c.actualHarvestDate || '-',
      'Versi SOP': c.sopSnapshot?.versionNumber || 'V1.0',
      'Template SOP': c.sopSnapshot?.templateName || c.cropTypeName,
      'Catatan': c.notes || '-'
    }));
    const wsCycles = XLSX.utils.json_to_sheet(cyclesData.length > 0 ? cyclesData : [{ 'Info': 'Tidak ada data siklus' }]);
    XLSX.utils.book_append_sheet(wb, wsCycles, 'Siklus_Budidaya');

    // 3. Lahan dan Plot Sheet
    const fieldsData = fields.map(f => ({
      'ID Lahan': f.id,
      'Nama Lahan': f.name,
      'Lokasi': f.location,
      'Luas (m2)': f.areaM2,
      'Jenis Tanah': f.soilType,
      'Sumber Air': f.waterSource,
      'Status': (f as any).status === 'active_cultivation' ? 'DITANAMI' : 'TERSEDIA',
      'Keterangan': f.notes || (f as any).locationDescription || '-'
    }));
    const wsFields = XLSX.utils.json_to_sheet(fieldsData.length > 0 ? fieldsData : [{ 'Info': 'Tidak ada data lahan' }]);
    XLSX.utils.book_append_sheet(wb, wsFields, 'Lahan_dan_Plot');

    // 4. Master Komoditas Sheet
    const cropsData = crops.map(c => ({
      'ID Komoditas': c.id,
      'Nama Komoditas': c.name,
      'Ikon Emoji': c.icon,
      'Kategori': c.category,
      'Status Aktif': c.isActive !== false ? 'AKTIF' : 'NON-AKTIF',
      'Daftar Varietas': c.varieties?.map(v => v.name).join(', ') || '-'
    }));
    const wsCrops = XLSX.utils.json_to_sheet(cropsData.length > 0 ? cropsData : [{ 'Info': 'Tidak ada data komoditas' }]);
    XLSX.utils.book_append_sheet(wb, wsCrops, 'Master_Komoditas');

    // 5. Varietas Detail
    const varietiesData: any[] = [];
    crops.forEach(c => {
      c.varieties?.forEach(v => {
        varietiesData.push({
          'ID Varietas': v.id,
          'ID Komoditas': c.id,
          'Nama Komoditas': c.name,
          'Nama Varietas': v.name,
          'Produsen Benih': v.seedProducer || '-',
          'Umur Panen (Hari)': v.averageMaturityDays,
          'Est. Hasil Per Pohon (kg)': v.estimatedYieldPerPlantKg,
          'Catatan': v.notes || '-'
        });
      });
    });
    const wsVarieties = XLSX.utils.json_to_sheet(varietiesData.length > 0 ? varietiesData : [{ 'Info': 'Tidak ada varietas' }]);
    XLSX.utils.book_append_sheet(wb, wsVarieties, 'Detail_Varietas');

    // 6. Katalog Hama (Pests & SOP)
    const pestCatalogData = pests.map(p => ({
      'ID Hama': p.id,
      'Nama Hama': p.name,
      'Nama Ilmiah': p.scientificName || '-',
      'Komoditas Sasaran': p.targetCrops.join(', '),
      'Gejala Serangan': p.symptoms,
      'Rekomendasi Penanganan': p.recommendedTreatment,
      'Tahapan SOP Penanganan': p.treatmentSteps?.map(s => `[Langkah ${s.stepNumber}: ${s.actionType.toUpperCase()}] ${s.treatmentName} (Obat/Bahan: ${s.recommendedProduct || '-'}, Dosis: ${s.dosage || '-'}, Interval: ${s.applicationInterval || '-'})`).join(' | ') || '-'
    }));
    const wsPests = XLSX.utils.json_to_sheet(pestCatalogData.length > 0 ? pestCatalogData : [{ 'Info': 'Tidak ada data hama' }]);
    XLSX.utils.book_append_sheet(wb, wsPests, 'Katalog_Hama');

    // 7. Katalog Penyakit (Diseases & SOP)
    const diseaseCatalogData = diseases.map(d => ({
      'ID Penyakit': d.id,
      'Nama Penyakit': d.name,
      'Jenis Patogen': d.pathogenType.toUpperCase(),
      'Komoditas Sasaran': d.targetCrops.join(', '),
      'Gejala Serangan': d.symptoms,
      'Rekomendasi Penanganan': d.recommendedTreatment,
      'Tahapan SOP Penanganan': d.treatmentSteps?.map(s => `[Langkah ${s.stepNumber}: ${s.actionType.toUpperCase()}] ${s.treatmentName} (Obat/Bahan: ${s.recommendedProduct || '-'}, Dosis: ${s.dosage || '-'}, Interval: ${s.applicationInterval || '-'})`).join(' | ') || '-'
    }));
    const wsDiseases = XLSX.utils.json_to_sheet(diseaseCatalogData.length > 0 ? diseaseCatalogData : [{ 'Info': 'Tidak ada data penyakit' }]);
    XLSX.utils.book_append_sheet(wb, wsDiseases, 'Katalog_Penyakit');

    // 8. Riwayat Temuan Hama (Pest Observations)
    const pestObsData = pestObs.map(po => {
      const cycle = cycles.find(c => c.id === po.cycleId);
      return {
        'ID Temuan': po.id,
        'Kode Siklus': cycle?.cycleCode || po.cycleId,
        'Lahan / Komoditas': cycle ? `${cycle.fieldName} (${cycle.cropTypeName})` : '-',
        'Tanggal': po.date,
        'Hari Ke (H+)': po.dayOffset,
        'Nama Hama': po.pestName,
        'Tingkat Keparahan': po.severity.toUpperCase(),
        'Tanaman Terdampak': po.affectedPlantsCount,
        'Tindakan Pengendalian (SOP)': po.actionTaken || '-',
        'Status Selesai': po.resolved ? 'SELESAI / TERKENDALI' : 'MASIH AKTIF',
        'Catatan Lapangan': po.notes || '-'
      };
    });
    const wsPestObs = XLSX.utils.json_to_sheet(pestObsData.length > 0 ? pestObsData : [{ 'Info': 'Tidak ada temuan hama' }]);
    XLSX.utils.book_append_sheet(wb, wsPestObs, 'Temuan_Hama_OPT');

    // 9. Riwayat Temuan Penyakit (Disease Observations)
    const diseaseObsData = diseaseObs.map(do_ => {
      const cycle = cycles.find(c => c.id === do_.cycleId);
      return {
        'ID Temuan': do_.id,
        'Kode Siklus': cycle?.cycleCode || do_.cycleId,
        'Lahan / Komoditas': cycle ? `${cycle.fieldName} (${cycle.cropTypeName})` : '-',
        'Tanggal': do_.date,
        'Hari Ke (H+)': do_.dayOffset,
        'Nama Penyakit': do_.diseaseName,
        'Tingkat Keparahan': do_.severity.toUpperCase(),
        'Tanaman Terdampak': do_.affectedPlantsCount,
        'Tindakan Pengendalian (SOP)': do_.actionTaken || '-',
        'Status Selesai': do_.resolved ? 'SELESAI / TERKENDALI' : 'MASIH AKTIF',
        'Catatan Lapangan': do_.notes || '-'
      };
    });
    const wsDiseaseObs = XLSX.utils.json_to_sheet(diseaseObsData.length > 0 ? diseaseObsData : [{ 'Info': 'Tidak ada temuan penyakit' }]);
    XLSX.utils.book_append_sheet(wb, wsDiseaseObs, 'Temuan_Penyakit_OPT');

    // 10. Inventaris Sheet
    const inventoryData = inventory.map(i => ({
      'ID Item': i.id,
      'Nama Barang': i.name,
      'Kategori': i.category.toUpperCase(),
      'Satuan': i.unit,
      'Stok Saat Ini': i.currentStock,
      'Batas Minimum Stok': i.minStockAlert,
      'Harga Satuan (Rp)': i.unitPrice,
      'Total Nilai Stok (Rp)': i.currentStock * i.unitPrice,
      'Merk / Brand': i.brand || '-',
      'Bahan Aktif': i.activeIngredients || '-',
      'Lokasi Penyimpanan': i.storageLocation || '-',
      'Status': i.isActive ? 'AKTIF' : 'NON-AKTIF'
    }));
    const wsInventory = XLSX.utils.json_to_sheet(inventoryData.length > 0 ? inventoryData : [{ 'Info': 'Tidak ada inventaris' }]);
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventaris');

    // 11. Pengeluaran Keuangan Sheet
    const expenseData = expenses.map(e => ({
      'ID Pengeluaran': e.id,
      'Tanggal': e.date,
      'Kategori': e.category.toUpperCase(),
      'Deskripsi Biaya': e.description,
      'Nominal (Rp)': e.amount,
      'ID Siklus Terkait': e.cycleId || '-',
      'Catatan': e.notes || '-'
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expenseData.length > 0 ? expenseData : [{ 'Info': 'Tidak ada pengeluaran' }]);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Keuangan_Pengeluaran');

    // 12. Pemasukan Keuangan Sheet
    const incomeData = income.map(inc => ({
      'ID Pemasukan': inc.id,
      'Tanggal': inc.date,
      'Sumber Pemasukan': inc.source.toUpperCase(),
      'Deskripsi': inc.description,
      'Nominal (Rp)': inc.amount,
      'Pembeli / Vendor': inc.buyerName || '-',
      'Status Pembayaran': inc.paymentStatus === 'paid' ? 'LUNAS' : 'PENDING',
      'ID Siklus Terkait': inc.cycleId || '-',
      'Catatan': inc.notes || '-'
    }));
    const wsIncome = XLSX.utils.json_to_sheet(incomeData.length > 0 ? incomeData : [{ 'Info': 'Tidak ada pemasukan' }]);
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Keuangan_Pemasukan');

    // 13. Hasil Panen Sheet
    const harvestData = harvests.map(h => ({
      'ID Panen': h.id,
      'Tanggal Panen': h.date,
      'Kode Siklus': h.cycleCode || '-',
      'Komoditas': h.cropName,
      'Varietas': h.varietyName,
      'Hari Ke (H+)': h.dayOffset,
      'Total Bobot (kg)': h.totalWeightKg,
      'Total Penjualan (Rp)': h.totalSalesAmount,
      'Pembeli / Pasar': h.buyerName || '-',
      'Catatan Kualitas': h.qualityNotes || '-'
    }));
    const wsHarvests = XLSX.utils.json_to_sheet(harvestData.length > 0 ? harvestData : [{ 'Info': 'Tidak ada data panen' }]);
    XLSX.utils.book_append_sheet(wb, wsHarvests, 'Hasil_Panen');

    // 14. Monitoring Harian Sheet
    const monData = monitoring.map(m => ({
      'ID Log': m.id,
      'ID Siklus': m.cycleId,
      'Tanggal': m.date,
      'Hari Ke (H+)': m.dayOffset,
      'Tanaman Diperiksa': m.plantsInspected,
      'Sehat': m.healthyCount,
      'Perlu Perhatian': m.attentionCount,
      'Bermasalah': m.problematicCount,
      'Mati': m.deadCount,
      'Terserang Hama': m.pestAffectedCount,
      'Terserang Penyakit': m.diseaseAffectedCount,
      'Kelembaban Tanah (%)': m.soilMoisturePercent || '-',
      'pH Tanah': m.soilPh || '-',
      'Suhu (°C)': m.temperatureCelsius || '-',
      'Catatan': m.notes || '-'
    }));
    const wsMonitoring = XLSX.utils.json_to_sheet(monData.length > 0 ? monData : [{ 'Info': 'Tidak ada monitoring' }]);
    XLSX.utils.book_append_sheet(wb, wsMonitoring, 'Monitoring_Harian');

    // 15. Tugas SOP Siklus
    const taskData = tasks.map(t => ({
      'ID Tugas': t.id,
      'ID Siklus': t.cycleId,
      'Fase SOP': t.stageName,
      'Nama Tugas': t.taskName,
      'Tipe': t.taskType,
      'Jadwal Hari (H+)': t.dayOffset,
      'Tanggal Terjadwal': t.scheduledDate,
      'Prioritas': t.priority.toUpperCase(),
      'Status': t.status.toUpperCase(),
      'Waktu Selesai': t.completedAt || '-',
      'Deskripsi': t.description || '-'
    }));
    const wsTasks = XLSX.utils.json_to_sheet(taskData.length > 0 ? taskData : [{ 'Info': 'Tidak ada tugas' }]);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Tugas_SOP');

    // 16. Complete System Payload for 100% Full Restore
    const fullBackupJSON = StorageService.exportAllData();
    const chunkSize = 30000;
    const chunksCount = Math.ceil(fullBackupJSON.length / chunkSize);
    const rawData = [];
    for (let i = 0; i < chunksCount; i++) {
      rawData.push({
        'Chunk_Index': i,
        'Payload_Chunk': fullBackupJSON.substring(i * chunkSize, (i + 1) * chunkSize)
      });
    }
    const wsRaw = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, wsRaw, '_SYSTEM_BACKUP_');

    // Generate Excel File & Trigger Browser Download
    const fileName = `NAVAFARM_Database_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Dedicated export for Pest & Disease Catalog and Observations
   */
  public static exportOPTToExcel(): void {
    const pests = StorageService.getPests();
    const diseases = StorageService.getDiseases();
    const pestObs = StorageService.getPestObservations();
    const diseaseObs = StorageService.getDiseaseObservations();
    const cycles = StorageService.getCycles();

    const wb = XLSX.utils.book_new();

    // 1. Katalog Hama Sheet
    const pestCatalogData = pests.map(p => ({
      'ID Hama': p.id,
      'Nama Hama': p.name,
      'Nama Ilmiah': p.scientificName || '-',
      'Komoditas Sasaran': p.targetCrops.join(', '),
      'Gejala Serangan': p.symptoms,
      'Rekomendasi Penanganan': p.recommendedTreatment,
      'Tahapan SOP Penanganan': p.treatmentSteps?.map(s => `[Langkah ${s.stepNumber}: ${s.actionType.toUpperCase()}] ${s.treatmentName} (Obat: ${s.recommendedProduct || '-'}, Dosis: ${s.dosage || '-'}, Interval: ${s.applicationInterval || '-'})`).join(' | ') || '-'
    }));
    const wsPests = XLSX.utils.json_to_sheet(pestCatalogData.length > 0 ? pestCatalogData : [{ 'Info': 'Tidak ada data hama' }]);
    XLSX.utils.book_append_sheet(wb, wsPests, 'Katalog_Hama');

    // 2. Katalog Penyakit Sheet
    const diseaseCatalogData = diseases.map(d => ({
      'ID Penyakit': d.id,
      'Nama Penyakit': d.name,
      'Jenis Patogen': d.pathogenType.toUpperCase(),
      'Komoditas Sasaran': d.targetCrops.join(', '),
      'Gejala Serangan': d.symptoms,
      'Rekomendasi Penanganan': d.recommendedTreatment,
      'Tahapan SOP Penanganan': d.treatmentSteps?.map(s => `[Langkah ${s.stepNumber}: ${s.actionType.toUpperCase()}] ${s.treatmentName} (Obat: ${s.recommendedProduct || '-'}, Dosis: ${s.dosage || '-'}, Interval: ${s.applicationInterval || '-'})`).join(' | ') || '-'
    }));
    const wsDiseases = XLSX.utils.json_to_sheet(diseaseCatalogData.length > 0 ? diseaseCatalogData : [{ 'Info': 'Tidak ada data penyakit' }]);
    XLSX.utils.book_append_sheet(wb, wsDiseases, 'Katalog_Penyakit');

    // 3. Detail Tahapan SOP Spray & Kocor Sheet
    const allSOPSteps: any[] = [];
    pests.forEach(p => {
      p.treatmentSteps?.forEach(s => {
        allSOPSteps.push({
          'Tipe OPT': 'HAMA',
          'ID OPT': p.id,
          'Nama OPT': p.name,
          'Nomor Langkah': s.stepNumber,
          'Fase / Nama Tahap': s.stageName,
          'Metode Aksi': s.actionType.toUpperCase(),
          'Nama Tindakan / SOP': s.treatmentName,
          'Produk / Merk Obat': s.recommendedProduct || '-',
          'Bahan Aktif': s.activeIngredient || '-',
          'Dosis Rekomendasi': s.dosage || '-',
          'Interval Aplikasi': s.applicationInterval || '-',
          'Catatan Waktu & Aplikasi': s.timingNotes || '-'
        });
      });
    });
    diseases.forEach(d => {
      d.treatmentSteps?.forEach(s => {
        allSOPSteps.push({
          'Tipe OPT': 'PENYAKIT',
          'ID OPT': d.id,
          'Nama OPT': d.name,
          'Nomor Langkah': s.stepNumber,
          'Fase / Nama Tahap': s.stageName,
          'Metode Aksi': s.actionType.toUpperCase(),
          'Nama Tindakan / SOP': s.treatmentName,
          'Produk / Merk Obat': s.recommendedProduct || '-',
          'Bahan Aktif': s.activeIngredient || '-',
          'Dosis Rekomendasi': s.dosage || '-',
          'Interval Aplikasi': s.applicationInterval || '-',
          'Catatan Waktu & Aplikasi': s.timingNotes || '-'
        });
      });
    });
    const wsSteps = XLSX.utils.json_to_sheet(allSOPSteps.length > 0 ? allSOPSteps : [{ 'Info': 'Belum ada tahapan SOP rinci' }]);
    XLSX.utils.book_append_sheet(wb, wsSteps, 'Tahapan_SOP_Spray_Kocor');

    // 4. Riwayat Temuan Hama
    const pestObsData = pestObs.map(po => {
      const cycle = cycles.find(c => c.id === po.cycleId);
      return {
        'ID Temuan': po.id,
        'ID Siklus': po.cycleId,
        'Kode Siklus': cycle?.cycleCode || po.cycleId,
        'Lahan / Plot': cycle?.fieldName || '-',
        'Komoditas': cycle?.cropTypeName || '-',
        'Tanggal': po.date,
        'Hari Ke (H+)': po.dayOffset,
        'Nama Hama': po.pestName,
        'Tingkat Keparahan': po.severity.toUpperCase(),
        'Tanaman Terdampak': po.affectedPlantsCount,
        'Tindakan Pengendalian (SOP)': po.actionTaken || '-',
        'Status': po.resolved ? 'TERKENDALI' : 'AKTIF',
        'Catatan Lapangan': po.notes || '-'
      };
    });
    const wsPestObs = XLSX.utils.json_to_sheet(pestObsData.length > 0 ? pestObsData : [{ 'Info': 'Tidak ada temuan hama' }]);
    XLSX.utils.book_append_sheet(wb, wsPestObs, 'Riwayat_Temuan_Hama');

    // 5. Riwayat Temuan Penyakit
    const diseaseObsData = diseaseObs.map(do_ => {
      const cycle = cycles.find(c => c.id === do_.cycleId);
      return {
        'ID Temuan': do_.id,
        'ID Siklus': do_.cycleId,
        'Kode Siklus': cycle?.cycleCode || do_.cycleId,
        'Lahan / Plot': cycle?.fieldName || '-',
        'Komoditas': cycle?.cropTypeName || '-',
        'Tanggal': do_.date,
        'Hari Ke (H+)': do_.dayOffset,
        'Nama Penyakit': do_.diseaseName,
        'Tingkat Keparahan': do_.severity.toUpperCase(),
        'Tanaman Terdampak': do_.affectedPlantsCount,
        'Tindakan Pengendalian (SOP)': do_.actionTaken || '-',
        'Status': do_.resolved ? 'TERKENDALI' : 'AKTIF',
        'Catatan Lapangan': do_.notes || '-'
      };
    });
    const wsDiseaseObs = XLSX.utils.json_to_sheet(diseaseObsData.length > 0 ? diseaseObsData : [{ 'Info': 'Tidak ada temuan penyakit' }]);
    XLSX.utils.book_append_sheet(wb, wsDiseaseObs, 'Riwayat_Temuan_Penyakit');

    // Raw payload backup for OPT
    const optPayload = JSON.stringify({ pests, diseases, pestObservations: pestObs, diseaseObservations: diseaseObs });
    const wsRaw = XLSX.utils.json_to_sheet([{ Payload: optPayload }]);
    XLSX.utils.book_append_sheet(wb, wsRaw, '_OPT_BACKUP_');

    const fileName = `NAVAFARM_Katalog_OPT_SOP_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Import system data from an uploaded Excel (.xlsx/.xls) file
   */
  public static async importFromExcel(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // 1. Try to restore from _SYSTEM_BACKUP_ sheet if present
          if (workbook.Sheets['_SYSTEM_BACKUP_']) {
            const rawSheet = workbook.Sheets['_SYSTEM_BACKUP_'];
            const rawRows: any[] = XLSX.utils.sheet_to_json(rawSheet);
            if (rawRows && rawRows.length > 0) {
              // Reassemble chunks
              rawRows.sort((a, b) => (Number(a.Chunk_Index) || 0) - (Number(b.Chunk_Index) || 0));
              const fullJson = rawRows.map(r => r.Payload_Chunk || '').join('');
              const result = StorageService.importAllData(fullJson);
              if (result.success) {
                return resolve({
                  success: true,
                  message: 'Data seluruh modul NAVAFARM berhasil dipulihkan secara lengkap dari file Excel!'
                });
              }
            }
          }

          // 2. Try _OPT_BACKUP_ sheet if present
          if (workbook.Sheets['_OPT_BACKUP_']) {
            const rawSheet = workbook.Sheets['_OPT_BACKUP_'];
            const rawRows: any[] = XLSX.utils.sheet_to_json(rawSheet);
            if (rawRows && rawRows.length > 0 && rawRows[0].Payload) {
              const optData = JSON.parse(rawRows[0].Payload);
              if (optData.pests) localStorage.setItem('agrisop_pests', JSON.stringify(optData.pests));
              if (optData.diseases) localStorage.setItem('agrisop_diseases', JSON.stringify(optData.diseases));
              if (optData.pestObservations) localStorage.setItem('agrisop_pest_obs', JSON.stringify(optData.pestObservations));
              if (optData.diseaseObservations) localStorage.setItem('agrisop_disease_obs', JSON.stringify(optData.diseaseObservations));
              return resolve({
                success: true,
                message: 'Data Katalog Hama & Penyakit serta SOP berhasil dipulihkan dari file Excel!'
              });
            }
          }

          // 3. Fallback: Parse from individual sheets
          let restoredItemsCount = 0;

          // Parse Katalog Hama
          if (workbook.Sheets['Katalog_Hama']) {
            const pestRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Katalog_Hama']);
            const currentPests = StorageService.getPests();
            pestRows.forEach((r, idx) => {
              if (r['Nama Hama']) {
                const targetCropsStr = String(r['Komoditas Sasaran'] || 'Cabai, Tomat');
                const targetCrops = targetCropsStr.split(',').map(s => s.trim()).filter(Boolean);
                const pest: PestType = {
                  id: r['ID Hama'] || `pest-imp-${Date.now()}-${idx}`,
                  name: String(r['Nama Hama']),
                  scientificName: r['Nama Ilmiah'] !== '-' ? String(r['Nama Ilmiah']) : undefined,
                  targetCrops,
                  symptoms: String(r['Gejala Serangan'] || ''),
                  recommendedTreatment: String(r['Rekomendasi Penanganan'] || '')
                };
                const existingIdx = currentPests.findIndex(p => p.id === pest.id || p.name.toLowerCase() === pest.name.toLowerCase());
                if (existingIdx >= 0) currentPests[existingIdx] = { ...currentPests[existingIdx], ...pest };
                else currentPests.push(pest);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_pests', JSON.stringify(currentPests));
          }

          // Parse Katalog Penyakit
          if (workbook.Sheets['Katalog_Penyakit']) {
            const diseaseRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Katalog_Penyakit']);
            const currentDiseases = StorageService.getDiseases();
            diseaseRows.forEach((r, idx) => {
              if (r['Nama Penyakit']) {
                const targetCropsStr = String(r['Komoditas Sasaran'] || 'Cabai, Tomat');
                const targetCrops = targetCropsStr.split(',').map(s => s.trim()).filter(Boolean);
                const pathogenTypeRaw = String(r['Jenis Patogen'] || 'fungus').toLowerCase();
                let pathogenType: 'fungus' | 'bacteria' | 'virus' | 'nematode' | 'nutrient_deficiency' = 'fungus';
                if (['fungus', 'bacteria', 'virus', 'nematode', 'nutrient_deficiency'].includes(pathogenTypeRaw)) {
                  pathogenType = pathogenTypeRaw as any;
                }
                const disease: DiseaseType = {
                  id: r['ID Penyakit'] || `dis-imp-${Date.now()}-${idx}`,
                  name: String(r['Nama Penyakit']),
                  pathogenType,
                  targetCrops,
                  symptoms: String(r['Gejala Serangan'] || ''),
                  recommendedTreatment: String(r['Rekomendasi Penanganan'] || '')
                };
                const existingIdx = currentDiseases.findIndex(d => d.id === disease.id || d.name.toLowerCase() === disease.name.toLowerCase());
                if (existingIdx >= 0) currentDiseases[existingIdx] = { ...currentDiseases[existingIdx], ...disease };
                else currentDiseases.push(disease);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_diseases', JSON.stringify(currentDiseases));
          }

          // Parse Temuan Hama
          const pestObsSheet = workbook.Sheets['Temuan_Hama_OPT'] || workbook.Sheets['Riwayat_Temuan_Hama'];
          if (pestObsSheet) {
            const obsRows: any[] = XLSX.utils.sheet_to_json(pestObsSheet);
            const currentObs = StorageService.getPestObservations();
            obsRows.forEach((r, idx) => {
              if (r['Nama Hama']) {
                const sev = String(r['Tingkat Keparahan'] || 'ringan').toLowerCase();
                const obs: PestObservation = {
                  id: r['ID Temuan'] || `pobs-imp-${Date.now()}-${idx}`,
                  cycleId: String(r['ID Siklus'] || r['Kode Siklus'] || 'cycle-01'),
                  pestTypeId: 'pest-01',
                  pestName: String(r['Nama Hama']),
                  date: String(r['Tanggal'] || new Date().toISOString().split('T')[0]),
                  dayOffset: Number(r['Hari Ke (H+)']) || 1,
                  severity: (['ringan', 'sedang', 'parah'].includes(sev) ? sev : 'ringan') as any,
                  affectedPlantsCount: Number(r['Tanaman Terdampak']) || 1,
                  actionTaken: String(r['Tindakan Pengendalian (SOP)'] || ''),
                  resolved: String(r['Status Selesai'] || r['Status']).toUpperCase().includes('SELESAI') || String(r['Status Selesai'] || r['Status']).toUpperCase().includes('TERKENDALI'),
                  notes: String(r['Catatan Lapangan'] || '')
                };
                currentObs.push(obs);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_pest_obs', JSON.stringify(currentObs));
          }

          // Parse Temuan Penyakit
          const diseaseObsSheet = workbook.Sheets['Temuan_Penyakit_OPT'] || workbook.Sheets['Riwayat_Temuan_Penyakit'];
          if (diseaseObsSheet) {
            const obsRows: any[] = XLSX.utils.sheet_to_json(diseaseObsSheet);
            const currentObs = StorageService.getDiseaseObservations();
            obsRows.forEach((r, idx) => {
              if (r['Nama Penyakit']) {
                const sev = String(r['Tingkat Keparahan'] || 'ringan').toLowerCase();
                const obs: DiseaseObservation = {
                  id: r['ID Temuan'] || `dobs-imp-${Date.now()}-${idx}`,
                  cycleId: String(r['ID Siklus'] || r['Kode Siklus'] || 'cycle-01'),
                  diseaseTypeId: 'dis-01',
                  diseaseName: String(r['Nama Penyakit']),
                  date: String(r['Tanggal'] || new Date().toISOString().split('T')[0]),
                  dayOffset: Number(r['Hari Ke (H+)']) || 1,
                  severity: (['ringan', 'sedang', 'parah'].includes(sev) ? sev : 'ringan') as any,
                  affectedPlantsCount: Number(r['Tanaman Terdampak']) || 1,
                  actionTaken: String(r['Tindakan Pengendalian (SOP)'] || ''),
                  resolved: String(r['Status Selesai'] || r['Status']).toUpperCase().includes('SELESAI') || String(r['Status Selesai'] || r['Status']).toUpperCase().includes('TERKENDALI'),
                  notes: String(r['Catatan Lapangan'] || '')
                };
                currentObs.push(obs);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_disease_obs', JSON.stringify(currentObs));
          }

          // Parse Lahan
          if (workbook.Sheets['Lahan_dan_Plot']) {
            const fieldRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Lahan_dan_Plot']);
            const currentFields = StorageService.getFields();
            fieldRows.forEach((r, idx) => {
              if (r['Nama Lahan']) {
                const fld: Field = {
                  id: r['ID Lahan'] || `fld-imp-${Date.now()}-${idx}`,
                  name: String(r['Nama Lahan']),
                  location: String(r['Lokasi'] || 'Blok Kebun'),
                  areaM2: Number(r['Luas (m2)']) || 1000,
                  soilType: String(r['Jenis Tanah'] || 'Lempung Berpasir'),
                  waterSource: String(r['Sumber Air'] || 'Irigasi'),
                  notes: String(r['Keterangan'] || ''),
                  createdAt: new Date().toISOString().split('T')[0]
                };
                const existingIdx = currentFields.findIndex(cf => cf.id === fld.id || cf.name === fld.name);
                if (existingIdx >= 0) currentFields[existingIdx] = fld;
                else currentFields.push(fld);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_fields', JSON.stringify(currentFields));
          }

          // Parse Master Komoditas
          if (workbook.Sheets['Master_Komoditas']) {
            const cropRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Master_Komoditas']);
            const currentCrops = StorageService.getCrops();
            cropRows.forEach((r, idx) => {
              if (r['Nama Komoditas']) {
                const varListStr = String(r['Daftar Varietas'] || '');
                const varNames = varListStr.split(',').map(s => s.trim()).filter(Boolean);
                const cropId = r['ID Komoditas'] || `crop-imp-${Date.now()}-${idx}`;

                const crop: CropType = {
                  id: cropId,
                  name: String(r['Nama Komoditas']),
                  icon: String(r['Ikon Emoji'] || '🌿'),
                  category: String(r['Kategori'] || 'vegetable'),
                  isActive: String(r['Status Aktif']).toUpperCase() !== 'NON-AKTIF',
                  varieties: varNames.map((vname, vidx) => ({
                    id: `var-${cropId}-${vidx}`,
                    cropTypeId: cropId,
                    name: vname,
                    averageMaturityDays: 60,
                    estimatedYieldPerPlantKg: 1.0
                  }))
                };
                const existingIdx = currentCrops.findIndex(cc => cc.id === crop.id || cc.name === crop.name);
                if (existingIdx >= 0) currentCrops[existingIdx] = crop;
                else currentCrops.push(crop);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_crops', JSON.stringify(currentCrops));
          }

          // Parse Inventaris
          if (workbook.Sheets['Inventaris']) {
            const invRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Inventaris']);
            const currentInv = StorageService.getInventory();
            invRows.forEach((r, idx) => {
              if (r['Nama Barang']) {
                const item: InventoryItem = {
                  id: r['ID Item'] || `inv-imp-${Date.now()}-${idx}`,
                  name: String(r['Nama Barang']),
                  category: (String(r['Kategori'] || 'lainnya').toLowerCase()) as any,
                  unit: String(r['Satuan'] || 'kg'),
                  currentStock: Number(r['Stok Saat Ini']) || 0,
                  minStockAlert: Number(r['Batas Minimum Stok']) || 10,
                  unitPrice: Number(r['Harga Satuan (Rp)']) || 0,
                  brand: String(r['Merk / Brand'] || ''),
                  storageLocation: String(r['Lokasi Penyimpanan'] || ''),
                  isActive: String(r['Status']).toUpperCase() !== 'NON-AKTIF',
                  updatedAt: new Date().toISOString()
                };
                const existingIdx = currentInv.findIndex(ci => ci.id === item.id || ci.name === item.name);
                if (existingIdx >= 0) currentInv[existingIdx] = item;
                else currentInv.push(item);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_inventory', JSON.stringify(currentInv));
          }

          // Parse Pengeluaran
          if (workbook.Sheets['Keuangan_Pengeluaran']) {
            const expRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Keuangan_Pengeluaran']);
            const currentExp = StorageService.getExpenses();
            expRows.forEach((r, idx) => {
              if (r['Deskripsi Biaya']) {
                const exp: Expense = {
                  id: r['ID Pengeluaran'] || `exp-imp-${Date.now()}-${idx}`,
                  date: String(r['Tanggal'] || new Date().toISOString().split('T')[0]),
                  category: (String(r['Kategori'] || 'lainnya').toLowerCase()) as any,
                  description: String(r['Deskripsi Biaya']),
                  amount: Number(r['Nominal (Rp)']) || 0,
                  cycleId: r['ID Siklus Terkait'] !== '-' ? r['ID Siklus Terkait'] : undefined,
                  notes: String(r['Catatan'] || ''),
                  createdAt: new Date().toISOString()
                };
                currentExp.push(exp);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_expenses', JSON.stringify(currentExp));
          }

          // Parse Pemasukan
          if (workbook.Sheets['Keuangan_Pemasukan']) {
            const incRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Keuangan_Pemasukan']);
            const currentInc = StorageService.getIncome();
            incRows.forEach((r, idx) => {
              if (r['Deskripsi']) {
                const inc: Income = {
                  id: r['ID Pemasukan'] || `inc-imp-${Date.now()}-${idx}`,
                  date: String(r['Tanggal'] || new Date().toISOString().split('T')[0]),
                  source: (String(r['Sumber Pemasukan'] || 'other').toLowerCase()) as any,
                  description: String(r['Deskripsi']),
                  amount: Number(r['Nominal (Rp)']) || 0,
                  buyerName: String(r['Pembeli / Vendor'] || ''),
                  paymentStatus: String(r['Status Pembayaran']).toUpperCase() === 'LUNAS' ? 'paid' : 'pending',
                  cycleId: r['ID Siklus Terkait'] !== '-' ? r['ID Siklus Terkait'] : undefined,
                  notes: String(r['Catatan'] || ''),
                  createdAt: new Date().toISOString()
                };
                currentInc.push(inc);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_income', JSON.stringify(currentInc));
          }

          // Parse Hasil Panen
          if (workbook.Sheets['Hasil_Panen']) {
            const hrvRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Hasil_Panen']);
            const currentHrv = StorageService.getHarvests();
            hrvRows.forEach((r, idx) => {
              if (r['Komoditas']) {
                const hrv: HarvestRecord = {
                  id: r['ID Panen'] || `hrv-imp-${Date.now()}-${idx}`,
                  cycleId: String(r['ID Siklus'] || 'cycle-01'),
                  cycleCode: String(r['Kode Siklus'] || 'SIK-2026-001'),
                  fieldName: 'Lahan',
                  cropName: String(r['Komoditas']),
                  varietyName: String(r['Varietas'] || 'Varietas'),
                  date: String(r['Tanggal Panen'] || new Date().toISOString().split('T')[0]),
                  dayOffset: Number(r['Hari Ke (H+)']) || 60,
                  totalWeightKg: Number(r['Total Bobot (kg)']) || 0,
                  grades: [],
                  totalSalesAmount: Number(r['Total Penjualan (Rp)']) || 0,
                  buyerName: String(r['Pembeli / Pasar'] || ''),
                  qualityNotes: String(r['Catatan Kualitas'] || ''),
                  createdAt: new Date().toISOString()
                };
                currentHrv.push(hrv);
                restoredItemsCount++;
              }
            });
            localStorage.setItem('agrisop_harvests', JSON.stringify(currentHrv));
          }

          if (restoredItemsCount > 0) {
            resolve({
              success: true,
              message: `Berhasil mengimpor ${restoredItemsCount} data dari lembar kerja Excel!`
            });
          } else {
            resolve({
              success: false,
              message: 'Tidak ditemukan data yang dapat diimpor dari file Excel tersebut.'
            });
          }
        } catch (err: any) {
          resolve({
            success: false,
            message: `Gagal membaca file Excel: ${err.message || 'Format tidak dikenali'}`
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Terjadi kesalahan saat membaca file Excel.'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Ekspor SOP Template & Versi Aktif ke file Excel (.xlsx) terstruktur
   */
  public static exportSOPToExcel(template: SOPTemplate, version: SOPVersion): void {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Ringkasan SOP
    const totalTasks = version.stages.reduce((acc, s) => acc + (s.tasks?.length || 0), 0);
    const summaryData = [
      { Parameter: 'Nama Template SOP', Nilai: template.name },
      { Parameter: 'Komoditas', Nilai: template.cropTypeName },
      { Parameter: 'ID Template', Nilai: template.id },
      { Parameter: 'Nomor Versi', Nilai: version.versionNumber },
      { Parameter: 'ID Versi', Nilai: version.id },
      { Parameter: 'Status Versi', Nilai: version.status.toUpperCase() },
      { Parameter: 'Catatan Perubahan (Changelog)', Nilai: version.changelog || '-' },
      { Parameter: 'Tanggal Dibuat', Nilai: version.createdAt },
      { Parameter: 'Tanggal Rilis / Published', Nilai: version.publishedAt || '-' },
      { Parameter: 'Jumlah Fase / Tahapan', Nilai: version.stages.length },
      { Parameter: 'Jumlah Total Tugas Kegiatan', Nilai: totalTasks },
      { Parameter: 'Deskripsi SOP', Nilai: template.description || '-' }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_SOP');

    // 2. Sheet Fase & Tahapan
    const stagesData = version.stages.map((stage, idx) => ({
      'No Urut': stage.order || (idx + 1),
      'ID Fase': stage.id,
      'Nama Fase': stage.name,
      'Target Mulai Hari (Offset)': stage.targetStartDay,
      'Target Selesai Hari (Offset)': stage.targetEndDay,
      'Rentang Hari Tanam': `H${stage.targetStartDay >= 0 ? `+${stage.targetStartDay}` : stage.targetStartDay} s/d H+${stage.targetEndDay}`,
      'Deskripsi': stage.description || '-',
      'Jumlah Tugas': stage.tasks?.length || 0
    }));
    const wsStages = XLSX.utils.json_to_sheet(stagesData.length > 0 ? stagesData : [{ 'Info': 'Tidak ada fase' }]);
    XLSX.utils.book_append_sheet(wb, wsStages, 'Fase_Tahapan');

    // 3. Sheet Detail Kegiatan / Tugas SOP
    const tasksData: any[] = [];
    version.stages.forEach(stage => {
      stage.tasks?.forEach((task, tIdx) => {
        const fieldLabels = task.fields?.map(f => `${f.label} (${f.type}${f.unit ? ` - ${f.unit}` : ''})`).join('; ') || '-';
        const validationRules = task.validationRules?.map(r => `Field ${r.fieldId}: [${r.minValue ?? '-'} s/d ${r.maxValue ?? '-'}]`).join('; ') || '-';

        tasksData.push({
          'ID Tugas': task.id,
          'ID Fase': stage.id,
          'Nama Fase': stage.name,
          'Urutan Tugas': task.order || (tIdx + 1),
          'Nama Tugas / Kegiatan': task.name,
          'Tipe Kegiatan': task.taskType,
          'Target Hari (Offset)': task.targetDayOffset,
          'Label Hari': task.targetDayOffset < 0 ? `H${task.targetDayOffset}` : `H+${task.targetDayOffset}`,
          'Target Jam': task.targetTime || '08:00',
          'Prioritas': (task.priority || 'medium').toUpperCase(),
          'Deskripsi & Instruksi': task.description || '-',
          'Wajib Foto': (task as any).requiresPhoto ? 'YA' : 'TIDAK',
          'Parameter Input Mandatori': fieldLabels,
          'Aturan Validasi': validationRules
        });
      });
    });
    const wsTasks = XLSX.utils.json_to_sheet(tasksData.length > 0 ? tasksData : [{ 'Info': 'Tidak ada tugas' }]);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Daftar_Tugas_SOP');

    // 4. Sheet Backup Payload JSON (untuk import presisi 100%)
    const backupPayload = [{
      'AGRISOP_SOP_PAYLOAD': JSON.stringify({
        template: {
          id: template.id,
          name: template.name,
          cropTypeId: template.cropTypeId,
          cropTypeName: template.cropTypeName,
          description: template.description
        },
        version: version
      })
    }];
    const wsBackup = XLSX.utils.json_to_sheet(backupPayload);
    XLSX.utils.book_append_sheet(wb, wsBackup, '_SOP_BACKUP_');

    const fileName = `SOP_${template.cropTypeName.replace(/\s+/g, '_')}_${version.versionNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Impor SOP dari file Excel (.xlsx)
   */
  public static importSOPFromExcel(file: File): Promise<{
    success: boolean;
    message: string;
    templateName?: string;
    versionNumber?: string;
    stageCount?: number;
    taskCount?: number;
    importedVersion?: SOPVersion;
    importedTemplate?: SOPTemplate;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // 1. Cek jika terdapat sheet _SOP_BACKUP_
          if (workbook.Sheets['_SOP_BACKUP_']) {
            const backupRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['_SOP_BACKUP_']);
            if (backupRows.length > 0 && backupRows[0]['AGRISOP_SOP_PAYLOAD']) {
              const payload = JSON.parse(backupRows[0]['AGRISOP_SOP_PAYLOAD']);
              const ver = payload.version as SOPVersion;
              const tmpl = payload.template as SOPTemplate;
              const totalTasks = ver.stages?.reduce((acc, s) => acc + (s.tasks?.length || 0), 0) || 0;

              return resolve({
                success: true,
                message: `Berhasil memuat SOP "${tmpl.name}" versi ${ver.versionNumber} (${ver.stages?.length || 0} fase, ${totalTasks} tugas)`,
                templateName: tmpl.name,
                versionNumber: ver.versionNumber,
                stageCount: ver.stages?.length || 0,
                taskCount: totalTasks,
                importedVersion: ver,
                importedTemplate: tmpl
              });
            }
          }

          // 2. Fallback: Parse dari sheet Fase_Tahapan dan Daftar_Tugas_SOP
          if (workbook.Sheets['Fase_Tahapan'] || workbook.Sheets['Daftar_Tugas_SOP']) {
            const stagesRows: any[] = workbook.Sheets['Fase_Tahapan'] 
              ? XLSX.utils.sheet_to_json(workbook.Sheets['Fase_Tahapan']) 
              : [];
            const tasksRows: any[] = workbook.Sheets['Daftar_Tugas_SOP'] 
              ? XLSX.utils.sheet_to_json(workbook.Sheets['Daftar_Tugas_SOP']) 
              : [];

            const summaryRows: any[] = workbook.Sheets['Ringkasan_SOP'] 
              ? XLSX.utils.sheet_to_json(workbook.Sheets['Ringkasan_SOP']) 
              : [];

            const templateName = summaryRows.find(r => r.Parameter === 'Nama Template SOP')?.Nilai || 'SOP Impor Excel';
            const cropName = summaryRows.find(r => r.Parameter === 'Komoditas')?.Nilai || 'Cabai';
            const versionNumber = summaryRows.find(r => r.Parameter === 'Nomor Versi')?.Nilai || 'V1.0-Excel';
            const desc = summaryRows.find(r => r.Parameter === 'Deskripsi SOP')?.Nilai || 'Diimpor dari file Excel';

            const newVerId = `ver-${Date.now()}-excel`;
            const constructedStages: SOPStage[] = [];

            // Group tasks by phase name or phase ID
            stagesRows.forEach((sRow, sIdx) => {
              const stageId = String(sRow['ID Fase'] || `stg-imp-${sIdx + 1}`);
              const stageName = String(sRow['Nama Fase'] || `Fase ${sIdx + 1}`);
              const targetStartDay = Number(sRow['Target Mulai Hari (Offset)']) || 0;
              const targetEndDay = Number(sRow['Target Selesai Hari (Offset)']) || 14;

              const stageTasks: SOPTask[] = tasksRows
                .filter(tRow => String(tRow['ID Fase']) === stageId || String(tRow['Nama Fase']) === stageName)
                .map((tRow, tIdx) => ({
                  id: String(tRow['ID Tugas'] || `tsk-imp-${sIdx + 1}-${tIdx + 1}`),
                  stageId,
                  name: String(tRow['Nama Tugas / Kegiatan'] || 'Kegiatan SOP'),
                  taskType: (String(tRow['Tipe Kegiatan'] || 'monitoring').toLowerCase()) as any,
                  targetDayOffset: Number(tRow['Target Hari (Offset)']) || targetStartDay,
                  targetTime: String(tRow['Target Jam'] || '08:00'),
                  description: String(tRow['Deskripsi & Instruksi'] || ''),
                  priority: (String(tRow['Prioritas'] || 'medium').toLowerCase()) as any,
                  order: Number(tRow['Urutan Tugas']) || (tIdx + 1),
                  requiresPhoto: String(tRow['Wajib Foto']).toUpperCase() === 'YA',
                  fields: [],
                  validationRules: []
                }));

              constructedStages.push({
                id: stageId,
                sopVersionId: newVerId,
                name: stageName,
                order: Number(sRow['No Urut']) || (sIdx + 1),
                targetStartDay,
                targetEndDay,
                description: String(sRow['Deskripsi'] || ''),
                tasks: stageTasks
              });
            });

            // If tasks existed without explicit stages sheet
            if (constructedStages.length === 0 && tasksRows.length > 0) {
              const defaultStage: SOPStage = {
                id: `stg-imp-default`,
                sopVersionId: newVerId,
                name: '1. Pelaksanaan Budidaya',
                order: 1,
                targetStartDay: 0,
                targetEndDay: 90,
                tasks: tasksRows.map((tRow, tIdx) => ({
                  id: String(tRow['ID Tugas'] || `tsk-imp-${tIdx + 1}`),
                  stageId: 'stg-imp-default',
                  name: String(tRow['Nama Tugas / Kegiatan'] || 'Kegiatan SOP'),
                  taskType: (String(tRow['Tipe Kegiatan'] || 'monitoring').toLowerCase()) as any,
                  targetDayOffset: Number(tRow['Target Hari (Offset)']) || 0,
                  targetTime: String(tRow['Target Jam'] || '08:00'),
                  description: String(tRow['Deskripsi & Instruksi'] || ''),
                  priority: (String(tRow['Prioritas'] || 'medium').toLowerCase()) as any,
                  order: tIdx + 1,
                  fields: [],
                  validationRules: []
                }))
              };
              constructedStages.push(defaultStage);
            }

            const totalTasks = constructedStages.reduce((acc, s) => acc + s.tasks.length, 0);

            const importedVersion: SOPVersion = {
              id: newVerId,
              templateId: `sop-${Date.now()}`,
              versionNumber: String(versionNumber),
              status: 'draft',
              changelog: `Diimpor dari file Excel pada ${new Date().toLocaleDateString('id-ID')}`,
              createdAt: new Date().toISOString(),
              stages: constructedStages
            };

            const importedTemplate: SOPTemplate = {
              id: `sop-${Date.now()}`,
              name: String(templateName),
              cropTypeId: 'crop-01',
              cropTypeName: String(cropName),
              description: String(desc),
              activeVersionId: newVerId,
              createdAt: new Date().toISOString(),
              versions: [importedVersion]
            };

            return resolve({
              success: true,
              message: `Berhasil mengimpor SOP dari Excel: ${constructedStages.length} fase, ${totalTasks} tugas.`,
              templateName: importedTemplate.name,
              versionNumber: importedVersion.versionNumber,
              stageCount: constructedStages.length,
              taskCount: totalTasks,
              importedVersion,
              importedTemplate
            });
          }

          resolve({
            success: false,
            message: 'File Excel tidak memiliki lembar kerja SOP yang sesuai (format Ringkasan_SOP, Fase_Tahapan, atau _SOP_BACKUP_).'
          });
        } catch (err: any) {
          resolve({
            success: false,
            message: `Gagal memproses file Excel SOP: ${err.message || 'Format tidak valid'}`
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Terjadi kesalahan saat membaca file Excel.'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Ekspor Laporan Evaluasi & Analitik Siklus ke Excel (.xlsx)
   */
  public static exportCycleReportToExcel(cycle: CultivationCycle): void {
    const wb = XLSX.utils.book_new();
    const settings = StorageService.getSettings();
    const tasks = StorageService.getTasksByCycle(cycle.id);
    const expenses = StorageService.getExpenses(cycle.id);
    const income = StorageService.getIncome(cycle.id);
    const harvests = StorageService.getHarvests(cycle.id);
    const monitoring = StorageService.getMonitoringRecords(cycle.id);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const taskComplianceRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const operationalExpenses = expenses.filter(e => e.category !== 'alat_perlengkapan');
    const assetExpenses = expenses.filter(e => e.category === 'alat_perlengkapan');
    const totalOperationalExpense = operationalExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalAssetExpense = assetExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const netProfit = totalIncome - totalExpense;
    const totalHarvestKg = harvests.reduce((sum, h) => sum + (Number(h.totalWeightKg) || 0), 0);
    const plantCount = cycle.plantCount || 1;
    const costPerPlant = Math.round(totalOperationalExpense / plantCount);
    const revenuePerPlant = Math.round(totalIncome / plantCount);
    const yieldPerPlantGrams = totalHarvestKg > 0 ? Math.round((totalHarvestKg * 1000) / plantCount) : 0;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

    // 1. Sheet Ringkasan Evaluasi
    const summaryData = [
      { Indikator: 'Nama Usaha / Kebun', Nilai: settings.farmName },
      { Indikator: 'Pemilik / Penanggung Jawab', Nilai: settings.ownerName || '-' },
      { Indikator: 'Kode Siklus', Nilai: cycle.cycleCode },
      { Indikator: 'Nama Lahan / Plot', Nilai: cycle.fieldName },
      { Indikator: 'Komoditas', Nilai: cycle.cropTypeName },
      { Indikator: 'Varietas', Nilai: cycle.varietyName },
      { Indikator: 'Populasi Tanaman', Nilai: `${plantCount.toLocaleString('id-ID')} pohon` },
      { Indikator: 'Tanggal Tanam / Mulai', Nilai: cycle.startDate },
      { Indikator: 'Tanggal Mulai Pengolahan Lahan', Nilai: (cycle as any).landPrepStartDate || '-' },
      { Indikator: 'Estimasi Panen', Nilai: cycle.estimatedHarvestDate || '-' },
      { Indikator: 'Versi SOP Snapshot', Nilai: cycle.sopSnapshot?.versionNumber || 'V1.0' },
      { Indikator: 'Kepatuhan SOP (Compliance Rate)', Nilai: `${taskComplianceRate}% (${completedTasks.length} dari ${tasks.length} tugas selesai)` },
      { Indikator: 'Total Biaya Operasional / HPP Siklus (Rp)', Nilai: `Rp ${totalOperationalExpense.toLocaleString('id-ID')}` },
      { Indikator: 'Total Belanja Aset / Alat & Perlengkapan (Rp)', Nilai: `Rp ${totalAssetExpense.toLocaleString('id-ID')}` },
      { Indikator: 'Total Pengeluaran Keseluruhan (Rp)', Nilai: `Rp ${totalExpense.toLocaleString('id-ID')}` },
      { Indikator: 'Total Pendapatan / Penjualan (Rp)', Nilai: `Rp ${totalIncome.toLocaleString('id-ID')}` },
      { Indikator: 'Laba / (Rugi) Bersih (Rp)', Nilai: `Rp ${netProfit.toLocaleString('id-ID')}` },
      { Indikator: 'Margin Keuntungan', Nilai: `${profitMargin}%` },
      { Indikator: 'Total Hasil Panen (kg)', Nilai: `${totalHarvestKg.toLocaleString('id-ID')} kg` },
      { Indikator: 'Produktivitas Rata-rata per Pohon', Nilai: `${yieldPerPlantGrams} gram / pohon` },
      { Indikator: 'HPP Operasional per Tanaman', Nilai: `Rp ${costPerPlant.toLocaleString('id-ID')} / pohon` },
      { Indikator: 'Pendapatan per Tanaman', Nilai: `Rp ${revenuePerPlant.toLocaleString('id-ID')} / pohon` },
      { Indikator: 'Tanggal Laporan Dibuat', Nilai: new Date().toLocaleString('id-ID') }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Evaluasi');

    // 2. Sheet Audit Kepatuhan Tugas SOP
    const tasksAuditData = tasks.map((t, idx) => ({
      'No': idx + 1,
      'Fase / Tahapan': t.stageName,
      'Nama Tugas SOP': t.taskName,
      'Tipe Kegiatan': t.taskType,
      'Target Hari': t.dayOffset < 0 ? `H${t.dayOffset}` : `H+${t.dayOffset}`,
      'Tanggal Terjadwal': t.scheduledDate,
      'Status Pelaksanaan': t.status.toUpperCase(),
      'Tanggal Selesai': t.completedAt ? new Date(t.completedAt).toLocaleString('id-ID') : '-',
      'Petugas Lapangan': t.submission?.submittedBy || '-',
      'Catatan Lapangan': t.submission?.notes || '-',
      'Data Input Riil': t.submission?.fieldValues ? JSON.stringify(t.submission.fieldValues) : '-'
    }));
    const wsTasks = XLSX.utils.json_to_sheet(tasksAuditData.length > 0 ? tasksAuditData : [{ 'Info': 'Tidak ada tugas' }]);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Audit_Kepatuhan_SOP');

    // 3. Sheet Rincian Pengeluaran
    const expData = expenses.map((e, idx) => ({
      'No': idx + 1,
      'Tanggal': e.date,
      'Tipe Akuntansi': e.category === 'alat_perlengkapan' ? 'ASET / ALAT' : 'OPERASIONAL (HPP)',
      'Kategori Biaya': e.category.toUpperCase(),
      'Deskripsi / Keperluan': e.description,
      'Nominal (Rp)': e.amount,
      'Catatan': e.notes || '-'
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expData.length > 0 ? expData : [{ 'Info': 'Belum ada catatan pengeluaran' }]);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Rincian_Pengeluaran');

    // 4. Sheet Rincian Penjualan & Panen
    const incData = income.map((i, idx) => ({
      'No': idx + 1,
      'Tanggal': i.date,
      'Sumber': i.source,
      'Pembeli / Pasar': i.buyerName || '-',
      'Keterangan': i.description,
      'Nominal Diterima (Rp)': i.amount,
      'Status Pembayaran': i.paymentStatus === 'paid' ? 'LUNAS' : 'TEMPO / PENDING',
      'Catatan': i.notes || '-'
    }));
    const wsIncome = XLSX.utils.json_to_sheet(incData.length > 0 ? incData : [{ 'Info': 'Belum ada catatan penjualan' }]);
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Rincian_Penjualan');

    // 5. Sheet Riwayat Monitoring & Kesehatan
    const monData = monitoring.map((m, idx) => ({
      'No': idx + 1,
      'Tanggal': m.date,
      'Hari Ke': `H+${m.dayOffset}`,
      'Tanaman Diinspeksi': m.plantsInspected,
      'Kondisi Sehat': m.healthyCount,
      'Perlu Perhatian': m.attentionCount,
      'Bermasalah': m.problematicCount,
      'Mati': m.deadCount,
      'Terkena Hama': m.pestAffectedCount,
      'Terkena Penyakit': m.diseaseAffectedCount,
      'Kelembaban Tanah (%)': m.soilMoisturePercent || '-',
      'pH Tanah': m.soilPh || '-',
      'Suhu (°C)': m.temperatureCelsius || '-',
      'Rata-rata Tinggi (cm)': m.averageHeightCm || '-',
      'Warna Daun': m.leafColorGrade || '-',
      'Catatan Lapangan': m.notes || '-'
    }));
    const wsMon = XLSX.utils.json_to_sheet(monData.length > 0 ? monData : [{ 'Info': 'Belum ada data monitoring' }]);
    XLSX.utils.book_append_sheet(wb, wsMon, 'Riwayat_Monitoring');

    const fileName = `Laporan_Analitik_${cycle.cycleCode}_${cycle.cropTypeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}

