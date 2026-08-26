import React, { useState, useEffect } from 'react';
import { ProjectPage, Task } from '../types';
import { Search, X, Calendar, CheckSquare, Layers, ArrowRight } from 'lucide-react';
import { NOTION_COLORS, PRIORITY_CONFIG } from '../utils/notionStyles';
import { formatShortDate } from '../utils/dateUtils';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectPage[];
  onSelectProject: (projectId: string) => void;
  onSelectTask: (projectId: string, task: Task) => void;
  darkMode: boolean;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSelectProject,
  onSelectTask,
  darkMode,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Search results
  const matchingProjects = projects.filter((p) => 
    p.title.toLowerCase().includes(normalizedQuery) ||
    p.description.toLowerCase().includes(normalizedQuery)
  );

  const matchingTasks: Array<{ project: ProjectPage; task: Task }> = [];
  projects.forEach((p) => {
    p.tasks.forEach((t) => {
      if (
        t.title.toLowerCase().includes(normalizedQuery) ||
        t.tags?.some((tag) => tag.label.toLowerCase().includes(normalizedQuery)) ||
        t.subtasks?.some((st) => st.text.toLowerCase().includes(normalizedQuery))
      ) {
        matchingTasks.push({ project: p, task: t });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[500px] ${
          darkMode ? 'bg-[#202020] border-[#333] text-white' : 'bg-white border-[#e3e2e0] text-[#37352f]'
        }`}
      >
        {/* Search input header */}
        <div className={`p-3.5 border-b flex items-center gap-3 ${
          darkMode ? 'border-[#333] bg-[#242424]' : 'border-[#ededeb] bg-[#fbfbfa]'
        }`}>
          <Search size={18} className="text-[#9b9a97]" />
          <input
            type="text"
            placeholder="Tìm kiếm công việc, dự án, thẻ nhãn hoặc nội dung..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm placeholder-[#9b9a97]"
            autoFocus
          />
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              darkMode ? 'hover:bg-[#333] text-[#aaa]' : 'hover:bg-[#efedea] text-[#787774]'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="p-3 overflow-y-auto flex-1 space-y-4 no-scrollbar">
          {/* Projects Results */}
          {matchingProjects.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wider mb-1.5 px-2">
                Dự án & Bảng ({matchingProjects.length})
              </div>
              <div className="space-y-1">
                {matchingProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      darkMode ? 'hover:bg-[#2b2b2b]' : 'hover:bg-[#f1f1ef]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon || '📄'}</span>
                      <span className="font-semibold">{p.title}</span>
                    </div>
                    <span className="text-[#9b9a97] text-[11px]">{p.tasks.length} công việc</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wider mb-1.5 px-2">
                Công việc ({matchingTasks.length})
              </div>
              <div className="space-y-1">
                {matchingTasks.slice(0, 15).map(({ project: p, task: t }) => {
                  const col = p.columns.find((c) => c.id === t.status);
                  const colStyle = col ? NOTION_COLORS[col.color] : NOTION_COLORS.gray;

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        onSelectTask(p.id, t);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs border ${
                        darkMode ? 'bg-[#242424] border-[#313131] hover:bg-[#2c2c2c]' : 'bg-[#fbfbfa] border-[#e8e7e4] hover:bg-[#f1f1ef]'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 pr-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${colStyle.dot}`} />
                        <span className="font-semibold truncate">{t.title}</span>
                        <span className="text-[10px] text-[#9b9a97] shrink-0 font-mono">
                          • {p.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${colStyle.badgeBg}`}>
                          {col?.title || t.status}
                        </span>
                        {t.dueDate && (
                          <span className="text-[10px] text-[#9b9a97] font-mono">
                            {formatShortDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchingProjects.length === 0 && matchingTasks.length === 0 && (
            <div className="py-8 text-center text-xs text-[#9b9a97]">
              Không tìm thấy kết quả nào phù hợp với từ khóa "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
