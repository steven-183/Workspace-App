import React, { useState, useRef, useEffect } from 'react';
import { TaskNotification, User } from '../types';
import { formatNotificationTime } from '../utils/notificationService';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Tag, 
  AlertCircle, 
  X, 
  ExternalLink,
  Sparkles,
  Inbox
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: TaskNotification[];
  currentUser: User | null;
  onOpenTask: (projectId: string, taskId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (notificationId: string) => void;
  triggerVariant?: 'icon' | 'sidebar_row';
  align?: 'left' | 'right';
  darkMode: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUser,
  onOpenTask,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  triggerVariant = 'icon',
  align = 'right',
  darkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications relevant to the current user (if logged in), or all notifications
  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return true;
    return (
      n.recipientId === 'all' ||
      n.recipientId === currentUser.id ||
      n.recipientId === currentUser.email ||
      (currentUser.email && n.recipientId?.toLowerCase() === currentUser.email.toLowerCase())
    );
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const displayList = filterMode === 'unread' 
    ? userNotifications.filter((n) => !n.isRead)
    : userNotifications;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getEventIcon = (type: TaskNotification['type']) => {
    switch (type) {
      case 'assigned':
        return <UserPlus size={12} className="text-blue-500" />;
      case 'comment':
        return <MessageSquare size={12} className="text-emerald-500" />;
      case 'status_change':
        return <Clock size={12} className="text-purple-500" />;
      case 'property_change':
      default:
        return <Tag size={12} className="text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button based on variant */}
      {triggerVariant === 'sidebar_row' ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors select-none ${
            isOpen
              ? (darkMode ? 'bg-[#333] text-white' : 'bg-[#e8e7e4] text-[#37352f]')
              : (darkMode ? 'hover:bg-[#2c2c2c] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#5a5a58]')
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell size={14} className={unreadCount > 0 ? 'text-[#2383e2]' : ''} />
            <span>Thông báo</span>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#2383e2] text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all flex items-center justify-center select-none ${
            isOpen
              ? (darkMode ? 'bg-[#333] text-white' : 'bg-white shadow-xs text-[#2383e2] border border-[#e3e2e0]')
              : (darkMode ? 'hover:bg-[#2c2c2c] text-[#a3a3a3]' : 'hover:bg-[#ebeae7] text-[#787774]')
          }`}
          title="Trung tâm thông báo"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2383e2] text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Popover Panel */}
      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
          darkMode ? 'bg-[#202020] border-[#333] text-[#dedede]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
        }`}>
          {/* Header */}
          <div className={`p-3.5 border-b flex items-center justify-between ${
            darkMode ? 'border-[#2d2d2d] bg-[#1a1a1a]' : 'border-[#f1f1ef] bg-[#fbfbfa]'
          }`}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Bell size={15} className="text-[#2383e2]" />
                <span>Thông báo</span>
              </h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2383e2]">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2 py-1 text-[11px] text-[#2383e2] hover:underline font-medium flex items-center gap-1"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck size={13} />
                  <span>Đọc tất cả</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg text-[#9b9a97] transition-colors ${
                  darkMode ? 'hover:bg-[#2c2c2c] hover:text-white' : 'hover:bg-[#f1f1ef] hover:text-[#37352f]'
                }`}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className={`px-3 py-2 border-b flex items-center gap-2 text-xs ${
            darkMode ? 'border-[#2d2d2d] bg-[#1d1d1d]' : 'border-[#f1f1ef] bg-[#fafafa]'
          }`}>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all'
                  ? (darkMode ? 'bg-[#333] text-white' : 'bg-white shadow-xs text-[#37352f] font-semibold')
                  : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              Tất cả ({userNotifications.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'unread'
                  ? (darkMode ? 'bg-[#333] text-white' : 'bg-white shadow-xs text-[#37352f] font-semibold')
                  : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f1f1ef] dark:divide-[#2d2d2d] no-scrollbar">
            {displayList.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#2383e2] flex items-center justify-center mx-auto mb-2.5">
                  <Inbox size={22} />
                </div>
                <div className="text-xs font-semibold text-[#37352f] dark:text-[#ddd]">
                  {filterMode === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </div>
                <p className="text-[11px] text-[#9b9a97] mt-1 max-w-[220px] mx-auto leading-relaxed">
                  Khi bạn được giao việc mới, có người bình luận hoặc công việc bạn theo dõi có thay đổi, thông báo sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              displayList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    onOpenTask(notif.projectId, notif.taskId);
                    setIsOpen(false);
                  }}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                    !notif.isRead 
                      ? (darkMode ? 'bg-[#282828] hover:bg-[#2f2f2f]' : 'bg-blue-50/40 hover:bg-blue-50/80') 
                      : (darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#f7f6f3]')
                  }`}
                >
                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-[#2383e2]" />
                  )}

                  {/* Actor Avatar with Event badge */}
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      src={notif.actor.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(notif.actor.name)}&backgroundColor=2383e2`}
                      alt={notif.actor.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#2a2a2a] shadow-xs flex items-center justify-center">
                      {getEventIcon(notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold truncate text-[#37352f] dark:text-white">
                        {notif.actor.name}
                      </span>
                      <span className="text-[10px] text-[#9b9a97] shrink-0 font-mono">
                        {formatNotificationTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#5a5a58] dark:text-[#bbb] leading-relaxed mb-1.5">
                      {notif.message}
                    </p>

                    {/* Task & Project tag */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#2383e2] font-medium truncate">
                      <span className="truncate bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                        📌 {notif.taskTitle}
                      </span>
                      <span className="text-[10px] text-[#9b9a97] truncate">
                        • {notif.projectTitle}
                      </span>
                    </div>
                  </div>

                  {/* Clear button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearNotification(notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#9b9a97] hover:text-red-500 transition-opacity"
                    title="Xóa thông báo"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          {currentUser && (
            <div className={`p-2.5 border-t text-center text-[10px] text-[#9b9a97] ${
              darkMode ? 'border-[#2d2d2d] bg-[#1a1a1a]' : 'border-[#f1f1ef] bg-[#fbfbfa]'
            }`}>
              Thông báo cho: <strong>{currentUser.name}</strong> ({currentUser.email})
            </div>
          )}
        </div>
      )}
    </div>
  );
};
