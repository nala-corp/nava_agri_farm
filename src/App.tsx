/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { QuickActionModal } from './components/common/QuickActionModal';
import { DashboardMonitor } from './components/dashboard/DashboardMonitor';
import { DashboardTasks } from './components/tasks/DashboardTasks';
import { SopManager } from './components/sop/SopManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { FinanceManager } from './components/finance/FinanceManager';
import { HarvestManager } from './components/harvest/HarvestManager';
import { ReportsAnalytics } from './components/reports/ReportsAnalytics';
import { CycleFieldManager } from './components/cycles/CycleFieldManager';
import { PestDiseaseManager } from './components/protection/PestDiseaseManager';
import { SettingsManager } from './components/settings/SettingsManager';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fdfdfb] text-[#2d3436] flex flex-col antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Header with Global Context Selector */}
      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />

      <div className="flex-1 flex w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        {/* Desktop / Mobile Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main View Area */}
        <main className="flex-1 min-w-0 pb-28 lg:pb-8">
          {activeTab === 'dashboard_monitor' && <DashboardMonitor />}
          {activeTab === 'dashboard_tasks' && <DashboardTasks />}
          {(activeTab === 'fields_varieties' || activeTab === 'cycles_fields') && <CycleFieldManager />}
          {(activeTab === 'sop_builder' || activeTab === 'sop_manager') && <SopManager />}
          {activeTab === 'pest_disease' && <PestDiseaseManager />}
          {(activeTab === 'inventory' || activeTab === 'inventory_manager') && <InventoryManager />}
          {(activeTab === 'harvest' || activeTab === 'harvest_manager') && <HarvestManager />}
          {(activeTab === 'finance' || activeTab === 'finance_manager') && <FinanceManager />}
          {(activeTab === 'reports' || activeTab === 'reports_analytics') && <ReportsAnalytics />}
          {activeTab === 'settings' && <SettingsManager />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)} />

      {/* Centralized Quick Action Trigger Modal */}
      <QuickActionModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

