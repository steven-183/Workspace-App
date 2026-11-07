import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export const LANGUAGE_STORAGE_KEY = 'notion_tasks_app_language_v1';

export const DICTIONARY: Record<Language, Record<string, string>> = {
  vi: {
    // Brand & General
    workspaceTitle: 'Growth Department Workspace',
    workspace: 'Workspace',
    admin: 'Quản trị viên',
    member: 'Thành viên',
    guest: 'Khách',
    active: 'Hoạt động',

    // Sidebar navigation
    myTasks: 'Công việc của tôi',
    adminDashboard: 'Dashboard Quản trị',
    quickSearch: 'Tìm kiếm nhanh',
    personalBoard: 'Cá nhân (Riêng tư)',
    personalProjectTitle: 'Task cá nhân',
    favoriteProjects: 'Dự án yêu thích',
    allProjects: 'Dự án theo nhóm',
    addProject: 'Thêm dự án',
    archiveAndTrash: 'Kho lưu trữ & Thùng rác',
    settingsAndData: 'Cài đặt & Dữ liệu',
    account: 'Tài khoản',
    loginEmail: 'Đăng nhập Email',
    loggedInAs: 'Đang đăng nhập',
    collapseSidebar: 'Thu gọn thanh bên',
    expandSidebar: 'Mở rộng thanh bên',
    overdueBadge: 'trễ',
    overdueTasksBadge: 'việc quá hạn',

    // Teams
    team_personal: 'Cá nhân',
    team_performance_marketing: 'Performance Marketing',
    team_book_growth: 'Book Growth',
    team_product: 'Product',

    // Settings Dropdown
    themeAppearance: 'Giao diện màu sắc',
    themeLight: 'Sáng',
    themeDark: 'Tối OLED',
    themePink: 'Aria Hồng',
    languageSelection: 'Ngôn ngữ giao diện',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    backupJson: 'Sao lưu JSON',
    restoreJson: 'Khôi phục JSON',

    // Views
    viewKanban: 'Bảng',
    viewTimeline: 'Dòng thời gian',
    viewTable: 'Bảng dữ liệu',
    viewCalendar: 'Lịch',
    filter: 'Bộ lọc',
    sort: 'Sắp xếp',
    newTask: 'Thêm việc mới',
    searchPlaceholder: 'Tìm kiếm công việc...',
    all: 'Tất cả',

    // Task Status
    status_todo: 'Cần làm',
    status_in_progress: 'Đang làm',
    status_in_review: 'Chờ review',
    status_done: 'Hoàn thành',
    status_blocked: 'Bị nghẽn',

    // Task Priorities
    priority_urgent: 'Khẩn cấp',
    priority_high: 'Cao',
    priority_medium: 'Trung bình',
    priority_low: 'Thấp',
    priority_none: 'Không có',

    // Notifications
    notificationCenter: 'Trung tâm thông báo',
    markAllRead: 'Đánh dấu tất cả đã đọc',
    clearAll: 'Xóa tất cả',
    noNotifications: 'Không có thông báo mới',
    newNotification: 'Thông báo mới',

    // Admin Dashboard
    adminDashboardTitle: 'Dashboard Quản trị Đội ngũ & Hiệu suất',
    adminDashboardSubtitle: 'Theo dõi khối lượng công việc, tỷ lệ hoàn thành và nhắc nhở nhiệm vụ quá hạn của từng nhân sự.',
    totalMembers: 'Tổng số nhân sự',
    activeTasks: 'Công việc đang xử lý',
    completionRate: 'Tỷ lệ hoàn thành',
    overdueJobs: 'Công việc quá hạn',
    remindAllOverdue: 'Nhắc nhở tất cả quá hạn',
    remindAllSuccess: 'Đã gửi nhắc nhở đến tất cả nhân sự có việc quá hạn',
    remindSingleSuccess: 'Đã gửi thông báo nhắc nhở đến',
    workloadByMember: 'Khối lượng công việc theo nhân sự',
    overdueJobsList: 'Danh sách các Job quá hạn cần xử lý',
    assignedTasks: 'Được giao',
    inProgressTasks: 'Đang làm',
    doneTasks: 'Hoàn thành',
    role: 'Vai trò',
    remind: 'Nhắc nhở',
    noOverdueJobs: 'Tuyệt vời! Hiện tại không có công việc nào bị quá hạn.',
    taskName: 'Tên công việc',
    assignee: 'Phụ trách',
    dueDate: 'Hạn chót',
    project: 'Dự án',
    action: 'Thao tác',
    daysOverdue: 'Trễ',
    days: 'ngày',
    toggleToMember: 'Đổi thành Member',
    toggleToAdmin: 'Đổi thành Admin',
    cannotDemoteSelf: 'Bạn không thể tự hạ quyền Admin của chính mình.',

    // Common
    cancel: 'Hủy bỏ',
    save: 'Lưu thay đổi',
    delete: 'Xóa',
    confirm: 'Xác nhận',
    close: 'Đóng',
    copy: 'Sao chép',
    copied: 'Đã sao chép!',
  },

  en: {
    // Brand & General
    workspaceTitle: 'Growth Department Workspace',
    workspace: 'Workspace',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
    active: 'Active',

    // Sidebar navigation
    myTasks: 'My Tasks',
    adminDashboard: 'Admin Dashboard',
    quickSearch: 'Quick Search',
    personalBoard: 'Personal (Private)',
    personalProjectTitle: 'Personal Tasks',
    favoriteProjects: 'Favorites',
    allProjects: 'Team Projects',
    addProject: 'New Project',
    archiveAndTrash: 'Archive & Trash',
    settingsAndData: 'Settings & Data',
    account: 'Account',
    loginEmail: 'Sign in with Email',
    loggedInAs: 'Signed in as',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    overdueBadge: 'late',
    overdueTasksBadge: 'overdue tasks',

    // Teams
    team_personal: 'Personal',
    team_performance_marketing: 'Performance Marketing',
    team_book_growth: 'Book Growth',
    team_product: 'Product',

    // Settings Dropdown
    themeAppearance: 'Theme & Appearance',
    themeLight: 'Light',
    themeDark: 'Dark OLED',
    themePink: 'Aria Pink',
    languageSelection: 'Language',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    backupJson: 'Backup JSON',
    restoreJson: 'Restore JSON',

    // Views
    viewKanban: 'Board',
    viewTimeline: 'Timeline',
    viewTable: 'Table',
    viewCalendar: 'Calendar',
    filter: 'Filter',
    sort: 'Sort',
    newTask: 'New Task',
    searchPlaceholder: 'Search tasks...',
    all: 'All',

    // Task Status
    status_todo: 'To Do',
    status_in_progress: 'In Progress',
    status_in_review: 'In Review',
    status_done: 'Done',
    status_blocked: 'Blocked',

    // Task Priorities
    priority_urgent: 'Urgent',
    priority_high: 'High',
    priority_medium: 'Medium',
    priority_low: 'Low',
    priority_none: 'None',

    // Notifications
    notificationCenter: 'Notification Center',
    markAllRead: 'Mark all as read',
    clearAll: 'Clear all',
    noNotifications: 'No new notifications',
    newNotification: 'New notification',

    // Admin Dashboard
    adminDashboardTitle: 'Team & Workload Admin Dashboard',
    adminDashboardSubtitle: 'Monitor member workloads, completion rates, and send prompt reminders for overdue assignments.',
    totalMembers: 'Total Members',
    activeTasks: 'Active Tasks',
    completionRate: 'Completion Rate',
    overdueJobs: 'Overdue Jobs',
    remindAllOverdue: 'Remind All Overdue',
    remindAllSuccess: 'Sent reminders to all members with overdue tasks',
    remindSingleSuccess: 'Sent reminder notification to',
    workloadByMember: 'Workload by Team Member',
    overdueJobsList: 'Overdue Jobs Requiring Attention',
    assignedTasks: 'Assigned',
    inProgressTasks: 'In Progress',
    doneTasks: 'Completed',
    role: 'Role',
    remind: 'Remind',
    noOverdueJobs: 'Awesome! No tasks are currently overdue.',
    taskName: 'Task Name',
    assignee: 'Assignee',
    dueDate: 'Due Date',
    project: 'Project',
    action: 'Action',
    daysOverdue: 'Late by',
    days: 'days',
    toggleToMember: 'Switch to Member',
    toggleToAdmin: 'Switch to Admin',
    cannotDemoteSelf: 'You cannot demote yourself from Admin.',

    // Common
    cancel: 'Cancel',
    save: 'Save changes',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied!',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'vi') return saved;
    } catch (e) {
      // Ignore localStorage errors
    }
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = DICTIONARY[language] || DICTIONARY.vi;
    if (dict[key]) return dict[key];
    if (fallback) return fallback;
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
