import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { exportTableToPDF, exportElementToPDF, PDFExportOptions } from '../utils/pdfExport';
import { useLanguage } from './LanguageContext';

interface ExportPDFButtonProps<T = any> {
  // Option 1: Data-driven PDF export (Recommended)
  exportOptions?: PDFExportOptions<T>;
  
  // Option 2: DOM Element ID capture
  targetElementId?: string;
  
  // Custom button styling
  titleAr?: string;
  titleEn?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function ExportPDFButton<T = any>({
  exportOptions,
  targetElementId,
  titleAr,
  titleEn,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false
}: ExportPDFButtonProps<T>) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    setStatusMessage(isRTL ? 'جاري تجهيز تقرير ה-PDF...' : 'Preparing PDF report...');
    setToastStatus(null);

    try {
      let success = false;

      if (exportOptions) {
        success = await exportTableToPDF({
          ...exportOptions,
          isRTL,
          onProgress: (msg) => setStatusMessage(msg)
        });
      } else if (targetElementId) {
        success = await exportElementToPDF(targetElementId, {
          titleAr: titleAr || (isRTL ? 'تقرير الجدول' : 'Table Report'),
          isRTL,
          onProgress: (msg) => setStatusMessage(msg)
        });
      } else {
        console.warn('ExportPDFButton requires either exportOptions or targetElementId');
        success = false;
      }

      if (success) {
        setToastStatus('success');
        setTimeout(() => setToastStatus(null), 3000);
      } else {
        setToastStatus('error');
        setTimeout(() => setToastStatus(null), 3500);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      setToastStatus('error');
      setTimeout(() => setToastStatus(null), 3500);
    } finally {
      setIsExporting(false);
      setStatusMessage(null);
    }
  };

  // Styles based on variant
  let btnClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition-all duration-200 cursor-pointer shadow-2xs ';
  
  if (size === 'sm') {
    btnClasses += 'px-3 py-1.5 text-xs ';
  } else if (size === 'lg') {
    btnClasses += 'px-5 py-2.5 text-sm ';
  } else {
    btnClasses += 'px-4 py-2 text-xs ';
  }

  if (variant === 'primary') {
    btnClasses += 'bg-[#0F4C81] hover:bg-[#0c3d67] text-white active:scale-95 ';
  } else if (variant === 'outline') {
    btnClasses += 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 active:scale-95 ';
  } else if (variant === 'ghost') {
    btnClasses += 'bg-transparent hover:bg-slate-100 text-slate-700 ';
  } else if (variant === 'icon') {
    btnClasses = 'p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer ';
  } else {
    // Secondary
    btnClasses += 'bg-slate-800 hover:bg-slate-900 text-white active:scale-95 ';
  }

  const label = titleAr && isRTL 
    ? titleAr 
    : titleEn && !isRTL 
      ? titleEn 
      : isRTL 
        ? 'تصدير PDF' 
        : 'Export PDF';

  return (
    <div className="relative inline-block">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={`${btnClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={isRTL ? 'تصدير هذا الجدول إلى تقرير PDF محترف' : 'Export current table to PDF report'}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        ) : (
          <FileText className="w-4 h-4 text-amber-400" />
        )}

        {variant !== 'icon' && (
          <span>{isExporting ? (isRTL ? 'جاري التصدير...' : 'Exporting...') : label}</span>
        )}
      </button>

      {/* Floating Status Toast notification when processing */}
      {(statusMessage || toastStatus) && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-slate-900 text-white text-xs font-extrabold px-3 py-2 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          {isExporting && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
          {toastStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          
          <span>
            {statusMessage 
              ? statusMessage 
              : toastStatus === 'success' 
                ? (isRTL ? 'تم تنزيل تقرير الـ PDF بنجاح!' : 'PDF downloaded successfully!') 
                : (isRTL ? 'حدث خطأ أثناء إنشاء الملف' : 'Export failed')}
          </span>
        </div>
      )}
    </div>
  );
}
