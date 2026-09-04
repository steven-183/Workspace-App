import React, { useState } from 'react';
import { AppTheme, ProjectPage, Task } from '../types';
import { NOTION_COLORS } from '../utils/notionStyles';
import { formatDateVi, getTodayString, isOverdue } from '../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalIcon, 
  Clock
} from 'lucide-react';

interface CalendarViewProps {
  project: ProjectPage;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddNewTaskWithDate: (dateStr: string) => void;
  darkMode: boolean;
  appTheme?: AppTheme;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onAddNewTaskWithDate,
  darkMode,
  appTheme = 'light',
}) => {
  const isPink = appTheme === 'qanda_pink';
  const today = getTodayString();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentMonthDate(new Date());
  };

  const daysHeader = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  // Generate calendar cells (including padding for previous and next month)
  const calendarCells = [];
  
  // Previous month padding
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i;
    const prevMonthDateStr = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({
      dateStr: prevMonthDateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: prevMonthDateStr === today,
    });
  }

  // Current month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dateStr === today,
    });
  }

  // Next month padding to fill complete weeks (multiple of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDateStr = `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dateStr: nextMonthDateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: nextMonthDateStr === today,
    });
  }

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-8 space-y-4">
      {/* Calendar Header Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className={`text-base sm:text-lg font-bold ${
            isPink ? 'text-[#4c0519]' : darkMode ? 'text-white' : 'text-[#37352f]'
          }`}>
            Tháng {month + 1}, {year}
          </h2>
          <button
            onClick={jumpToToday}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs transition-colors ${
              isPink 
                ? 'bg-white border-[#fda4af] text-[#9f1239] hover:bg-[#fff0f3]' 
                : darkMode 
                ? 'bg-[#2a2a2a] border-[#3e3e3e] text-white' 
                : 'bg-white border-[#e3e2e0] text-[#37352f]'
            }`}
          >
            Hôm nay
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className={`p-1.5 rounded-md border transition-colors ${
              isPink 
                ? 'border-[#fda4af] text-[#881337] hover:bg-[#ffe4e6]' 
                : darkMode 
                ? 'border-[#383838] text-[#aaa]' 
                : 'border-[#e3e2e0] text-[#787774]'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className={`p-1.5 rounded-md border transition-colors ${
              isPink 
                ? 'border-[#fda4af] text-[#881337] hover:bg-[#ffe4e6]' 
                : darkMode 
                ? 'border-[#383838] text-[#aaa]' 
                : 'border-[#e3e2e0] text-[#787774]'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Content: Full-width Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Calendar Grid Container */}
        <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col shadow-xs ${
          isPink ? 'bg-white border-[#fecdd3]' : darkMode ? 'bg-[#1e1e1e] border-[#2f2f2f]' : 'bg-white border-[#e3e2e0]'
        }`}>
          {/* Days of week */}
          <div className={`grid grid-cols-7 border-b text-xs font-semibold py-2 text-center shrink-0 ${
            isPink 
              ? 'bg-[#fff5f6] border-[#fecdd3] text-[#881337]' 
              : darkMode 
              ? 'bg-[#181818] border-[#2f2f2f] text-[#888]' 
              : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#9b9a97]'
          }`}>
            {daysHeader.map((d, i) => (
              <div key={i} className={i === 0 || i === 6 ? 'text-red-500 font-semibold' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className={`grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y overflow-y-auto ${
            isPink ? 'divide-[#ffe4e6]' : darkMode ? 'divide-[#282828]' : 'divide-[#f1f1ef]'
          }`}>
            {calendarCells.map((cell) => {
              // Exact date filtering: only tasks that match this date
              const dayTasks = tasks.filter((t) => {
                if (!t.dueDate && !t.startDate) return false;
                if (t.status === 'backlog' && !t.dueDate && !t.startDate) return false;
                return t.dueDate === cell.dateStr || t.startDate === cell.dateStr;
              });

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => onAddNewTaskWithDate(cell.dateStr)}
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between group transition-colors cursor-pointer ${
                    isPink 
                      ? (!cell.isCurrentMonth ? 'bg-[#fff9fa] opacity-60' : 'hover:bg-[#fff0f3]') 
                      : (!cell.isCurrentMonth ? (darkMode ? 'bg-[#181818]/60 opacity-40' : 'bg-[#faf9f8] opacity-50') : 'hover:bg-black/5 dark:hover:bg-white/5')
                  } ${cell.isToday ? (isPink ? 'bg-[#ffe4e6]/50' : darkMode ? 'bg-[#2383e2]/10' : 'bg-[#e0f2fe]/50') : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                        cell.isToday 
                          ? (isPink ? 'bg-[#e11d48] text-white' : 'bg-[#2383e2] text-white')
                          : cell.isCurrentMonth 
                          ? (isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#ddd]' : 'text-[#37352f]') 
                          : (isPink ? 'text-[#881337]/40' : 'text-[#9b9a97]')
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNewTaskWithDate(cell.dateStr);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-0.5 transition-opacity ${
                        isPink ? 'text-[#881337] hover:text-[#e11d48]' : 'text-[#9b9a97] hover:text-[#2383e2]'
                      }`}
                      title="Thêm công việc vào ngày này"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Day tasks ribbons with dynamic colors matching Kanban column */}
                  <div className="space-y-1 overflow-y-auto max-h-[110px] no-scrollbar">
                    {dayTasks.map((task) => {
                      // Dynamically sync status & color with the project columns
                      const col = project.columns.find((c) => c.id === task.status);
                      const colColor = col ? col.color : 'gray';
                      const colStyle = NOTION_COLORS[colColor] || NOTION_COLORS.gray;

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                          className={`text-[10px] px-1.5 py-1 rounded-md font-medium flex flex-col gap-0.5 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer ${colStyle.badgeBg}`}
                          title={`${task.title} - ${col?.title || task.status}${task.dueTime ? ` (${task.dueTime})` : ''}`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colStyle.dot}`} />
                            <span className={`truncate font-semibold ${
                              isPink ? 'text-[#4c0519]' : darkMode ? 'text-white' : 'text-[#37352f]'
                            }`}>
                              {task.title}
                            </span>
                          </div>

                          {/* Time & status badge for tasks during the day */}
                          <div className={`flex items-center gap-1.5 text-[9px] pl-2.5 ${
                            isPink ? 'text-[#881337]' : darkMode ? 'text-[#aaa]' : 'text-[#787774]'
                          }`}>
                            {task.dueTime && (
                              <span className="flex items-center gap-0.5 font-mono">
                                <Clock size={9} />
                                <span>{task.dueTime}</span>
                              </span>
                            )}
                            <span className="truncate">
                              {col?.title || task.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
