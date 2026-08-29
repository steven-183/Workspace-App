import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { ProjectPage, Task, User, TeamId } from '../types';

const ENV_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const ENV_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

const CUSTOM_URL_KEY = 'custom_supabase_url';
const CUSTOM_ANON_KEY = 'custom_supabase_anon_key';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(CUSTOM_URL_KEY) || '' : '';
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(CUSTOM_ANON_KEY) || '' : '';

  const url = customUrl.trim() || ENV_URL.trim();
  const anonKey = customKey.trim() || ENV_KEY.trim();
  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return { url, anonKey, isConfigured };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(CUSTOM_URL_KEY, url.trim());
    else localStorage.removeItem(CUSTOM_URL_KEY);

    if (anonKey) localStorage.setItem(CUSTOM_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(CUSTOM_ANON_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const key = `${url}_${anonKey}`;
  if (!supabaseInstance || currentConfigKey !== key) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentConfigKey = key;
  }
  return supabaseInstance;
}

// Convert Supabase Auth user to App User
export function mapSupabaseUser(authUser: SupabaseAuthUser): User {
  const metadata = authUser.user_metadata || {};
  const fullName = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User';
  const avatar = metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=2383e2`;

  return {
    id: authUser.id,
    name: fullName,
    email: authUser.email || '',
    avatar,
    color: '#2383e2',
  };
}

// Auth API
export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { user: null, error: 'Chưa cấu hình Supabase URL và API Key.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=2383e2`,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.session && data.user) {
      const appUser = mapSupabaseUser(data.user);
      upsertUserProfile(appUser).catch(() => {});
      return { user: appUser, error: null };
    }

    if (data.user) {
      // User created but requires email confirmation
      return { 
        user: null, 
        error: 'Tài khoản đã tạo thành công! Vui lòng kiểm tra hộp thư email (hoặc mục Spam) để bấm link xác thực trước khi đăng nhập, hoặc tắt "Confirm email" trên Supabase Dashboard.' 
      };
    }

    return { user: null, error: 'Vui lòng kiểm tra email để xác thực tài khoản.' };
  } catch (err: any) {
    return { user: null, error: err.message || 'Lỗi khi đăng ký' };
  }
}

export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Chưa cấu hình Supabase URL và API Key.' };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khi gửi lại email xác nhận' };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { user: null, error: 'Chưa cấu hình Supabase URL và API Key.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      const appUser = mapSupabaseUser(data.user);
      upsertUserProfile(appUser).catch(() => {});
      return { user: appUser, error: null };
    }

    return { user: null, error: 'Đăng nhập không thành công.' };
  } catch (err: any) {
    return { user: null, error: err.message || 'Lỗi khi đăng nhập' };
  }
}

export async function signOutSupabase(): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getCurrentSupabaseUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const user = mapSupabaseUser(data.user);
      // Background sync user to profiles table
      upsertUserProfile(user).catch(() => {});
      return user;
    }
  } catch (err) {
    console.error('Error fetching Supabase user:', err);
  }
  return null;
}

