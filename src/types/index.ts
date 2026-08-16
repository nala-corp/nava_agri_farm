export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue' | 'cancelled';

export type TaskType = 
  | 'checklist' 
  | 'monitoring' 
  | 'fertilization' 
  | 'irrigation' 
  | 'pest_treatment' 
  | 'disease_treatment' 
  | 'planting' 
  | 'maintenance' 
  | 'harvest' 
  | 'documentation' 
  | 'custom';

export type FieldInputType = 'number' | 'text' | 'select' | 'boolean' | 'photo' | 'textarea';

export type InventoryCategory = 'alat' | 'bahan' | 'pupuk' | 'obat' | 'bibit' | 'lainnya';

export type ExpenseCategory = 
  | 'bibit' 
  | 'pupuk' 
  | 'pestisida' 
  | 'alat_perlengkapan' 
  | 'tenaga_kerja' 
  | 'air_irigasi' 
  | 'listrik_bbm' 
  | 'transportasi' 
  | 'sewa_lahan' 
  | 'lainnya';

export type CycleStatus = 'draft' | 'active' | 'completed' | 'archived' | 'failed';

export type PlantHealthStatus = 'healthy' | 'attention' | 'problematic' | 'dead';

export interface Field {
  id: string;
  name: string;
  location: string;
  areaM2: number;
  soilType: string;
  waterSource: string;
  notes?: string;
  activeCycleId?: string;
  createdAt: string;
}

export interface Variety {
  id: string;
  cropTypeId: string;
  name: string;
  seedProducer?: string;
  averageMaturityDays: number;
  estimatedYieldPerPlantKg: number;
  notes?: string;
}

export interface CropType {
  id: string;
  name: string;
  icon: string;
  category: string;
  isActive?: boolean;
  varieties: Variety[];
}

export interface SOPTaskField {
  id: string;
  name: string;
  label: string;
  type: FieldInputType;
  unit?: string;
  required: boolean;
  options?: string[]; // For select
  defaultValue?: any;
  sopStandardMin?: number;
  sopStandardMax?: number;
  sopStandardExpected?: string | number;
  description?: string;
}

export interface SOPValidationRule {
  fieldId: string;
  ruleType: 'min_max' | 'exact' | 'require_reason_if_deviates' | 'warning_only';
  standardValue?: string | number;
  minValue?: number;
  maxValue?: number;
  warningMessage: string;
  blockOnFailure: boolean;
}

export interface SOPTask {
  id: string;
  stageId: string;
  name: string;
  taskType: TaskType;
  targetDayOffset: number; // Day offset relative to planting date (e.g. -7, 0, 7, 14, 21...)
  targetTime?: string; // e.g. "08:00"
  description: string;
  instructionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  linkedInventoryItemId?: string;
  defaultInventoryDosePerPlant?: number;
  fields: SOPTaskField[];
  validationRules: SOPValidationRule[];
  order: number;
}

export interface SOPStage {
  id: string;
  sopVersionId: string;
  name: string;
  order: number;
  targetStartDay: number;
  targetEndDay: number;
  description?: string;
  tasks: SOPTask[];
}

export interface SOPVersion {
  id: string;
  templateId: string;
  versionNumber: string; // e.g. "V1.0", "V2.1"
  status: 'draft' | 'published' | 'archived';
  changelog?: string;
  stages: SOPStage[];
  publishedAt?: string;
  createdAt: string;
}

export interface SOPTemplate {
  id: string;
  name: string;
  cropTypeId: string;
  cropTypeName: string;
  description: string;
  activeVersionId: string;
  versions: SOPVersion[];
  createdAt: string;
}

export interface SOPSnapshot {
  snapshotId: string;
  originalTemplateId: string;
  templateName: string;
  originalVersionId: string;
  versionNumber: string;
  createdAt: string;
  stages: SOPStage[];
}

export interface CultivationCycle {
  id: string;
  cycleCode: string; // e.g. "SIK-2026-001"
  fieldId: string;
  fieldName: string;
  cropTypeId: string;
  cropTypeName: string;
  cropIcon: string;
  varietyId: string;
  varietyName: string;
  plantCount: number;
  landPrepStartDate?: string; // Tanggal Mulai Pengolahan Lahan (YYYY-MM-DD)
  startDate: string; // Tanggal Tanam Bibit / H-0 (YYYY-MM-DD)
  estimatedHarvestDate: string;
  actualHarvestDate?: string;
  sopTemplateId: string;
  sopVersionId: string;
  sopSnapshot: SOPSnapshot;
  activeStageId?: string; // ID Tahapan SOP yang sedang aktif (bisa diubah manual atau otomatis)
  status: CycleStatus;
  notes?: string;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  cycleTaskId: string;
  cycleId: string;
  submittedAt: string;
  submittedBy: string;
  fieldValues: Record<string, any>;
  inventoryDeducted?: {
    itemId: string;
    quantity: number;
    unit: string;
  }[];
  deviationNotes?: string;
  photoUrls?: string[];
  notes?: string;
}

