import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User } from '../types';
import { Search, UserPlus, Check, X, Mail, ShieldCheck } from 'lucide-react';

interface UserAutofillDropdownProps {
  availableUsers: User[];
  selectedUsers: User[];
  onToggleUser: (user: User) => void;
  onClose: () => void;
  title?: string;
  placeholder?: string;
  isSingleSelect?: boolean;
  currentUser?: User | null;
  darkMode: boolean;
}

export const UserAutofillDropdown: React.FC<UserAutofillDropdownProps> = ({
  availableUsers,
  selectedUsers,
  onToggleUser,
  onClose,
  title = 'Chọn thành viên',
  placeholder = 'Tìm tên hoặc email...',
  isSingleSelect = false,
  currentUser,
  darkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return availableUsers;

    return availableUsers.filter((u) => {
      const matchName = u.name.toLowerCase().includes(query);
      const matchEmail = (u.email || '').toLowerCase().includes(query);
      return matchName || matchEmail;
    });
  }, [availableUsers, searchQuery]);

  const handleAddNewUser = () => {
    const name = searchQuery.trim();
    if (!name) return;

    // Check if looks like email
    const isEmail = name.includes('@');
    const newUser: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: isEmail ? name.split('@')[0] : name,
      email: isEmail ? name : `${name.toLowerCase().replace(/\s+/g, '')}@company.com`,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2383e2`,
      color: '#2383e2',
    };

    onToggleUser(newUser);
    setSearchQuery('');
    if (isSingleSelect) {
      onClose();
    }
  };

  const isUserSelected = (user: User) => {
    return selectedUsers.some(
      (u) => u.id === user.id || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
    );
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full left-0 mt-1 w-72 sm:w-80 rounded-2xl shadow-2xl border p-2.5 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-150 ${
        darkMode ? 'bg-[#222222] border-[#383838] text-[#dedede]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-1 border-b border-black/5 dark:border-white/5">
        <span className="text-xs font-bold text-[#37352f] dark:text-white flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-blue-500" />
          <span>{title}</span>
        </span>
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition-colors ${
            darkMode ? 'hover:bg-[#333] text-[#aaa]' : 'hover:bg-[#f0ede8] text-[#888]'
          }`}
        >
          <X size={13} />
        </button>
      </div>

      {/* Search Input with Autofill hint */}
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs ${
        darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-[#f7f6f3] border-[#e0deda]'
      }`}>
        <Search size={13} className="text-[#9b9a97] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none text-xs w-full placeholder-[#9b9a97] text-[#37352f] dark:text-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              e.preventDefault();
              if (filteredUsers.length > 0) {
                onToggleUser(filteredUsers[0]);
                if (isSingleSelect) onClose();
              } else if (searchQuery.trim()) {
                handleAddNewUser();
              }
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
      </div>

      {/* Quick Select Current User if available */}
      {currentUser && !searchQuery.trim() && (
        <div className="pt-0.5">
          <div className="text-[10px] font-semibold text-[#9b9a97] px-1.5 py-0.5 uppercase tracking-wider">
            Tài khoản của bạn
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleUser(currentUser);
              if (isSingleSelect) onClose();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left ${
              isUserSelected(currentUser)
                ? (darkMode ? 'bg-blue-950/60 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200')
                : (darkMode ? 'hover:bg-[#2c2c2c]' : 'hover:bg-[#f1f1ef]')
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-black/10 dark:border-white/10"
              />
              <div className="truncate">
                <div className="font-semibold truncate">{currentUser.name} (Bạn)</div>
                {currentUser.email && (
                  <div className="text-[10.5px] text-[#9b9a97] truncate">{currentUser.email}</div>
                )}
              </div>
            </div>
            {isUserSelected(currentUser) && <Check size={14} className="text-blue-500 shrink-0 ml-1" />}
          </button>
        </div>
      )}

      {/* Suggested Users List */}
      <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar pt-1">
        <div className="text-[10px] font-semibold text-[#9b9a97] px-1.5 py-0.5 uppercase tracking-wider flex items-center justify-between">
          <span>Danh sách người dùng ({filteredUsers.length})</span>
          {searchQuery && <span className="text-blue-500">Gợi ý tự động</span>}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-3 text-center space-y-2">
            <p className="text-xs text-[#9b9a97]">Không tìm thấy người dùng khớp với từ khóa.</p>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleAddNewUser}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus size={13} />
                <span>Thêm "{searchQuery.trim()}"</span>
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const selected = isUserSelected(user);
            return (
              <button
                key={user.id || user.email}
                type="button"
                onClick={() => {
                  onToggleUser(user);
                  if (isSingleSelect) onClose();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left ${
                  selected
                    ? (darkMode ? 'bg-blue-950/50 text-blue-300 border border-blue-800/80' : 'bg-blue-50 text-blue-700 border border-blue-200')
                    : (darkMode ? 'hover:bg-[#2c2c2c]' : 'hover:bg-[#f1f1ef]')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=2383e2`}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover shrink-0 border border-black/10 dark:border-white/10"
                  />
                  <div className="truncate min-w-0">
                    <div className="font-semibold truncate text-[#37352f] dark:text-white">{user.name}</div>
                    {user.email && (
                      <div className="text-[10px] text-[#9b9a97] truncate flex items-center gap-1">
                        <Mail size={10} className="shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selected ? (
                  <Check size={14} className="text-blue-500 shrink-0 ml-1.5" />
                ) : (
                  <span className="text-[10px] text-[#9b9a97] opacity-0 hover:opacity-100 shrink-0">Chọn</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Add new user prompt if user typed something not exact match */}
      {searchQuery.trim() && !availableUsers.some((u) => u.name.toLowerCase() === searchQuery.toLowerCase() || u.email?.toLowerCase() === searchQuery.toLowerCase()) && (
        <div className="pt-1 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={handleAddNewUser}
            className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              darkMode ? 'bg-[#2c2c2c] hover:bg-[#383838] text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
            }`}
          >
            <UserPlus size={13} />
            <span>Thêm mới: "{searchQuery.trim()}"</span>
          </button>
        </div>
      )}
    </div>
  );
};
