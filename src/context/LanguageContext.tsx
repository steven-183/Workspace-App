import React, { createContext, useContext, useState, useEffect } from 'react';
import { PriorityLevel } from '../types';

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
    resetDefaultData: 'Đặt lại dữ liệu mẫu',

    // Views
    viewKanban: 'Bảng',
    viewTimeline: 'Dòng thời gian',
    viewTable: 'Bảng dữ liệu',
    viewCalendar: 'Lịch',
    viewList: 'Danh sách',
    filter: 'Bộ lọc',
    sort: 'Sắp xếp',
    newTask: 'Thêm việc mới',
    searchPlaceholder: 'Tìm kiếm công việc...',
    all: 'Tất cả',
    addCard: 'Thêm thẻ',
    newCardPlaceholder: 'Nhập tên công việc mới...',
    enterToCreate: 'Enter ↵ để tạo',
    addColumn: 'Thêm cột',
    deleteColumn: 'Xóa cột',
    timelineTip: '💡 Kéo thanh để dời ngày, kéo 2 đầu thanh để thay đổi thời hạn',
    today: 'Hôm nay',
    tomorrow: 'Ngày mai',
    yesterday: 'Hôm qua',
    inProgress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    overdue: 'Quá hạn',
    prevTime: 'Lùi thời gian',
    nextTime: 'Tiến thời gian',
    addView: 'Thêm chế độ xem',
    addRow: 'Thêm dòng mới',

    // Table Headers
    tableTaskName: 'Tên công việc',
    tableStatus: 'Trạng thái',
    tablePriority: 'Mức ưu tiên',
    tableDueDate: 'Thời hạn',
    tableAssignees: 'Người làm',
    tableReviewer: 'Người duyệt',

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

    // Task Detail Modal
    taskNamePlaceholder: 'Tên công việc...',
    saveDraft: 'Lưu thay đổi',
    saved: 'Đã lưu',
    unsavedChanges: 'Chưa lưu',
    status: 'Trạng thái',
    priority: 'Mức độ ưu tiên',
    assignees: 'Người làm (Assignees)',
    reviewer: 'Người duyệt (Reviewer)',
    addAssignee: 'Thêm người làm...',
    changeReviewer: 'Đổi người duyệt...',
    dueDate: 'Hạn chót',
    startDate: 'Ngày bắt đầu',
    setDates: 'Thiết lập thời hạn',
    tags: 'Nhãn phân loại',
    addTag: 'Thêm nhãn...',
    description: 'Mô tả chi tiết',
    descriptionPlaceholder: 'Thêm ghi chú, mục tiêu, tài liệu tham khảo...',
    subtasks: 'Danh sách việc con',
    addSubtask: 'Thêm việc con...',
    pressEnterToAdd: 'Nhấn Enter để thêm',
    comments: 'Bình luận & Thảo luận',
    writeComment: 'Viết bình luận hoặc @nhắc tên đồng nghiệp...',
    sendComment: 'Gửi bình luận',
    activityLog: 'Lịch sử hoạt động',
    attachments: 'Tệp đính kèm',
    uploadFile: 'Tải tệp lên',
    deleteTask: 'Xóa công việc',
    archiveTask: 'Lưu trữ công việc',
    unarchiveTask: 'Khôi phục công việc',
    duplicateTask: 'Nhân bản',
    copyTaskLink: 'Sao chép link',
    taskCopied: 'Đã sao chép link công việc!',
    reviewerBadge: 'Duyệt',
    assigneeBadge: 'Người làm',
    reviewerPrefix: 'Người duyệt',
    assigneePrefix: 'Người làm',

    // My Tasks View
    myTasksTitle: 'Công việc của tôi',
    myTasksSubtitle: 'Tất cả nhiệm vụ được giao và cần bạn duyệt trên toàn bộ Workspace.',
    tabAssignedToMe: 'Được giao cho tôi',
    tabCreatedByMe: 'Tôi duyệt / Tạo',
    allTasks: 'Tất cả việc',
    overdueTasks: 'Việc quá hạn',
    dueToday: 'Hạn hôm nay',
    dueThisWeek: 'Hạn tuần này',
    noTasksAssigned: 'Bạn chưa có công việc nào được giao.',
    noTasksReview: 'Không có công việc nào đang chờ bạn duyệt.',
    groupBy: 'Nhóm theo',
    groupByDueDate: 'Theo hạn chót',
    groupByProject: 'Theo dự án',
    groupByStatus: 'Theo trạng thái',
    loginToViewPersonal: 'Vui lòng đăng nhập để xem nhiệm vụ cá nhân.',

    // Notifications
    notificationCenter: 'Trung tâm thông báo',
    notifications: 'Thông báo',
    markAllRead: 'Đánh dấu tất cả đã đọc',
    clearAll: 'Xóa tất cả',
    noNotifications: 'Không có thông báo mới',
    newNotification: 'Thông báo mới',
    browserNotifications: 'Thông báo đẩy trình duyệt',
    enableBrowserNotifications: 'Bật thông báo đẩy',
    browserNotificationsEnabled: 'Đã bật thông báo',

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
    project: 'Dự án',
    action: 'Thao tác',
    daysOverdue: 'Trễ',
    days: 'ngày',
    toggleToMember: 'Đổi thành Member',
    toggleToAdmin: 'Đổi thành Admin',
    cannotDemoteSelf: 'Bạn không thể tự hạ quyền Admin của chính mình.',

    // Trash & Archive Modal
    archiveAndTrashTitle: 'Kho lưu trữ & Thùng rác',
    archiveDescription: 'Quản lý các công việc đã hoàn thành được lưu trữ và khôi phục công việc đã xóa.',
    archivedTab: 'Đã lưu trữ',
    trashTab: 'Thùng rác',
    searchInArchive: 'Tìm công việc...',
    allProjectsOption: 'Tất cả bảng dự án',
    trashNotice: 'Các công việc trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn.',
    emptyTrash: 'Dọn sạch thùng rác',
    emptyTrashConfirm: 'Bạn có chắc chắn muốn dọn sạch thùng rác? Tất cả công việc trong thùng rác sẽ bị xóa vĩnh viễn.',
    noArchivedTasks: 'Chưa có công việc nào được lưu trữ',
    trashEmpty: 'Thùng rác hiện đang trống',
    restore: 'Khôi phục',
    deletePermanently: 'Xóa vĩnh viễn',

    // Quick Search Modal
    quickSearchTitle: 'Tìm kiếm nhanh công việc',
    quickSearchPlaceholder: 'Tìm theo tên việc, người làm, người duyệt, nhãn...',
    quickSearchNoResults: 'Không tìm thấy công việc nào phù hợp.',

    // User Autofill Dropdown
    selectMember: 'Chọn thành viên',
    searchUserPlaceholder: 'Tìm tên hoặc email...',
    yourAccount: 'Tài khoản của bạn',
    you: 'Bạn',
    userList: 'Danh sách người dùng',
    autoSuggestions: 'Gợi ý tự động',
    noUserFound: 'Không tìm thấy người dùng khớp với từ khóa.',
    addNewUser: 'Thêm mới',
    select: 'Chọn',

    // Confirm Delete Modal
    confirmDeleteTitle: 'Xóa công việc này?',
    confirmDeleteDesc: 'Công việc sẽ được chuyển vào Thùng rác (Kho lưu trữ). Bạn có thể khôi phục lại bất cứ lúc nào.',
    confirmDeleteButton: 'Chuyển vào Thùng rác',

    // Auth Modal
    authTitleSignIn: 'Đăng nhập Growth Workspace',
    authTitleSignUp: 'Tạo tài khoản mới',
    authSubtitle: 'Đăng nhập để theo dõi công việc được giao và bảo vệ dữ liệu của bạn.',
    signInTab: 'Đăng nhập',
    signUpTab: 'Đăng ký',
    emailLabel: 'Địa chỉ Email',
    emailPlaceholder: 'name@company.com',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Tối thiểu 6 ký tự...',
    fullNameLabel: 'Họ và tên',
    fullNamePlaceholder: 'Nguyễn Văn A',
    avatarUrlLabel: 'Ảnh đại diện (Tùy chọn)',
    quickProfiles: 'Hoặc chọn nhanh hồ sơ thành viên mẫu:',
    signInButton: 'Đăng nhập ngay',
    signUpButton: 'Tạo tài khoản',
    signingIn: 'Đang xử lý...',
    switchAccount: 'Chuyển sang tài khoản khác',
    signOut: 'Đăng xuất',
    profileTitle: 'Thông tin tài khoản',

    // Page Header
    workspaceBreadcrumb: 'Không gian làm việc',
    defaultProjectCategory: 'Dự án',
    addToFavorites: 'Thêm vào mục yêu thích',
    favorited: 'Đã yêu thích',
    changeIcon: 'Đổi biểu tượng',
    untitledProject: 'Không có tiêu đề',
    projectDescriptionPlaceholder: 'Thêm mô tả hoặc mục tiêu cho bảng công việc này...',
    addCover: 'Thêm ảnh bìa',
    changeCover: 'Đổi ảnh bìa',
    removeCover: 'Gỡ ảnh bìa',

    // Date & Relative Time
    justNow: 'Vừa xong',
    minutesAgo: 'phút trước',
    hoursAgo: 'giờ trước',
    yesterdayAt: 'Hôm qua lúc',
    noDueDate: 'Chưa đặt ngày',

    // Common
    cancel: 'Hủy bỏ',
    save: 'Lưu thay đổi',
    delete: 'Xóa',
    confirm: 'Xác nhận',
    close: 'Đóng',
    copy: 'Sao chép',
    copied: 'Đã sao chép!',
    add: 'Thêm',
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
    resetDefaultData: 'Reset to Sample Data',

    // Views
    viewKanban: 'Board',
    viewTimeline: 'Timeline',
    viewTable: 'Table',
    viewCalendar: 'Calendar',
    viewList: 'List',
    filter: 'Filter',
    sort: 'Sort',
    newTask: 'New Task',
    searchPlaceholder: 'Search tasks...',
    all: 'All',
    addCard: 'Add card',
    newCardPlaceholder: 'Enter new task name...',
    enterToCreate: 'Enter ↵ to create',
    addColumn: 'Add column',
    deleteColumn: 'Delete column',
    timelineTip: '💡 Drag bar to move dates, drag handles to adjust duration',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    inProgress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
    prevTime: 'Previous',
    nextTime: 'Next',
    addView: 'Add view',
    addRow: 'Add new row',

    // Table Headers
    tableTaskName: 'Task Name',
    tableStatus: 'Status',
    tablePriority: 'Priority',
    tableDueDate: 'Due Date',
    tableAssignees: 'Assignees',
    tableReviewer: 'Reviewer',

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

    // Task Detail Modal
    taskNamePlaceholder: 'Task name...',
    saveDraft: 'Save changes',
    saved: 'Saved',
    unsavedChanges: 'Unsaved',
    status: 'Status',
    priority: 'Priority',
    assignees: 'Assignees',
    reviewer: 'Reviewer',
    addAssignee: 'Add assignee...',
    changeReviewer: 'Change reviewer...',
    dueDate: 'Due date',
    startDate: 'Start date',
    setDates: 'Set dates',
    tags: 'Tags',
    addTag: 'Add tag...',
    description: 'Description',
    descriptionPlaceholder: 'Add detailed notes, goals, reference links...',
    subtasks: 'Subtasks',
    addSubtask: 'Add subtask...',
    pressEnterToAdd: 'Press Enter to add',
    comments: 'Comments & Discussion',
    writeComment: 'Write a comment or @mention a teammate...',
    sendComment: 'Send comment',
    activityLog: 'Activity Log',
    attachments: 'Attachments',
    uploadFile: 'Upload file',
    deleteTask: 'Delete task',
    archiveTask: 'Archive task',
    unarchiveTask: 'Restore task',
    duplicateTask: 'Duplicate',
    copyTaskLink: 'Copy link',
    taskCopied: 'Task link copied!',
    reviewerBadge: 'Review',
    assigneeBadge: 'Assignee',
    reviewerPrefix: 'Reviewer',
    assigneePrefix: 'Assignee',

    // My Tasks View
    myTasksTitle: 'My Tasks',
    myTasksSubtitle: 'All tasks assigned to you or waiting for your review across the workspace.',
    tabAssignedToMe: 'Assigned to Me',
    tabCreatedByMe: 'Waiting for My Review',
    allTasks: 'All Tasks',
    overdueTasks: 'Overdue Tasks',
    dueToday: 'Due Today',
    dueThisWeek: 'Due This Week',
    noTasksAssigned: 'No tasks currently assigned to you.',
    noTasksReview: 'No tasks waiting for your review.',
    groupBy: 'Group by',
    groupByDueDate: 'By Due Date',
    groupByProject: 'By Project',
    groupByStatus: 'By Status',
    loginToViewPersonal: 'Please sign in to view your personal tasks.',

    // Notifications
    notificationCenter: 'Notification Center',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    clearAll: 'Clear all',
    noNotifications: 'No new notifications',
    newNotification: 'New notification',
    browserNotifications: 'Browser push notifications',
    enableBrowserNotifications: 'Enable push notifications',
    browserNotificationsEnabled: 'Notifications enabled',

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
    project: 'Project',
    action: 'Action',
    daysOverdue: 'Late by',
    days: 'days',
    toggleToMember: 'Switch to Member',
    toggleToAdmin: 'Switch to Admin',
    cannotDemoteSelf: 'You cannot demote yourself from Admin.',

    // Trash & Archive Modal
    archiveAndTrashTitle: 'Archive & Trash',
    archiveDescription: 'Manage archived completed tasks and restore deleted tasks.',
    archivedTab: 'Archived',
    trashTab: 'Trash',
    searchInArchive: 'Search tasks...',
    allProjectsOption: 'All projects',
    trashNotice: 'Items in trash can be restored or permanently deleted.',
    emptyTrash: 'Empty trash',
    emptyTrashConfirm: 'Are you sure you want to empty the trash? All items will be permanently deleted.',
    noArchivedTasks: 'No archived tasks',
    trashEmpty: 'Trash is currently empty',
    restore: 'Restore',
    deletePermanently: 'Delete permanently',

    // Quick Search Modal
    quickSearchTitle: 'Quick Search Tasks',
    quickSearchPlaceholder: 'Search by task name, assignee, reviewer, tag...',
    quickSearchNoResults: 'No matching tasks found.',

    // User Autofill Dropdown
    selectMember: 'Select member',
    searchUserPlaceholder: 'Search name or email...',
    yourAccount: 'Your account',
    you: 'You',
    userList: 'User list',
    autoSuggestions: 'Suggestions',
    noUserFound: 'No users found matching keywords.',
    addNewUser: 'Add new',
    select: 'Select',

    // Confirm Delete Modal
    confirmDeleteTitle: 'Delete this task?',
    confirmDeleteDesc: 'The task will be moved to Trash (Archive). You can restore it anytime.',
    confirmDeleteButton: 'Move to Trash',

    // Auth Modal
    authTitleSignIn: 'Sign In to Growth Workspace',
    authTitleSignUp: 'Create New Account',
    authSubtitle: 'Sign in to track assigned tasks and protect your workspace data.',
    signInTab: 'Sign In',
    signUpTab: 'Sign Up',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@company.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Minimum 6 characters...',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Alex Johnson',
    avatarUrlLabel: 'Avatar URL (Optional)',
    quickProfiles: 'Or quick switch to a demo member profile:',
    signInButton: 'Sign In Now',
    signUpButton: 'Create Account',
    signingIn: 'Processing...',
    switchAccount: 'Switch to another account',
    signOut: 'Sign Out',
    profileTitle: 'Account Profile',

    // Page Header
    workspaceBreadcrumb: 'Workspace',
    defaultProjectCategory: 'Project',
    addToFavorites: 'Add to favorites',
    favorited: 'Favorited',
    changeIcon: 'Change icon',
    untitledProject: 'Untitled Project',
    projectDescriptionPlaceholder: 'Add a description or objective for this board...',
    addCover: 'Add cover',
    changeCover: 'Change cover',
    removeCover: 'Remove cover',

    // Date & Relative Time
    justNow: 'Just now',
    minutesAgo: 'mins ago',
    hoursAgo: 'hours ago',
    yesterdayAt: 'Yesterday at',
    noDueDate: 'No due date',

    // Common
    cancel: 'Cancel',
    save: 'Save changes',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied!',
    add: 'Add',
  },
};

