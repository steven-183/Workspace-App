import React from 'react';
import { ProjectPage, Task } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatShortDate, isDueToday, isOverdue } from '../utils/dateUtils';
import { Check, Plus, Calendar, AlertCircle } from 'lucide-react';

interface ListViewProps {
  project: ProjectPage;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddNewTask: () => void;
  darkMode: boolean;
}

export const ListView: React.FC<ListViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onUpdateTask,
  onAddNewTask,
  darkMode,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-10">
      <div className="space-y-1">
        {tasks.map((task) => {
          const overdue = isOverdue(task.dueDate, task.status);
          const isDone = task.status === 'done';
          const column = project.columns.find((c) => c.id === task.status);
          const colStyle = column ? NOTION_COLORS[column.color] : NOTION_COLORS.gray;
          const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer group shadow-2xs ${
                darkMode
                  ? 'bg-[#222] border-[#313131] hover:bg-[#282828]'
                  : 'bg-white border-[#e3e2e0] hover:border-[#c5c4c1]'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden pr-2">
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus = isDone ? 'todo' : 'done';
                    onUpdateTask(task.id, {
                      status: nextStatus,
                      progress: nextStatus === 'done' ? 100 : task.progress,
                    });
                  }}
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                  }`}
                >
                  {isDone && <Check size={11} strokeWidth={3} />}
                </button>

                {/* Title */}
                <span
                  className={`text-xs font-semibold truncate ${
                    isDone ? 'line-through text-[#9b9a97]' : darkMode ? 'text-[#ddd]' : 'text-[#37352f]'
                  }`}
                >
                  {task.title}
                </span>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {task.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${NOTION_COLORS[t.color].badgeBg}`}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right meta: Status, Priority, DueDate, Assignees */}
              <div className="flex items-center gap-2 shrink-0 text-xs">
                {/* Status Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${colStyle.badgeBg}`}>
                  {column?.title || task.status}
                </span>

                {/* Priority */}
                {task.priority !== 'none' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priority.badgeBg} ${priority.badgeText}`}>
                    {priority.label}
                  </span>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <span className={`text-[11px] flex items-center gap-1 font-medium ${
                    overdue ? 'text-red-500' : 'text-[#9b9a97]'
                  }`}>
                    <Calendar size={11} />
                    <span>{formatShortDate(task.dueDate)}</span>
                  </span>
                )}

                {/* Assignees */}
                {task.assignees && task.assignees.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {task.assignees.map((u) => (
                      <img
                        key={u.id}
                        src={u.avatar}
                        alt={u.name}
                        title={u.name}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full ring-1 ring-white dark:ring-[#222]"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={onAddNewTask}
          className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            darkMode ? 'text-[#888] hover:bg-[#252525]' : 'text-[#787774] hover:bg-[#efedea]'
          }`}
        >
          <Plus size={14} />
          <span>Thêm công việc mới</span>
        </button>
      </div>
    </div>
  );
};
