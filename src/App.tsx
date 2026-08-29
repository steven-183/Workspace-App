import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterOptions, MainSectionType, NotionColor, PriorityLevel, ProjectPage, StatusId, Task, TaskNotification, TimelineZoom, User, ViewType, TeamId, FIXED_TEAMS, AppTheme } from './types';
import { DEFAULT_COLUMNS, INITIAL_PROJECTS, SAMPLE_TAGS, SAMPLE_USERS } from './data/initialData';
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
import { TrashArchiveModal } from './components/TrashArchiveModal';
import { ToastNotificationContainer } from './components/ToastNotificationContainer';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { addDays, getTodayString, isDueThisWeek, isDueToday, isOverdue } from './utils/dateUtils';
import { getStoredNotifications, saveStoredNotifications, triggerToast, dispatchTaskEvent } from './utils/notificationService';
import { 
  getSupabase, 
  fetchAllProjectsFromSupabase, 
  syncProjectToSupabase, 
  deleteProjectFromSupabase, 
  syncTaskToSupabase, 
  deleteTaskFromSupabase, 
  getCurrentSupabaseUser, 
  fetchProfilesFromSupabase,
  signOutSupabase, 
  mapSupabaseUser,
  mergeProjectsWithRemote
} from './lib/supabase';

const STORAGE_KEY = 'notion_tasks_workspace_v1';
const DARK_MODE_KEY = 'notion_tasks_dark_mode';
const THEME_KEY = 'notion_tasks_app_theme';
const USER_KEY = 'notion_tasks_logged_in_user_v1';

