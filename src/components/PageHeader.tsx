import React, { useState } from 'react';
import { ProjectPage, TaskNotification, User } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { 
  Star, 
  Plus, 
  ChevronRight
} from 'lucide-react';

interface PageHeaderProps {
  project: ProjectPage;
  currentUser: User | null;
  notifications: TaskNotification[];
  onOpenTask: (projectId: string, taskId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (notificationId: string) => void;
  onUpdateProject: (updates: Partial<ProjectPage>) => void;
  onOpenEmojiPicker: () => void;
  onAddNewTask: () => void;
  darkMode: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  project,
  currentUser,
  notifications,
  onOpenTask,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onUpdateProject,
  onOpenEmojiPicker,
  onAddNewTask,
  darkMode,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(project.description);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput !== project.title) {
      onUpdateProject({ title: titleInput.trim() });
    }
  };

  const handleDescSubmit = () => {
    setIsEditingDesc(false);
    if (descInput !== project.description) {
      onUpdateProject({ description: descInput.trim() });
    }
  };

  return (
    <div className="w-full pt-6 pb-2">
      {/* Main Page Title & Meta */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 relative">
        {/* Breadcrumb & Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[#9b9a97]">
            <span>Không gian làm việc</span>
            <ChevronRight size={12} />
            <span>{project.category || 'Dự án'}</span>
            <ChevronRight size={12} />
            <span className="text-[#5a5a58] dark:text-[#bbb] font-medium truncate max-w-[200px]">{project.title}</span>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Notification Center Bell */}
            <NotificationCenter
              notifications={notifications}
              currentUser={currentUser}
              onOpenTask={onOpenTask}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearNotification={onClearNotification}
              darkMode={darkMode}
            />

            <button
              onClick={() => onUpdateProject({ isFavorite: !project.isFavorite })}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                project.isFavorite
                  ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400'
                  : darkMode ? 'bg-[#262626] border-[#333] text-[#888] hover:text-white' : 'bg-white border-[#e3e2e0] text-[#787774] hover:text-[#37352f]'
              }`}
              title={project.isFavorite ? 'Đã yêu thích' : 'Thêm vào mục yêu thích'}
            >
              <Star size={14} className={project.isFavorite ? 'fill-amber-500 text-amber-500' : ''} />
            </button>

            <button
              onClick={onAddNewTask}
              className="px-3.5 py-1.5 bg-[#2383e2] hover:bg-[#1d6ec0] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tạo công việc</span>
            </button>
          </div>
        </div>

        {/* Page Icon (Emoji) & Title */}
        <div className="flex items-start gap-4 mb-2">
          <button
            onClick={onOpenEmojiPicker}
            className={`w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform hover:scale-105 select-none ${
              darkMode ? 'bg-[#262626] border border-[#383838]' : 'bg-white border border-[#e3e2e0]'
            }`}
            title="Đổi biểu tượng"
          >
            {project.icon || '📄'}
          </button>

          <div className="flex-1 min-w-0 pt-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    handleTitleSubmit();
                  }
                }}
                className={`text-2xl sm:text-3xl font-bold w-full bg-transparent outline-none border-b pb-1 ${
                  darkMode ? 'text-white border-blue-500' : 'text-[#37352f] border-blue-500'
                }`}
                autoFocus
              />
            ) : (
              <h1
                onClick={() => {
                  setTitleInput(project.title);
                  setIsEditingTitle(true);
                }}
                className={`text-2xl sm:text-3xl font-bold cursor-text rounded-md hover:bg-black/5 dark:hover:bg-white/5 px-1 -ml-1 transition-colors ${
                  darkMode ? 'text-white' : 'text-[#37352f]'
                }`}
              >
                {project.title || 'Không có tiêu đề'}
              </h1>
            )}

            {/* Description / Subtitle */}
            <div className="mt-1">
              {isEditingDesc ? (
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  onBlur={handleDescSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                      e.preventDefault();
                      handleDescSubmit();
                    }
                  }}
                  className={`text-sm w-full bg-transparent outline-none border rounded-md p-2 resize-none ${
                    darkMode ? 'text-[#ccc] border-[#444] bg-[#222]' : 'text-[#5a5a58] border-[#ddd] bg-white'
                  }`}
                  rows={2}
                  autoFocus
                />
              ) : (
                <p
                  onClick={() => {
                    setDescInput(project.description);
                    setIsEditingDesc(true);
                  }}
                  className={`text-sm cursor-text rounded-md hover:bg-black/5 dark:hover:bg-white/5 px-1 -ml-1 transition-colors leading-relaxed ${
                    project.description ? (darkMode ? 'text-[#aaa]' : 'text-[#787774]') : (darkMode ? 'text-[#666] italic' : 'text-[#9b9a97] italic')
                  }`}
                >
                  {project.description || 'Thêm mô tả hoặc mục tiêu cho bảng công việc này...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
