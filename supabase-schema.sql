-- ==============================================================================
-- SKEMA BASIS DATA SUPABASE (POSTGRESQL) - AGRISOP
-- URL Endpoint: https://wznkngfafhhmzkfrlczg.supabase.co
-- PETUNJUK:
-- 1. Buka Supabase SQL Editor: https://supabase.com/dashboard/project/wznkngfafhhmzkfrlczg/sql/new
-- 2. Klik "New query", paste seluruh script SQL ini, lalu klik tombol hijau "RUN".
-- ==============================================================================

-- BERIKAN AKSES SKEMA PUBLIC KE ROLE ANON & AUTHENTICATED
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 1. Tabel Pengaturan Sistem (system_settings)
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  farm_name TEXT NOT NULL DEFAULT 'Nusantara Agro Farm',
  owner_name TEXT NOT NULL DEFAULT 'Pak Budi Hartono',
  operator_name TEXT,
  location TEXT,
  currency TEXT DEFAULT 'IDR',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  language TEXT DEFAULT 'id',
  auto_inventory_deduct BOOLEAN DEFAULT TRUE,
  enable_deviations_log BOOLEAN DEFAULT TRUE,
  alert_days_ahead NUMERIC DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Masukkan data default settings
INSERT INTO system_settings (id, farm_name, owner_name)
VALUES ('default', 'Nusantara Agro Farm', 'Pak Budi Hartono')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabel Master Lahan / Plot (fields)
CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  area_m2 NUMERIC DEFAULT 0,
  soil_type TEXT,
  water_source TEXT,
  notes TEXT,
  active_cycle_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Master Komoditas (crop_types)
CREATE TABLE IF NOT EXISTS crop_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Master Varietas (varieties)
CREATE TABLE IF NOT EXISTS varieties (
  id TEXT PRIMARY KEY,
  crop_type_id TEXT REFERENCES crop_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seed_producer TEXT,
  average_maturity_days NUMERIC DEFAULT 0,
  estimated_yield_per_plant_kg NUMERIC DEFAULT 0,
  notes TEXT
);

-- 5. Tabel Template SOP (sop_templates)
CREATE TABLE IF NOT EXISTS sop_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  crop_type_id TEXT,
  crop_type_name TEXT NOT NULL,
  description TEXT,
  active_version_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel Versi SOP & Tahapan (sop_versions)