export const translateStatus = (statusTitleOrId: string, lang: Language): string => {
  if (!statusTitleOrId) return statusTitleOrId;
  const normalized = statusTitleOrId.toLowerCase().trim();
  const keyMap: Record<string, string> = {
    todo: 'status_todo',
    'cần làm': 'status_todo',
    'to do': 'status_todo',
    in_progress: 'status_in_progress',
    'đang làm': 'status_in_progress',
    'in progress': 'status_in_progress',
    in_review: 'status_in_review',
    'chờ review': 'status_in_review',
    'đang duyệt': 'status_in_review',
    'in review': 'status_in_review',
    review: 'status_in_review',
    done: 'status_done',
    'hoàn thành': 'status_done',
    blocked: 'status_blocked',
    'bị nghẽn': 'status_blocked',
    backlog: 'status_todo',
  };
  const key = keyMap[normalized];
  if (key && DICTIONARY[lang][key]) {
    return DICTIONARY[lang][key];
  }
  return statusTitleOrId;
};

export const translatePriority = (priority: PriorityLevel | string, lang: Language): string => {
  if (!priority) return priority;
  const normalized = priority.toLowerCase().trim();
  const key = `priority_${normalized}`;
  if (DICTIONARY[lang][key]) {
    return DICTIONARY[lang][key];
  }
  return priority;
};

