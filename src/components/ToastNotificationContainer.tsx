import React, { useState, useEffect } from 'react';
import { TaskNotification } from '../types';
import { formatNotificationTime } from '../utils/notificationService';
import { 
  Bell, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Tag, 
  X, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ToastItem extends TaskNotification {
  timeoutId?: any;
}

interface ToastNotificationContainerProps {
  onOpenTask: (projectId: string, taskId: string) => void;
  darkMode: boolean;
}

export const ToastNotificationContainer: React.FC<ToastNotificationContainerProps> = ({
  onOpenTask,
  darkMode,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<TaskNotification>;
      if (!customEvent.detail) return;

      const newNotif = customEvent.detail;
      const toastId = newNotif.id || `toast-${Date.now()}`;

      setToasts((prev) => {
        // Prevent duplicate spam within 1 second
        if (prev.some((t) => t.id === toastId)) return prev;

        const item: ToastItem = { ...newNotif, id: toastId };
        return [item, ...prev].slice(0, 4); // Max 4 toasts on screen
      });

      // Auto dismiss after 5.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5500);
    };

    window.addEventListener('app_show_toast', handleShowToast);
    return () => {
      window.removeEventListener('app_show_toast', handleShowToast);
    };
  }, []);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getEventIcon = (type: TaskNotification['type']) => {
    switch (type) {
      case 'assigned':
        return <UserPlus size={13} className="text-blue-500" />;
      case 'comment':
        return <MessageSquare size={13} className="text-emerald-500" />;
      case 'status_change':
        return <Clock size={13} className="text-purple-500" />;
      case 'property_change':
      default:
        return <Tag size={13} className="text-amber-500" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div 
      id="toast-notification-container"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0"
    >
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            onClick={() => {
              if (toast.projectId && toast.taskId) {
                onOpenTask(toast.projectId, toast.taskId);
                handleDismiss(toast.id);
              }
            }}
            className={`pointer-events-auto w-full p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-200 transform translate-y-0 hover:scale-[1.02] animate-in slide-in-from-top-4 fade-in ${
              darkMode
                ? 'bg-[#202020]/95 border-[#383838] text-[#e0e0e0] hover:border-[#555]'
                : 'bg-white/95 border-[#e2e1de] text-[#37352f] hover:border-[#bbb]'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar or Event Icon */}
              <div className="relative shrink-0 mt-0.5">
                {toast.actor?.avatar ? (
                  <img
                    src={toast.actor.avatar}
                    alt={toast.actor.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl object-cover border border-black/10 dark:border-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                    <Bell size={16} />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a1a1a] shadow-xs flex items-center justify-center border border-black/5 dark:border-white/10">
                  {getEventIcon(toast.type)}
                </div>
              </div>

              {/* Toast Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#37352f] dark:text-white truncate">
                    {toast.title}
                  </span>
                  <span className="text-[10px] text-[#9b9a97] shrink-0 font-medium">
                    {formatNotificationTime(toast.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-[#5a5a58] dark:text-[#b5b5b5] line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>

                {toast.taskTitle && (
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-[#2383e2] dark:text-blue-400 font-medium truncate">
                    <ExternalLink size={10} className="shrink-0" />
                    <span className="truncate">{toast.taskTitle}</span>
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={(e) => handleDismiss(toast.id, e)}
                className={`p-1 rounded-lg transition-colors shrink-0 text-[#9b9a97] ${
                  darkMode ? 'hover:bg-[#333] hover:text-white' : 'hover:bg-[#eee] hover:text-black'
                }`}
                title="Đóng thông báo"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
