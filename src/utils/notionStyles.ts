import { NotionColor, PriorityLevel } from '../types';

export const NOTION_COLORS: Record<NotionColor, {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  dot: string;
}> = {
  gray: {
    bg: 'bg-[#f1f1ef]',
    text: 'text-[#787774]',
    border: 'border-[#e3e2e0]',
    badgeBg: 'bg-[#ebeced] text-[#5a5d5e]',
    dot: 'bg-[#9b9a97]',
  },
  brown: {
    bg: 'bg-[#f4eeee]',
    text: 'text-[#976d57]',
    border: 'border-[#e8d5c8]',
    badgeBg: 'bg-[#ede3da] text-[#855845]',
    dot: 'bg-[#976d57]',
  },
  orange: {
    bg: 'bg-[#faece3]',
    text: 'text-[#d9730d]',
    border: 'border-[#f3cdb4]',
    badgeBg: 'bg-[#fbe4d4] text-[#cb6a00]',
    dot: 'bg-[#ea7c16]',
  },
  yellow: {
    bg: 'bg-[#fbf3db]',
    text: 'text-[#dfab01]',
    border: 'border-[#f2e1a6]',
    badgeBg: 'bg-[#fbf3d3] text-[#a47b00]',
    dot: 'bg-[#dfab01]',
  },
  green: {
    bg: 'bg-[#edf3ec]',
    text: 'text-[#448361]',
    border: 'border-[#c8dec9]',
    badgeBg: 'bg-[#ddede0] text-[#2b784c]',
    dot: 'bg-[#448361]',
  },
  blue: {
    bg: 'bg-[#edf5fa]',
    text: 'text-[#337ea9]',
    border: 'border-[#c1e0f4]',
    badgeBg: 'bg-[#ddebf1] text-[#20719e]',
    dot: 'bg-[#337ea9]',
  },
  purple: {
    bg: 'bg-[#f6f3f9]',
    text: 'text-[#9065b0]',
    border: 'border-[#e0d3ed]',
    badgeBg: 'bg-[#eae4f2] text-[#7d48a5]',
    dot: 'bg-[#9065b0]',
  },
  pink: {
    bg: 'bg-[#faf1f5]',
    text: 'text-[#c14c8a]',
    border: 'border-[#f3cfdf]',
    badgeBg: 'bg-[#f7e1ee] text-[#b03b78]',
    dot: 'bg-[#c14c8a]',
  },
  qanda_pink: {
    bg: 'bg-[#fff0f2]',
    text: 'text-[#d63d57]',
    border: 'border-[#ffa9b2]',
    badgeBg: 'bg-[#ffa9b2]/30 text-[#b5263f]',
    dot: 'bg-[#ffa9b2]',
  },
  red: {
    bg: 'bg-[#fbe4e4]',
    text: 'text-[#d44c47]',
    border: 'border-[#f4bebe]',
    badgeBg: 'bg-[#fde2e2] text-[#c73934]',
    dot: 'bg-[#d44c47]',
  },
};

export const PRIORITY_CONFIG: Record<PriorityLevel, {
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
}> = {
  urgent: {
    label: 'Khẩn cấp',
    color: '#eb5757',
    badgeBg: 'bg-[#fee2e2]',
    badgeText: 'text-[#dc2626]',
    iconName: 'AlertCircle',
  },
  high: {
    label: 'Cao',
    color: '#f2994a',
    badgeBg: 'bg-[#ffedd5]',
    badgeText: 'text-[#ea580c]',
    iconName: 'ArrowUp',
  },
  medium: {
    label: 'Trung bình',
    color: '#2f80ed',
    badgeBg: 'bg-[#e0f2fe]',
    badgeText: 'text-[#0284c7]',
    iconName: 'Minus',
  },
  low: {
    label: 'Thấp',
    color: '#9ca3af',
    badgeBg: 'bg-[#f3f4f6]',
    badgeText: 'text-[#4b5563]',
    iconName: 'ArrowDown',
  },
  none: {
    label: 'Không ưu tiên',
    color: '#d1d5db',
    badgeBg: 'bg-transparent',
    badgeText: 'text-[#9ca3af]',
    iconName: 'Circle',
  },
};

export const PRESET_COVERS = [
  { id: 'grad_qanda', name: 'QANDA Pink (#FFA9B2)', url: 'linear-gradient(135deg, #FFA9B2 0%, #FFD6DC 100%)' },
  { id: 'grad_qanda_sunset', name: 'QANDA Coral Sunset', url: 'linear-gradient(135deg, #FFA9B2 0%, #FF758C 100%)' },
  { id: 'grad_1', name: 'Bình minh Hồng-Cam', url: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { id: 'grad_2', name: 'Đại dương Xanh', url: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { id: 'grad_3', name: 'Hoàng hôn Tím', url: 'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'grad_4', name: 'Rừng nhiệt đới', url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'grad_5', name: 'Cực quang xanh', url: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)' },
  { id: 'grad_6', name: 'Thanh lịch Trầm', url: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
  { id: 'grad_7', name: 'Ấm áp Pastel', url: 'linear-gradient(to right, #f78ca0 0%, #f9748f 19%, #fd868c 60%, #fe9a8b 100%)' },
  { id: 'grad_8', name: 'Minimalist Slate', url: 'linear-gradient(to right, #243949 0%, #517fa4 100%)' },
];

export const PRESET_EMOJIS = [
  '🚀', '📋', '🎯', '✨', '⚡', '💡', '🎨', '💻', '📱', '🛠️', 
  '📊', '📈', '🔥', '🏆', '💎', '📚', '⭐', '🌈', '🧩', '🧪',
  '☕', '🌿', '🧭', '💼', '📌', '📦', '🔔', '💬', '🎉', '🌟'
];
