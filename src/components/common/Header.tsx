import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Bell, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sprout, 
  Calendar,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { 
    activeCycle, 
    cycles, 
    setActiveCycleId, 
    openQuickAction, 
    calculateCycleDay, 
    isOnline, 
    syncStatus, 
    settings,
    tasks,
    inventory,
    setActiveTab
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute alerts
  const overdueTasks = tasks.filter(t => t.cycleId === activeCycle?.id && t.status === 'overdue');
  const todayTasks = tasks.filter(t => t.cycleId === activeCycle?.id && t.status === 'pending');
  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStockAlert);
  const totalAlerts = overdueTasks.length + lowStockItems.length + (todayTasks.length > 0 ? 1 : 0);

  const activeCycleDay = activeCycle ? calculateCycleDay(activeCycle.startDate) : { dayNumber: 0, label: 'H-0' };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e9ece6] text-[#2d3436] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Left: Mobile/Tablet Toggle & Context Selector */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button 
            id="mobile-sidebar-toggle-btn"
            onClick={() => onToggleMobileSidebar?.()}
            className="lg:hidden p-2 text-gray-600 hover:text-emerald-900 rounded-xl hover:bg-emerald-50 transition-colors shrink-0"
            title="Buka Menu"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* GLOBAL CULTIVATION CONTEXT SELECTOR */}
          <div className="relative min-w-0" ref={dropdownRef}>
            <button
              id="context-selector-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-[#f3f5f0] hover:bg-emerald-50/80 border border-[#e1e5db] rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer max-w-full"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300/60 flex items-center justify-center text-sm shrink-0">
                {activeCycle?.cropIcon || '🌱'}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs sm:text-sm text-emerald-950 truncate max-w-[100px] sm:max-w-[160px] md:max-w-[200px]">
                    {activeCycle ? activeCycle.fieldName.split('—')[0].trim() : 'Pilih Siklus'}
                  </span>
                  <span className="text-gray-400 text-xs hidden sm:inline">•</span>
                  <span className="text-emerald-700 font-medium text-xs truncate max-w-[80px] sm:max-w-[140px] md:max-w-[160px]">
                    {activeCycle?.varietyName || 'Belum ada siklus'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-gray-500">
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                    {activeCycleDay.label}
                  </span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span className="hidden sm:inline text-gray-600 truncate">{activeCycle?.plantCount.toLocaleString('id-ID')} Tanaman</span>
                  <span className="hidden xl:inline text-gray-300">|</span>
                  <span className="hidden xl:inline text-gray-600">{activeCycle?.sopSnapshot?.versionNumber || 'SOP'}</span>
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-emerald-900 transition-transform shrink-0 ml-0.5 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* CONTEXT DROPDOWN MENU */}
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl border border-[#e1e5db] shadow-xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
                <div className="p-3 bg-[#f9faf8] border-b border-[#e9ece6] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950 tracking-wide uppercase">Pilih Siklus Budidaya</span>
                  </div>
                  <span className="text-[11px] text-gray-500">{cycles.length} Siklus Aktif</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#f0f2ed]">
                  {cycles.map((cycle) => {
                    const isSelected = cycle.id === activeCycle?.id;
                    const cycleDay = calculateCycleDay(cycle.startDate);
                    return (
                      <button
                        key={cycle.id}
                        onClick={() => {
                          setActiveCycleId(cycle.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full p-3 text-left flex items-start gap-3 hover:bg-[#f3f5f0] transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'pl-4'
                        }`}
                      >
                        <span className="text-xl p-1 bg-white border border-[#e1e5db] rounded-lg shadow-xs">{cycle.cropIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-800 truncate">
                              {cycle.fieldName}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ml-2">
                              {cycleDay.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {cycle.cropTypeName} — <span className="text-slate-700 font-medium">{cycle.varietyName}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                            <span>🌱 {cycle.plantCount.toLocaleString('id-ID')} bibit</span>
                            <span>📋 {cycle.sopSnapshot.versionNumber}</span>
                            <span>📅 Tanam: {cycle.startDate}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-[#f9faf8] border-t border-[#e9ece6]">
                  <button
                    id="dropdown-create-cycle-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      openQuickAction('create_cycle');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Buat Siklus Budidaya Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action +, Notifications, Sync Status, User Info */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* QUICK ACTION BUTTON */}
          <button
            id="global-quick-action-btn"
            onClick={() => openQuickAction()}
            className="w-9 h-9 sm:w-auto sm:px-3.5 sm:py-2 rounded-full sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Aksi Cepat (+)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Aksi Cepat</span>
          </button>

          {/* NOTIFICATION CENTER */}
          <div className="relative" ref={notifRef}>
            <button
              id="notifications-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white border border-[#e1e5db] rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Notifikasi & Peringatan"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl border border-[#e1e5db] shadow-xl z-50 p-3 text-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-[#e9ece6]">
                  <span className="text-xs font-bold tracking-wide uppercase text-gray-600">Pemberitahuan & Peringatan</span>
                  <span className="text-[11px] text-gray-500">{totalAlerts} Item</span>
                </div>

                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {overdueTasks.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-xs">
                      <div className="font-semibold text-red-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        {overdueTasks.length} Tugas Terlambat!
                      </div>
                      <p className="text-red-600 text-[11px] mt-0.5">
                        Tugas SOP melewati batas waktu pelaksanaan.
                      </p>
                    </div>
                  )}

                  {todayTasks.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-xs">
                      <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        {todayTasks.length} Tugas Menunggu Hari Ini
                      </div>
                      <p className="text-amber-700 text-[11px] mt-0.5">
                        Selesaikan tugas SOP siklus aktif hari ini.
                      </p>
                    </div>
                  )}

                  {lowStockItems.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#f9faf8] border border-[#e1e5db] text-xs">
                      <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {lowStockItems.length} Stok Inventaris Menipis
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {lowStockItems.map(i => i.name).slice(0, 2).join(', ')} mendekati batas minimum.
                      </p>
                    </div>
                  )}

                  {totalAlerts === 0 && (
                    <div className="p-4 text-center text-xs text-gray-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      Semua tugas dan stok dalam kondisi prima!
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-[#e9ece6] text-center">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      setActiveTab('dashboard_tasks');
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    Buka Dashboard Tugas →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SYNC / OFFLINE STATUS BADGE */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f5f0] border border-[#e1e5db] text-[11px]"
            title={isOnline ? 'PWA Online — Tersinkronisasi lokal & database' : 'Mode Offline — Data tersimpan aman di perangkat'}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-gray-700 font-medium">{syncStatus === 'syncing' ? 'Syncing...' : 'Online'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span className="text-amber-800 font-medium">Offline</span>
              </>
            )}
          </div>

          {/* OWNER USER AVATAR */}
          <div 
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#e9ece6] cursor-pointer hover:opacity-90 transition-opacity"
            title="Pengaturan Akun & Peternakan"
          >
            <div className="w-9 h-9 rounded-full bg-[#d2d9cc] flex items-center justify-center font-bold text-emerald-950 text-xs border border-[#bcc5b4]">
              ADMIN
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-none">{settings.ownerName}</div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Owner / Admin</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
