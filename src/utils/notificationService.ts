import { ProjectPage, Task, TaskComment, TaskNotification, User } from '../types';

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
 * Creates notifications for all followers and assignees of a task
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
  // Collect all stakeholders: followers + assignees
  const stakeholders = new Map<string, User>();

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

  // If newly assigned in the event, also make sure they are included
  const newNotifications: TaskNotification[] = [];
  const now = new Date().toISOString();

  stakeholders.forEach((user, key) => {
    // Don't send notification to the person who performed the action if they are the actor
    if (
      (actor.id && user.id === actor.id) ||
      (actor.email && user.email?.toLowerCase() === actor.email.toLowerCase())
    ) {
      return;
    }

    newNotifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      recipientId: key,
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

  // Also create a broadcast/general notification entry if stakeholders empty
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
  const updated = [...newNotifications, ...current].slice(0, 100); // keep up to 100 recent
  saveStoredNotifications(updated);

  // Dispatch custom window event so any listening component can update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app_notifications_updated', { detail: updated }));
  }

  return updated;
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
