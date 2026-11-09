import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TaskNotification, User } from '../types';
import { 
  formatNotificationTime,
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendBrowserNotification
} from '../utils/notificationService';
import { getSupabaseConfig } from '../lib/supabase';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  AlertCircle, 
  X, 
  ExternalLink,
  Inbox,
  CheckCircle2,
  Trash2,
  Volume2,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position coordinates for portal popover
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  // Update browser notification permission state
  useEffect(() => {
    if (isBrowserNotificationSupported()) {
      setBrowserPermission(getBrowserNotificationPermission());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      sendBrowserNotification('Đã kích hoạt thông báo Desktop! 🎉', {
        body: 'Bạn sẽ nhận được thông báo ngay cả khi đang ở tab khác hoặc ứng dụng khác.',
      });
    }
  };

  const handleTestNotification = () => {
    sendBrowserNotification('Kiểm tra thông báo ngoài trình duyệt 🔔', {
      body: 'Hệ thống thông báo đẩy hoạt động chuẩn xác! Bấm vào đây để quay lại ứng dụng.',
    });
  };

  // Filter notifications relevant to the current user (if logged in), or all notifications
  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return true;
    const myId = currentUser.id?.toLowerCase();
    const myEmail = currentUser.email?.toLowerCase();
    const myName = currentUser.name?.toLowerCase().trim();

    return (
      n.recipientId === 'all' ||
      (myId && n.recipientId?.toLowerCase() === myId) ||
      (myEmail && (
        n.recipientEmail?.toLowerCase() === myEmail ||
        n.recipientId?.toLowerCase() === myEmail
      )) ||
      (myName && (
        n.recipientName?.toLowerCase().trim() === myName ||
        n.recipientId?.toLowerCase().trim() === myName
      ))
    );
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const displayList = filterMode === 'unread' 
    ? userNotifications.filter((n) => !n.isRead)
    : userNotifications;

  // Calculate coordinates dynamically when opening or on resize/scroll
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      setCoords({
        top: Math.max(12, rect.bottom + 8),
        left: 12,
        width: window.innerWidth - 24,
        maxHeight: window.innerHeight - rect.bottom - 24,
      });
      return;
    }

    const popupWidth = 440; // Full width with plenty of room for all information
    let left = rect.right + 12;

    // If opening from the right side of the screen or align is right
    if (align === 'right' || left + popupWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popupWidth - 16);
    }

    // Ensure it doesn't clip on the left either
    left = Math.max(16, left);

    // Vertical positioning
    let top = rect.top;
    const estimatedHeight = 560;
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - estimatedHeight - 16);
    }

    const maxHeight = Math.min(620, window.innerHeight - top - 24);

    setCoords({
      top,
      left,
      width: popupWidth,
      maxHeight,
    });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && 
        !popoverRef.current.contains(target) &&
        triggerRef.current && 
        !triggerRef.current.contains(target)
      ) {
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
        return <UserPlus size={13} className="text-blue-500" />;
      case 'comment':
        return <MessageSquare size={13} className="text-emerald-500" />;
      case 'status_change':
        return <Clock size={13} className="text-purple-500" />;
      case 'property_change':
      default:
        return <CheckCircle2 size={13} className="text-emerald-500" />;
    }
  };

  return (
    <>
      {/* Trigger Button based on variant */}
      {triggerVariant === 'sidebar_row' ? (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors select-none cursor-pointer ${
            isOpen
              ? (darkMode ? 'bg-[#27272a] text-white shadow-xs' : 'bg-[#e5e5e5] text-[#18181b]')
              : (darkMode ? 'hover:bg-white/[0.06] text-[#a1a1aa]' : 'hover:bg-[#ebeae7] text-[#5a5a58]')
          }`}
          title={t('notificationCenter', 'Mở trung tâm thông báo')}
        >
          <div className="flex items-center gap-2 font-medium">
            <Bell size={15} className={unreadCount > 0 ? 'text-[#2563eb] dark:text-blue-400' : ''} />
            <span>{t('notifications', 'Thông báo')}</span>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#2563eb] text-white shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all flex items-center justify-center select-none cursor-pointer ${
            isOpen
              ? (darkMode ? 'bg-[#27272a] text-white shadow-xs' : 'bg-white shadow-xs text-[#2563eb] border border-[#e3e2e0]')
              : (darkMode ? 'hover:bg-white/[0.08] text-[#a1a1aa]' : 'hover:bg-[#ebeae7] text-[#787774]')
          }`}
          title={t('notificationCenter', 'Trung tâm thông báo')}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Popover Panel Rendered via Portal to document.body (Never cropped by sidebar overflow) */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className={`flex flex-col rounded-2xl shadow-2xl border backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
            darkMode 
              ? 'bg-[#121316]/98 border-white/10 text-[#f4f4f5] shadow-black/95 ring-1 ring-white/10' 
              : 'bg-white/98 border-[#e2e1de] text-[#18181b] shadow-2xl ring-1 ring-black/5'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
            darkMode ? 'border-white/[0.08] bg-[#16171b]' : 'border-[#ebeae7] bg-[#fbfbfa]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#2563eb] dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>{t('notificationCenter', 'Trung tâm thông báo')}</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#2563eb] dark:text-blue-300">
                      {unreadCount} {language === 'en' ? 'new' : 'mới'}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#71717a] dark:text-[#a1a1aa]">
                  {language === 'en' ? 'All updates and events for tasks' : 'Tất cả cập nhật và sự kiện của các tác vụ'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2.5 py-1 text-xs text-[#2563eb] dark:text-blue-400 hover:bg-blue-500/10 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title={t('markAllRead', 'Đánh dấu tất cả đã đọc')}
                >
                  <CheckCheck size={14} />
                  <span>{language === 'en' ? 'Read all' : 'Đọc tất cả'}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg text-[#71717a] hover:text-[#18181b] dark:hover:text-white transition-colors cursor-pointer ${
                  darkMode ? 'hover:bg-white/[0.08]' : 'hover:bg-[#ebeae7]'
                }`}
                title={t('close', 'Đóng (Esc)')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Browser Notification Banner / Push Controls */}
          {isBrowserNotificationSupported() && (
            <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between gap-3 shrink-0 ${
              browserPermission === 'granted'
                ? (darkMode ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700')
                : (darkMode ? 'bg-blue-950/20 border-blue-900/30 text-blue-300' : 'bg-blue-50/70 border-blue-100 text-blue-700')
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={14} className="shrink-0" />
                <span className="truncate">
                  {browserPermission === 'granted'
                    ? (language === 'en' ? 'Desktop notifications enabled' : 'Thông báo Desktop đã bật (nhận thông báo ngoài tab)')
                    : (language === 'en' ? 'Enable desktop notifications to stay updated' : 'Bật thông báo ngoài trình duyệt để không bỏ lỡ task')}
                </span>
              </div>
              <div className="shrink-0">
                {browserPermission === 'granted' ? (
                  <button
                    onClick={handleTestNotification}
                    className="text-[11px] font-semibold underline hover:opacity-80 cursor-pointer"
                    title={language === 'en' ? 'Click to send a test notification' : 'Bấm để test thử thông báo'}
                  >
                    {language === 'en' ? 'Test' : 'Thử gửi'}
                  </button>
                ) : (
                  <button
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#2563eb] text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    {language === 'en' ? 'Enable' : 'Bật ngay'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className={`px-4 py-2 border-b flex items-center gap-2 text-xs shrink-0 ${
            darkMode ? 'border-white/[0.06] bg-[#141518]' : 'border-[#f1f1ef] bg-[#fafafa]'
          }`}>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterMode === 'all'
                  ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white shadow-xs text-[#18181b] font-semibold border border-[#e2e1de]')
                  : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
              }`}
            >
              {language === 'en' ? `All (${userNotifications.length})` : `Tất cả (${userNotifications.length})`}
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterMode === 'unread'
                  ? (darkMode ? 'bg-white/10 text-white font-semibold' : 'bg-white shadow-xs text-[#18181b] font-semibold border border-[#e2e1de]')
                  : 'text-[#71717a] hover:text-[#18181b] dark:hover:text-white'
              }`}
            >
              {language === 'en' ? `Unread (${unreadCount})` : `Chưa đọc (${unreadCount})`}
            </button>
          </div>

          {/* Notifications List (Roomy, well-padded, unclipped) */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#ebeae7] dark:divide-white/[0.06] overscroll-contain">
            {displayList.length === 0 ? (
              <div className="py-14 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-[#2563eb] dark:text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-500/15">
                  <Inbox size={26} />
                </div>
                <div className="text-sm font-bold text-[#18181b] dark:text-[#f4f4f5]">
                  {filterMode === 'unread' 
                    ? (language === 'en' ? 'No unread notifications' : 'Không có thông báo chưa đọc') 
                    : (language === 'en' ? 'No notifications yet' : 'Chưa có thông báo nào')}
                </div>
                <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                  {language === 'en' 
                    ? 'When tasks are assigned, commented on, or updated, notifications will show here.' 
                    : 'Khi công việc được giao, bình luận mới, hoặc cập nhật trạng thái, thông báo sẽ hiển thị đầy đủ tại đây.'}
                </p>
              </div>
            ) : (
              displayList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    if (notif.projectId && notif.taskId) {
                      onOpenTask(notif.projectId, notif.taskId);
                    }
                    setIsOpen(false);
                  }}
                  className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer group relative ${
                    !notif.isRead 
                      ? (darkMode ? 'bg-white/[0.04] hover:bg-white/[0.07]' : 'bg-blue-50/50 hover:bg-blue-50/90') 
                      : (darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-[#f7f6f3]')
                  }`}
                >
                  {/* Unread dot indicator */}
                  {!notif.isRead && (
                    <span className="absolute left-2 top-5 w-2 h-2 rounded-full bg-[#2563eb] shadow-xs ring-2 ring-white dark:ring-[#121316]" />
                  )}

                  {/* Actor Avatar or System Green Check */}
                  {notif.actor?.id === 'system' || !notif.actor?.avatar ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <CheckCircle2 size={18} className="stroke-[2.2]" />
                    </div>
                  ) : (
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={notif.actor.avatar}
                        alt={notif.actor.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-cover border border-black/10 dark:border-white/10"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#27272a] shadow-xs flex items-center justify-center border border-black/5 dark:border-white/10">
                        {getEventIcon(notif.type)}
                      </div>
                    </div>
                  )}

                  {/* Complete Information Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    {/* Event Title & Timestamp */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-[#18181b] dark:text-white truncate">
                          {notif.title || notif.actor.name}
                        </span>
                        {notif.title && notif.actor.name && notif.actor.id !== 'system' && (
                          <span className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] shrink-0 font-normal">
                            • {notif.actor.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] shrink-0 font-medium whitespace-nowrap">
                        {formatNotificationTime(notif.createdAt)}
                      </span>
                    </div>

                    {/* Detailed Message (Full message, no cut off) */}
                    <p className="text-xs text-[#3f3f46] dark:text-[#d4d4d8] leading-relaxed mb-2 break-words">
                      {notif.message}
                    </p>

                    {/* Task Title & Project Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {notif.taskTitle && (
                        <div className="inline-flex items-center gap-1 max-w-[260px] text-[11px] font-medium text-[#2563eb] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                          <ExternalLink size={10} className="shrink-0" />
                          <span className="truncate">{notif.taskTitle}</span>
                        </div>
                      )}
                      {notif.projectTitle && (
                        <span className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 truncate">
                          {notif.projectTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions on hover (Delete & Mark Read) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearNotification(notif.id);
                      }}
                      className="p-1 rounded-md text-[#71717a] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title={language === 'en' ? 'Delete this notification' : 'Xóa thông báo này'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note & Connection Status */}
          <div className={`p-3 border-t text-[11px] text-[#71717a] dark:text-[#a1a1aa] shrink-0 space-y-1.5 ${
            darkMode ? 'border-white/[0.08] bg-[#141518]' : 'border-[#ebeae7] bg-[#fbfbfa]'
          }`}>
            {currentUser ? (
              <div className="flex items-center justify-between text-[11px]">
                <span>{language === 'en' ? 'Current account:' : 'Tài khoản hiện tại:'}</span>
                <span className="font-semibold text-[#18181b] dark:text-[#e4e4e7] truncate max-w-[220px]">
                  {currentUser.name} {currentUser.email ? `(${currentUser.email})` : ''}
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-amber-500">
                {language === 'en' ? 'Not signed in with personal account.' : 'Chưa đăng nhập tài khoản cá nhân.'}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[10px] pt-0.5 border-t border-black/[0.04] dark:border-white/[0.04]">
              {getSupabaseConfig().isConfigured ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  {language === 'en' ? 'Syncing realtime across devices via Supabase Cloud.' : 'Đang đồng bộ Realtime đa thiết bị qua Supabase Cloud.'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  {language === 'en' ? 'Saved locally (Local Storage).' : 'Đang lưu cục bộ (Local Storage). Cần kết nối chung database để gửi sang máy đồng nghiệp.'}
                </span>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
