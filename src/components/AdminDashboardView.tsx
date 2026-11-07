import React, { useState, useMemo } from 'react';
import { AppTheme, PriorityLevel, ProjectPage, StatusId, Task, User, UserRole } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatDateVi, formatShortDate, isOverdue, getTodayString, diffInDays } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Bell, 
  Search, 
  ExternalLink, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Send, 
  Check, 
  BarChart3, 
  ArrowUpRight, 
  Sparkles,
  Inbox,
  Lock,
  Layers,
  Folder,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface AdminDashboardViewProps {
  projects: ProjectPage[];
  users: User[];
  currentUser: User | null;
  onOpenTask: (projectId: string, taskId: string) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onSendReminder: (targetUser: User, overdueTasks: Task[], customMessage?: string) => void;
  onBatchSendReminders: (userOverdueMap: { user: User; tasks: Task[] }[]) => void;
  onSelectProject: (projectId: string) => void;
  onOpenAuthModal: () => void;
  darkMode: boolean;
  appTheme?: AppTheme;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  projects,
  users,
  currentUser,
  onOpenTask,
  onUpdateUserRole,
  onSendReminder,
  onBatchSendReminders,
  onSelectProject,
  onOpenAuthModal,
  darkMode,
  appTheme,
}) => {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'has_overdue' | 'admin' | 'member'>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<'all' | 'overdue' | 'in_progress' | 'done'>('overdue');
  const [remindingUserId, setRemindingUserId] = useState<string | null>(null);
  const [isBatchReminding, setIsBatchReminding] = useState(false);

  const isPink = appTheme === 'qanda_pink';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'steven.mai@mathpresso.com';

  // Gather all active tasks across all non-deleted projects
  const allTasks = useMemo(() => {
    const list: { task: Task; project: ProjectPage }[] = [];
    projects.forEach((p) => {
      if (p.isDeleted) return;
      (p.tasks || []).forEach((t) => {
        if (!t.isDeleted && !t.isArchived) {
          list.push({ task: t, project: p });
        }
      });
    });
    return list;
  }, [projects]);

  // Compute workload and performance statistics per user
  const userStats = useMemo(() => {
    return users.map((user) => {
      const userTasks = allTasks.filter(({ task }) => {
        const isAssigned = (task.assignees || []).some(
          (u) => u.id === user.id || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
        );
        return isAssigned;
      });

      const totalAssigned = userTasks.length;
      const completedTasks = userTasks.filter(({ task }) => task.status === 'done');
      const inProgressTasks = userTasks.filter(({ task }) => task.status !== 'done');
      const inReviewTasks = userTasks.filter(({ task }) => task.status === 'in_review');
      const overdueTasks = userTasks.filter(({ task }) => isOverdue(task.dueDate, task.status));

      const completionRate = totalAssigned > 0 
        ? Math.round((completedTasks.length / totalAssigned) * 100) 
        : 100;

      return {
        user,
        totalAssigned,
        completedCount: completedTasks.length,
        inProgressCount: inProgressTasks.length,
        inReviewCount: inReviewTasks.length,
        overdueCount: overdueTasks.length,
        overdueTasks: overdueTasks.map((t) => t.task),
        completionRate,
        tasksWithProject: userTasks,
      };
    });
  }, [users, allTasks]);

  // Overall Global Workspace Metrics
  const globalMetrics = useMemo(() => {
    const totalUsers = users.length;
    const totalActiveTasks = allTasks.filter(({ task }) => task.status !== 'done').length;
    const totalCompletedTasks = allTasks.filter(({ task }) => task.status === 'done').length;
    const totalTasksCount = allTasks.length;
    const globalCompletionRate = totalTasksCount > 0 
      ? Math.round((totalCompletedTasks / totalTasksCount) * 100) 
      : 0;

    const allOverdueList = allTasks.filter(({ task }) => isOverdue(task.dueDate, task.status));
    const usersWithOverdue = userStats.filter((s) => s.overdueCount > 0);

    return {
      totalUsers,
      totalActiveTasks,
      totalCompletedTasks,
      totalTasksCount,
      globalCompletionRate,
      totalOverdueCount: allOverdueList.length,
      allOverdueList,
      usersWithOverdue,
    };
  }, [users, allTasks, userStats]);

  // Filtered users for the table
  const filteredUserStats = useMemo(() => {
    return userStats.filter((stat) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        stat.user.name.toLowerCase().includes(query) || 
        (stat.user.email && stat.user.email.toLowerCase().includes(query));

      if (!matchSearch) return false;

      if (filterMode === 'has_overdue') return stat.overdueCount > 0;
      if (filterMode === 'admin') return stat.user.role === 'admin';
      if (filterMode === 'member') return stat.user.role !== 'admin';
      return true;
    });
  }, [userStats, searchQuery, filterMode]);

  // Handle single user reminder
  const handleTriggerReminder = (stat: typeof userStats[0]) => {
    if (stat.overdueCount === 0) return;
    setRemindingUserId(stat.user.id);
    onSendReminder(stat.user, stat.overdueTasks);
    setTimeout(() => {
      setRemindingUserId(null);
    }, 1200);
  };

  // Handle batch reminder for all users with overdue tasks
  const handleBatchReminder = () => {
    const targets = globalMetrics.usersWithOverdue.map((s) => ({
      user: s.user,
      tasks: s.overdueTasks,
    }));
    if (targets.length === 0) return;

    setIsBatchReminding(true);
    onBatchSendReminders(targets);
    setTimeout(() => {
      setIsBatchReminding(false);
    }, 1500);
  };

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-900/50 shadow-sm">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-lg font-bold text-[#18181b] dark:text-[#f4f4f5] mb-2">
          Yêu cầu đăng nhập quản trị
        </h2>
        <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-md mb-6 leading-relaxed">
          Dashboard Quản trị dành riêng cho Quản trị viên (Admin) để theo dõi khối lượng công việc, tỷ lệ hoàn thành và đôn đốc các nhiệm vụ quá hạn của đội ngũ.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Lock size={15} />
          <span>Đăng nhập với tài khoản Admin</span>
        </button>
      </div>
    );
  }

  // If user is logged in but not an admin
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-900/50 shadow-sm">
          <Lock size={28} />
        </div>
        <h2 className="text-lg font-bold text-[#18181b] dark:text-[#f4f4f5] mb-2">
          Khu vực giới hạn quyền truy cập
        </h2>
        <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-md mb-6 leading-relaxed">
          Tài khoản của bạn (<strong className="text-[#18181b] dark:text-white">{currentUser.name}</strong>) hiện đang có vai trò là <strong>Thành viên (Member)</strong>. Bạn cần quyền <strong>Quản trị viên (Admin)</strong> để xem dashboard tiến độ của toàn đội ngũ.
        </p>
        <button
          onClick={() => onUpdateUserRole(currentUser.id, 'admin')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck size={15} />
          <span>Nâng cấp tài khoản thành Quản trị viên (Admin)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 dark:border-white/[0.08] border-black/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] dark:text-blue-400 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              {t('adminDashboard', 'Bảng điều khiển Quản trị')}
            </span>
            <span className="text-xs text-[#a1a1aa]" aria-hidden="true">·</span>
            <span className="text-xs text-[#71717a] dark:text-[#a1a1aa] font-mono tabular-nums">
              {users.length} {t('totalMembers', 'thành viên')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181b] dark:text-white">
            {t('adminDashboardTitle', 'Hiệu suất & Khối lượng công việc Đội ngũ')}
          </h1>
          <p className="text-xs sm:text-sm text-[#71717a] dark:text-[#a1a1aa] mt-1 max-w-2xl leading-relaxed">
            {t('adminDashboardSubtitle', 'Theo dõi phân bổ nhiệm vụ từng nhân sự, tỷ lệ hoàn thành dự án và gửi nhắc nhở tức thì cho các công việc trễ hạn.')}
          </p>
        </div>

        {/* Global Action: Batch Remind */}
        <div className="flex items-center gap-3 shrink-0">
          {globalMetrics.totalOverdueCount > 0 ? (
            <button
              onClick={handleBatchReminder}
              disabled={isBatchReminding}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer text-white ${
                isBatchReminding 
                  ? 'bg-emerald-600' 
                  : (isPink ? 'bg-[#e11d48] hover:bg-rose-700' : 'bg-rose-600 hover:bg-rose-700')
              }`}
              title="Gửi thông báo nhắc nhở đến tất cả thành viên đang có công việc quá hạn"
            >
              {isBatchReminding ? (
                <>
                  <Check size={15} />
                  <span>{t('remindAllSuccess', 'Đã gửi nhắc nhở thành công!')}</span>
                </>
              ) : (
                <>
                  <Bell size={15} />
                  <span>{t('remindAllOverdue', 'Nhắc nhở tất cả quá hạn')} ({globalMetrics.usersWithOverdue.length})</span>
                </>
              )}
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/20">
              <CheckCircle2 size={15} />
              <span>{t('noOverdueJobs', 'Không có công việc quá hạn')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= METRIC CARDS (KPI STRIP) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-[#141518] border-white/[0.07]' : 'bg-white border-[#e5e5e5] shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-[#71717a] dark:text-[#a1a1aa] mb-2">
            <span className="text-xs font-medium">{t('totalMembers', 'Tổng thành viên')}</span>
            <Users size={16} className="text-[#2563eb]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white font-mono tabular-nums">
            {globalMetrics.totalUsers}
          </div>
          <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] mt-1 flex items-center gap-1">
            <span>{t('admin', 'Quản trị')}: {users.filter((u) => u.role === 'admin').length}</span>
            <span>·</span>
            <span>{t('member', 'Thành viên')}: {users.filter((u) => u.role !== 'admin').length}</span>
          </div>
        </div>

        {/* Active Tasks */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-[#141518] border-white/[0.07]' : 'bg-white border-[#e5e5e5] shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-[#71717a] dark:text-[#a1a1aa] mb-2">
            <span className="text-xs font-medium">{t('activeTasks', 'Việc đang thực hiện')}</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white font-mono tabular-nums">
            {globalMetrics.totalActiveTasks}
          </div>
          <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] mt-1">
            {t('activeTasks', 'Công việc đang xử lý')}
          </div>
        </div>

        {/* Team Completion Rate */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-[#141518] border-white/[0.07]' : 'bg-white border-[#e5e5e5] shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-[#71717a] dark:text-[#a1a1aa] mb-2">
            <span className="text-xs font-medium">{t('completionRate', 'Tỷ lệ hoàn thành')}</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#18181b] dark:text-white font-mono tabular-nums">
              {globalMetrics.globalCompletionRate}%
            </div>
            <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] font-mono">
              ({globalMetrics.totalCompletedTasks}/{globalMetrics.totalTasksCount})
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 mt-2.5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${globalMetrics.globalCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Overdue Alert Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          globalMetrics.totalOverdueCount > 0
            ? (darkMode ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/70 border-rose-200')
            : (darkMode ? 'bg-[#141518] border-white/[0.07]' : 'bg-white border-[#e5e5e5] shadow-xs')
        }`}>
          <div className="flex items-center justify-between text-[#71717a] dark:text-[#a1a1aa] mb-2">
            <span className={`text-xs font-medium ${globalMetrics.totalOverdueCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
              {t('overdueJobs', 'Việc quá hạn cần đôn đốc')}
            </span>
            <AlertTriangle size={16} className={globalMetrics.totalOverdueCount > 0 ? 'text-rose-500' : 'text-[#71717a]'} />
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
            globalMetrics.totalOverdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#18181b] dark:text-white'
          }`}>
            {globalMetrics.totalOverdueCount}
          </div>
          <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa] mt-1">
            {globalMetrics.usersWithOverdue.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {globalMetrics.usersWithOverdue.length} {t('member', 'nhân sự')}
              </span>
            ) : (
              <span>{t('noOverdueJobs', 'Không có công việc quá hạn')}</span>
            )}
          </div>
        </div>
      </div>

      {/* ================= USER WORKLOAD & PERFORMANCE SECTION ================= */}
      <div className="space-y-4">
        {/* Controls: Search & Segmented Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#18181b] dark:text-white flex items-center gap-2">
              <Users size={18} className="text-[#2563eb]" />
              <span>{t('workloadByMember', 'Khối lượng công việc theo Thành viên')}</span>
            </h2>
            <span className="text-xs text-[#71717a] dark:text-[#a1a1aa] font-mono tabular-nums">
              ({filteredUserStats.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder', 'Tìm theo tên hoặc email...')}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border transition-colors outline-none ${
                  darkMode 
                    ? 'bg-[#1a1b1f] border-white/10 text-white placeholder-[#71717a] focus:border-[#2563eb]' 
                    : 'bg-white border-[#e5e5e5] text-[#18181b] placeholder-[#a1a1aa] focus:border-[#2563eb]'
                }`}
              />
            </div>

            {/* Filter Buttons */}
            <div className={`flex items-center p-1 rounded-xl border text-xs ${
              darkMode ? 'bg-[#18191d] border-white/[0.08]' : 'bg-[#f4f4f5] border-[#e5e5e5]'
            }`}>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white text-[#18181b] font-semibold shadow-xs')
                    : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                }`}
              >
                {t('all', 'Tất cả')}
              </button>
              <button
                onClick={() => setFilterMode('has_overdue')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'has_overdue'
                    ? 'bg-rose-500 text-white font-semibold shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:opacity-80'
                }`}
              >
                <span>{t('overdueJobs', 'Có việc quá hạn')}</span>
                {globalMetrics.usersWithOverdue.length > 0 && (
                  <span className="font-mono text-[10px] font-bold px-1 rounded-full bg-white/20">
                    {globalMetrics.usersWithOverdue.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterMode('admin')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'admin'
                    ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white text-[#18181b] font-semibold shadow-xs')
                    : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                }`}
              >
                {t('admin', 'Admin')}
              </button>
              <button
                onClick={() => setFilterMode('member')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'member'
                    ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white text-[#18181b] font-semibold shadow-xs')
                    : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                }`}
              >
                {t('member', 'Thành viên')}
              </button>
            </div>
          </div>
        </div>

        {/* User Cards / High-Density Grid */}
        <div className="space-y-3">
          {filteredUserStats.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              darkMode ? 'bg-[#141518] border-white/[0.06]' : 'bg-white border-[#e5e5e5]'
            }`}>
              <Inbox size={32} className="mx-auto text-[#71717a] mb-2" />
              <div className="text-sm font-bold text-[#18181b] dark:text-white">Không tìm thấy thành viên nào</div>
              <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-1">
                Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            filteredUserStats.map((stat) => {
              const isExpanded = expandedUserId === stat.user.id;
              const hasOverdue = stat.overdueCount > 0;
              const isSelf = currentUser.id === stat.user.id || (currentUser.email && stat.user.email === currentUser.email);

              return (
                <div
                  key={stat.user.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    darkMode ? 'bg-[#141518] border-white/[0.08]' : 'bg-white border-[#e5e5e5] shadow-xs'
                  } ${hasOverdue ? 'ring-1 ring-rose-500/30' : ''}`}
                >
                  {/* User Row Summary */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Identity */}
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <div className="relative shrink-0">
                        <img
                          src={stat.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(stat.user.name)}&backgroundColor=2383e2`}
                          alt={stat.user.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                        />
                        {stat.user.role === 'admin' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-xs" title="Quản trị viên">
                            <ShieldCheck size={10} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#18181b] dark:text-white truncate">
                            {stat.user.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-[#2563eb] dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded">
                              Bạn
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            stat.user.role === 'admin'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                              : 'bg-black/5 text-[#71717a] dark:bg-white/5 dark:text-[#a1a1aa]'
                          }`}>
                            {stat.user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                          </span>
                        </div>
                        <div className="text-xs text-[#71717a] dark:text-[#a1a1aa] truncate mt-0.5 font-mono">
                          {stat.user.email || 'Chưa cập nhật email'}
                        </div>
                      </div>
                    </div>

                    {/* Workload Stats Strip */}
                    <div className="grid grid-cols-4 gap-3 sm:gap-6 shrink-0 py-2 sm:py-0 border-y sm:border-y-0 border-black/5 dark:border-white/5">
                      {/* Total Assigned */}
                      <div className="text-center sm:text-left">
                        <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Được giao</div>
                        <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-[#18181b] dark:text-white">
                          {stat.totalAssigned}
                        </div>
                      </div>

                      {/* In Progress */}
                      <div className="text-center sm:text-left">
                        <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Đang làm</div>
                        <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                          {stat.inProgressCount}
                        </div>
                      </div>

                      {/* Completed */}
                      <div className="text-center sm:text-left">
                        <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Hoàn thành</div>
                        <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          {stat.completedCount}
                        </div>
                      </div>

                      {/* Overdue */}
                      <div className="text-center sm:text-left">
                        <div className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Quá hạn</div>
                        <div className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                          stat.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#71717a]'
                        }`}>
                          {stat.overdueCount}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:w-72 shrink-0">
                      {/* Completion Progress Bar */}
                      <div className="w-full sm:flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">Tỷ lệ xong</span>
                          <span className="font-bold font-mono tabular-nums text-[#18181b] dark:text-white">
                            {stat.completionRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              stat.completionRate >= 80 
                                ? 'bg-emerald-500' 
                                : stat.completionRate >= 50 
                                ? 'bg-amber-500' 
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${stat.completionRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Reminder Button if user has overdue tasks */}
                        {stat.overdueCount > 0 && (
                          <button
                            onClick={() => handleTriggerReminder(stat)}
                            disabled={remindingUserId === stat.user.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                              remindingUserId === stat.user.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }`}
                            title={`Gửi thông báo nhắc nhở ${stat.overdueCount} công việc quá hạn đến ${stat.user.name}`}
                          >
                            {remindingUserId === stat.user.id ? (
                              <>
                                <Check size={13} />
                                <span>Đã gửi!</span>
                              </>
                            ) : (
                              <>
                                <Bell size={13} />
                                <span>Nhắc nhở</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Role toggle button for Admin */}
                        <button
                          onClick={() => onUpdateUserRole(stat.user.id, stat.user.role === 'admin' ? 'member' : 'admin')}
                          className={`p-1.5 px-2 rounded-xl text-[11px] font-medium border transition-colors cursor-pointer ${
                            darkMode 
                              ? 'border-white/10 hover:bg-white/5 text-[#a1a1aa] hover:text-white' 
                              : 'border-[#e5e5e5] hover:bg-[#f4f4f5] text-[#52525b] hover:text-black'
                          }`}
                          title={`Chuyển quyền sang ${stat.user.role === 'admin' ? 'Thành viên' : 'Quản trị viên'}`}
                        >
                          {stat.user.role === 'admin' ? 'Hạ quyền' : 'Thăng Admin'}
                        </button>

                        {/* Accordion Expand Tasks Button */}
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : stat.user.id)}
                          className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            isExpanded 
                              ? (darkMode ? 'bg-white/10 text-white border-white/20' : 'bg-[#e5e5e5] text-black border-black/10')
                              : (darkMode ? 'border-white/10 hover:bg-white/5 text-[#71717a]' : 'border-[#e5e5e5] hover:bg-[#f4f4f5] text-[#71717a]')
                          }`}
                          title={isExpanded ? 'Thu gọn danh sách việc' : 'Xem danh sách công việc của người này'}
                        >
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Content: Task List assigned to this user */}
                  {isExpanded && (
                    <div className={`p-4 sm:p-5 border-t space-y-3 ${
                      darkMode ? 'bg-[#0f1013] border-white/[0.06]' : 'bg-[#fafafa] border-[#ebeae7]'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-[#18181b] dark:text-white flex items-center gap-1.5">
                          <Layers size={14} className="text-[#2563eb]" />
                          <span>Chi tiết công việc của {stat.user.name}</span>
                        </div>

                        {/* Segmented filter for user's tasks */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            onClick={() => setSelectedTaskFilter('overdue')}
                            className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                              selectedTaskFilter === 'overdue'
                                ? 'bg-rose-500 text-white font-semibold'
                                : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                            }`}
                          >
                            Quá hạn ({stat.overdueCount})
                          </button>
                          <button
                            onClick={() => setSelectedTaskFilter('in_progress')}
                            className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                              selectedTaskFilter === 'in_progress'
                                ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white text-black font-semibold shadow-xs')
                                : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                            }`}
                          >
                            Đang làm ({stat.inProgressCount})
                          </button>
                          <button
                            onClick={() => setSelectedTaskFilter('done')}
                            className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                              selectedTaskFilter === 'done'
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                            }`}
                          >
                            Đã xong ({stat.completedCount})
                          </button>
                          <button
                            onClick={() => setSelectedTaskFilter('all')}
                            className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                              selectedTaskFilter === 'all'
                                ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white text-black font-semibold shadow-xs')
                                : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
                            }`}
                          >
                            Tất cả ({stat.totalAssigned})
                          </button>
                        </div>
                      </div>

                      {/* Filtered task rows */}
                      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                        {stat.tasksWithProject
                          .filter(({ task }) => {
                            if (selectedTaskFilter === 'overdue') return isOverdue(task.dueDate, task.status);
                            if (selectedTaskFilter === 'in_progress') return task.status !== 'done';
                            if (selectedTaskFilter === 'done') return task.status === 'done';
                            return true;
                          })
                          .map(({ task, project }) => {
                            const overdue = isOverdue(task.dueDate, task.status);
                            const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

                            return (
                              <div
                                key={task.id}
                                onClick={() => onOpenTask(project.id, task.id)}
                                className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {overdue ? (
                                    <AlertTriangle size={15} className="text-rose-500 shrink-0" />
                                  ) : task.status === 'done' ? (
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <Clock size={15} className="text-amber-500 shrink-0" />
                                  )}

                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-[#18181b] dark:text-white truncate">
                                      {task.title}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-[#71717a] dark:text-[#a1a1aa] mt-0.5">
                                      <span className="truncate">📁 {project.title}</span>
                                      <span>·</span>
                                      <span className={overdue ? 'text-rose-500 font-bold font-mono' : 'font-mono'}>
                                        {task.dueDate ? `Hạn: ${formatShortDate(task.dueDate)}` : 'Chưa có hạn'}
                                        {overdue && ` (Trễ ${diffInDays(task.dueDate, getTodayString())} ngày)`}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${priority.color}`}>
                                    {priority.label}
                                  </span>
                                  <ExternalLink size={12} className="text-[#71717a]" />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= OVERDUE JOBS MASTER LIST ================= */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${
        darkMode ? 'bg-[#141518] border-white/[0.08]' : 'bg-white border-[#e5e5e5] shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#18181b] dark:text-white flex items-center gap-2">
              <AlertTriangle size={17} className="text-rose-500" />
              <span>{t('overdueJobsList', 'Toàn bộ nhiệm vụ quá hạn trên toàn hệ thống')}</span>
            </h3>
            <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-0.5">
              {t('adminDashboardSubtitle', 'Danh sách các công việc đã vượt quá hạn chót mà chưa hoàn thành. Bấm vào bất kỳ dòng nào để mở chi tiết hoặc đôn đốc.')}
            </p>
          </div>
          <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            {globalMetrics.totalOverdueCount} {t('overdueTasksBadge', 'việc quá hạn')}
          </div>
        </div>

        {globalMetrics.totalOverdueCount === 0 ? (
          <div className="py-10 text-center text-[#71717a] dark:text-[#a1a1aa]">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <div className="text-xs font-semibold text-[#18181b] dark:text-white">{t('noOverdueJobs', 'Không có nhiệm vụ nào bị trễ hạn')}</div>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06] overflow-x-auto">
            {globalMetrics.allOverdueList.map(({ task, project }) => {
              const daysLate = diffInDays(task.dueDate, getTodayString());
              const assignees = task.assignees || [];
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

              return (
                <div
                  key={`${project.id}-${task.id}`}
                  className={`py-3 px-2 flex items-center justify-between gap-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`}
                >
                  <div 
                    onClick={() => onOpenTask(project.id, task.id)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#18181b] dark:text-white truncate hover:text-[#2563eb] transition-colors">
                        {task.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-mono shrink-0">
                        Quá {daysLate} ngày
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#71717a] dark:text-[#a1a1aa] mt-1">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project.id);
                        }}
                        className="hover:underline flex items-center gap-1 truncate"
                      >
                        <Folder size={11} />
                        {project.title}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                        Hạn: {formatDateVi(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  {/* Assignees */}
                  <div className="flex items-center gap-2 shrink-0">
                    {assignees.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={assignees[0].avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(assignees[0].name)}&backgroundColor=2383e2`}
                          alt={assignees[0].name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-black/10 dark:border-white/10"
                        />
                        <span className="text-xs font-medium text-[#18181b] dark:text-white hidden sm:inline max-w-[120px] truncate">
                          {assignees[0].name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#71717a] italic">Chưa giao</span>
                    )}

                    {/* Quick Remind Button for this single task */}
                    {assignees.length > 0 && (
                      <button
                        onClick={() => onSendReminder(assignees[0], [task], `Admin nhắc nhở bạn đẩy nhanh tiến độ cho công việc "${task.title}" đang bị quá hạn!`)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Gửi nhắc nhở riêng cho job "${task.title}"`}
                      >
                        <Bell size={11} />
                        <span className="hidden sm:inline">{t('remind', 'Nhắc nhở')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenTask(project.id, task.id)}
                      className="p-1.5 rounded-lg text-[#71717a] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title="Mở chi tiết công việc"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
