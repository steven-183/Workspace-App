import { ProjectPage, StatusColumn, Tag, User } from '../types';
import { getTodayString } from '../utils/dateUtils';

const today = getTodayString();

export const SAMPLE_USERS: User[] = [];

export const SAMPLE_TAGS: Tag[] = [
  { id: 't1', label: 'Frontend', color: 'blue' },
  { id: 't2', label: 'Backend', color: 'green' },
  { id: 't3', label: 'UI/UX Design', color: 'pink' },
  { id: 't4', label: 'Marketing', color: 'orange' },
  { id: 't5', label: 'QA / Testing', color: 'purple' },
  { id: 't6', label: 'Tài liệu', color: 'gray' },
  { id: 't7', label: 'Bảo mật', color: 'red' },
  { id: 't8', label: 'Database', color: 'brown' },
  { id: 't9', label: 'Sprint Goal', color: 'yellow' },
];

export const DEFAULT_COLUMNS: StatusColumn[] = [
  { id: 'backlog', title: 'Chưa xếp lịch', color: 'gray', icon: 'Inbox' },
  { id: 'todo', title: 'Cần làm', color: 'blue', icon: 'Circle' },
  { id: 'in_progress', title: 'Đang làm', color: 'yellow', icon: 'Clock' },
  { id: 'in_review', title: 'Đang duyệt', color: 'purple', icon: 'Eye' },
  { id: 'done', title: 'Hoàn thành', color: 'green', icon: 'CheckCircle2' },
  { id: 'blocked', title: 'Bị nghẽn', color: 'red', icon: 'AlertTriangle' },
];

export const INITIAL_PROJECTS: ProjectPage[] = [
  {
    id: 'proj-1',
    title: 'Bảng công việc',
    icon: '📋',
    coverImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'Không gian làm việc và theo dõi nhiệm vụ.',
    columns: DEFAULT_COLUMNS,
    views: ['kanban', 'timeline', 'table', 'calendar'],
    activeView: 'kanban',
    isFavorite: false,
    category: 'Product',
    teamId: 'product',
    createdAt: today,
    tasks: [],
  },
];