export default function App() {
  // Load initial projects from localStorage or default with teamId & column migration
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

            // Sanitize columns: Remove 'backlog' (Chưa xếp lịch) and rename 'Đang duyệt' to 'Chờ review'
            const filteredCols = (p.columns || DEFAULT_COLUMNS)
              .filter((c) => c.id !== 'backlog')
              .map((c) => {
                if (c.id === 'in_review' && (c.title === 'Đang duyệt' || !c.title)) {
                  return { ...c, title: 'Chờ review' };
                }
                return c;
              });

            // Ensure in_review column exists
            const hasInReview = filteredCols.some((c) => c.id === 'in_review');
            const finalCols = hasInReview
              ? filteredCols
              : [
                  ...filteredCols.slice(0, 2),
                  { id: 'in_review', title: 'Chờ review', color: 'purple' as const, icon: 'Eye' },
                  ...filteredCols.slice(2),
                ];

            // Migrate any tasks that had 'backlog' status to 'todo'
            const sanitizedTasks = (p.tasks || []).map((t) => {
              if (t.status === 'backlog') {
                return { ...t, status: 'todo' as StatusId };
              }
              return t;
            });

            return {
              ...p,
              teamId,
              category: p.category || (teamId === 'performance_marketing' ? 'Performance Marketing' : teamId === 'book_growth' ? 'Book Growth' : 'Product'),
              views: safeViews,
              activeView: safeActiveView,
              columns: finalCols,
              tasks: sanitizedTasks,
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
      const savedUser = localStorage.getItem(USER_KEY);
      const savedDark = localStorage.getItem(DARK_MODE_KEY);
      if (savedDark !== null) {
        return savedDark === 'true';
      }
      // When not logged in, default is dark mode
      if (!savedUser) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  });

  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      const savedTheme = localStorage.getItem(THEME_KEY) as AppTheme;
      if (savedTheme === 'qanda_pink' || savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      const savedDark = localStorage.getItem(DARK_MODE_KEY);
      if (savedDark !== null) {
        return savedDark === 'true' ? 'dark' : 'light';
      }
      // When not logged in, default is dark theme
      if (!savedUser) {
        return 'dark';
      }
      return 'light';
    } catch {
      return 'dark';
    }
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>('day');

  // Modals & Active task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskProjectId, setSelectedTaskProjectId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showTrashArchiveModal, setShowTrashArchiveModal] = useState(false);
  const [trashArchiveInitialTab, setTrashArchiveInitialTab] = useState<'archive' | 'trash'>('archive');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return !savedUser;
    } catch {
      return true;
    }
  });

  // Dynamic database users from Supabase profiles
  const [dbUsers, setDbUsers] = useState<User[]>([]);

  // Aggregated list of all available users across system, database, logged in user, and tasks
  const allAvailableUsers = useMemo(() => {
    const map = new Map<string, User>();
    SAMPLE_USERS.forEach((u) => {
      if (u && (u.id || u.email)) map.set(u.id || u.email || '', u);
    });
    dbUsers.forEach((u) => {
      if (u && (u.id || u.email)) map.set(u.id || u.email || '', u);
    });
    if (currentUser && (currentUser.id || currentUser.email)) {
      map.set(currentUser.id || currentUser.email || '', currentUser);
    }
    projects.forEach((proj) => {
      (proj.tasks || []).forEach((t) => {
        if (t.creator && (t.creator.id || t.creator.email)) {
          map.set(t.creator.id || t.creator.email || '', t.creator);
        }
        (t.assignees || []).forEach((u) => {
          if (u && (u.id || u.email)) map.set(u.id || u.email || '', u);
        });
        (t.followers || []).forEach((u) => {
          if (u && (u.id || u.email)) map.set(u.id || u.email || '', u);
        });
      });
    });
    return Array.from(map.values());
  }, [projects, currentUser, dbUsers]);

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

    // 1. Check current Supabase Auth session & fetch all database profiles
    getCurrentSupabaseUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    fetchProfilesFromSupabase().then((profiles) => {
      if (profiles && profiles.length > 0) {
        setDbUsers(profiles);
      }
    });

    // 2. Listen to Auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        setCurrentUser(user);
        fetchProfilesFromSupabase().then((profiles) => {
          if (profiles && profiles.length > 0) setDbUsers(profiles);
        });
      }
    });

    // 3. Fetch remote workspace data from Supabase
    fetchAllProjectsFromSupabase().then((remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        setProjects((prev) => mergeProjectsWithRemote(prev, remoteProjects));
      } else {
        // If Supabase table is empty, seed with current projects
        setProjects((prev) => {
          const toSeed = prev && prev.length > 0 ? prev : INITIAL_PROJECTS;
          toSeed.forEach((proj) => {
            syncProjectToSupabase(proj);
          });
          return toSeed;
        });
      }
    });

    // 4. Realtime subscription for tasks, projects, and broadcast notifications
    const realtimeChannel = supabase
      .channel('workspace_realtime_events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchAllProjectsFromSupabase().then((remoteProjects) => {
            if (remoteProjects && remoteProjects.length > 0) {
              setProjects((prev) => mergeProjectsWithRemote(prev, remoteProjects));
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchAllProjectsFromSupabase().then((remoteProjects) => {
            if (remoteProjects && remoteProjects.length > 0) {
              setProjects((prev) => mergeProjectsWithRemote(prev, remoteProjects));
            }
          });
        }
      )
      .on(
        'broadcast',
        { event: 'new_task_notification' },
        ({ payload }: { payload: any }) => {
          if (payload?.notifications && Array.isArray(payload.notifications)) {
            const current = getStoredNotifications();
            const existingIds = new Set(current.map((n) => n.id));
            const fresh = payload.notifications.filter((n: TaskNotification) => !existingIds.has(n.id));
            if (fresh.length > 0) {
              const merged = [...fresh, ...current].slice(0, 100);
              setNotifications(merged);
              saveStoredNotifications(merged);

              // Check if notification is for current user
              const savedUserStr = localStorage.getItem(USER_KEY);
              const activeUser = savedUserStr ? JSON.parse(savedUserStr) : null;
              if (activeUser) {
                const myNotifs = fresh.filter((n: TaskNotification) =>
                  n.recipientId === 'all' ||
                  n.recipientId === activeUser.id ||
                  n.recipientId === activeUser.email ||
                  (activeUser.email && n.recipientId?.toLowerCase() === activeUser.email.toLowerCase())
                );
                if (myNotifs.length > 0) {
                  window.dispatchEvent(new CustomEvent('app_show_toast', { detail: myNotifs[0] }));
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      authListener?.subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
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

  // Save theme & dark mode setting
  const handleSetTheme = useCallback((theme: AppTheme) => {
    setAppTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
    if (theme === 'dark') {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, appTheme);
      localStorage.setItem(DARK_MODE_KEY, String(darkMode));
    } catch (err) {
      console.error('Failed to save theme setting:', err);
    }

    if (appTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('theme-qanda-pink');
    } else if (appTheme === 'qanda_pink') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('theme-qanda-pink');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('theme-qanda-pink');
    }
  }, [appTheme, darkMode]);

  // Current active project
  const activeProject = useMemo(() => {
    return (
      projects.find((p) => p.id === activeProjectId && !p.isDeleted) ||
      projects.find((p) => !p.isDeleted) ||
      projects[0] ||
      INITIAL_PROJECTS[0]
    );
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

  // Filtered and sorted tasks for current project (excluding deleted & archived)
  const filteredTasks = useMemo(() => {
    let result = (activeProject.tasks || []).filter((t) => !t.isDeleted && !t.isArchived);

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
    const targetProject = projects.find((p) => p.id === projId);
    if (!targetProject) return;

    const now = new Date().toISOString();
    const taskCount = (targetProject.tasks || []).filter((t) => !t.isDeleted).length;

    // Mark all tasks in this project as deleted (moved to trash)
    const updatedTasks: Task[] = (targetProject.tasks || []).map((t) => ({
      ...t,
      isDeleted: true,
      deletedAt: now,
    }));

    // Update in state: mark project as isDeleted: true with deleted tasks
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === projId
          ? {
              ...p,
              isDeleted: true,
              deletedAt: now,
              tasks: updatedTasks,
            }
          : p
      );

      const activeRemaining = updated.filter((p) => !p.isDeleted);
      if (activeRemaining.length > 0 && activeProjectId === projId) {
        setActiveProjectId(activeRemaining[0].id);
      }
      return updated;
    });

    // Delete/move in Supabase
    deleteProjectFromSupabase(projId, updatedTasks);

    triggerToast({
      title: 'Đã xóa bảng công việc',
      message: `Bảng "${targetProject.title}" đã được xóa. ${taskCount} công việc đã được chuyển vào Thùng rác.`,
      type: 'property_change',
    });
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
    const targetProject = projects.find((p) => p.id === activeProjectId && !p.isDeleted) || activeProject;
    const today = getTodayString();
    const defaultStatus = (targetProject.columns && targetProject.columns.length > 0)
      ? targetProject.columns[0].id
      : 'todo';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Công việc mới',
      status: defaultStatus,
      priority: 'medium',
      startDate: initialStart || today,
      dueDate: initialDue || addDays(today, 3),
      assignees: currentUser ? [currentUser] : [],
      tags: [],
      progress: 0,
      order: (targetProject.tasks || []).length + 1,
      subtasks: [],
      description: '',
      blocks: [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedTasks = [...(targetProject.tasks || []), newTask];
    const updatedProject = { ...targetProject, tasks: updatedTasks };
    setProjects((prev) =>
      prev.map((p) => (p.id === targetProject.id ? updatedProject : p))
    );
    syncProjectToSupabase(updatedProject);
    syncTaskToSupabase(targetProject.id, newTask, targetProject);
    setSelectedTaskProjectId(targetProject.id);
    setSelectedTask(newTask);
  };

  const handleAddNewTaskForCurrentUser = () => {
    const targetProj = projects.find((p) => p.id === activeProjectId && !p.isDeleted) || activeProject;
    const today = getTodayString();
    const defaultStatus = (targetProj.columns && targetProj.columns.length > 0)
      ? targetProj.columns[0].id
      : 'todo';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Việc mới được giao cho tôi',
      status: defaultStatus,
      priority: 'high',
      startDate: today,
      dueDate: addDays(today, 2),
      assignees: currentUser ? [currentUser] : [],
      tags: [],
      progress: 0,
      order: (targetProj.tasks || []).length + 1,
      subtasks: [],
      description: '',
      blocks: [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedTasks = [...(targetProj.tasks || []), newTask];
    const updatedProject = { ...targetProj, tasks: updatedTasks };
    setProjects((prev) =>
      prev.map((p) => (p.id === targetProj.id ? updatedProject : p))
    );
    syncProjectToSupabase(updatedProject);
    syncTaskToSupabase(targetProj.id, newTask, targetProj);
    setSelectedTaskProjectId(targetProj.id);
    setSelectedTask(newTask);
  };

  const handleQuickAddTask = (status: StatusId, title: string) => {
    const targetProject = projects.find((p) => p.id === activeProjectId && !p.isDeleted) || activeProject;
    const today = getTodayString();
    const colTasks = (targetProject.tasks || []).filter((t) => t.status === status);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim() || 'Công việc mới',
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

    const updatedTasks = [...(targetProject.tasks || []), newTask];
    const updatedProject = { ...targetProject, tasks: updatedTasks };
    setProjects((prev) =>
      prev.map((p) => (p.id === targetProject.id ? updatedProject : p))
    );
    syncProjectToSupabase(updatedProject);
    syncTaskToSupabase(targetProject.id, newTask, targetProject);
  };

  const handleUpdateTaskInProject = useCallback((projId: string, taskId: string, updates: Partial<Task>) => {
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== projId) return p;
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            const updated = { ...t, ...updates, updatedAt: getTodayString() };
            syncTaskToSupabase(projId, updated, p);
            return updated;
          }
          return t;
        });
        const updatedProj = { ...p, tasks: updatedTasks };
        return updatedProj;
      })
    );
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const targetProjId = selectedTaskProjectId || activeProjectId;
    handleUpdateTaskInProject(targetProjId, taskId, updates);
  }, [selectedTaskProjectId, activeProjectId, handleUpdateTaskInProject]);

  // Soft delete task (Move to Trash)
  const handleSoftDeleteTask = useCallback((taskId: string) => {
    const targetProjId = selectedTaskProjectId || activeProjectId;
    let taskTitle = '';
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== targetProjId) return p;
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            taskTitle = t.title;
            const updated: Task = {
              ...t,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              updatedAt: getTodayString(),
            };
            syncTaskToSupabase(targetProjId, updated);
            return updated;
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      })
    );
    setSelectedTask(null);
    setSelectedTaskProjectId(null);
    triggerToast({
      title: 'Đã chuyển vào Thùng rác',
      message: `Công việc "${taskTitle || taskId}" đã được chuyển vào Thùng rác. Bạn có thể khôi phục bất cứ lúc nào.`,
      type: 'property_change',
    });
  }, [selectedTaskProjectId, activeProjectId]);

  // Archive task
  const handleArchiveTask = useCallback((taskId: string) => {
    const targetProjId = selectedTaskProjectId || activeProjectId;
    let taskTitle = '';
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== targetProjId) return p;
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            taskTitle = t.title;
            const updated: Task = {
              ...t,
              isArchived: true,
              updatedAt: getTodayString(),
            };
            syncTaskToSupabase(targetProjId, updated);
            return updated;
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      })
    );
    setSelectedTask(null);
    setSelectedTaskProjectId(null);
    triggerToast({
      title: 'Đã lưu trữ công việc',
      message: `Công việc "${taskTitle || taskId}" đã được chuyển vào Kho lưu trữ.`,
      type: 'property_change',
    });
  }, [selectedTaskProjectId, activeProjectId]);

  // Unarchive task
  const handleUnarchiveTask = useCallback((projId: string, taskId: string) => {
    let taskTitle = '';
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== projId) return p;
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            taskTitle = t.title;
            const updated: Task = {
              ...t,
              isArchived: false,
              updatedAt: getTodayString(),
            };
            syncTaskToSupabase(projId, updated);
            return updated;
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      })
    );
    triggerToast({
      title: 'Đã khôi phục từ Kho lưu trữ',
      message: `Công việc "${taskTitle || taskId}" đã được đưa trở lại danh sách hoạt động.`,
      type: 'property_change',
    });
  }, []);

  // Restore task from trash
  const handleRestoreTask = useCallback((projId: string, taskId: string) => {
    let taskTitle = '';
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== projId) return p;
        const updatedTasks = p.tasks.map((t) => {
          if (t.id === taskId) {
            taskTitle = t.title;
            const updated: Task = {
              ...t,
              isDeleted: false,
              deletedAt: undefined,
              updatedAt: getTodayString(),
            };
            syncTaskToSupabase(projId, updated);
            return updated;
          }
          return t;
        });

        const updatedProject: ProjectPage = {
          ...p,
          isDeleted: false,
          deletedAt: undefined,
          tasks: updatedTasks,
        };
        syncProjectToSupabase(updatedProject);
        return updatedProject;
      })
    );
    triggerToast({
      title: 'Đã khôi phục công việc',
      message: `Công việc "${taskTitle || taskId}" đã được khôi phục từ Thùng rác.`,
      type: 'property_change',
    });
  }, []);

  // Permanent Delete task
  const handlePermanentDeleteTask = useCallback((projId: string, taskId: string) => {
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== projId) return p;
        return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) };
      })
    );
    deleteTaskFromSupabase(taskId);
    triggerToast({
      title: 'Đã xóa vĩnh viễn',
      message: 'Công việc đã được xóa hoàn toàn khỏi hệ thống.',
      type: 'property_change',
    });
  }, []);

  // Empty Trash for project
  const handleEmptyTrash = useCallback((projId: string) => {
    setProjects((prev) => 
      prev.map((p) => {
        if (p.id !== projId) return p;
        const deletedIds = p.tasks.filter((t) => t.isDeleted).map((t) => t.id);
        deletedIds.forEach((id) => deleteTaskFromSupabase(id));
        return { ...p, tasks: p.tasks.filter((t) => !t.isDeleted) };
      })
    );
    triggerToast({
      title: 'Đã dọn sạch Thùng rác',
      message: 'Tất cả công việc trong thùng rác đã được xóa vĩnh viễn.',
      type: 'property_change',
    });
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    handleSoftDeleteTask(taskId);
  }, [handleSoftDeleteTask]);

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
      appTheme === 'qanda_pink'
        ? 'bg-[#fff5f6] text-[#37352f]'
        : darkMode ? 'bg-[#191919] text-[#e0e0e0]' : 'bg-[#ffffff] text-[#37352f]'
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
        onOpenTrashArchive={(tab) => {
          setTrashArchiveInitialTab(tab || 'archive');
          setShowTrashArchiveModal(true);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          const next = darkMode ? 'light' : 'dark';
          handleSetTheme(next);
        }}
        appTheme={appTheme}
        onSetTheme={handleSetTheme}
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
            {/* Page Header (Simplified Notion Header: Icon, Title, Description, Favorites, Create Task) */}
            <PageHeader
              project={activeProject}
              currentUser={currentUser}
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
        onDeleteTask={handleSoftDeleteTask}
        onArchiveTask={handleArchiveTask}
        onUnarchiveTask={(taskId) => handleUnarchiveTask(selectedTaskProjectId || activeProjectId, taskId)}
        availableUsers={allAvailableUsers}
        darkMode={darkMode}
        currentUser={currentUser}
      />

      {/* Trash & Archive Management Modal */}
      <TrashArchiveModal
        isOpen={showTrashArchiveModal}
        onClose={() => setShowTrashArchiveModal(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        initialTab={trashArchiveInitialTab}
        onRestoreTask={handleRestoreTask}
        onUnarchiveTask={handleUnarchiveTask}
        onPermanentlyDeleteTask={handlePermanentDeleteTask}
        onEmptyTrash={handleEmptyTrash}
        onOpenTaskDetail={(task, project) => {
          setActiveProjectId(project.id);
          setSelectedTaskProjectId(project.id);
          setSelectedTask(task);
        }}
        darkMode={darkMode}
      />

      {/* Global Toast Notifications (Top-Right Floating) */}
      <ToastNotificationContainer
        onOpenTask={handleOpenNotificationTask}
        darkMode={darkMode}
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