export interface CycleTask {
  id: string;
  cycleId: string;
  originalTaskId: string;
  stageName: string;
  taskName: string;
  taskType: TaskType;
  dayOffset: number; // e.g. H+7
  scheduledDate: string; // YYYY-MM-DD
  deadlineTime?: string; // e.g. "10:00"
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: TaskStatus;
  fields: SOPTaskField[];
  validationRules: SOPValidationRule[];
  linkedInventoryItemId?: string;
  defaultInventoryDosePerPlant?: number;
  description: string;
  submission?: TaskSubmission;
  completedAt?: string;
}

export interface MonitoringRecord {
  id: string;
  cycleId: string;
  date: string;
  dayOffset: number; // H+N
  plantsInspected: number;
  healthyCount: number;
  attentionCount: number;
  problematicCount: number;
  deadCount: number;
  pestAffectedCount: number;
  diseaseAffectedCount: number;
  soilMoisturePercent?: number;
  soilPh?: number;
  temperatureCelsius?: number;
  humidityPercent?: number;
  averageHeightCm?: number;
  leafColorGrade?: 'hijau_segar' | 'kuning_pucat' | 'berbintik' | 'kering';
  notes?: string;
  photoUrls?: string[];
  createdAt: string;
}

export interface SOPTreatmentStep {
  id?: string;
  stepNumber: number;
  stageName: string; // e.g. "Pencegahan Dini / Vegetatif Awal", "Pengendalian Serangan Aktif", "Pemulihan & Sanitasi"
  actionType: 'spray' | 'kocor' | 'perangkap' | 'sanitasi' | 'biologis' | 'lainnya';
  treatmentName: string; // e.g. "Spray Abamektin", "Kocor Bakterisida Tembaga", "Pasang Perangkap Kuning"
  recommendedProduct?: string; // e.g. "Agrimec 18 EC / Promectin"
  activeIngredient?: string; // e.g. "Abamektin 18 g/l"
  dosage: string; // e.g. "0.5 - 1.0 ml / liter air"
  applicationInterval?: string; // e.g. "Setiap 4-5 hari sekali"
  timingNotes?: string; // e.g. "Aplikasi sore hari pkl 16.00-17.30 di balik daun"
}

export interface PestType {
  id: string;
  name: string;
  scientificName?: string;
  targetCrops: string[];
  symptoms: string;
  recommendedTreatment: string;
  treatmentSteps?: SOPTreatmentStep[];
  photoUrl?: string;
}

export interface DiseaseType {
  id: string;
  name: string;
  pathogenType: 'fungus' | 'bacteria' | 'virus' | 'nematode' | 'nutrient_deficiency';
  targetCrops: string[];
  symptoms: string;
  recommendedTreatment: string;
  treatmentSteps?: SOPTreatmentStep[];
  photoUrl?: string;
}

export interface PestObservation {
  id: string;
  cycleId: string;
  pestTypeId: string;
  pestName: string;
  date: string;
  dayOffset: number;
  severity: 'ringan' | 'sedang' | 'parah';
  affectedPlantsCount: number;
  actionTaken?: string;
  resolved: boolean;
  notes?: string;
  photoUrls?: string[];
}

export interface DiseaseObservation {
  id: string;
  cycleId: string;
  diseaseTypeId: string;
  diseaseName: string;
  date: string;
  dayOffset: number;
  severity: 'ringan' | 'sedang' | 'parah';
  affectedPlantsCount: number;
  actionTaken?: string;
  resolved: boolean;
  notes?: string;
  photoUrls?: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string; // e.g. "kg", "liter", "botol", "bungkus", "buah"
  currentStock: number;
  minStockAlert: number;
  unitPrice: number;
  brand?: string;
  activeIngredients?: string;
  storageLocation?: string;
  notes?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'task_usage';
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  cycleId?: string;
  taskId?: string;
  reason: string;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  cycleId?: string;
  fieldId?: string;
  inventoryItemId?: string;
  receiptPhotoUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  date: string;
  source: 'harvest_sale' | 'seedling_sale' | 'byproduct' | 'subsidy' | 'other';
  description: string;
  amount: number;
  cycleId?: string;
  harvestId?: string;
  buyerName?: string;
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface HarvestGradeItem {
  grade: 'Grade A (Super)' | 'Grade B (Medium)' | 'Grade C (Kecil/Off)' | 'BS/Reject';
  weightKg: number;
  unitPrice: number;
  subtotal: number;
}

export interface HarvestRecord {
  id: string;
  cycleId: string;
  cycleCode: string;
  fieldName: string;
  cropName: string;
  varietyName: string;
  date: string;
  dayOffset: number;
  totalWeightKg: number;
  grades: HarvestGradeItem[];
  totalSalesAmount: number;
  buyerName: string;
  qualityNotes?: string;
  photoUrls?: string[];
  createdAt: string;
}

export interface SystemSettings {
  farmName: string;
  ownerName: string;
  currency: string;
  dateFormat: string;
  language: 'id' | 'en';
  autoInventoryDeduct: boolean;
  enableDeviationsLog: boolean;
  alertDaysAhead: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  entityType: string;
  action: 'create' | 'update' | 'delete' | 'execute' | 'snapshot';
  description: string;
  cycleId?: string;
}
