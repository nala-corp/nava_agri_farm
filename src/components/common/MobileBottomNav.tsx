import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Plus,
  ShoppingBag,
  Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  onToggleSidebar?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onToggleSidebar }) => {
  const { activeTab, setActiveTab, openQuickAction, tasks, activeCycle } = useApp();

  const pendingTasksCount = tasks.filter(t => t.cycleId === activeCycle?.id && t.status === 'pending').length;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e9ece6] px-2 py-1.5 flex items-center justify-around shadow-lg">
      {/* Monitor */}
      <button
        id="mobile-nav-monitor"
        onClick={() => setActiveTab('dashboard_monitor')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'dashboard_monitor' ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-emerald-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Monitor</span>
      </button>

      {/* Tasks */}
      <button
        id="mobile-nav-tasks"
        onClick={() => setActiveTab('dashboard_tasks')}
        className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'dashboard_tasks' ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-emerald-900'
        }`}
      >
        <CheckSquare className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Tugas</span>
        {pendingTasksCount > 0 && (
          <span className="absolute top-0 right-2 w-4 h-4 bg-emerald-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
            {pendingTasksCount}
          </span>
        )}
      </button>

      {/* Quick Action PLUS Center Button */}
      <div className="-mt-5 flex justify-center">
        <button
          id="mobile-nav-quick-add"
          onClick={() => openQuickAction()}
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-200 ring-4 ring-[#fdfdfb] transition-transform active:scale-95 cursor-pointer"
          title="Tambah Data Cepat"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Harvest */}
      <button
        id="mobile-nav-harvest"
        onClick={() => setActiveTab('harvest')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'harvest' || activeTab === 'harvest_manager' ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-emerald-900'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Panen</span>
      </button>

      {/* More / Menu */}
      <button
        id="mobile-nav-menu"
        onClick={() => onToggleSidebar?.()}
        className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-gray-500 hover:text-emerald-900 transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Menu</span>
      </button>
    </nav>
  );
};
