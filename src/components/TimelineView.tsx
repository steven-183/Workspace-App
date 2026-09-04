import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppTheme, ProjectPage, Task, TimelineZoom } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { 
  addDays, 
  diffInDays, 
  formatDateVi, 
  formatShortDate, 
  generateDateRange, 
  getTodayString, 
  isDueToday, 
  isOverdue 
} from '../utils/dateUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  GripHorizontal, 
  AlertCircle,
  Maximize2,
  Minimize2,
  CheckCircle2
} from 'lucide-react';

interface TimelineViewProps {
  project: ProjectPage;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTaskDates: (taskId: string, newStartDate: string, newDueDate: string) => void;
  onAddNewTask: (initialStartDate?: string, initialDueDate?: string) => void;
  timelineZoom: TimelineZoom;
  onZoomChange: (zoom: TimelineZoom) => void;
  darkMode: boolean;
  appTheme?: AppTheme;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onUpdateTaskDates,
  onAddNewTask,
  timelineZoom,
  onZoomChange,
  darkMode,
  appTheme = 'light',
}) => {
  const isPink = appTheme === 'qanda_pink';
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayString();

  // Determine the date bounds for the timeline
  // We want to show around 15 days before today up to 45 days after today (total 60 days)
  const [baseStartDate, setBaseStartDate] = useState(() => addDays(todayStr, -14));
  const totalDays = timelineZoom === 'month' ? 120 : timelineZoom === 'week' ? 70 : 45;

  const dayWidth = timelineZoom === 'day' ? 52 : timelineZoom === 'week' ? 28 : 16;

  const dateItems = useMemo(() => {
    return generateDateRange(baseStartDate, totalDays);
  }, [baseStartDate, totalDays]);

  // Dragging state for timeline bars
  const [activeDrag, setActiveDrag] = useState<{
    taskId: string;
    mode: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    initialStartDate: string;
    initialDueDate: string;
    currentStartDate: string;
    currentDueDate: string;
  } | null>(null);

  // Auto scroll to Today on mount
  useEffect(() => {
    scrollToToday();
  }, [timelineZoom]);

  const scrollToToday = () => {
    if (!timelineScrollRef.current) return;
    const daysFromStart = diffInDays(baseStartDate, todayStr);
    if (daysFromStart >= 0) {
      const scrollPos = daysFromStart * dayWidth - 200;
      timelineScrollRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth',
      });
    }
  };

  const handleTimelineShift = (days: number) => {
    setBaseStartDate((prev) => addDays(prev, days));
  };

  // Dragging calculations
  const handleMouseDown = (
    e: React.MouseEvent,
    task: Task,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startD = task.startDate || todayStr;
    const dueD = task.dueDate || addDays(startD, 3);

    setActiveDrag({
      taskId: task.id,
      mode,
      startX: e.clientX,
      initialStartDate: startD,
      initialDueDate: dueD,
      currentStartDate: startD,
      currentDueDate: dueD,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDrag) return;

      const deltaX = e.clientX - activeDrag.startX;
      const deltaDays = Math.round(deltaX / dayWidth);

      let newStart = activeDrag.initialStartDate;
      let newDue = activeDrag.initialDueDate;

      if (activeDrag.mode === 'move') {
        newStart = addDays(activeDrag.initialStartDate, deltaDays);
        newDue = addDays(activeDrag.initialDueDate, deltaDays);
      } else if (activeDrag.mode === 'resize-start') {
        const candidate = addDays(activeDrag.initialStartDate, deltaDays);
        if (candidate <= activeDrag.initialDueDate) {
          newStart = candidate;
        }
      } else if (activeDrag.mode === 'resize-end') {
        const candidate = addDays(activeDrag.initialDueDate, deltaDays);
        if (candidate >= activeDrag.initialStartDate) {
          newDue = candidate;
        }
      }

      setActiveDrag((prev) => prev ? {
        ...prev,
        currentStartDate: newStart,
        currentDueDate: newDue,
      } : null);
    };

    const handleMouseUp = () => {
      if (activeDrag) {
        if (
          activeDrag.currentStartDate !== activeDrag.initialStartDate ||
          activeDrag.currentDueDate !== activeDrag.initialDueDate
        ) {
          onUpdateTaskDates(activeDrag.taskId, activeDrag.currentStartDate, activeDrag.currentDueDate);
        }
        setActiveDrag(null);
      }
    };

    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, dayWidth, onUpdateTaskDates]);

  // Sort tasks by start date or status
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aStart = a.startDate || a.createdAt || '';
      const bStart = b.startDate || b.createdAt || '';
      return aStart.localeCompare(bStart);
    });
  }, [tasks]);

  return (
    <div className="w-full flex flex-col h-full overflow-hidden select-none">
      {/* Timeline Controls Header */}
      <div className={`px-6 sm:px-10 py-3 border-b flex items-center justify-between flex-wrap gap-3 ${
        isPink 
          ? 'bg-[#fff5f6] border-[#fecdd3]' 
          : darkMode 
          ? 'bg-[#1e1e1e] border-[#2f2f2f]' 
          : 'bg-[#fbfbfa] border-[#e8e7e4]'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTimelineShift(-14)}
            className={`p-1.5 rounded-md border transition-colors ${
              isPink 
                ? 'border-[#fda4af] hover:bg-[#ffe4e6] text-[#881337]' 
                : darkMode 
                ? 'border-[#383838] hover:bg-[#2c2c2c] text-[#aaa]' 
                : 'border-[#e3e2e0] hover:bg-[#ebeae7] text-[#787774]'
            }`}
            title="Lùi thời gian"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={scrollToToday}
            className={`px-3 py-1 text-xs font-semibold rounded-md border shadow-xs transition-colors flex items-center gap-1.5 ${
              isPink 
                ? 'bg-white border-[#fda4af] text-[#9f1239] hover:bg-[#fff0f3]' 
                : darkMode 
                ? 'bg-[#2a2a2a] border-[#3e3e3e] text-white hover:bg-[#333]' 
                : 'bg-white border-[#e3e2e0] text-[#37352f] hover:bg-[#f1f1ef]'
            }`}
          >
            <CalendarIcon size={13} className={isPink ? 'text-[#e11d48]' : 'text-[#2383e2]'} />
            <span>Hôm nay</span>
          </button>

          <button
            onClick={() => handleTimelineShift(14)}
            className={`p-1.5 rounded-md border transition-colors ${
              isPink 
                ? 'border-[#fda4af] hover:bg-[#ffe4e6] text-[#881337]' 
                : darkMode 
                ? 'border-[#383838] hover:bg-[#2c2c2c] text-[#aaa]' 
                : 'border-[#e3e2e0] hover:bg-[#ebeae7] text-[#787774]'
            }`}
            title="Tiến thời gian"
          >
            <ChevronRight size={16} />
          </button>

          <span className={`text-xs ml-2 hidden md:inline ${isPink ? 'text-[#881337]/70' : 'text-[#9b9a97]'}`}>
            💡 Kéo thanh để dời ngày, kéo 2 đầu thanh để thay đổi thời hạn
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs ${isPink ? 'text-[#881337]' : 'text-[#787774]'}`}>
            <span className={`w-2.5 h-2.5 rounded-sm ${isPink ? 'bg-[#e11d48]' : 'bg-[#2383e2]'}`} />
            <span>Đang thực hiện</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 ml-2" />
            <span>Hoàn thành</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 ml-2" />
            <span>Quá hạn</span>
          </div>

          <button
            onClick={() => onAddNewTask(todayStr, addDays(todayStr, 5))}
            className={`px-3 py-1.5 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 ${
              isPink ? 'bg-[#e11d48] hover:bg-[#be123c]' : 'bg-[#2383e2] hover:bg-[#1d6ec0]'
            }`}
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Thêm công việc</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Body (Split: Left Task List + Right Gantt Grid) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Task Names & Meta */}
        <div className={`w-72 sm:w-80 border-r flex flex-col shrink-0 z-10 ${
          isPink 
            ? 'bg-[#fff5f6] border-[#fecdd3]' 
            : darkMode 
            ? 'bg-[#1e1e1e] border-[#2f2f2f]' 
            : 'bg-[#fbfbfa] border-[#e8e7e4]'
        }`}>
          {/* Header */}
          <div className={`h-14 px-4 border-b flex items-center justify-between font-semibold text-xs uppercase tracking-wider ${
            isPink 
              ? 'border-[#fecdd3] bg-[#ffe4e6] text-[#881337]' 
              : darkMode 
              ? 'border-[#2f2f2f] bg-[#1a1a1a] text-[#9b9a97]' 
              : 'border-[#e8e7e4] bg-[#f7f6f3] text-[#9b9a97]'
          }`}>
            <span>Tên công việc ({sortedTasks.length})</span>
            <span>Thời hạn</span>
          </div>

          {/* List items */}
          <div className={`flex-1 overflow-y-auto no-scrollbar divide-y ${
            isPink ? 'divide-[#ffe4e6]' : darkMode ? 'divide-[#262626]' : 'divide-[#f1f1ef]'
          }`}>
            {sortedTasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              const column = project.columns.find((c) => c.id === task.status);
              const colStyle = column ? NOTION_COLORS[column.color] : NOTION_COLORS.gray;

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`h-12 px-4 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                    isPink 
                      ? 'hover:bg-[#fff0f3] text-[#4c0519]' 
                      : darkMode 
                      ? 'hover:bg-white/5 text-[#ddd]' 
                      : 'hover:bg-black/5 text-[#37352f]'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${colStyle.dot}`} />
                    <span className={`truncate font-medium ${
                      task.status === 'done' 
                        ? (isPink ? 'line-through text-[#881337]/50' : 'line-through text-[#999]') 
                        : (isPink ? 'text-[#4c0519]' : '')
                    }`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                    <span className={overdue ? 'text-red-500 font-medium' : isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}>
                      {formatShortDate(task.startDate)} - {formatShortDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="p-2">
              <button
                onClick={() => onAddNewTask(todayStr, addDays(todayStr, 4))}
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isPink 
                    ? 'text-[#881337] hover:bg-[#ffe4e6] hover:text-[#4c0519]' 
                    : darkMode 
                    ? 'text-[#888] hover:bg-[#282828]' 
                    : 'text-[#787774] hover:bg-[#efedea]'
                }`}
              >
                <Plus size={14} className={isPink ? 'text-[#e11d48]' : ''} />
                <span>+ Thêm công việc mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Horizontal Scrollable Timeline Grid */}
        <div 
          ref={timelineScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative no-scrollbar"
        >
          <div 
            style={{ width: `${totalDays * dayWidth}px` }}
            className="min-h-full relative"
          >
            {/* Timeline Header (Months & Days) */}
            <div className={`sticky top-0 z-20 border-b flex flex-col ${
              isPink 
                ? 'bg-[#ffe4e6] border-[#fecdd3]' 
                : darkMode 
                ? 'bg-[#1a1a1a] border-[#2f2f2f]' 
                : 'bg-[#f7f6f3] border-[#e8e7e4]'
            }`}>
              {/* Day columns row */}
              <div className="flex h-14">
                {dateItems.map((item, idx) => {
                  return (
                    <div
                      key={item.dateStr}
                      style={{ width: `${dayWidth}px` }}
                      className={`h-full border-r flex flex-col items-center justify-center text-center shrink-0 relative ${
                        item.isToday 
                          ? (isPink ? 'bg-[#fda4af]/30 font-bold' : darkMode ? 'bg-[#2383e2]/20 font-bold' : 'bg-[#e0f2fe] font-bold') 
                          : item.isWeekend 
                          ? (isPink ? 'bg-[#fff5f6]' : darkMode ? 'bg-[#181818]' : 'bg-[#f4f4f2]') 
                          : ''
                      } ${isPink ? 'border-[#fecdd3]' : darkMode ? 'border-[#2a2a2a]' : 'border-[#ebeae7]'}`}
                    >
                      {/* Month label for first of month or start */}
                      {item.isFirstOfMonth && (
                        <span className={`absolute top-0.5 left-1 text-[9px] font-bold uppercase tracking-wider ${
                          isPink ? 'text-[#e11d48]' : darkMode ? 'text-[#0284c7]' : 'text-[#2383e2]'
                        }`}>
                          {item.monthName}
                        </span>
                      )}

                      <span className={`text-[10px] ${
                        item.isToday 
                          ? (isPink ? 'text-[#9f1239] font-bold' : 'text-[#0284c7] font-bold') 
                          : isPink ? 'text-[#881337]' : 'text-[#9b9a97]'
                      }`}>
                        {timelineZoom === 'day' ? item.dayName : ''}
                      </span>
                      <span className={`text-xs ${
                        item.isToday 
                          ? (isPink 
                              ? 'w-5 h-5 rounded-full bg-[#e11d48] text-white flex items-center justify-center font-bold text-[10px]' 
                              : 'w-5 h-5 rounded-full bg-[#2383e2] text-white flex items-center justify-center font-bold text-[10px]')
                          : isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#aaa]' : 'text-[#37352f]'
                      }`}>
                        {item.dayNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertical Today Red Indicator Line */}
            {(() => {
              const todayIdx = dateItems.findIndex((d) => d.isToday);
              if (todayIdx !== -1) {
                return (
                  <div
                    style={{ left: `${todayIdx * dayWidth + dayWidth / 2}px` }}
                    className={`absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none shadow-sm ${
                      isPink ? 'bg-[#e11d48]' : 'bg-red-500'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full -ml-[3px] -mt-1 ${isPink ? 'bg-[#e11d48]' : 'bg-red-500'}`} />
                  </div>
                );
              }
              return null;
            })()}

            {/* Timeline Rows for each task */}
            <div className={`divide-y ${isPink ? 'divide-[#ffe4e6]' : darkMode ? 'divide-[#262626]' : 'divide-[#f1f1ef]'}`}>
              {sortedTasks.map((task) => {
                const isDragging = activeDrag?.taskId === task.id;
                const effectiveStart = isDragging ? activeDrag.currentStartDate : (task.startDate || todayStr);
                const effectiveDue = isDragging ? activeDrag.currentDueDate : (task.dueDate || addDays(effectiveStart, 2));

                const startOffsetDays = diffInDays(baseStartDate, effectiveStart);
                const durationDays = Math.max(1, diffInDays(effectiveStart, effectiveDue) + 1);

                const barLeft = startOffsetDays * dayWidth;
                const barWidth = Math.max(dayWidth * 0.9, durationDays * dayWidth);

                const overdue = isOverdue(effectiveDue, task.status);
                const column = project.columns.find((c) => c.id === task.status);
                const colColor = column ? column.color : 'blue';
                const colStyle = NOTION_COLORS[colColor] || NOTION_COLORS.blue;

                return (
                  <div
                    key={task.id}
                    className={`h-12 relative flex items-center group transition-colors ${
                      isPink 
                        ? 'border-b border-[#ffe4e6] hover:bg-[#fff0f3]' 
                        : darkMode 
                        ? 'border-b border-[#252525] hover:bg-white/5' 
                        : 'border-b border-[#f1f1ef] hover:bg-black/5'
                    }`}
                  >
                    {/* Background day column grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {dateItems.map((item) => (
                        <div
                          key={item.dateStr}
                          style={{ width: `${dayWidth}px` }}
                          className={`h-full border-r shrink-0 ${
                            item.isToday 
                              ? (isPink ? 'bg-[#ffe4e6]/30' : darkMode ? 'bg-[#2383e2]/5' : 'bg-[#e0f2fe]/40') 
                              : item.isWeekend 
                              ? (isPink ? 'bg-[#fff5f6]/40' : darkMode ? 'bg-[#181818]/40' : 'bg-[#f8f8f6]/50') 
                              : ''
                          } ${isPink ? 'border-[#fecdd3]/40' : darkMode ? 'border-[#262626]' : 'border-[#f2f1ee]'}`}
                        />
                      ))}
                    </div>

                    {/* Draggable Task Bar */}
                    <div
                      style={{
                        left: `${barLeft}px`,
                        width: `${barWidth}px`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      className={`absolute h-8 rounded-lg shadow-sm flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing select-none transition-shadow z-15 group/bar border ${
                        overdue
                          ? 'bg-red-500/90 border-red-600 text-white'
                          : task.status === 'done'
                          ? 'bg-emerald-600/90 border-emerald-700 text-white'
                          : isPink
                          ? 'bg-[#e11d48]/90 border-[#be123c] text-white hover:brightness-105'
                          : 'bg-[#2383e2]/90 border-[#1d6ec0] text-white hover:brightness-105'
                      } ${isDragging ? 'ring-2 ring-white shadow-xl opacity-90' : 'hover:shadow-md'}`}
                    >
                      {/* Left Resize Handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, task, 'resize-start')}
                        className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/30 hover:bg-white/60 rounded-l-lg cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-all z-20 flex items-center justify-center"
                        title="Kéo để đổi ngày bắt đầu"
                      >
                        <div className="w-0.5 h-3 bg-white rounded-full" />
                      </div>

                      {/* Bar Content */}
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 pointer-events-none">
                        <span className="text-xs font-semibold truncate leading-none">
                          {task.title}
                        </span>
                        <span className="text-[10px] opacity-80 shrink-0 font-mono">
                          ({durationDays}d)
                        </span>
                      </div>

                      {/* Assignee Avatar inside bar */}
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center shrink-0 pointer-events-none ml-1">
                          <img
                            src={task.assignees[0].avatar}
                            alt={task.assignees[0].name}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full ring-1 ring-white"
                          />
                        </div>
                      )}

                      {/* Right Resize Handle */}
                      <div
                        onMouseDown={(e) => handleMouseDown(e, task, 'resize-end')}
                        className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-white/30 hover:bg-white/60 rounded-r-lg cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-all z-20 flex items-center justify-center"
                        title="Kéo để đổi ngày hết hạn"
                      >
                        <div className="w-0.5 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
