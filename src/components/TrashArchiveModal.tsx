import React, { useState } from 'react';
import { ProjectPage, Task } from '../types';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatDateVi, formatRelativeTime } from '../utils/dateUtils';
import { 
  X, 
  Archive, 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertTriangle, 
  Calendar,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TrashArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectPage[];
  activeProjectId: string;
  onRestoreTask: (projectId: string, taskId: string) => void;
  onUnarchiveTask: (projectId: string, taskId: string) => void;
  onPermanentlyDeleteTask: (projectId: string, taskId: string) => void;
  onEmptyTrash: (projectId: string) => void;
  onOpenTaskDetail?: (task: Task, project: ProjectPage) => void;
  initialTab?: 'archive' | 'trash';
  darkMode: boolean;
}

export const TrashArchiveModal: React.FC<TrashArchiveModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onRestoreTask,
  onUnarchiveTask,
  onPermanentlyDeleteTask,
  onEmptyTrash,
  onOpenTaskDetail,
  initialTab = 'archive',
  darkMode,
}) => {
  const { language, t, translateStatus, translatePriority } = useLanguage();
  const [activeTab, setActiveTab] = useState<'archive' | 'trash'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);

  if (!isOpen) return null;

  // Aggregate archived tasks across all projects
  const allArchivedTasks: Array<{ task: Task; project: ProjectPage }> = [];
  const allDeletedTasks: Array<{ task: Task; project: ProjectPage }> = [];

  projects.forEach((proj) => {
    (proj.tasks || []).forEach((task) => {
      if (task.isDeleted) {
        allDeletedTasks.push({ task, project: proj });
      } else if (task.isArchived) {
        allArchivedTasks.push({ task, project: proj });
      }
    });
  });

  const currentList = activeTab === 'archive' ? allArchivedTasks : allDeletedTasks;

  // Filter by project and search query
  const filteredList = currentList.filter(({ task, project }) => {
    const matchesProject = selectedProjectFilter === 'all' || project.id === selectedProjectFilter;
    const matchesQuery = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase().trim()));
    return matchesProject && matchesQuery;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl h-[85vh] max-h-[750px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${
          darkMode ? 'bg-[#181818] border-[#313131] text-[#e0e0e0]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:px-6 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'border-[#2a2a2a] bg-[#1c1c1c]' : 'border-[#ebeae7] bg-[#fbfbfa]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activeTab === 'archive'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {activeTab === 'archive' ? <Archive size={22} /> : <Trash2 size={22} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#37352f] dark:text-white">
                {t('archiveAndTrashTitle', 'Kho lưu trữ & Thùng rác')}
              </h2>
              <p className="text-xs text-[#9b9a97]">
                {t('archiveDescription', 'Quản lý các công việc đã hoàn thành được lưu trữ và khôi phục công việc đã xóa')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2c2c2c] text-[#aaa]' : 'hover:bg-[#ebeae7] text-[#787774]'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector & Project Filter */}
        <div className={`px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-[#f1f1ef] bg-[#fdfdfc]'
        }`}>
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'archive'
                  ? (darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                  : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <Archive size={14} className="text-amber-500" />
              <span>{t('archivedTab', 'Đã lưu trữ')} ({allArchivedTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trash')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'trash'
                  ? (darkMode ? 'bg-[#333] text-white shadow-xs' : 'bg-white text-[#37352f] shadow-xs')
                  : 'text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              <Trash2 size={14} className="text-red-500" />
              <span>{t('trashTab', 'Thùng rác')} ({allDeletedTasks.length})</span>
            </button>
          </div>

          {/* Search and Project filter */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
              darkMode ? 'bg-[#242424] border-[#383838]' : 'bg-white border-[#e3e2e0]'
            }`}>
              <Search size={13} className="text-[#9b9a97]" />
              <input
                type="text"
                placeholder={t('searchInArchive', 'Tìm công việc...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-xs w-32 sm:w-44 text-[#37352f] dark:text-white"
              />
            </div>

            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
                darkMode ? 'bg-[#242424] border-[#383838] text-white' : 'bg-white border-[#e3e2e0] text-[#37352f]'
              }`}
            >
              <option value="all">{t('allProjectsOption', 'Tất cả bảng dự án')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.icon} {p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action bar for Trash */}
        {activeTab === 'trash' && allDeletedTasks.length > 0 && (
          <div className={`px-6 py-2 border-b flex items-center justify-between text-xs ${
            darkMode ? 'bg-red-950/20 border-[#383838] text-red-400' : 'bg-red-50/70 border-red-100 text-red-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span>{t('trashNotice', 'Các công việc trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn.')}</span>
            </div>
            <button
              onClick={() => setShowEmptyTrashConfirm(true)}
              className="font-semibold underline hover:text-red-600 transition-colors"
            >
              {t('emptyTrash', 'Dọn sạch thùng rác')}
            </button>
          </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 no-scrollbar min-h-[300px]">
          {filteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#9b9a97] mb-3">
                {activeTab === 'archive' ? <Archive size={24} /> : <Trash2 size={24} />}
              </div>
              <p className="text-sm font-semibold text-[#5a5a58] dark:text-[#aaa]">
                {activeTab === 'archive' 
                  ? t('noArchivedTasks', 'Chưa có công việc nào được lưu trữ') 
                  : t('trashEmpty', 'Thùng rác hiện đang trống')}
              </p>
              <p className="text-xs text-[#9b9a97] mt-1 max-w-sm">
                {activeTab === 'archive'
                  ? (language === 'en' ? 'You can archive completed tasks to keep your board clean.' : 'Bạn có thể lưu trữ các công việc đã hoàn thành để giữ bảng làm việc luôn gọn gàng.')
                  : (language === 'en' ? 'Deleted tasks are kept here so you can restore them anytime.' : 'Các công việc bị xóa sẽ được giữ tại đây để bạn có thể khôi phục lại bất cứ lúc nào.')}
              </p>
            </div>
          ) : (
            filteredList.map(({ task, project }) => {
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;
              const column = project.columns.find((c) => c.id === task.status);
              const colStyle = column ? NOTION_COLORS[column.color] : NOTION_COLORS.gray;

              return (
                <div
                  key={`${project.id}-${task.id}`}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    darkMode 
                      ? 'bg-[#222] border-[#313131] hover:border-[#444]' 
                      : 'bg-white border-[#e3e2e0] hover:border-[#c5c4c1] shadow-2xs'
                  }`}
                >
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onOpenTaskDetail && onOpenTaskDetail(task, project)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{project.icon || '📄'}</span>
                      <span className="text-xs font-semibold text-[#9b9a97] truncate">{project.title}</span>
                      <span className="text-xs text-[#9b9a97]">•</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${colStyle.badgeBg}`}>
                        {translateStatus(column?.title || task.status)}
                      </span>
                      {task.priority !== 'none' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priority.badgeBg} ${priority.badgeText}`}>
                          {translatePriority(task.priority)}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-[#37352f] dark:text-white truncate">
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-[#9b9a97] mt-1.5 flex-wrap">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{formatDateVi(task.dueDate)}</span>
                        </span>
                      )}
                      <span>
                        {language === 'en' ? 'Deleted/Archived' : 'Cập nhật'}: {formatRelativeTime(task.updatedAt || task.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {activeTab === 'archive' ? (
                      <button
                        onClick={() => onUnarchiveTask(project.id, task.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                        title={language === 'en' ? 'Restore card back to board' : 'Đưa thẻ quay lại bảng làm việc'}
                      >
                        <RotateCcw size={13} />
                        <span>{t('restore', 'Khôi phục')}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onRestoreTask(project.id, task.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-[#2383e2] hover:bg-blue-500/20 transition-colors"
                          title={language === 'en' ? 'Restore card to board' : 'Khôi phục thẻ về lại bảng'}
                        >
                          <RotateCcw size={13} />
                          <span>{t('restore', 'Khôi phục')}</span>
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(task.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          title={t('deletePermanently', 'Xóa vĩnh viễn')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className={`p-3 sm:px-6 border-t text-center text-xs text-[#9b9a97] shrink-0 ${
          darkMode ? 'border-[#2f2f2f] bg-[#181818]' : 'border-[#ededeb] bg-[#fbfbfa]'
        }`}>
          <span>
            {activeTab === 'archive'
              ? (language === 'en' ? 'Archived cards are hidden from main views while progress and data are fully preserved.' : 'Thẻ được lưu trữ sẽ ẩn khỏi các chế độ xem chính nhưng dữ liệu và tiến độ vẫn được bảo toàn nguyên vẹn.')
              : (language === 'en' ? 'Trash protects against accidental data deletion.' : 'Thùng rác giúp tránh việc mất mát dữ liệu do lỡ tay xóa nhầm.')}
          </span>
        </div>
      </div>

      {/* Confirmation modal for permanent delete */}
      {confirmDeleteId && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`max-w-sm w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
              darkMode ? 'bg-[#222] border-[#3a3a3a] text-white' : 'bg-white border-[#e3e2e0] text-[#37352f]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold">
                {language === 'en' ? 'Permanently delete this task?' : 'Xóa vĩnh viễn công việc này?'}
              </h3>
              <p className="text-xs text-[#9b9a97]">
                {language === 'en' ? 'This action cannot be undone. Task comments and attachments will be deleted forever.' : 'Hành động này không thể hoàn tác. Công việc và toàn bộ bình luận, tệp đính kèm sẽ bị xóa hoàn toàn khỏi hệ thống.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                  darkMode ? 'border-[#3a3a3a] hover:bg-[#333]' : 'border-[#e3e2e0] hover:bg-[#f5f5f5]'
                }`}
              >
                {t('cancel', 'Hủy bỏ')}
              </button>
              <button
                onClick={() => {
                  const target = allDeletedTasks.find((item) => item.task.id === confirmDeleteId);
                  if (target) {
                    onPermanentlyDeleteTask(target.project.id, target.task.id);
                  }
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                {t('deletePermanently', 'Xóa vĩnh viễn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for Empty Trash */}
      {showEmptyTrashConfirm && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setShowEmptyTrashConfirm(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`max-w-sm w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
              darkMode ? 'bg-[#222] border-[#3a3a3a] text-white' : 'bg-white border-[#e3e2e0] text-[#37352f]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold">
                {language === 'en' ? 'Empty entire trash?' : 'Dọn sạch toàn bộ thùng rác?'}
              </h3>
              <p className="text-xs text-[#9b9a97]">
                {language === 'en' 
                  ? `All ${allDeletedTasks.length} tasks in trash will be permanently deleted and cannot be recovered.` 
                  : `Tất cả ${allDeletedTasks.length} công việc trong thùng rác sẽ bị xóa vĩnh viễn và không thể khôi phục lại.`}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowEmptyTrashConfirm(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${
                  darkMode ? 'border-[#3a3a3a] hover:bg-[#333]' : 'border-[#e3e2e0] hover:bg-[#f5f5f5]'
                }`}
              >
                {t('cancel', 'Hủy bỏ')}
              </button>
              <button
                onClick={() => {
                  projects.forEach((p) => onEmptyTrash(p.id));
                  setShowEmptyTrashConfirm(false);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                {t('emptyTrash', 'Dọn sạch')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
