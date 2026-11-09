import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  NotionColor, 
  PriorityLevel, 
  ProjectPage, 
  StatusId, 
  SubTask, 
  Tag, 
  Task, 
  TaskComment, 
  TaskAttachment,
  TaskActivityLog,
  TaskNotification,
  User,
  AppTheme 
} from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { 
  addDays, 
  formatDateVi, 
  formatFullTimestamp, 
  formatRelativeTime, 
  formatFileSize, 
  getTodayString, 
  isDueToday, 
  isOverdue 
} from '../utils/dateUtils';
import { SAMPLE_TAGS } from '../data/initialData';
import { dispatchTaskEvent, triggerToast } from '../utils/notificationService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  X, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Tag as TagIcon, 
  CheckSquare, 
  Plus, 
  AlertCircle, 
  Image as ImageIcon, 
  MessageSquare, 
  Check, 
  AlignLeft, 
  Eye, 
  Paperclip, 
  Download, 
  File, 
  FileText, 
  FileSpreadsheet, 
  FileArchive, 
  History, 
  Archive, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  UserCheck, 
  UserPlus, 
  MoreVertical, 
  Save, 
  Copy, 
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { UserAutofillDropdown } from './UserAutofillDropdown';
import { useLanguage, translateStatus, translatePriority } from '../context/LanguageContext';

