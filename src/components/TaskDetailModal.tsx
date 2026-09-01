import React, { useState, useRef, useEffect } from 'react';
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
  User 
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
  CheckCircle2 
} from 'lucide-react';
import { UserAutofillDropdown } from './UserAutofillDropdown';

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
  currentUser,
  availableUsers = [],
}) => {
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

  const [isComposingComment, setIsComposingComment] = useState(false);
  const [isComposingSubtask, setIsComposingSubtask] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

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
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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
      updatedAt: getTodayString(),
    };

    // Save to parent state and Supabase DB
    onUpdateTask(task.id, payload, isNewTask);
    setIsDirty(false);
    setIsSavedRecently(true);

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
      `Đã ${targetSub?.completed ? 'bỏ hoàn thành' : 'hoàn thành'} việc con "${targetSub?.text}"`,
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
    logActivityInDraft('general', `Đã thêm việc con "${newSub.text}"`, { subtasks: updated });
    setNewSubtaskText('');
  };

  const handleDeleteSubtask = (subId: string) => {
    const targetSub = (draftTask.subtasks || []).find((s) => s.id === subId);
    const updated = (draftTask.subtasks || []).filter((s) => s.id !== subId);
    logActivityInDraft('general', `Đã xóa việc con "${targetSub?.text}"`, { subtasks: updated });
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
      `Đã ${exists ? 'gỡ' : 'thêm'} thẻ nhãn "${tag.label}"`,
      { tags: updatedTags }
    );
  };

  // Set Reviewer (Người duyệt)
  const handleSetCreator = (user: User) => {
    logActivityInDraft('general', `Đã chọn người duyệt công việc là ${user.name}`, { creator: user });
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
      logActivityInDraft('assignee_change', `Đã bỏ phân công ${user.name}`, { assignees: [] });
    } else {
      logActivityInDraft('assignee_change', `Đã phân công công việc cho ${user.name}`, { assignees: [user] });
    }
    setShowAssigneeMenu(false);
  };

  const handleRemoveAssignee = () => {
    const current = draftTask.assignees?.[0];
    if (current) {
      logActivityInDraft('assignee_change', `Đã bỏ phân công ${current.name}`, { assignees: [] });
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
      `Đã ${exists ? 'ngừng theo dõi' : 'bắt đầu theo dõi'} công việc`,
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
    logActivityInDraft('general', `Đã thêm bình luận: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`, {
      comments: updatedComments,
    });

    setCommentInput('');
  };

  const handleStatusChange = (newStatus: string) => {
    const oldCol = project.columns.find((c) => c.id === draftTask.status);
    const newCol = project.columns.find((c) => c.id === newStatus);

    logActivityInDraft(
      'status_change',
      `Đã đổi trạng thái từ "${oldCol?.title || draftTask.status}" sang "${newCol?.title || newStatus}"`,
      { status: newStatus }
    );
  };

  const handlePriorityChange = (newPriority: PriorityLevel) => {
    const oldLabel = PRIORITY_CONFIG[draftTask.priority]?.label || draftTask.priority;
    const newLabel = PRIORITY_CONFIG[newPriority]?.label || newPriority;

    logActivityInDraft(
      'priority_change',
      `Đã đổi mức ưu tiên từ "${oldLabel}" sang "${newLabel}"`,
      { priority: newPriority }
    );
  };

  const handleDueDateChange = (newDueDate: string) => {
    logActivityInDraft(
      'date_change',
      `Đã thay đổi hạn chót thành ${newDueDate || 'Chưa đặt'}`,
      { dueDate: newDueDate }
    );
  };

  const handleStartDateChange = (newStartDate: string) => {
    logActivityInDraft(
      'date_change',
      `Đã thay đổi ngày bắt đầu thành ${newStartDate || 'Chưa đặt'}`,
      { startDate: newStartDate }
    );
  };

  const handleDueTimeChange = (newDueTime: string) => {
    logActivityInDraft(
      'time_change',
      `Đã đặt giờ hết hạn là ${newDueTime}`,
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
      setFileError('Dung lượng tệp vượt quá giới hạn cho phép (tối đa 5MB). Vui lòng chọn tệp nhỏ hơn.');
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
      logActivityInDraft('general', `Đã đính kèm tệp "${file.name}" (${formatFileSize(file.size)})`, {
        attachments: updated,
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (attId: string) => {
    const targetAtt = (draftTask.attachments || []).find((a) => a.id === attId);
    const updated = (draftTask.attachments || []).filter((a) => a.id !== attId);
    logActivityInDraft('general', `Đã gỡ tệp đính kèm "${targetAtt?.name}"`, {
      attachments: updated,
    });
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
        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" 
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`h-full flex flex-col overflow-hidden shadow-2xl border-l transition-all duration-300 ${
            isFullWidth ? 'w-full max-w-5xl mx-auto rounded-none' : 'w-full max-w-2xl'
          } ${darkMode ? 'bg-[#1e1e1e] border-[#313131] text-[#dedede]' : 'bg-white border-[#e3e2e0] text-[#37352f]'}`}
        >
          {/* Top Action Bar */}
          <div className={`p-3 border-b flex items-center justify-between shrink-0 ${
            darkMode ? 'border-[#2f2f2f] bg-[#1a1a1a]' : 'border-[#ededeb] bg-[#fbfbfa]'
          }`}>
            <div className="flex items-center gap-1.5 text-xs text-[#9b9a97] truncate max-w-[40%]">
              <span className="truncate">{project.title}</span>
              <span>/</span>
              <span className="font-semibold text-[#5a5a58] dark:text-[#ccc]">Chi tiết công việc</span>
              {draftTask.isArchived && (
                <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Archive size={10} /> Đã lưu trữ
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
                    ? 'bg-[#2383e2] hover:bg-[#1d6ec0] text-white ring-2 ring-blue-400/30'
                    : 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
                }`}
                title="Xác nhận lưu thay đổi vào cơ sở dữ liệu"
              >
                {isSavedRecently ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    <span>Đã lưu</span>
                  </>
                ) : (
                  <>
                    <Save size={14} strokeWidth={2} />
                    <span>{isNewTask ? 'Tạo task' : 'Lưu'}</span>
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
                      ? (darkMode ? 'bg-[#333] border-[#444] text-white' : 'bg-[#e8e7e4] border-[#ccc] text-black')
                      : (darkMode ? 'border-[#333] text-[#aaa] hover:text-white hover:bg-[#2c2c2c]' : 'border-[#e3e2e0] text-[#787774] hover:text-[#37352f] hover:bg-[#efedea]')
                  }`}
                  title="Chức năng chi tiết khác"
                >
                  <MoreVertical size={16} />
                </button>

                {showMoreMenu && (
                  <div className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl shadow-xl border p-1 z-50 text-xs ${
                    darkMode ? 'bg-[#242424] border-[#383838] text-[#ddd]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
                  }`}>
                    {/* Toggle Archive */}
                    <button
                      onClick={handleToggleArchive}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                      }`}
                    >
                      <Archive size={14} className={draftTask.isArchived ? 'text-amber-500' : 'text-[#888]'} />
                      <span>{draftTask.isArchived ? 'Bỏ lưu trữ (hiện lại trên bảng)' : 'Lưu trữ công việc'}</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                      }`}
                    >
                      <Copy size={14} className="text-[#888]" />
                      <span>Sao chép liên kết</span>
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
                      <span>Xóa công việc (Thùng rác)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Fullscreen Expand / Collapse */}
              <button
                onClick={() => setIsFullWidth(!isFullWidth)}
                className={`p-1.5 rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#efedea] text-[#787774]'
                }`}
                title={isFullWidth ? 'Thu nhỏ' : 'Mở rộng'}
              >
                {isFullWidth ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <div className={`w-[1px] h-4 mx-0.5 ${darkMode ? 'bg-[#333]' : 'bg-[#e3e2e0]'}`} />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className={`p-1.5 rounded-md transition-colors ${
                  darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#efedea] text-[#787774]'
                }`}
                title="Đóng cửa sổ"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Copy link toast indicator */}
          {copyToast && (
            <div className="bg-[#2383e2] text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={14} />
              <span>Đã sao chép liên kết công việc vào clipboard!</span>
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
                placeholder="Tên công việc..."
                className={`text-xl sm:text-2xl font-bold w-full bg-transparent outline-none placeholder-[#9b9a97] ${
                  darkMode ? 'text-white' : 'text-[#37352f]'
                }`}
              />
            </div>

            {/* Properties Table */}
            <div className="space-y-3 text-xs border-y py-4 border-[#f1f1ef] dark:border-[#2b2b2b]">
              {/* Status Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 text-[#9b9a97]">
                  <Clock size={14} />
                  <span>Trạng thái</span>
                </div>
                <div className="col-span-2">
                  <select
                    value={draftTask.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold outline-none cursor-pointer ${colStyle.badgeBg}`}
                  >
                    {project.columns.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-black">
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 text-[#9b9a97]">
                  <AlertCircle size={14} />
                  <span>Mức độ ưu tiên</span>
                </div>
                <div className="col-span-2">
                  <select
                    value={draftTask.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium outline-none cursor-pointer ${priority.badgeBg} ${priority.badgeText}`}
                  >
                    {(['urgent', 'high', 'medium', 'low', 'none'] as PriorityLevel[]).map((p) => (
                      <option key={p} value={p} className="bg-white text-black">
                        {PRIORITY_CONFIG[p].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-3 items-start gap-2 pt-1">
                <div className="flex items-center gap-2 text-[#9b9a97] pt-1">
                  <Calendar size={14} />
                  <span>Thời hạn & Giờ</span>
                </div>
                <div className="col-span-2 space-y-2">
                  {/* Date pickers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#9b9a97]">Từ:</span>
                      <input
                        type="date"
                        value={draftTask.startDate || ''}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className={`text-xs px-2 py-1 rounded-md border outline-none ${
                          darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-[#f7f6f3] border-[#e3e2e0]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#9b9a97]">Đến:</span>
                      <input
                        type="date"
                        value={draftTask.dueDate || ''}
                        onChange={(e) => handleDueDateChange(e.target.value)}
                        className={`text-xs px-2 py-1 rounded-md border outline-none ${
                          overdue
                            ? 'bg-red-50 border-red-300 text-red-600'
                            : darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-[#f7f6f3] border-[#e3e2e0]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Time pickers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-[#9b9a97]" />
                      <span className="text-[10px] text-[#9b9a97]">Giờ hết hạn:</span>
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
                        { label: '18:00 (Hết giờ làm)', val: '18:00' },
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
                          {preset.val}
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
                  <span>Người duyệt</span>
                </div>
                <div className="col-span-2 relative">
                  <div className="flex items-center gap-2">
                    {draftTask.creator ? (
                      <div
                        onClick={() => setShowCreatorMenu(!showCreatorMenu)}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          darkMode ? 'bg-[#262626] border-[#383838] hover:bg-[#303030]' : 'bg-[#f7f6f3] border-[#e3e2e0] hover:bg-[#efede9]'
                        }`}
                        title="Bấm để đổi người duyệt"
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
                        <span>Gán người duyệt</span>
                      </button>
                    )}
                  </div>

                  {showCreatorMenu && (
                    <UserAutofillDropdown
                      availableUsers={availableUsers}
                      selectedUsers={draftTask.creator ? [draftTask.creator] : []}
                      onToggleUser={(u) => handleSetCreator(u)}
                      onClose={() => setShowCreatorMenu(false)}
                      title="Chọn người duyệt công việc"
                      placeholder="Tìm tên hoặc email người duyệt..."
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
                  <span>Người phụ trách</span>
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
                          title="Bấm để đổi người phụ trách"
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
                          title="Bỏ người phụ trách"
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
                        <span>Chọn người phụ trách</span>
                      </button>
                    )}
                  </div>

                  {showAssigneeMenu && (
                    <UserAutofillDropdown
                      availableUsers={availableUsers}
                      selectedUsers={draftTask.assignees || []}
                      onToggleUser={(u) => handleSetAssignee(u)}
                      onClose={() => setShowAssigneeMenu(false)}
                      title="Chọn người phụ trách (1 người)"
                      placeholder="Gõ tên hoặc email thành viên..."
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
                  <span>Người theo dõi</span>
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
                        title={isCurrentUserFollowing ? 'Bấm để bỏ theo dõi' : 'Bấm để nhận thông báo về task này'}
                      >
                        <Eye size={11} className={isCurrentUserFollowing ? 'text-[#2383e2]' : ''} />
                        <span>{isCurrentUserFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
                      </button>
                    )}

                    {(draftTask.followers || []).map((u) => (
                      <span
                        key={u.id || u.email}
                        onClick={() => handleToggleFollower(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          darkMode ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-[#f1f1ef] border-[#e3e2e0]'
                        }`}
                        title="Bấm để xóa người theo dõi"
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
                      <span>Thêm người</span>
                    </button>
                  </div>

                  {showFollowerMenu && (
                    <UserAutofillDropdown
                      availableUsers={availableUsers}
                      selectedUsers={draftTask.followers || []}
                      onToggleUser={(u) => handleToggleFollower(u)}
                      onClose={() => setShowFollowerMenu(false)}
                      title="Chọn người theo dõi"
                      placeholder="Gõ tên hoặc email người theo dõi..."
                      isSingleSelect={false}
                      currentUser={currentUser}
                      darkMode={darkMode}
                    />
                  )}
                </div>
              </div>

              {/* Tags Property */}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-2 text-[#9b9a97]">
                  <TagIcon size={14} />
                  <span>Thẻ nhãn (Tags)</span>
                </div>
                <div className="col-span-2 relative">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(draftTask.tags || []).map((t) => (
                      <span
                        key={t.id}
                        onClick={() => handleToggleTag(t)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium cursor-pointer hover:opacity-80 ${
                          NOTION_COLORS[t.color].badgeBg
                        }`}
                      >
                        <span>{t.label}</span>
                        <X size={10} />
                      </span>
                    ))}

                    <button
                      onClick={() => setShowTagMenu(!showTagMenu)}
                      className={`p-1 rounded-md border text-[11px] flex items-center gap-1 ${
                        darkMode ? 'border-[#3a3a3a] text-[#888]' : 'border-[#e3e2e0] text-[#787774]'
                      }`}
                    >
                      <Plus size={12} />
                      <span>Thêm thẻ</span>
                    </button>
                  </div>

                  {showTagMenu && (
                    <div className={`absolute top-full left-0 mt-1 w-52 rounded-xl shadow-xl border p-1 z-30 max-h-48 overflow-y-auto ${
                      darkMode ? 'bg-[#262626] border-[#383838]' : 'bg-white border-[#e3e2e0]'
                    }`}>
                      {SAMPLE_TAGS.map((tag) => {
                        const isSelected = (draftTask.tags || []).some((t) => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                              darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]'
                            }`}
                          >
                            <span className={`text-[11px] px-2 py-0.5 rounded ${NOTION_COLORS[tag.color].badgeBg}`}>
                              {tag.label}
                            </span>
                            {isSelected && <Check size={13} className="text-blue-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9b9a97] flex items-center gap-1.5">
                  <CheckSquare size={14} />
                  <span>Danh sách việc con (Subtasks)</span>
                </h3>
                <span className="text-xs font-mono text-[#9b9a97]">
                  {(draftTask.subtasks || []).filter((s) => s.completed).length}/{(draftTask.subtasks || []).length} hoàn thành
                </span>
              </div>

              <div className="space-y-1.5">
                {(draftTask.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-2 rounded-lg border group transition-colors ${
                      darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="w-4 h-4 rounded accent-[#2383e2] cursor-pointer"
                      />
                      <span className={`text-xs ${st.completed ? 'line-through text-[#9b9a97]' : ''}`}>
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
                    placeholder="Thêm mục cần làm... (nhấn Enter)"
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
                      darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-white border-[#e3e2e0]'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskText.trim()}
                    className="px-3 py-2 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
                  >
                    Thêm
                  </button>
                </form>
              </div>
            </div>

            {/* Notes / Description Section - FULL DISPLAY (No fixed 5-line scrolling box) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9b9a97] flex items-center gap-1.5">
                  <AlignLeft size={14} />
                  <span>Nội dung ghi chú</span>
                </h3>
                <span className="text-[11px] text-[#9b9a97]">
                  {(draftTask.description || '').length} ký tự
                </span>
              </div>

              <div className={`rounded-xl border transition-all focus-within:ring-2 focus-within:ring-[#2383e2] ${
                darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fdfdfc] border-[#e8e7e4]'
              }`}>
                <textarea
                  ref={descTextareaRef}
                  value={draftTask.description || ''}
                  onChange={(e) => {
                    updateDraft({ description: e.target.value });
                    adjustDescHeight();
                  }}
                  placeholder="Nhập nội dung ghi chú, tóm tắt hoặc yêu cầu chi tiết cho công việc này... (Hiển thị đầy đủ mọi dòng)"
                  className={`w-full text-xs p-3.5 bg-transparent outline-none resize-none leading-relaxed font-sans min-h-[130px] ${
                    darkMode ? 'text-[#dedede] placeholder-[#666]' : 'text-[#37352f] placeholder-[#9b9a97]'
                  }`}
                />
              </div>
            </div>

            {/* Tabs: Comments vs Activity Log vs File Attachments */}
            <div className="border-t pt-5 space-y-4 border-[#f1f1ef] dark:border-[#2b2b2b]">
              <div className="flex items-center justify-between border-b pb-2 border-[#f1f1ef] dark:border-[#2b2b2b] flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'comments'
                        ? (darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                        : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Trao đổi ({(draftTask.comments || []).length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'attachments'
                        ? (darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                        : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
                    }`}
                  >
                    <Paperclip size={13} />
                    <span>Tệp đính kèm ({(draftTask.attachments || []).length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'activity'
                        ? (darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                        : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
                    }`}
                  >
                    <History size={13} />
                    <span>Lịch sử ({draftTask.activityLogs ? draftTask.activityLogs.length : 1})</span>
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
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#2383e2] text-white rounded-lg text-xs font-semibold hover:bg-[#1d6ec0] transition-colors"
                    >
                      <Plus size={13} />
                      <span>Thêm tệp (&lt;5MB)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 1: Comments */}
              {activeTab === 'comments' && (
                <div className="space-y-3">
                  {(draftTask.comments || []).length === 0 ? (
                    <div className={`p-5 rounded-xl border text-center text-xs ${
                      darkMode ? 'bg-[#242424]/50 border-[#2f2f2f] text-[#777]' : 'bg-[#fafafa] border-[#e8e7e4] text-[#9b9a97]'
                    }`}>
                      Chưa có trao đổi nào. Hãy để lại bình luận để thảo luận tiến độ công việc.
                    </div>
                  ) : (
                    (draftTask.comments || []).map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
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
                            <strong className="text-[#37352f] dark:text-white">{c.userName}</strong>
                          </div>
                          <span 
                            title={formatFullTimestamp(c.createdAt)}
                            className="text-[10px] text-[#9b9a97] font-mono"
                          >
                            {formatRelativeTime(c.createdAt)} ({formatFullTimestamp(c.createdAt)})
                          </span>
                        </div>
                        <p className="text-[#5a5a58] dark:text-[#bbb] pl-7 leading-relaxed">{c.text}</p>
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
                      placeholder="Viết bình luận hoặc trao đổi về công việc này..."
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
                        darkMode ? 'bg-[#242424] border-[#3a3a3a] text-white' : 'bg-white border-[#e3e2e0]'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-3.5 py-2 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-all"
                    >
                      Gửi
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
                        darkMode ? 'bg-[#242424]/40 border-[#3a3a3a] hover:bg-[#282828]' : 'bg-[#fafafa] border-[#d8d7d4] hover:bg-[#f0f0ee]'
                      }`}
                    >
                      <Paperclip size={20} className="mx-auto mb-2 text-[#9b9a97]" />
                      <p className="font-semibold text-[#5a5a58] dark:text-[#ccc]">Nhấn để tải lên tệp đính kèm</p>
                      <p className="text-[11px] text-[#9b9a97] mt-0.5">Giới hạn dung lượng tối đa &lt; 5MB (hình ảnh, tài liệu, pdf, nén)</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(draftTask.attachments || []).map((att) => (
                        <div
                          key={att.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                            darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(att.type)}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#37352f] dark:text-white truncate" title={att.name}>
                                {att.name}
                              </p>
                              <p className="text-[10px] text-[#9b9a97]">
                                {formatFileSize(att.size)} • {formatRelativeTime(att.uploadedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={att.url}
                              download={att.name}
                              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#2383e2] transition-colors"
                              title="Tải xuống tệp"
                            >
                              <Download size={14} />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                              title="Xóa tệp"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Activity Log & Creation Date */}
              {activeTab === 'activity' && (
                <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
                  {/* Creation log item */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Khởi tạo công việc</span>
                      </div>
                      <span className="text-[10px] text-[#9b9a97] font-mono">
                        {formatFullTimestamp(draftTask.createdAt)}
                      </span>
                    </div>
                    <p className="text-[#787774] dark:text-[#aaa] pl-3.5">
                      Công việc được khởi tạo vào hệ thống.
                    </p>
                  </div>

                  {/* List of activity logs */}
                  {(draftTask.activityLogs || []).map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        darkMode ? 'bg-[#242424] border-[#313131]' : 'bg-[#fbfbfa] border-[#e8e7e4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-white">
                          <span className="w-2 h-2 rounded-full bg-[#2383e2]" />
                          <span>{log.userName}</span>
                        </div>
                        <span 
                          title={formatFullTimestamp(log.timestamp)}
                          className="text-[10px] text-[#9b9a97] font-mono"
                        >
                          {formatRelativeTime(log.timestamp)} ({formatFullTimestamp(log.timestamp)})
                        </span>
                      </div>
                      <p className="text-[#787774] dark:text-[#aaa] pl-3.5 leading-relaxed">
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
        title="Xóa công việc này?"
        description="Công việc sẽ được chuyển vào Kho lưu trữ (Thùng rác). Bạn có thể dễ dàng khôi phục lại bất cứ lúc nào."
        confirmText="Chuyển vào Thùng rác"
        cancelText="Hủy bỏ"
        darkMode={darkMode}
      />
    </>
  );
};
