import React, { useState } from 'react';
import { NotionColor, PriorityLevel, ProjectPage, StatusColumn, StatusId, Task } from '../types';
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
  Archive
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
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<StatusId | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Quick card creation states
  const [quickAddColumnId, setQuickAddColumnId] = useState<StatusId | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

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
    <div className="w-full h-full overflow-x-auto p-6 sm:p-10 no-scrollbar">
      <div className="flex items-start gap-4 min-w-max pb-12">
        {columns.map((col) => {
          const colTasks = tasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const colStyle = NOTION_COLORS[col.color] || NOTION_COLORS.gray;
          const isDragOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOverColumn(e, col.id)}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className={`w-72 sm:w-80 shrink-0 flex flex-col rounded-xl transition-all ${
                isDragOver 
                  ? (darkMode ? 'bg-[#222] ring-2 ring-[#0284c7]' : 'bg-[#eef6fc] ring-2 ring-[#2383e2]')
                  : (darkMode ? 'bg-transparent' : 'bg-transparent')
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between py-2 px-1 mb-1 group">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1.5 ${colStyle.badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colStyle.dot}`} />
                    {col.title}
                  </span>
                  <span className={`text-xs font-mono font-medium ${darkMode ? 'text-[#777]' : 'text-[#9b9a97]'}`}>
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setQuickAddColumnId(col.id);
                      setQuickAddTitle('');
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#ebeae7] text-[#787774]'
                    }`}
                    title="Thêm thẻ vào cột này"
                  >
                    <Plus size={14} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setActiveColumnMenu(activeColumnMenu === col.id ? null : col.id)}
                      className={`p-1 rounded-md transition-colors ${
                        darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#ebeae7] text-[#787774]'
                      }`}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {/* Column Options Menu */}
                    {activeColumnMenu === col.id && (
                      <div className={`absolute top-full right-0 mt-1 w-48 rounded-xl shadow-2xl border p-1 z-30 ${
                        darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
                      }`}>
                        <div className="px-2 py-1 text-[10px] font-semibold text-[#9b9a97] uppercase">Màu sắc cột</div>
                        <div className="grid grid-cols-5 gap-1 p-1">
                          {(Object.keys(NOTION_COLORS) as NotionColor[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                onUpdateColumn(col.id, col.title, c);
                                setActiveColumnMenu(null);
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                NOTION_COLORS[c].badgeBg
                              } ${col.color === c ? 'ring-2 ring-black dark:ring-white' : 'hover:scale-110'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${NOTION_COLORS[c].dot}`} />
                            </button>
                          ))}
                        </div>

                        <div className={`my-1 border-t ${darkMode ? 'border-[#383838]' : 'border-[#ededeb]'}`} />

                        {columns.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa cột "${col.title}"?`)) {
                                onDeleteColumn(col.id);
                              }
                              setActiveColumnMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Xóa cột</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                          ? 'opacity-40 scale-95 border-dashed border-blue-400' 
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
                            ? (darkMode ? 'line-through text-[#666]' : 'line-through text-[#9b9a97]') 
                            : (darkMode ? 'text-[#f0f0f0]' : 'text-[#37352f]')
                        }`}>
                          {task.title}
                        </h4>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9b9a97] cursor-grab">
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
                      <div className="flex items-center justify-between gap-1 pt-1 text-xs border-t border-[#f1f1ef] dark:border-[#2d2d2d]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Due Date & Time badge */}
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                                overdue
                                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                  : dueToday
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                  : darkMode ? 'text-[#888]' : 'text-[#787774]'
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
                              completedSubtasks === totalSubtasks ? 'text-emerald-600' : 'text-[#9b9a97]'
                            }`}>
                              <CheckSquare size={11} />
                              <span className="font-mono">{completedSubtasks}/{totalSubtasks}</span>
                            </span>
                          )}

                          {/* Attachments counter */}
                          {(task.attachments || []).length > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-[#9b9a97]" title="Tệp đính kèm">
                              <Paperclip size={11} />
                              <span className="font-mono">{(task.attachments || []).length}</span>
                            </span>
                          )}

                          {/* Comments counter */}
                          {(task.comments || []).length > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-[#9b9a97]" title="Bình luận">
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
                        </div>

                        {/* Assignee Avatars Stack */}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {task.assignees.slice(0, 3).map((user) => (
                              <img
                                key={user.id}
                                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                alt={user.name}
                                title={user.name}
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
                    darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
                  }`}>
                    <textarea
                      placeholder="Nhập tên công việc mới..."
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuickAddSubmit(col.id);
                        } else if (e.key === 'Escape') {
                          setQuickAddColumnId(null);
                        }
                      }}
                      className="w-full text-xs bg-transparent outline-none resize-none min-h-[50px]"
                      autoFocus
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-[#f1f1ef] dark:border-[#333]">
                      <span className="text-[10px] text-[#9b9a97]">Enter ↵ để tạo</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuickAddColumnId(null)}
                          className="px-2 py-1 text-xs text-[#787774] hover:text-[#37352f] rounded-md transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleQuickAddSubmit(col.id)}
                          disabled={!quickAddTitle.trim()}
                          className="px-3 py-1 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-medium rounded-md shadow-xs disabled:opacity-40 transition-all"
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
                      darkMode 
                        ? 'text-[#777] hover:bg-[#252525] hover:text-[#bbb]' 
                        : 'text-[#787774] hover:bg-[#efedea] hover:text-[#37352f]'
                    }`}
                  >
                    <Plus size={14} />
                    <span>Thêm thẻ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Column Button / Creator */}
        <div className="w-72 sm:w-80 shrink-0">
          {showAddColumn ? (
            <div className={`p-4 rounded-xl border shadow-lg ${
              darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#37352f] dark:text-white">Tạo cột mới</span>
                <button 
                  onClick={() => setShowAddColumn(false)}
                  className="text-[#9b9a97] hover:text-[#37352f]"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateColumn} className="space-y-3">
                <input
                  type="text"
                  placeholder="Tên cột (ví dụ: Đang đợi duyệt...)"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className={`w-full text-xs px-2.5 py-2 border rounded-lg outline-none ${
                    darkMode ? 'bg-[#1e1e1e] border-[#3a3a3a] text-white' : 'bg-[#f7f6f3] border-[#e3e2e0]'
                  }`}
                  autoFocus
                />

                <div>
                  <div className="text-[11px] text-[#9b9a97] mb-1.5 font-medium">Chọn màu đại diện:</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(Object.keys(NOTION_COLORS) as NotionColor[]).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewColumnColor(c)}
                        className={`h-7 rounded-md flex items-center justify-center transition-all ${
                          NOTION_COLORS[c].badgeBg
                        } ${newColumnColor === c ? 'ring-2 ring-[#0284c7]' : 'hover:scale-105'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${NOTION_COLORS[c].dot}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddColumn(false)}
                    className="px-3 py-1.5 text-xs text-[#787774] hover:text-[#37352f]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!newColumnTitle.trim()}
                    className="px-3.5 py-1.5 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
                  >
                    Tạo cột
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddColumn(true)}
              className={`w-full py-2.5 px-4 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                darkMode 
                  ? 'border-[#333] text-[#777] hover:border-[#555] hover:text-[#ccc] hover:bg-[#222]' 
                  : 'border-[#d0cfcd] text-[#787774] hover:border-[#a09e9a] hover:text-[#37352f] hover:bg-[#f1f1ef]'
              }`}
            >
              <Plus size={15} />
              <span>Thêm cột mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
