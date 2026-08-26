import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterOptions, MainSectionType, NotionColor, PriorityLevel, ProjectPage, StatusId, Task, TaskNotification, TimelineZoom, User, ViewType, TeamId, FIXED_TEAMS } from './types';
import { DEFAULT_COLUMNS, INITIAL_PROJECTS, SAMPLE_TAGS } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { PageHeader } from './components/PageHeader';
import { ViewSwitcher } from './components/ViewSwitcher';
import { KanbanBoard } from './components/KanbanBoard';
import { TimelineView } from './components/TimelineView';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { MyTasksView } from './components/MyTasksView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { EmojiPickerModal } from './components/EmojiPickerModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { AuthModal } from './components/AuthModal';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { addDays, getTodayString, isDueThisWeek, isDueToday, isOverdue } from './utils/dateUtils';
import { getStoredNotifications, saveStoredNotifications } from './utils/notificationService';
import { 
  getSupabase, 
  fetchAllProjectsFromSupabase, 
  syncProjectToSupabase, 
  deleteProjectFromSupabase, 
  syncTaskToSupabase, 
  deleteTaskFromSupabase, 
  getCurrentSupabaseUser, 
  signOutSupabase, 
  mapSupabaseUser 
} from './lib/supabase';

const STORAGE_KEY = 'notion_tasks_workspace_v1';
const DARK_MODE_KEY = 'notion_tasks_dark_mode';
const USER_KEY = 'notion_tasks_logged_in_user_v1';

