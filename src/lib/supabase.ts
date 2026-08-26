import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { ProjectPage, Task, User } from '../types';

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
      return { user: mapSupabaseUser(data.user), error: null };
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
      return { user: mapSupabaseUser(data.user), error: null };
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
      return mapSupabaseUser(data.user);
    }
  } catch (err) {
    console.error('Error fetching Supabase user:', err);
  }
  return null;
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
      title: row.title,
      status: row.status,
      priority: row.priority || 'none',
      startDate: row.start_date || row.startDate || '',
      dueDate: row.due_date || row.dueDate || '',
      assignees: row.assignees || [],
      tags: row.tags || [],
      progress: row.progress || 0,
      subtasks: row.subtasks || [],
      blocks: row.blocks || [],
      coverImage: row.cover_image,
      icon: row.icon,
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
      order: row.order || 1,
    }));

    const result: ProjectPage[] = (projectsData || []).map((row: any) => {
      const pTasks = allTasks.filter((t: any) => {
        const rawTask = (tasksData || []).find((r: any) => r.id === t.id);
        return rawTask?.project_id === row.id;
      });

      return {
        id: row.id,
        title: row.title,
        icon: row.icon || '📋',
        coverImage: row.cover_image,
        description: row.description || '',
        category: row.category || 'Dự án',
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
        title: t.title,
        status: t.status,
        priority: t.priority,
        start_date: t.startDate,
        due_date: t.dueDate,
        progress: t.progress,
        order: t.order,
        assignees: t.assignees || [],
        tags: t.tags || [],
        subtasks: t.subtasks || [],
        blocks: t.blocks || [],
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });
    }
  } catch (err) {
    console.error('Error syncing project to Supabase:', err);
  }
}

export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('tasks').delete().eq('project_id', projectId);
    await supabase.from('projects').delete().eq('id', projectId);
  } catch (err) {
    console.error('Error deleting project from Supabase:', err);
  }
}

export async function syncTaskToSupabase(projectId: string, task: Task): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('tasks').upsert(
      {
        id: task.id,
        project_id: projectId,
        title: task.title,
        status: task.status,
        priority: task.priority,
        start_date: task.startDate,
        due_date: task.dueDate,
        progress: task.progress,
        order: task.order,
        assignees: task.assignees || [],
        tags: task.tags || [],
        subtasks: task.subtasks || [],
        blocks: task.blocks || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Error syncing task to Supabase:', err);
  }
}

export async function deleteTaskFromSupabase(taskId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('tasks').delete().eq('id', taskId);
  } catch (err) {
    console.error('Error deleting task from Supabase:', err);
  }
}
