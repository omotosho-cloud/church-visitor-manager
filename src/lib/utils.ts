import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'transferred': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return '';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'adult': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'youth': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'children': return 'bg-pink-100 text-pink-800 border-pink-200';
    default: return '';
  }
};

export const exportToCSV = (data: Record<string, unknown>[], filename: string, headers: string[]) => {
  const rows = data.map(row => headers.map(h => row[h] || ''));
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${format(Date.now(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const validatePhone = (phone: string): boolean => {
  return /^[0-9]{10,15}$/.test(phone.replace(/[^0-9]/g, ''));
};
