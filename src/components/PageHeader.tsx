import React, { useState } from 'react';
import { AppTheme, ProjectPage, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { 
  Star, 
  Plus, 
  ChevronRight
} from 'lucide-react';

interface PageHeaderProps {
  project: ProjectPage;
  currentUser: User | null;
  onUpdateProject: (updates: Partial<ProjectPage>) => void;
  onOpenEmojiPicker: () => void;
  onAddNewTask: () => void;
  darkMode: boolean;
  appTheme?: AppTheme;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  project,
  currentUser,
  onUpdateProject,
  onOpenEmojiPicker,
  onAddNewTask,
  darkMode,
  appTheme = 'light',
}) => {
  const { language, t } = useLanguage();
  const isPink = appTheme === 'qanda_pink';
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
          <div className={`flex items-center gap-1.5 text-xs ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>
            <span>{language === 'en' ? 'Workspace' : 'Không gian làm việc'}</span>
            <ChevronRight size={12} className={isPink ? 'text-[#fda4af]' : ''} />
            <span>{project.category || (language === 'en' ? 'Project' : 'Dự án')}</span>
            <ChevronRight size={12} className={isPink ? 'text-[#fda4af]' : ''} />
            <span className={`font-semibold truncate max-w-[200px] ${
              isPink ? 'text-[#4c0519]' : darkMode ? 'text-[#bbb]' : 'text-[#5a5a58]'
            }`}>{project.title}</span>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => onUpdateProject({ isFavorite: !project.isFavorite })}
              className={`p-2 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                project.isFavorite
                  ? (isPink 
                      ? 'bg-[#ffe4e6] border-[#fda4af] text-[#9f1239]' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-xs')
                  : isPink 
                    ? 'bg-white/80 border-[#fda4af] text-[#881337] hover:bg-[#fff0f3]' 
                    : darkMode 
                    ? 'bg-white/[0.04] border-white/[0.08] text-[#a1a1aa] hover:text-white hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]' 
                    : 'bg-white/90 border-[#e3e2e0] text-[#787774] hover:text-[#37352f] shadow-xs'
              }`}
              title={project.isFavorite ? (language === 'en' ? 'Favorited' : 'Đã yêu thích') : (language === 'en' ? 'Add to favorites' : 'Thêm vào mục yêu thích')}
            >
              <Star size={14} className={project.isFavorite ? (isPink ? 'fill-[#e11d48] text-[#e11d48]' : 'fill-amber-500 text-amber-500') : ''} />
            </button>

            <button
              onClick={onAddNewTask}
              className={`px-3.5 py-1.5 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isPink
                  ? 'bg-[#e11d48] hover:bg-[#be123c] active:bg-[#9f1239] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
                  : 'bg-[#2383e2] hover:bg-[#1d6ec0] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]'
              }`}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{t('newTask', 'Tạo công việc')}</span>
            </button>
          </div>
        </div>

        {/* Page Icon (Emoji) & Title */}
        <div className="flex items-start gap-4 mb-2">
          <button
            onClick={onOpenEmojiPicker}
            className={`w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl rounded-2xl flex items-center justify-center shrink-0 transition-transform hover:scale-105 select-none ${
              isPink
                ? 'bg-white/90 backdrop-blur-md border-2 border-[#fda4af] shadow-xs'
                : darkMode 
                ? 'bg-white/[0.05] backdrop-blur-md border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] shadow-black/40' 
                : 'bg-white/90 backdrop-blur-md border border-[#e3e2e0] shadow-xs'
            }`}
            title={language === 'en' ? 'Change icon' : 'Đổi biểu tượng'}
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
                  isPink 
                    ? 'text-[#4c0519] border-[#e11d48]' 
                    : darkMode 
                    ? 'text-white border-blue-500' 
                    : 'text-[#37352f] border-blue-500'
                }`}
                autoFocus
              />
            ) : (
              <h1
                onClick={() => {
                  setTitleInput(project.title);
                  setIsEditingTitle(true);
                }}
                className={`text-2xl sm:text-3xl font-bold cursor-text rounded-md px-1 -ml-1 transition-colors ${
                  isPink 
                    ? 'text-[#4c0519] hover:bg-[#ffe4e6]/50' 
                    : darkMode 
                    ? 'text-white hover:bg-white/5' 
                    : 'text-[#37352f] hover:bg-black/5'
                }`}
              >
                {project.title || (language === 'en' ? 'Untitled' : 'Không có tiêu đề')}
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
                    isPink
                      ? 'text-[#4c0519] border-[#fda4af] bg-white'
                      : darkMode 
                      ? 'text-[#ccc] border-[#444] bg-[#222]' 
                      : 'text-[#5a5a58] border-[#ddd] bg-white'
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
                  className={`text-sm cursor-text rounded-md px-1 -ml-1 transition-colors leading-relaxed ${
                    project.description 
                      ? (isPink ? 'text-[#881337] hover:bg-[#ffe4e6]/40' : darkMode ? 'text-[#aaa] hover:bg-white/5' : 'text-[#787774] hover:bg-black/5') 
                      : (isPink ? 'text-[#9f1239]/70 italic hover:bg-[#ffe4e6]/40' : darkMode ? 'text-[#666] italic hover:bg-white/5' : 'text-[#9b9a97] italic hover:bg-black/5')
                  }`}
                >
                  {project.description || (language === 'en' ? 'Add description or objectives for this board...' : 'Thêm mô tả hoặc mục tiêu cho bảng công việc này...')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
