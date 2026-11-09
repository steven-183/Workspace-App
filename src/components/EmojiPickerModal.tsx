import React, { useState } from 'react';
import { PRESET_EMOJIS } from '../utils/notionStyles';
import { useLanguage } from '../context/LanguageContext';
import { Search, X } from 'lucide-react';

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  currentEmoji?: string;
}

const CATEGORIZED_EMOJIS: { vi: string; en: string; emojis: string[] }[] = [
  { vi: 'Phổ biến', en: 'Popular', emojis: PRESET_EMOJIS },
  { vi: 'Công việc & Công nghệ', en: 'Work & Tech', emojis: ['💼', '💻', '📱', '🖥️', '⌨️', '🖱️', '⚙️', '🛠️', '🔧', '📊', '📈', '📉', '📁', '📂', '📑', '📌', '📎', '✏️', '📝', '🔒', '🔑', '🚀', '⚡', '💡'] },
  { vi: 'Trạng thái & Biểu tượng', en: 'Status & Symbols', emojis: ['✅', '❌', '⚠️', '🔥', '⭐', '🌟', '🎯', '🏆', '💎', '🎨', '🧩', '🧪', '🔔', '💬', '🎉', '☕', '🌿', '🌱', '☀️', '🌙', '🌈', '🍀', '❤️', '👍'] },
  { vi: 'Hình vẽ & Động vật', en: 'Graphics & Nature', emojis: ['🦊', '🐱', '🐼', '🦁', '🦉', '🚀', '🛸', '🛰️', '🪐', '🌍', '🏔️', '🏖️', '🏝️', '🎪', '🏰', '🏠', '🗼', '🚢', '✈️', '🚗', '🚲', '🛴', '🎈', '🎁'] },
];

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  currentEmoji,
}) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl border border-[#e3e2e0] w-full max-w-sm overflow-hidden flex flex-col max-h-[460px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-[#ededeb] flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 bg-[#f7f6f3] px-2.5 py-1.5 rounded-md border border-[#e8e7e4]">
            <Search size={16} className="text-[#9b9a97]" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search emoji icons...' : 'Tìm kiếm biểu tượng emoji...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-[#37352f] placeholder-[#9b9a97] outline-none w-full"
              autoFocus
            />
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#efedea] rounded-md ml-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3 overflow-y-auto flex-1 space-y-4 max-h-[360px]">
          {CATEGORIZED_EMOJIS.map((group) => {
            const filtered = group.emojis.filter((e) => !searchTerm || e.includes(searchTerm));
            if (filtered.length === 0) return null;

            return (
              <div key={group.vi}>
                <div className="text-xs font-semibold text-[#9b9a97] mb-2 uppercase tracking-wider">
                  {language === 'en' ? group.en : group.vi}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {filtered.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectEmoji(emoji);
                        onClose();
                      }}
                      className={`text-2xl p-2 rounded-lg hover:bg-[#efedea] transition-all flex items-center justify-center ${
                        currentEmoji === emoji ? 'bg-[#e0f2fe] ring-1 ring-[#0284c7]' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