export const formatDateLocale = (dateStr?: string, lang: Language = 'vi'): string => {
  if (!dateStr) return DICTIONARY[lang].noDueDate || 'No due date';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    if (lang === 'en') {
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNamesEn[month - 1]} ${day}, ${year}`;
    }
    return `${day} thg ${month}, ${year}`;
  } catch {
    return dateStr;
  }
};

export const formatRelativeTimeLocale = (isoString?: string, lang: Language = 'vi'): string => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 45) return DICTIONARY[lang].justNow;
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `${mins} ${DICTIONARY[lang].minutesAgo}`;
    }
    if (diffSec < 86400) {
      const hrs = Math.floor(diffSec / 3600);
      return `${hrs} ${DICTIONARY[lang].hoursAgo}`;
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    if (diffSec < 172800) {
      return `${DICTIONARY[lang].yesterdayAt} ${hours}:${minutes}`;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}`;
  } catch {
    return isoString;
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  translateStatus: (statusTitleOrId: string) => string;
  translatePriority: (priority: PriorityLevel | string) => string;
  formatDate: (dateStr?: string) => string;
  formatRelativeTime: (isoString?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  translateStatus: (s: string) => s,
  translatePriority: (p: PriorityLevel | string) => p,
  formatDate: (d?: string) => d || '',
  formatRelativeTime: (iso?: string) => iso || '',
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

  const getStatus = (statusTitleOrId: string) => translateStatus(statusTitleOrId, language);
  const getPriority = (priority: PriorityLevel | string) => translatePriority(priority, language);
  const getFormattedDate = (dateStr?: string) => formatDateLocale(dateStr, language);
  const getFormattedRelativeTime = (isoString?: string) => formatRelativeTimeLocale(isoString, language);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      translateStatus: getStatus,
      translatePriority: getPriority,
      formatDate: getFormattedDate,
      formatRelativeTime: getFormattedRelativeTime,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