export default function App() {
  // Load initial projects from localStorage or default with teamId migration
  const [projects, setProjects] = useState<ProjectPage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: ProjectPage) => {
            const cat = (p.category || '').toLowerCase();
            const title = (p.title || '').toLowerCase();
            let teamId: TeamId = p.teamId || 'product';
            if (!p.teamId) {
              if (
                cat.includes('marketing') ||
                cat.includes('ads') ||
                cat.includes('growth') ||
                title.includes('marketing') ||
                title.includes('ads') ||
                title.includes('cro') ||
                title.includes('acquisition')
              ) {
                teamId = 'performance_marketing';
              } else if (
                cat.includes('book') ||
                cat.includes('sách') ||
                title.includes('sách') ||
                title.includes('book') ||
                title.includes('độc giả')
              ) {
                teamId = 'book_growth';
              }
            }
            const cleanViews = (p.views || ['kanban', 'timeline', 'table', 'calendar']).filter((v: string) => v !== 'list') as ViewType[];
            const safeViews: ViewType[] = cleanViews.length > 0 ? cleanViews : ['kanban', 'timeline', 'table', 'calendar'];
            const safeActiveView: ViewType = (p.activeView as string) === 'list' ? 'kanban' : (p.activeView || 'kanban');
            return {
              ...p,
              teamId,
              category: p.category || (teamId === 'performance_marketing' ? 'Performance Marketing' : teamId === 'book_growth' ? 'Book Growth' : 'Product'),
              views: safeViews,
              activeView: safeActiveView,
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to parse saved projects:', err);
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || 'proj-1';
  });

  const [activeSection, setActiveSection] = useState<MainSectionType>('project');

  // Current logged in user (null if not logged in)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to read logged in user:', e);
    }
    return null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DARK_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>('day');

  // Modals & Active task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskProjectId, setSelectedTaskProjectId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return !savedUser;
    } catch {
      return true;
    }
  });

  // In-app Notifications State
  const [notifications, setNotifications] = useState<TaskNotification[]>(() => getStoredNotifications());

  useEffect(() => {
    const handleNotifsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<TaskNotification[]>;
      if (customEvent.detail) {
        setNotifications(customEvent.detail);
      }
    };
    window.addEventListener('app_notifications_updated', handleNotifsUpdated);
    return () => {
      window.removeEventListener('app_notifications_updated', handleNotifsUpdated);
    };
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    const updated = notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleClearNotification = (notificationId: string) => {
    const updated = notifications.filter((n) => n.id !== notificationId);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleOpenNotificationTask = (projectId: string, taskId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (targetProject) {
      setActiveProjectId(projectId);
      setActiveSection('project');
      const targetTask = targetProject.tasks.find((t) => t.id === taskId);
      if (targetTask) {
        setSelectedTaskProjectId(projectId);
        setSelectedTask(targetTask);
      }
    } else {
      for (const p of projects) {
        const targetTask = p.tasks.find((t) => t.id === taskId);
        if (targetTask) {
          setActiveProjectId(p.id);
          setActiveSection('project');
          setSelectedTaskProjectId(p.id);
          setSelectedTask(targetTask);
          break;
        }
      }
    }
  };

  // Filters & Sorting state for Project View
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    statuses: [],
    priorities: [],
    assigneeIds: [],
    tagIds: [],
    dateFilter: 'all',
    groupBy: 'status',
    sortBy: 'order',
    sortDirection: 'asc',
  });

  // Supabase Auth and Data Initialization
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Check current Supabase Auth session
    getCurrentSupabaseUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    // 2. Listen to Auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(mapSupabaseUser(session.user));
      }
    });

    // 3. Fetch remote workspace data from Supabase
    fetchAllProjectsFromSupabase().then((remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        setProjects(remoteProjects);
      } else {
        // If Supabase table is empty, seed with initial projects
        INITIAL_PROJECTS.forEach((proj) => {
          syncProjectToSupabase(proj);
        });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Save projects to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error('Failed to save projects to localStorage:', err);
    }
  }, [projects]);

  // Save current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Failed to save user:', e);
    }
  }, [currentUser]);

  // Save dark mode setting
  useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_KEY, String(darkMode));
    } catch (err) {
      console.error('Failed to save dark mode:', err);
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Current active project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];
  }, [projects, activeProjectId]);

  // Modal project for TaskDetailModal (either active project or task's parent project)
  const modalProject = useMemo(() => {
    if (selectedTaskProjectId) {
      return projects.find((p) => p.id === selectedTaskProjectId) || activeProject;
    }
    return activeProject;
  }, [projects, selectedTaskProjectId, activeProject]);

  // Keep selectedTask synchronized with projects state
  useEffect(() => {
    if (selectedTask) {
      const proj = projects.find((p) => p.id === (selectedTaskProjectId || activeProjectId));
      if (proj) {
        const updated = proj.tasks.find((t) => t.id === selectedTask.id);
        if (updated) {
          setSelectedTask(updated);
        }
      }
    }
  }, [projects, selectedTaskProjectId, activeProjectId]);

  // Filtered and sorted tasks for current project
  const filteredTasks = useMemo(() => {
    let result = [...activeProject.tasks];

    // 1. Search Query
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter((t) => 
        t.title.toLowerCase().includes(query) ||
        t.tags?.some((tag) => tag.label.toLowerCase().includes(query)) ||
        t.subtasks?.some((st) => st.text.toLowerCase().includes(query))
      );
    }

    // 2. Status filter
    if (filters.statuses.length > 0) {
      result = result.filter((t) => filters.statuses.includes(t.status));
    }

    // 3. Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter((t) => filters.priorities.includes(t.priority));
    }

    // 4. Assignee filter
    if (filters.assigneeIds.length > 0) {
      result = result.filter((t) => 
        t.assignees?.some((u) => filters.assigneeIds.includes(u.id))
      );
    }

    // 5. Tags filter
    if (filters.tagIds.length > 0) {
      result = result.filter((t) => 
        t.tags?.some((tag) => filters.tagIds.includes(tag.id))
      );
    }

    // 6. Date filter
    if (filters.dateFilter !== 'all') {
      if (filters.dateFilter === 'today') {
        result = result.filter((t) => isDueToday(t.dueDate) || isDueToday(t.startDate));
      } else if (filters.dateFilter === 'this_week') {
        result = result.filter((t) => isDueThisWeek(t.dueDate));
      } else if (filters.dateFilter === 'overdue') {
        result = result.filter((t) => isOverdue(t.dueDate, t.status));
      } else if (filters.dateFilter === 'no_date') {
        result = result.filter((t) => !t.dueDate && !t.startDate);
      }
    }

    // 7. Sorting
    if (filters.sortBy !== 'order') {
      result.sort((a, b) => {
        let valA: any = a[filters.sortBy as keyof Task] || '';
        let valB: any = b[filters.sortBy as keyof Task] || '';

        if (filters.sortBy === 'priority') {
          const priorityWeights: Record<PriorityLevel, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
            none: 0,
          };
          valA = priorityWeights[a.priority] ?? 0;
          valB = priorityWeights[b.priority] ?? 0;
        }

        if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [activeProject.tasks, filters]);

  // Project update handlers
  const handleUpdateProject = useCallback((updates: Partial<ProjectPage>) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === activeProjectId ? { ...p, ...updates } : p));
      const targetProj = next.find((p) => p.id === activeProjectId);
      if (targetProj) syncProjectToSupabase(targetProj);
      return next;
    });
  }, [activeProjectId]);

  const handleAddProject = (targetTeamId?: TeamId) => {
    const teamId: TeamId = targetTeamId || 'product';
    const teamConfig = FIXED_TEAMS.find((t) => t.id === teamId) || FIXED_TEAMS[2];
    const newProjId = `proj-${Date.now()}`;
    const newProject: ProjectPage = {
      id: newProjId,
      title: `Bảng công việc (${teamConfig.name})`,
      icon: teamConfig.icon || '📋',
      description: `Không gian quản lý công việc và mục tiêu của nhóm ${teamConfig.name}.`,
      columns: DEFAULT_COLUMNS,
      views: ['kanban', 'timeline', 'table', 'calendar'],
      activeView: 'kanban',
      category: teamConfig.name,
      teamId: teamId,
      createdAt: getTodayString(),
      tasks: [],
    };
    setProjects((prev) => [...prev, newProject]);
    syncProjectToSupabase(newProject);
    setActiveProjectId(newProjId);
    setActiveSection('project');
  };

  const handleDeleteProject = (projId: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== projId);
    setProjects(remaining);
    deleteProjectFromSupabase(projId);
    if (activeProjectId === projId) {
      setActiveProjectId(remaining[0].id);
    }
  };

  const handleToggleFavorite = (projId: string) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === projId ? { ...p, isFavorite: !p.isFavorite } : p));
      const targetProj = next.find((p) => p.id === projId);
      if (targetProj) syncProjectToSupabase(targetProj);
      return next;
    });
  };

  // Task Actions
  const handleAddNewTask = (initialStart?: string, initialDue?: string) => {
    const today = getTodayString();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Công việc mới',
      status: 'todo',
      priority: 'medium',
      startDate: initialStart || today,
      dueDate: initialDue || addDays(today, 3),
      assignees: currentUser ? [currentUser] : [],
      tags: [SAMPLE_TAGS[0]],
      progress: 0,
      order: activeProject.tasks.length + 1,
      subtasks: [],
      description: '',
      blocks: [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedTasks = [...activeProject.tasks, newTask];
    handleUpdateProject({ tasks: updatedTasks });
    syncTaskToSupabase(activeProjectId, newTask);
    setSelectedTaskProjectId(activeProjectId);
    setSelectedTask(newTask);
  };

  const handleAddNewTaskForCurrentUser = () => {
    const targetProj = activeProject;
    const today = getTodayString();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Việc mới được giao cho tôi',
      status: 'todo',
      priority: 'high',
      startDate: today,
      dueDate: addDays(today, 2),
      assignees: currentUser ? [currentUser] : [],
      tags: [SAMPLE_TAGS[0]],
      progress: 0,
      order: targetProj.tasks.length + 1,
      subtasks: [],
      description: '',
      blocks: [],
      createdAt: today,
      updatedAt: today,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === targetProj.id ? { ...p, tasks: [...p.tasks, newTask] } : p
      )
    );
    syncTaskToSupabase(targetProj.id, newTask);
    setSelectedTaskProjectId(targetProj.id);
    setSelectedTask(newTask);
  };

  const handleQuickAddTask = (status: StatusId, title: string) => {
    const today = getTodayString();
    const colTasks = activeProject.tasks.filter((t) => t.status === status);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      status,
      priority: 'none',
      startDate: today,
      dueDate: addDays(today, 3),
      assignees: currentUser ? [currentUser] : [],
      tags: [],
      progress: status === 'done' ? 100 : 0,
      order: colTasks.length + 1,
      subtasks: [],
      description: '',
      blocks: [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedTasks = [...activeProject.tasks, newTask];
    handleUpdateProject({ tasks: updatedTasks });
    syncTaskToSupabase(activeProjectId, newTask);
  };

  const handleUpdateTaskInProject = useCallback((projId: string, taskId: string, updates: Partial<Task>) => {
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== projId) return p;
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            const updated = { ...t, ...updates, updatedAt: getTodayString() };
            syncTaskToSupabase(projId, updated);
            return updated;
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      })
    );
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const targetProjId = selectedTaskProjectId || activeProjectId;
    handleUpdateTaskInProject(targetProjId, taskId, updates);
  }, [selectedTaskProjectId, activeProjectId, handleUpdateTaskInProject]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const targetProjId = selectedTaskProjectId || activeProjectId;
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== targetProjId) return p;
        return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) };
      })
    );
    deleteTaskFromSupabase(taskId);
  }, [selectedTaskProjectId, activeProjectId]);

  // Kanban Drag & Drop
  const handleMoveTask = useCallback((taskId: string, targetStatus: StatusId, targetIndex?: number) => {
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        const targetTask = p.tasks.find((t) => t.id === taskId);
        if (!targetTask) return p;

        const otherTasks = p.tasks.filter((t) => t.id !== taskId);
        const updatedTargetTask: Task = {
          ...targetTask,
          status: targetStatus,
          progress: targetStatus === 'done' ? 100 : targetTask.status === 'done' ? 50 : targetTask.progress,
          updatedAt: getTodayString(),
        };

        // Recalculate order
        const colTasks = otherTasks.filter((t) => t.status === targetStatus);
        if (targetIndex !== undefined && targetIndex >= 0) {
          colTasks.splice(targetIndex, 0, updatedTargetTask);
        } else {
          colTasks.push(updatedTargetTask);
        }

        colTasks.forEach((t, i) => {
          t.order = i + 1;
        });

        const finalTasks = [...otherTasks.filter((t) => t.status !== targetStatus), ...colTasks];
        syncTaskToSupabase(activeProjectId, updatedTargetTask);
        return { ...p, tasks: finalTasks };
      })
    );
  }, [activeProjectId]);

  // Timeline dragging & resizing
  const handleUpdateTaskDates = useCallback((taskId: string, newStart: string, newDue: string) => {
    handleUpdateTask(taskId, { startDate: newStart, dueDate: newDue });
  }, [handleUpdateTask]);

  // Column management
  const handleAddColumn = (title: string, color: NotionColor) => {
    const colId = `col-${Date.now()}`;
    const newColumns = [...activeProject.columns, { id: colId, title, color }];
    handleUpdateProject({ columns: newColumns });
  };

  const handleDeleteColumn = (colId: StatusId) => {
    const newColumns = activeProject.columns.filter((c) => c.id !== colId);
    handleUpdateProject({ columns: newColumns });
  };

  const handleUpdateColumn = (colId: StatusId, title: string, color: NotionColor) => {
    const newColumns = activeProject.columns.map((c) => 
      c.id === colId ? { ...c, title, color } : c
    );
    handleUpdateProject({ columns: newColumns });
  };

  // View management
  const handleViewChange = (view: ViewType) => {
    handleUpdateProject({ activeView: view });
  };

  const handleAddView = (view: ViewType) => {
    if (!activeProject.views.includes(view)) {
      handleUpdateProject({ views: [...activeProject.views, view] });
    }
  };

  // Export / Import / Reset Workspace JSON
  const handleExportData = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notion_tasks_backup_${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
              setActiveProjectId(parsed[0].id);
              alert('Khôi phục dữ liệu không gian làm việc thành công!');
            }
          } catch (err) {
            alert('File JSON không hợp lệ.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại tất cả dự án về dữ liệu mẫu ban đầu?')) {
      setProjects(INITIAL_PROJECTS);
      setActiveProjectId(INITIAL_PROJECTS[0].id);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (!currentUser) {
    return (
      <div className={`w-screen h-screen flex flex-col items-center justify-center p-6 text-center font-sans ${
        darkMode ? 'bg-[#191919] text-[#e0e0e0]' : 'bg-[#f7f6f3] text-[#37352f]'
      }`}>
        <div className={`max-w-md w-full p-8 rounded-2xl border shadow-2xl flex flex-col items-center gap-5 transition-all ${
          darkMode ? 'bg-[#202020] border-[#333] text-[#e0e0e0]' : 'bg-white border-[#e8e7e4] text-[#37352f]'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-[#2383e2] flex items-center justify-center">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Hệ thống quản lý công việc</h2>
            <p className="text-xs leading-relaxed text-[#787774] dark:text-[#9b9a97]">
              Toàn bộ dữ liệu, bảng công việc và thanh điều hướng sidebar đã được khóa bảo mật. Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục truy cập.
            </p>
          </div>

          <div className="flex flex-col w-full gap-2.5 pt-2">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-2.5 px-4 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Đăng nhập / Đăng ký ngay</span>
            </button>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          currentUser={currentUser}
          onLogin={(user) => {
            setCurrentUser(user);
          }}
          onLogout={async () => {
            await signOutSupabase();
            setCurrentUser(null);
            setShowAuthModal(true);
          }}
          darkMode={darkMode}
        />
      </div>
    );
  }

  return (
    <div className={`w-screen h-screen flex overflow-hidden font-sans ${
      darkMode ? 'bg-[#191919] text-[#e0e0e0]' : 'bg-[#ffffff] text-[#37352f]'
    }`}>
      {/* Notion Sidebar */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        activeSection={activeSection}
        currentUser={currentUser}
        notifications={notifications}
        onOpenTask={handleOpenNotificationTask}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearNotification={handleClearNotification}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setActiveSection('project');
        }}
        onSelectMyTasks={() => {
          setActiveSection('my_tasks');
        }}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onToggleFavorite={handleToggleFavorite}
        onOpenSearch={() => setShowQuickSearch(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden no-scrollbar relative">
        {activeSection === 'my_tasks' ? (
          <MyTasksView
            projects={projects}
            currentUser={currentUser}
            notifications={notifications}
            onOpenTask={handleOpenNotificationTask}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearNotification={handleClearNotification}
            onTaskClick={(projId, task) => {
              setSelectedTaskProjectId(projId);
              setSelectedTask(task);
            }}
            onUpdateTask={handleUpdateTaskInProject}
            onAddNewTaskForUser={handleAddNewTaskForCurrentUser}
            onSelectProject={(projId) => {
              setActiveProjectId(projId);
              setActiveSection('project');
            }}
            onOpenAuthModal={() => setShowAuthModal(true)}
            darkMode={darkMode}
          />
        ) : (
          <>
            {/* Page Header (Simplified Notion Header: Icon, Title, Description, Favorites, Create Task, Notifications) */}
            <PageHeader
              project={activeProject}
              currentUser={currentUser}
              notifications={notifications}
              onOpenTask={handleOpenNotificationTask}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearNotification={handleClearNotification}
              onUpdateProject={handleUpdateProject}
              onOpenEmojiPicker={() => setShowEmojiPicker(true)}
              onAddNewTask={() => handleAddNewTask()}
              darkMode={darkMode}
            />

            {/* View Switcher Tabs & Filter Toolbar */}
            <ViewSwitcher
              activeView={activeProject.activeView || 'kanban'}
              onViewChange={handleViewChange}
              availableViews={activeProject.views || ['kanban', 'timeline', 'table']}
              onAddView={handleAddView}
              filters={filters}
              onUpdateFilters={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
              timelineZoom={timelineZoom}
              onTimelineZoomChange={setTimelineZoom}
              darkMode={darkMode}
              totalTasks={activeProject.tasks.length}
              filteredTasksCount={filteredTasks.length}
            />

            {/* Active Database View Content */}
            <div className="flex-1 min-h-[400px]">
              {activeProject.activeView === 'kanban' && (
                <KanbanBoard
                  project={activeProject}
                  tasks={filteredTasks}
                  onTaskClick={(task) => {
                    setSelectedTaskProjectId(activeProjectId);
                    setSelectedTask(task);
                  }}
                  onMoveTask={handleMoveTask}
                  onQuickAddTask={handleQuickAddTask}
                  onAddColumn={handleAddColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateColumn={handleUpdateColumn}
                  darkMode={darkMode}
                />
              )}

              {activeProject.activeView === 'timeline' && (
                <TimelineView
                  project={activeProject}
                  tasks={filteredTasks}
                  onTaskClick={(task) => {
                    setSelectedTaskProjectId(activeProjectId);
                    setSelectedTask(task);
                  }}
                  onUpdateTaskDates={handleUpdateTaskDates}
                  onAddNewTask={handleAddNewTask}
                  timelineZoom={timelineZoom}
                  onZoomChange={setTimelineZoom}
                  darkMode={darkMode}
                />
              )}

              {activeProject.activeView === 'table' && (
                <TableView
                  project={activeProject}
                  tasks={filteredTasks}
                  onTaskClick={(task) => {
                    setSelectedTaskProjectId(activeProjectId);
                    setSelectedTask(task);
                  }}
                  onUpdateTask={handleUpdateTask}
                  onAddNewTask={() => handleAddNewTask()}
                  onDeleteTask={handleDeleteTask}
                  darkMode={darkMode}
                />
              )}

              {activeProject.activeView === 'calendar' && (
                <CalendarView
                  project={activeProject}
                  tasks={filteredTasks}
                  onTaskClick={(task) => {
                    setSelectedTaskProjectId(activeProjectId);
                    setSelectedTask(task);
                  }}
                  onAddNewTaskWithDate={(dateStr) => handleAddNewTask(dateStr, dateStr)}
                  darkMode={darkMode}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Task Detail Modal (Side Peek / Full Modal) */}
      <TaskDetailModal
        task={selectedTask}
        project={modalProject}
        isOpen={!!selectedTask && !!currentUser}
        onClose={() => {
          setSelectedTask(null);
          setSelectedTaskProjectId(null);
        }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        darkMode={darkMode}
        currentUser={currentUser}
      />

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={showEmojiPicker && !!currentUser}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => handleUpdateProject({ icon: emoji })}
        currentEmoji={activeProject.icon}
      />

      {/* Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={showQuickSearch && !!currentUser}
        onClose={() => setShowQuickSearch(false)}
        projects={projects}
        onSelectProject={(projId) => {
          setActiveProjectId(projId);
          setActiveSection('project');
        }}
        onSelectTask={(projId, task) => {
          setActiveProjectId(projId);
          setActiveSection('project');
          setSelectedTaskProjectId(projId);
          setSelectedTask(task);
        }}
        darkMode={darkMode}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
        }}
        onLogout={async () => {
          await signOutSupabase();
          setCurrentUser(null);
          setShowAuthModal(true);
        }}
        darkMode={darkMode}
      />
    </div>
  );
}
