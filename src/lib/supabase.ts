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

// Set of known unsupported columns for each table to avoid repeated PGRST204 retries
const KNOWN_UNSUPPORTED_COLUMNS = new Map<string, Set<string>>();

export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// Adaptive Upsert helper: dynamically strips non-existent columns if schema cache lacks them (PGRST204)
// and caches missing column names so subsequent requests succeed instantly in a single roundtrip.
export async function adaptiveUpsert(
  supabase: any,
  table: string,
  data: Record<string, any>,
  onConflict: string = 'id'
): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!KNOWN_UNSUPPORTED_COLUMNS.has(table)) {
    KNOWN_UNSUPPORTED_COLUMNS.set(table, new Set<string>());
  }
  const unsupported = KNOWN_UNSUPPORTED_COLUMNS.get(table)!;

  // Clone payload and remove previously discovered missing columns
  const currentPayload: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!unsupported.has(key)) {
      currentPayload[key] = value;
    }
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    const { data: resData, error } = await supabase
      .from(table)
      .upsert(currentPayload, { onConflict });

    if (!error) {
      return { success: true, data: resData };
    }

    // Check for PostgREST PGRST204 missing column error
    // e.g.: "Could not find the 'description' column of 'tasks' in the schema cache"
    const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/i);
    if (missingColMatch && missingColMatch[1]) {
      const colName = missingColMatch[1];
      unsupported.add(colName);
      console.warn(`[Supabase Adaptive] Cached missing column '${colName}' on '${table}'. Retrying...`);
      delete currentPayload[colName];
      continue;
    }

    // Check for Postgres column does not exist error
    const pgColMatch = error.message?.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
    if (pgColMatch && pgColMatch[1]) {
      const colName = pgColMatch[1];
      unsupported.add(colName);
      console.warn(`[Supabase Adaptive] Cached missing column '${colName}' on '${table}'. Retrying...`);
      delete currentPayload[colName];
      continue;
    }

    // If foreign key constraint or other error, return failure
    return { success: false, error };
  }

  return { success: false, error: new Error('Max adaptive upsert attempts reached') };
}

