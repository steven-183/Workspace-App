import React, { useState } from 'react';
import { AppTheme, FilterOptions, StatusId, TimelineZoom, ViewType } from '../types';
import { 
  Kanban, 
  GitCommit, 
  Table, 
  Calendar as CalendarIcon, 
  ListFilter, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Users, 
  X,
  Layers,
  ChevronDown
} from 'lucide-react';

interface ViewSwitcherProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  availableViews: ViewType[];
  onAddView: (view: ViewType) => void;
  filters: FilterOptions;
  onUpdateFilters: (updates: Partial<FilterOptions>) => void;
  timelineZoom: TimelineZoom;
  onTimelineZoomChange: (zoom: TimelineZoom) => void;
  darkMode: boolean;
  appTheme?: AppTheme;
  totalTasks: number;
  filteredTasksCount: number;
}

const VIEW_METADATA: Record<ViewType, { label: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  kanban: { label: 'Bảng Kanban', icon: Kanban },
  timeline: { label: 'Dòng thời gian', icon: GitCommit },
  table: { label: 'Bảng dữ liệu', icon: Table },
  calendar: { label: 'Lịch', icon: CalendarIcon },
};

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  activeView,
  onViewChange,
  availableViews,
  onAddView,
  filters,
  onUpdateFilters,
  timelineZoom,
  onTimelineZoomChange,
  darkMode,
  appTheme = 'light',
  totalTasks,
  filteredTasksCount,
}) => {
  const isPink = appTheme === 'qanda_pink';
  const [showAddViewMenu, setShowAddViewMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(!!filters.search);

  const allPossibleViews: ViewType[] = ['kanban', 'timeline', 'table', 'calendar'];
  const unusedViews = allPossibleViews.filter((v) => !availableViews.includes(v));

  const hasActiveFilters = 
    filters.search ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.dateFilter !== 'all';

  return (
    <div className={`border-b px-6 sm:px-10 py-1 transition-colors sticky top-0 z-10 backdrop-blur-md ${
      isPink 
        ? 'bg-[#fff5f6]/95 border-[#fda4af]' 
        : darkMode 
        ? 'bg-[#191919]/90 border-[#2f2f2f]' 
        : 'bg-[#fbfbfa]/90 border-[#e8e7e4]'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {availableViews.map((view) => {
            const meta = VIEW_METADATA[view];
            const Icon = meta.icon;
            const isActive = activeView === view;

            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? (isPink
                        ? 'bg-white text-[#9f1239] shadow-xs border border-[#fda4af] ring-1 ring-[#fda4af] font-bold'
                        : darkMode 
                        ? 'bg-[#2a2a2a] text-white shadow-xs border border-[#3e3e3e]' 
                        : 'bg-white text-[#37352f] shadow-xs border border-[#e3e2e0]')
                    : (isPink
                        ? 'text-[#881337] hover:text-[#4c0519] hover:bg-[#ffe4e6]'
                        : darkMode 
                        ? 'text-[#888] hover:text-[#ddd] hover:bg-[#252525]' 
                        : 'text-[#787774] hover:text-[#37352f] hover:bg-[#efedea]')
                }`}
              >
                <Icon size={14} className={isActive ? (isPink ? 'text-[#e11d48]' : 'text-[#2383e2]') : ''} />
                <span>{meta.label}</span>
              </button>
            );
          })}

          {unusedViews.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAddViewMenu(!showAddViewMenu)}
                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                  isPink 
                    ? 'text-[#881337] hover:bg-[#ffe4e6]' 
                    : darkMode 
                    ? 'text-[#888] hover:bg-[#262626]' 
                    : 'text-[#787774] hover:bg-[#efedea]'
                }`}
                title="Thêm chế độ xem"
              >
                <Plus size={14} />
              </button>

              {showAddViewMenu && (
                <div className={`absolute top-full left-0 mt-1 w-44 rounded-xl shadow-xl border p-1 z-30 ${
                  isPink 
                    ? 'bg-white border-[#fda4af]' 
                    : darkMode 
                    ? 'bg-[#262626] border-[#383838]' 
                    : 'bg-white border-[#e3e2e0]'
                }`}>
                  <div className={`px-2 py-1 text-[10px] font-semibold uppercase ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>Thêm chế độ xem</div>
                  {unusedViews.map((v) => {
                    const meta = VIEW_METADATA[v];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={v}
                        onClick={() => {
                          onAddView(v);
                          onViewChange(v);
                          setShowAddViewMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                          isPink 
                            ? 'hover:bg-[#fff0f3] text-[#4c0519]' 
                            : darkMode 
                            ? 'hover:bg-[#333] text-[#ddd]' 
                            : 'hover:bg-[#f1f1ef] text-[#37352f]'
                        }`}
                      >
                        <Icon size={13} className={isPink ? 'text-[#e11d48]' : ''} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls & Filters */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Zoom buttons if activeView === 'timeline' */}
          {activeView === 'timeline' && (
            <div className={`flex items-center rounded-lg p-0.5 border text-xs mr-1 ${
              isPink 
                ? 'bg-[#ffe4e6] border-[#fda4af]' 
                : darkMode 
                ? 'bg-[#242424] border-[#383838]' 
                : 'bg-[#efedea] border-[#e0deda]'
            }`}>
              {(['day', 'week', 'month'] as TimelineZoom[]).map((z) => (
                <button
                  key={z}
                  onClick={() => onTimelineZoomChange(z)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    timelineZoom === z
                      ? (isPink 
                          ? 'bg-white text-[#9f1239] shadow-xs font-semibold ring-1 ring-[#fda4af]' 
                          : darkMode 
                          ? 'bg-[#333] text-white shadow-xs' 
                          : 'bg-white text-[#37352f] shadow-xs')
                      : isPink 
                      ? 'text-[#881337] hover:text-[#4c0519]' 
                      : 'text-[#787774] hover:text-[#37352f]'
                  }`}
                >
                  {z === 'day' ? 'Ngày' : z === 'week' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          )}

          {/* Quick Search */}
          {showSearchInput ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
              isPink 
                ? 'bg-white border-[#fda4af]' 
                : darkMode 
                ? 'bg-[#242424] border-[#383838]' 
                : 'bg-white border-[#e3e2e0]'
            }`}>
              <Search size={13} className={isPink ? 'text-[#9f1239]' : 'text-[#9b9a97]'} />
              <input
                type="text"
                placeholder="Lọc theo từ khóa..."
                value={filters.search}
                onChange={(e) => onUpdateFilters({ search: e.target.value })}
                className={`bg-transparent outline-none text-xs w-32 sm:w-40 ${
                  isPink ? 'text-[#4c0519] placeholder-[#881337]/60' : darkMode ? 'text-[#ddd]' : 'text-[#37352f]'
                }`}
                autoFocus
              />
              {filters.search && (
                <button 
                  onClick={() => onUpdateFilters({ search: '' })}
                  className={isPink ? 'text-[#9f1239] hover:text-red-700' : 'text-[#9b9a97] hover:text-red-500'}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isPink 
                  ? 'bg-white border-[#fda4af] text-[#881337] hover:text-[#4c0519] hover:bg-[#fff0f3]' 
                  : darkMode 
                  ? 'bg-[#242424] border-[#383838] text-[#888] hover:text-white' 
                  : 'bg-white border-[#e3e2e0] text-[#787774] hover:text-[#37352f]'
              }`}
              title="Tìm kiếm"
            >
              <Search size={13} />
            </button>
          )}

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                filters.sortBy !== 'order'
                  ? (isPink 
                      ? 'bg-[#ffe4e6] border-[#fda4af] text-[#9f1239] font-semibold' 
                      : 'bg-blue-50 border-blue-200 text-[#2383e2] dark:bg-blue-950/40 dark:border-blue-800')
                  : isPink 
                  ? 'bg-white border-[#fda4af] text-[#881337] hover:bg-[#fff0f3]' 
                  : darkMode 
                  ? 'bg-[#242424] border-[#383838] text-[#888]' 
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <ArrowUpDown size={12} className={isPink ? 'text-[#e11d48]' : ''} />
              <span>Sắp xếp</span>
            </button>

            {showSortMenu && (
              <div className={`absolute top-full right-0 mt-1 w-48 rounded-xl shadow-xl border p-1 z-30 text-xs ${
                isPink 
                  ? 'bg-white border-[#fda4af] text-[#4c0519]' 
                  : darkMode 
                  ? 'bg-[#262626] border-[#383838] text-[#ddd]' 
                  : 'bg-white border-[#e3e2e0] text-[#37352f]'
              }`}>
                <div className={`px-2 py-1 text-[10px] font-semibold uppercase ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>Sắp xếp theo</div>
                {[
                  { id: 'order', label: 'Thứ tự thủ công' },
                  { id: 'dueDate', label: 'Hạn chót (Due Date)' },
                  { id: 'priority', label: 'Mức độ ưu tiên' },
                  { id: 'title', label: 'Tên công việc (A-Z)' },
                  { id: 'progress', label: 'Tiến độ hoàn thành' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onUpdateFilters({ 
                        sortBy: s.id as any,
                        sortDirection: filters.sortBy === s.id && filters.sortDirection === 'asc' ? 'desc' : 'asc'
                      });
                      setShowSortMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
                      filters.sortBy === s.id 
                        ? (isPink ? 'bg-[#ffe4e6] text-[#9f1239] font-semibold' : 'bg-blue-50 text-[#2383e2] dark:bg-blue-950') 
                        : (isPink ? 'hover:bg-[#fff0f3]' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]')
                    }`}
                  >
                    <span>{s.label}</span>
                    {filters.sortBy === s.id && (
                      <span className="text-[10px] uppercase font-mono">{filters.sortDirection}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group By Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                filters.groupBy !== 'status'
                  ? (isPink 
                      ? 'bg-[#ffe4e6] border-[#fda4af] text-[#9f1239] font-semibold' 
                      : 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:border-purple-800')
                  : isPink 
                  ? 'bg-white border-[#fda4af] text-[#881337] hover:bg-[#fff0f3]' 
                  : darkMode 
                  ? 'bg-[#242424] border-[#383838] text-[#888]' 
                  : 'bg-white border-[#e3e2e0] text-[#787774]'
              }`}
            >
              <Layers size={12} className={isPink ? 'text-[#e11d48]' : ''} />
              <span>Nhóm</span>
            </button>

            {showGroupMenu && (
              <div className={`absolute top-full right-0 mt-1 w-44 rounded-xl shadow-xl border p-1 z-30 text-xs ${
                isPink 
                  ? 'bg-white border-[#fda4af] text-[#4c0519]' 
                  : darkMode 
                  ? 'bg-[#262626] border-[#383838] text-[#ddd]' 
                  : 'bg-white border-[#e3e2e0] text-[#37352f]'
              }`}>
                <div className={`px-2 py-1 text-[10px] font-semibold uppercase ${isPink ? 'text-[#881337]' : 'text-[#9b9a97]'}`}>Nhóm thẻ theo</div>
                {[
                  { id: 'status', label: 'Trạng thái (Status)' },
                  { id: 'priority', label: 'Mức độ ưu tiên' },
                  { id: 'assignee', label: 'Người phụ trách' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onUpdateFilters({ groupBy: g.id as any });
                      setShowGroupMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      filters.groupBy === g.id 
                        ? (isPink ? 'bg-[#ffe4e6] text-[#9f1239] font-bold' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 font-medium') 
                        : (isPink ? 'hover:bg-[#fff0f3]' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#f1f1ef]')
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active filter count indicator */}
          {hasActiveFilters && (
            <button
              onClick={() => onUpdateFilters({
                search: '',
                statuses: [],
                priorities: [],
                assigneeIds: [],
                tagIds: [],
                dateFilter: 'all',
              })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                isPink 
                  ? 'bg-[#ffe4e6] text-[#9f1239] border-[#fda4af] hover:bg-[#fecdd3]' 
                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              }`}
              title="Xóa tất cả bộ lọc"
            >
              <span>{filteredTasksCount}/{totalTasks} thẻ</span>
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
