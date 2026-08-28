import { ProjectPage, Task, TaskComment, TaskNotification, User } from '../types';
import { getSupabase } from '../lib/supabase';

const NOTIFICATIONS_STORAGE_KEY = 'notion_task_notifications_v1';

export const SAMPLE_NOTIFICATIONS: TaskNotification[] = [];

export const getStoredNotifications = (): TaskNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
  return [];
};

export const saveStoredNotifications = (notifications: TaskNotification[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
};

/**
 * Creates notifications for all followers, assignees, and reviewer (creator) of a task
 */
export const dispatchTaskEvent = ({
  project,
  task,
  actor,
  type,
  title,
  message,
}: {
  project: ProjectPage;
  task: Task;
  actor: User;
  type: TaskNotification['type'];
  title: string;
  message: string;
}): TaskNotification[] => {
  // Collect all stakeholders: followers + assignees + creator/reviewer
  const stakeholders = new Map<string, User>();

  if (task.creator && (task.creator.id || task.creator.email)) {
    stakeholders.set(task.creator.id || task.creator.email || '', task.creator);
  }

  (task.followers || []).forEach((u) => {
    if (u && (u.id || u.email)) {
      stakeholders.set(u.id || u.email || '', u);
    }
  });

  (task.assignees || []).forEach((u) => {
    if (u && (u.id || u.email)) {
      stakeholders.set(u.id || u.email || '', u);
    }
  });

  const newNotifications: TaskNotification[] = [];
  const now = new Date().toISOString();

  stakeholders.forEach((user, key) => {
    // Don't send notification to the actor themselves
    if (
      (actor.id && user.id === actor.id) ||
      (actor.email && user.email?.toLowerCase() === actor.email?.toLowerCase())
    ) {
      return;
    }

    newNotifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      recipientId: user.id || user.email || key,
      taskId: task.id,
      taskTitle: task.title,
      projectId: project.id,
      projectTitle: project.title,
      actor: {
        id: actor.id,
        name: actor.name,
        avatar: actor.avatar,
        email: actor.email,
      },
      type,
      title,
      message,
      createdAt: now,
      isRead: false,
    });
  });

  // If stakeholders empty, broadcast general entry
  if (stakeholders.size === 0) {
    newNotifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      recipientId: 'all',
      taskId: task.id,
      taskTitle: task.title,
      projectId: project.id,
      projectTitle: project.title,
      actor: {
        id: actor.id,
        name: actor.name,
        avatar: actor.avatar,
        email: actor.email,
      },
      type,
      title,
      message,
      createdAt: now,
      isRead: false,
    });
  }

  const current = getStoredNotifications();
  const updated = [...newNotifications, ...current].slice(0, 100);
  saveStoredNotifications(updated);

  // Broadcast to Supabase Realtime channel so all other devices/tabs get it
  const supabase = getSupabase();
  if (supabase && newNotifications.length > 0) {
    try {
      const channel = supabase.channel('workspace_realtime_broadcast');
      channel.send({
        type: 'broadcast',
        event: 'new_task_notification',
        payload: { notifications: newNotifications },
      });
    } catch (e) {
      // ignore
    }
  }

  // Dispatch custom window event so local components update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app_notifications_updated', { detail: updated }));
    
    if (newNotifications.length > 0) {
      window.dispatchEvent(new CustomEvent('app_show_toast', { detail: newNotifications[0] }));
    }
  }

  return updated;
};

/**
 * Manually trigger a standalone toast notification
 */
export const triggerToast = (toastData: {
  title: string;
  message: string;
  type?: TaskNotification['type'];
  taskTitle?: string;
  projectTitle?: string;
  taskId?: string;
  projectId?: string;
  actor?: {
    name: string;
    avatar?: string;
    email?: string;
  };
}) => {
  if (typeof window !== 'undefined') {
    const notif: TaskNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: 'all',
      taskId: toastData.taskId || '',
      taskTitle: toastData.taskTitle || '',
      projectId: toastData.projectId || '',
      projectTitle: toastData.projectTitle || '',
      actor: toastData.actor ? {
        id: 'actor',
        name: toastData.actor.name,
        avatar: toastData.actor.avatar,
        email: toastData.actor.email,
      } : {
        id: 'system',
        name: 'Hệ thống',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      type: toastData.type || 'property_change',
      title: toastData.title,
      message: toastData.message,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    window.dispatchEvent(new CustomEvent('app_show_toast', { detail: notif }));
  }
};

/**
 * Format notification timestamp into relative readable Vietnamese time
 */
export const formatNotificationTime = (isoString: string): string => {
  try {
    const notifTime = new Date(isoString).getTime();
    const now = Date.now();
    const diffSeconds = Math.max(0, Math.floor((now - notifTime) / 1000));

    if (diffSeconds < 60) return 'Vừa xong';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;

    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return 'Vừa xong';
  }
};
