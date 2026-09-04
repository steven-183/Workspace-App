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
  Archive
} from 'lucide-react';

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

  // Theme styling helpers (ensuring deeper pink, high contrast text and aesthetic design)
  const isPink = appTheme === 'qanda_pink';

  // Sidebar container styles
  const sidebarContainerClass = isPink
    ? 'bg-[#ffd2d8] border-[#fda4af] text-[#4c0519]'
    : darkMode
      ? 'bg-[#202020] border-[#2f2f2f] text-[#d4d4d4]'
      : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#37352f]';

  // Text color styles
  const textPrimary = isPink
    ? 'text-[#4c0519]'
    : darkMode ? 'text-white' : 'text-[#37352f]';

  const textMuted = isPink
    ? 'text-[#881337]'
    : darkMode ? 'text-[#9b9a97]' : 'text-[#787774]';

  const sectionHeaderColor = isPink
    ? 'text-[#9f1239]'
    : darkMode ? 'text-[#a0a0a0]' : 'text-[#787774]';

  // Hover & Active items
  const itemHover = isPink
    ? 'hover:bg-[#fff0f3]/85 text-[#4c0519]'
    : darkMode ? 'hover:bg-[#262626] text-[#b4b4b4]' : 'hover:bg-[#efedea] text-[#5a5a58]';

  const itemActive = isPink
    ? 'bg-white text-[#9f1239] font-bold shadow-xs ring-1 ring-[#fda4af]'
    : darkMode ? 'bg-[#2c2c2c] text-white font-medium shadow-xs' : 'bg-[#e9e8e4] text-[#37352f] font-semibold';

  // Badges & Counters
  const badgeClass = isPink
    ? 'bg-[#ffe4e6] text-[#9f1239] border border-[#fecdd3]'
    : darkMode ? 'bg-[#2a2a2a] text-[#888]' : 'bg-[#e2e1de] text-[#787774]';

  // Border dividers
  const dividerClass = isPink
    ? 'border-[#fda4af]'
    : darkMode ? 'border-[#2f2f2f]' : 'border-[#e8e7e4]';

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
            <div className="flex flex-col items-center gap-3 w-full">
              <button
                onClick={onToggleCollapse}
                title="Mở rộng thanh bên"
                className={`p-2 rounded-lg transition-colors ${
                  isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
                }`}
              >
                <PanelLeft size={18} />
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
            {/* Top Workspace Header & Profile */}
            <div className="p-3 border-b border-transparent">
              <div className="flex items-center justify-between p-1.5 rounded-lg">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src="/qanda_logo.jpg"
                    alt="QANDA Logo"
                    className="w-7 h-7 rounded-lg object-cover shadow-xs border border-orange-200 dark:border-orange-900/50 shrink-0"
                  />
                  <div className="text-left truncate">
                    <div className={`text-sm font-bold truncate leading-tight flex items-center gap-1 ${textPrimary}`}>
                      <span>QANDA Workspace</span>
                    </div>
                    <div className={`text-[11px] truncate font-medium ${textMuted}`}>
                      {currentUser ? currentUser.name : 'Chưa đăng nhập'}
                    </div>
                  </div>
                </div>

                {/* Collapse button */}
                <button
                  onClick={onToggleCollapse}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isPink 
                      ? 'text-[#881337] hover:text-[#4c0519] hover:bg-[#fff0f3]'
                      : darkMode ? 'text-[#9b9a97] hover:text-white hover:bg-[#2c2c2c]' : 'text-[#9b9a97] hover:text-[#37352f] hover:bg-[#ebeae7]'
                  }`}
                  title="Thu gọn thanh bên"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

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
                    <span>Công việc của tôi</span>
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
                    <span>Tìm kiếm nhanh</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    isPink 
                      ? 'bg-[#fff0f3] border-[#fecdd3] text-[#881337]' 
                      : darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-[#888]' : 'bg-[#efedea] border-[#e0deda] text-[#888]'
                  }`}>
                    Ctrl+K
                  </span>
                </button>

                <button
                  onClick={() => onOpenTrashArchive('archive')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                    isPink ? 'hover:bg-[#fff0f3]/80 text-[#4c0519]' : darkMode ? 'hover:bg-[#2c2c2c] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Archive size={14} className={isPink ? 'text-rose-600' : 'text-amber-500'} />
                    <span>Kho lưu trữ & Thùng rác</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Scrollable Page Hierarchy */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
              
              {/* ================= 1. PERSONAL BOARD (CÁ NHÂN) ================= */}
              {currentUser && personalProject && (
                <div className="space-y-1">
                  <div
                    className={`group/personal flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                      isPink ? 'hover:bg-[#fff0f3]/80' : darkMode ? 'hover:bg-[#282828]' : 'hover:bg-[#ebeae7]'
                    }`}
                    onClick={() => toggleTeam('personal')}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className={`${textMuted} inline-flex transition-transform duration-200 transform ${collapsedTeams.personal ? '' : 'rotate-90'}`}>
                        <ChevronRight size={13} />
                      </span>
                      <UserIcon size={13} className={isPink ? 'text-[#be123c]' : 'text-[#2383e2]'} />
                      <span className={`font-bold text-[11px] tracking-wide uppercase truncate ${sectionHeaderColor}`}>
                        Cá nhân
                      </span>
                    </div>

                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badgeClass}`}>
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
                        className="space-y-0.5 pl-2 overflow-hidden"
                      >
                        <div
                          onClick={() => onSelectProject(personalProject.id)}
                          className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
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
              <div className="space-y-4 pt-1">
                {FIXED_TEAMS.map((team) => {
                  const teamProjects = regularProjects.filter((p) => getProjectTeamId(p) === team.id);
                  const isTeamCollapsed = collapsedTeams[team.id];

                  return (
                    <div key={team.id} className="space-y-1">
                      {/* Team Section Header with smooth rotating arrow */}
                      <div
                        className={`group/team flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                          isPink ? 'hover:bg-[#fff0f3]/80' : darkMode ? 'hover:bg-[#282828]' : 'hover:bg-[#ebeae7]'
                        }`}
                        onClick={() => toggleTeam(team.id)}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className={`${textMuted} inline-flex transition-transform duration-200 transform ${isTeamCollapsed ? '' : 'rotate-90'}`}>
                            <ChevronRight size={13} />
                          </span>
                          <span className="text-sm shrink-0">{team.icon}</span>
                          <span className={`font-bold text-[11px] tracking-wide uppercase truncate ${sectionHeaderColor}`}>
                            {team.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badgeClass}`}>
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
                                : darkMode ? 'hover:bg-[#383838] text-white' : 'hover:bg-[#dbdad7] text-[#37352f]'
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
                      className={`p-2 rounded-xl my-1.5 text-xs space-y-1 border shadow-lg overflow-hidden ${
                        isPink 
                          ? 'bg-[#fff5f6] border-[#fda4af]' 
                          : darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
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
                                : darkMode ? 'bg-[#1e1e1e] border-[#383838] text-[#888] hover:text-white' : 'bg-[#f4f3f0] border-transparent text-[#666] hover:bg-[#eae8e4]'
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
                                ? 'bg-[#2a2a2a] border-[#2383e2] text-white shadow-xs'
                                : darkMode ? 'bg-[#1e1e1e] border-[#383838] text-[#888] hover:text-white' : 'bg-[#f4f3f0] border-transparent text-[#666] hover:bg-[#eae8e4]'
                            }`}
                            title="Giao diện Tối"
                          >
                            <Moon size={14} className="mb-0.5 text-blue-400" />
                            <span>Tối</span>
                          </button>

                          <button
                            onClick={() => {
                              if (onSetTheme) onSetTheme('qanda_pink');
                            }}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-bold transition-all relative overflow-hidden ${
                              appTheme === 'qanda_pink'
                                ? 'bg-white border-[#e11d48] text-[#9f1239] shadow-xs ring-1 ring-[#e11d48]'
                                : darkMode ? 'bg-[#1e1e1e] border-[#383838] text-[#FFA9B2] hover:bg-[#2e181c]' : 'bg-[#fff5f6] border-transparent text-[#d63d57] hover:bg-[#ffe6e9]'
                            }`}
                            title="Giao diện đặc trưng Aria Pink"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] border border-[#e11d48] shadow-xs mb-0.5" />
                            <span className="truncate">Aria</span>
                          </button>
                        </div>
                      </div>

                      <div className={`my-1 border-t ${isPink ? 'border-[#fda4af]' : darkMode ? 'border-[#383838]' : 'border-[#eee]'}`} />

                      <button
                        onClick={onExportData}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                          isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                        }`}
                      >
                        <Download size={13} />
                        <span>Sao lưu JSON</span>
                      </button>

                      <button
                        onClick={onImportData}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                          isPink ? 'hover:bg-[#fff0f3] text-[#4c0519]' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                        }`}
                      >
                        <Upload size={13} />
                        <span>Khôi phục JSON</span>
                      </button>

                      <div className={`my-1 border-t ${isPink ? 'border-[#fda4af]' : darkMode ? 'border-[#383838]' : 'border-[#eee]'}`} />

                      <button
                        onClick={onResetData}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <RotateCcw size={13} />
                        <span>Đặt lại dữ liệu mẫu</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User login / status button */}
              <div
                onClick={onOpenAuthModal}
                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isPink ? 'hover:bg-[#fff0f3]/80' : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#ebeae7]'
                }`}
                title={currentUser ? "Nhấn để quản lý hoặc đăng xuất tài khoản" : "Nhấn để đăng nhập"}
              >
                {currentUser ? (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-rose-400"
                    />
                    <div className="truncate text-left">
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

                <div className={`text-[10px] font-semibold shrink-0 ${textMuted} hover:text-red-500`}>
                  {currentUser ? 'Tài khoản' : ''}
                </div>
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
