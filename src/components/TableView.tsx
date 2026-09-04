import React, { useState } from 'react';
import { AppTheme, PriorityLevel, ProjectPage, StatusId, Task } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatDateVi, formatShortDate, isDueToday, isOverdue } from '../utils/dateUtils';
import { 
  Plus, 
  Check, 
  ChevronDown, 
  Calendar, 
  AlertCircle, 
  CheckSquare, 
  MoreHorizontal,
  ArrowUpDown,
  Tag as TagIcon,
  UserCheck
} from 'lucide-react';

interface TableViewProps {
  project: ProjectPage;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddNewTask: () => void;
  onDeleteTask: (taskId: string) => void;
  darkMode: boolean;
  appTheme?: AppTheme;
}

export const TableView: React.FC<TableViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onUpdateTask,
  onAddNewTask,
  onDeleteTask,
  darkMode,
  appTheme = 'light',
}) => {
  const isPink = appTheme === 'qanda_pink';
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<{ taskId: string; field: 'status' | 'priority' } | null>(null);

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  const handleTitleSubmit = (taskId: string) => {
    if (titleDraft.trim()) {
      onUpdateTask(taskId, { title: titleDraft.trim() });
    }
    setEditingTitleId(null);
  };

  return (
    <div className="w-full h-full overflow-x-auto p-6 sm:p-10 no-scrollbar">
      <div className={`min-w-[880px] rounded-xl border overflow-hidden shadow-xs ${
        isPink ? 'bg-white border-[#fecdd3]' : darkMode ? 'bg-[#1e1e1e] border-[#2f2f2f]' : 'bg-white border-[#e3e2e0]'
      }`}>
        {/* Table Header */}
        <div className={`grid grid-cols-12 border-b text-xs font-semibold uppercase tracking-wider py-2.5 px-4 ${
          isPink 
            ? 'bg-[#fff5f6] border-[#fecdd3] text-[#881337]' 
            : darkMode 
            ? 'bg-[#181818] border-[#2f2f2f] text-[#9b9a97]' 
            : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#9b9a97]'
        }`}>
          <div className="col-span-4 flex items-center gap-1.5">
            <span>Tên công việc</span>
          </div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2">Mức ưu tiên</div>
          <div className="col-span-2">Thời hạn</div>
          <div className="col-span-1 text-center">Người làm</div>
          <div className="col-span-1 text-right">Người duyệt</div>
        </div>

        {/* Rows */}
        <div className={`divide-y text-xs ${
          isPink ? 'divide-[#ffe4e6]' : darkMode ? 'divide-[#282828]' : 'divide-[#f1f1ef]'
        }`}>
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            const column = project.columns.find((c) => c.id === task.status);
            const colStyle = column ? NOTION_COLORS[column.color] : NOTION_COLORS.gray;
            const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`grid grid-cols-12 items-center py-2.5 px-4 cursor-pointer group transition-colors ${
                  isPink 
                    ? 'hover:bg-[#fff0f3] text-[#4c0519]' 
                    : darkMode 
                    ? 'hover:bg-white/5 text-[#ddd]' 
                    : 'hover:bg-black/5 text-[#37352f]'
                }`}
              >
                {/* Title */}
                <div 
                  className="col-span-4 flex items-center gap-2 pr-3 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      const nextStatus = task.status === 'done' ? 'todo' : 'done';
                      onUpdateTask(task.id, { 
                        status: nextStatus,
                      });
                    }}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      task.status === 'done' 
                        ? (isPink ? 'bg-[#e11d48] border-[#e11d48] text-white' : 'bg-emerald-500 border-emerald-600 text-white')
                        : (isPink ? 'border-[#fda4af] hover:border-[#e11d48]' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500')
                    }`}
                  >
                    {task.status === 'done' && <Check size={11} strokeWidth={3} />}
                  </button>

                  {editingTitleId === task.id ? (
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => handleTitleSubmit(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                          handleTitleSubmit(task.id);
                        }
                      }}
                      className={`bg-transparent outline-none border-b w-full font-medium ${
                        isPink ? 'border-[#e11d48] text-[#4c0519]' : 'border-blue-500'
                      }`}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setTitleDraft(task.title);
                        setEditingTitleId(task.id);
                      }}
                      className={`font-medium truncate ${
                        task.status === 'done' 
                          ? (isPink ? 'line-through text-[#881337]/50' : 'line-through text-[#999]') 
                          : (isPink ? 'text-[#4c0519]' : '')
                      }`}
                    >
                      {task.title}
                    </span>
                  )}
                </div>

                {/* Status Dropdown Cell */}
                <div className="col-span-2 relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown.field === 'status' ? null : { taskId: task.id, field: 'status' })}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1.5 ${colStyle.badgeBg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colStyle.dot}`} />
                    <span>{column?.title || task.status}</span>
                    <ChevronDown size={11} className="opacity-60" />
                  </button>

                  {activeDropdown?.taskId === task.id && activeDropdown.field === 'status' && (
                    <div className={`absolute top-full left-0 mt-1 w-44 rounded-xl shadow-xl border p-1 z-30 ${
                      isPink 
                        ? 'bg-white border-[#fda4af] text-[#4c0519]' 
                        : darkMode 
                        ? 'bg-[#262626] border-[#383838]' 
                        : 'bg-white border-[#e3e2e0]'
                    }`}>
                      {project.columns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onUpdateTask(task.id, { 
                              status: c.id,
                            });
                            setActiveDropdown(null);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                            task.status === c.id 
                              ? (isPink ? 'bg-[#ffe4e6] text-[#9f1239] font-semibold' : 'bg-blue-50 dark:bg-blue-950 font-semibold') 
                              : (isPink ? 'hover:bg-[#fff0f3]' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]')
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${NOTION_COLORS[c.color].dot}`} />
                          <span>{c.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority Dropdown Cell */}
                <div className="col-span-2 relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown?.taskId === task.id && activeDropdown.field === 'priority' ? null : { taskId: task.id, field: 'priority' })}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5 ${priority.badgeBg} ${priority.badgeText}`}
                  >
                    <span>{priority.label}</span>
                    <ChevronDown size={11} className="opacity-60" />
                  </button>

                  {activeDropdown?.taskId === task.id && activeDropdown.field === 'priority' && (
                    <div className={`absolute top-full left-0 mt-1 w-40 rounded-xl shadow-xl border p-1 z-30 ${
                      isPink 
                        ? 'bg-white border-[#fda4af] text-[#4c0519]' 
                        : darkMode 
                        ? 'bg-[#262626] border-[#383838]' 
                        : 'bg-white border-[#e3e2e0]'
                    }`}>
                      {(['urgent', 'high', 'medium', 'low', 'none'] as PriorityLevel[]).map((p) => {
                        const pCfg = PRIORITY_CONFIG[p];
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              onUpdateTask(task.id, { priority: p });
                              setActiveDropdown(null);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                              task.priority === p 
                                ? (isPink ? 'bg-[#ffe4e6] text-[#9f1239] font-semibold' : 'bg-blue-50 dark:bg-blue-950 font-semibold') 
                                : (isPink ? 'hover:bg-[#fff0f3]' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]')
                            }`}
                          >
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${pCfg.badgeBg} ${pCfg.badgeText}`}>
                              {pCfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="col-span-2 text-[11px]">
                  <span className={
                    overdue 
                      ? 'text-red-500 font-semibold flex items-center gap-1' 
                      : isPink 
                      ? 'text-[#881337]' 
                      : 'text-[#787774] dark:text-[#aaa]'
                  }>
                    {overdue && <AlertCircle size={12} />}
                    {formatShortDate(task.startDate)} → {formatShortDate(task.dueDate)}
                  </span>
                </div>

                {/* Assignees */}
                <div className="col-span-1 flex items-center justify-center -space-x-1.5">
                  {(task.assignees || []).slice(0, 2).map((user) => (
                    <img
                      key={user.id}
                      src={user.avatar}
                      alt={user.name}
                      title={`Người làm: ${user.name}`}
                      referrerPolicy="no-referrer"
                      className={`w-5 h-5 rounded-full ring-2 object-cover ${
                        isPink ? 'ring-[#ffe4e6]' : 'ring-white dark:ring-[#1e1e1e]'
                      }`}
                    />
                  ))}
                  {(!task.assignees || task.assignees.length === 0) && (
                    <span className={`text-[11px] ${isPink ? 'text-[#881337]/50' : 'text-[#9b9a97]'}`}>--</span>
                  )}
                </div>

                {/* Reviewer (Người duyệt) */}
                <div className="col-span-1 flex items-center justify-end">
                  {task.creator ? (
                    <div 
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50"
                      title={`Người duyệt: ${task.creator.name}`}
                    >
                      <img
                        src={task.creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.creator.name)}`}
                        alt={task.creator.name}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                      <span className="text-[10px] font-semibold truncate max-w-[50px]">{task.creator.name}</span>
                    </div>
                  ) : (
                    <span className={`text-[11px] ${isPink ? 'text-[#881337]/50' : 'text-[#9b9a97]'}`}>--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Quick Add Row & Summary */}
        <div className={`p-3 border-t flex items-center justify-between text-xs ${
          isPink 
            ? 'bg-[#fff5f6] border-[#fecdd3] text-[#881337]' 
            : darkMode 
            ? 'bg-[#181818] border-[#2f2f2f] text-[#888]' 
            : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#787774]'
        }`}>
          <button
            onClick={onAddNewTask}
            className={`flex items-center gap-1.5 font-medium hover:underline ${
              isPink ? 'text-[#e11d48]' : 'text-[#2383e2]'
            }`}
          >
            <Plus size={14} />
            <span>Thêm dòng mới</span>
          </button>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Tổng: <strong className={isPink ? 'text-[#4c0519]' : ''}>{tasks.length} công việc</strong></span>
            <span>Đã xong: <strong className="text-emerald-600">{completedCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
