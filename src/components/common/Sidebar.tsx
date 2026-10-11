import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  MapPin,
  FileText,
  Bug,
  Boxes,
  ShoppingBag,
  CircleDollarSign,
  BarChart3,
  Settings,
  Sprout,
  X,
  ShieldCheck,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { activeTab, setActiveTab, activeCycle, tasks, settings } = useApp();

  const pendingTasksCount = tasks.filter(t => t.cycleId === activeCycle?.id && t.status === 'pending').length;
  const overdueTasksCount = tasks.filter(t => t.cycleId === activeCycle?.id && t.status === 'overdue').length;

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    section?: string;
  }[] = [
    {
      id: 'dashboard_monitor',
      label: 'Dashboard Monitor',
      icon: <LayoutDashboard className="w-5 h-5" />,
      section: 'UTAMA'
    },
    {
      id: 'dashboard_tasks',
      label: 'Dashboard Tugas',
      icon: <CheckSquare className="w-5 h-5" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: overdueTasksCount > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300',
      section: 'UTAMA'
    },
    {
      id: 'fields_varieties',
      label: 'Lahan & Varietas',
      icon: <MapPin className="w-5 h-5" />,
      section: 'BUDIDAYA'
    },
    {
      id: 'sop_builder',
      label: 'SOP & Builder',
      icon: <FileText className="w-5 h-5" />,
      section: 'BUDIDAYA'
    },
    {
      id: 'pest_disease',
      label: 'Hama & Penyakit',
      icon: <Bug className="w-5 h-5" />,
      section: 'PROTEKSI & LOGISTIK'
    },
    {
      id: 'inventory',
      label: 'Inventaris & Stok',
      icon: <Boxes className="w-5 h-5" />,
      section: 'PROTEKSI & LOGISTIK'
    },
    {
      id: 'harvest',
      label: 'Data Panen',
      icon: <ShoppingBag className="w-5 h-5" />,
      section: 'HASIL & KEUANGAN'
    },
    {
      id: 'finance',
      label: 'Keuangan (P&L)',
      icon: <CircleDollarSign className="w-5 h-5" />,
      section: 'HASIL & KEUANGAN'
    },
    {
      id: 'reports',
      label: 'Laporan & Analitik',
      icon: <BarChart3 className="w-5 h-5" />,
      section: 'SISTEM'
    },
    {
      id: 'settings',
      label: 'Pengaturan & Backup',
      icon: <Settings className="w-5 h-5" />,
      section: 'SISTEM'
    }
  ];

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile?.();
  };

  let currentSection = '';

  return (
    <>
      {/* 1. MOBILE & TABLET OFF-CANVAS DRAWER (< lg) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => onCloseMobile?.()}
          aria-label="Tutup menu navigasi"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-[#e9ece6] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#e9ece6] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
              NF
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-emerald-900">
                NAVA<span className="font-light">FARM</span>
              </h1>
              <p className="text-[11px] text-gray-500 truncate max-w-[130px]">{settings.farmName}</p>
            </div>
          </div>

          <button
            onClick={() => onCloseMobile?.()}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
            const showSection = item.section && item.section !== currentSection;
            if (showSection && item.section) {
              currentSection = item.section;
            }

            return (
              <React.Fragment key={`mob-${item.id}`}>
                {showSection && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    {item.section}
                  </div>
                )}

                <button
                  id={`mob-nav-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                      : 'text-gray-600 hover:bg-[#f3f5f0] hover:text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isSelected ? 'text-emerald-700' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Active Cycle Snapshot Card in Footer */}
        <div className="p-3 border-t border-[#e9ece6] bg-[#f9faf8] shrink-0">
          <div className="p-3 bg-emerald-900 rounded-xl text-white shadow-xs">
            <div className="flex items-center justify-between text-[11px] opacity-80 mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Sync & SOP Engine
              </span>
              <span className="font-mono text-emerald-200 font-bold">
                {activeCycle?.sopSnapshot?.versionNumber || 'V1.0'}
              </span>
            </div>
            <div className="text-xs font-semibold text-white truncate">
              {activeCycle?.sopSnapshot?.templateName || activeCycle?.cropTypeName || 'AgriSOP System'}
            </div>
            <div className="text-[10px] opacity-80 mt-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Active & Synced</span>
              </span>
              <span className="text-emerald-300 font-mono font-medium">Auto-Protected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. DESKTOP IN-FLOW STICKY SIDEBAR (lg+) */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border border-[#e9ece6] rounded-2xl shadow-xs sticky top-20 h-[calc(100vh-6rem)] overflow-hidden self-start">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#e9ece6] bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs">
              AG
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-emerald-900">
                NAVA<span className="font-light">FARM</span>
              </h1>
              <p className="text-[10px] text-gray-500 truncate max-w-[130px]">{settings.farmName}</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {(() => {
            let deskSection = '';
            return navItems.map((item) => {
              const isSelected = activeTab === item.id;
              const showSection = item.section && item.section !== deskSection;
              if (showSection && item.section) {
                deskSection = item.section;
              }

              return (
                <React.Fragment key={`desk-${item.id}`}>
                  {showSection && (
                    <div className="px-2.5 pt-2.5 pb-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                      {item.section}
                    </div>
                  )}

                  <button
                    id={`nav-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-gray-600 hover:bg-[#f3f5f0] hover:text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isSelected ? 'text-emerald-700' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            });
          })()}
        </div>

        {/* Active Cycle Snapshot Card in Footer */}
        <div className="p-2.5 border-t border-[#e9ece6] bg-[#f9faf8] shrink-0">
          <div className="p-2.5 bg-emerald-900 rounded-xl text-white shadow-xs">
            <div className="flex items-center justify-between text-[10px] opacity-80 mb-0.5">
              <span className="flex items-center gap-1 font-semibold truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                Sync & SOP Engine
              </span>
              <span className="font-mono text-emerald-200 font-bold shrink-0">
                {activeCycle?.sopSnapshot?.versionNumber || 'V1.0'}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-white truncate">
              {activeCycle?.sopSnapshot?.templateName || activeCycle?.cropTypeName || 'AgriSOP System'}
            </div>
            <div className="text-[9px] opacity-80 mt-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Active & Synced</span>
              </span>
              <span className="text-emerald-300 font-mono font-medium">Auto-Protected</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
