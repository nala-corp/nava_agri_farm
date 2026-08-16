import { supabase } from './supabaseClient';
import {
  Field,
  CropType,
  SOPTemplate,
  SOPVersion,
  CultivationCycle,
  CycleTask,
  MonitoringRecord,
  PestType,
  DiseaseType,
  PestObservation,
  DiseaseObservation,
  InventoryItem,
  InventoryTransaction,
  Expense,
  Income,
  HarvestRecord,
  SystemSettings,
  AuditLog
} from '../types';

export class SupabaseService {
  // Test connection to Supabase
  public static async testConnection(): Promise<{ success: boolean; message: string; tablesCount?: number; isTableMissing?: boolean }> {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').limit(1);
      if (error) {
        // Table not found or relation missing
        if (error.code === '42P01' || error.message.toLowerCase().includes('relation') || error.message.toLowerCase().includes('does not exist') || error.message.toLowerCase().includes('not found')) {
          return {
            success: false,
            isTableMissing: true,
            message: 'Tabel database belum dibuat di Supabase. Silakan salin & jalankan Skrip SQL di menu SQL Editor Supabase.'
          };
        }
        return {
          success: false,
          message: `Koneksi ditolak oleh Supabase: ${error.message} (Kode: ${error.code || 'UNKNOWN'})`
        };
      }
      return {
        success: true,
        message: 'Koneksi ke Supabase aktif & tabel siap digunakan!'
      };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
        return {
          success: false,
          message: 'Gagal menghubungi server Supabase (Failed to fetch). Kemungkinan project masih dalam inisialisasi/paused di Supabase, atau diblokir oleh ekstensi browser (Adblocker/Brave Shields).'
        };
      }
      return {
        success: false,
        message: `Terjadi kesalahan saat menghubungi Supabase: ${errorMsg}`
      };
    }
  }

  // ==========================================
  // 1. SETTINGS
  // ==========================================
  public static async upsertSettings(settings: SystemSettings): Promise<boolean> {
    try {
      const row = {
        id: 'default',
        farm_name: settings.farmName,
        owner_name: settings.ownerName,
        operator_name: (settings as any).operatorName || null,
        location: (settings as any).location || null,
        currency: settings.currency || 'IDR',
        date_format: settings.dateFormat || 'YYYY-MM-DD',
        language: settings.language || 'id',
        auto_inventory_deduct: settings.autoInventoryDeduct ?? true,
        enable_deviations_log: settings.enableDeviationsLog ?? true,
        alert_days_ahead: settings.alertDaysAhead ?? 3,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('system_settings').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase] Error upserting settings:', error.message);
      return !error;
    } catch (e) {
      console.warn('[Supabase] Exception upserting settings:', e);
      return false;
    }
  }

  public static async fetchSettings(): Promise<SystemSettings | null> {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 'default').single();
      if (error || !data) return null;
      return {
        farmName: data.farm_name,
        ownerName: data.owner_name,
        currency: data.currency,
        dateFormat: data.date_format,
        language: data.language,
        autoInventoryDeduct: data.auto_inventory_deduct,
        enableDeviationsLog: data.enable_deviations_log,
        alertDaysAhead: data.alert_days_ahead,
        ...{
          operatorName: data.operator_name,
          location: data.location
        }
      } as any;
    } catch (e) {
      return null;
    }
  }

  // ==========================================
  // 2. FIELDS
  // ==========================================
  public static async upsertField(field: Field): Promise<boolean> {
    try {
      const row = {
        id: field.id,
        name: field.name,
        location: field.location || null,
        area_m2: field.areaM2 || 0,
        soil_type: field.soilType || null,
        water_source: field.waterSource || null,
        notes: field.notes || null,
        active_cycle_id: field.activeCycleId || null,
        created_at: field.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('fields').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase] Error upserting field:', error.message);
      return !error;
    } catch (e) {
      return false;
    }
  }

  public static async deleteField(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('fields').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchFields(): Promise<Field[] | null> {
    try {
      const { data, error } = await supabase.from('fields').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        location: d.location,
        areaM2: Number(d.area_m2),
        soilType: d.soil_type,
        waterSource: d.water_source,
        notes: d.notes,
        activeCycleId: d.active_cycle_id,
        createdAt: d.created_at
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // 3. CROPS & VARIETIES
  // ==========================================
  public static async upsertCrop(crop: CropType): Promise<boolean> {
    try {
      const row = {
        id: crop.id,
        name: crop.name,
        icon: crop.icon || null,
        category: crop.category || null,
        is_active: crop.isActive ?? true,
        created_at: (crop as any).createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('crop_types').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase] Error upserting crop:', error.message);

      // Save varieties
      if (crop.varieties && crop.varieties.length > 0) {
        const vRows = crop.varieties.map(v => ({
          id: v.id,
          crop_type_id: crop.id,
          name: v.name,
          seed_producer: v.seedProducer || null,
          average_maturity_days: v.averageMaturityDays || 0,
          estimated_yield_per_plant_kg: v.estimatedYieldPerPlantKg || 0,
          notes: v.notes || null
        }));
        await supabase.from('varieties').upsert(vRows, { onConflict: 'id' });
      }
      return !error;
    } catch (e) {
      return false;
    }
  }

  public static async deleteCrop(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('crop_types').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchCrops(): Promise<CropType[] | null> {
    try {
      const { data: cropsData, error } = await supabase.from('crop_types').select('*');
      if (error || !cropsData || cropsData.length === 0) return null;

      const { data: varData } = await supabase.from('varieties').select('*');

      return cropsData.map((c: any) => {
        const varieties = (varData || [])
          .filter((v: any) => v.crop_type_id === c.id)
          .map((v: any) => ({
            id: v.id,
            cropTypeId: v.crop_type_id,
            name: v.name,
            seedProducer: v.seed_producer,
            averageMaturityDays: Number(v.average_maturity_days),
            estimatedYieldPerPlantKg: Number(v.estimated_yield_per_plant_kg),
            notes: v.notes
          }));

        return {
          id: c.id,
          name: c.name,
          icon: c.icon,
          category: c.category,
          isActive: c.is_active,
          createdAt: c.created_at,
          varieties
        };
      });
    } catch {
      return null;
    }
  }

  // ==========================================
  // 4. SOP TEMPLATES & VERSIONS
  // ==========================================
  public static async upsertSOPTemplate(template: SOPTemplate): Promise<boolean> {
    try {
      const tRow = {
        id: template.id,
        name: template.name,
        crop_type_id: template.cropTypeId || null,
        crop_type_name: template.cropTypeName,
        description: template.description || null,
        active_version_id: template.activeVersionId || null,
        created_at: template.createdAt || new Date().toISOString()
      };
      await supabase.from('sop_templates').upsert(tRow, { onConflict: 'id' });

      // Upsert versions
      if (template.versions && template.versions.length > 0) {
        for (const ver of template.versions) {
          const vRow = {
            id: ver.id,
            template_id: template.id,
            version_number: ver.versionNumber,
            status: ver.status,
            changelog: ver.changelog || null,
            stages: ver.stages || [],
            published_at: ver.publishedAt || null,
            created_at: ver.createdAt || new Date().toISOString()
          };
          await supabase.from('sop_versions').upsert(vRow, { onConflict: 'id' });
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  public static async deleteSOPTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sop_templates').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchSOPTemplates(): Promise<SOPTemplate[] | null> {
    try {
      const { data: tData, error } = await supabase.from('sop_templates').select('*');
      if (error || !tData || tData.length === 0) return null;

      const { data: vData } = await supabase.from('sop_versions').select('*');

      return tData.map((t: any) => {
        const versions = (vData || [])
          .filter((v: any) => v.template_id === t.id)
          .map((v: any) => ({
            id: v.id,
            templateId: v.template_id,
            versionNumber: v.version_number,
            status: v.status,
            changelog: v.changelog,
            stages: v.stages || [],
            publishedAt: v.published_at,
            createdAt: v.created_at
          }));

        return {
          id: t.id,
          name: t.name,
          cropTypeId: t.crop_type_id,
          cropTypeName: t.crop_type_name,
          description: t.description,
          activeVersionId: t.active_version_id,
          createdAt: t.created_at,
          versions
        };
      });
    } catch {
      return null;
    }
  }

  // ==========================================
  // 5. CULTIVATION CYCLES
  // ==========================================
  public static async upsertCycle(cycle: CultivationCycle): Promise<boolean> {
    try {
      const row = {
        id: cycle.id,
        cycle_code: cycle.cycleCode,
        field_id: cycle.fieldId,
        field_name: cycle.fieldName,
        crop_type_id: cycle.cropTypeId,
        crop_type_name: cycle.cropTypeName,
        crop_icon: cycle.cropIcon || null,
        variety_id: cycle.varietyId || null,
        variety_name: cycle.varietyName,
        plant_count: cycle.plantCount,
        land_prep_start_date: cycle.landPrepStartDate || null,
        start_date: cycle.startDate,
        estimated_harvest_date: cycle.estimatedHarvestDate,
        actual_harvest_date: cycle.actualHarvestDate || null,
        sop_template_id: cycle.sopTemplateId || null,
        sop_version_id: cycle.sopVersionId || null,
        sop_snapshot: cycle.sopSnapshot || {},
        active_stage_id: cycle.activeStageId || null,
        status: cycle.status,
        notes: cycle.notes || null,
        created_at: cycle.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('cultivation_cycles').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase] Error upserting cycle:', error.message);
      return !error;
    } catch (e) {
      return false;
    }
  }

  public static async deleteCycle(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('cultivation_cycles').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchCycles(): Promise<CultivationCycle[] | null> {
    try {
      const { data, error } = await supabase.from('cultivation_cycles').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        cycleCode: d.cycle_code,
        fieldId: d.field_id,
        fieldName: d.field_name,
        cropTypeId: d.crop_type_id,
        cropTypeName: d.crop_type_name,
        cropIcon: d.crop_icon,
        varietyId: d.variety_id,
        varietyName: d.variety_name,
        plantCount: Number(d.plant_count),
        landPrepStartDate: d.land_prep_start_date,
        startDate: d.start_date,
        estimatedHarvestDate: d.estimated_harvest_date,
        actualHarvestDate: d.actual_harvest_date,
        sopTemplateId: d.sop_template_id,
        sopVersionId: d.sop_version_id,
        sopSnapshot: d.sop_snapshot,
        activeStageId: d.active_stage_id,
        status: d.status,
        notes: d.notes,
        createdAt: d.created_at
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // 6. TASKS & SUBMISSIONS
  // ==========================================
  public static async upsertTask(task: CycleTask): Promise<boolean> {
    try {
      const row = {
        id: task.id,
        cycle_id: task.cycleId,
        original_task_id: task.originalTaskId || null,
        stage_name: task.stageName,
        task_name: task.taskName,
        task_type: task.taskType,
        day_offset: task.dayOffset,
        scheduled_date: task.scheduledDate,
        deadline_time: task.deadlineTime || null,
        priority: task.priority,
        status: task.status,
        fields: task.fields || [],
        validation_rules: task.validationRules || [],
        linked_inventory_item_id: task.linkedInventoryItemId || null,
        default_inventory_dose_per_plant: task.defaultInventoryDosePerPlant || null,
        description: task.description || null,
        completed_at: task.completedAt || null
      };
      await supabase.from('cycle_tasks').upsert(row, { onConflict: 'id' });

      if (task.submission) {
        const subRow = {
          id: task.submission.id,
          cycle_task_id: task.id,
          cycle_id: task.cycleId,
          submitted_at: task.submission.submittedAt || new Date().toISOString(),
          submitted_by: task.submission.submittedBy,
          field_values: task.submission.fieldValues || {},
          inventory_deducted: task.submission.inventoryDeducted || [],
          deviation_notes: task.submission.deviationNotes || null,
          photo_urls: task.submission.photoUrls || [],
          notes: task.submission.notes || null
        };
        await supabase.from('task_submissions').upsert(subRow, { onConflict: 'id' });
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  public static async upsertTasksBatch(tasks: CycleTask[]): Promise<boolean> {
    try {
      if (!tasks || tasks.length === 0) return true;
      const rows = tasks.map(task => ({
        id: task.id,
        cycle_id: task.cycleId,
        original_task_id: task.originalTaskId || null,
        stage_name: task.stageName,
        task_name: task.taskName,
        task_type: task.taskType,
        day_offset: task.dayOffset,
        scheduled_date: task.scheduledDate,
        deadline_time: task.deadlineTime || null,
        priority: task.priority,
        status: task.status,
        fields: task.fields || [],
        validation_rules: task.validationRules || [],
        linked_inventory_item_id: task.linkedInventoryItemId || null,
        default_inventory_dose_per_plant: task.defaultInventoryDosePerPlant || null,
        description: task.description || null,
        completed_at: task.completedAt || null
      }));
      const { error } = await supabase.from('cycle_tasks').upsert(rows, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchTasks(): Promise<CycleTask[] | null> {
    try {
      const { data: tasksData, error } = await supabase.from('cycle_tasks').select('*');
      if (error || !tasksData || tasksData.length === 0) return null;

      const { data: subData } = await supabase.from('task_submissions').select('*');

      return tasksData.map((t: any) => {
        const sub = (subData || []).find((s: any) => s.cycle_task_id === t.id);
        const submission = sub ? {
          id: sub.id,
          cycleTaskId: sub.cycle_task_id,
          cycleId: t.cycle_id,
          submittedAt: sub.submitted_at,
          submittedBy: sub.submitted_by,
          fieldValues: sub.field_values || {},
          inventoryDeducted: sub.inventory_deducted || [],
          deviationNotes: sub.deviation_notes,
          photoUrls: sub.photo_urls || [],
          notes: sub.notes
        } : undefined;

        return {
          id: t.id,
          cycleId: t.cycle_id,
          originalTaskId: t.original_task_id,
          stageName: t.stage_name,
          taskName: t.task_name,
          taskType: t.task_type,
          dayOffset: t.day_offset,
          scheduledDate: t.scheduled_date,
          deadlineTime: t.deadline_time,
          priority: t.priority,
          status: t.status,
          fields: t.fields || [],
          validationRules: t.validation_rules || [],
          linkedInventoryItemId: t.linked_inventory_item_id,
          defaultInventoryDosePerPlant: t.default_inventory_dose_per_plant ? Number(t.default_inventory_dose_per_plant) : undefined,
          description: t.description,
          completedAt: t.completed_at,
          submission
        };
      });
    } catch {
      return null;
    }
  }

  // ==========================================
  // 7. INVENTORY & TRANSACTIONS
  // ==========================================
  public static async upsertInventoryItem(item: InventoryItem): Promise<boolean> {
    try {
      const row = {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        current_stock: item.currentStock || 0,
        min_stock_alert: item.minStockAlert || 0,
        unit_price: item.unitPrice || 0,
        brand: item.brand || null,
        active_ingredients: item.activeIngredients || null,
        storage_location: item.storageLocation || null,
        notes: item.notes || null,
        is_active: item.isActive ?? true,
        updated_at: item.updatedAt || new Date().toISOString().split('T')[0]
      };
      const { error } = await supabase.from('inventory_items').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchInventory(): Promise<InventoryItem[] | null> {
    try {
      const { data, error } = await supabase.from('inventory_items').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        unit: d.unit,
        currentStock: Number(d.current_stock),
        minStockAlert: Number(d.min_stock_alert),
        unitPrice: Number(d.unit_price),
        brand: d.brand,
        activeIngredients: d.active_ingredients,
        storageLocation: d.storage_location,
        notes: d.notes,
        isActive: d.is_active,
        updatedAt: d.updated_at
      }));
    } catch {
      return null;
    }
  }

  public static async upsertInventoryTransaction(tx: InventoryTransaction): Promise<boolean> {
    try {
      const row = {
        id: tx.id,
        inventory_item_id: tx.inventoryItemId,
        item_name: tx.itemName,
        type: tx.type,
        quantity: tx.quantity,
        unit_price: tx.unitPrice || 0,
        total_cost: tx.totalCost || 0,
        cycle_id: tx.cycleId || null,
        task_id: tx.taskId || null,
        reason: tx.reason,
        date: tx.date,
        created_at: tx.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('inventory_transactions').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  // ==========================================
  // 8. EXPENSES & INCOMES
  // ==========================================
  public static async upsertExpense(exp: Expense): Promise<boolean> {
    try {
      const row = {
        id: exp.id,
        date: exp.date,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        cycle_id: exp.cycleId || null,
        field_id: exp.fieldId || null,
        inventory_item_id: exp.inventoryItemId || null,
        receipt_photo_url: exp.receiptPhotoUrl || null,
        notes: exp.notes || null,
        created_at: exp.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('expenses').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deleteExpense(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchExpenses(): Promise<Expense[] | null> {
    try {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        date: d.date,
        category: d.category,
        description: d.description,
        amount: Number(d.amount),
        cycleId: d.cycle_id,
        fieldId: d.field_id,
        inventoryItemId: d.inventory_item_id,
        receiptPhotoUrl: d.receipt_photo_url,
        notes: d.notes,
        createdAt: d.created_at
      }));
    } catch {
      return null;
    }
  }

  public static async upsertIncome(inc: Income): Promise<boolean> {
    try {
      const row = {
        id: inc.id,
        date: inc.date,
        source: inc.source,
        description: inc.description,
        amount: inc.amount,
        cycle_id: inc.cycleId || null,
        harvest_id: inc.harvestId || null,
        buyer_name: inc.buyerName || null,
        payment_status: inc.paymentStatus || 'paid',
        notes: inc.notes || null,
        created_at: inc.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('incomes').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deleteIncome(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('incomes').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchIncome(): Promise<Income[] | null> {
    try {
      const { data, error } = await supabase.from('incomes').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        date: d.date,
        source: d.source,
        description: d.description,
        amount: Number(d.amount),
        cycleId: d.cycle_id,
        harvestId: d.harvest_id,
        buyerName: d.buyer_name,
        paymentStatus: d.payment_status,
        notes: d.notes,
        createdAt: d.created_at
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // 9. HARVEST RECORDS
  // ==========================================
  public static async upsertHarvest(harvest: HarvestRecord): Promise<boolean> {
    try {
      const row = {
        id: harvest.id,
        cycle_id: harvest.cycleId,
        cycle_code: harvest.cycleCode,
        field_name: harvest.fieldName,
        crop_name: harvest.cropName,
        variety_name: harvest.varietyName,
        date: harvest.date,
        day_offset: harvest.dayOffset,
        total_weight_kg: harvest.totalWeightKg,
        grades: harvest.grades || [],
        total_sales_amount: harvest.totalSalesAmount,
        buyer_name: harvest.buyerName,
        quality_notes: harvest.qualityNotes || null,
        photo_urls: harvest.photoUrls || [],
        created_at: harvest.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('harvest_records').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchHarvests(): Promise<HarvestRecord[] | null> {
    try {
      const { data, error } = await supabase.from('harvest_records').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        cycleId: d.cycle_id,
        cycleCode: d.cycle_code,
        fieldName: d.field_name,
        cropName: d.crop_name,
        varietyName: d.variety_name,
        date: d.date,
        dayOffset: Number(d.day_offset),
        totalWeightKg: Number(d.total_weight_kg),
        grades: d.grades || [],
        totalSalesAmount: Number(d.total_sales_amount),
        buyerName: d.buyer_name,
        qualityNotes: d.quality_notes,
        photoUrls: d.photo_urls || [],
        createdAt: d.created_at
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // 10. MONITORING RECORDS
  // ==========================================
  public static async upsertMonitoring(mon: MonitoringRecord): Promise<boolean> {
    try {
      const row = {
        id: mon.id,
        cycle_id: mon.cycleId,
        date: mon.date,
        day_offset: mon.dayOffset,
        plants_inspected: mon.plantsInspected || 0,
        healthy_count: mon.healthyCount || 0,
        attention_count: mon.attentionCount || 0,
        problematic_count: mon.problematicCount || 0,
        dead_count: mon.deadCount || 0,
        pest_affected_count: mon.pestAffectedCount || 0,
        disease_affected_count: mon.diseaseAffectedCount || 0,
        soil_moisture_percent: mon.soilMoisturePercent || null,
        soil_ph: mon.soilPh || null,
        temperature_celsius: mon.temperatureCelsius || null,
        humidity_percent: mon.humidityPercent || null,
        average_height_cm: mon.averageHeightCm || null,
        leaf_color_grade: mon.leafColorGrade || null,
        notes: mon.notes || null,
        photo_urls: mon.photoUrls || [],
        created_at: mon.createdAt || new Date().toISOString()
      };
      const { error } = await supabase.from('monitoring_records').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async fetchMonitoring(): Promise<MonitoringRecord[] | null> {
    try {
      const { data, error } = await supabase.from('monitoring_records').select('*');
      if (error || !data || data.length === 0) return null;
      return data.map((d: any) => ({
        id: d.id,
        cycleId: d.cycle_id,
        date: d.date,
        dayOffset: Number(d.day_offset),
        plantsInspected: Number(d.plants_inspected),
        healthyCount: Number(d.healthy_count),
        attentionCount: Number(d.attention_count),
        problematicCount: Number(d.problematic_count),
        deadCount: Number(d.dead_count),
        pestAffectedCount: Number(d.pest_affected_count),
        diseaseAffectedCount: Number(d.disease_affected_count),
        soilMoisturePercent: d.soil_moisture_percent ? Number(d.soil_moisture_percent) : undefined,
        soilPh: d.soil_ph ? Number(d.soil_ph) : undefined,
        temperatureCelsius: d.temperature_celsius ? Number(d.temperature_celsius) : undefined,
        humidityPercent: d.humidity_percent ? Number(d.humidity_percent) : undefined,
        averageHeightCm: d.average_height_cm ? Number(d.average_height_cm) : undefined,
        leafColorGrade: d.leaf_color_grade,
        notes: d.notes,
        photoUrls: d.photo_urls || [],
        createdAt: d.created_at
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // 11. PESTS & DISEASES OBSERVATIONS
  // ==========================================
  public static async upsertPest(pest: PestType): Promise<boolean> {
    try {
      const row = {
        id: pest.id,
        name: pest.name,
        scientific_name: pest.scientificName || null,
        target_crops: pest.targetCrops || [],
        symptoms: pest.symptoms || null,
        recommended_treatment: pest.recommendedTreatment || null,
        treatment_steps: pest.treatmentSteps || [],
        photo_url: pest.photoUrl || null
      };
      const { error } = await supabase.from('pest_types').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deletePest(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pest_types').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async upsertDisease(disease: DiseaseType): Promise<boolean> {
    try {
      const row = {
        id: disease.id,
        name: disease.name,
        pathogen_type: disease.pathogenType || null,
        target_crops: disease.targetCrops || [],
        symptoms: disease.symptoms || null,
        recommended_treatment: disease.recommendedTreatment || null,
        treatment_steps: disease.treatmentSteps || [],
        photo_url: disease.photoUrl || null
      };
      const { error } = await supabase.from('disease_types').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deleteDisease(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('disease_types').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async upsertPestObs(obs: PestObservation): Promise<boolean> {
    try {
      const row = {
        id: obs.id,
        cycle_id: obs.cycleId,
        pest_type_id: obs.pestTypeId || null,
        pest_name: obs.pestName,
        date: obs.date,
        day_offset: obs.dayOffset,
        severity: obs.severity,
        affected_plants_count: obs.affectedPlantsCount || 0,
        action_taken: obs.actionTaken || null,
        resolved: obs.resolved ?? false,
        notes: obs.notes || null,
        photo_urls: obs.photoUrls || []
      };
      const { error } = await supabase.from('pest_observations').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deletePestObs(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pest_observations').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async upsertDiseaseObs(obs: DiseaseObservation): Promise<boolean> {
    try {
      const row = {
        id: obs.id,
        cycle_id: obs.cycleId,
        disease_type_id: obs.diseaseTypeId || null,
        disease_name: obs.diseaseName,
        date: obs.date,
        day_offset: obs.dayOffset,
        severity: obs.severity,
        affected_plants_count: obs.affectedPlantsCount || 0,
        action_taken: obs.actionTaken || null,
        resolved: obs.resolved ?? false,
        notes: obs.notes || null,
        photo_urls: obs.photoUrls || []
      };
      const { error } = await supabase.from('disease_observations').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  public static async deleteDiseaseObs(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('disease_observations').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  // ==========================================
  // BULK SYNC ALL DATA TO SUPABASE
  // ==========================================
  public static async syncAllLocalDataToSupabase(allData: {
    settings: SystemSettings;
    fields: Field[];
    crops: CropType[];
    sops: SOPTemplate[];
    cycles: CultivationCycle[];
    tasks: CycleTask[];
    inventory: InventoryItem[];
    inventoryTransactions?: InventoryTransaction[];
    expenses: Expense[];
    income: Income[];
    harvests: HarvestRecord[];
    monitoring: MonitoringRecord[];
    pests: PestType[];
    diseases: DiseaseType[];
    pestObservations: PestObservation[];
    diseaseObservations: DiseaseObservation[];
  }): Promise<{ success: boolean; message: string; syncedCount: number }> {
    let syncedCount = 0;
    try {
      // 1. Settings
      if (allData.settings) {
        await this.upsertSettings(allData.settings);
        syncedCount++;
      }
      // 2. Fields
      if (allData.fields) {
        for (const f of allData.fields) {
          await this.upsertField(f);
          syncedCount++;
        }
      }
      // 3. Crops
      if (allData.crops) {
        for (const c of allData.crops) {
          await this.upsertCrop(c);
          syncedCount++;
        }
      }
      // 4. SOPs
      if (allData.sops) {
        for (const s of allData.sops) {
          await this.upsertSOPTemplate(s);
          syncedCount++;
        }
      }
      // 5. Cycles
      if (allData.cycles) {
        for (const cy of allData.cycles) {
          await this.upsertCycle(cy);
          syncedCount++;
        }
      }
      // 6. Tasks
      if (allData.tasks && allData.tasks.length > 0) {
        await this.upsertTasksBatch(allData.tasks);
        syncedCount += allData.tasks.length;
      }
      // 7. Inventory
      if (allData.inventory) {
        for (const inv of allData.inventory) {
          await this.upsertInventoryItem(inv);
          syncedCount++;
        }
      }
      // 8. Expenses & Incomes
      if (allData.expenses) {
        for (const e of allData.expenses) {
          await this.upsertExpense(e);
          syncedCount++;
        }
      }
      if (allData.income) {
        for (const i of allData.income) {
          await this.upsertIncome(i);
          syncedCount++;
        }
      }
      // 9. Harvests
      if (allData.harvests) {
        for (const h of allData.harvests) {
          await this.upsertHarvest(h);
          syncedCount++;
        }
      }
      // 10. Monitoring
      if (allData.monitoring) {
        for (const m of allData.monitoring) {
          await this.upsertMonitoring(m);
          syncedCount++;
        }
      }
      // 11. Pests & Diseases
      if (allData.pests) {
        for (const p of allData.pests) {
          await this.upsertPest(p);
          syncedCount++;
        }
      }
      if (allData.diseases) {
        for (const d of allData.diseases) {
          await this.upsertDisease(d);
          syncedCount++;
        }
      }
      if (allData.pestObservations) {
        for (const po of allData.pestObservations) {
          await this.upsertPestObs(po);
          syncedCount++;
        }
      }
      if (allData.diseaseObservations) {
        for (const dobs of allData.diseaseObservations) {
          await this.upsertDiseaseObs(dobs);
          syncedCount++;
        }
      }

      return {
        success: true,
        message: `Berhasil mengekspor & menyinkronkan seluruh entitas (${syncedCount} data) ke database Supabase!`,
        syncedCount
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menyinkronkan data ke Supabase: ${err.message}`,
        syncedCount
      };
    }
  }
}
