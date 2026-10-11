import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  CultivationCycle,
  Field,
  CropType,
  SOPTemplate,
  CycleTask,
  InventoryItem,
  SystemSettings
} from '../types';
import { StorageService } from '../services/storage';

export type NavigationTab = 
  | 'dashboard_monitor'
  | 'dashboard_tasks'
  | 'fields_varieties'
  | 'cycles_fields'
  | 'sop_builder'
  | 'sop_manager'
  | 'pest_disease'
  | 'inventory'
  | 'inventory_manager'
  | 'harvest'
  | 'harvest_manager'
  | 'finance'
  | 'finance_manager'
  | 'reports'
  | 'reports_analytics'
  | 'settings';

export type QuickActionType = 
  | 'task_execute'
  | 'add_monitoring'
  | 'add_pest_obs'
  | 'add_disease_obs'
  | 'add_expense'
  | 'add_harvest'
  | 'add_income'
  | 'add_inventory_stock'
  | 'create_cycle'
  | 'quick_note';

export interface CycleDayInfo {
  dayNumber: number;
  label: string;
  isLandPrep: boolean;
  prepDayNumber: number;
  prepDurationDays: number;
  totalDaysFromPrep: number;
  displayStatus: string;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeCycleId: string;
  setActiveCycleId: (id: string) => void;
  activeCycle: CultivationCycle | null;
  cycles: CultivationCycle[];
  fields: Field[];
  crops: CropType[];
  sops: SOPTemplate[];
  tasks: CycleTask[];
  inventory: InventoryItem[];
  settings: SystemSettings;
  refreshData: () => void;
  quickActionModalOpen: boolean;
  quickActionDefaultType: QuickActionType | null;
  openQuickAction: (type?: QuickActionType) => void;
  closeQuickAction: () => void;
  calculateCycleDay: (startDateStr: string, landPrepStartDateStr?: string) => CycleDayInfo;
  isOnline: boolean;
  syncStatus: 'synced' | 'pending' | 'syncing';
  syncWithSupabase: () => Promise<{ success: boolean; message: string; syncedCount?: number }>;
  pullFromSupabase: () => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard_monitor');
  const [activeCycleId, setActiveCycleIdState] = useState<string>('cycle-01');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [quickActionModalOpen, setQuickActionModalOpen] = useState<boolean>(false);
  const [quickActionDefaultType, setQuickActionDefaultType] = useState<QuickActionType | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing'>('synced');

  // Initialize storage once
  useEffect(() => {
    StorageService.initialize();
    const currentId = StorageService.getActiveCycleId();
    if (currentId) {
      setActiveCycleIdState(currentId);
    }

    // Listen to storage sync events
    const unsubSync = StorageService.onSyncStatusChange((status) => {
      setSyncStatus(status);
      if (status === 'synced') {
        refreshData();
      }
    });

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      StorageService.tryBackgroundInitialSync()
        .then(() => {
          setSyncStatus('synced');
          refreshData();
        })
        .catch(() => setSyncStatus('pending'));
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('pending');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubSync();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const setActiveCycleId = (id: string) => {
    StorageService.setActiveCycleId(id);
    setActiveCycleIdState(id);
    refreshData();
  };

  const openQuickAction = (type?: QuickActionType) => {
    setQuickActionDefaultType(type || null);
    setQuickActionModalOpen(true);
  };

  const closeQuickAction = () => {
    setQuickActionModalOpen(false);
    setQuickActionDefaultType(null);
  };

  // Re-fetch data on refreshKey change
  const cycles = useMemo(() => StorageService.getCycles(), [refreshKey]);
  const fields = useMemo(() => StorageService.getFields(), [refreshKey]);
  const crops = useMemo(() => StorageService.getCrops(), [refreshKey]);
  const sops = useMemo(() => StorageService.getSOPTemplates(), [refreshKey]);
  const tasks = useMemo(() => StorageService.getTasks(), [refreshKey]);
  const inventory = useMemo(() => StorageService.getInventory(), [refreshKey]);
  const settings = useMemo(() => StorageService.getSettings(), [refreshKey]);

  const activeCycle = useMemo(() => {
    return cycles.find((c) => c.id === activeCycleId) || cycles[0] || null;
  }, [cycles, activeCycleId]);

  const calculateCycleDay = (startDateStr: string, landPrepStartDateStr?: string): CycleDayInfo => {
    if (!startDateStr) {
      return {
        dayNumber: 0,
        label: 'H-0',
        isLandPrep: false,
        prepDayNumber: 0,
        prepDurationDays: 0,
        totalDaysFromPrep: 0,
        displayStatus: 'Belum Mulai'
      };
    }

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let prepDayNumber = 0;
    let prepDurationDays = 0;
    let totalDaysFromPrep = Math.max(0, diffDays);
    let isLandPrep = false;

    if (landPrepStartDateStr) {
      const prepStart = new Date(landPrepStartDateStr);
      prepStart.setHours(0, 0, 0, 0);
      
      const prepDurationMs = start.getTime() - prepStart.getTime();
      prepDurationDays = Math.max(0, Math.floor(prepDurationMs / (1000 * 60 * 60 * 24)));

      const timeFromPrep = today.getTime() - prepStart.getTime();
      prepDayNumber = Math.max(0, Math.floor(timeFromPrep / (1000 * 60 * 60 * 24))) + 1;
      totalDaysFromPrep = Math.max(0, Math.floor(timeFromPrep / (1000 * 60 * 60 * 24)));

      // If today is before planting date and on/after prep date
      if (diffDays < 0 && prepDayNumber > 0) {
        isLandPrep = true;
      }
    } else if (diffDays < 0) {
      isLandPrep = true;
    }

    let label = `H+${diffDays}`;
    let displayStatus = 'Fase Pasca Tanam';

    if (diffDays === 0) {
      label = 'H-0 (Hari Tanam)';
      displayStatus = 'Penanaman Bibit (H-0)';
    } else if (diffDays < 0) {
      label = `H${diffDays}`;
      displayStatus = `Pengolahan Lahan (${prepDayNumber > 0 ? `Hari ke-${prepDayNumber}` : `H${diffDays}`})`;
    } else {
      displayStatus = `Vegetatif / Generatif (H+${diffDays})`;
    }

    return {
      dayNumber: diffDays,
      label,
      isLandPrep,
      prepDayNumber,
      prepDurationDays,
      totalDaysFromPrep,
      displayStatus
    };
  };

  const syncWithSupabase = async (): Promise<{ success: boolean; message: string; syncedCount?: number }> => {
    setSyncStatus('syncing');
    try {
      const result = await StorageService.syncAllToSupabase();
      setSyncStatus(result.success ? 'synced' : 'pending');
      refreshData();
      return result;
    } catch (err: any) {
      setSyncStatus('pending');
      return { success: false, message: err.message || 'Gagal sinkronisasi' };
    }
  };

  const pullFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setSyncStatus('syncing');
    try {
      const result = await StorageService.pullFromSupabase();
      setSyncStatus(result.success ? 'synced' : 'pending');
      refreshData();
      return result;
    } catch (err: any) {
      setSyncStatus('pending');
      return { success: false, message: err.message || 'Gagal mengambil data' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeCycleId,
        setActiveCycleId,
        activeCycle,
        cycles,
        fields,
        crops,
        sops,
        tasks,
        inventory,
        settings,
        refreshData,
        quickActionModalOpen,
        quickActionDefaultType,
        openQuickAction,
        closeQuickAction,
        calculateCycleDay,
        isOnline,
        syncStatus,
        syncWithSupabase,
        pullFromSupabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
