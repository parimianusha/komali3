import React from 'react';
import {
  FileText,
  Receipt,
  FileCheck2,
  FileSpreadsheet,
  Mail,
  BarChart3,
  Files,
  Layers,
  FlaskConical,
  Shield,
  Award,
  ShoppingBag,
  NotebookPen,
} from 'lucide-react';
import { AGRI_DOCUMENT_LABELS, AgriDocumentCategory } from '../../shared/agriculture';
import { useLanguage } from '../../context/LanguageContext';

interface CategoryBadgeProps {
  category: string;
  customCategory?: string | null;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  customCategory,
  className = '',
}) => {
  const { language } = useLanguage();

  const getIcon = () => {
    switch (category) {
      case 'soil_test_report':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'fertilizer_recommendation':
        return <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />;
      case 'crop_insurance':
        return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
      case 'agricultural_scheme':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 'seed_input_bill':
        return <ShoppingBag className="w-3.5 h-3.5 text-green-400" />;
      case 'cultivation_note':
        return <NotebookPen className="w-3.5 h-3.5 text-teal-400" />;
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
      default:
        return <Files className="w-3.5 h-3.5" />;
    }
  };

  const labelObj = AGRI_DOCUMENT_LABELS[category as AgriDocumentCategory];
  const label =
    customCategory ||
    (labelObj ? labelObj[language] || labelObj.en : category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '));

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 ${className}`}
    >
      <span>{getIcon()}</span>
      <span className="truncate max-w-[200px]">{label}</span>
    </span>
  );
};
