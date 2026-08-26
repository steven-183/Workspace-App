import React, { useState, useMemo } from 'react';
import { PriorityLevel, ProjectPage, StatusId, Task, TaskNotification, User } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatShortDate, isDueThisWeek, isDueToday, isOverdue } from '../utils/dateUtils';
import { NotificationCenter } from './NotificationCenter';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  Folder, 
  Search, 
  Plus, 
  Check, 
  ChevronRight,
  Filter,
  UserCheck,
  Sparkles,
  Inbox,
  ArrowRight,
  LogIn
} from 'lucide-react';

interface MyTasksViewProps {
  projects: ProjectPage[];
  currentUser: User | null;
  notifications: TaskNotification[];
  onOpenTask: (projectId: string, taskId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (notificationId: string) => void;
  onTaskClick: (projectId: string, task: Task) => void;
  onUpdateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  onAddNewTaskForUser: () => void;
  onSelectProject: (projectId: string) => void;
  onOpenAuthModal: () => void;
  darkMode: boolean;
}

type GroupMode = 'dueDate' | 'project' | 'status';
type StatusFilter = 'all' | 'active' | 'done';

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  projects,
  currentUser,
  notifications,
  onOpenTask,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onTaskClick,
  onUpdateTask,
  onAddNewTaskForUser,
  onSelectProject,
  onOpenAuthModal,
  darkMode,
}) => {
  const [groupMode, setGroupMode] = useState<GroupMode>('dueDate');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');

  // Collect all tasks assigned to the current user across ALL projects
  const myAssignedTasksWithProject = useMemo(() => {
    if (!currentUser) return [];

    const list: Array<{ project: ProjectPage; task: Task }> = [];
    projects.forEach((proj) => {
      proj.tasks.forEach((t) => {
        if (t.isDeleted || t.isArchived) return;
        const isAssigned = t.assignees?.some(
          (u) => u.id === currentUser.id || u.email?.toLowerCase() === currentUser.email?.toLowerCase()
        );
        if (isAssigned) {
          list.push({ project: proj, task: t });
        }
      });
    });
    return list;
  }, [projects, currentUser]);

  // Filtered tasks based on search, statusFilter, and priorityFilter
  const filteredList = useMemo(() => {
    let result = myAssignedTasksWithProject;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        ({ task: t }) =>
          t.title.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.label.toLowerCase().includes(q)) ||
          t.subtasks?.some((st) => st.text.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') {
      result = result.filter(({ task: t }) => t.status !== 'done');
    } else if (statusFilter === 'done') {
      result = result.filter(({ task: t }) => t.status === 'done');
    }

    if (priorityFilter !== 'all') {
      result = result.filter(({ task: t }) => t.priority === priorityFilter);
    }

    return result;
  }, [myAssignedTasksWithProject, searchQuery, statusFilter, priorityFilter]);

  // Statistics
  const totalCount = myAssignedTasksWithProject.length;
  const doneCount = myAssignedTasksWithProject.filter(({ task: t }) => t.status === 'done').length;
  const activeCount = totalCount - doneCount;
  const overdueCount = myAssignedTasksWithProject.filter(
    ({ task: t }) => isOverdue(t.dueDate, t.status)
  ).length;

  if (!currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 sm:p-12 text-center">
        <div className={`p-8 sm:p-12 rounded-3xl border shadow-sm max-w-md mx-auto ${
          darkMode ? 'bg-[#202020] border-[#333]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-[#2383e2] flex items-center justify-center mx-auto mb-4">
            <UserCheck size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Đăng nhập để xem công việc của bạn</h2>
          <p className="text-xs text-[#9b9a97] mb-6 leading-relaxed">
            Đăng nhập bằng địa chỉ Email của bạn để tự động lọc và theo dõi tất cả các công việc được giao trên mọi dự án.
          </p>
          <button
            onClick={onOpenAuthModal}
            className="w-full py-2.5 px-4 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={15} />
            <span>Đăng nhập bằng Email</span>
          </button>
        </div>
      </div>
    );
  }

  // Groups generation
  const groupedSections: Array<{ id: string; title: string; icon?: React.ReactNode; items: typeof filteredList }> = [];

  if (groupMode === 'dueDate') {
    const overdue = filteredList.filter(({ task: t }) => isOverdue(t.dueDate, t.status));
    const todayItems = filteredList.filter(
      ({ task: t }) => isDueToday(t.dueDate) && !isOverdue(t.dueDate, t.status)
    );
    const thisWeek = filteredList.filter(
      ({ task: t }) => isDueThisWeek(t.dueDate) && !isDueToday(t.dueDate) && !isOverdue(t.dueDate, t.status)
    );
    const upcoming = filteredList.filter(
      ({ task: t }) => t.dueDate && !isDueThisWeek(t.dueDate) && !isDueToday(t.dueDate) && !isOverdue(t.dueDate, t.status)
    );
    const noDate = filteredList.filter(({ task: t }) => !t.dueDate);

    if (overdue.length > 0) {
      groupedSections.push({
        id: 'overdue',
        title: 'Quá hạn (Cần xử lý ngay)',
        icon: <AlertCircle size={14} className="text-red-500" />,
        items: overdue,
      });
    }
    if (todayItems.length > 0) {
      groupedSections.push({
        id: 'today',
        title: 'Hôm nay',
        icon: <Clock size={14} className="text-amber-500" />,
        items: todayItems,
      });
    }
    if (thisWeek.length > 0) {
      groupedSections.push({
        id: 'this_week',
        title: 'Tuần này',
        icon: <Calendar size={14} className="text-blue-500" />,
        items: thisWeek,
      });
    }
    if (upcoming.length > 0) {
      groupedSections.push({
        id: 'upcoming',
        title: 'Sắp tới',
        icon: <Calendar size={14} className="text-emerald-500" />,
        items: upcoming,
      });
    }
    if (noDate.length > 0) {
      groupedSections.push({
        id: 'no_date',
        title: 'Chưa xếp ngày',
        icon: <Inbox size={14} className="text-[#9b9a97]" />,
        items: noDate,
      });
    }
  } else if (groupMode === 'project') {
    projects.forEach((proj) => {
      const pItems = filteredList.filter(({ project: p }) => p.id === proj.id);
      if (pItems.length > 0) {
        groupedSections.push({
          id: proj.id,
          title: proj.title,
          icon: <span className="text-base">{proj.icon || '📄'}</span>,
          items: pItems,
        });
      }
    });
  } else if (groupMode === 'status') {
    const statusMap: Record<string, string> = {
      todo: 'Cần làm',
      in_progress: 'Đang làm',
      in_review: 'Đang duyệt',
      done: 'Đã hoàn thành',
      blocked: 'Bị nghẽn',
      backlog: 'Chưa xếp lịch',
    };

    const statusOrder: StatusId[] = ['in_progress', 'todo', 'in_review', 'blocked', 'backlog', 'done'];
    statusOrder.forEach((st) => {
      const sItems = filteredList.filter(({ task: t }) => t.status === st);
      if (sItems.length > 0) {
        groupedSections.push({
          id: st,
          title: statusMap[st] || st,
          icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />,
          items: sItems,
        });
      }
    });
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 sm:p-10 space-y-6">
      {/* Header section with User Profile and My Tasks */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkMode ? 'bg-[#202020] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl ring-2 ring-[#2383e2] object-cover shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#202020] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">Công việc của tôi (My Tasks)</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2383e2]/10 text-[#2383e2] font-semibold">
                  {currentUser.name}
                </span>
              </div>
              <p className="text-xs text-[#9b9a97] mt-0.5">
                {currentUser.email} • Tổng hợp các công việc được giao trên toàn bộ Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter
              notifications={notifications}
              currentUser={currentUser}
              onOpenTask={onOpenTask}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearNotification={onClearNotification}
              darkMode={darkMode}
            />

            <button
              onClick={onAddNewTaskForUser}
              className="px-3.5 py-2 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tạo việc cho tôi</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className={`p-3 rounded-xl border ${
            darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-white border-[#e3e2e0]'
          }`}>
            <div className="text-[11px] text-[#9b9a97] font-medium">Tổng việc được giao</div>
            <div className="text-xl font-bold mt-1 text-[#37352f] dark:text-white">{totalCount}</div>
          </div>

          <div className={`p-3 rounded-xl border ${
            darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-white border-[#e3e2e0]'
          }`}>
            <div className="text-[11px] text-[#9b9a97] font-medium">Đang xử lý</div>
            <div className="text-xl font-bold mt-1 text-amber-500">{activeCount}</div>
          </div>

          <div className={`p-3 rounded-xl border ${
            darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-white border-[#e3e2e0]'
          }`}>
            <div className="text-[11px] text-[#9b9a97] font-medium">Quá hạn</div>
            <div className="text-xl font-bold mt-1 text-red-500">{overdueCount}</div>
          </div>

          <div className={`p-3 rounded-xl border ${
            darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-white border-[#e3e2e0]'
          }`}>
            <div className="text-[11px] text-[#9b9a97] font-medium">Đã hoàn thành</div>
            <div className="text-xl font-bold mt-1 text-emerald-500">{doneCount}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Search, and Grouping */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        darkMode ? 'bg-[#202020] border-[#313131]' : 'bg-white border-[#e8e7e4]'
      }`}>
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'active', 'done'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === f
                  ? (darkMode ? 'bg-[#333] text-white' : 'bg-[#2383e2] text-white shadow-xs')
                  : (darkMode ? 'text-[#888] hover:bg-[#282828]' : 'text-[#787774] hover:bg-[#efedea]')
              }`}
            >
              {f === 'all' ? `Tất cả (${totalCount})` : f === 'active' ? `Đang làm (${activeCount})` : `Đã xong (${doneCount})`}
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
            darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-[#fbfbfa] border-[#e3e2e0]'
          }`}>
            <Search size={13} className="text-[#9b9a97]" />
            <input
              type="text"
              placeholder="Tìm việc của tôi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-xs w-28 sm:w-36"
            />
          </div>

          {/* Group mode */}
          <div className={`flex items-center rounded-lg p-0.5 border text-xs ${
            darkMode ? 'bg-[#252525] border-[#383838]' : 'bg-[#f1f1ef] border-[#e0deda]'
          }`}>
            <button
              onClick={() => setGroupMode('dueDate')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                groupMode === 'dueDate'
                  ? (darkMode ? 'bg-[#333] text-white' : 'bg-white text-[#37352f] shadow-xs')
                  : 'text-[#787774]'
              }`}
            >
              Hạn chót
            </button>
            <button
              onClick={() => setGroupMode('project')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                groupMode === 'project'
                  ? (darkMode ? 'bg-[#333] text-white' : 'bg-white text-[#37352f] shadow-xs')
                  : 'text-[#787774]'
              }`}
            >
              Dự án
            </button>
            <button
              onClick={() => setGroupMode('status')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                groupMode === 'status'
                  ? (darkMode ? 'bg-[#333] text-white' : 'bg-white text-[#37352f] shadow-xs')
                  : 'text-[#787774]'
              }`}
            >
              Trạng thái
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Task List */}
      <div className="space-y-6">
        {groupedSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-bold text-[#9b9a97] uppercase tracking-wider">
              {section.icon}
              <span>{section.title}</span>
              <span className="text-[11px] font-mono font-normal">({section.items.length})</span>
            </div>

            <div className="space-y-1.5">
              {section.items.map(({ project: p, task: t }) => {
                const overdue = isOverdue(t.dueDate, t.status);
                const isDone = t.status === 'done';
                const col = p.columns.find((c) => c.id === t.status);
                const colStyle = col ? NOTION_COLORS[col.color] : NOTION_COLORS.gray;
                const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.none;

                return (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(p.id, t)}
                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                      darkMode
                        ? 'bg-[#222] border-[#313131] hover:bg-[#282828]'
                        : 'bg-white border-[#e3e2e0] hover:border-[#c5c4c1]'
                    }`}
                  >
                    {/* Left: Checkbox + Title + Project Badge */}
                    <div className="flex items-center gap-3 flex-1 overflow-hidden pr-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus = isDone ? 'todo' : 'done';
                          onUpdateTask(p.id, t.id, {
                            status: nextStatus,
                            progress: nextStatus === 'done' ? 100 : t.progress,
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

                      <div className="truncate flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isDone
                                ? 'line-through text-[#9b9a97]'
                                : darkMode ? 'text-[#e0e0e0]' : 'text-[#37352f]'
                            }`}
                          >
                            {t.title}
                          </span>

                          {/* Project Tag */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProject(p.id);
                            }}
                            className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors shrink-0 ${
                              darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-[#aaa] hover:text-white' : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#787774] hover:text-black'
                            }`}
                            title="Chuyển đến bảng dự án này"
                          >
                            <span>{p.icon || '📄'}</span>
                            <span className="max-w-[120px] truncate">{p.title}</span>
                          </span>
                        </div>

                        {/* Subtasks or tags preview */}
                        {t.subtasks && t.subtasks.length > 0 && (
                          <div className="text-[10px] text-[#9b9a97] mt-0.5 flex items-center gap-1.5">
                            <CheckSquare size={10} />
                            <span>
                              {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} việc con hoàn thành
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Meta badges */}
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      {/* Priority */}
                      {t.priority !== 'none' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priority.badgeBg} ${priority.badgeText}`}>
                          {priority.label}
                        </span>
                      )}

                      {/* Status */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${colStyle.badgeBg}`}>
                        {col?.title || t.status}
                      </span>

                      {/* Due Date */}
                      {t.dueDate && (
                        <span
                          className={`text-[11px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded ${
                            overdue
                              ? 'bg-red-50 text-red-600 dark:bg-red-950/40 border border-red-200 dark:border-red-900 font-bold'
                              : isDueToday(t.dueDate)
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                              : 'text-[#9b9a97]'
                          }`}
                        >
                          <Calendar size={11} />
                          <span>{formatShortDate(t.dueDate)}</span>
                        </span>
                      )}

                      <ChevronRight size={14} className="text-[#9b9a97] group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {groupedSections.length === 0 && (
          <div className="py-16 text-center text-xs text-[#9b9a97] space-y-2">
            <UserCheck size={32} className="mx-auto text-[#9b9a97]/60" />
            <p className="font-semibold text-sm text-[#5a5a58] dark:text-[#bbb]">
              Không tìm thấy công việc nào phù hợp với bộ lọc.
            </p>
            <p>Bạn đã hoàn thành hết hoặc chưa có công việc mới nào được giao.</p>
          </div>
        )}
      </div>
    </div>
  );
};
