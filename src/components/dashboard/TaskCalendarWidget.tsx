import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CycleTask } from '../../types';

interface TaskCalendarProps {
  tasks: CycleTask[];
  cycleStartDate?: string;
  onExecuteTask: (task: CycleTask) => void;
  onRevertTask: (taskId: string) => void;
  onQuickComplete: (task: CycleTask) => void;
}

export const TaskCalendarWidget: React.FC<TaskCalendarProps> = ({
  tasks,
  cycleStartDate,
  onExecuteTask,
  onRevertTask,
  onQuickComplete
}) => {
  // Base date for navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Map tasks by scheduled date
  const tasksByDate = useMemo(() => {
    const map: Record<string, CycleTask[]> = {};
    tasks.forEach(t => {
      if (!t.scheduledDate) return;
      if (!map[t.scheduledDate]) {
        map[t.scheduledDate] = [];
      }
      map[t.scheduledDate].push(t);
    });
    return map;
  }, [tasks]);

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: CycleTask[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month filler days
    const startOffset = (firstDayIndex + 6) % 7; // Monday as 0
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        tasks: tasksByDate[dateStr] || []
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        tasks: tasksByDate[dateStr] || []
      });
    }

    // Next month filler days to complete grid (up to 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        tasks: tasksByDate[dateStr] || []
      });
    }

    return days;
  }, [year, month, tasksByDate]);

  const selectedDateTasks = useMemo(() => {
    return tasksByDate[selectedDateStr] || [];
  }, [selectedDateStr, tasksByDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9ece6]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              Jadwal & Kalender Tugas SOP
            </h3>
            <p className="text-[11px] text-gray-500">
              Pantau jadwal harian tugas lapangan berdasarkan umur tanaman
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center bg-[#f3f5f0] p-0.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-slate-800'
              }`}
            >
              Kalender
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-slate-800'
              }`}
            >
              Timeline
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-[#e9ece6] pl-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-[#f3f5f0] text-gray-600 cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 min-w-[110px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-[#f3f5f0] text-gray-600 cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer ml-1"
            >
              Hari Ini
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            {/* Weekday Names */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 pb-2">
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
              <span className="text-red-400">Min</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isSelected = day.dateStr === selectedDateStr;
                const hasTasks = day.tasks.length > 0;
                const completedTasks = day.tasks.filter(t => t.status === 'completed');
                const overdueTasks = day.tasks.filter(t => t.status === 'overdue');
                const isAllCompleted = hasTasks && completedTasks.length === day.tasks.length;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`min-h-[56px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : day.isToday
                        ? 'bg-amber-50/50 border-amber-300'
                        : day.isCurrentMonth
                        ? 'bg-white border-[#e9ece6] hover:border-emerald-200'
                        : 'bg-[#fafbfa] border-[#f0f2ed] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-semibold ${
                          day.isToday
                            ? 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]'
                            : isSelected
                            ? 'text-emerald-900 font-bold'
                            : day.isCurrentMonth
                            ? 'text-slate-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {hasTasks && (
                        <span className="text-[9px] font-mono font-bold text-gray-500">
                          {completedTasks.length}/{day.tasks.length}
                        </span>
                      )}
                    </div>

                    {/* Task Indicators */}
                    {hasTasks && (
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        {isAllCompleted ? (
                          <div className="w-full bg-emerald-100 text-emerald-800 text-[9px] font-semibold px-1 py-0.5 rounded flex items-center gap-0.5 truncate">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                            <span className="truncate">{day.tasks.length} Selesai</span>
                          </div>
                        ) : overdueTasks.length > 0 ? (
                          <div className="w-full bg-red-100 text-red-800 text-[9px] font-semibold px-1 py-0.5 rounded flex items-center gap-0.5 truncate">
                            <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                            <span className="truncate">{overdueTasks.length} Terlambat</span>
                          </div>
                        ) : (
                          <div className="w-full bg-emerald-50 text-emerald-900 text-[9px] font-semibold px-1 py-0.5 rounded flex items-center gap-0.5 truncate border border-emerald-200">
                            <Clock className="w-2.5 h-2.5 text-emerald-700" />
                            <span className="truncate">{day.tasks.length} Tugas</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details Panel */}
          <div className="lg:col-span-1 bg-[#f9faf8] rounded-xl border border-[#e9ece6] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#e1e5db]">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 block uppercase">
                    Rincian Tanggal
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedDateTasks.length} Tugas
                </span>
              </div>

              {/* Tasks for selected day */}
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          isCompleted
                            ? 'bg-white border-[#e9ece6] opacity-80'
                            : 'bg-white border-emerald-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-emerald-800 px-1.5 py-0.2 bg-emerald-50 rounded">
                                H{task.dayOffset >= 0 ? `+${task.dayOffset}` : task.dayOffset}
                              </span>
                              <span className="font-bold text-slate-800">{task.taskName}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          {isCompleted ? (
                            <span className="text-emerald-700 shrink-0" title="Selesai">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-amber-600 shrink-0" title="Menunggu">
                              <Clock className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                        {/* Action Buttons for this task */}
                        <div className="mt-2 pt-2 border-t border-[#f0f2ed] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-400 font-mono">
                            {task.deadlineTime || '12:00'} WIB
                          </span>

                          <div className="flex items-center gap-1.5">
                            {!isCompleted ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onQuickComplete(task)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  ✓ Selesai
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onExecuteTask(task)}
                                  className="px-2 py-1 bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 rounded-lg text-[10px] font-medium cursor-pointer"
                                >
                                  Form Input
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onRevertTask(task.id)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Batalkan status selesai jika ada salah klik"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Batal Selesai
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-gray-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    Tidak ada jadwal tugas di tanggal ini.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#e1e5db] text-[10px] text-gray-400 flex items-center justify-between">
              <span>● Hijau: Selesai</span>
              <span>● Kuning: Hari Ini</span>
              <span>● Merah: Terlambat</span>
            </div>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
          {tasks.map(task => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isCompleted ? 'bg-[#fbfcfb] border-[#e9ece6]' : 'bg-white border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    H{task.dayOffset >= 0 ? `+${task.dayOffset}` : task.dayOffset}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 truncate">{task.taskName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {task.scheduledDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isCompleted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onQuickComplete(task)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        ✓ Selesai
                      </button>
                      <button
                        type="button"
                        onClick={() => onExecuteTask(task)}
                        className="px-2.5 py-1.5 bg-[#f3f5f0] hover:bg-[#e9ece6] text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Form
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRevertTask(task.id)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Batal Selesai
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
