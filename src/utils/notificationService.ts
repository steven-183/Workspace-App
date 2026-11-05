import { ProjectPage, Task, TaskComment, TaskNotification, User } from '../types';
import { getSupabase, broadcastTaskNotifications } from '../lib/supabase';

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
  // Collect all stakeholders: reviewer/creator + assignees + followers
  const stakeholders = new Map<string, User>();

  if (task.creator && (task.creator.id || task.creator.email)) {
    const key = task.creator.id || task.creator.email || '';
    stakeholders.set(key, task.creator);
  }

  (task.assignees || []).forEach((u) => {
    if (u && (u.id || u.email)) {
      const key = u.id || u.email || '';
      stakeholders.set(key, u);
    }
  });

  (task.followers || []).forEach((u) => {
    if (u && (u.id || u.email)) {
      const key = u.id || u.email || '';
      stakeholders.set(key, u);
    }
  });

  const newNotifications: TaskNotification[] = [];
  const now = new Date().toISOString();

  stakeholders.forEach((user, key) => {
    // Deliver notification to every stakeholder (creator, assignees, followers)
    // If user is the actor themselves in local turn, we still generate notification so it shows in their inbox history, or delivers across all stakeholder devices
    const isActorThemselves = Boolean(
      (actor.id && user.id === actor.id) ||
      (actor.email && user.email?.toLowerCase() === actor.email?.toLowerCase())
    );

    newNotifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      recipientId: user.id || user.email || key,
      recipientEmail: user.email,
      recipientName: user.name,
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

  // Broadcast to Supabase Realtime channel so all other devices and colleagues receive it!
  broadcastTaskNotifications(newNotifications).catch(() => {});

  // Dispatch custom window event so local components update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app_notifications_updated', { detail: updated }));
    
    // Only fire browser desktop notification locally if document is hidden or user assigned themselves
    if (newNotifications.length > 0 && typeof document !== 'undefined' && document.hidden) {
      const myNotif = newNotifications.find((n) => {
        return (
          (actor.id && n.recipientId === actor.id) ||
          (actor.email && n.recipientEmail?.toLowerCase() === actor.email.toLowerCase())
        );
      });
      if (myNotif) {
        sendBrowserNotification(myNotif.title || 'Thông báo công việc', {
          body: myNotif.message,
          tag: myNotif.id,
          taskId: myNotif.taskId,
          projectId: myNotif.projectId,
        });
      }
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
      },
      type: toastData.type || 'property_change',
      title: toastData.title,
      message: toastData.message,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    window.dispatchEvent(new CustomEvent('app_show_toast', { detail: notif }));
    
    // Also trigger browser notification if document is hidden (user in other tab)
    if (typeof document !== 'undefined' && document.hidden) {
      sendBrowserNotification(toastData.title, {
        body: toastData.message,
        tag: notif.id,
        taskId: toastData.taskId,
        projectId: toastData.projectId,
      });
    }
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

/**
 * Browser / Desktop Push Notifications (Web Notification API)
 */
export const isBrowserNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getBrowserNotificationPermission = (): NotificationPermission => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return 'denied';
    }
  }
  return 'denied';
};

export const sendBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    tag?: string;
    taskId?: string;
    projectId?: string;
    icon?: string;
  }
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body: options?.body || '',
      icon: options?.icon || 'https://api.dicebear.com/7.x/identicon/svg?seed=qanda_noti',
      tag: options?.tag,
    });

    notif.onclick = () => {
      window.focus();
      if (options?.projectId && options?.taskId) {
        window.dispatchEvent(
          new CustomEvent('app_navigate_to_task', {
            detail: { projectId: options.projectId, taskId: options.taskId },
          })
        );
      }
      notif.close();
    };
  } catch (err) {
    console.warn('Failed to send browser notification:', err);
  }
};
