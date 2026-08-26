import React, { useState } from 'react';
import { PRESET_COVERS } from '../utils/notionStyles';
import { X, Check } from 'lucide-react';

interface CoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCover: (cover: string) => void;
  currentCover?: string;
}

const NATURE_COVERS = [
  { id: 'img_1', name: 'Đồi núi mây mù', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80' },
  { id: 'img_2', name: 'Rừng thông buổi sớm', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80' },
  { id: 'img_3', name: 'Hoàng hôn biển cả', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80' },
  { id: 'img_4', name: 'Không gian vũ trụ', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80' },
  { id: 'img_5', name: 'Kiến trúc tối giản', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80' },
  { id: 'img_6', name: 'Màu nước Trừu tượng', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80' },
];

export const CoverPickerModal: React.FC<CoverPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCover,
  currentCover,
}) => {
  const [tab, setTab] = useState<'gradient' | 'photos' | 'custom'>('gradient');
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl border border-[#e3e2e0] w-full max-w-lg overflow-hidden flex flex-col max-h-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-[#ededeb] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#f7f6f3] p-1 rounded-lg border border-[#e8e7e4]">
            <button
              onClick={() => setTab('gradient')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                tab === 'gradient' ? 'bg-white text-[#37352f] shadow-xs' : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              Gradient & Màu sắc
            </button>
            <button
              onClick={() => setTab('photos')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                tab === 'photos' ? 'bg-white text-[#37352f] shadow-xs' : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              Hình ảnh phong cảnh
            </button>
            <button
              onClick={() => setTab('custom')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                tab === 'custom' ? 'bg-white text-[#37352f] shadow-xs' : 'text-[#787774] hover:text-[#37352f]'
              }`}
            >
              Liên kết ảnh (URL)
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#9b9a97] hover:text-[#37352f] hover:bg-[#efedea] rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[420px]">
          {tab === 'gradient' && (
            <div className="grid grid-cols-2 gap-3">
              {PRESET_COVERS.map((cov) => {
                const isSelected = currentCover === cov.url;
                return (
                  <button
                    key={cov.id}
                    onClick={() => {
                      onSelectCover(cov.url);
                      onClose();
                    }}
                    className={`group relative h-20 rounded-lg overflow-hidden border transition-all text-left p-2 flex flex-col justify-end ${
                      isSelected ? 'ring-2 ring-[#0284c7] border-transparent' : 'border-[#e3e2e0] hover:scale-[1.02]'
                    }`}
                    style={{ background: cov.url }}
                  >
                    <span className="text-xs font-medium text-white drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded-sm inline-block max-w-fit">
                      {cov.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#0284c7] text-white p-1 rounded-full shadow-md">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'photos' && (
            <div className="grid grid-cols-2 gap-3">
              {NATURE_COVERS.map((cov) => {
                const isSelected = currentCover === cov.url;
                return (
                  <button
                    key={cov.id}
                    onClick={() => {
                      onSelectCover(cov.url);
                      onClose();
                    }}
                    className={`group relative h-24 rounded-lg overflow-hidden border transition-all text-left p-2 flex flex-col justify-end ${
                      isSelected ? 'ring-2 ring-[#0284c7] border-transparent' : 'border-[#e3e2e0] hover:scale-[1.02]'
                    }`}
                  >
                    <img 
                      src={cov.url} 
                      alt={cov.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="relative z-10 text-xs font-medium text-white drop-shadow-sm">
                      {cov.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-[#0284c7] text-white p-1 rounded-full shadow-md">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#787774]">Nhập URL hình ảnh (Unsplash, Imgur hoặc link trực tiếp):</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-[#e3e2e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
              />
              {customInput && (
                <div className="mt-2 h-28 rounded-lg overflow-hidden border border-[#e3e2e0] relative">
                  <img 
                    src={customInput} 
                    alt="Preview" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }} 
                  />
                </div>
              )}
              <button
                disabled={!customInput}
                onClick={() => {
                  if (customInput) {
                    onSelectCover(customInput);
                    onClose();
                  }
                }}
                className="w-full py-2 bg-[#37352f] text-white text-xs font-medium rounded-lg hover:bg-black disabled:opacity-40 transition-colors"
              >
                Áp dụng ảnh bìa này
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
