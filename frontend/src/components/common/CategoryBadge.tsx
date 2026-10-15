import React from 'react';
import { DocumentCategory } from '@/shared';
import {
  FileText,
  Receipt,
  FileCheck2,
  FileSpreadsheet,
  Mail,
  BarChart3,
  Files,
} from 'lucide-react';

interface CategoryBadgeProps {
  category: DocumentCategory;
  customCategory?: string | null;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  customCategory,
  className = '',
}) => {
  const getIcon = () => {
    switch (category) {
      case 'invoice':
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case 'receipt':
        return <Receipt className="w-3.5 h-3.5" />;
      case 'contract':
        return <FileCheck2 className="w-3.5 h-3.5" />;
      case 'form':
        return <FileText className="w-3.5 h-3.5" />;
      case 'letter':
        return <Mail className="w-3.5 h-3.5" />;
      case 'report':
        return <BarChart3 className="w-3.5 h-3.5" />;
      case 'other':
      default:
        return <Files className="w-3.5 h-3.5" />;
    }
  };

  const label = customCategory || category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60 ${className}`}
    >
      <span className="text-slate-400">{getIcon()}</span>
      <span>{label}</span>
    </span>
  );
};
