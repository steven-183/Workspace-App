export function formatDateVi(dateStr?: string): string {
  if (!dateStr) return 'Chưa đặt ngày';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day} thg ${month}, ${year}`;
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return dateStr;
  }
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

export function diffInDays(dateStr1: string, dateStr2: string): number {
  try {
    const d1 = new Date(dateStr1 + 'T00:00:00');
    const d2 = new Date(dateStr2 + 'T00:00:00');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function isOverdue(dueDateStr?: string, status?: string): boolean {
  if (!dueDateStr || status === 'done') return false;
  const today = getTodayString();
  return dueDateStr < today;
}

export function isDueToday(dueDateStr?: string): boolean {
  if (!dueDateStr) return false;
  return dueDateStr === getTodayString();
}

export function isDueThisWeek(dueDateStr?: string): boolean {
  if (!dueDateStr) return false;
  const today = getTodayString();
  const nextWeek = addDays(today, 7);
  return dueDateStr >= today && dueDateStr <= nextWeek;
}

export interface DayItem {
  dateStr: string;
  dayNumber: number;
  dayName: string;
  monthName: string;
  year: number;
  isToday: boolean;
  isWeekend: boolean;
  isFirstOfMonth: boolean;
}

const VI_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const VI_MONTHS = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];

export function generateDateRange(startDateStr: string, totalDays: number): DayItem[] {
  const days: DayItem[] = [];
  const today = getTodayString();
  
  for (let i = 0; i < totalDays; i++) {
    const curDateStr = addDays(startDateStr, i);
    const d = new Date(curDateStr + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const dayNumber = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    days.push({
      dateStr: curDateStr,
      dayNumber,
      dayName: VI_DAYS[dayOfWeek],
      monthName: VI_MONTHS[month],
      year,
      isToday: curDateStr === today,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isFirstOfMonth: dayNumber === 1 || i === 0,
    });
  }
  return days;
}

export function formatFullTimestamp(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffSec < 45) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    if (diffSec < 172800) return `Hôm qua lúc ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}`;
  } catch {
    return isoString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

