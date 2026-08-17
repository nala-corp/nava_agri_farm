import {
  Field,
  CropType,
  SOPTemplate,
  SOPVersion,
  SOPStage,
  SOPTask,
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
  AuditLog,
  SOPSnapshot,
  TaskSubmission
} from '../types';
import { SupabaseService } from './supabaseService';

const STORAGE_KEYS = {
  FIELDS: 'agrisop_fields',
  CROPS: 'agrisop_crops',
  SOPS: 'agrisop_sops',
  CYCLES: 'agrisop_cycles',
  TASKS: 'agrisop_tasks',
  MONITORING: 'agrisop_monitoring',
  PESTS: 'agrisop_pests',
  DISEASES: 'agrisop_diseases',
  PEST_OBS: 'agrisop_pest_obs',
  DISEASE_OBS: 'agrisop_disease_obs',
  INVENTORY: 'agrisop_inventory',
  INV_TX: 'agrisop_inv_tx',
  EXPENSES: 'agrisop_expenses',
  INCOME: 'agrisop_income',
  HARVESTS: 'agrisop_harvests',
  SETTINGS: 'agrisop_settings',
  AUDIT: 'agrisop_audit',
  ACTIVE_CYCLE: 'agrisop_active_cycle_id'
};

// INITIAL SEED DATA
const defaultSettings: SystemSettings = {
  farmName: 'Nusantara Agro Farm',
  ownerName: 'Pak Budi Hartono',
  currency: 'IDR',
  dateFormat: 'DD/MM/YYYY',
  language: 'id',
  autoInventoryDeduct: true,
  enableDeviationsLog: true,
  alertDaysAhead: 3,
};

const defaultFields: Field[] = [
  {
    id: 'f-01',
    name: 'Lahan A — Karanganyar',
    location: 'Karanganyar, Jawa Tengah (-7.598, 110.952)',
    areaM2: 2500,
    soilType: 'Lempung Berpasir (pH 6.2)',
    waterSource: 'Sumur Bor + Tandon Submersible',
    notes: 'Ketinggian 450 mdpl, drainase sangat baik, terpasang drip irrigation.',
    createdAt: '2026-01-10'
  },
  {
    id: 'f-02',
    name: 'Lahan B — Karanganyar',
    location: 'Karanganyar Blok Timur (-7.602, 110.960)',
    areaM2: 1800,
    soilType: 'Andosol Vulkanik (pH 6.5)',
    waterSource: 'Irigasi Teknis Sungai Bengawan Solo',
    notes: 'Tanah subur gembur, cocok untuk tanaman Solanaceae.',
    createdAt: '2026-02-15'
  },
  {
    id: 'f-03',
    name: 'Lahan C — Sukoharjo',
    location: 'Baki, Sukoharjo (-7.620, 110.820)',
    areaM2: 3200,
    soilType: 'Aluvial Subur (pH 6.8)',
    waterSource: 'Saluran Irigasi Primer',
    notes: 'Topografi datar, akses jalan truk mudah.',
    createdAt: '2026-03-01'
  },
  {
    id: 'f-04',
    name: 'Lahan D — Boyolali',
    location: 'Ampel, Boyolali (-7.480, 110.550)',
    areaM2: 4000,
    soilType: 'Latosol Merah (pH 5.9)',
    waterSource: 'Mata Air Pegunungan Merbabu',
    notes: 'Ketinggian 650 mdpl, udara sejuk pegunungan.',
    createdAt: '2026-04-12'
  }
];

const defaultCrops: CropType[] = [
  {
    id: 'crop-01',
    name: 'Cabai',
    icon: '🌶️',
    category: 'Solanaceae / Hortikultura',
    varieties: [
      {
        id: 'var-01',
        cropTypeId: 'crop-01',
        name: 'Cabai Rawit (Ori 212 / Kaliber)',
        seedProducer: 'Aura Seed',
        averageMaturityDays: 85,
        estimatedYieldPerPlantKg: 0.9,
        notes: 'Daya simpan tinggi, buah tegak lebat, tahan antraknosa.'
      },
      {
        id: 'var-02',
        cropTypeId: 'crop-01',
        name: 'Cabai Keriting (Kastilo / TM99)',
        seedProducer: 'East West Seed',
        averageMaturityDays: 90,
        estimatedYieldPerPlantKg: 1.1,
        notes: 'Buah padat merah mengkilap, tahan layu fusarium.'
      },
      {
        id: 'var-03',
        cropTypeId: 'crop-01',
        name: 'Cabai Merah Besar (Gada MK)',
        seedProducer: 'Cap Panah Merah',
        averageMaturityDays: 95,
        estimatedYieldPerPlantKg: 1.3,
        notes: 'Diameter besar 1.5 cm, pangkal buah kokoh.'
      }
    ]
  },
  {
    id: 'crop-02',
    name: 'Tomat',
    icon: '🍅',
    category: 'Solanaceae / Sayuran Buah',
    varieties: [
      {
        id: 'var-04',
        cropTypeId: 'crop-02',
        name: 'Tomat Servo F1',
        seedProducer: 'Cap Panah Merah',
        averageMaturityDays: 65,
        estimatedYieldPerPlantKg: 3.2,
        notes: 'Tahan Gemini Virus (virus kuning), daging buah tebal.'
      },
      {
        id: 'var-05',
        cropTypeId: 'crop-02',
        name: 'Tomat Tymoti F1',
        seedProducer: 'East West Seed',
        averageMaturityDays: 70,
        estimatedYieldPerPlantKg: 3.5,
        notes: 'Buah bulat oval keras, tahan transportasi jarak jauh.'
      }
    ]
  },
  {
    id: 'crop-03',
    name: 'Selada',
    icon: '🥬',
    category: 'Asteraceae / Sayuran Daun',
    varieties: [
      {
        id: 'var-06',
        cropTypeId: 'crop-03',
        name: 'Selada Grand Rapids',
        seedProducer: 'Known-You Seed',
        averageMaturityDays: 35,
        estimatedYieldPerPlantKg: 0.25,
        notes: 'Daun keriting bergelombang, rasa manis renyah.'
      },
      {
        id: 'var-07',
        cropTypeId: 'crop-03',
        name: 'Romaine Lettuce',
        seedProducer: 'Rijk Zwaan',
        averageMaturityDays: 45,
        estimatedYieldPerPlantKg: 0.35,
        notes: 'Batang tegak padat, tekstur renyah istimewa.'
      }
    ]
  },
  {
    id: 'crop-04',
    name: 'Sawi / Caisim',
    icon: '🌱',
    category: 'Brassicaceae / Sayuran Daun',
    varieties: [
      {
        id: 'var-08',
        cropTypeId: 'crop-04',
        name: 'Sawi Shinta Cap Panah Merah',
        seedProducer: 'Cap Panah Merah',
        averageMaturityDays: 28,
        estimatedYieldPerPlantKg: 0.2,
        notes: 'Batang renyah tidak berserat, lambat berbunga.'
      },
      {
        id: 'var-09',
        cropTypeId: 'crop-04',
        name: 'Pakcoy Nauli F1',
        seedProducer: 'Cap Panah Merah',
        averageMaturityDays: 25,
        estimatedYieldPerPlantKg: 0.22,
        notes: 'Tangkai daun lebar hijau tua seragam.'
      }
    ]
  },
  {
    id: 'crop-05',
    name: 'Mentimun',
    icon: '🥒',
    category: 'Cucurbitaceae',
    varieties: [
      {
        id: 'var-10',
        cropTypeId: 'crop-05',
        name: 'Mentimun Hercules F1',
        seedProducer: 'Bisi International',
        averageMaturityDays: 35,
        estimatedYieldPerPlantKg: 2.5,
        notes: 'Buah lurus silindris, rasa tidak pahit.'
      }
    ]
  },
  {
    id: 'crop-06',
    name: 'Melon',
    icon: '🍈',
    category: 'Cucurbitaceae',
    varieties: [
      {
        id: 'var-11',
        cropTypeId: 'crop-06',
        name: 'Melon Action 434 F1',
        seedProducer: 'Bisi International',
        averageMaturityDays: 60,
        estimatedYieldPerPlantKg: 2.2,
        notes: 'Net rapat tebal, Brix kemanisan 13-14%.'
      }
    ]
  },
  {
    id: 'crop-07',
    name: 'Semangka',
    icon: '🍉',
    category: 'Cucurbitaceae',
    varieties: [
      {
        id: 'var-12',
        cropTypeId: 'crop-07',
        name: 'Semangka Non-Biji Amara F1',
        seedProducer: 'Cap Panah Merah',
        averageMaturityDays: 62,
        estimatedYieldPerPlantKg: 7.0,
        notes: 'Daging buah merah tua padat dan renyah manis.'
      }
    ]
  }
];

const defaultInventory: InventoryItem[] = [
  {
    id: 'inv-01',
    name: 'NPK Mutiara 16-16-16',
    category: 'pupuk',
    unit: 'kg',
    currentStock: 450,
    minStockAlert: 100,
    unitPrice: 18000,
    brand: 'YaraMila',
    activeIngredients: 'N 16%, P2O5 16%, K2O 16%',
    storageLocation: 'Gudang Utama - Rak A1',
    isActive: true,
    updatedAt: '2026-08-01'
  },
  {
    id: 'inv-02',
    name: 'Pupuk Kandang Fermentasi Matang',
    category: 'pupuk',
    unit: 'kg',
    currentStock: 1800,
    minStockAlert: 500,
    unitPrice: 1200,
    brand: 'Lokal Organik',
    activeIngredients: 'Kotoran Kambing + Trichoderma + EM4',
    storageLocation: 'Gudang Terbuka Samping',
    isActive: true,
    updatedAt: '2026-08-01'
  },
  {
    id: 'inv-03',
    name: 'KNO3 Putih (Kalium Nitrat)',
    category: 'pupuk',
    unit: 'kg',
    currentStock: 85,
    minStockAlert: 25,
    unitPrice: 42000,
    brand: 'Pak Tani',
    activeIngredients: 'K2O 45%, N 13%',
    storageLocation: 'Gudang Utama - Rak A2',
    isActive: true,
    updatedAt: '2026-08-05'
  },
  {
    id: 'inv-04',
    name: 'Insektisida Agrimec 18 EC (Abamektin)',
    category: 'obat',
    unit: 'botol (100ml)',
    currentStock: 14,
    minStockAlert: 5,
    unitPrice: 95000,
    brand: 'Syngenta',
    activeIngredients: 'Abamektin 18 g/l',
    storageLocation: 'Lemari Khusus Pestisida (Terkunci)',
    isActive: true,
    updatedAt: '2026-08-08'
  },
  {
    id: 'inv-05',
    name: 'Fungisida Dithane M-45 80 WP (Mankozeb)',
    category: 'obat',
    unit: 'bungkus (1kg)',
    currentStock: 18,
    minStockAlert: 5,
    unitPrice: 135000,
    brand: 'Corteva',
    activeIngredients: 'Mankozeb 80%',
    storageLocation: 'Lemari Khusus Pestisida',
    isActive: true,
    updatedAt: '2026-08-08'
  },
  {
    id: 'inv-06',
    name: 'Mulsa Hitam Perak (Lebar 120cm)',
    category: 'bahan',
    unit: 'rol (500m)',
    currentStock: 6,
    minStockAlert: 2,
    unitPrice: 480000,
    brand: 'Bell Mulsa',
    storageLocation: 'Gudang Logistik',
    isActive: true,
    updatedAt: '2026-07-20'
  },
  {
    id: 'inv-07',
    name: 'Knapsack Sprayer Elektrik 16L',
    category: 'alat',
    unit: 'unit',
    currentStock: 4,
    minStockAlert: 1,
    unitPrice: 650000,
    brand: 'CBA Electric Pro',
    storageLocation: 'Ruang Peralatan',
    isActive: true,
    updatedAt: '2026-07-01'
  },
  {
    id: 'inv-08',
    name: 'pH & Moisture Meter Digital 4-in-1',
    category: 'alat',
    unit: 'unit',
    currentStock: 2,
    minStockAlert: 1,
    unitPrice: 220000,
    brand: 'Takemura / Digital Probe',
    storageLocation: 'Meja Kontrol',
    isActive: true,
    updatedAt: '2026-07-01'
  }
];

