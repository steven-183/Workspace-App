import React, { useState } from 'react';
import { MainSectionType, ProjectPage, TaskNotification, User, TeamId, FIXED_TEAMS } from '../types';
import { NotificationCenter } from './NotificationCenter';
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
  CheckCircle2, 
  Calendar, 
  Layers, 
  Moon, 
  Sun,
  UserCheck,
  CheckSquare,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  Edit2,
  Check,
  FolderPlus,
  Bell,
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
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Record<TeamId, boolean>>({
    performance_marketing: false,
    book_growth: false,
    product: false,
  });

  const [workspaceName, setWorkspaceName] = useState<string>(() => {
    return localStorage.getItem('notion_workspace_name') || 'Notion Workspace';
  });
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false);
  const [tempWorkspaceName, setTempWorkspaceName] = useState(workspaceName);

  const handleSaveWorkspaceName = (name: string) => {
    const trimmed = name.trim() || 'Notion Workspace';
    setWorkspaceName(trimmed);
    localStorage.setItem('notion_workspace_name', trimmed);
    setIsEditingWorkspaceName(false);
  };

  const toggleTeam = (teamId: TeamId) => {
    setCollapsedTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const getProjectTeamId = (p: ProjectPage): TeamId => {
    if (p.teamId) return p.teamId;
    const cat = (p.category || '').toLowerCase();
    const title = p.title.toLowerCase();
    if (
      cat.includes('marketing') ||
      cat.includes('ads') ||
      cat.includes('growth') ||
      title.includes('marketing') ||
      title.includes('ads') ||
      title.includes('cro') ||
      title.includes('acquisition')
    ) {
      return 'performance_marketing';
    }
    if (
      cat.includes('book') ||
      cat.includes('sách') ||
      title.includes('sách') ||
      title.includes('book') ||
      title.includes('độc giả') ||
      title.includes('bản quyền')
    ) {
      return 'book_growth';
    }
    return 'product';
  };

  const favoriteProjects = projects.filter((p) => p.isFavorite);
  const regularProjects = projects.filter((p) => !p.isFavorite);

  // Count uncompleted tasks assigned to the current user
  const myPendingTasksCount = currentUser
    ? projects.reduce((acc, p) => {
        const count = p.tasks.filter((t) => 
          t.status !== 'done' &&
          t.assignees?.some(
            (u) => u.id === currentUser.id || u.email?.toLowerCase() === currentUser.email?.toLowerCase()
          )
        ).length;
        return acc + count;
      }, 0)
    : 0;

  if (isCollapsed) {
    return (
      <div className={`w-12 h-screen border-r flex flex-col items-center py-3 justify-between shrink-0 transition-all z-20 ${
        darkMode ? 'bg-[#202020] border-[#2f2f2f] text-[#d4d4d4]' : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#37352f]'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            title="Mở rộng thanh bên"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
            }`}
          >
            <PanelLeft size={18} />
          </button>
          
          <button
            onClick={onOpenSearch}
            title="Tìm kiếm nhanh (Ctrl+K)"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
            }`}
          >
            <Search size={18} />
          </button>

          {/* Notification bell icon in collapsed sidebar */}
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
                ? 'bg-[#2383e2] text-white shadow-xs'
                : (darkMode ? 'hover:bg-[#2a2a2a] text-[#aaa]' : 'hover:bg-[#ebeae7] text-[#787774]')
            }`}
          >
            <CheckSquare size={16} />
            {myPendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                {myPendingTasksCount}
              </span>
            )}
          </button>

          <div className={`w-6 h-[1px] ${darkMode ? 'bg-[#2f2f2f]' : 'bg-[#e3e2e0]'}`} />

          {/* Project icons list */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[45vh] no-scrollbar">
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                title={proj.title}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                  activeSection === 'project' && activeProjectId === proj.id 
                    ? (darkMode ? 'bg-[#2f2f2f] ring-1 ring-white/20' : 'bg-white shadow-xs ring-1 ring-black/10 font-bold') 
                    : (darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#ebeae7]')
                }`}
              >
                {proj.icon || '📄'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* Archive & Trash in collapsed mode */}
          <button
            onClick={() => onOpenTrashArchive('archive')}
            title="Kho lưu trữ & Thùng rác"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
            }`}
          >
            <Archive size={17} />
          </button>

          {/* Settings in collapsed mode */}
          <button
            onClick={() => {
              onToggleCollapse();
              setShowSettingsMenu(true);
            }}
            title="Cài đặt & Dữ liệu"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
            }`}
          >
            <Settings size={17} />
          </button>

          {/* User profile / login icon */}
          <button
            onClick={onOpenAuthModal}
            title={currentUser ? `Đang đăng nhập: ${currentUser.name} (${currentUser.email})` : 'Đăng nhập bằng Email'}
            className="p-1 rounded-full hover:ring-2 hover:ring-[#2383e2] transition-all"
          >
            {currentUser ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#2383e2] text-white flex items-center justify-center">
                <LogIn size={13} />
              </div>
            )}
          </button>

          <button
            onClick={() => onAddProject()}
            title="Tạo bảng mới"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2f2f2f] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]'
            }`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className={`w-64 h-screen border-r flex flex-col justify-between shrink-0 select-none transition-colors z-20 ${
      darkMode ? 'bg-[#202020] border-[#2f2f2f] text-[#d4d4d4]' : 'bg-[#f7f6f3] border-[#e8e7e4] text-[#37352f]'
    }`}>
      {/* Top Workspace Header & User Profile */}
      <div className="p-3 border-b border-transparent">
        {/* Workspace Account Menu */}
        <div className="relative">
          {isEditingWorkspaceName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveWorkspaceName(tempWorkspaceName);
              }}
              className="flex items-center gap-1 p-1"
            >
              <input
                type="text"
                autoFocus
                value={tempWorkspaceName}
                onChange={(e) => setTempWorkspaceName(e.target.value)}
                onBlur={() => handleSaveWorkspaceName(tempWorkspaceName)}
                className={`w-full px-2 py-1 text-xs font-semibold rounded-md border outline-none ${
                  darkMode ? 'bg-[#2a2a2a] border-[#444] text-white' : 'bg-white border-[#2383e2] text-[#37352f]'
                }`}
                placeholder="Tên Workspace..."
              />
              <button
                type="submit"
                className="p-1 text-white bg-[#2383e2] rounded-md shrink-0"
                title="Lưu"
              >
                <Check size={13} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-[#2c2c2c]' : 'hover:bg-[#ebeae7]'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-6 h-6 rounded-md bg-[#2383e2] text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase shrink-0">
                  {workspaceName.charAt(0) || 'N'}
                </div>
                <div className="text-left truncate">
                  <div className="text-sm font-semibold truncate leading-tight flex items-center gap-1">
                    <span>{workspaceName}</span>
                  </div>
                  <div className="text-[11px] text-[#9b9a97] truncate">
                    {currentUser ? currentUser.name : 'Chưa đăng nhập'}
                  </div>
                </div>
              </div>
              <ChevronDown size={14} className="text-[#9b9a97] shrink-0" />
            </button>
          )}

          {/* Workspace Menu Dropdown */}
          {showWorkspaceMenu && !isEditingWorkspaceName && (
            <div className={`absolute top-full left-0 mt-1 w-60 rounded-xl shadow-xl border p-1.5 z-30 ${
              darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
            }`}>
              <div className="px-2 py-1 text-xs text-[#9b9a97]">Tài khoản hiện tại</div>
              {currentUser ? (
                <div className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs ${
                  darkMode ? 'bg-[#333333]' : 'bg-[#f1f1ef]'
                }`}>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <div className="font-bold truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-[#9b9a97] truncate">{currentUser.email}</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold text-[#2383e2] hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                >
                  <LogIn size={14} /> Đăng nhập bằng Email
                </button>
              )}

              <div className={`my-1 border-t ${darkMode ? 'border-[#383838]' : 'border-[#ededeb]'}`} />
              
              <button
                onClick={() => {
                  setShowWorkspaceMenu(false);
                  setTempWorkspaceName(workspaceName);
                  setIsEditingWorkspaceName(true);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#333333]' : 'hover:bg-[#f1f1ef]'
                }`}
              >
                <Edit2 size={14} /> Đổi tên Workspace
              </button>

              <button
                onClick={() => {
                  setShowWorkspaceMenu(false);
                  onOpenAuthModal();
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#333333]' : 'hover:bg-[#f1f1ef]'
                }`}
              >
                <UserIcon size={14} /> {currentUser ? 'Đổi tài khoản Email' : 'Đăng nhập'}
              </button>

              <button
                onClick={() => {
                  onAddProject();
                  setShowWorkspaceMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#333333]' : 'hover:bg-[#f1f1ef]'
                }`}
              >
                <Plus size={14} /> Thêm bảng công việc mới
              </button>
            </div>
          )}
        </div>

        {/* SECTION: MY TASKS (Requirement 3) */}
        <div className="mt-2.5">
          <button
            onClick={onSelectMyTasks}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'my_tasks'
                ? 'bg-[#2383e2] text-white shadow-xs'
                : (darkMode ? 'hover:bg-[#2c2c2c] text-[#ddd]' : 'hover:bg-[#ebeae7] text-[#37352f]')
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare size={16} className={activeSection === 'my_tasks' ? 'text-white' : 'text-[#2383e2]'} />
              <span>Công việc của tôi (My Tasks)</span>
            </div>
            {myPendingTasksCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSection === 'my_tasks'
                  ? 'bg-white text-[#2383e2]'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
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
              darkMode ? 'hover:bg-[#2c2c2c] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>Tìm kiếm nhanh</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a] text-[#888]' : 'bg-[#efedea] border-[#e0deda] text-[#888]'
            }`}>
              Ctrl+K
            </span>
          </button>

          <button
            onClick={() => onOpenTrashArchive('archive')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
              darkMode ? 'hover:bg-[#2c2c2c] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Archive size={14} className="text-amber-500" />
              <span>Kho lưu trữ & Thùng rác</span>
            </div>
          </button>
        </div>
      </div>

      {/* Pages Section */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
        {/* Favorites */}
        {favoriteProjects.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wider flex items-center justify-between">
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
                      isActive
                        ? (darkMode ? 'bg-[#2c2c2c] text-white font-medium' : 'bg-[#e9e8e4] text-[#37352f] font-semibold')
                        : (darkMode ? 'hover:bg-[#262626] text-[#b4b4b4]' : 'hover:bg-[#efedea] text-[#5a5a58]')
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-sm shrink-0">{proj.icon || '📄'}</span>
                      <span className="truncate">{proj.title}</span>
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
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        darkMode ? 'bg-[#333] text-[#888]' : 'bg-[#e2e1de] text-[#787774]'
                      }`}>
                        {proj.tasks.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 FIXED TEAM SECTIONS */}
        <div className="space-y-4 pt-1">
          {FIXED_TEAMS.map((team) => {
            const teamProjects = regularProjects.filter((p) => getProjectTeamId(p) === team.id);
            const isTeamCollapsed = collapsedTeams[team.id];

            return (
              <div key={team.id} className="space-y-1">
                {/* Team Section Header */}
                <div
                  className={`group/team flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                    darkMode ? 'hover:bg-[#282828]' : 'hover:bg-[#ebeae7]'
                  }`}
                  onClick={() => toggleTeam(team.id)}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[#9b9a97] transition-transform duration-200">
                      {isTeamCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </span>
                    <span className="text-sm shrink-0">{team.icon}</span>
                    <span className="font-bold text-[11px] tracking-wide uppercase truncate text-[#787774] dark:text-[#a0a0a0]">
                      {team.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      darkMode ? 'bg-[#2a2a2a] text-[#888]' : 'bg-[#e2e1de] text-[#787774]'
                    }`}>
                      {teamProjects.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddProject(team.id);
                      }}
                      className={`p-1 rounded opacity-70 group-hover/team:opacity-100 transition-all ${
                        darkMode ? 'hover:bg-[#383838] text-white' : 'hover:bg-[#dbdad7] text-[#37352f]'
                      }`}
                      title={`Tạo bảng quản lý mới cho team ${team.name}`}
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Team Projects List */}
                {!isTeamCollapsed && (
                  <div className="space-y-0.5 pl-2">
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
                              isActive
                                ? (darkMode ? 'bg-[#2c2c2c] text-white font-medium shadow-xs' : 'bg-[#e9e8e4] text-[#37352f] font-semibold')
                                : (darkMode ? 'hover:bg-[#262626] text-[#b4b4b4]' : 'hover:bg-[#efedea] text-[#5a5a58]')
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-sm shrink-0">{proj.icon || '📄'}</span>
                              <span className="truncate">{proj.title}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {isHovered && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleFavorite(proj.id);
                                    }}
                                    className="p-1 text-[#9b9a97] hover:text-amber-500 transition-colors"
                                    title="Thêm vào yêu thích"
                                  >
                                    <Star size={12} />
                                  </button>
                                  {projects.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Bạn có chắc chắn muốn xóa bảng "${proj.title}"?`)) {
                                          onDeleteProject(proj.id);
                                        }
                                      }}
                                      className="p-1 text-[#9b9a97] hover:text-red-500 transition-colors"
                                      title="Xóa bảng"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                darkMode ? 'bg-[#333] text-[#888]' : 'bg-[#e2e1de] text-[#787774]'
                              }`}>
                                {proj.tasks.length}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-1 px-2 text-[11px] text-[#9b9a97] italic">
                        Chưa có bảng nào
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer: Settings & Data + Logged in user info + Collapse */}
      <div className={`p-2.5 border-t space-y-1.5 ${darkMode ? 'border-[#2f2f2f]' : 'border-[#e8e7e4]'}`}>
        {/* Settings & Data Section (Requirement: Moved to bottom of sidebar) */}
        <div>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showSettingsMenu
                ? (darkMode ? 'bg-[#2c2c2c] text-white' : 'bg-[#e9e8e4] text-[#37352f]')
                : (darkMode ? 'hover:bg-[#282828] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]')
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={14} />
              <span>Cài đặt & Dữ liệu</span>
            </div>
            <span className="text-[#9b9a97]">
              {showSettingsMenu ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          </button>

          {showSettingsMenu && (
            <div className={`p-2 rounded-xl my-1.5 text-xs space-y-1 border shadow-lg ${
              darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
            }`}>
              <button
                onClick={onToggleDarkMode}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {darkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
                  <span>Chế độ {darkMode ? 'Sáng' : 'Tối'}</span>
                </span>
                <span className="text-[10px] text-[#9b9a97]">{darkMode ? 'Dark' : 'Light'}</span>
              </button>

              <button
                onClick={onExportData}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                }`}
              >
                <Download size={13} />
                <span>Sao lưu JSON</span>
              </button>

              <button
                onClick={onImportData}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                }`}
              >
                <Upload size={13} />
                <span>Khôi phục JSON</span>
              </button>

              <div className={`my-1 border-t ${darkMode ? 'border-[#383838]' : 'border-[#eee]'}`} />

              <button
                onClick={onResetData}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Đặt lại dữ liệu mẫu</span>
              </button>
            </div>
          )}
        </div>

        {/* User login button or status */}
        <div
          onClick={onOpenAuthModal}
          className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
            darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-[#ebeae7]'
          }`}
          title="Nhấn để đổi tài khoản hoặc đăng xuất"
        >
          {currentUser ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-[#2383e2]"
              />
              <div className="truncate text-left">
                <div className="text-xs font-semibold truncate leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-[#9b9a97] truncate mt-0.5">{currentUser.email}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2383e2]">
              <LogIn size={14} />
              <span>Đăng nhập Email</span>
            </div>
          )}

          <div className="text-[10px] text-[#9b9a97] hover:text-blue-500 font-medium shrink-0">
            {currentUser ? 'Đổi' : ''}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-[#9b9a97] hover:text-[#2383e2] transition-colors"
            title="Nhấn để xem trạng thái kết nối Supabase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ Cloud / Local</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md text-[#9b9a97] transition-colors ${
              darkMode ? 'hover:bg-[#2c2c2c]' : 'hover:bg-[#ebeae7]'
            }`}
            title="Thu gọn thanh bên"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
