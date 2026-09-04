import React, { useState } from 'react';
import { AppTheme, NotionColor, PriorityLevel, ProjectPage, StatusColumn, StatusId, Task } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatDateVi, formatShortDate, isDueToday, isOverdue } from '../utils/dateUtils';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  X, 
  Clock, 
  ArrowRight, 
  GripVertical, 
  Paperclip, 
  MessageSquare, 
  Archive,
  UserCheck
} from 'lucide-react';

interface KanbanBoardProps {
  project: ProjectPage;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, targetStatus: StatusId, targetIndex?: number) => void;
  onQuickAddTask: (status: StatusId, title: string) => void;
  onAddColumn: (title: string, color: NotionColor) => void;
  onDeleteColumn: (columnId: StatusId) => void;
  onUpdateColumn: (columnId: StatusId, title: string, color: NotionColor) => void;
  darkMode: boolean;
  appTheme?: AppTheme;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  project,
  tasks,
  onTaskClick,
  onMoveTask,
  onQuickAddTask,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumn,
  darkMode,
  appTheme = 'light',
}) => {
  const isPink = appTheme === 'qanda_pink';
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<StatusId | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Quick card creation states
  const [quickAddColumnId, setQuickAddColumnId] = useState<StatusId | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [isComposingQuickAdd, setIsComposingQuickAdd] = useState(false);
  const [isComposingNewCol, setIsComposingNewCol] = useState(false);

  // Column management modal/form
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState<NotionColor>('blue');

  // Column menu popover
  const [activeColumnMenu, setActiveColumnMenu] = useState<StatusId | null>(null);

  const columns = project.columns || [];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverIndex(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, columnId: StatusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, targetColumnId: StatusId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTask(taskId, targetColumnId, dragOverIndex !== null ? dragOverIndex : undefined);
    }
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverIndex(null);
  };

  const handleQuickAddSubmit = (columnId: StatusId) => {
    if (quickAddTitle.trim()) {
      onQuickAddTask(columnId, quickAddTitle.trim());
      setQuickAddTitle('');
    }
    setQuickAddColumnId(null);
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim()) {
      onAddColumn(newColumnTitle.trim(), newColumnColor);
      setNewColumnTitle('');
      setShowAddColumn(false);
    }
  };

  return (
    <div className="w-full h-full overflow-x-auto p-6 sm:p-8 no-scrollbar">
      <div className="flex items-start gap-6 min-w-max pb-12">
        {columns.map((col, colIndex) => {
          const colTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const colStyle = NOTION_COLORS[col.color] || NOTION_COLORS.gray;
          const isDragOver = dragOverColumnId === col.id;
          const isLastColumn = colIndex === columns.length - 1;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOverColumn(e, col.id)}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className={`w-72 sm:w-80 shrink-0 flex flex-col transition-all ${
                !isLastColumn 
                  ? (isPink ? 'pr-6 border-r border-[#fecdd3]' : darkMode ? 'pr-6 border-r border-[#2d2d2d]' : 'pr-6 border-r border-[#e5e4e0]') 
                  : ''
              } ${
                isDragOver 
                  ? (isPink ? 'bg-[#ffe4e6]/50 ring-2 ring-[#e11d48] rounded-xl p-2' : darkMode ? 'bg-[#222]/50 ring-2 ring-[#0284c7] rounded-xl p-2' : 'bg-[#eef6fc]/50 ring-2 ring-[#2383e2] rounded-xl p-2')
                  : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between py-2 px-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 ${colStyle.badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colStyle.dot}`} />
                    {col.title}
                  </span>
                  <span className={`text-xs font-mono font-medium ${
                    isPink 
                      ? 'text-[#9f1239] bg-[#ffe4e6] px-2 py-0.5 rounded-full border border-[#fecdd3]' 
                      : darkMode ? 'text-[#777]' : 'text-[#9b9a97]'
                  }`}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards List */}
              <div className="flex flex-col gap-2.5 min-h-[140px] pb-3">
                {colTasks.map((task, index) => {
                  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;
                  const overdue = isOverdue(task.dueDate, task.status);
                  const dueToday = isDueToday(task.dueDate);
                  const isBeingDragged = draggedTaskId === task.id;
                  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
                  const totalSubtasks = (task.subtasks || []).length;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.stopPropagation();
                        setDragOverIndex(index);
                      }}
                      onClick={() => onTaskClick(task)}
                      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer shadow-xs ${
                        isBeingDragged 
                          ? 'opacity-40 scale-95 border-dashed border-rose-400' 
                          : isPink
                            ? 'bg-white border-[#fecdd3] hover:border-[#fda4af] hover:shadow-md'
                            : darkMode 
                            ? 'bg-[#232323] border-[#313131] hover:border-[#444] hover:bg-[#282828]' 
                            : 'bg-white border-[#e3e2e0] hover:border-[#c5c4c1] hover:shadow-md'
                      }`}
                    >
                      {/* Optional cover preview inside card */}
                      {task.coverImage && (
                        <div 
                          className="w-full h-20 rounded-lg mb-2.5 overflow-hidden"
                          style={{
                            background: task.coverImage.startsWith('http') ? undefined : task.coverImage,
                            backgroundImage: task.coverImage.startsWith('http') ? `url(${task.coverImage})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      )}

                      {/* Card Title */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`text-sm font-semibold leading-snug line-clamp-2 ${
                          task.status === 'done' 
                            ? (isPink ? 'line-through text-[#881337]/50' : darkMode ? 'line-through text-[#666]' : 'line-through text-[#9b9a97]') 
                            : (isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#f0f0f0]' : 'text-[#37352f]')
                        }`}>
                          {task.title}
                        </h4>
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-grab ${
                          isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'
                        }`}>
                          <GripVertical size={14} />
                        </div>
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {task.tags.map((tag) => {
                            const tagStyle = NOTION_COLORS[tag.color] || NOTION_COLORS.gray;
                            return (
                              <span
                                key={tag.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tagStyle.badgeBg}`}
                              >
                                {tag.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Card Footer: Dates, Subtasks, Priority, Assignees, Attachments */}
                      <div className={`flex items-center justify-between gap-1 pt-1 text-xs border-t ${
                        isPink ? 'border-[#fff0f3]' : darkMode ? 'border-[#2d2d2d]' : 'border-[#f1f1ef]'
                      }`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Due Date & Time badge */}
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                                overdue
                                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                  : dueToday
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                  : isPink ? 'text-[#881337]' : darkMode ? 'text-[#888]' : 'text-[#787774]'
                              }`}
                            >
                              <Calendar size={11} className={overdue ? 'text-red-500' : ''} />
                              <span>{formatShortDate(task.dueDate)}</span>
                              {task.dueTime && (
                                <span className="font-mono text-[10px] opacity-80">{task.dueTime}</span>
                              )}
                            </span>
                          )}

                          {/* Subtasks checklist counter */}
                          {totalSubtasks > 0 && (
                            <span className={`flex items-center gap-0.5 text-[11px] ${
                              completedSubtasks === totalSubtasks 
                                ? 'text-emerald-600 font-semibold' 
                                : isPink ? 'text-[#881337]' : 'text-[#9b9a97]'
                            }`}>
                              <CheckSquare size={11} />
                              <span className="font-mono">{completedSubtasks}/{totalSubtasks}</span>
                            </span>
                          )}

                          {/* Attachments counter */}
                          {(task.attachments || []).length > 0 && (
                            <span className={`flex items-center gap-0.5 text-[11px] ${
                              isPink ? 'text-[#881337]' : 'text-[#9b9a97]'
                            }`} title="Tệp đính kèm">
                              <Paperclip size={11} />
                              <span className="font-mono">{(task.attachments || []).length}</span>
                            </span>
                          )}

                          {/* Comments counter */}
                          {(task.comments || []).length > 0 && (
                            <span className={`flex items-center gap-0.5 text-[11px] ${
                              isPink ? 'text-[#881337]' : 'text-[#9b9a97]'
                            }`} title="Bình luận">
                              <MessageSquare size={11} />
                              <span className="font-mono">{(task.comments || []).length}</span>
                            </span>
                          )}

                          {/* Archived badge */}
                          {task.isArchived && (
                            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                              <Archive size={10} />
                              <span>Lưu trữ</span>
                            </span>
                          )}

                          {/* Priority tag */}
                          {task.priority !== 'none' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${priority.badgeBg} ${priority.badgeText}`}>
                              {task.priority === 'urgent' && <AlertCircle size={10} />}
                              {priority.label}
                            </span>
                          )}

                          {/* Người duyệt (Reviewer) Badge */}
                          {task.creator && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                              title={`Người duyệt: ${task.creator.name}${task.creator.email ? ` (${task.creator.email})` : ''}`}
                            >
                              <UserCheck size={10} className="text-purple-600 dark:text-purple-400 shrink-0" />
                              <span className="truncate max-w-[70px]">Duyệt: {task.creator.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatars Stack */}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center -space-x-1.5 shrink-0" title={`Người làm: ${task.assignees.map(u => u.name).join(', ')}`}>
                            {task.assignees.slice(0, 3).map((user) => (
                              <img
                                key={user.id}
                                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                alt={user.name}
                                title={`Người làm: ${user.name}`}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#232323] object-cover"
                              />
                            ))}
                            {task.assignees.length > 3 && (
                              <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#232323]">
                                +{task.assignees.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Quick Add Form / Button */}
                {quickAddColumnId === col.id ? (
                  <div className={`p-3 rounded-xl border shadow-md animate-in fade-in duration-150 ${
                    isPink 
                      ? 'bg-white border-2 border-[#fda4af]' 
                      : darkMode 
                      ? 'bg-[#262626] border-[#383838]' 
                      : 'bg-white border-[#e3e2e0]'
                  }`}>
                    <textarea
                      placeholder="Nhập tên công việc mới..."
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onCompositionStart={() => setIsComposingQuickAdd(true)}
                      onCompositionEnd={() => setIsComposingQuickAdd(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          if (e.nativeEvent.isComposing || isComposingQuickAdd || e.keyCode === 229) {
                            return;
                          }
                          e.preventDefault();
                          handleQuickAddSubmit(col.id);
                        } else if (e.key === 'Escape') {
                          setQuickAddColumnId(null);
                        }
                      }}
                      className={`w-full text-xs bg-transparent outline-none resize-none min-h-[50px] ${
                        isPink ? 'text-[#4c0519] placeholder-[#881337]/60' : darkMode ? 'text-white' : 'text-[#37352f]'
                      }`}
                      autoFocus
                    />
                    <div className={`flex items-center justify-between pt-2 border-t ${
                      isPink ? 'border-[#ffe4e6]' : darkMode ? 'border-[#333]' : 'border-[#f1f1ef]'
                    }`}>
                      <span className={`text-[10px] ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>Enter ↵ để tạo</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuickAddColumnId(null)}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            isPink ? 'text-[#881337] hover:text-[#4c0519] hover:bg-[#ffe4e6]' : 'text-[#787774] hover:text-[#37352f]'
                          }`}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleQuickAddSubmit(col.id)}
                          disabled={!quickAddTitle.trim()}
                          className={`px-3 py-1 text-white text-xs font-medium rounded-md shadow-xs disabled:opacity-40 transition-all ${
                            isPink ? 'bg-[#e11d48] hover:bg-[#be123c]' : 'bg-[#2383e2] hover:bg-[#1d6ec0]'
                          }`}
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickAddColumnId(col.id);
                      setQuickAddTitle('');
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all text-left ${
                      isPink 
                        ? 'text-[#881337] hover:bg-[#ffe4e6] hover:text-[#4c0519]' 
                        : darkMode 
                        ? 'text-[#777] hover:bg-[#252525] hover:text-[#bbb]' 
                        : 'text-[#787774] hover:bg-[#efedea] hover:text-[#37352f]'
                    }`}
                  >
                    <Plus size={14} className={isPink ? 'text-[#e11d48]' : ''} />
                    <span>Thêm thẻ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
