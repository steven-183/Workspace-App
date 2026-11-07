import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MainSectionType, ProjectPage, TaskNotification, User, TeamId, FIXED_TEAMS, AppTheme } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  ChevronDown, 
  Search, 
  Settings, 
  Plus, 
  Trash2, 
  Star, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeft,
  Download, 
  Upload, 
  RotateCcw, 
  Sun,
  Moon,
  CheckSquare, 
  LogIn, 
  User as UserIcon,
  Sparkles, 
  Archive,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Globe
} from 'lucide-react';
import { isOverdue } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  projects: ProjectPage[];
  activeProjectId: string;
  activeSection: MainSectionType;
  currentUser: User | null;
  notifications: TaskNotification[];
  onOpenTask: (projectId: string, taskId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (notificationId: string) => void;
  onSelectProject: (id: string) => void;
  onSelectMyTasks: () => void;
  onSelectAdminDashboard?: () => void;
  onOpenAuthModal: () => void;
  onOpenTrashArchive: (tab?: 'archive' | 'trash') => void;
  onAddProject: (teamId?: TeamId) => void;
  onDeleteProject: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSearch: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onResetData: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  appTheme?: AppTheme;
  onSetTheme?: (theme: AppTheme) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  activeSection,
  currentUser,
  notifications,
  onOpenTask,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onSelectProject,
  onSelectMyTasks,
  onSelectAdminDashboard,
  onOpenAuthModal,
  onOpenTrashArchive,
  onAddProject,
  onDeleteProject,
  onToggleFavorite,
  onOpenSearch,
  onExportData,
  onImportData,
  onResetData,
  isCollapsed,
  onToggleCollapse,
  darkMode,
  onToggleDarkMode,
  appTheme = 'light',
  onSetTheme,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectPage | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({
    personal: false,
    performance_marketing: false,
    book_growth: false,
    product: false,
  });

  const toggleTeam = (teamKey: string) => {
    setCollapsedTeams((prev) => ({ ...prev, [teamKey]: !prev[teamKey] }));
  };

  const getProjectTeamId = (p: ProjectPage): TeamId => {
    if (p.teamId) return p.teamId;
    const cat = (p.category || '').toLowerCase().trim();
    const title = (p.title || '').toLowerCase().trim();
    
    if (
      cat === 'book growth' ||
      cat.includes('book') ||
      cat.includes('sách') ||
      title.includes('sách') ||
      title.includes('book') ||
      title.includes('độc giả') ||
      title.includes('bản quyền')
    ) {
      return 'book_growth';
    }

    if (
      cat === 'performance marketing' ||
      cat.includes('performance') ||
      cat.includes('marketing') ||
      cat.includes('ads') ||
      title.includes('marketing') ||
      title.includes('ads') ||
      title.includes('cro') ||
      title.includes('acquisition')
    ) {
      return 'performance_marketing';
    }

    return 'product';
  };

  const activeProjects = projects.filter((p) => !p.isDeleted);
  
  // Isolate personal project (only belongs to current logged in user)
  const personalProject = activeProjects.find((p) => 
    p.isPersonal || 
    p.category === 'Cá nhân' || 
    p.id.startsWith('personal-') || 
    p.title.toLowerCase() === 'task cá nhân'
  );

  // Remaining projects for team categories and favorites
  const nonPersonalProjects = activeProjects.filter((p) => p.id !== personalProject?.id);
  const favoriteProjects = nonPersonalProjects.filter((p) => p.isFavorite);
  const regularProjects = nonPersonalProjects.filter((p) => !p.isFavorite);

  // Count uncompleted tasks assigned to or awaiting review from the current user
  const myPendingTasksCount = currentUser
    ? projects.reduce((acc, p) => {
        const count = (p.tasks || []).filter((t) => 
          !t.isDeleted &&
          !t.isArchived &&
          t.status !== 'done' &&
          (
            t.assignees?.some(
              (u) => u.id === currentUser.id || (currentUser.email && u.email?.toLowerCase() === currentUser.email.toLowerCase())
            ) ||
            (t.status === 'in_review' && t.creator && (t.creator.id === currentUser.id || (currentUser.email && t.creator.email?.toLowerCase() === currentUser.email.toLowerCase())))
          )
        ).length;
        return acc + count;
      }, 0)
    : 0;

  // Total overdue tasks across workspace for admin reminder badge
  const globalOverdueCount = projects.reduce((acc, p) => {
    if (p.isDeleted) return acc;
    const count = (p.tasks || []).filter((t) => !t.isDeleted && !t.isArchived && isOverdue(t.dueDate, t.status)).length;
    return acc + count;
  }, 0);

  // Theme styling helpers (ensuring deeper pink, high contrast text and aesthetic design)
  const isPink = appTheme === 'qanda_pink';

  // Sidebar container styles (Frosted Glass & Depth)
  const sidebarContainerClass = isPink
    ? 'bg-[#ffd2d8]/90 backdrop-blur-xl border-[#fda4af] text-[#4c0519]'
    : darkMode
      ? 'bg-[#0e0f12]/85 backdrop-blur-xl border-white/[0.07] text-[#e4e4e7] shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.03)]'
      : 'bg-[#f7f6f3]/85 backdrop-blur-xl border-[#e8e7e4] text-[#37352f] shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]';

  // Text color styles
  const textPrimary = isPink
    ? 'text-[#4c0519]'
    : darkMode ? 'text-[#f4f4f5]' : 'text-[#37352f]';

  const textMuted = isPink
    ? 'text-[#881337]'
    : darkMode ? 'text-[#a1a1aa]' : 'text-[#787774]';

  const sectionHeaderColor = isPink
    ? 'text-[#9f1239]'
    : darkMode ? 'text-[#71717a]' : 'text-[#787774]';

  // Hover & Active items
  const itemHover = isPink
    ? 'hover:bg-[#fff0f3]/85 text-[#4c0519]'
    : darkMode ? 'hover:bg-white/[0.05] text-[#f4f4f5]' : 'hover:bg-[#efedea] text-[#5a5a58]';

  const itemActive = isPink
    ? 'bg-white text-[#9f1239] font-bold shadow-xs ring-1 ring-[#fda4af]'
    : darkMode ? 'bg-white/[0.08] text-white font-medium shadow-xs border border-white/[0.08]' : 'bg-[#e9e8e4] text-[#37352f] font-semibold';

  // Badges & Counters
  const badgeClass = isPink
    ? 'bg-[#ffe4e6] text-[#9f1239] border border-[#fecdd3]'
    : darkMode ? 'bg-white/[0.06] text-[#a1a1aa] border border-white/[0.05]' : 'bg-[#e2e1de] text-[#787774]';

  // Border dividers
  const dividerClass = isPink
    ? 'border-[#fda4af]'
    : darkMode ? 'border-white/[0.06]' : 'border-[#e8e7e4]';

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 52 : 256 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className={`h-screen border-r flex flex-col justify-between shrink-0 select-none overflow-hidden z-20 transition-colors ${sidebarContainerClass}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCollapsed ? (
          /* ================= COLLAPSED STRIP ================= */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="w-13 h-full flex flex-col items-center py-3 justify-between"
          >
            <div className="flex flex-col items-center gap-2.5 w-full">
              {/* Growth Logo Icon */}
              <button
                onClick={onToggleCollapse}
                title={t('expandSidebar', 'Mở rộng thanh bên')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs transition-all hover:scale-105 cursor-pointer ${
                  isPink
                    ? 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/30'
                    : darkMode
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 ring-1 ring-white/10'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-teal-600/25 ring-1 ring-emerald-700/15'
                }`}
              >
                <TrendingUp size={18} className="stroke-[2.5]" />
              </button>
              
              <button
                onClick={onOpenSearch}
                title="Tìm kiếm nhanh (Ctrl+K)"
                className={`p-2 rounded-lg transition-colors ${
                  isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
                }`}
              >
                <Search size={18} />
              </button>

              {/* Notification bell in collapsed sidebar */}
              <NotificationCenter
                notifications={notifications}
                currentUser={currentUser}
                onOpenTask={onOpenTask}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onClearNotification={onClearNotification}
                darkMode={darkMode}
              />

              {/* My tasks icon */}
              <button
                onClick={onSelectMyTasks}
                title={`Công việc của tôi (${myPendingTasksCount} việc)`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center relative transition-all ${
                  activeSection === 'my_tasks'
                    ? (isPink ? 'bg-[#e11d48] text-white shadow-xs' : 'bg-[#2383e2] text-white shadow-xs')
                    : (isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2a2a2a] text-[#aaa]' : 'hover:bg-[#ebeae7] text-[#787774]')
                }`}
              >
                <CheckSquare size={16} />
                {myPendingTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {myPendingTasksCount}
                  </span>
                )}
              </button>

              {/* Admin Dashboard icon */}
              {onSelectAdminDashboard && (
                <button
                  onClick={onSelectAdminDashboard}
                  title={`Dashboard Quản trị (${globalOverdueCount} việc quá hạn)`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center relative transition-all ${
                    activeSection === 'admin_dashboard'
                      ? (isPink ? 'bg-[#e11d48] text-white shadow-xs' : 'bg-[#2563eb] text-white shadow-xs')
                      : (isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2a2a2a] text-[#aaa]' : 'hover:bg-[#ebeae7] text-[#787774]')
                  }`}
                >
                  <BarChart3 size={16} />
                  {globalOverdueCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {globalOverdueCount > 9 ? '9+' : globalOverdueCount}
                    </span>
                  )}
                </button>
              )}

              <div className={`w-6 h-[1px] ${isPink ? 'bg-[#fda4af]' : darkMode ? 'bg-[#2f2f2f]' : 'bg-[#e3e2e0]'}`} />

              {/* Personal Project icon (if exists and user logged in) */}
              {currentUser && personalProject && (
                <button
                  onClick={() => onSelectProject(personalProject.id)}
                  title={`${personalProject.title} (Task cá nhân)`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all relative ${
                    activeSection === 'project' && activeProjectId === personalProject.id
                      ? (isPink ? 'bg-white shadow-xs ring-1 ring-[#fda4af] font-bold' : darkMode ? 'bg-[#2f2f2f] ring-1 ring-white/20' : 'bg-white shadow-xs ring-1 ring-black/10 font-bold')
                      : (isPink ? 'hover:bg-[#fff0f3]' : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#ebeae7]')
                  }`}
                >
                  <span className="text-sm shrink-0">{personalProject.icon || '👤'}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500" />
                </button>
              )}

              {/* Other Project icons list */}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[38vh] no-scrollbar">
                {nonPersonalProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => onSelectProject(proj.id)}
                    title={proj.title}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                      activeSection === 'project' && activeProjectId === proj.id 
                        ? (isPink ? 'bg-white shadow-xs ring-1 ring-[#fda4af] font-bold' : darkMode ? 'bg-[#2f2f2f] ring-1 ring-white/20' : 'bg-white shadow-xs ring-1 ring-black/10 font-bold') 
                        : (isPink ? 'hover:bg-[#fff0f3]' : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#ebeae7]')
                    }`}
                  >
                    {proj.icon || '📄'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => onOpenTrashArchive('archive')}
                title="Kho lưu trữ & Thùng rác"
                className={`p-2 rounded-lg transition-colors ${
                  isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
                }`}
              >
                <Archive size={17} />
              </button>

              <button
                onClick={() => {
                  onToggleCollapse();
                  setShowSettingsMenu(true);
                }}
                title="Cài đặt & Dữ liệu"
                className={`p-2 rounded-lg transition-colors ${
                  isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
                }`}
              >
                <Settings size={17} />
              </button>

              <button
                onClick={onOpenAuthModal}
                title={currentUser ? `Đang đăng nhập: ${currentUser.name} (${currentUser.email})` : 'Đăng nhập bằng Email'}
                className="p-1 rounded-full hover:ring-2 hover:ring-rose-500 transition-all"
              >
                {currentUser ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center ${isPink ? 'bg-[#e11d48]' : 'bg-[#2383e2]'}`}>
                    <LogIn size={13} />
                  </div>
                )}
              </button>

              {/* Nút mở rộng thanh bên ở góc dưới cùng */}
              <button
                onClick={onToggleCollapse}
                title={t('expandSidebar', 'Mở rộng thanh bên')}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
                }`}
              >
                <PanelLeft size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          /* ================= EXPANDED FULL SIDEBAR ================= */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="w-64 h-full flex flex-col justify-between"
          >
            {/* Top Workspace Header & Branding */}
            <div className={`p-3 pt-3.5 pb-3 border-b select-none ${dividerClass} ${
              isPink 
                ? 'bg-gradient-to-b from-[#fff5f6] to-transparent' 
                : darkMode 
                  ? 'bg-gradient-to-b from-white/[0.03] to-transparent' 
                  : 'bg-gradient-to-b from-white to-transparent'
            }`}>
              <div className="flex items-center gap-2.5 w-full">
                {/* Growth Emblem - Sized to match the entire right-side text height */}
                <div className="relative group shrink-0">
                  {/* Subtle ambient glow behind growth icon */}
                  <div className={`absolute -inset-1 rounded-2xl blur-md opacity-45 group-hover:opacity-85 transition-opacity pointer-events-none ${
                    isPink 
                      ? 'bg-rose-500' 
                      : darkMode ? 'bg-emerald-500' : 'bg-emerald-600'
                  }`} />
                  
                  <div className={`relative w-[70px] h-[70px] rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 ${
                    isPink
                      ? 'bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-500 text-white shadow-rose-500/25 ring-1 ring-white/30'
                      : darkMode
                        ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-emerald-500/25 ring-1 ring-white/15'
                        : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-emerald-600/25 ring-1 ring-emerald-700/20'
                  }`} title="Growth Department Workspace">
                    <TrendingUp size={35} className="stroke-[2.5]" />
                  </div>
                </div>

                {/* 3-line Text Block - Fills entire width of sidebar next to logo */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-[70px] py-0.5">
                  {/* Line 1: GROWTH - All Caps with Vibrant Gradient, Ambient Glow & Slanted Arrow Alignment */}
                  <div>
                    <span className={`inline-block italic -skew-x-6 font-black text-[24.5px] tracking-[0.03em] leading-none uppercase select-none transition-all transform origin-bottom-left ${
                      isPink
                        ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(244,63,94,0.25)]'
                        : darkMode
                          ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(52,211,153,0.35)]'
                          : 'bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                    }`}>
                      GROWTH
                    </span>
                  </div>

                  {/* Line 2: Department - Scaled to match horizontal length of GROWTH */}
                  <span className={`text-[19.5px] font-black tracking-[0.08em] leading-none select-none ${
                    isPink ? 'text-[#881337]' : darkMode ? 'text-zinc-100' : 'text-[#18181b]'
                  }`}>
                    Department
                  </span>

                  {/* Line 3: Workspace & Role Badge */}
                  <div className="flex items-center gap-2 leading-none mt-0.5">
                    <span className={`text-[12px] font-bold tracking-tight ${
                      isPink ? 'text-[#be123c]' : darkMode ? 'text-zinc-400' : 'text-[#5a5855]'
                    }`}>
                      Workspace
                    </span>

                    {currentUser?.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Admin</span>
                      </span>
                    ) : currentUser ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Member</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                        <span>Khách</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Navigation Section */}
            <div className="p-2.5 pb-1">

              {/* SECTION: MY TASKS */}
              <div className="mt-2.5">
                <button
                  onClick={onSelectMyTasks}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeSection === 'my_tasks'
                      ? (isPink ? 'bg-[#e11d48] text-white shadow-sm' : 'bg-[#2383e2] text-white shadow-xs')
                      : (isPink ? 'hover:bg-[#fff0f3]/80 text-[#4c0519]' : darkMode ? 'hover:bg-[#2c2c2c] text-[#ddd]' : 'hover:bg-[#ebeae7] text-[#37352f]')
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare size={16} className={activeSection === 'my_tasks' ? 'text-white' : (isPink ? 'text-[#e11d48]' : 'text-[#2383e2]')} />
                    <span>{t('myTasks', 'Công việc của tôi')}</span>
                  </div>
                  {myPendingTasksCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeSection === 'my_tasks'
                        ? 'bg-white text-rose-700'
                        : (isPink ? 'bg-[#ffe4e6] text-[#9f1239]' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300')
                    }`}>
                      {myPendingTasksCount}
                    </span>
                  )}
                </button>
              </div>

              {/* SECTION: ADMIN DASHBOARD */}
              {onSelectAdminDashboard && (
                <div className="mt-1">
                  <button
                    onClick={onSelectAdminDashboard}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeSection === 'admin_dashboard'
                        ? (isPink ? 'bg-[#e11d48] text-white shadow-sm' : 'bg-[#2563eb] text-white shadow-xs')
                        : (isPink ? 'hover:bg-[#fff0f3]/80 text-[#4c0519]' : darkMode ? 'hover:bg-[#2c2c2c] text-[#ddd]' : 'hover:bg-[#ebeae7] text-[#37352f]')
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 size={16} className={activeSection === 'admin_dashboard' ? 'text-white' : (isPink ? 'text-[#e11d48]' : 'text-[#2563eb]')} />
                      <span>{t('adminDashboard', 'Dashboard Quản trị')}</span>
                    </div>
                    {globalOverdueCount > 0 ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                        activeSection === 'admin_dashboard'
                          ? 'bg-white text-rose-700'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {globalOverdueCount} {t('overdueBadge', 'trễ')}
                      </span>
                    ) : (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                        activeSection === 'admin_dashboard'
                          ? 'bg-white/20 text-white'
                          : (darkMode ? 'bg-white/5 text-[#a1a1aa]' : 'bg-black/5 text-[#71717a]')
                      }`}>
                        {t('admin', 'Admin')}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Quick Utilities */}
              <div className="mt-1 space-y-0.5">
                <NotificationCenter
                  notifications={notifications}
                  currentUser={currentUser}
                  onOpenTask={onOpenTask}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onClearNotification={onClearNotification}
                  triggerVariant="sidebar_row"
                  align="left"
                  darkMode={darkMode}
                />

                <button
                  onClick={onOpenSearch}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                    isPink ? 'hover:bg-[#fff0f3]/80 text-[#4c0519]' : darkMode ? 'hover:bg-[#2c2c2c] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search size={14} />
                    <span>{t('quickSearch', 'Tìm kiếm nhanh')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    isPink 
                      ? 'bg-[#fff0f3] border-[#fecdd3] text-[#881337]' 
                      : darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-[#888]' : 'bg-[#efedea] border-[#e0deda] text-[#888]'
                  }`}>
                    Ctrl+K
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Page Hierarchy */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
              
              {/* ================= 1. PERSONAL BOARD (CÁ NHÂN) ================= */}
              {currentUser && personalProject && (
                <div className={`rounded-xl border p-1 transition-all ${
                  isPink 
                    ? 'bg-[#ffe4e6]/30 border-[#fecdd3]' 
                    : darkMode 
                    ? 'bg-gradient-to-r from-blue-950/20 to-transparent border-blue-500/20 shadow-[inset_0_1px_0_0_rgba(59,130,246,0.1)]' 
                    : 'bg-blue-50/40 border-blue-100'
                }`}>
                  <div
                    className={`group/personal flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                      isPink ? 'hover:bg-[#fff0f3]/80' : darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-blue-50/80'
                    }`}
                    onClick={() => toggleTeam('personal')}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`${textMuted} inline-flex transition-transform duration-200 transform ${collapsedTeams.personal ? '' : 'rotate-90'}`}>
                        <ChevronRight size={13} />
                      </span>
                      <div className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                        <UserIcon size={12} className={isPink ? 'text-[#be123c]' : 'text-[#2383e2]'} />
                      </div>
                      <span className={`font-bold text-[11px] tracking-wide uppercase truncate ${
                        isPink ? 'text-[#9f1239]' : darkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        Cá nhân
                      </span>
                    </div>

                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      isPink 
                        ? 'bg-[#ffe4e6] text-[#9f1239]' 
                        : darkMode ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(personalProject.tasks || []).filter(t => !t.isDeleted).length}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {!collapsedTeams.personal && (
                      <motion.div
                        key="personal-board-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="space-y-0.5 pt-1 overflow-hidden"
                      >
                        <div
                          onClick={() => onSelectProject(personalProject.id)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            activeSection === 'project' && activeProjectId === personalProject.id
                              ? itemActive
                              : itemHover
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm shrink-0">{personalProject.icon || '👤'}</span>
                            <span className="truncate font-medium">{personalProject.title}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badgeClass}`}>
                              {(personalProject.tasks || []).filter(t => !t.isDeleted).length}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ================= 2. FAVORITES ================= */}
              {favoriteProjects.length > 0 && (
                <div>
                  <div className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${sectionHeaderColor}`}>
                    <span>Mục yêu thích</span>
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {favoriteProjects.map((proj) => {
                      const isActive = activeSection === 'project' && activeProjectId === proj.id;
                      const isHovered = hoveredPageId === proj.id;

                      return (
                        <div
                          key={proj.id}
                          onMouseEnter={() => setHoveredPageId(proj.id)}
                          onMouseLeave={() => setHoveredPageId(null)}
                          onClick={() => onSelectProject(proj.id)}
                          className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                            isActive ? itemActive : itemHover
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm shrink-0">{proj.icon || '📄'}</span>
                            <span className="truncate font-medium">{proj.title}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isHovered && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(proj.id);
                                }}
                                className="p-1 hover:text-amber-500 transition-colors"
                                title="Bỏ yêu thích"
                              >
                                <Star size={12} className="fill-amber-500 text-amber-500" />
                              </button>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badgeClass}`}>
                              {proj.tasks.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= 3. FIXED TEAMS ================= */}
              <div className="space-y-3 pt-1">
                {FIXED_TEAMS.map((team) => {
                  const teamProjects = regularProjects.filter((p) => getProjectTeamId(p) === team.id);
                  const isTeamCollapsed = collapsedTeams[team.id];

                  // Highlight styling per team
                  const teamHighlightStyle = team.id === 'performance_marketing'
                    ? (darkMode ? 'bg-gradient-to-r from-amber-950/20 to-transparent border-amber-500/20 text-amber-400' : 'bg-amber-50/40 border-amber-200/60 text-amber-700')
                    : team.id === 'book_growth'
                    ? (darkMode ? 'bg-gradient-to-r from-purple-950/20 to-transparent border-purple-500/20 text-purple-400' : 'bg-purple-50/40 border-purple-200/60 text-purple-700')
                    : (darkMode ? 'bg-gradient-to-r from-emerald-950/20 to-transparent border-emerald-500/20 text-emerald-400' : 'bg-emerald-50/40 border-emerald-200/60 text-emerald-700');

                  const teamBadgeStyle = team.id === 'performance_marketing'
                    ? (darkMode ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800')
                    : team.id === 'book_growth'
                    ? (darkMode ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800')
                    : (darkMode ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800');

                  return (
                    <div key={team.id} className={`rounded-xl border p-1 transition-all ${
                      isPink ? 'bg-[#fff5f6]/40 border-[#fecdd3]' : teamHighlightStyle
                    }`}>
                      {/* Team Section Header with smooth rotating arrow */}
                      <div
                        className={`group/team flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                          isPink ? 'hover:bg-[#fff0f3]/80' : darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/60'
                        }`}
                        onClick={() => toggleTeam(team.id)}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className={`${textMuted} inline-flex transition-transform duration-200 transform ${isTeamCollapsed ? '' : 'rotate-90'}`}>
                            <ChevronRight size={13} />
                          </span>
                          <span className="text-sm shrink-0">{team.icon}</span>
                          <span className="font-bold text-[11px] tracking-wide uppercase truncate">
                            {team.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold border ${
                            isPink ? 'bg-[#ffe4e6] text-[#9f1239] border-[#fecdd3]' : teamBadgeStyle
                          }`}>
                            {teamProjects.length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddProject(team.id);
                            }}
                            className={`p-1 rounded opacity-70 group-hover/team:opacity-100 transition-all ${
                              isPink
                                ? 'hover:bg-[#fff0f3] text-[#4c0519]'
                                : darkMode ? 'hover:bg-white/[0.08] text-white' : 'hover:bg-black/5 text-[#37352f]'
                            }`}
                            title={`Tạo bảng quản lý mới cho team ${team.name}`}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      {/* Team Projects List with smooth accordion */}
                      <AnimatePresence initial={false}>
                        {!isTeamCollapsed && (
                          <motion.div
                            key={`team-content-${team.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                            className="space-y-0.5 pl-2 overflow-hidden"
                          >
                            {teamProjects.length > 0 ? (
                              teamProjects.map((proj) => {
                                const isActive = activeSection === 'project' && activeProjectId === proj.id;
                                const isHovered = hoveredPageId === proj.id;

                                return (
                                  <div
                                    key={proj.id}
                                    onMouseEnter={() => setHoveredPageId(proj.id)}
                                    onMouseLeave={() => setHoveredPageId(null)}
                                    onClick={() => onSelectProject(proj.id)}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                                      isActive ? itemActive : itemHover
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <span className="text-sm shrink-0">{proj.icon || '📄'}</span>
                                      <span className="truncate font-medium">{proj.title}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {isHovered && (
                                        <>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onToggleFavorite(proj.id);
                                            }}
                                            className={`p-1 transition-colors ${isPink ? 'text-[#881337] hover:text-amber-500' : 'text-[#9b9a97] hover:text-amber-500'}`}
                                            title="Thêm vào yêu thích"
                                          >
                                            <Star size={12} />
                                          </button>
                                          {activeProjects.length > 1 && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setProjectToDelete(proj);
                                              }}
                                              className={`p-1 transition-colors ${isPink ? 'text-[#881337] hover:text-rose-600' : 'text-[#9b9a97] hover:text-red-500'}`}
                                              title="Xóa bảng"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          )}
                                        </>
                                      )}
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badgeClass}`}>
                                        {(proj.tasks || []).filter(t => !t.isDeleted).length}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className={`py-1 px-2 text-[11px] italic ${textMuted}`}>
                                Chưa có bảng nào
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer: Settings & Data + Logged in user info */}
            <div className={`p-2.5 border-t space-y-1.5 ${dividerClass}`}>
              <div>
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    showSettingsMenu
                      ? (isPink ? 'bg-white text-[#9f1239] shadow-xs' : darkMode ? 'bg-[#2c2c2c] text-white' : 'bg-[#e9e8e4] text-[#37352f]')
                      : (isPink ? 'hover:bg-[#fff0f3]/80 text-[#4c0519]' : darkMode ? 'hover:bg-[#282828] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]')
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings size={14} />
                    <span>Cài đặt & Dữ liệu</span>
                  </div>
                  <span className={`${textMuted} inline-flex transition-transform duration-200 transform ${showSettingsMenu ? 'rotate-90' : ''}`}>
                    <ChevronRight size={13} />
                  </span>
                </button>

                <AnimatePresence>
                  {showSettingsMenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.98 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className={`p-2 rounded-xl my-1.5 text-xs space-y-1 border shadow-2xl overflow-hidden ${
                        isPink 
                          ? 'bg-[#fff5f6] border-[#fda4af]' 
                          : darkMode ? 'bg-[#141519] border-white/10 shadow-black/80' : 'bg-white border-[#e3e2e0]'
                      }`}
                    >
                      {/* Theme Selection */}
                      <div className="pt-1 pb-1">
                        <div className={`text-[10px] uppercase font-bold px-2 py-1 flex items-center gap-1.5 ${textMuted}`}>
                          <Sparkles size={11} className={isPink ? 'text-[#e11d48]' : 'text-[#FFA9B2]'} />
                          <span>Giao diện màu sắc</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 px-1 pt-1 pb-1">
                          <button
                            onClick={() => {
                              if (onSetTheme) onSetTheme('light');
                              else if (darkMode) onToggleDarkMode();
                            }}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                              appTheme === 'light'
                                ? 'bg-white border-[#2383e2] text-[#2383e2] shadow-xs'
                                : darkMode ? 'bg-white/[0.04] border-white/[0.06] text-[#a1a1aa] hover:text-white hover:bg-white/[0.08]' : 'bg-[#f4f3f0] border-transparent text-[#666] hover:bg-[#eae8e4]'
                            }`}
                            title="Giao diện Sáng"
                          >
                            <Sun size={14} className="mb-0.5 text-amber-500" />
                            <span>Sáng</span>
                          </button>

                          <button
                            onClick={() => {
                              if (onSetTheme) onSetTheme('dark');
                              else if (!darkMode) onToggleDarkMode();
                            }}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                              appTheme === 'dark'
                                ? 'bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-xs'
                                : darkMode ? 'bg-white/[0.04] border-white/[0.06] text-[#a1a1aa] hover:text-white hover:bg-white/[0.08]' : 'bg-[#f4f3f0] border-transparent text-[#666] hover:bg-[#eae8e4]'
                            }`}
                            title="Giao diện Tối Deep Charcoal"
                          >
                            <Moon size={14} className="mb-0.5 text-blue-400" />
                            <span>Tối OLED</span>
                          </button>

                          <button
                            onClick={() => {
                              if (onSetTheme) onSetTheme('qanda_pink');
                            }}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-bold transition-all relative overflow-hidden ${
                              appTheme === 'qanda_pink'
                                ? 'bg-white border-[#e11d48] text-[#9f1239] shadow-xs ring-1 ring-[#e11d48]'
                                : darkMode ? 'bg-white/[0.04] border-white/[0.06] text-[#FFA9B2] hover:bg-rose-500/10' : 'bg-[#fff5f6] border-transparent text-[#d63d57] hover:bg-[#ffe6e9]'
                            }`}
                            title="Giao diện đặc trưng Aria Pink"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] border border-[#e11d48] shadow-xs mb-0.5" />
                            <span className="truncate">Aria</span>
                          </button>
                        </div>
                      </div>

                      <div className={`my-1 border-t ${isPink ? 'border-[#fda4af]' : darkMode ? 'border-white/[0.06]' : 'border-[#eee]'}`} />

                      {/* Language Selection */}
                      <div className="pt-1 pb-1">
                        <div className={`text-[10px] uppercase font-bold px-2 py-1 flex items-center gap-1.5 ${textMuted}`}>
                          <Globe size={11} className={isPink ? 'text-[#e11d48]' : 'text-blue-500'} />
                          <span>{t('languageSelection', 'Ngôn ngữ giao diện')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 px-1 pt-1 pb-1">
                          <button
                            type="button"
                            onClick={() => setLanguage('vi')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                              language === 'vi'
                                ? (isPink ? 'bg-white border-[#e11d48] text-[#9f1239] shadow-xs ring-1 ring-[#e11d48]' : darkMode ? 'bg-white/10 border-white/20 text-white shadow-xs' : 'bg-white border-[#2383e2] text-[#2383e2] shadow-xs')
                                : (darkMode ? 'bg-white/[0.04] border-white/[0.06] text-[#a1a1aa] hover:text-white' : 'bg-[#f4f3f0] border-transparent text-[#666] hover:bg-[#eae8e4]')
                            }`}
                            title="Tiếng Việt"
                          >
                            <span>🇻🇳</span>
                            <span>Tiếng Việt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                              language === 'en'
                                ? (isPink ? 'bg-white border-[#e11d48] text-[#9f1239] shadow-xs ring-1 ring-[#e11d48]' : darkMode ? 'bg-white/10 border-white/20 text-white shadow-xs' : 'bg-white border-[#2383e2] text-[#2383e2] shadow-xs')
                                : (darkMode ? 'bg-white/[0.04] border-white/[0.06] text-[#a1a1aa] hover:text-white' : 'bg-[#f4f3f0] border-transparent text-[#666] hover:bg-[#eae8e4]')
                            }`}
                            title="English"
                          >
                            <span>🇬🇧</span>
                            <span>English</span>
                          </button>
                        </div>
                      </div>

                      <div className={`my-1 border-t ${isPink ? 'border-[#fda4af]' : darkMode ? 'border-white/[0.06]' : 'border-[#eee]'}`} />

                      <button
                        onClick={onExportData}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                          isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-white/[0.06] text-[#e4e4e7]' : 'hover:bg-[#f1f1ef]'
                        }`}
                      >
                        <Download size={13} />
                        <span>{t('backupJson', 'Sao lưu JSON')}</span>
                      </button>

                      <button
                        onClick={onImportData}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                          isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-white/[0.06] text-[#e4e4e7]' : 'hover:bg-[#f1f1ef]'
                        }`}
                      >
                        <Upload size={13} />
                        <span>{t('restoreJson', 'Khôi phục JSON')}</span>
                      </button>

                      <div className={`my-1 border-t ${isPink ? 'border-[#fda4af]' : darkMode ? 'border-white/[0.06]' : 'border-[#eee]'}`} />

                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onOpenTrashArchive('archive');
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                          isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-white/[0.06] text-[#e4e4e7]' : 'hover:bg-[#f1f1ef]'
                        }`}
                      >
                        <Archive size={13} className={isPink ? 'text-rose-600' : 'text-amber-500'} />
                        <span>{t('archiveAndTrash', 'Kho lưu trữ & Thùng rác')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Row: User Account + Collapse Sidebar Button */}
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  onClick={onOpenAuthModal}
                  className={`flex-1 min-w-0 flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isPink ? 'hover:bg-[#fff0f3]/80' : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#ebeae7]'
                  }`}
                  title={currentUser ? "Nhấn để quản lý hoặc đăng xuất tài khoản" : "Nhấn để đăng nhập"}
                >
                  {currentUser ? (
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-rose-400"
                      />
                      <div className="truncate text-left min-w-0">
                        <div className={`text-xs font-bold truncate leading-none ${textPrimary}`}>{currentUser.name}</div>
                        <div className={`text-[10px] truncate mt-0.5 ${textMuted}`}>{currentUser.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 text-xs font-semibold ${isPink ? 'text-[#be123c]' : 'text-[#2383e2]'}`}>
                      <LogIn size={14} />
                      <span>Đăng nhập Email</span>
                    </div>
                  )}

                  <div className={`text-[10px] font-semibold shrink-0 ml-1 ${textMuted} hover:text-red-500`}>
                    {currentUser ? 'Tài khoản' : ''}
                  </div>
                </div>

                {/* Nút thu gọn thanh bên cạnh phần tài khoản */}
                <button
                  onClick={onToggleCollapse}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isPink 
                      ? 'text-[#881337]/70 hover:text-[#4c0519] hover:bg-[#fff0f3]' 
                      : darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5'
                  }`}
                  title="Thu gọn thanh bên"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Project Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        title={`Xóa bảng "${projectToDelete?.title}"?`}
        description={`Tất cả các công việc trong bảng này (${(projectToDelete?.tasks || []).filter(t => !t.isDeleted).length} công việc) sẽ được chuyển vào Thùng rác.`}
        confirmText="Xóa bảng & Chuyển task vào Thùng rác"
        cancelText="Hủy bỏ"
        darkMode={darkMode}
      />
    </motion.aside>
  );
};