const defaultPests: PestType[] = [
  {
    id: 'pest-01',
    name: 'Thrips (Thrips parvispinus)',
    scientificName: 'Thrips parvispinus',
    targetCrops: ['Cabai', 'Tomat', 'Mentimun'],
    symptoms: 'Daun mengeriting ke atas, warna keperak-perakan di bagian bawah daun, pucuk kaku mengering.',
    recommendedTreatment: 'Semprot Abamektin 0.5-1.0 ml/l diselingi Imidakloprid. Pasang sticky trap kuning.',
    treatmentSteps: [
      {
        id: 'sop-thrips-01',
        stepNumber: 1,
        stageName: 'Pencegahan Awal (Vegetatif H+7 - H+20)',
        actionType: 'perangkap',
        treatmentName: 'Pemasangan Perangkap Lem Kuning (Yellow Sticky Trap)',
        recommendedProduct: 'Sticky Trap Kuning 20x25cm',
        activeIngredient: 'Atraktan Warna Kuning Gelombang 580nm',
        dosage: '40 - 50 lembar / hektar (dipasang sejajar tajuk tanaman)',
        applicationInterval: 'Ganti lembar jika sudah penuh serangga (tiap 2-3 minggu)',
        timingNotes: 'Dipasang sejak H+7 setelah tanam di sekeliling bedengan'
      },
      {
        id: 'sop-thrips-02',
        stepNumber: 2,
        stageName: 'Pengendalian Serangan Aktif (Ambang Kendali >1 ekor/pucuk)',
        actionType: 'spray',
        treatmentName: 'Spray Insektisida Kontak Lambung Abamektin',
        recommendedProduct: 'Agrimec 18 EC / Promectin 18 EC',
        activeIngredient: 'Abamektin 18 g/l',
        dosage: '0.5 - 0.75 ml / liter air (tambahkan perekat perata)',
        applicationInterval: 'Setiap 4 - 5 hari sekali pada sore hari',
        timingNotes: 'Semprot kabut halus mengarah ke bagian bawah daun pkl 16.00-17.30'
      },
      {
        id: 'sop-thrips-03',
        stepNumber: 3,
        stageName: 'Rotasi Bahan Aktif (Pencegahan Resistensi Hama)',
        actionType: 'spray',
        treatmentName: 'Spray Insektisida Sistemik Imidakloprid / Spinetoram',
        recommendedProduct: 'Confidor 200 SL / Radiant 120 SC',
        activeIngredient: 'Imidakloprid 200 g/l / Spinetoram 120 g/l',
        dosage: '0.5 ml / liter air',
        applicationInterval: 'Diselingi setelah 2 kali aplikasi abamektin',
        timingNotes: 'Penyemprotan merata ke seluruh pucuk tanaman muda'
      }
    ]
  },
  {
    id: 'pest-02',
    name: 'Kutu Daun (Aphids / Aphis gossypii)',
    scientificName: 'Aphis gossypii',
    targetCrops: ['Cabai', 'Tomat', 'Sawi', 'Selada'],
    symptoms: 'Daun menggulung ke bawah, timbul embun jelaga hitam pekat, pertumbuhan tanaman kerdil.',
    recommendedTreatment: 'Semprot insektisida berbahan aktif Asetamiprid atau Piriproksifen diselingi deterjen/sabun kalium.',
    treatmentSteps: [
      {
        id: 'sop-aphids-01',
        stepNumber: 1,
        stageName: 'Sanitasi & Monitoring Rutin',
        actionType: 'sanitasi',
        treatmentName: 'Pembersihan Gulma Inang & Rempes Daun Terinfeksi Parah',
        recommendedProduct: 'Alat Gunting / Sanitasi Manual',
        dosage: 'Pangkas bagian pucuk daun yang berkerumun kutu pekat dan musnahkan',
        applicationInterval: 'Setiap kali jadwal pemantauan mingguan',
        timingNotes: 'Lakukan sebelum kutu kebul/aphid bersayap terbang menyebar'
      },
      {
        id: 'sop-aphids-02',
        stepNumber: 2,
        stageName: 'Aplikasi Kuratif Cepat',
        actionType: 'spray',
        treatmentName: 'Spray Asetamiprid + Perekat Penembus',
        recommendedProduct: 'Mospilan 20 SP / Winder 25 WP',
        activeIngredient: 'Asetamiprid 20% / Imidakloprid 25%',
        dosage: '0.75 - 1.0 gram / liter air',
        applicationInterval: 'Aplikasi 2 kali selang 5 hari',
        timingNotes: 'Semprotkan pada permukaan bawah daun tempat kutu berkoloni'
      }
    ]
  },
  {
    id: 'pest-03',
    name: 'Tungau Merah (Polyphagotarsonemus latus)',
    scientificName: 'Tetranychus urticae',
    targetCrops: ['Cabai', 'Tomat', 'Melon'],
    symptoms: 'Daun melengkung ke bawah seperti sendok terbalik, warna tembaga kecokelatan mengkilap dan kaku.',
    recommendedTreatment: 'Akarisida Piridaben / Propargit 1.5 ml/l, sanitasi gulma di sekitar bedengan.',
    treatmentSteps: [
      {
        id: 'sop-mite-01',
        stepNumber: 1,
        stageName: 'Pengendalian Tungau Spesifik',
        actionType: 'spray',
        treatmentName: 'Spray Akarisida Piridaben / Heksitiazoks',
        recommendedProduct: 'Samite 135 EC / Pegasus 500 SC',
        activeIngredient: 'Piridaben 135 g/l / Diafentiuron 500 g/l',
        dosage: '1.0 - 1.5 ml / liter air',
        applicationInterval: 'Aplikasi saat pagi hari sebelum terik pkl 06.30 - 08.30',
        timingNotes: 'Wajib basahi seluruh tajuk dan balik daun secara menyeluruh'
      }
    ]
  },
  {
    id: 'pest-04',
    name: 'Ulat Grayak (Spodoptera litura)',
    scientificName: 'Spodoptera litura',
    targetCrops: ['Cabai', 'Tomat', 'Sawi', 'Selada'],
    symptoms: 'Daun berlubang tidak beraturan hingga tersisa tulang daun, kotoran ulat menempel di sela daun.',
    recommendedTreatment: 'Emamektin benzoat atau Bacillus thuringiensis (Bt) saat sore / malam hari.',
    treatmentSteps: [
      {
        id: 'sop-ulat-01',
        stepNumber: 1,
        stageName: 'Pengendalian Ulat Larva Instar 1-3',
        actionType: 'spray',
        treatmentName: 'Spray Insektisida Biologis / Emamektin Benzoat',
        recommendedProduct: 'Proclaim 5 SG / Prevathon 50 SC',
        activeIngredient: 'Emamektin Benzoat 5% / Klorantraniliprol 50 g/l',
        dosage: '0.3 - 0.5 gram / liter air (Proclaim) atau 1.5 ml/l (Prevathon)',
        applicationInterval: 'Aplikasi sore/senja hari saat ulat aktif keluar makan',
        timingNotes: 'Ulat aktif keluar malam hari, semprot tepat sasaran ke daun dan batang'
      }
    ]
  },
  {
    id: 'pest-05',
    name: 'Lalat Buah (Bactrocera dorsalis)',
    scientificName: 'Bactrocera dorsalis',
    targetCrops: ['Cabai', 'Tomat', 'Melon', 'Semangka'],
    symptoms: 'Titik hitam bekas sengatan ovipositor pada buah, buah busuk basah berair dan gugur dini.',
    recommendedTreatment: 'Perangkap atraktan Metil Eugenol (Petrogenol) di batas kebun + spray umpan protein.',
    treatmentSteps: [
      {
        id: 'sop-lalat-01',
        stepNumber: 1,
        stageName: 'Perangkap Atraktan Luar Kebun (Fase Bunga & Buah)',
        actionType: 'perangkap',
        treatmentName: 'Pemasangan Botol Perangkap Petrogenol (Metil Eugenol)',
        recommendedProduct: 'Petrogenol 800 L Atraktan Lalat Buah',
        activeIngredient: 'Metil Eugenol 800 g/l',
        dosage: '0.25 ml diteteskan pada kapas / pilin kain di dalam botol',
        applicationInterval: 'Isi ulang tetesan kapas setiap 10-14 hari sekali',
        timingNotes: 'Pasang di pohon pelindung / pagar luar kebun, JANGAN dipasang di tengah bedengan tanaman'
      }
    ]
  }
];

const defaultDiseases: DiseaseType[] = [
  {
    id: 'dis-01',
    name: 'Antraknosa / Patek (Colletotrichum capsici)',
    pathogenType: 'fungus',
    targetCrops: ['Cabai', 'Tomat'],
    symptoms: 'Bercak melingkar cekung konsentris pada buah matang/muda, terdapat bintik spora hitam di tengah.',
    recommendedTreatment: 'Fungisida Mankozeb 2 g/l berselang Difenokonazol + Azoksistrobin, petik buah sakit dan musnahkan.',
    treatmentSteps: [
      {
        id: 'sop-patek-01',
        stepNumber: 1,
        stageName: 'Sanitasi Buah & Pencegahan Kelembaban',
        actionType: 'sanitasi',
        treatmentName: 'Pemetikan & Pemusnahan Buah Terinfeksi (Sanitasi Total)',
        recommendedProduct: 'Kantong Sampah Khusus + Bakar/Kubur',
        dosage: 'Petik semua buah bergejala patek setiap 2 hari sekali',
        applicationInterval: 'Rutin selama musim panen dan hujan',
        timingNotes: 'Jangan letakkan buah patek di parit bedengan karena spora menular lewat percikan air'
      },
      {
        id: 'sop-patek-02',
        stepNumber: 2,
        stageName: 'Proteksi Kontak Permukaan',
        actionType: 'spray',
        treatmentName: 'Spray Fungisida Kontak Mankozeb / Klorotalonil',
        recommendedProduct: 'Dithane M-45 80 WP / Daconil 75 WP',
        activeIngredient: 'Mankozeb 80% / Klorotalonil 75%',
        dosage: '2.0 - 2.5 gram / liter air (tambahkan perekat anti-cuci hujan)',
        applicationInterval: 'Tiap 5 hari di musim kemarau, tiap 3 hari di musim hujan',
        timingNotes: 'Aplikasi pagi hari setelah embun kering pkl 07.30 - 09.30'
      },
      {
        id: 'sop-patek-03',
        stepNumber: 3,
        stageName: 'Pengendalian Sistemik Penyembuhan',
        actionType: 'spray',
        treatmentName: 'Spray Fungisida Sistemik Azoksistrobin + Difenokonazol',
        recommendedProduct: 'Amistartop 325 SC / Score 250 EC',
        activeIngredient: 'Azoksistrobin 200 g/l + Difenokonazol 125 g/l',
        dosage: '0.5 - 1.0 ml / liter air',
        applicationInterval: 'Diselingi bergantian dengan fungisida kontak',
        timingNotes: 'Penyemprotan terarah ke dompolan buah dan daun atas'
      }
    ]
  },
  {
    id: 'dis-02',
    name: 'Layu Bakteri (Ralstonia solanacearum)',
    pathogenType: 'bacteria',
    targetCrops: ['Cabai', 'Tomat'],
    symptoms: 'Daun layu mendadak saat siang terik namun batang tetap hijau segar. Uji rendam pangkal batang di air bening mengeluarkan lendir putih berkabut.',
    recommendedTreatment: 'Cabut dan bakar tanaman sakit, kocor bakterisida tembaga hidroksida + asam humat pada lubang sekitar.',
    treatmentSteps: [
      {
        id: 'sop-layu-01',
        stepNumber: 1,
        stageName: 'Eradikasi Tanaman Sakit',
        actionType: 'sanitasi',
        treatmentName: 'Pencabutan Tanaman Sakit Beserta Tanah Perakaran',
        recommendedProduct: 'Eradikasi Manual + Bakar',
        dosage: 'Cabut hati-hati jangan sampai tanah berhamburan ke lubang tanam tetangga',
        applicationInterval: 'Segera begitu terdeteksi gejala layu bakteri',
        timingNotes: 'Taburi lubang bekas tanaman sakit dengan kapur dolomit 50g'
      },
      {
        id: 'sop-layu-02',
        stepNumber: 2,
        stageName: 'Kocor Pengamanan Blok Sekitar (Ring Treatment)',
        actionType: 'kocor',
        treatmentName: 'Kocor Bakterisida Tembaga Hidroksida / Streptomisin Sulfat',
        recommendedProduct: 'Kocide 54 WDG / Agrept 20 WP',
        activeIngredient: 'Tembaga Hidroksida 54% / Streptomisin Sulfat 20%',
        dosage: '1.5 - 2.0 gram / liter air (200 ml larutan per lubang tanam)',
        applicationInterval: 'Kocor 5 lubang tanaman di sekeliling tanaman yang terserang',
        timingNotes: 'Aplikasi pagi hari pada zona perakaran basah'
      }
    ]
  },
  {
    id: 'dis-03',
    name: 'Virus Kuning / Gemini Virus (Pepper Yellow Leaf Curl)',
    pathogenType: 'virus',
    targetCrops: ['Cabai', 'Tomat'],
    symptoms: 'Urat daun menguning jelas, helai daun mengecil melengkung kaku mangkok, tanaman kerdil tidak berbuah.',
    recommendedTreatment: 'Kendalikan vektor Kutu Kebul (Bemisia tabaci) menggunakan abamektin, asetamiprid, pupuk mikro seng & mulsa perak.',
    treatmentSteps: [
      {
        id: 'sop-gemini-01',
        stepNumber: 1,
        stageName: 'Pengendalian Vektor Serangga Penular (Kutu Kebul)',
        actionType: 'spray',
        treatmentName: 'Spray Insektisida Sistemik Asetamiprid / Piriproksifen',
        recommendedProduct: 'Admiral 50 EC / Mospilan 20 SP',
        activeIngredient: 'Piriproksifen 50 g/l / Asetamiprid 20%',
        dosage: '0.75 ml / liter air',
        applicationInterval: 'Setiap 5 - 7 hari sejak masa bibit hingga H+35',
        timingNotes: 'Aplikasi diarahkan ke balik daun tempat kutu kebul bersarang'
      },
      {
        id: 'sop-gemini-02',
        stepNumber: 2,
        stageName: 'Penguatan Imunitas Tanaman Terpapar',
        actionType: 'spray',
        treatmentName: 'Spray Pupuk Daun Mikro Seng (Zinc) + Asam Amino',
        recommendedProduct: 'Mikro Chelated Zinc + Aminosan',
        dosage: '1.0 ml / liter air',
        applicationInterval: 'Aplikasi 7 hari sekali untuk memicu klorofil daun baru',
        timingNotes: 'Disemprot pagi hari bersamaan dengan perekat non-ionik'
      }
    ]
  },
  {
    id: 'dis-04',
    name: 'Bercak Daun Cercospora (Cercospora capsici)',
    pathogenType: 'fungus',
    targetCrops: ['Cabai', 'Sawi', 'Tomat'],
    symptoms: 'Bercak bulat kelabu di tengah dengan pinggiran cokelat gelap tebal mirip mata katak (frogeye).',
    recommendedTreatment: 'Semprot fungisida Klorotalonil / Heksakonazol secara teratur saat cuaca lembab.',
    treatmentSteps: [
      {
        id: 'sop-cercos-01',
        stepNumber: 1,
        stageName: 'Pengendalian Kuratif Bercak Daun',
        actionType: 'spray',
        treatmentName: 'Spray Fungisida Sistemik Difenokonazol / Heksakonazol',
        recommendedProduct: 'Score 250 EC / Anvil 50 SC',
        activeIngredient: 'Difenokonazol 250 g/l / Heksakonazol 50 g/l',
        dosage: '0.5 - 0.75 ml / liter air',
        applicationInterval: 'Aplikasi tiap 5-7 hari',
        timingNotes: 'Semprot menyeluruh ke daun bawah dan tengah tajuk'
      }
    ]
  }
];

