import React, { useState } from 'react';
import { AppTheme, PriorityLevel, ProjectPage, StatusId, Task } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatShortDate, isDueToday, isOverdue } from '../utils/dateUtils';
import { 
  Plus, 
  Check, 
  Calendar, 
  AlertCircle, 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
  darkMode,
  appTheme = 'light',
}) => {
  const isPink = appTheme === 'qanda_pink';
  const { language, t, translateStatus, translatePriority } = useLanguage();
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState('');

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  const handleTitleSubmit = (taskId: string) => {
    if (editingTitleVal.trim()) {
      onUpdateTask(taskId, { title: editingTitleVal.trim() });
    }
    setEditingTitleId(null);
  };

  return (
    <div className="w-full h-full p-4 sm:p-8 overflow-x-auto no-scrollbar">
      <div className={`min-w-[760px] rounded-xl border overflow-hidden shadow-xs ${
        isPink 
          ? 'border-[#fecdd3] bg-white' 
          : darkMode 
          ? 'border-[#2f2f2f] bg-[#1e1e1e]' 
          : 'border-[#e8e7e4] bg-white'
      }`}>
        {/* Table Column Headers */}
        <div className={`grid grid-cols-12 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b select-none ${
          isPink 
            ? 'bg-[#fff5f6] border-[#fecdd3] text-[#881337]' 
            : darkMode 
            ? 'bg-[#181818] border-[#2f2f2f] text-[#9b9a97]' 
            : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#9b9a97]'
        }`}>
          <div className="col-span-4 flex items-center gap-1.5">
            <span>{t('tableTaskName', 'Tên công việc')}</span>
          </div>
          <div className="col-span-2">{t('tableStatus', 'Trạng thái')}</div>
          <div className="col-span-2">{t('tablePriority', 'Mức ưu tiên')}</div>
          <div className="col-span-2">{t('tableDueDate', 'Thời hạn')}</div>
          <div className="col-span-1 text-center">{t('tableAssignees', 'Người làm')}</div>
          <div className="col-span-1 text-right">{t('tableReviewer', 'Người duyệt')}</div>
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
                      value={editingTitleVal}
                      onChange={(e) => setEditingTitleVal(e.target.value)}
                      onBlur={() => handleTitleSubmit(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSubmit(task.id);
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      className="bg-transparent outline-none w-full font-medium"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingTitleId(task.id);
                        setEditingTitleVal(task.title);
                      }}
                      className={`truncate font-medium hover:underline cursor-text ${
                        task.status === 'done' 
                          ? (isPink ? 'line-through text-[#881337]/50' : 'line-through text-[#9b9a97]') 
                          : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  )}
                </div>

                {/* Status Column Select */}
                <div 
                  className="col-span-2 pr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateTask(task.id, { status: e.target.value as StatusId })}
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold outline-none cursor-pointer border-none ${colStyle.badgeBg}`}
                  >
                    {project.columns.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-black">
                        {translateStatus(c.title)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Select */}
                <div 
                  className="col-span-2 pr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={task.priority}
                    onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as PriorityLevel })}
                    className={`text-[11px] px-2 py-0.5 rounded font-medium outline-none cursor-pointer border-none ${priority.badgeBg} ${priority.badgeText}`}
                  >
                    {(['urgent', 'high', 'medium', 'low', 'none'] as PriorityLevel[]).map((p) => (
                      <option key={p} value={p} className="bg-white text-black">
                        {translatePriority(p)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date & Overdue */}
                <div 
                  className="col-span-2 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar size={12} className={overdue ? 'text-red-500' : 'text-[#9b9a97]'} />
                  <input
                    type="date"
                    value={task.dueDate || ''}
                    onChange={(e) => onUpdateTask(task.id, { dueDate: e.target.value })}
                    className={`text-[11px] bg-transparent outline-none cursor-pointer font-mono ${
                      overdue ? 'text-red-500 font-bold' : isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#ccc]' : 'text-[#787774]'
                    }`}
                  />
                  {overdue && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-red-100 text-red-600 font-bold uppercase">
                      {t('overdue', 'Quá hạn')}
                    </span>
                  )}
                </div>

                {/* Assignees */}
                <div className="col-span-1 flex items-center justify-center -space-x-1.5">
                  {(task.assignees || []).slice(0, 2).map((user) => (
                    <img
                      key={user.id}
                      src={user.avatar}
                      alt={user.name}
                      title={`${t('assigneePrefix', 'Người làm')}: ${user.name}`}
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
                      title={`${t('reviewerPrefix', 'Người duyệt')}: ${task.creator.name}`}
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
            <span>{t('addRow', 'Thêm dòng mới')}</span>
          </button>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>{language === 'en' ? 'Total: ' : 'Tổng: '}<strong className={isPink ? 'text-[#4c0519]' : ''}>{tasks.length} {language === 'en' ? 'tasks' : 'công việc'}</strong></span>
            <span>{language === 'en' ? 'Done: ' : 'Đã xong: '}<strong className="text-emerald-600">{completedCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