export async function upsertUserProfile(user: User): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !user || !user.id) return;

  try {
    await adaptiveUpsert(supabase, 'profiles', {
      id: user.id,
      full_name: user.name,
      email: user.email || '',
      avatar_url: user.avatar || '',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Ignore error if profiles table is not created yet
  }
}

function safeJsonParse<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return val as T;
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
      .select('*');

    if (taskError) {
      console.warn('Supabase tasks fetch warning:', taskError);
      return null;
    }

    const allTasks: Task[] = (tasksData || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || 'Không có tiêu đề',
      description: row.description || '',
      status: row.status || 'todo',
      priority: row.priority || 'none',
      startDate: row.start_date || row.startDate || '',
      dueDate: row.due_date || row.dueDate || '',
      startTime: row.start_time || row.startTime || undefined,
      dueTime: row.due_time || row.dueTime || undefined,
      assignees: safeJsonParse(row.assignees, []),
      creator: safeJsonParse(row.creator, undefined),
      followers: safeJsonParse(row.followers, []),
      tags: safeJsonParse(row.tags, []),
      progress: typeof row.progress === 'number' ? row.progress : 0,
      subtasks: safeJsonParse(row.subtasks, []),
      blocks: safeJsonParse(row.blocks, []),
      comments: safeJsonParse(row.comments, []),
      attachments: safeJsonParse(row.attachments, []),
      activityLogs: safeJsonParse(row.activity_logs || row.activityLogs, []),
      isArchived: Boolean(row.is_archived || row.isArchived),
      isDeleted: Boolean(row.is_deleted || row.isDeleted),
      deletedAt: row.deleted_at || row.deletedAt || undefined,
      coverImage: row.cover_image,
      icon: row.icon,
      createdAt: row.created_at || row.createdAt || '',
      updatedAt: row.updated_at || row.updatedAt || '',
      order: typeof row.order === 'number' ? row.order : 1,
    }));

    const result: ProjectPage[] = (projectsData || []).map((row: any) => {
      const pTasks = allTasks.filter((t: any) => {
        const rawTask = (tasksData || []).find((r: any) => String(r.id) === String(t.id));
        return String(rawTask?.project_id) === String(row.id);
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
        id: String(row.id),
        title: row.title,
        icon: row.icon || '📋',
        coverImage: row.cover_image,
        description: row.description || '',
        category: row.category || 'Dự án',
        teamId: (row.team_id as TeamId) || derivedTeamId,
        isFavorite: row.is_favorite || false,
        views: safeJsonParse(row.views, ['kanban', 'timeline', 'table', 'calendar']),
        activeView: row.active_view || 'kanban',
        columns: safeJsonParse(row.columns, []),
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
    const userId = authData?.user?.id;

    const projectPayload: any = {
      id: String(project.id),
      title: project.title,
      icon: project.icon || '📋',
      description: project.description || '',
      category: project.category || 'Dự án',
      team_id: project.teamId || 'product',
      is_favorite: Boolean(project.isFavorite),
      views: project.views || ['kanban', 'timeline', 'table', 'calendar'],
      active_view: project.activeView || 'kanban',
      columns: project.columns || [],
    };

    // Only attach user_id if it's a valid Postgres UUID format
    if (isValidUUID(userId)) {
      projectPayload.user_id = userId;
    }

    await adaptiveUpsert(supabase, 'projects', projectPayload);
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
      for (const t of tasksToTrash) {
        await syncTaskToSupabase(projectId, { ...t, isDeleted: true, deletedAt: now });
      }
    }

    // Delete project from projects table
    await supabase.from('projects').delete().eq('id', projectId);
  } catch (err) {
    console.error('Error deleting project from Supabase:', err);
  }
}

export async function syncTaskToSupabase(projectId: string, task: Task, projectInfo?: Partial<ProjectPage>): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !task) return;

  try {
    const progressVal = typeof task.progress === 'number' && !isNaN(task.progress) 
      ? Math.max(0, Math.min(100, Math.round(task.progress))) 
      : 0;
      
    const orderVal = typeof task.order === 'number' && !isNaN(task.order)
      ? Math.round(task.order)
      : 1;

    const fullPayload: any = {
      id: String(task.id),
      project_id: String(projectId),
      title: task.title || 'Không có tiêu đề',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'none',
      start_date: task.startDate ? String(task.startDate) : null,
      due_date: task.dueDate ? String(task.dueDate) : null,
      start_time: task.startTime || null,
      due_time: task.dueTime || null,
      progress: progressVal,
      order: orderVal,
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

    let result = await adaptiveUpsert(supabase, 'tasks', fullPayload);

    // If foreign key constraint on project_id missing
    if (!result.success && result.error) {
      const err = result.error;
      if (err.code === '23503' || err.message?.includes('foreign key') || err.message?.includes('project_id') || err.message?.includes('projects')) {
        console.warn('Creating missing parent project in Supabase for task:', projectId);
        await adaptiveUpsert(supabase, 'projects', {
          id: String(projectId),
          title: projectInfo?.title || 'Bảng công việc',
          category: projectInfo?.category || 'Dự án',
          team_id: projectInfo?.teamId || 'product',
          views: projectInfo?.views || ['kanban', 'timeline', 'table', 'calendar'],
          active_view: projectInfo?.activeView || 'kanban',
          columns: projectInfo?.columns || [],
          created_at: new Date().toISOString(),
        });

        result = await adaptiveUpsert(supabase, 'tasks', fullPayload);
      }
    }

    if (!result.success) {
      console.warn('Notice syncing task to Supabase:', result.error?.message);
    }
  } catch (err) {
    console.error('Error syncing task to Supabase:', err);
  }
}

// Smart pure merger for local and remote projects to prevent data loss on refresh
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
      // Exists locally only -> preserve local project
      mergedProjects.push(lp);
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
        // Local task not yet reflected in remote fetch
        taskMap.set(lt.id, lt);
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
