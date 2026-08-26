import React, { useState } from 'react';
import { ProjectPage, Task } from '../types';
import { NOTION_COLORS } from '../utils/notionStyles';
import { addDays, formatDateVi, getTodayString, isOverdue } from '../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalIcon, 
  Clock, 
  Paperclip, 
  CheckSquare, 
  Layers,
  Inbox
} from 'lucide-react';

interface CalendarViewProps {
  project: ProjectPage;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddNewTaskWithDate: (dateStr: string) => void;
  darkMode: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onAddNewTaskWithDate,
  darkMode,
}) => {
  const today = getTodayString();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [showUnscheduled, setShowUnscheduled] = useState(true);

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

  // Identify unscheduled tasks (no dates set)
  const unscheduledTasks = tasks.filter((t) => !t.dueDate && !t.startDate);

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
          <h2 className="text-base sm:text-lg font-bold text-[#37352f] dark:text-white">
            Tháng {month + 1}, {year}
          </h2>
          <button
            onClick={jumpToToday}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs transition-colors ${
              darkMode ? 'bg-[#2a2a2a] border-[#3e3e3e] text-white' : 'bg-white border-[#e3e2e0] text-[#37352f]'
            }`}
          >
            Hôm nay
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Unscheduled dock toggle button */}
          <button
            onClick={() => setShowUnscheduled(!showUnscheduled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              showUnscheduled
                ? 'bg-blue-50 border-blue-200 text-[#2383e2] dark:bg-blue-950/50 dark:border-blue-800'
                : (darkMode ? 'border-[#383838] text-[#888]' : 'border-[#e3e2e0] text-[#787774]')
            }`}
          >
            <Inbox size={13} />
            <span>Chưa xếp lịch ({unscheduledTasks.length})</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className={`p-1.5 rounded-md border transition-colors ${
                darkMode ? 'border-[#383838] text-[#aaa]' : 'border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className={`p-1.5 rounded-md border transition-colors ${
                darkMode ? 'border-[#383838] text-[#aaa]' : 'border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Calendar Grid + Optional Unscheduled Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Calendar Grid Container */}
        <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col shadow-xs ${
          darkMode ? 'bg-[#1e1e1e] border-[#2f2f2f]' : 'bg-white border-[#e3e2e0]'
        }`}>
          {/* Days of week */}
          <div className={`grid grid-cols-7 border-b text-xs font-semibold py-2 text-center shrink-0 ${
            darkMode ? 'bg-[#181818] border-[#2f2f2f] text-[#888]' : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#9b9a97]'
          }`}>
            {daysHeader.map((d, i) => (
              <div key={i} className={i === 0 || i === 6 ? 'text-red-400' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-[#f1f1ef] dark:divide-[#282828] overflow-y-auto">
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
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between group hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                    !cell.isCurrentMonth ? (darkMode ? 'bg-[#181818]/60 opacity-40' : 'bg-[#faf9f8] opacity-50') : ''
                  } ${cell.isToday ? (darkMode ? 'bg-[#2383e2]/10' : 'bg-[#e0f2fe]/50') : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                        cell.isToday 
                          ? 'bg-[#2383e2] text-white' 
                          : cell.isCurrentMonth 
                          ? (darkMode ? 'text-[#ddd]' : 'text-[#37352f]') 
                          : 'text-[#9b9a97]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNewTaskWithDate(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9b9a97] hover:text-[#2383e2] transition-opacity"
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
                            <span className="truncate font-semibold text-[#37352f] dark:text-white">
                              {task.title}
                            </span>
                          </div>

                          {/* Time & status badge for tasks during the day */}
                          <div className="flex items-center gap-1.5 text-[9px] text-[#787774] dark:text-[#aaa] pl-2.5">
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

        {/* Unscheduled / Backlog Tasks Dock */}
        {showUnscheduled && (
          <div className={`w-full lg:w-72 rounded-xl border flex flex-col shrink-0 overflow-hidden shadow-xs ${
            darkMode ? 'bg-[#1e1e1e] border-[#2f2f2f]' : 'bg-white border-[#e3e2e0]'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              darkMode ? 'bg-[#181818] border-[#2f2f2f]' : 'bg-[#f7f6f3] border-[#e8e7e4]'
            }`}>
              <div className="flex items-center gap-2">
                <Inbox size={14} className="text-[#9b9a97]" />
                <span className="text-xs font-bold text-[#37352f] dark:text-white">Chưa xếp lịch</span>
                <span className="text-xs font-mono text-[#9b9a97]">({unscheduledTasks.length})</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-8 text-[#9b9a97] text-xs">
                  Không có công việc nào chưa xếp lịch.
                </div>
              ) : (
                unscheduledTasks.map((task) => {
                  const col = project.columns.find((c) => c.id === task.status);
                  const colColor = col ? col.color : 'gray';
                  const colStyle = NOTION_COLORS[colColor] || NOTION_COLORS.gray;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.01] space-y-1.5 ${
                        darkMode ? 'bg-[#242424] border-[#313131] hover:border-[#444]' : 'bg-[#fbfbfa] border-[#e8e7e4] hover:border-[#ccc]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${colStyle.badgeBg}`}>
                          {col?.title || 'Chưa xếp lịch'}
                        </span>
                        {task.priority !== 'none' && (
                          <span className="text-[10px] text-[#9b9a97] uppercase font-mono">
                            {task.priority}
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-[#37352f] dark:text-white truncate">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-[#9b9a97] pt-1 border-t border-black/5 dark:border-white/5">
                        <span>Bấm để gán ngày hạn</span>
                        <span className="text-[#2383e2] font-semibold">Chi tiết →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