interface TaskDetailModalProps {
  task: Task | null;
  project: ProjectPage;
  isOpen: boolean;
  isNewTask?: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>, isNew?: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onArchiveTask?: (taskId: string) => void;
  onUnarchiveTask?: (taskId: string) => void;
  darkMode: boolean;
  appTheme?: AppTheme;
  currentUser?: User | null;
  availableUsers?: User[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  project,
  isOpen,
  isNewTask = false,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onArchiveTask,
  onUnarchiveTask,
  darkMode,
  appTheme = 'light',
  currentUser,
  availableUsers = [],
}) => {
  const { language, t } = useLanguage();
  const isPink = appTheme === 'qanda_pink';
  // Local draft state for task to allow explicit "Lưu" (Save) before committing to DB
  const [draftTask, setDraftTask] = useState<Task>(() => (task ? { ...task } : {
    id: '',
    title: '',
    status: 'backlog',
    priority: 'none',
    tags: [],
    subtasks: [],
    comments: [],
    activityLogs: [],
    attachments: [],
    createdAt: '',
    updatedAt: '',
  }));
  const [isDirty, setIsDirty] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'attachments'>('comments');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showCreatorMenu, setShowCreatorMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showFollowerMenu, setShowFollowerMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [previewImage, setPreviewImage] = useState<TaskAttachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const [isComposingComment, setIsComposingComment] = useState(false);
  const [isComposingSubtask, setIsComposingSubtask] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isImageAttachment = (att: TaskAttachment) => {
    if (!att) return false;
    if (att.type && att.type.toLowerCase().startsWith('image/')) return true;
    const name = (att.name || '').toLowerCase();
    return (
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif') ||
      name.endsWith('.webp') ||
      name.endsWith('.svg') ||
      name.endsWith('.bmp') ||
      name.endsWith('.ico')
    );
  };

  const imageAttachments = useMemo(() => {
    return (draftTask.attachments || []).filter(isImageAttachment);
  }, [draftTask.attachments]);

  const currentImageIndex = useMemo(() => {
    if (!previewImage) return -1;
    return imageAttachments.findIndex((a) => a.id === previewImage.id);
  }, [previewImage, imageAttachments]);

  const handleNextImage = useCallback(() => {
    if (imageAttachments.length <= 1) return;
    const curIdx = previewImage ? imageAttachments.findIndex((a) => a.id === previewImage.id) : -1;
    if (curIdx === -1) return;
    const nextIdx = (curIdx + 1) % imageAttachments.length;
    setPreviewImage(imageAttachments[nextIdx]);
    setZoomLevel(1);
    setRotation(0);
  }, [imageAttachments, previewImage]);

  const handlePrevImage = useCallback(() => {
    if (imageAttachments.length <= 1) return;
    const curIdx = previewImage ? imageAttachments.findIndex((a) => a.id === previewImage.id) : -1;
    if (curIdx === -1) return;
    const prevIdx = (curIdx - 1 + imageAttachments.length) % imageAttachments.length;
    setPreviewImage(imageAttachments[prevIdx]);
    setZoomLevel(1);
    setRotation(0);
  }, [imageAttachments, previewImage]);

  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, handleNextImage, handlePrevImage]);

  // Sync draft state whenever a different task is opened
  useEffect(() => {
    if (task) {
      setDraftTask({ ...task });
      setIsDirty(false);
      setIsSavedRecently(false);
      setShowMoreMenu(false);
    }
  }, [task?.id]);

  // Click outside more menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Auto-resize description textarea based on content (no scrollbar inside 5 lines, fully visible)
  const adjustDescHeight = () => {
    if (descTextareaRef.current) {
      descTextareaRef.current.style.height = 'auto';
      descTextareaRef.current.style.height = `${Math.max(130, descTextareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustDescHeight();
  }, [draftTask.description, isOpen]);

  const actorUser: User = currentUser || {
    id: 'current-user-default',
    name: 'Bạn',
    email: 'user@company.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ban&backgroundColor=2383e2',
    color: '#2383e2',
  };

  const columnsList = project?.columns || [];
  const column = columnsList.find((c) => c.id === draftTask.status);
  const colStyle = column ? NOTION_COLORS[column.color] : NOTION_COLORS.gray;
  const priority = PRIORITY_CONFIG[draftTask.priority] || PRIORITY_CONFIG.none;
  const overdue = isOverdue(draftTask.dueDate, draftTask.status);

  // Update local draft task helper
  const updateDraft = (updates: Partial<Task>) => {
    setDraftTask((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
    setIsSavedRecently(false);
  };

  // Explicit Save to Database & Parent State (ONLY when user clicks Save)
  const handleSaveToDatabase = () => {
    if (!task) return;
    const finalDescription = draftTask.description || '';
    const finalBlocks = finalDescription 
      ? [{ id: 'b-main', type: 'paragraph' as const, content: finalDescription }] 
      : [];

    const finalTitle = draftTask.title.trim() || (isNewTask ? 'Công việc mới' : 'Công việc không tên');

    const payload: Task = {
      ...draftTask,
      title: finalTitle,
      description: finalDescription,
      blocks: finalBlocks,
      updatedAt: new Date().toISOString(),
    };

    // Save to parent state and Supabase DB
    setDraftTask(payload);
    onUpdateTask(task.id, payload, isNewTask);
    setIsDirty(false);
    setIsSavedRecently(true);

    // Dispatch event to all stakeholders (Creator/Reviewer, Assignees, Followers)
    const isCompleted = payload.status === 'done';
    const notifType: TaskNotification['type'] = isNewTask 
      ? 'assigned' 
      : isCompleted 
      ? 'status_change' 
      : 'property_change';

    const notifTitle = isNewTask 
      ? 'Đã tạo công việc mới' 
      : isCompleted 
      ? 'Đã hoàn thành công việc' 
      : 'Cập nhật công việc';

    const notifMsg = isNewTask 
      ? `${actorUser.name} đã tạo công việc "${finalTitle}" trong dự án ${project.title}`
      : isCompleted
      ? `${actorUser.name} đã hoàn thành công việc "${finalTitle}"`
      : `${actorUser.name} đã cập nhật thông tin công việc "${finalTitle}"`;

    dispatchTaskEvent({
      project,
      task: payload,
      actor: actorUser,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
    });

    // Trigger toast notification "Đã lưu"
    triggerToast({
      title: 'Đã lưu',
      message: `Công việc "${finalTitle}" đã được lưu thành công vào cơ sở dữ liệu.`,
      type: 'property_change',
    });

    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2500);
  };

  // Close handler: Discards unsaved draft changes and closes modal cleanly without auto-saving
  const handleClose = () => {
    onClose();
  };

  // Helper to append activity log into draft
  const logActivityInDraft = (action: TaskActivityLog['action'], details: string, extraUpdates: Partial<Task> = {}) => {
    if (!task) return;
    const newLog: TaskActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      taskId: task.id,
      userId: actorUser.id,
      userName: actorUser.name,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    const currentLogs = draftTask.activityLogs || [];
    const updatedLogs = [newLog, ...currentLogs];

    updateDraft({
      ...extraUpdates,
      activityLogs: updatedLogs,
    });
  };

  // Subtask handlers
  const handleToggleSubtask = (subId: string) => {
    const updated = (draftTask.subtasks || []).map((s) => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    const allDone = updated.length > 0 && updated.every((s) => s.completed);
    const targetSub = (draftTask.subtasks || []).find((s) => s.id === subId);
    const newStatus = allDone ? 'done' : draftTask.status === 'done' ? 'in_progress' : draftTask.status;

    logActivityInDraft(
      'general',
      language === 'en'
        ? `${targetSub?.completed ? 'Uncompleted' : 'Completed'} subtask "${targetSub?.text}"`
        : `Đã ${targetSub?.completed ? 'bỏ hoàn thành' : 'hoàn thành'} việc con "${targetSub?.text}"`,
      { subtasks: updated, status: newStatus }
    );
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;

    const newSub: SubTask = {
      id: `st-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    const updated = [...(draftTask.subtasks || []), newSub];
    logActivityInDraft(
      'general', 
      language === 'en' ? `Added subtask "${newSub.text}"` : `Đã thêm việc con "${newSub.text}"`, 
      { subtasks: updated }
    );
    setNewSubtaskText('');
  };

  const handleDeleteSubtask = (subId: string) => {
    const targetSub = (draftTask.subtasks || []).find((s) => s.id === subId);
    const updated = (draftTask.subtasks || []).filter((s) => s.id !== subId);
    logActivityInDraft(
      'general', 
      language === 'en' ? `Deleted subtask "${targetSub?.text}"` : `Đã xóa việc con "${targetSub?.text}"`, 
      { subtasks: updated }
    );
  };

  // Tag toggle
  const handleToggleTag = (tag: Tag) => {
    const currentTags = draftTask.tags || [];
    const exists = currentTags.some((t) => t.id === tag.id);
    const updatedTags = exists 
      ? currentTags.filter((t) => t.id !== tag.id)
      : [...currentTags, tag];

    logActivityInDraft(
      'tag_change',
      language === 'en'
        ? `${exists ? 'Removed' : 'Added'} tag "${tag.label}"`
        : `Đã ${exists ? 'gỡ' : 'thêm'} thẻ nhãn "${tag.label}"`,
      { tags: updatedTags }
    );
  };

  // Set Reviewer (Người duyệt)
  const handleSetCreator = (user: User) => {
    logActivityInDraft(
      'general', 
      language === 'en' ? `Assigned reviewer: ${user.name}` : `Đã chọn người duyệt công việc là ${user.name}`, 
      { creator: user }
    );
    setShowCreatorMenu(false);
  };

  // Assignee single select (Người phụ trách - Chỉ 1 người)
  const handleSetAssignee = (user: User) => {
    const currentAssignees = draftTask.assignees || [];
    const isSame = currentAssignees.length === 1 && (
      currentAssignees[0].id === user.id ||
      (user.email && currentAssignees[0].email?.toLowerCase() === user.email?.toLowerCase())
    );

    if (isSame) {
      logActivityInDraft(
        'assignee_change', 
        language === 'en' ? `Removed assignee ${user.name}` : `Đã bỏ phân công ${user.name}`, 
        { assignees: [] }
      );
    } else {
      logActivityInDraft(
        'assignee_change', 
        language === 'en' ? `Assigned task to ${user.name}` : `Đã phân công công việc cho ${user.name}`, 
        { assignees: [user] }
      );
    }
    setShowAssigneeMenu(false);
  };

  const handleRemoveAssignee = () => {
    const current = draftTask.assignees?.[0];
    if (current) {
      logActivityInDraft(
        'assignee_change', 
        language === 'en' ? `Removed assignee ${current.name}` : `Đã bỏ phân công ${current.name}`, 
        { assignees: [] }
      );
    } else {
      updateDraft({ assignees: [] });
    }
  };

  // Follower toggle
  const handleToggleFollower = (user: User) => {
    const currentFollowers = draftTask.followers || [];
    const exists = currentFollowers.some((u) => u.id === user.id || (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()));
    const updated = exists 
      ? currentFollowers.filter((u) => u.id !== user.id && (!user.email || u.email?.toLowerCase() !== user.email?.toLowerCase()))
      : [...currentFollowers, user];

    logActivityInDraft(
      'general',
      language === 'en'
        ? `${exists ? 'Stopped following' : 'Started following'} task`
        : `Đã ${exists ? 'ngừng theo dõi' : 'bắt đầu theo dõi'} công việc`,
      { followers: updated }
    );
  };

  const isCurrentUserFollowing = currentUser 
    ? (draftTask.followers || []).some((u) => u.id === currentUser.id || (currentUser.email && u.email === currentUser.email))
    : false;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;

    const newComment: TaskComment = {
      id: `comment-${Date.now()}`,
      userId: actorUser.id,
      userName: actorUser.name,
      userAvatar: actorUser.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...(draftTask.comments || []), newComment];
    const updatedDraft = {
      ...draftTask,
      comments: updatedComments,
    };
    logActivityInDraft(
      'general', 
      language === 'en' 
        ? `Added comment: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"` 
        : `Đã thêm bình luận: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`, 
      { comments: updatedComments }
    );

    // Notify all stakeholders about the new comment
    dispatchTaskEvent({
      project,
      task: updatedDraft,
      actor: actorUser,
      type: 'comment',
      title: language === 'en' ? 'New comment' : 'Bình luận mới',
      message: language === 'en'
        ? `${actorUser.name} commented on "${draftTask.title}": "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`
        : `${actorUser.name} đã bình luận vào "${draftTask.title}": "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
    });

    setCommentInput('');
  };

  const handleStatusChange = (newStatus: string) => {
    const oldCol = project.columns.find((c) => c.id === draftTask.status);
    const newCol = project.columns.find((c) => c.id === newStatus);

    const oldTitle = oldCol?.title || draftTask.status;
    const newTitle = newCol?.title || newStatus;

    logActivityInDraft(
      'status_change',
      language === 'en'
        ? `Changed status from "${translateStatus(oldTitle, 'en')}" to "${translateStatus(newTitle, 'en')}"`
        : `Đã đổi trạng thái từ "${oldTitle}" sang "${newTitle}"`,
      { status: newStatus }
    );
  };

  const handlePriorityChange = (newPriority: PriorityLevel) => {
    const oldLabel = PRIORITY_CONFIG[draftTask.priority]?.label || draftTask.priority;
    const newLabel = PRIORITY_CONFIG[newPriority]?.label || newPriority;

    logActivityInDraft(
      'priority_change',
      language === 'en'
        ? `Changed priority from "${translatePriority(draftTask.priority, 'en')}" to "${translatePriority(newPriority, 'en')}"`
        : `Đã đổi mức ưu tiên từ "${oldLabel}" sang "${newLabel}"`,
      { priority: newPriority }
    );
  };

  const handleDueDateChange = (newDueDate: string) => {
    logActivityInDraft(
      'date_change',
      language === 'en'
        ? `Changed due date to ${newDueDate || 'Not set'}`
        : `Đã thay đổi hạn chót thành ${newDueDate || 'Chưa đặt'}`,
      { dueDate: newDueDate }
    );
  };

  const handleStartDateChange = (newStartDate: string) => {
    logActivityInDraft(
      'date_change',
      language === 'en'
        ? `Changed start date to ${newStartDate || 'Not set'}`
        : `Đã thay đổi ngày bắt đầu thành ${newStartDate || 'Chưa đặt'}`,
      { startDate: newStartDate }
    );
  };

  const handleDueTimeChange = (newDueTime: string) => {
    logActivityInDraft(
      'time_change',
      language === 'en'
        ? `Set due time to ${newDueTime}`
        : `Đã đặt giờ hết hạn là ${newDueTime}`,
      { dueTime: newDueTime }
    );
  };

  // File Upload handling (< 5MB constraint)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError(null);
    const file = files[0];

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(
        language === 'en'
          ? 'File size exceeds maximum limit (5MB max). Please choose a smaller file.'
          : 'Dung lượng tệp vượt quá giới hạn cho phép (tối đa 5MB). Vui lòng chọn tệp nhỏ hơn.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      const newAttachment: TaskAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: base64Url,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [...(draftTask.attachments || []), newAttachment];
      logActivityInDraft(
        'general', 
        language === 'en'
          ? `Attached file "${file.name}" (${formatFileSize(file.size)})`
          : `Đã đính kèm tệp "${file.name}" (${formatFileSize(file.size)})`, 
        { attachments: updated }
      );

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (attId: string) => {
    const targetAtt = (draftTask.attachments || []).find((a) => a.id === attId);
    const updated = (draftTask.attachments || []).filter((a) => a.id !== attId);
    logActivityInDraft(
      'general', 
      language === 'en'
        ? `Removed attachment "${targetAtt?.name}"`
        : `Đã gỡ tệp đính kèm "${targetAtt?.name}"`, 
      { attachments: updated }
    );
  };

  // Archive toggle
  const handleToggleArchive = () => {
    const nextArchived = !draftTask.isArchived;
    updateDraft({ isArchived: nextArchived });
    setShowMoreMenu(false);

    if (nextArchived && onArchiveTask) {
      onArchiveTask(task.id);
    } else if (!nextArchived && onUnarchiveTask) {
      onUnarchiveTask(task.id);
    }
  };

  // Copy task link/id
  const handleCopyLink = () => {
    if (!task) return;
    navigator.clipboard.writeText(`${window.location.origin}/#task-${task.id}`);
    setCopyToast(true);
    setShowMoreMenu(false);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon size={18} className="text-blue-500 shrink-0" />;
    if (fileType.includes('pdf')) return <FileText size={18} className="text-red-500 shrink-0" />;
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />;
    }
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <FileArchive size={18} className="text-amber-500 shrink-0" />;
    }
    return <File size={18} className="text-gray-500 shrink-0" />;
  };

  if (!isOpen || !task) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`h-full flex flex-col overflow-hidden border-l transition-all duration-300 ${
            isFullWidth ? 'w-full max-w-5xl mx-auto rounded-none' : 'w-full max-w-2xl'
          } ${
            isPink
              ? 'bg-[#fff8f9] border-[#fecdd3] text-[#4c0519] shadow-2xl'
              : darkMode 
              ? 'bg-[#111215] border-white/10 text-[#f4f4f5] linear-modal-dark shadow-[-12px_0_48px_rgba(0,0,0,0.8)]' 
              : 'bg-white border-[#e3e2e0] text-[#37352f] shadow-[-12px_0_36px_rgba(0,0,0,0.12)]'
          }`}
        >
          {/* Top Action Bar (Frosted Glass) */}
          <div className={`p-3 border-b flex items-center justify-between shrink-0 backdrop-blur-xl ${
            isPink
              ? 'border-[#fecdd3] bg-[#fff0f3]/95'
              : darkMode ? 'border-white/[0.07] bg-[#0d0e11]/85 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]' : 'border-[#ededeb] bg-[#fbfbfa]/95'
          }`}>
            <div className={`flex items-center gap-1.5 text-xs truncate max-w-[40%] ${isPink ? 'text-[#881337]' : darkMode ? 'text-[#a1a1aa]' : 'text-[#9b9a97]'}`}>
              <span className="truncate">{project.title}</span>
              <span>/</span>
              <span className={`font-semibold ${isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#f4f4f5]' : 'text-[#5a5a58]'}`}>
                {language === 'en' ? 'Task Details' : 'Chi tiết công việc'}
              </span>
              {draftTask.isArchived && (
                <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Archive size={10} /> {language === 'en' ? 'Archived' : 'Đã lưu trữ'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* PRIMARY "LƯU" (SAVE) BUTTON */}
              <button
                id="btn-save-task-detail"
                onClick={handleSaveToDatabase}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all ${
                  isSavedRecently
                    ? 'bg-emerald-600 text-white'
                    : isDirty
                    ? (isPink ? 'bg-[#e11d48] hover:bg-[#be123c] text-white ring-2 ring-rose-400/40' : 'bg-[#2383e2] hover:bg-[#1d6ec0] text-white ring-2 ring-blue-400/30')
                    : (isPink ? 'bg-[#be123c] hover:bg-[#9f1239] text-white' : 'bg-emerald-600/90 hover:bg-emerald-600 text-white')
                }`}
                title={language === 'en' ? 'Save changes to database' : 'Xác nhận lưu thay đổi vào cơ sở dữ liệu'}
              >
                {isSavedRecently ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    <span>{language === 'en' ? 'Saved' : 'Đã lưu'}</span>
                  </>
                ) : (
                  <>
                    <Save size={14} strokeWidth={2} />
                    <span>{isNewTask ? (language === 'en' ? 'Create task' : 'Tạo task') : (language === 'en' ? 'Save' : 'Lưu')}</span>
                    {isDirty && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                    )}
                  </>
                )}
              </button>

              {/* 3-DOTS MORE ACTIONS MENU (Consolidates Archive, Delete, Copy Link, etc.) */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  id="btn-task-more-menu"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    showMoreMenu
                      ? (isPink ? 'bg-[#ffe4e6] border-[#fecdd3] text-[#4c0519]' : darkMode ? 'bg-[#333] border-[#444] text-white' : 'bg-[#e8e7e4] border-[#ccc] text-black')
                      : (isPink ? 'border-[#fecdd3] text-[#881337] hover:text-[#4c0519] hover:bg-[#ffe4e6]' : darkMode ? 'border-[#333] text-[#aaa] hover:text-white hover:bg-[#2c2c2c]' : 'border-[#e3e2e0] text-[#787774] hover:text-[#37352f] hover:bg-[#efedea]')
                  }`}
                  title={language === 'en' ? 'More actions' : 'Chức năng chi tiết khác'}
                >
                  <MoreVertical size={16} />
                </button>

                {showMoreMenu && (
                  <div className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl shadow-xl border p-1 z-50 text-xs ${
                    isPink ? 'bg-[#fff8f9] border-[#fecdd3] text-[#4c0519]' : darkMode ? 'bg-[#242424] border-[#383838] text-[#ddd]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
                  }`}>
                    {/* Toggle Archive */}
                    <button
                      onClick={handleToggleArchive}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                      }`}
                    >
                      <Archive size={14} className={draftTask.isArchived ? 'text-amber-500' : 'text-[#888]'} />
                      <span>{draftTask.isArchived ? (language === 'en' ? 'Unarchive task' : 'Bỏ lưu trữ (hiện lại trên bảng)') : (language === 'en' ? 'Archive task' : 'Lưu trữ công việc')}</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                      }`}
                    >
                      <Copy size={14} className="text-[#888]" />
                      <span>{language === 'en' ? 'Copy task link' : 'Sao chép liên kết'}</span>
                    </button>

                    <div className={`my-1 border-t ${darkMode ? 'border-[#333]' : 'border-[#eee]'}`} />

                    {/* Delete Action */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>{language === 'en' ? 'Delete task (Trash)' : 'Xóa công việc (Thùng rác)'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Fullscreen Expand / Collapse */}
              <button
                onClick={() => setIsFullWidth(!isFullWidth)}
                className={`p-1.5 rounded-md transition-colors ${
                  isPink ? 'hover:bg-[#ffe4e6] text-[#881337]' : darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#efedea] text-[#787774]'
                }`}
                title={isFullWidth ? (language === 'en' ? 'Minimize' : 'Thu nhỏ') : (language === 'en' ? 'Expand' : 'Mở rộng')}
              >
                {isFullWidth ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <div className={`w-[1px] h-4 mx-0.5 ${isPink ? 'bg-[#fecdd3]' : darkMode ? 'bg-[#333]' : 'bg-[#e3e2e0]'}`} />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className={`p-1.5 rounded-md transition-colors ${
                  isPink ? 'hover:bg-[#ffe4e6] text-[#881337]' : darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#efedea] text-[#787774]'
                }`}
                title={language === 'en' ? 'Close' : 'Đóng cửa sổ'}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Copy link toast indicator */}
          {copyToast && (
            <div className="bg-[#2383e2] text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={14} />
              <span>{language === 'en' ? 'Task link copied to clipboard!' : 'Đã sao chép liên kết công việc vào clipboard!'}</span>
            </div>
          )}

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 no-scrollbar">
            {/* Task Title */}
            <div>
              <input
                type="text"
                value={draftTask.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder={language === 'en' ? 'Task name...' : 'Tên công việc...'}
                className={`text-xl sm:text-2xl font-bold w-full bg-transparent outline-none ${
                  isPink ? 'text-[#4c0519] placeholder-[#9f1239]/50' : darkMode ? 'text-white placeholder-[#9b9a97]' : 'text-[#37352f] placeholder-[#9b9a97]'
                }`}
              />
            </div>

            {/* Properties Table */}
            <div className={`space-y-3 text-xs border-y py-4 ${
              isPink ? 'border-[#fecdd3]' : 'border-[#f1f1ef] dark:border-[#2b2b2b]'
            }`}>
              {/* Status Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className={`flex items-center gap-2 ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>
                  <Clock size={14} />
                  <span>{language === 'en' ? 'Status' : 'Trạng thái'}</span>
                </div>
                <div className="col-span-2">
                  <select
                    value={draftTask.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold outline-none cursor-pointer ${colStyle.badgeBg}`}
                  >
                    {project.columns.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-black">
                        {translateStatus(c.title, language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className={`flex items-center gap-2 ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>
                  <AlertCircle size={14} />
                  <span>{language === 'en' ? 'Priority' : 'Mức độ ưu tiên'}</span>
                </div>
                <div className="col-span-2">
                  <select
                    value={draftTask.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium outline-none cursor-pointer ${priority.badgeBg} ${priority.badgeText}`}
                  >
                    {(['urgent', 'high', 'medium', 'low', 'none'] as PriorityLevel[]).map((p) => (
                      <option key={p} value={p} className="bg-white text-black">
                        {translatePriority(p, language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-3 items-start gap-2 pt-1">
                <div className={`flex items-center gap-2 pt-1 ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>
                  <Calendar size={14} />
                  <span>{language === 'en' ? 'Dates & Time' : 'Thời hạn & Giờ'}</span>
                </div>
                <div className="col-span-2 space-y-2">
                  {/* Date pickers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                        {language === 'en' ? 'From:' : 'Từ:'}
                      </span>
                      <input
                        type="date"
                        value={draftTask.startDate || ''}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className={`text-xs px-2 py-1 rounded-md border outline-none ${
                          isPink
                            ? 'bg-[#fff0f3] border-[#fecdd3] text-[#4c0519]'
                            : darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-[#f7f6f3] border-[#e3e2e0]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                        {language === 'en' ? 'To:' : 'Đến:'}
                      </span>
                      <input
                        type="date"
                        value={draftTask.dueDate || ''}
                        onChange={(e) => handleDueDateChange(e.target.value)}
                        className={`text-xs px-2 py-1 rounded-md border outline-none ${
                          overdue
                            ? 'bg-red-50 border-red-300 text-red-600'
                            : isPink
                            ? 'bg-[#fff0f3] border-[#fecdd3] text-[#4c0519]'
                            : darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-[#f7f6f3] border-[#e3e2e0]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Time pickers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-[#9b9a97]" />
                      <span className="text-[10px] text-[#9b9a97]">{language === 'en' ? 'Due time:' : 'Giờ hết hạn:'}</span>
                      <input
                        type="time"
                        value={draftTask.dueTime || '18:00'}
                        onChange={(e) => handleDueTimeChange(e.target.value)}
                        className={`text-xs px-2 py-1 rounded-md border outline-none ${
                          darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-[#f7f6f3] border-[#e3e2e0]'
                        }`}
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: language === 'en' ? '18:00 (End of day)' : '18:00 (Hết giờ làm)', val: '18:00' },
                        { label: '12:00', val: '12:00' },
                        { label: '23:59', val: '23:59' },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => handleDueTimeChange(preset.val)}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                            draftTask.dueTime === preset.val
                              ? 'bg-blue-50 border-blue-300 text-[#2383e2] dark:bg-blue-950 dark:border-blue-700'
                              : (darkMode ? 'border-[#3a3a3a] text-[#888] hover:text-white' : 'border-[#e3e2e0] text-[#787774] hover:text-black')
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviewer (Người duyệt) Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 text-[#9b9a97]">
                  <UserCheck size={14} className="text-purple-500" />
                  <span>{language === 'en' ? 'Reviewer' : 'Người duyệt'}</span>
                </div>
                <div className="col-span-2 relative">
                  <div className="flex items-center gap-2">
                    {draftTask.creator ? (
                      <div
                        onClick={() => setShowCreatorMenu(!showCreatorMenu)}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          darkMode ? 'bg-[#262626] border-[#383838] hover:bg-[#303030]' : 'bg-[#f7f6f3] border-[#e3e2e0] hover:bg-[#efede9]'
                        }`}
                        title={language === 'en' ? 'Click to change reviewer' : 'Bấm để đổi người duyệt'}
                      >
                        <img
                          src={draftTask.creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(draftTask.creator.name)}&backgroundColor=2383e2`}
                          alt={draftTask.creator.name}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold">{draftTask.creator.name}</span>
                        {draftTask.creator.email && (
                          <span className="text-[10px] text-[#9b9a97] hidden sm:inline">({draftTask.creator.email})</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCreatorMenu(!showCreatorMenu)}
                        className={`px-2 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                          darkMode ? 'border-[#3a3a3a] text-[#888] hover:text-white' : 'border-[#e3e2e0] text-[#787774] hover:text-[#37352f]'
                        }`}
                      >
                        <UserPlus size={13} />
                        <span>{language === 'en' ? 'Assign reviewer' : 'Gán người duyệt'}</span>
                      </button>
                    )}
                  </div>

                  {showCreatorMenu && (
                    <UserAutofillDropdown
                      availableUsers={availableUsers}
                      selectedUsers={draftTask.creator ? [draftTask.creator] : []}
                      onToggleUser={(u) => handleSetCreator(u)}
                      onClose={() => setShowCreatorMenu(false)}
                      title={language === 'en' ? 'Select task reviewer' : 'Chọn người duyệt công việc'}
                      placeholder={language === 'en' ? 'Search by name or email...' : 'Tìm tên hoặc email người duyệt...'}
                      isSingleSelect={true}
                      currentUser={currentUser}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              </div>

              {/* Assignees Property (Single select) */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 text-[#9b9a97]">
                  <UserIcon size={14} />
                  <span>{language === 'en' ? 'Assignee' : 'Người phụ trách'}</span>
                </div>
                <div className="col-span-2 relative">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {draftTask.assignees && draftTask.assignees.length > 0 ? (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          darkMode ? 'bg-[#262626] border-[#383838] hover:bg-[#303030]' : 'bg-[#f7f6f3] border-[#e3e2e0] hover:bg-[#efede9]'
                        }`}
                      >
                        <div 
                          onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                          className="flex items-center gap-1.5"
                          title={language === 'en' ? 'Click to change assignee' : 'Bấm để đổi người phụ trách'}
                        >
                          <img
                            src={draftTask.assignees[0].avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(draftTask.assignees[0].name)}&backgroundColor=2383e2`}
                            alt={draftTask.assignees[0].name}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                          <span className="font-semibold">{draftTask.assignees[0].name}</span>
                          {draftTask.assignees[0].email && (
                            <span className="text-[10px] text-[#9b9a97] hidden sm:inline">({draftTask.assignees[0].email})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAssignee();
                          }}
                          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#9b9a97] hover:text-red-500 transition-colors ml-0.5"
                          title={language === 'en' ? 'Remove assignee' : 'Bỏ người phụ trách'}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                        className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 font-medium transition-colors ${
                          darkMode ? 'border-[#3a3a3a] text-[#888] hover:text-white hover:bg-[#2a2a2a]' : 'border-[#e3e2e0] text-[#787774] hover:text-[#37352f] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        <Plus size={12} />
                        <span>{language === 'en' ? 'Select assignee' : 'Chọn người phụ trách'}</span>
                      </button>
                    )}
                  </div>

                  {showAssigneeMenu && (
                    <UserAutofillDropdown
                      availableUsers={availableUsers}
                      selectedUsers={draftTask.assignees || []}
                      onToggleUser={(u) => handleSetAssignee(u)}
                      onClose={() => setShowAssigneeMenu(false)}
                      title={language === 'en' ? 'Select assignee (1 person)' : 'Chọn người phụ trách (1 người)'}
                      placeholder={language === 'en' ? 'Type member name or email...' : 'Gõ tên hoặc email thành viên...'}
                      isSingleSelect={true}
                      currentUser={currentUser}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              </div>

              {/* Followers Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 text-[#9b9a97]">
                  <Eye size={14} />
                  <span>{language === 'en' ? 'Followers' : 'Người theo dõi'}</span>
                </div>
                <div className="col-span-2 relative">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentUser && (
                      <button
                        onClick={() => handleToggleFollower(currentUser)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                          isCurrentUserFollowing
                            ? 'bg-blue-50 border-blue-200 text-[#2383e2] dark:bg-blue-950/60 dark:border-blue-800'
                            : (darkMode ? 'border-[#3a3a3a] text-[#888] hover:text-white hover:bg-[#2a2a2a]' : 'border-[#e3e2e0] text-[#787774] hover:text-[#37352f] hover:bg-[#f5f5f5]')
                        }`}
                        title={isCurrentUserFollowing ? (language === 'en' ? 'Click to unfollow' : 'Bấm để bỏ theo dõi') : (language === 'en' ? 'Click to receive updates' : 'Bấm để nhận thông báo về task này')}
                      >
                        <Eye size={11} className={isCurrentUserFollowing ? 'text-[#2383e2]' : ''} />
                        <span>{isCurrentUserFollowing ? (language === 'en' ? 'Following' : 'Đang theo dõi') : (language === 'en' ? 'Follow' : 'Theo dõi')}</span>
                      </button>
                    )}

                    {(draftTask.followers || []).map((u) => (
                      <span
                        key={u.id || u.email}
                        onClick={() => handleToggleFollower(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-[#f1f1ef] border-[#e3e2e0]'
                        }`}
                        title={language === 'en' ? 'Click to remove follower' : 'Bấm để xóa người theo dõi'}
                      >
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=2383e2`}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                        <span>{u.name}</span>
                        <X size={10} className="text-[#9b9a97]" />
                      </span>
                    ))}

                    <button
                      onClick={() => setShowFollowerMenu(!showFollowerMenu)}
                      className={`p-1 px-2 rounded-xl border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                        darkMode ? 'border-[#3a3a3a] text-[#888] hover:text-white hover:bg-[#2a2a2a]' : 'border-[#e3e2e0] text-[#787774] hover:text-[#37352f] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      <Plus size={12} />
                      <span>{language === 'en' ? 'Add person' : 'Thêm người'}</span>
                    </button>
                  </div>

                  {showFollowerMenu && (
                    <UserAutofillDropdown
                      availableUsers={availableUsers}
                      selectedUsers={draftTask.followers || []}
                      onToggleUser={(u) => handleToggleFollower(u)}
                      onClose={() => setShowFollowerMenu(false)}
                      title={language === 'en' ? 'Select followers' : 'Chọn người theo dõi'}
                      placeholder={language === 'en' ? 'Type name or email...' : 'Gõ tên hoặc email người theo dõi...'}
                      isSingleSelect={false}
                      currentUser={currentUser}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              </div>

            </div>

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                  <CheckSquare size={14} />
                  <span>{language === 'en' ? 'Subtasks' : 'Danh sách việc con (Subtasks)'}</span>
                </h3>
                <span className={`text-xs font-mono ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>
                  {(draftTask.subtasks || []).filter((s) => s.completed).length}/{(draftTask.subtasks || []).length} {language === 'en' ? 'completed' : 'hoàn thành'}
                </span>
              </div>

              <div className="space-y-1.5">
                {(draftTask.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-2 rounded-lg border group transition-colors ${
                      isPink
                        ? 'bg-[#fff0f3] border-[#fecdd3]'
                        : darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className={`w-4 h-4 rounded cursor-pointer ${isPink ? 'accent-[#e11d48]' : 'accent-[#2383e2]'}`}
                      />
                      <span className={`text-xs ${st.completed ? (isPink ? 'line-through text-[#9f1239]/60' : 'line-through text-[#9b9a97]') : (isPink ? 'text-[#4c0519]' : '')}`}>
                        {st.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#9b9a97] hover:text-red-500 transition-opacity p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    if (isComposingSubtask) {
                      e.preventDefault();
                      return;
                    }
                    handleAddSubtask(e);
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Add subtask item... (press Enter)' : 'Thêm mục cần làm... (nhấn Enter)'}
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onCompositionStart={() => setIsComposingSubtask(true)}
                    onCompositionEnd={() => setIsComposingSubtask(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.nativeEvent.isComposing || isComposingSubtask || e.keyCode === 229)) {
                        e.stopPropagation();
                      }
                    }}
                    className={`flex-1 text-xs px-3 py-2 border rounded-lg outline-none ${
                      isPink
                        ? 'bg-[#fff5f6] border-[#fecdd3] text-[#4c0519] placeholder-[#9f1239]/50'
                        : darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-white border-[#e3e2e0]'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskText.trim()}
                    className={`px-3 py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors ${
                      isPink ? 'bg-[#e11d48] hover:bg-[#be123c]' : 'bg-[#2383e2] hover:bg-[#1d6ec0]'
                    }`}
                  >
                    {language === 'en' ? 'Add' : 'Thêm'}
                  </button>
                </form>
              </div>
            </div>

            {/* Notes / Description Section - FULL DISPLAY (No fixed 5-line scrolling box) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                  <AlignLeft size={14} />
                  <span>{language === 'en' ? 'Description & Notes' : 'Nội dung ghi chú'}</span>
                </h3>
                <span className={`text-[11px] ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>
                  {(draftTask.description || '').length} {language === 'en' ? 'characters' : 'ký tự'}
                </span>
              </div>

              <div className={`rounded-xl border transition-all ${
                isPink
                  ? 'bg-[#fff5f6] border-[#fecdd3] focus-within:ring-2 focus-within:ring-[#e11d48]'
                  : darkMode ? 'bg-[#242424] border-[#313131] focus-within:ring-2 focus-within:ring-[#2383e2]' : 'bg-[#fdfdfc] border-[#e8e7e4] focus-within:ring-2 focus-within:ring-[#2383e2]'
              }`}>
                <textarea
                  ref={descTextareaRef}
                  value={draftTask.description || ''}
                  onChange={(e) => {
                    updateDraft({ description: e.target.value });
                    adjustDescHeight();
                  }}
                  placeholder={language === 'en' ? 'Enter notes, summary or detailed specifications for this task... (All lines displayed)' : 'Nhập nội dung ghi chú, tóm tắt hoặc yêu cầu chi tiết cho công việc này... (Hiển thị đầy đủ mọi dòng)'}
                  className={`w-full text-xs p-3.5 bg-transparent outline-none resize-none leading-relaxed font-sans min-h-[130px] ${
                    isPink
                      ? 'text-[#4c0519] placeholder-[#9f1239]/60'
                      : darkMode ? 'text-[#dedede] placeholder-[#666]' : 'text-[#37352f] placeholder-[#9b9a97]'
                  }`}
                />
              </div>
            </div>

            {/* Tabs: Comments vs Activity Log vs File Attachments */}
            <div className={`border-t pt-5 space-y-4 ${
              isPink ? 'border-[#fecdd3]' : 'border-[#f1f1ef] dark:border-[#2b2b2b]'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 flex-wrap gap-2 ${
                isPink ? 'border-[#fecdd3]' : 'border-[#f1f1ef] dark:border-[#2b2b2b]'
              }`}>
                <div className={`flex items-center gap-1 p-1 rounded-xl ${
                  isPink ? 'bg-[#ffe4e6]' : 'bg-black/5 dark:bg-white/5'
                }`}>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'comments'
                        ? (isPink ? 'bg-white text-[#9f1239] shadow-xs font-bold' : darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                        : (isPink ? 'text-[#881337] hover:text-[#4c0519]' : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white')
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>{language === 'en' ? 'Comments' : 'Trao đổi'} ({(draftTask.comments || []).length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'attachments'
                        ? (isPink ? 'bg-white text-[#9f1239] shadow-xs font-bold' : darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                        : (isPink ? 'text-[#881337] hover:text-[#4c0519]' : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white')
                    }`}
                  >
                    <Paperclip size={13} />
                    <span>{language === 'en' ? 'Attachments' : 'Tệp đính kèm'} ({(draftTask.attachments || []).length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'activity'
                        ? (isPink ? 'bg-white text-[#9f1239] shadow-xs font-bold' : darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                        : (isPink ? 'text-[#881337] hover:text-[#4c0519]' : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white')
                    }`}
                  >
                    <History size={13} />
                    <span>{language === 'en' ? 'Activity Log' : 'Lịch sử'} ({draftTask.activityLogs ? draftTask.activityLogs.length : 1})</span>
                  </button>
                </div>

                {activeTab === 'attachments' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex items-center gap-1 px-3 py-1.5 text-white rounded-lg text-xs font-semibold transition-colors ${
                        isPink ? 'bg-[#e11d48] hover:bg-[#be123c]' : 'bg-[#2383e2] hover:bg-[#1d6ec0]'
                      }`}
                    >
                      <Plus size={13} />
                      <span>{language === 'en' ? 'Add file (<5MB)' : 'Thêm tệp (<5MB)'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 1: Comments */}
              {activeTab === 'comments' && (
                <div className="space-y-3">
                  {(draftTask.comments || []).length === 0 ? (
                    <div className={`p-5 rounded-xl border text-center text-xs ${
                      isPink
                        ? 'bg-[#fff0f3] border-[#fecdd3] text-[#881337]'
                        : darkMode ? 'bg-[#242424]/50 border-[#2f2f2f] text-[#777]' : 'bg-[#fafafa] border-[#e8e7e4] text-[#9b9a97]'
                    }`}>
                      {language === 'en' 
                        ? 'No comments yet. Leave a comment to discuss task progress.' 
                        : 'Chưa có trao đổi nào. Hãy để lại bình luận để thảo luận tiến độ công việc.'}
                    </div>
                  ) : (
                    (draftTask.comments || []).map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isPink
                            ? 'bg-[#fff0f3] border-[#fecdd3]'
                            : darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={c.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.userName)}&backgroundColor=2383e2`}
                              alt={c.userName}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <strong className={isPink ? 'text-[#4c0519]' : darkMode ? 'text-white' : 'text-[#37352f]'}>{c.userName}</strong>
                          </div>
                          <span 
                            title={formatFullTimestamp(c.createdAt)}
                            className={`text-[10px] font-mono ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}
                          >
                            {formatRelativeTime(c.createdAt)} ({formatFullTimestamp(c.createdAt)})
                          </span>
                        </div>
                        <p className={`pl-7 leading-relaxed ${isPink ? 'text-[#881337]' : darkMode ? 'text-[#bbb]' : 'text-[#5a5a58]'}`}>{c.text}</p>
                      </div>
                    ))
                  )}

                  <form
                    onSubmit={(e) => {
                      if (isComposingComment) {
                        e.preventDefault();
                        return;
                      }
                      handleAddComment(e);
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Write a comment or discussion about this task...' : 'Viết bình luận hoặc trao đổi về công việc này...'}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onCompositionStart={() => setIsComposingComment(true)}
                      onCompositionEnd={() => setIsComposingComment(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.nativeEvent.isComposing || isComposingComment || e.keyCode === 229)) {
                          e.stopPropagation();
                        }
                      }}
                      className={`flex-1 text-xs px-3 py-2 border rounded-lg outline-none ${
                        isPink
                          ? 'bg-[#fff5f6] border-[#fecdd3] text-[#4c0519] placeholder-[#9f1239]/50'
                          : darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-white border-[#e3e2e0]'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className={`px-3.5 py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-all ${
                        isPink ? 'bg-[#e11d48] hover:bg-[#be123c]' : 'bg-[#2383e2] hover:bg-[#1d6ec0]'
                      }`}
                    >
                      {language === 'en' ? 'Send' : 'Gửi'}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: File Attachments (< 5MB) */}
              {activeTab === 'attachments' && (
                <div className="space-y-3">
                  {fileError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  {(draftTask.attachments || []).length === 0 ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-6 rounded-xl border border-dashed text-center text-xs cursor-pointer transition-colors ${
                        isPink
                          ? 'bg-[#fff0f3] border-[#fecdd3] hover:bg-[#ffe4e6]'
                          : darkMode ? 'bg-[#242424]/40 border-[#3a3a3a] hover:bg-[#282828]' : 'bg-[#fafafa] border-[#d8d7d4] hover:bg-[#f0f0ee]'
                      }`}
                    >
                      <Paperclip size={20} className={`mx-auto mb-2 ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`} />
                      <p className={`font-semibold ${isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#ccc]' : 'text-[#5a5a58]'}`}>
                        {language === 'en' ? 'Click to upload attachments' : 'Nhấn để tải lên tệp đính kèm'}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                        {language === 'en' ? 'Maximum size < 5MB (images, documents, pdf, zip)' : 'Giới hạn dung lượng tối đa < 5MB (hình ảnh, tài liệu, pdf, nén)'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(draftTask.attachments || []).map((att) => {
                        const isImg = isImageAttachment(att);

                        return (
                          <div
                            key={att.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all group ${
                              isPink
                                ? 'bg-[#fff0f3] border-[#fecdd3]'
                                : darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                            }`}
                          >
                            <div 
                              className={`flex items-center gap-2.5 min-w-0 ${isImg ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (isImg) {
                                  setPreviewImage(att);
                                  setZoomLevel(1);
                                  setRotation(0);
                                }
                              }}
                              title={isImg ? (language === 'en' ? 'Click to view in window' : 'Nhấn để xem dạng cửa sổ') : att.name}
                            >
                              {isImg ? (
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shrink-0 bg-black/5 dark:bg-white/5">
                                  <img 
                                    src={att.url} 
                                    alt={att.name} 
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" 
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye size={12} />
                                  </div>
                                </div>
                              ) : (
                                getFileIcon(att.type)
                              )}

                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${
                                  isImg ? 'group-hover:underline text-blue-600 dark:text-blue-400' : (isPink ? 'text-[#4c0519]' : darkMode ? 'text-white' : 'text-[#37352f]')
                                }`} title={att.name}>
                                  {att.name}
                                </p>
                                <p className={`text-[10px] ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                                  {formatFileSize(att.size)} • {formatRelativeTime(att.uploadedAt)}
                                  {isImg && (
                                    <span className="ml-1.5 text-blue-500 font-medium hidden sm:inline">
                                      • {language === 'en' ? 'Click to view' : 'Xem cửa sổ'}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isImg && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewImage(att);
                                    setZoomLevel(1);
                                    setRotation(0);
                                  }}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    isPink ? 'text-[#e11d48] hover:bg-[#ffe4e6]' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                                  }`}
                                  title={language === 'en' ? 'View in window' : 'Xem dạng cửa sổ'}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              <a
                                href={att.url}
                                download={att.name}
                                className={`p-1.5 rounded-md transition-colors ${
                                  isPink ? 'text-[#e11d48] hover:bg-[#ffe4e6]' : 'text-[#2383e2] hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                                title={language === 'en' ? 'Download file' : 'Tải xuống tệp'}
                              >
                                <Download size={14} />
                              </a>
                              <button
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                                title={language === 'en' ? 'Delete file' : 'Xóa tệp'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Activity Log & Creation Date */}
              {activeTab === 'activity' && (
                <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
                  {/* Creation log item */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isPink
                      ? 'bg-[#fff0f3] border-[#fecdd3]'
                      : darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 font-semibold ${isPink ? 'text-[#4c0519]' : darkMode ? 'text-white' : 'text-[#37352f]'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{language === 'en' ? 'Task created' : 'Khởi tạo công việc'}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}>
                        {formatFullTimestamp(draftTask.createdAt)}
                      </span>
                    </div>
                    <p className={`pl-3.5 ${isPink ? 'text-[#881337]' : darkMode ? 'text-[#aaa]' : 'text-[#787774]'}`}>
                      {language === 'en' ? 'Task was initialized in workspace.' : 'Công việc được khởi tạo vào hệ thống.'}
                    </p>
                  </div>

                  {/* List of activity logs */}
                  {(draftTask.activityLogs || []).map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        isPink
                          ? 'bg-[#fff0f3] border-[#fecdd3]'
                          : darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 font-semibold ${isPink ? 'text-[#4c0519]' : darkMode ? 'text-white' : 'text-[#37352f]'}`}>
                          <span className={`w-2 h-2 rounded-full ${isPink ? 'bg-[#e11d48]' : 'bg-[#2383e2]'}`} />
                          <span>{log.userName}</span>
                        </div>
                        <span 
                          title={formatFullTimestamp(log.timestamp)}
                          className={`text-[10px] font-mono ${isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'}`}
                        >
                          {formatRelativeTime(log.timestamp)} ({formatFullTimestamp(log.timestamp)})
                        </span>
                      </div>
                      <p className={`pl-3.5 leading-relaxed ${isPink ? 'text-[#881337]' : darkMode ? 'text-[#aaa]' : 'text-[#787774]'}`}>
                        {log.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDeleteTask(task.id);
          onClose();
        }}
        title={language === 'en' ? 'Delete this task?' : 'Xóa công việc này?'}
        description={language === 'en' ? 'The task will be moved to Archive (Trash). You can easily restore it anytime.' : 'Công việc sẽ được chuyển vào Kho lưu trữ (Thùng rác). Bạn có thể dễ dàng khôi phục lại bất cứ lúc nào.'}
        confirmText={language === 'en' ? 'Move to Trash' : 'Chuyển vào Thùng rác'}
        cancelText={language === 'en' ? 'Cancel' : 'Hủy bỏ'}
        darkMode={darkMode}
      />

      {/* ================= IMAGE PREVIEW WINDOW (LIGHTBOX / MODAL) ================= */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-6 select-none"
          onClick={() => setPreviewImage(null)}
        >
          {/* Top Window Bar */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-white backdrop-blur-xl shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Image Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ImageIcon size={18} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md" title={previewImage.name}>
                  {previewImage.name}
                </h4>
                <p className="text-[11px] text-zinc-400 flex items-center gap-2">
                  <span>{formatFileSize(previewImage.size)}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(previewImage.uploadedAt)}</span>
                  {imageAttachments.length > 1 && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-cyan-400 font-semibold">
                        {currentImageIndex + 1}/{imageAttachments.length}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                disabled={zoomLevel <= 0.5}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                title={language === 'en' ? 'Zoom out' : 'Thu nhỏ'}
              >
                <ZoomOut size={16} />
              </button>

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={language === 'en' ? 'Reset zoom' : 'Đặt lại phóng to'}
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                disabled={zoomLevel >= 3}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                title={language === 'en' ? 'Zoom in' : 'Phóng to'}
              >
                <ZoomIn size={16} />
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:inline-flex cursor-pointer"
                title={language === 'en' ? 'Rotate' : 'Xoay ảnh'}
              >
                <RotateCw size={16} />
              </button>

              <div className="h-5 w-px bg-white/15 mx-1" />

              {/* Open in new tab */}
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:inline-flex"
                title={language === 'en' ? 'Open in new tab' : 'Mở tab mới'}
              >
                <ExternalLink size={16} />
              </a>

              {/* Download */}
              <a
                href={previewImage.url}
                download={previewImage.name}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                title={language === 'en' ? 'Download image' : 'Tải xuống ảnh'}
              >
                <Download size={16} />
              </a>

              {/* Close Window */}
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                title={language === 'en' ? 'Close window (Esc)' : 'Đóng cửa sổ (Esc)'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Central Image Canvas with Prev/Next Navigation */}
          <div 
            className="flex-1 w-full max-w-6xl flex items-center justify-center relative overflow-hidden my-3"
            onClick={() => setPreviewImage(null)}
          >
            {/* Prev Image Button */}
            {imageAttachments.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 shadow-xl transition-all hover:scale-110 cursor-pointer"
                title={language === 'en' ? 'Previous image (←)' : 'Ảnh trước (←)'}
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Next Image Button */}
            {imageAttachments.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 shadow-xl transition-all hover:scale-110 cursor-pointer"
                title={language === 'en' ? 'Next image (→)' : 'Ảnh kế tiếp (→)'}
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Image Viewer Element */}
            <div 
              className="max-h-full max-w-full flex items-center justify-center p-2 cursor-default overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage.url}
                alt={previewImage.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/10 select-none bg-black/40"
              />
            </div>
          </div>

          {/* Bottom Hint Bar */}
          <div 
            className="text-[11px] text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs flex items-center gap-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{language === 'en' ? 'Press Esc to close' : 'Nhấn Esc để đóng'}</span>
            {imageAttachments.length > 1 && (
              <>
                <span>•</span>
                <span>{language === 'en' ? 'Use ← → arrow keys to switch images' : 'Dùng phím mũi tên ← → để chuyển ảnh'}</span>
              </>
            )}
            <span>•</span>
            <span>{language === 'en' ? 'Click outside to exit' : 'Bấm ra ngoài để thoát'}</span>
          </div>
        </div>
      )}
    </>
  );
};
