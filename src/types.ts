export type AppTheme = 'light' | 'dark' | 'qanda_pink';

export type StatusId = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | string;

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type NotionColor = 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 'qanda_pink';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  color?: string;
}

export type MainSectionType = 'project' | 'my_tasks';

export interface Tag {
  id: string;
  label: string;
  color: NotionColor;
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export type BlockType = 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'todo' | 'bullet' | 'callout' | 'quote' | 'code' | 'divider';

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  icon?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number; // bytes
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export type ActivityActionType =
  | 'created'
  | 'status_change'
  | 'priority_change'
  | 'date_change'
  | 'time_change'
  | 'assignee_change'
  | 'tag_change'
  | 'attachment_add'
  | 'attachment_remove'
  | 'archive'
  | 'unarchive'
  | 'general';

export interface TaskActivityLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: ActivityActionType;
  details: string;
  timestamp: string;
}

export type NotificationType = 'assigned' | 'property_change' | 'comment' | 'status_change';

export interface TaskNotification {
  id: string;
  recipientId: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectTitle: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: StatusId;
  priority: PriorityLevel;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm
  dueTime?: string;   // HH:mm (default preset is '18:00')
  assignees: User[];
  creator?: User;
  followers?: User[];
  tags: Tag[];
  progress?: number;  // optional backwards compatibility
  subtasks: SubTask[];
  blocks?: NotionBlock[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  activityLogs?: TaskActivityLog[];
  isArchived?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  coverImage?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface StatusColumn {
  id: StatusId;
  title: string;
  color: NotionColor;
  icon?: string;
}

export type ViewType = 'kanban' | 'timeline' | 'table' | 'calendar';

export type TeamId = 'performance_marketing' | 'book_growth' | 'product';

export interface TeamConfig {
  id: TeamId;
  name: string;
  icon: string;
  description: string;
  color: NotionColor;
}

export const FIXED_TEAMS: TeamConfig[] = [
  {
    id: 'performance_marketing',
    name: 'Performance Marketing',
    icon: '📈',
    description: 'Chiến dịch quảng cáo, tối ưu chuyển đổi, phễu marketing & tăng trưởng người dùng',
    color: 'orange',
  },
  {
    id: 'book_growth',
    name: 'Book Growth',
    icon: '📚',
    description: 'Phát triển danh mục sách, bản quyền, dịch thuật & cộng đồng độc giả',
    color: 'purple',
  },
  {
    id: 'product',
    name: 'Product',
    icon: '🚀',
    description: 'Phát triển tính năng, thiết kế UI/UX, nền tảng hệ thống & Mobile App',
    color: 'blue',
  },
];

export interface ProjectPage {
  id: string;
  title: string;
  icon: string;
  coverImage?: string;
  description: string;
  tasks: Task[];
  columns: StatusColumn[];
  views: ViewType[];
  activeView: ViewType;
  isFavorite?: boolean;
  category?: string;
  teamId?: TeamId;
  createdAt: string;
}

export interface FilterOptions {
  search: string;
  statuses: StatusId[];
  priorities: PriorityLevel[];
  assigneeIds: string[];
  tagIds: string[];
  dateFilter: 'all' | 'today' | 'this_week' | 'overdue' | 'no_date';
  groupBy: 'status' | 'priority' | 'assignee';
  sortBy: 'order' | 'dueDate' | 'priority' | 'title' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
  showArchived?: boolean;
  showTrash?: boolean;
}

export type TimelineZoom = 'day' | 'week' | 'month';