// SOP TEMPLATES
const defaultSOPCabaiV21: SOPTemplate = {
  id: 'sop-cabai',
  name: 'SOP Budidaya Cabai Intensif Presisi V2.1',
  cropTypeId: 'crop-01',
  cropTypeName: 'Cabai',
  description: 'Standar Operasional Prosedur budidaya cabai dari persiapan lahan hingga panen berkala 120 HST dengan validasi dosis dan monitoring kesehatan harian.',
  activeVersionId: 'ver-cabai-v2.1',
  createdAt: '2026-06-01',
  versions: [
    {
      id: 'ver-cabai-v2.0',
      templateId: 'sop-cabai',
      versionNumber: 'V2.0',
      status: 'archived',
      changelog: 'Versi rilis standar budidaya cabai musim kemarau.',
      createdAt: '2026-06-01',
      publishedAt: '2026-06-05',
      stages: []
    },
    {
      id: 'ver-cabai-v2.1',
      templateId: 'sop-cabai',
      versionNumber: 'V2.1',
      status: 'published',
      changelog: 'Penambahan standar kelembaban tanah H+7, validasi dosis NPK vegetatif, dan wajib upload foto tanaman bermasalah.',
      createdAt: '2026-07-15',
      publishedAt: '2026-07-18',
      stages: [
        {
          id: 'stg-01',
          sopVersionId: 'ver-cabai-v2.1',
          name: '1. Pengolahan Lahan & Dasar',
          order: 1,
          targetStartDay: -21,
          targetEndDay: -7,
          description: 'Pembersihan gulma, pembajakan, dolomit, dan pemupukan dasar.',
          tasks: [
            {
              id: 'tsk-01',
              stageId: 'stg-01',
              name: 'Pembersihan & Pembajakan Tanah',
              taskType: 'checklist',
              targetDayOffset: -21,
              targetTime: '08:00',
              description: 'Bersihkan sisa tanaman sebelumnya, bajak tanah kedalaman 30cm dan tabur kapur dolomit 100g/m2 jika pH < 6.0.',
              priority: 'high',
              order: 1,
              fields: [
                {
                  id: 'fld-01',
                  name: 'soil_ph',
                  label: 'Hasil Cek pH Tanah Awal',
                  type: 'number',
                  unit: 'pH',
                  required: true,
                  sopStandardMin: 6.0,
                  sopStandardMax: 7.0,
                  description: 'Standar pH ideal cabai adalah 6.0 - 7.0.'
                },
                {
                  id: 'fld-02',
                  name: 'dolomit_applied_kg',
                  label: 'Jumlah Kapur Dolomit Ditebar',
                  type: 'number',
                  unit: 'kg',
                  required: false
                }
              ],
              validationRules: [
                {
                  fieldId: 'fld-01',
                  ruleType: 'min_max',
                  minValue: 5.5,
                  maxValue: 7.2,
                  warningMessage: 'pH tanah berada di luar rentang optimal (5.5 - 7.2)! Lakukan penyesuaian dolomit.',
                  blockOnFailure: false
                }
              ]
            },
            {
              id: 'tsk-02',
              stageId: 'stg-01',
              name: 'Aplikasi Pupuk Dasar Organik & NPK',
              taskType: 'fertilization',
              targetDayOffset: -14,
              targetTime: '09:00',
              description: 'Tebarkan pupuk kandang matang terfermentasi dan NPK dasar pada bedengan.',
              priority: 'high',
              linkedInventoryItemId: 'inv-02',
              defaultInventoryDosePerPlant: 0.2, // 200g per lubang
              order: 2,
              fields: [
                {
                  id: 'fld-03',
                  name: 'pukan_total_kg',
                  label: 'Total Pupuk Kandang Diaplikasikan',
                  type: 'number',
                  unit: 'kg',
                  required: true
                },
                {
                  id: 'fld-04',
                  name: 'npk_dasar_kg',
                  label: 'Total NPK Dasar',
                  type: 'number',
                  unit: 'kg',
                  required: true,
                  sopStandardMin: 20,
                  sopStandardMax: 50
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-03',
              stageId: 'stg-01',
              name: 'Pemasangan Mulsa & Pelubangan',
              taskType: 'maintenance',
              targetDayOffset: -7,
              targetTime: '07:30',
              description: 'Tarik mulsa hitam perak saat terik matahari siang, buat lubang tanam jarak 50cm x 60cm pola zig-zag.',
              priority: 'medium',
              order: 3,
              fields: [
                {
                  id: 'fld-05',
                  name: 'bedengan_count',
                  label: 'Jumlah Bedengan Siap',
                  type: 'number',
                  required: true
                },
                {
                  id: 'fld-06',
                  name: 'lubang_tanam_count',
                  label: 'Total Lubang Tanam Terbentuk',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-02',
          sopVersionId: 'ver-cabai-v2.1',
          name: '2. Penanaman (H-0)',
          order: 2,
          targetStartDay: 0,
          targetEndDay: 0,
          description: 'Pindah tanam bibit sehat usia 21-25 HSS pada sore hari.',
          tasks: [
            {
              id: 'tsk-04',
              stageId: 'stg-02',
              name: 'Pindah Tanam Bibit Cabai (H-0)',
              taskType: 'planting',
              targetDayOffset: 0,
              targetTime: '15:30',
              description: 'Tanam bibit dengan media polybag utuh. Siram lubang tanam dengan larutan fungisida/bakterisida konsentrasi rendah.',
              priority: 'critical',
              order: 1,
              fields: [
                {
                  id: 'fld-07',
                  name: 'plants_planted',
                  label: 'Jumlah Bibit Ditanam',
                  type: 'number',
                  unit: 'pohon',
                  required: true
                },
                {
                  id: 'fld-08',
                  name: 'seedling_condition',
                  label: 'Kondisi Bibit',
                  type: 'select',
                  options: ['Sangat Segar & Kokoh', 'Cukup Baik', 'Ada Beberapa Layu'],
                  required: true
                },
                {
                  id: 'fld-09',
                  name: 'photo',
                  label: 'Foto Dokumentasi Penanaman',
                  type: 'photo',
                  required: false
                }
              ],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-03',
          sopVersionId: 'ver-cabai-v2.1',
          name: '3. Pasca Tanam & Penyulaman (H+1 - H+14)',
          order: 3,
          targetStartDay: 1,
          targetEndDay: 14,
          description: 'Penyiraman intensif, adaptasi akar, monitoring kelayuan, penyulaman bibit mati.',
          tasks: [
            {
              id: 'tsk-05',
              stageId: 'stg-03',
              name: 'Monitoring Adaptasi & Penyiraman H+3',
              taskType: 'monitoring',
              targetDayOffset: 3,
              targetTime: '08:00',
              description: 'Cek kondisi adaptasi akar dan tanaman yang layu setelah tanam.',
              priority: 'high',
              order: 1,
              fields: [
                {
                  id: 'fld-10',
                  name: 'plants_inspected',
                  label: 'Jumlah Tanaman Disurvei',
                  type: 'number',
                  unit: 'tanaman',
                  required: true
                },
                {
                  id: 'fld-11',
                  name: 'healthy_count',
                  label: 'Tanaman Sehat Tegak',
                  type: 'number',
                  unit: 'tanaman',
                  required: true
                },
                {
                  id: 'fld-12',
                  name: 'dead_or_wilted',
                  label: 'Tanaman Mati / Layu',
                  type: 'number',
                  unit: 'tanaman',
                  required: true
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-06',
              stageId: 'stg-03',
              name: 'Penyulaman Bibit & Pemasangan Ajir H+7',
              taskType: 'maintenance',
              targetDayOffset: 7,
              targetTime: '07:00',
              description: 'Sulam bibit yang mati/kerdil (maksimal H+7). Pasang ajir bambu 150cm sedalam 20cm di samping tanaman.',
              priority: 'high',
              order: 2,
              fields: [
                {
                  id: 'fld-13',
                  name: 'sulaman_count',
                  label: 'Jumlah Bibit Disulam',
                  type: 'number',
                  unit: 'tanaman',
                  required: true,
                  sopStandardMax: 150
                },
                {
                  id: 'fld-14',
                  name: 'ajir_installed',
                  label: 'Persentase Ajir Terpasang (%)',
                  type: 'number',
                  unit: '%',
                  required: true,
                  sopStandardMin: 90
                }
              ],
              validationRules: [
                {
                  fieldId: 'fld-13',
                  ruleType: 'min_max',
                  maxValue: 250,
                  warningMessage: 'Tingkat kematian/sulaman melebihi 5%! Evaluasi kelembaban tanah dan hama uret.',
                  blockOnFailure: false
                }
              ]
            },
            {
              id: 'tsk-07',
              stageId: 'stg-03',
              name: 'Pemupukan Kocor Vegetatif Awal H+14',
              taskType: 'fertilization',
              targetDayOffset: 14,
              targetTime: '08:30',
              description: 'Kocor larutan NPK 16-16-16 dosis 3 gram/tanaman (3 kg NPK dilarutkan dalam 200 liter air untuk 1000 tanaman).',
              priority: 'high',
              linkedInventoryItemId: 'inv-01',
              defaultInventoryDosePerPlant: 0.003, // 3 gram
              order: 3,
              fields: [
                {
                  id: 'fld-15',
                  name: 'npk_used_kg',
                  label: 'Jumlah NPK Dipakai',
                  type: 'number',
                  unit: 'kg',
                  required: true,
                  sopStandardMin: 12,
                  sopStandardMax: 18,
                  sopStandardExpected: 15
                },
                {
                  id: 'fld-16',
                  name: 'water_volume_liter',
                  label: 'Volume Air Pelarut',
                  type: 'number',
                  unit: 'liter',
                  required: true
                },
                {
                  id: 'fld-17',
                  name: 'notes',
                  label: 'Catatan Aplikasi',
                  type: 'textarea',
                  required: false
                }
              ],
              validationRules: [
                {
                  fieldId: 'fld-15',
                  ruleType: 'min_max',
                  minValue: 10,
                  maxValue: 20,
                  warningMessage: 'Dosis NPK di luar rekomendasi SOP (12-18 kg)! Dosis berlebih berisiko membakar akar muda.',
                  blockOnFailure: false
                }
              ]
            }
          ]
        },
        {
          id: 'stg-04',
          sopVersionId: 'ver-cabai-v2.1',
          name: '4. Fase Vegetatif Aktif & Pengendalian Hama (H+15 - H+35)',
          order: 4,
          targetStartDay: 15,
          targetEndDay: 35,
          description: 'Perempelan tunas air, pengikatan batang ke ajir, spray pencegahan thrips & antraknosa.',
          tasks: [
            {
              id: 'tsk-08',
              stageId: 'stg-04',
              name: 'Monitoring Kesehatan & Hama Terpadu H+21',
              taskType: 'monitoring',
              targetDayOffset: 21,
              targetTime: '08:00',
              description: 'Lakukan sampling 50 tanaman per blok. Amati keberadaan thrips, tungau, dan bercak daun cercospora.',
              priority: 'critical',
              order: 1,
              fields: [
                {
                  id: 'fld-18',
                  name: 'sample_plants',
                  label: 'Jumlah Tanaman Sampling',
                  type: 'number',
                  required: true,
                  sopStandardExpected: 100
                },
                {
                  id: 'fld-19',
                  name: 'healthy_plants',
                  label: 'Tanaman Sehat Normal',
                  type: 'number',
                  required: true
                },
                {
                  id: 'fld-20',
                  name: 'thrips_found',
                  label: 'Tanaman Ada Gejala Thrips',
                  type: 'number',
                  required: true
                },
                {
                  id: 'fld-21',
                  name: 'avg_height_cm',
                  label: 'Rata-rata Tinggi Tanaman',
                  type: 'number',
                  unit: 'cm',
                  required: true,
                  sopStandardMin: 30,
                  sopStandardMax: 50
                },
                {
                  id: 'fld-22',
                  name: 'photo',
                  label: 'Foto Sampel Tajuk & Daun',
                  type: 'photo',
                  required: false
                }
              ],
              validationRules: [
                {
                  fieldId: 'fld-20',
                  ruleType: 'min_max',
                  maxValue: 5,
                  warningMessage: 'Gejala thrips ditemukan pada >5 tanaman sampling! Segera lakukan penyemprotan abamektin sore ini.',
                  blockOnFailure: false
                }
              ]
            },
            {
              id: 'tsk-09',
              stageId: 'stg-04',
              name: 'Perempelan Tunas Air di Bawah Cabang Y H+25',
              taskType: 'maintenance',
              targetDayOffset: 25,
              targetTime: '07:30',
              description: 'Rempes semua tunas samping di ketiak daun bawah sebelum cabang utama Y terbentuk agar nutrisi terfokus ke atas.',
              priority: 'medium',
              order: 2,
              fields: [
                {
                  id: 'fld-23',
                  name: 'completion_percent',
                  label: 'Persentase Blok Selesai Dirempes (%)',
                  type: 'number',
                  unit: '%',
                  required: true
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-10',
              stageId: 'stg-04',
              name: 'Pemupukan Susulan Kocor H+28',
              taskType: 'fertilization',
              targetDayOffset: 28,
              targetTime: '08:30',
              description: 'Kocor NPK 16-16-16 (5g/tanaman) + Asam Humat untuk merangsang percabangan generatif.',
              priority: 'high',
              linkedInventoryItemId: 'inv-01',
              defaultInventoryDosePerPlant: 0.005,
              order: 3,
              fields: [
                {
                  id: 'fld-24',
                  name: 'npk_amount_kg',
                  label: 'Total NPK Diaplikasikan',
                  type: 'number',
                  unit: 'kg',
                  required: true,
                  sopStandardMin: 20,
                  sopStandardMax: 30
                }
              ],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-05',
          sopVersionId: 'ver-cabai-v2.1',
          name: '5. Fase Pembungaan & Generatif Awal (H+36 - H+60)',
          order: 5,
          targetStartDay: 36,
          targetEndDay: 60,
          description: 'Aplikasi pupuk tinggi Kalium & Fosfat (KNO3 putih), pencegahan kerontokan bunga dan lalat buah.',
          tasks: [
            {
              id: 'tsk-11',
              stageId: 'stg-05',
              name: 'Aplikasi KNO3 Putih & Kalsium Boron H+42',
              taskType: 'fertilization',
              targetDayOffset: 42,
              targetTime: '08:00',
              description: 'Semprot / kocor pupuk penguat bunga KNO3 putih untuk mencegah rontok bunga.',
              priority: 'high',
              linkedInventoryItemId: 'inv-03',
              order: 1,
              fields: [
                {
                  id: 'fld-25',
                  name: 'kno3_kg',
                  label: 'Jumlah KNO3 Putih',
                  type: 'number',
                  unit: 'kg',
                  required: true,
                  sopStandardMin: 8,
                  sopStandardMax: 15
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-12',
              stageId: 'stg-05',
              name: 'Pemasangan Perangkap Lalat Buah (Metil Eugenol) H+50',
              taskType: 'pest_treatment',
              targetDayOffset: 50,
              targetTime: '09:00',
              description: 'Pasang botol perangkap berisi petrogenol 15 titik di sekeliling luar kebun.',
              priority: 'high',
              order: 2,
              fields: [
                {
                  id: 'fld-26',
                  name: 'traps_installed',
                  label: 'Jumlah Titik Perangkap Terpasang',
                  type: 'number',
                  required: true,
                  sopStandardMin: 12
                }
              ],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-06',
          sopVersionId: 'ver-cabai-v2.1',
          name: '6. Fase Panen & Pasca Panen Berkala (H+80 - H+120)',
          order: 6,
          targetStartDay: 80,
          targetEndDay: 120,
          description: 'Pemetikan buah masak petik 80-90% merah, sortasi grade A/B/C, dan pencatatan hasil panen.',
          tasks: [
            {
              id: 'tsk-13',
              stageId: 'stg-06',
              name: 'Panen Perdana Cabai Merah H+85',
              taskType: 'harvest',
              targetDayOffset: 85,
              targetTime: '06:30',
              description: 'Petik buah bersama tangkainya pada pagi hari saat embun sudah kering. Pisahkan buah reject antraknosa.',
              priority: 'critical',
              order: 1,
              fields: [
                {
                  id: 'fld-27',
                  name: 'grade_a_kg',
                  label: 'Berat Grade A (Super Mulus)',
                  type: 'number',
                  unit: 'kg',
                  required: true
                },
                {
                  id: 'fld-28',
                  name: 'grade_b_kg',
                  label: 'Berat Grade B (Medium)',
                  type: 'number',
                  unit: 'kg',
                  required: true
                },
                {
                  id: 'fld-29',
                  name: 'reject_kg',
                  label: 'Berat BS / Reject',
                  type: 'number',
                  unit: 'kg',
                  required: true
                },
                {
                  id: 'fld-30',
                  name: 'buyer_name',
                  label: 'Nama Pembeli / Pengepul',
                  type: 'text',
                  required: false
                }
              ],
              validationRules: []
            }
          ]
        }
      ]
    }
  ]
};

const defaultSOPTomatV1: SOPTemplate = {
  id: 'sop-tomat',
  name: 'SOP Budidaya Tomat Dataran Rendah-Menengah V1.0',
  cropTypeId: 'crop-02',
  cropTypeName: 'Tomat',
  description: 'Prosedur standar budidaya tomat tahan virus (Servo/Tymoti) dengan pemangkasan pucuk dan pengendalian lalat buah.',
  activeVersionId: 'ver-tomat-v1.0',
  createdAt: '2026-06-10',
  versions: [
    {
      id: 'ver-tomat-v1.0',
      templateId: 'sop-tomat',
      versionNumber: 'V1.0',
      status: 'published',
      changelog: 'Versi rilis inisial tomat servo.',
      createdAt: '2026-06-10',
      publishedAt: '2026-06-12',
      stages: [
        {
          id: 'stg-tom-01',
          sopVersionId: 'ver-tomat-v1.0',
          name: '1. Persiapan Lahan & Tanam',
          order: 1,
          targetStartDay: -14,
          targetEndDay: 0,
          tasks: [
            {
              id: 'tsk-tom-01',
              stageId: 'stg-tom-01',
              name: 'Pemupukan Dasar & Pasang Mulsa',
              taskType: 'fertilization',
              targetDayOffset: -7,
              targetTime: '08:00',
              description: 'Aplikasi pupuk organik 200g/tanaman dan NPK 16-16-16.',
              priority: 'high',
              order: 1,
              fields: [
                {
                  id: 'fld-t1',
                  name: 'organic_kg',
                  label: 'Pupuk Kandang (kg)',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-tom-02',
              stageId: 'stg-tom-01',
              name: 'Pindah Tanam Bibit Tomat H-0',
              taskType: 'planting',
              targetDayOffset: 0,
              targetTime: '15:00',
              description: 'Pindah tanam bibit tomat sehat usia 18-21 HSS.',
              priority: 'critical',
              order: 2,
              fields: [
                {
                  id: 'fld-t2',
                  name: 'plants_count',
                  label: 'Jumlah Bibit',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-tom-02',
          sopVersionId: 'ver-tomat-v1.0',
          name: '2. Pemeliharaan & Pewiwitan (H+1 - H+30)',
          order: 2,
          targetStartDay: 1,
          targetEndDay: 30,
          tasks: [
            {
              id: 'tsk-tom-03',
              stageId: 'stg-tom-02',
              name: 'Pemasangan Ajir & Wiwit Tunas Air H+10',
              taskType: 'maintenance',
              targetDayOffset: 10,
              targetTime: '07:30',
              description: 'Pasang ajir bambu 180cm, buang tunas air liar sisakan 2 batang utama.',
              priority: 'high',
              order: 1,
              fields: [
                {
                  id: 'fld-t3',
                  name: 'done_percent',
                  label: 'Selesai (%)',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-tom-04',
              stageId: 'stg-tom-02',
              name: 'Monitoring Hama Ulat & Kutu Kebul H+20',
              taskType: 'monitoring',
              targetDayOffset: 20,
              targetTime: '08:00',
              description: 'Periksa daun bawah dari potensi hama kutu kebul vektor virus.',
              priority: 'high',
              order: 2,
              fields: [
                {
                  id: 'fld-t4',
                  name: 'inspected',
                  label: 'Tanaman Diinspeksi',
                  type: 'number',
                  required: true
                },
                {
                  id: 'fld-t5',
                  name: 'healthy',
                  label: 'Tanaman Sehat',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-tom-03',
          sopVersionId: 'ver-tomat-v1.0',
          name: '3. Pembungaan & Panen (H+40 - H+75)',
          order: 3,
          targetStartDay: 40,
          targetEndDay: 75,
          tasks: [
            {
              id: 'tsk-tom-05',
              stageId: 'stg-tom-03',
              name: 'Kocor KNO3 Putih & Kalsium H+42',
              taskType: 'fertilization',
              targetDayOffset: 42,
              targetTime: '08:00',
              description: 'Cegah busuk ujung buah (blossom end rot) dengan kalsium dan kalium.',
              priority: 'high',
              order: 1,
              fields: [
                {
                  id: 'fld-t6',
                  name: 'kno3_kg',
                  label: 'Dosis KNO3 (kg)',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            },
            {
              id: 'tsk-tom-06',
              stageId: 'stg-tom-03',
              name: 'Panen Tomat Putaran 1 H+65',
              taskType: 'harvest',
              targetDayOffset: 65,
              targetTime: '07:00',
              description: 'Petik buah tomat yang sudah semburat merah oranye.',
              priority: 'critical',
              order: 2,
              fields: [
                {
                  id: 'fld-t7',
                  name: 'total_kg',
                  label: 'Total Panen (kg)',
                  type: 'number',
                  required: true
                }
              ],
              validationRules: []
            }
          ]
        }
      ]
    }
  ]
};

const defaultSOPSeladaV1: SOPTemplate = {
  id: 'sop-selada',
  name: 'SOP Budidaya Selada / Sayuran Daun Cepat Panen V1.0',
  cropTypeId: 'crop-03',
  cropTypeName: 'Selada',
  description: 'Standar budidaya selada krop / daun 35-40 HSS dengan pupuk organik cair dan fertigasi.',
  activeVersionId: 'ver-selada-v1.0',
  createdAt: '2026-06-20',
  versions: [
    {
      id: 'ver-selada-v1.0',
      templateId: 'sop-selada',
      versionNumber: 'V1.0',
      status: 'published',
      changelog: 'Versi rilis selada grand rapids.',
      createdAt: '2026-06-20',
      publishedAt: '2026-06-22',
      stages: [
        {
          id: 'stg-sel-01',
          sopVersionId: 'ver-selada-v1.0',
          name: '1. Semai & Pindah Tanam',
          order: 1,
          targetStartDay: -10,
          targetEndDay: 0,
          tasks: [
            {
              id: 'tsk-sel-01',
              stageId: 'stg-sel-01',
              name: 'Pindah Tanam Semai 10 HSS',
              taskType: 'planting',
              targetDayOffset: 0,
              targetTime: '16:00',
              description: 'Pindahkan bibit daun 3-4 helai ke bedengan.',
              priority: 'high',
              order: 1,
              fields: [],
              validationRules: []
            }
          ]
        },
        {
          id: 'stg-sel-02',
          sopVersionId: 'ver-selada-v1.0',
          name: '2. Pemeliharaan & Panen Cepat',
          order: 2,
          targetStartDay: 1,
          targetEndDay: 35,
          tasks: [
            {
              id: 'tsk-sel-02',
              stageId: 'stg-sel-02',
              name: 'Monitoring Daun & Kutu H+10',
              taskType: 'monitoring',
              targetDayOffset: 10,
              targetTime: '08:00',
              description: 'Inspeksi daun muda.',
              priority: 'medium',
              order: 1,
              fields: [],
              validationRules: []
            },
            {
              id: 'tsk-sel-03',
              stageId: 'stg-sel-02',
              name: 'Panen Selada Segar H+35',
              taskType: 'harvest',
              targetDayOffset: 35,
              targetTime: '06:00',
              description: 'Panen pagi hari sebelum matahari terik.',
              priority: 'critical',
              order: 2,
              fields: [],
              validationRules: []
            }
          ]
        }
      ]
    }
  ]
};

// HELPER: Generate Tasks from SOP Snapshot for a Cultivation Cycle
export function generateCycleTasksFromSnapshot(
  cycleId: string,
  startDateStr: string,
  snapshot: SOPSnapshot
): CycleTask[] {
  const cycleTasks: CycleTask[] = [];
  const start = new Date(startDateStr);

  snapshot.stages.forEach((stage) => {
    stage.tasks.forEach((task) => {
      const taskDate = new Date(start);
      taskDate.setDate(taskDate.getDate() + task.targetDayOffset);
      const scheduledDateStr = taskDate.toISOString().split('T')[0];

      // Tasks start as pending so farmer executes them from day 1 of land prep
      const initialStatus: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue' | 'cancelled' = 'pending';

      cycleTasks.push({
        id: `ctask-${cycleId}-${task.id}`,
        cycleId,
        originalTaskId: task.id,
        stageName: stage.name,
        taskName: task.name,
        taskType: task.taskType,
        dayOffset: task.targetDayOffset,
        scheduledDate: scheduledDateStr,
        deadlineTime: task.targetTime || '12:00',
        priority: task.priority,
        status: initialStatus,
        fields: task.fields || [],
        validationRules: task.validationRules || [],
        linkedInventoryItemId: task.linkedInventoryItemId,
        defaultInventoryDosePerPlant: task.defaultInventoryDosePerPlant,
        description: task.description
      });
    });
  });

  return cycleTasks;
}

// SEED CYCLES
const defaultSnapshotCabai: SOPSnapshot = {
  snapshotId: 'snap-cabai-v2.1-c01',
  originalTemplateId: defaultSOPCabaiV21.id,
  templateName: defaultSOPCabaiV21.name,
  originalVersionId: defaultSOPCabaiV21.versions[1].id,
  versionNumber: 'V2.1',
  createdAt: '2026-07-26',
  stages: defaultSOPCabaiV21.versions[1].stages
};

const defaultSnapshotTomat: SOPSnapshot = {
  snapshotId: 'snap-tomat-v1.0-c02',
  originalTemplateId: defaultSOPTomatV1.id,
  templateName: defaultSOPTomatV1.name,
  originalVersionId: defaultSOPTomatV1.versions[0].id,
  versionNumber: 'V1.0',
  createdAt: '2026-07-04',
  stages: defaultSOPTomatV1.versions[0].stages
};

const defaultSnapshotSawi: SOPSnapshot = {
  snapshotId: 'snap-selada-v1.0-c03',
  originalTemplateId: defaultSOPSeladaV1.id,
  templateName: defaultSOPSeladaV1.name,
  originalVersionId: defaultSOPSeladaV1.versions[0].id,
  versionNumber: 'V1.0',
  createdAt: '2026-08-04',
  stages: defaultSOPSeladaV1.versions[0].stages
};

const defaultCycles: CultivationCycle[] = [
  {
    id: 'cycle-01',
    cycleCode: 'SIK-2026-001',
    fieldId: 'f-01',
    fieldName: 'Lahan A — Karanganyar',
    cropTypeId: 'crop-01',
    cropTypeName: 'Cabai',
    cropIcon: '🌶️',
    varietyId: 'var-01',
    varietyName: 'Cabai Rawit (Ori 212)',
    plantCount: 5000,
    landPrepStartDate: '2026-06-26', // Pengolahan lahan 30 hari sebelum tanam
    startDate: '2026-07-26', // H+21 as of 2026-08-16
    estimatedHarvestDate: '2026-10-20',
    sopTemplateId: 'sop-cabai',
    sopVersionId: 'ver-cabai-v2.1',
    sopSnapshot: defaultSnapshotCabai,
    activeStageId: 'stg-04',
    status: 'active',
    notes: 'Penanaman utama musim kemarau dengan mulsa perak dan irigasi tetes.',
    createdAt: '2026-06-26'
  },
  {
    id: 'cycle-02',
    cycleCode: 'SIK-2026-002',
    fieldId: 'f-02',
    fieldName: 'Lahan B — Karanganyar',
    cropTypeId: 'crop-02',
    cropTypeName: 'Tomat',
    cropIcon: '🍅',
    varietyId: 'var-04',
    varietyName: 'Tomat Servo F1',
    plantCount: 3000,
    landPrepStartDate: '2026-06-13', // Pengolahan lahan 21 hari sebelum tanam
    startDate: '2026-07-04', // H+43 as of 2026-08-16
    estimatedHarvestDate: '2026-09-15',
    sopTemplateId: 'sop-tomat',
    sopVersionId: 'ver-tomat-v1.0',
    sopSnapshot: defaultSnapshotTomat,
    activeStageId: 'stg-tom-03',
    status: 'active',
    notes: 'Fase pembentukan buah awal, kondisi tanaman sangat sehat.',
    createdAt: '2026-06-13'
  },
  {
    id: 'cycle-03',
    cycleCode: 'SIK-2026-003',
    fieldId: 'f-03',
    fieldName: 'Lahan C — Sukoharjo',
    cropTypeId: 'crop-04',
    cropTypeName: 'Sawi / Caisim',
    cropIcon: '🌱',
    varietyId: 'var-08',
    varietyName: 'Sawi Shinta',
    plantCount: 12000,
    landPrepStartDate: '2026-07-21', // Pengolahan lahan 14 hari sebelum tanam
    startDate: '2026-08-04', // H+12 as of 2026-08-16
    estimatedHarvestDate: '2026-09-01',
    sopTemplateId: 'sop-selada',
    sopVersionId: 'ver-selada-v1.0',
    sopSnapshot: defaultSnapshotSawi,
    activeStageId: 'stg-sel-02',
    status: 'active',
    notes: 'Fase daun 5-6 helai, pertumbuhan seragam.',
    createdAt: '2026-07-21'
  },
  {
    id: 'cycle-04',
    cycleCode: 'SIK-2026-004',
    fieldId: 'f-04',
    fieldName: 'Lahan D — Boyolali',
    cropTypeId: 'crop-01',
    cropTypeName: 'Cabai',
    cropIcon: '🌶️',
    varietyId: 'var-03',
    varietyName: 'Cabai Merah Besar (Gada MK)',
    plantCount: 4000,
    landPrepStartDate: '2026-08-03', // Pengolahan lahan dimulai 21 hari sebelum tanam
    startDate: '2026-08-24', // Hari Tanam H-0 (Hari ini H-7: Pemasangan Mulsa)
    estimatedHarvestDate: '2026-11-25',
    sopTemplateId: 'sop-cabai',
    sopVersionId: 'ver-cabai-v2.1',
    sopSnapshot: defaultSnapshotCabai,
    activeStageId: 'stg-01', // Aktif di Tahap 1: Pengolahan Lahan & Dasar
    status: 'active',
    notes: 'Siklus baru dalam fase persiapan lahan, pembajakan & pemupukan dasar bedengan.',
    createdAt: '2026-08-03'
  }
];

// Initial Tasks
const initialCycle01Tasks = generateCycleTasksFromSnapshot('cycle-01', '2026-07-26', defaultSnapshotCabai);
// Mark past tasks as completed
initialCycle01Tasks.forEach(t => {
  if (t.dayOffset <= 14) {
    t.status = 'completed';
    t.completedAt = '2026-08-09T09:00:00Z';
    t.submission = {
      id: `sub-${t.id}`,
      cycleTaskId: t.id,
      cycleId: 'cycle-01',
      submittedAt: '2026-08-09T09:00:00Z',
      submittedBy: 'Pak Budi',
      fieldValues: {
        npk_used_kg: 15,
        water_volume_liter: 200,
        plants_inspected: 5000,
        healthy_count: 4940,
        dead_or_wilted: 60,
        sulaman_count: 60,
        ajir_installed: 100
      },
      notes: 'Selesai tepat waktu sesuai standar SOP.'
    };
  } else if (t.dayOffset === 21) {
    t.status = 'pending'; // Today's critical task!
  } else {
    t.status = 'pending';
  }
});

const initialCycle02Tasks = generateCycleTasksFromSnapshot('cycle-02', '2026-07-04', defaultSnapshotTomat);
initialCycle02Tasks.forEach(t => {
  if (t.dayOffset <= 42) {
    t.status = 'completed';
    t.completedAt = '2026-08-15T09:00:00Z';
  } else {
    t.status = 'pending';
  }
});

// Tasks for Cycle 04 (Currently in Land Prep Phase!)
const initialCycle04Tasks = generateCycleTasksFromSnapshot('cycle-04', '2026-08-24', defaultSnapshotCabai);
initialCycle04Tasks.forEach(t => {
  if (t.dayOffset === -21) {
    t.status = 'completed';
    t.completedAt = '2026-08-03T10:00:00Z';
    t.submission = {
      id: `sub-${t.id}`,
      cycleTaskId: t.id,
      cycleId: 'cycle-04',
      submittedAt: '2026-08-03T10:00:00Z',
      submittedBy: 'Pak Budi',
      fieldValues: {
        soil_ph: 6.2,
        dolomit_applied_kg: 200
      },
      notes: 'Pembersihan lahan dan tabur kapur dolomit selesai. pH tanah awal 6.2.'
    };
  } else if (t.dayOffset === -14) {
    t.status = 'completed';
    t.completedAt = '2026-08-10T11:00:00Z';
    t.submission = {
      id: `sub-${t.id}`,
      cycleTaskId: t.id,
      cycleId: 'cycle-04',
      submittedAt: '2026-08-10T11:00:00Z',
      submittedBy: 'Pak Budi',
      fieldValues: {
        pukan_total_kg: 800,
        npk_dasar_kg: 40
      },
      notes: 'Pupuk kandang matang dan NPK dasar sudah diaduk rata di bedengan.'
    };
  } else if (t.dayOffset === -7) {
    t.status = 'pending'; // Today's active Land Prep task!
  } else {
    t.status = 'pending';
  }
});

const defaultMonitoringRecords: MonitoringRecord[] = [
  {
    id: 'mon-01',
    cycleId: 'cycle-01',
    date: '2026-08-02',
    dayOffset: 7,
    plantsInspected: 200,
    healthyCount: 194,
    attentionCount: 4,
    problematicCount: 2,
    deadCount: 0,
    pestAffectedCount: 2,
    diseaseAffectedCount: 0,
    soilMoisturePercent: 68,
    soilPh: 6.4,
    temperatureCelsius: 29,
    humidityPercent: 72,
    averageHeightCm: 18,
    leafColorGrade: 'hijau_segar',
    notes: 'Pertumbuhan daun awal baik, tanah terjaga lembab berkat mulsa.',
    createdAt: '2026-08-02'
  },
  {
    id: 'mon-02',
    cycleId: 'cycle-01',
    date: '2026-08-09',
    dayOffset: 14,
    plantsInspected: 300,
    healthyCount: 288,
    attentionCount: 8,
    problematicCount: 4,
    deadCount: 0,
    pestAffectedCount: 4,
    diseaseAffectedCount: 0,
    soilMoisturePercent: 65,
    soilPh: 6.3,
    temperatureCelsius: 30,
    humidityPercent: 70,
    averageHeightCm: 28,
    leafColorGrade: 'hijau_segar',
    notes: 'Kocor NPK pertama berhasil diserap baik, tunas aktif tumbuh.',
    createdAt: '2026-08-09'
  },
  {
    id: 'mon-03',
    cycleId: 'cycle-01',
    date: '2026-08-16',
    dayOffset: 21,
    plantsInspected: 500,
    healthyCount: 482,
    attentionCount: 12,
    problematicCount: 6,
    deadCount: 0,
    pestAffectedCount: 5,
    diseaseAffectedCount: 1,
    soilMoisturePercent: 62,
    soilPh: 6.3,
    temperatureCelsius: 31,
    humidityPercent: 68,
    averageHeightCm: 38,
    leafColorGrade: 'hijau_segar',
    notes: 'Ditemukan indikasi thrips ringan di blok barat, disiapkan semprot abamektin.',
    createdAt: '2026-08-16'
  }
];

const defaultPestObs: PestObservation[] = [
  {
    id: 'pobs-01',
    cycleId: 'cycle-01',
    pestTypeId: 'pest-01',
    pestName: 'Thrips (Thrips parvispinus)',
    date: '2026-08-15',
    dayOffset: 20,
    severity: 'ringan',
    affectedPlantsCount: 18,
    actionTaken: 'Aplikasi insektisida Agrimec (Abamektin 18 EC) dosis 0.5 ml/liter air disemprot sore hari.',
    resolved: false,
    notes: 'Terdeteksi pada bedengan 3 dan 4 dekat pembatas rumput.'
  }
];

const defaultDiseaseObs: DiseaseObservation[] = [];

const defaultExpenses: Expense[] = [
  {
    id: 'exp-01',
    date: '2026-07-20',
    category: 'bibit',
    description: 'Pembelian 5.000 bibit Cabai Rawit Ori 212 siap tanam',
    amount: 1750000,
    cycleId: 'cycle-01',
    fieldId: 'f-01',
    notes: 'Per bibit Rp 350 di pembibitan Aura.',
    createdAt: '2026-07-20'
  },
  {
    id: 'exp-02',
    date: '2026-07-21',
    category: 'pupuk',
    description: 'Pupuk kandang fermentasi matang 2 ton + dolomit 500 kg',
    amount: 2800000,
    cycleId: 'cycle-01',
    fieldId: 'f-01',
    notes: 'Pupuk dasar bedengan Lahan A.',
    createdAt: '2026-07-21'
  },
  {
    id: 'exp-03',
    date: '2026-07-22',
    category: 'alat_perlengkapan',
    description: 'Mulsa Hitam Perak Bell 4 Rol + Bambu Ajir 5.000 batang',
    amount: 3420000,
    cycleId: 'cycle-01',
    fieldId: 'f-01',
    notes: 'Perlengkapan bedengan.',
    createdAt: '2026-07-22'
  },
  {
    id: 'exp-04',
    date: '2026-07-25',
    category: 'tenaga_kerja',
    description: 'Upah 4 orang pekerja olah bedengan, pasang mulsa & tanam (3 hari)',
    amount: 1440000,
    cycleId: 'cycle-01',
    fieldId: 'f-01',
    notes: 'Rp 120.000/hari/orang.',
    createdAt: '2026-07-25'
  },
  {
    id: 'exp-05',
    date: '2026-08-09',
    category: 'pupuk',
    description: 'NPK Mutiara 16-16-16 untuk kocor vegetatif H+14',
    amount: 270000,
    cycleId: 'cycle-01',
    fieldId: 'f-01',
    notes: '15 kg @ Rp 18.000',
    createdAt: '2026-08-09'
  },
  // Expenses for Cycle 2
  {
    id: 'exp-06',
    date: '2026-07-02',
    category: 'bibit',
    description: 'Bibit Tomat Servo F1 3.000 pohon',
    amount: 1200000,
    cycleId: 'cycle-02',
    fieldId: 'f-02',
    notes: 'Pembibitan Lahan B.',
    createdAt: '2026-07-02'
  },
  {
    id: 'exp-07',
    date: '2026-07-03',
    category: 'pupuk',
    description: 'Pupuk dasar & NPK Tomat',
    amount: 1950000,
    cycleId: 'cycle-02',
    fieldId: 'f-02',
    createdAt: '2026-07-03'
  }
];

const defaultIncome: Income[] = [
  {
    id: 'inc-01',
    date: '2026-08-12',
    source: 'harvest_sale',
    description: 'Penjualan Panen Perdana Tomat Servo Lahan B (Petik Pertama)',
    amount: 2750000,
    cycleId: 'cycle-02',
    buyerName: 'Juragan Sayur Pasar Legi Solo',
    paymentStatus: 'paid',
    notes: '180 kg Grade Super @ Rp 12.500 + 50 kg Grade B @ Rp 10.000',
    createdAt: '2026-08-12'
  }
];

const defaultHarvests: HarvestRecord[] = [
  {
    id: 'hrv-01',
    cycleId: 'cycle-02',
    cycleCode: 'SIK-2026-002',
    fieldName: 'Lahan B — Karanganyar',
    cropName: 'Tomat',
    varietyName: 'Tomat Servo F1',
    date: '2026-08-12',
    dayOffset: 39,
    totalWeightKg: 230,
    grades: [
      { grade: 'Grade A (Super)', weightKg: 180, unitPrice: 12500, subtotal: 2250000 },
      { grade: 'Grade B (Medium)', weightKg: 50, unitPrice: 10000, subtotal: 500000 }
    ],
    totalSalesAmount: 2750000,
    buyerName: 'Juragan Sayur Pasar Legi Solo',
    qualityNotes: 'Buah merah mulus seragam, kekerasan kulit sangat baik.',
    createdAt: '2026-08-12'
  }
];

const defaultAudit: AuditLog[] = [
  {
    id: 'aud-01',
    timestamp: '2026-07-26T08:00:00Z',
    entityType: 'cultivation_cycle',
    action: 'create',
    description: 'Membuat siklus SIK-2026-001 Lahan A Cabai Rawit Ori 212.',
    cycleId: 'cycle-01'
  },
  {
    id: 'aud-02',
    timestamp: '2026-07-26T08:05:00Z',
    entityType: 'sop_snapshot',
    action: 'snapshot',
    description: 'Membuat snapshot permanen SOP Cabai V2.1 untuk siklus SIK-2026-001.',
    cycleId: 'cycle-01'
  },
  {
    id: 'aud-03',
    timestamp: '2026-08-09T09:15:00Z',
    entityType: 'task_execution',
    action: 'execute',
    description: 'Menyelesaikan tugas pemupukan kocor vegetatif H+14. Stok NPK berkurang 15 kg.',
    cycleId: 'cycle-01'
  }
];

// INITIALIZATION & PERSISTENCE
export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Failed reading storage key ${key}:`, e);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed writing storage key ${key}:`, e);
    }
  }

  public static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.FIELDS)) {
      this.setItem(STORAGE_KEYS.FIELDS, defaultFields);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CROPS)) {
      this.setItem(STORAGE_KEYS.CROPS, defaultCrops);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SOPS)) {
      this.setItem(STORAGE_KEYS.SOPS, [defaultSOPCabaiV21, defaultSOPTomatV1, defaultSOPSeladaV1]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CYCLES)) {
      this.setItem(STORAGE_KEYS.CYCLES, defaultCycles);
    } else {
      // Ensure default cycles like cycle-04 exist
      const existingCycles = this.getItem<CultivationCycle[]>(STORAGE_KEYS.CYCLES, []);
      if (!existingCycles.some(c => c.id === 'cycle-04')) {
        const c4 = defaultCycles.find(c => c.id === 'cycle-04');
        if (c4) {
          existingCycles.push(c4);
          this.setItem(STORAGE_KEYS.CYCLES, existingCycles);
        }
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      const allTasks = [...initialCycle01Tasks, ...initialCycle02Tasks, ...initialCycle04Tasks];
      this.setItem(STORAGE_KEYS.TASKS, allTasks);
    } else {
      const existingTasks = this.getItem<CycleTask[]>(STORAGE_KEYS.TASKS, []);
      if (!existingTasks.some(t => t.cycleId === 'cycle-04')) {
        this.setItem(STORAGE_KEYS.TASKS, [...existingTasks, ...initialCycle04Tasks]);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.MONITORING)) {
      this.setItem(STORAGE_KEYS.MONITORING, defaultMonitoringRecords);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PESTS)) {
      this.setItem(STORAGE_KEYS.PESTS, defaultPests);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISEASES)) {
      this.setItem(STORAGE_KEYS.DISEASES, defaultDiseases);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PEST_OBS)) {
      this.setItem(STORAGE_KEYS.PEST_OBS, defaultPestObs);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISEASE_OBS)) {
      this.setItem(STORAGE_KEYS.DISEASE_OBS, defaultDiseaseObs);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      this.setItem(STORAGE_KEYS.INVENTORY, defaultInventory);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INV_TX)) {
      this.setItem(STORAGE_KEYS.INV_TX, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      this.setItem(STORAGE_KEYS.EXPENSES, defaultExpenses);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INCOME)) {
      this.setItem(STORAGE_KEYS.INCOME, defaultIncome);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HARVESTS)) {
      this.setItem(STORAGE_KEYS.HARVESTS, defaultHarvests);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
      this.setItem(STORAGE_KEYS.AUDIT, defaultAudit);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_CYCLE)) {
      this.setItem(STORAGE_KEYS.ACTIVE_CYCLE, 'cycle-01');
    }

    // Try background sync with Supabase
    this.tryBackgroundInitialSync();
  }

  private static async tryBackgroundInitialSync(): Promise<void> {
    try {
      // Check if remote has data
      const remoteCycles = await SupabaseService.fetchCycles();
      if (remoteCycles && remoteCycles.length > 0) {
        // We have data in Supabase, load and update local cache
        await this.pullFromSupabase();
      } else {
        // Supabase is empty, sync our initial data to Supabase
        await this.syncAllToSupabase();
      }
    } catch (e) {
      console.warn('[StorageService] Initial background sync deferred:', e);
    }
  }

  // Active Cycle
  public static getActiveCycleId(): string {
    return this.getItem<string>(STORAGE_KEYS.ACTIVE_CYCLE, 'cycle-01');
  }

  public static setActiveCycleId(id: string): void {
    this.setItem(STORAGE_KEYS.ACTIVE_CYCLE, id);
  }

  // Settings
  public static getSettings(): SystemSettings {
    return this.getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  public static saveSettings(settings: SystemSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    SupabaseService.upsertSettings(settings).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  // Fields
  public static getFields(): Field[] {
    return this.getItem<Field[]>(STORAGE_KEYS.FIELDS, defaultFields);
  }

  public static saveField(field: Field): void {
    const fields = this.getFields();
    const idx = fields.findIndex(f => f.id === field.id);
    if (idx >= 0) {
      fields[idx] = field;
    } else {
      fields.push(field);
    }
    this.setItem(STORAGE_KEYS.FIELDS, fields);
    SupabaseService.upsertField(field).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static deleteField(id: string): void {
    const fields = this.getFields().filter(f => f.id !== id);
    this.setItem(STORAGE_KEYS.FIELDS, fields);
    SupabaseService.deleteField(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  // Crops & Varieties
  public static getCrops(): CropType[] {
    return this.getItem<CropType[]>(STORAGE_KEYS.CROPS, defaultCrops);
  }

  public static saveCrop(crop: CropType): void {
    const crops = this.getCrops();
    const idx = crops.findIndex(c => c.id === crop.id);
    if (idx >= 0) {
      crops[idx] = crop;
    } else {
      crops.push(crop);
    }
    this.setItem(STORAGE_KEYS.CROPS, crops);
    SupabaseService.upsertCrop(crop).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static deleteCrop(id: string): void {
    const crops = this.getCrops().filter(c => c.id !== id);
    this.setItem(STORAGE_KEYS.CROPS, crops);
    SupabaseService.deleteCrop(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  // SOP Templates & Versions
  public static getSOPTemplates(): SOPTemplate[] {
    return this.getItem<SOPTemplate[]>(STORAGE_KEYS.SOPS, [defaultSOPCabaiV21, defaultSOPTomatV1, defaultSOPSeladaV1]);
  }

  public static saveSOPTemplate(template: SOPTemplate): void {
    const sops = this.getSOPTemplates();
    const idx = sops.findIndex(s => s.id === template.id);
    if (idx >= 0) {
      sops[idx] = template;
    } else {
      sops.push(template);
    }
    this.setItem(STORAGE_KEYS.SOPS, sops);
    SupabaseService.upsertSOPTemplate(template).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static deleteSOPTemplate(id: string): void {
    const sops = this.getSOPTemplates().filter(s => s.id !== id);
    this.setItem(STORAGE_KEYS.SOPS, sops);
    SupabaseService.deleteSOPTemplate(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  // Cultivation Cycles
  public static getCycles(): CultivationCycle[] {
    return this.getItem<CultivationCycle[]>(STORAGE_KEYS.CYCLES, defaultCycles);
  }

  public static createCultivationCycle(
    data: Omit<CultivationCycle, 'id' | 'cycleCode' | 'sopSnapshot' | 'createdAt'>,
    sopTemplate: SOPTemplate,
    sopVersion: SOPVersion
  ): CultivationCycle {
    const cycles = this.getCycles();
    const cycleCount = cycles.length + 1;
    const cycleCode = `SIK-${new Date().getFullYear()}-${String(cycleCount).padStart(3, '0')}`;
    const id = `cycle-${Date.now()}`;

    // Create immutable SOP Snapshot!
    const sopSnapshot: SOPSnapshot = {
      snapshotId: `snap-${sopVersion.versionNumber}-${id}`,
      originalTemplateId: sopTemplate.id,
      templateName: sopTemplate.name,
      originalVersionId: sopVersion.id,
      versionNumber: sopVersion.versionNumber,
      createdAt: new Date().toISOString(),
      stages: JSON.parse(JSON.stringify(sopVersion.stages)) // Deep clone snapshot
    };

    const newCycle: CultivationCycle = {
      ...data,
      id,
      cycleCode,
      sopSnapshot,
      createdAt: new Date().toISOString()
    };

    cycles.push(newCycle);
    this.setItem(STORAGE_KEYS.CYCLES, cycles);

    // Auto-generate Cycle Tasks from the snapshot!
    const generatedTasks = generateCycleTasksFromSnapshot(id, newCycle.startDate, sopSnapshot);
    const existingTasks = this.getTasks();
    this.setItem(STORAGE_KEYS.TASKS, [...existingTasks, ...generatedTasks]);

    // Audit log
    this.addAuditLog({
      entityType: 'cultivation_cycle',
      action: 'create',
      description: `Membuat siklus baru ${cycleCode} (${newCycle.fieldName} - ${newCycle.cropTypeName} ${newCycle.varietyName}) menggunakan SOP Snapshot ${sopSnapshot.versionNumber}.`,
      cycleId: id
    });

    // Sync cycle and generated tasks to Supabase
    SupabaseService.upsertCycle(newCycle).catch((err) => console.warn('[Supabase Sync Error]', err));
    SupabaseService.upsertTasksBatch(generatedTasks).catch((err) => console.warn('[Supabase Sync Error]', err));

    return newCycle;
  }

  public static updateCycle(cycle: CultivationCycle): void {
    const cycles = this.getCycles();
    const idx = cycles.findIndex(c => c.id === cycle.id);
    if (idx >= 0) {
      cycles[idx] = cycle;
      this.setItem(STORAGE_KEYS.CYCLES, cycles);
      SupabaseService.upsertCycle(cycle).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static setActiveStageForCycle(cycleId: string, stageId: string | null): CultivationCycle | null {
    const cycles = this.getCycles();
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return null;

    cycle.activeStageId = stageId || undefined;

    const targetStage = cycle.sopSnapshot?.stages?.find(s => s.id === stageId);
    const stageName = targetStage ? targetStage.name : 'Otomatis (Sesuai Kalender)';

    this.setItem(STORAGE_KEYS.CYCLES, cycles);

    this.addAuditLog({
      entityType: 'cultivation_cycle',
      action: 'update',
      description: `Memindahkan tahapan aktif siklus ${cycle.cycleCode} ke: "${stageName}".`,
      cycleId: cycle.id
    });

    SupabaseService.upsertCycle(cycle).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );

    return cycle;
  }

  public static updateCycleStageTargetDays(
    cycleId: string,
    stageId: string,
    targetStartDay: number,
    targetEndDay: number
  ): CultivationCycle | null {
    const cycles = this.getCycles();
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle || !cycle.sopSnapshot?.stages) return null;

    const stage = cycle.sopSnapshot.stages.find(s => s.id === stageId);
    if (!stage) return null;

    const oldRange = `H${stage.targetStartDay >= 0 ? `+${stage.targetStartDay}` : stage.targetStartDay} s/d H+${stage.targetEndDay}`;
    stage.targetStartDay = targetStartDay;
    stage.targetEndDay = targetEndDay;
    const newRange = `H${targetStartDay >= 0 ? `+${targetStartDay}` : targetStartDay} s/d H+${targetEndDay}`;

    this.setItem(STORAGE_KEYS.CYCLES, cycles);

    this.addAuditLog({
      entityType: 'cultivation_cycle',
      action: 'update',
      description: `Menyesuaikan target hari tahapan "${stage.name}" pada siklus ${cycle.cycleCode} dari ${oldRange} menjadi ${newRange}.`,
      cycleId: cycle.id
    });

    SupabaseService.upsertCycle(cycle).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );

    return cycle;
  }

  public static deleteCycle(id: string): void {
    const cycles = this.getCycles().filter(c => c.id !== id);
    this.setItem(STORAGE_KEYS.CYCLES, cycles);
    
    // Also remove cycle tasks
    const tasks = this.getTasks().filter(t => t.cycleId !== id);
    this.setItem(STORAGE_KEYS.TASKS, tasks);

    // If active cycle was deleted, switch to another available cycle
    if (this.getActiveCycleId() === id) {
      if (cycles.length > 0) {
        this.setActiveCycleId(cycles[0].id);
      }
    }

    this.addAuditLog({
      entityType: 'cultivation_cycle',
      action: 'delete',
      description: `Menghapus siklus budidaya dengan ID: ${id}.`
    });

    SupabaseService.deleteCycle(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  // Tasks
  public static getTasks(): CycleTask[] {
    return this.getItem<CycleTask[]>(STORAGE_KEYS.TASKS, []);
  }

  public static getTasksByCycle(cycleId: string): CycleTask[] {
    return this.getTasks().filter(t => t.cycleId === cycleId);
  }

  public static executeTask(
    taskId: string,
    submissionData: Omit<TaskSubmission, 'id' | 'cycleTaskId' | 'submittedAt'>,
    autoDeductInventory: boolean = true
  ): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const submission: TaskSubmission = {
      id: `sub-${Date.now()}`,
      cycleTaskId: taskId,
      submittedAt: new Date().toISOString(),
      ...submissionData
    };

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.submission = submission;

    // Handle auto inventory deduction if configured
    if (autoDeductInventory && task.linkedInventoryItemId) {
      const inventory = this.getInventory();
      const item = inventory.find(i => i.id === task.linkedInventoryItemId);
      if (item) {
        let deductQty = 0;
        if (submissionData.fieldValues['npk_used_kg']) {
          deductQty = Number(submissionData.fieldValues['npk_used_kg']) || 0;
        } else if (submissionData.fieldValues['kno3_kg']) {
          deductQty = Number(submissionData.fieldValues['kno3_kg']) || 0;
        } else if (task.defaultInventoryDosePerPlant) {
          const cycle = this.getCycles().find(c => c.id === task.cycleId);
          const plants = cycle?.plantCount || 1000;
          deductQty = task.defaultInventoryDosePerPlant * plants;
        }

        if (deductQty > 0) {
          item.currentStock = Math.max(0, item.currentStock - deductQty);
          item.updatedAt = new Date().toISOString();
          this.saveInventoryItem(item);

          this.addInventoryTransaction({
            inventoryItemId: item.id,
            itemName: item.name,
            type: 'task_usage',
            quantity: deductQty,
            unitPrice: item.unitPrice,
            totalCost: deductQty * item.unitPrice,
            cycleId: task.cycleId,
            taskId: task.id,
            reason: `Pemakaian otomatis untuk tugas SOP: ${task.taskName}`,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }
    }

    this.setItem(STORAGE_KEYS.TASKS, tasks);

    this.addAuditLog({
      entityType: 'cycle_task',
      action: 'execute',
      description: `Menyelesaikan tugas: ${task.taskName} (${task.stageName}).`,
      cycleId: task.cycleId
    });

    SupabaseService.upsertTask(task).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static revertTask(taskId: string): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'pending';
    task.completedAt = undefined;
    task.submission = undefined;

    this.setItem(STORAGE_KEYS.TASKS, tasks);

    this.addAuditLog({
      entityType: 'cycle_task',
      action: 'update',
      description: `Membatalkan status selesai (reset ke pending) untuk tugas: ${task.taskName} (${task.stageName}).`,
      cycleId: task.cycleId
    });

    SupabaseService.upsertTask(task).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static quickCompleteTask(
    taskId: string,
    fieldValues: Record<string, any> = {},
    notes?: string
  ): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const submission: TaskSubmission = {
      id: `sub-${Date.now()}`,
      cycleTaskId: taskId,
      cycleId: task.cycleId,
      submittedAt: new Date().toISOString(),
      submittedBy: 'Operator Lapangan (Quick Checklist)',
      fieldValues: { ...fieldValues },
      notes: notes || 'Diselesaikan via checklist kegiatan harian.'
    };

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.submission = submission;

    this.setItem(STORAGE_KEYS.TASKS, tasks);

    this.addAuditLog({
      entityType: 'cycle_task',
      action: 'execute',
      description: `Checklist selesai: ${task.taskName} (${task.stageName}).`,
      cycleId: task.cycleId
    });

    SupabaseService.upsertTask(task).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static updateCyclePlantCount(cycleId: string, plantCount: number): void {
    const cycles = this.getCycles();
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;

    const oldCount = cycle.plantCount;
    cycle.plantCount = Math.max(0, plantCount);
    this.setItem(STORAGE_KEYS.CYCLES, cycles);

    this.addAuditLog({
      entityType: 'cultivation_cycle',
      action: 'update',
      description: `Memperbarui total populasi tanaman siklus ${cycle.cycleCode} dari ${oldCount} menjadi ${plantCount} pohon.`,
      cycleId: cycle.id
    });

    SupabaseService.upsertCycle(cycle).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static saveQuickPlantHealth(
    cycleId: string,
    data: {
      totalPlants?: number;
      healthyCount: number;
      attentionCount: number;
      problematicCount: number;
      deadCount: number;
      soilPh?: number;
      soilMoisturePercent?: number;
      averageHeightCm?: number;
      notes?: string;
      dayOffset?: number;
    }
  ): MonitoringRecord {
    if (data.totalPlants !== undefined) {
      this.updateCyclePlantCount(cycleId, data.totalPlants);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const inspected = (data.healthyCount || 0) + (data.attentionCount || 0) + (data.problematicCount || 0) + (data.deadCount || 0);

    const newRecord: Omit<MonitoringRecord, 'id' | 'createdAt'> = {
      cycleId,
      date: todayStr,
      dayOffset: data.dayOffset !== undefined ? data.dayOffset : 0,
      plantsInspected: inspected > 0 ? inspected : (data.totalPlants || 1000),
      healthyCount: data.healthyCount,
      attentionCount: data.attentionCount,
      problematicCount: data.problematicCount,
      deadCount: data.deadCount,
      pestAffectedCount: data.problematicCount,
      diseaseAffectedCount: 0,
      soilPh: data.soilPh,
      soilMoisturePercent: data.soilMoisturePercent,
      averageHeightCm: data.averageHeightCm,
      notes: data.notes || 'Pembaruan kondisi populasi & kesehatan tanaman via Dashboard.',
    };

    return this.addMonitoringRecord(newRecord);
  }

  public static updateTask(task: CycleTask): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
      this.setItem(STORAGE_KEYS.TASKS, tasks);
      SupabaseService.upsertTask(task).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static addTask(task: CycleTask): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.setItem(STORAGE_KEYS.TASKS, tasks);
    SupabaseService.upsertTask(task).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  // Monitoring
  public static getMonitoringRecords(cycleId?: string): MonitoringRecord[] {
    const records = this.getItem<MonitoringRecord[]>(STORAGE_KEYS.MONITORING, defaultMonitoringRecords);
    if (cycleId) {
      return records.filter(r => r.cycleId === cycleId);
    }
    return records;
  }

  public static addMonitoringRecord(record: Omit<MonitoringRecord, 'id' | 'createdAt'>): MonitoringRecord {
    const records = this.getMonitoringRecords();
    const newRecord: MonitoringRecord = {
      ...record,
      id: `mon-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
    this.setItem(STORAGE_KEYS.MONITORING, records);

    this.addAuditLog({
      entityType: 'monitoring',
      action: 'create',
      description: `Mencatat data monitoring H+${record.dayOffset} (${record.plantsInspected} tanaman diperiksa, ${record.healthyCount} sehat).`,
      cycleId: record.cycleId
    });

    SupabaseService.upsertMonitoring(newRecord).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );

    return newRecord;
  }

  // Pests & Diseases
  public static getPests(): PestType[] {
    return this.getItem<PestType[]>(STORAGE_KEYS.PESTS, defaultPests);
  }

  public static savePest(pest: PestType): void {
    const pests = this.getPests();
    const idx = pests.findIndex(p => p.id === pest.id);
    if (idx >= 0) {
      pests[idx] = pest;
      this.addAuditLog({
        entityType: 'pest_catalog',
        action: 'update',
        description: `Memperbarui katalog hama: ${pest.name}`
      });
    } else {
      pests.push(pest);
      this.addAuditLog({
        entityType: 'pest_catalog',
        action: 'create',
        description: `Menambahkan hama baru ke katalog: ${pest.name}`
      });
    }
    this.setItem(STORAGE_KEYS.PESTS, pests);
    SupabaseService.upsertPest(pest).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static deletePest(id: string): void {
    const pests = this.getPests();
    const pestToDelete = pests.find(p => p.id === id);
    const updated = pests.filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PESTS, updated);
    if (pestToDelete) {
      this.addAuditLog({
        entityType: 'pest_catalog',
        action: 'delete',
        description: `Menghapus hama dari katalog: ${pestToDelete.name}`
      });
    }
    SupabaseService.deletePest(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static getDiseases(): DiseaseType[] {
    return this.getItem<DiseaseType[]>(STORAGE_KEYS.DISEASES, defaultDiseases);
  }

  public static saveDisease(disease: DiseaseType): void {
    const diseases = this.getDiseases();
    const idx = diseases.findIndex(d => d.id === disease.id);
    if (idx >= 0) {
      diseases[idx] = disease;
      this.addAuditLog({
        entityType: 'disease_catalog',
        action: 'update',
        description: `Memperbarui katalog penyakit: ${disease.name}`
      });
    } else {
      diseases.push(disease);
      this.addAuditLog({
        entityType: 'disease_catalog',
        action: 'create',
        description: `Menambahkan penyakit baru ke katalog: ${disease.name}`
      });
    }
    this.setItem(STORAGE_KEYS.DISEASES, diseases);
    SupabaseService.upsertDisease(disease).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static deleteDisease(id: string): void {
    const diseases = this.getDiseases();
    const diseaseToDelete = diseases.find(d => d.id === id);
    const updated = diseases.filter(d => d.id !== id);
    this.setItem(STORAGE_KEYS.DISEASES, updated);
    if (diseaseToDelete) {
      this.addAuditLog({
        entityType: 'disease_catalog',
        action: 'delete',
        description: `Menghapus penyakit dari katalog: ${diseaseToDelete.name}`
      });
    }
    SupabaseService.deleteDisease(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static getPestObservations(cycleId?: string): PestObservation[] {
    const obs = this.getItem<PestObservation[]>(STORAGE_KEYS.PEST_OBS, defaultPestObs);
    if (cycleId) return obs.filter(o => o.cycleId === cycleId);
    return obs;
  }

  public static addPestObservation(obs: Omit<PestObservation, 'id'>): PestObservation {
    const list = this.getPestObservations();
    const item: PestObservation = { ...obs, id: `pobs-${Date.now()}` };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.PEST_OBS, list);
    this.addAuditLog({
      entityType: 'pest_observation',
      action: 'create',
      description: `Mencatat temuan hama: ${obs.pestName} (Keparahan: ${obs.severity}, ${obs.affectedPlantsCount} tanaman)`,
      cycleId: obs.cycleId
    });
    SupabaseService.upsertPestObs(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
    return item;
  }

  public static updatePestObservation(obs: PestObservation): void {
    const list = this.getPestObservations();
    const idx = list.findIndex(o => o.id === obs.id);
    if (idx >= 0) {
      list[idx] = obs;
      this.setItem(STORAGE_KEYS.PEST_OBS, list);
      this.addAuditLog({
        entityType: 'pest_observation',
        action: 'update',
        description: `Memperbarui status temuan hama: ${obs.pestName}`,
        cycleId: obs.cycleId
      });
      SupabaseService.upsertPestObs(obs).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static deletePestObservation(id: string): void {
    const list = this.getPestObservations();
    const item = list.find(o => o.id === id);
    const updated = list.filter(o => o.id !== id);
    this.setItem(STORAGE_KEYS.PEST_OBS, updated);
    if (item) {
      this.addAuditLog({
        entityType: 'pest_observation',
        action: 'delete',
        description: `Menghapus catatan temuan hama: ${item.pestName}`,
        cycleId: item.cycleId
      });
      SupabaseService.deletePestObs(id).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static getDiseaseObservations(cycleId?: string): DiseaseObservation[] {
    const obs = this.getItem<DiseaseObservation[]>(STORAGE_KEYS.DISEASE_OBS, defaultDiseaseObs);
    if (cycleId) return obs.filter(o => o.cycleId === cycleId);
    return obs;
  }

  public static addDiseaseObservation(obs: Omit<DiseaseObservation, 'id'>): DiseaseObservation {
    const list = this.getDiseaseObservations();
    const item: DiseaseObservation = { ...obs, id: `dobs-${Date.now()}` };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.DISEASE_OBS, list);
    this.addAuditLog({
      entityType: 'disease_observation',
      action: 'create',
      description: `Mencatat temuan penyakit: ${obs.diseaseName} (Keparahan: ${obs.severity}, ${obs.affectedPlantsCount} tanaman)`,
      cycleId: obs.cycleId
    });
    SupabaseService.upsertDiseaseObs(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
    return item;
  }

  public static updateDiseaseObservation(obs: DiseaseObservation): void {
    const list = this.getDiseaseObservations();
    const idx = list.findIndex(o => o.id === obs.id);
    if (idx >= 0) {
      list[idx] = obs;
      this.setItem(STORAGE_KEYS.DISEASE_OBS, list);
      this.addAuditLog({
        entityType: 'disease_observation',
        action: 'update',
        description: `Memperbarui status temuan penyakit: ${obs.diseaseName}`,
        cycleId: obs.cycleId
      });
      SupabaseService.upsertDiseaseObs(obs).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static deleteDiseaseObservation(id: string): void {
    const list = this.getDiseaseObservations();
    const item = list.find(o => o.id === id);
    const updated = list.filter(o => o.id !== id);
    this.setItem(STORAGE_KEYS.DISEASE_OBS, updated);
    if (item) {
      this.addAuditLog({
        entityType: 'disease_observation',
        action: 'delete',
        description: `Menghapus catatan temuan penyakit: ${item.diseaseName}`,
        cycleId: item.cycleId
      });
      SupabaseService.deleteDiseaseObs(id).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  // Inventory
  public static getInventory(): InventoryItem[] {
    return this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, defaultInventory);
  }

  public static saveInventoryItem(item: InventoryItem): void {
    const list = this.getInventory();
    const idx = list.findIndex(i => i.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    this.setItem(STORAGE_KEYS.INVENTORY, list);
    SupabaseService.upsertInventoryItem(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static deleteInventoryItem(id: string): void {
    const list = this.getInventory().filter(i => i.id !== id);
    this.setItem(STORAGE_KEYS.INVENTORY, list);
    SupabaseService.deleteInventoryItem(id).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
  }

  public static getInventoryTransactions(): InventoryTransaction[] {
    return this.getItem<InventoryTransaction[]>(STORAGE_KEYS.INV_TX, []);
  }

  public static addInventoryTransaction(tx: Omit<InventoryTransaction, 'id' | 'createdAt'>): InventoryTransaction {
    const list = this.getInventoryTransactions();
    const item: InventoryTransaction = { ...tx, id: `tx-${Date.now()}`, createdAt: new Date().toISOString() };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.INV_TX, list);
    SupabaseService.upsertInventoryTransaction(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );
    return item;
  }

  // Expenses & Income
  public static getExpenses(cycleId?: string): Expense[] {
    const list = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, defaultExpenses);
    if (cycleId) return list.filter(e => e.cycleId === cycleId);
    return list;
  }

  public static addExpense(exp: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const list = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, defaultExpenses);
    const item: Expense = { ...exp, id: `exp-${Date.now()}`, createdAt: new Date().toISOString() };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.EXPENSES, list);

    this.addAuditLog({
      entityType: 'expense',
      action: 'create',
      description: `Mencatat pengeluaran Rp ${exp.amount.toLocaleString('id-ID')}: ${exp.description}`,
      cycleId: exp.cycleId
    });

    SupabaseService.upsertExpense(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );

    return item;
  }

  public static updateExpense(expense: Expense): void {
    const list = this.getExpenses();
    const idx = list.findIndex(e => e.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
      this.setItem(STORAGE_KEYS.EXPENSES, list);
      this.addAuditLog({
        entityType: 'expense',
        action: 'update',
        description: `Memperbarui catatan pengeluaran: ${expense.description} (Rp ${expense.amount.toLocaleString('id-ID')})`,
        cycleId: expense.cycleId
      });
      SupabaseService.upsertExpense(expense).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static deleteExpense(id: string): void {
    const list = this.getExpenses();
    const item = list.find(e => e.id === id);
    const updated = list.filter(e => e.id !== id);
    this.setItem(STORAGE_KEYS.EXPENSES, updated);
    if (item) {
      this.addAuditLog({
        entityType: 'expense',
        action: 'delete',
        description: `Menghapus catatan pengeluaran: ${item.description}`,
        cycleId: item.cycleId
      });
      SupabaseService.deleteExpense(id).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static getIncome(cycleId?: string): Income[] {
    const list = this.getItem<Income[]>(STORAGE_KEYS.INCOME, defaultIncome);
    if (cycleId) return list.filter(i => i.cycleId === cycleId);
    return list;
  }

  public static addIncome(inc: Omit<Income, 'id' | 'createdAt'>): Income {
    const list = this.getItem<Income[]>(STORAGE_KEYS.INCOME, defaultIncome);
    const item: Income = { ...inc, id: `inc-${Date.now()}`, createdAt: new Date().toISOString() };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.INCOME, list);

    this.addAuditLog({
      entityType: 'income',
      action: 'create',
      description: `Mencatat pemasukan Rp ${inc.amount.toLocaleString('id-ID')}: ${inc.description}`,
      cycleId: inc.cycleId
    });

    SupabaseService.upsertIncome(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );

    return item;
  }

  public static updateIncome(income: Income): void {
    const list = this.getIncome();
    const idx = list.findIndex(i => i.id === income.id);
    if (idx >= 0) {
      list[idx] = income;
      this.setItem(STORAGE_KEYS.INCOME, list);
      this.addAuditLog({
        entityType: 'income',
        action: 'update',
        description: `Memperbarui catatan pemasukan/penjualan: ${income.description} (Rp ${income.amount.toLocaleString('id-ID')})`,
        cycleId: income.cycleId
      });
      SupabaseService.upsertIncome(income).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  public static deleteIncome(id: string): void {
    const list = this.getIncome();
    const item = list.find(i => i.id === id);
    const updated = list.filter(i => i.id !== id);
    this.setItem(STORAGE_KEYS.INCOME, updated);
    if (item) {
      this.addAuditLog({
        entityType: 'income',
        action: 'delete',
        description: `Menghapus catatan pemasukan/penjualan: ${item.description}`,
        cycleId: item.cycleId
      });
      SupabaseService.deleteIncome(id).catch((err) =>
        console.warn('[Supabase Sync Error]', err)
      );
    }
  }

  // Harvests
  public static getHarvests(cycleId?: string): HarvestRecord[] {
    const list = this.getItem<HarvestRecord[]>(STORAGE_KEYS.HARVESTS, defaultHarvests);
    if (cycleId) return list.filter(h => h.cycleId === cycleId);
    return list;
  }

  public static addHarvest(harvest: Omit<HarvestRecord, 'id' | 'createdAt'>): HarvestRecord {
    const list = this.getItem<HarvestRecord[]>(STORAGE_KEYS.HARVESTS, defaultHarvests);
    const item: HarvestRecord = { ...harvest, id: `hrv-${Date.now()}`, createdAt: new Date().toISOString() };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.HARVESTS, list);

    // Auto-create income transaction if total sales > 0
    if (harvest.totalSalesAmount > 0) {
      this.addIncome({
        date: harvest.date,
        source: 'harvest_sale',
        description: `Penjualan Hasil Panen ${harvest.cropName} (${harvest.varietyName}) - Total ${harvest.totalWeightKg} kg`,
        amount: harvest.totalSalesAmount,
        cycleId: harvest.cycleId,
        harvestId: item.id,
        buyerName: harvest.buyerName,
        paymentStatus: 'paid',
        notes: harvest.qualityNotes
      });
    }

    this.addAuditLog({
      entityType: 'harvest',
      action: 'create',
      description: `Mencatat panen ${harvest.totalWeightKg} kg ${harvest.cropName} senilai Rp ${harvest.totalSalesAmount.toLocaleString('id-ID')}`,
      cycleId: harvest.cycleId
    });

    SupabaseService.upsertHarvest(item).catch((err) =>
      console.warn('[Supabase Sync Error]', err)
    );

    return item;
  }

  // Audit Logs
  public static getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT, defaultAudit);
  }

  public static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const item: AuditLog = {
      ...log,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    list.unshift(item);
    if (list.length > 200) list.pop(); // Cap history
    this.setItem(STORAGE_KEYS.AUDIT, list);
  }

  // Supabase Sync Methods
  public static async syncAllToSupabase(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    return SupabaseService.syncAllLocalDataToSupabase({
      settings: this.getSettings(),
      fields: this.getFields(),
      crops: this.getCrops(),
      sops: this.getSOPTemplates(),
      cycles: this.getCycles(),
      tasks: this.getTasks(),
      inventory: this.getInventory(),
      inventoryTransactions: this.getInventoryTransactions(),
      expenses: this.getExpenses(),
      income: this.getIncome(),
      harvests: this.getHarvests(),
      monitoring: this.getMonitoringRecords(),
      pests: this.getPests(),
      diseases: this.getDiseases(),
      pestObservations: this.getPestObservations(),
      diseaseObservations: this.getDiseaseObservations()
    });
  }

  public static async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const [
        settings,
        fields,
        crops,
        sops,
        cycles,
        tasks,
        inventory,
        expenses,
        income,
        harvests,
        monitoring
      ] = await Promise.all([
        SupabaseService.fetchSettings(),
        SupabaseService.fetchFields(),
        SupabaseService.fetchCrops(),
        SupabaseService.fetchSOPTemplates(),
        SupabaseService.fetchCycles(),
        SupabaseService.fetchTasks(),
        SupabaseService.fetchInventory(),
        SupabaseService.fetchExpenses(),
        SupabaseService.fetchIncome(),
        SupabaseService.fetchHarvests(),
        SupabaseService.fetchMonitoring()
      ]);

      if (settings) this.setItem(STORAGE_KEYS.SETTINGS, settings);
      if (fields && fields.length > 0) this.setItem(STORAGE_KEYS.FIELDS, fields);
      if (crops && crops.length > 0) this.setItem(STORAGE_KEYS.CROPS, crops);
      if (sops && sops.length > 0) this.setItem(STORAGE_KEYS.SOPS, sops);
      if (cycles && cycles.length > 0) this.setItem(STORAGE_KEYS.CYCLES, cycles);
      if (tasks && tasks.length > 0) this.setItem(STORAGE_KEYS.TASKS, tasks);
      if (inventory && inventory.length > 0) this.setItem(STORAGE_KEYS.INVENTORY, inventory);
      if (expenses && expenses.length > 0) this.setItem(STORAGE_KEYS.EXPENSES, expenses);
      if (income && income.length > 0) this.setItem(STORAGE_KEYS.INCOME, income);
      if (harvests && harvests.length > 0) this.setItem(STORAGE_KEYS.HARVESTS, harvests);
      if (monitoring && monitoring.length > 0) this.setItem(STORAGE_KEYS.MONITORING, monitoring);

      return {
        success: true,
        message: 'Data terbaru dari database Supabase berhasil dimuat!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memuat data dari Supabase: ${err.message}`
      };
    }
  }

  // Reset & Backup Data
  public static resetToSeedData(): void {
    localStorage.clear();
    this.initialize();
  }

  public static exportAllData(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      fields: this.getFields(),
      crops: this.getCrops(),
      sops: this.getSOPTemplates(),
      cycles: this.getCycles(),
      tasks: this.getTasks(),
      monitoring: this.getMonitoringRecords(),
      pests: this.getPests(),
      diseases: this.getDiseases(),
      pestObservations: this.getPestObservations(),
      diseaseObservations: this.getDiseaseObservations(),
      inventory: this.getInventory(),
      inventoryTransactions: this.getInventoryTransactions(),
      expenses: this.getExpenses(),
      income: this.getIncome(),
      harvests: this.getHarvests(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  public static importAllData(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.sops || !parsed.cycles) {
        return { success: false, message: 'Format data tidak valid! File tidak memiliki struktur AgriSOP.' };
      }
      if (parsed.fields) this.setItem(STORAGE_KEYS.FIELDS, parsed.fields);
      if (parsed.crops) this.setItem(STORAGE_KEYS.CROPS, parsed.crops);
      if (parsed.sops) this.setItem(STORAGE_KEYS.SOPS, parsed.sops);
      if (parsed.cycles) this.setItem(STORAGE_KEYS.CYCLES, parsed.cycles);
      if (parsed.tasks) this.setItem(STORAGE_KEYS.TASKS, parsed.tasks);
      if (parsed.monitoring) this.setItem(STORAGE_KEYS.MONITORING, parsed.monitoring);
      if (parsed.pests) this.setItem(STORAGE_KEYS.PESTS, parsed.pests);
      if (parsed.diseases) this.setItem(STORAGE_KEYS.DISEASES, parsed.diseases);
      if (parsed.pestObservations) this.setItem(STORAGE_KEYS.PEST_OBS, parsed.pestObservations);
      if (parsed.diseaseObservations) this.setItem(STORAGE_KEYS.DISEASE_OBS, parsed.diseaseObservations);
      if (parsed.inventory) this.setItem(STORAGE_KEYS.INVENTORY, parsed.inventory);
      if (parsed.inventoryTransactions) this.setItem(STORAGE_KEYS.INV_TX, parsed.inventoryTransactions);
      if (parsed.expenses) this.setItem(STORAGE_KEYS.EXPENSES, parsed.expenses);
      if (parsed.income) this.setItem(STORAGE_KEYS.INCOME, parsed.income);
      if (parsed.harvests) this.setItem(STORAGE_KEYS.HARVESTS, parsed.harvests);
      if (parsed.settings) this.setItem(STORAGE_KEYS.SETTINGS, parsed.settings);

      // Trigger sync
      this.syncAllToSupabase().catch(() => {});

      return { success: true, message: 'Data berhasil dipulihkan dari backup!' };
    } catch (e: any) {
      return { success: false, message: `Gagal memproses file backup: ${e.message}` };
    }
  }
}
