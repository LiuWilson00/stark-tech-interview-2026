import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'yyyy/MM/dd', { locale: zhTW });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy/MM/dd HH:mm', { locale: zhTW });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhTW });
}

export function formatDueDate(date: string | Date): string {
  const d = new Date(date);

  if (isToday(d)) {
    return '今天';
  }

  if (isTomorrow(d)) {
    return '明天';
  }

  return format(d, 'MM/dd', { locale: zhTW });
}

export function isDueDatePast(date: string | Date): boolean {
  return isPast(new Date(date));
}