CREATE TABLE IF NOT EXISTS sop_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES sop_templates(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  changelog TEXT,
  stages JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Siklus Budidaya (cultivation_cycles)
CREATE TABLE IF NOT EXISTS cultivation_cycles (
  id TEXT PRIMARY KEY,
  cycle_code TEXT UNIQUE NOT NULL,
  field_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  crop_type_id TEXT NOT NULL,
  crop_type_name TEXT NOT NULL,
  crop_icon TEXT,
  variety_id TEXT,
  variety_name TEXT NOT NULL,
  plant_count NUMERIC NOT NULL DEFAULT 0,
  land_prep_start_date DATE,
  start_date DATE NOT NULL,
  estimated_harvest_date DATE NOT NULL,
  actual_harvest_date DATE,
  sop_template_id TEXT,
  sop_version_id TEXT,
  sop_snapshot JSONB DEFAULT '{}'::jsonb,
  active_stage_id TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabel Tugas Siklus (cycle_tasks)
CREATE TABLE IF NOT EXISTS cycle_tasks (
  id TEXT PRIMARY KEY,
  cycle_id TEXT REFERENCES cultivation_cycles(id) ON DELETE CASCADE,
  original_task_id TEXT,
  stage_name TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  day_offset NUMERIC NOT NULL DEFAULT 0,
  scheduled_date DATE NOT NULL,
  deadline_time TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  fields JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  linked_inventory_item_id TEXT,
  default_inventory_dose_per_plant NUMERIC,
  description TEXT,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Tabel Pengiriman Tugas & Form Lapangan (task_submissions)
CREATE TABLE IF NOT EXISTS task_submissions (
  id TEXT PRIMARY KEY,
  cycle_task_id TEXT REFERENCES cycle_tasks(id) ON DELETE CASCADE,
  cycle_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by TEXT NOT NULL,
  field_values JSONB DEFAULT '{}'::jsonb,
  inventory_deducted JSONB DEFAULT '[]'::jsonb,
  deviation_notes TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

-- 10. Tabel Master Inventaris (inventory_items)
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock NUMERIC DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  brand TEXT,
  active_ingredients TEXT,
  storage_location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at DATE DEFAULT CURRENT_DATE
);

-- 11. Tabel Riwayat Transaksi Stok (inventory_transactions)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT REFERENCES inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  cycle_id TEXT,
  task_id TEXT,
  reason TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Tabel Biaya Operasional / Pengeluaran (expenses)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  cycle_id TEXT,
  field_id TEXT,
  inventory_item_id TEXT,
  receipt_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Tabel Pendapatan / Penjualan (incomes)
CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  cycle_id TEXT,
  harvest_id TEXT,
  buyer_name TEXT,
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Tabel Log Panen (harvest_records)
CREATE TABLE IF NOT EXISTS harvest_records (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  cycle_code TEXT NOT NULL,
  field_name TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  variety_name TEXT NOT NULL,
  date DATE NOT NULL,
  day_offset NUMERIC NOT NULL DEFAULT 0,
  total_weight_kg NUMERIC NOT NULL DEFAULT 0,
  grades JSONB DEFAULT '[]'::jsonb,
  total_sales_amount NUMERIC NOT NULL DEFAULT 0,
  buyer_name TEXT,
  quality_notes TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Tabel Monitoring Harian (monitoring_records)
CREATE TABLE IF NOT EXISTS monitoring_records (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  date DATE NOT NULL,
  day_offset NUMERIC NOT NULL DEFAULT 0,
  plants_inspected NUMERIC DEFAULT 0,
  healthy_count NUMERIC DEFAULT 0,
  attention_count NUMERIC DEFAULT 0,
  problematic_count NUMERIC DEFAULT 0,
  dead_count NUMERIC DEFAULT 0,
  pest_affected_count NUMERIC DEFAULT 0,
  disease_affected_count NUMERIC DEFAULT 0,
  soil_moisture_percent NUMERIC,
  soil_ph NUMERIC,
  temperature_celsius NUMERIC,
  humidity_percent NUMERIC,
  average_height_cm NUMERIC,
  leaf_color_grade TEXT,
  notes TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Tabel Katalog Hama (pest_types)
CREATE TABLE IF NOT EXISTS pest_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  target_crops JSONB DEFAULT '[]'::jsonb,
  symptoms TEXT,
  recommended_treatment TEXT,
  treatment_steps JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT
);

-- 17. Tabel Katalog Penyakit (disease_types)
CREATE TABLE IF NOT EXISTS disease_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pathogen_type TEXT,
  target_crops JSONB DEFAULT '[]'::jsonb,
  symptoms TEXT,
  recommended_treatment TEXT,
  treatment_steps JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT
);

-- 18. Tabel Temuan Lapangan Hama (pest_observations)
CREATE TABLE IF NOT EXISTS pest_observations (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  pest_type_id TEXT,
  pest_name TEXT NOT NULL,
  date DATE NOT NULL,
  day_offset NUMERIC DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'low',
  affected_plants_count NUMERIC DEFAULT 0,
  action_taken TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb
);

-- 19. Tabel Temuan Lapangan Penyakit (disease_observations)
CREATE TABLE IF NOT EXISTS disease_observations (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  disease_type_id TEXT,
  disease_name TEXT NOT NULL,
  date DATE NOT NULL,
  day_offset NUMERIC DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'low',
  affected_plants_count NUMERIC DEFAULT 0,
  action_taken TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb
);

-- ==============================================================================
-- INDEKS PENCARIAN & RELASI CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cycles_status ON cultivation_cycles(status);
CREATE INDEX IF NOT EXISTS idx_tasks_cycle ON cycle_tasks(cycle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON cycle_tasks(status);
CREATE INDEX IF NOT EXISTS idx_expenses_cycle ON expenses(cycle_id);
CREATE INDEX IF NOT EXISTS idx_incomes_cycle ON incomes(cycle_id);
CREATE INDEX IF NOT EXISTS idx_harvest_cycle ON harvest_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_cycle ON monitoring_records(cycle_id);

-- ==============================================================================
-- HAK AKSES PERMISSION & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_observations ENABLE ROW LEVEL SECURITY;

-- Aktifkan kebijakan Read/Write Publik untuk Anon & Authenticated Key
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access for all operations" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Public access for all operations" ON %I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;