// User Profiles API
export async function fetchProfilesFromSupabase(): Promise<User[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      name: row.full_name || row.name || row.email?.split('@')[0] || 'User',
      email: row.email || '',
      avatar: row.avatar_url || row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.full_name || row.name || 'User')}&backgroundColor=2383e2`,
      color: row.color || '#2383e2',
    }));
  } catch (err) {
    console.warn('Profiles fetch notice:', err);
    return [];
  }
}

export async function upsertUserProfile(user: User): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !user || !user.id) return;

  try {
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: user.name,
        email: user.email || '',
        avatar_url: user.avatar || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    // Ignore error if profiles table is not created yet
  }
}

// Database API: Projects & Tasks
export async function fetchAllProjectsFromSupabase(): Promise<ProjectPage[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: projectsData, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (projError) {
      console.warn('Supabase projects fetch warning:', projError);
      return null;
    }

    const { data: tasksData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('order', { ascending: true });

    if (taskError) {
      console.warn('Supabase tasks fetch warning:', taskError);
      return null;
    }

    const allTasks: Task[] = (tasksData || []).map((row: any) => ({
      id: row.id,
      title: row.title || 'Không có tiêu đề',
      description: row.description || '',
      status: row.status || 'todo',
      priority: row.priority || 'none',
      startDate: row.start_date || row.startDate || '',
      dueDate: row.due_date || row.dueDate || '',
      startTime: row.start_time || row.startTime || undefined,
      dueTime: row.due_time || row.dueTime || undefined,
      assignees: row.assignees || [],
      creator: row.creator || undefined,
      followers: row.followers || [],
      tags: row.tags || [],
      progress: row.progress || 0,
      subtasks: row.subtasks || [],
      blocks: row.blocks || [],
      comments: row.comments || [],
      attachments: row.attachments || [],
      activityLogs: row.activity_logs || row.activityLogs || [],
      isArchived: Boolean(row.is_archived || row.isArchived),
      isDeleted: Boolean(row.is_deleted || row.isDeleted),
      deletedAt: row.deleted_at || row.deletedAt || undefined,
      coverImage: row.cover_image,
      icon: row.icon,
      createdAt: row.created_at || row.createdAt || '',
      updatedAt: row.updated_at || row.updatedAt || '',
      order: row.order || 1,
    }));

    const result: ProjectPage[] = (projectsData || []).map((row: any) => {
      const pTasks = allTasks.filter((t: any) => {
        const rawTask = (tasksData || []).find((r: any) => r.id === t.id);
        return rawTask?.project_id === row.id;
      });

      const cat = (row.category || '').toLowerCase().trim();
      const t = (row.title || '').toLowerCase().trim();
      let derivedTeamId: TeamId = 'product';
      if (
        cat === 'book growth' ||
        cat.includes('book') ||
        cat.includes('sách') ||
        t.includes('sách') ||
        t.includes('book') ||
        t.includes('độc giả') ||
        t.includes('bản quyền')
      ) {
        derivedTeamId = 'book_growth';
      } else if (
        cat === 'performance marketing' ||
        cat.includes('performance') ||
        cat.includes('marketing') ||
        cat.includes('ads') ||
        t.includes('performance') ||
        t.includes('marketing') ||
        t.includes('ads')
      ) {
        derivedTeamId = 'performance_marketing';
      }

      return {
        id: row.id,
        title: row.title,
        icon: row.icon || '📋',
        coverImage: row.cover_image,
        description: row.description || '',
        category: row.category || 'Dự án',
        teamId: (row.team_id as TeamId) || derivedTeamId,
        isFavorite: row.is_favorite || false,
        views: row.views || ['kanban', 'timeline', 'table', 'calendar', 'list'],
        activeView: row.active_view || 'kanban',
        columns: row.columns || [],
        createdAt: row.created_at || '',
        tasks: pTasks,
      };
    });

    return result;
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

export async function syncProjectToSupabase(project: ProjectPage): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    // Upsert project row
    await supabase.from('projects').upsert(
      {
        id: project.id,
        user_id: userId,
        title: project.title,
        icon: project.icon,
        description: project.description,
        category: project.category || 'Dự án',
        is_favorite: project.isFavorite,
        views: project.views,
        active_view: project.activeView,
        columns: project.columns,
      },
      { onConflict: 'id' }
    );

    // Upsert all tasks in this project
    if (project.tasks && project.tasks.length > 0) {
      const taskRows = project.tasks.map((t) => ({
        id: t.id,
        project_id: project.id,
        title: t.title || 'Không có tiêu đề',
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        start_date: t.startDate ? t.startDate : null,
        due_date: t.dueDate ? t.dueDate : null,
        start_time: t.startTime || null,
        due_time: t.dueTime || null,
        progress: t.progress || 0,
        order: t.order || 1,
        assignees: t.assignees || [],
        creator: t.creator || null,
        followers: t.followers || [],
        tags: t.tags || [],
        subtasks: t.subtasks || [],
        blocks: t.blocks || [],
        comments: t.comments || [],
        attachments: t.attachments || [],
        activity_logs: t.activityLogs || [],
        is_archived: Boolean(t.isArchived),
        is_deleted: Boolean(t.isDeleted),
        deleted_at: t.deletedAt || null,
        cover_image: t.coverImage || null,
        icon: t.icon || null,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Error syncing project to Supabase:', err);
  }
}

export async function deleteProjectFromSupabase(projectId: string, tasksToTrash?: Task[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const now = new Date().toISOString();
    // Update all tasks of this project to be marked as deleted (moved to trash)
    await supabase
      .from('tasks')
      .update({ is_deleted: true, deleted_at: now })
      .eq('project_id', projectId);

    // If specific tasks were supplied, ensure their state is upserted
    if (tasksToTrash && tasksToTrash.length > 0) {
      const taskRows = tasksToTrash.map((t) => ({
        id: t.id,
        project_id: projectId,
        title: t.title || 'Không có tiêu đề',
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        start_date: t.startDate ? t.startDate : null,
        due_date: t.dueDate ? t.dueDate : null,
        start_time: t.startTime || null,
        due_time: t.dueTime || null,
        progress: t.progress || 0,
        order: t.order || 1,
        assignees: t.assignees || [],
        creator: t.creator || null,
        followers: t.followers || [],
        tags: t.tags || [],
        subtasks: t.subtasks || [],
        blocks: t.blocks || [],
        comments: t.comments || [],
        attachments: t.attachments || [],
        activity_logs: t.activityLogs || [],
        is_archived: Boolean(t.isArchived),
        is_deleted: true,
        deleted_at: t.deletedAt || now,
        cover_image: t.coverImage || null,
        icon: t.icon || null,
        updated_at: now,
      }));
      await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });
    }

    // Delete project from projects table
    await supabase.from('projects').delete().eq('id', projectId);
  } catch (err) {
    console.error('Error deleting project from Supabase:', err);
  }
}

export async function syncTaskToSupabase(projectId: string, task: Task, projectInfo?: Partial<ProjectPage>): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const payload = {
      id: task.id,
      project_id: projectId,
      title: task.title || 'Không có tiêu đề',
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      start_date: task.startDate ? task.startDate : null,
      due_date: task.dueDate ? task.dueDate : null,
      start_time: task.startTime || null,
      due_time: task.dueTime || null,
      progress: task.progress || 0,
      order: task.order || 1,
      assignees: task.assignees || [],
      creator: task.creator || null,
      followers: task.followers || [],
      tags: task.tags || [],
      subtasks: task.subtasks || [],
      blocks: task.blocks || [],
      comments: task.comments || [],
      attachments: task.attachments || [],
      activity_logs: task.activityLogs || [],
      is_archived: Boolean(task.isArchived),
      is_deleted: Boolean(task.isDeleted),
      deleted_at: task.deletedAt || null,
      cover_image: task.coverImage || null,
      icon: task.icon || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase tasks upsert error, attempting recovery:', error);
      // If foreign key constraint on project_id or project row missing
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('project_id') || error.message?.includes('projects')) {
        await supabase.from('projects').upsert({
          id: projectId,
          title: projectInfo?.title || 'Bảng công việc',
          category: projectInfo?.category || 'Dự án',
          team_id: projectInfo?.teamId || 'product',
          views: projectInfo?.views || ['kanban', 'timeline', 'table', 'calendar'],
          active_view: projectInfo?.activeView || 'kanban',
          columns: projectInfo?.columns || [],
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.error('Error syncing task to Supabase:', err);
  }
}

// Smart merger for local and remote projects to prevent data loss on refresh
export function mergeProjectsWithRemote(localProjects: ProjectPage[], remoteProjects: ProjectPage[]): ProjectPage[] {
  if (!remoteProjects || remoteProjects.length === 0) return localProjects || [];
  if (!localProjects || localProjects.length === 0) return remoteProjects;

  const remoteMap = new Map<string, ProjectPage>();
  remoteProjects.forEach((rp) => remoteMap.set(rp.id, rp));

  const mergedProjects: ProjectPage[] = [];

  // 1. Process all local projects
  localProjects.forEach((lp) => {
    const rp = remoteMap.get(lp.id);
    if (!rp) {
      // Exists locally only -> keep it and re-sync to remote
      mergedProjects.push(lp);
      syncProjectToSupabase(lp);
      return;
    }

    // Exists in both: merge tasks safely
    const taskMap = new Map<string, Task>();
    // Add remote tasks
    (rp.tasks || []).forEach((t) => taskMap.set(t.id, t));

    // Overlay local tasks (keep any local task that doesn't exist in remote or has newer updates)
    (lp.tasks || []).forEach((lt) => {
      const rt = taskMap.get(lt.id);
      if (!rt) {
        // Task created locally that hasn't synced or was missing from remote
        taskMap.set(lt.id, lt);
        syncTaskToSupabase(lp.id, lt, lp);
      } else {
        // Both exist: pick the newer one
        const localTime = new Date(lt.updatedAt || lt.createdAt || 0).getTime();
        const remoteTime = new Date(rt.updatedAt || rt.createdAt || 0).getTime();
        if (localTime >= remoteTime) {
          taskMap.set(lt.id, lt);
        }
      }
    });

    mergedProjects.push({
      ...rp,
      teamId: lp.teamId || rp.teamId,
      category: lp.category || rp.category,
      isDeleted: lp.isDeleted !== undefined ? lp.isDeleted : rp.isDeleted,
      tasks: Array.from(taskMap.values()),
    });

    remoteMap.delete(lp.id);
  });

  // 2. Add any remaining remote projects that weren't in local
  remoteMap.forEach((rp) => {
    mergedProjects.push(rp);
  });

  return mergedProjects;
}

export async function deleteTaskFromSupabase(taskId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.warn('Supabase deleteTask warning:', error);
    }
  } catch (err) {
    console.error('Error deleting task from Supabase:', err);
  }
}
