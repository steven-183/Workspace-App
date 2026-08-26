import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  darkMode: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xóa công việc này?',
  description = 'Công việc sẽ được chuyển vào Thùng rác (Kho lưu trữ). Bạn có thể khôi phục lại bất cứ lúc nào.',
  confirmText = 'Chuyển vào Thùng rác',
  cancelText = 'Hủy bỏ',
  darkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl space-y-4 text-center transition-all ${
          darkMode ? 'bg-[#222] border-[#383838] text-[#e0e0e0]' : 'bg-white border-[#e3e2e0] text-[#37352f]'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <Trash2 size={24} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#37352f] dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-colors ${
              darkMode ? 'border-[#3a3a3a] hover:bg-[#333] text-[#ddd]' : 'border-[#e3e2e0] hover:bg-[#f5f5f5] text-[#555]'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
