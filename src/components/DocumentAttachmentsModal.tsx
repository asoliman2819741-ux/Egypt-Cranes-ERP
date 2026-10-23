import React, { useState } from 'react';
import { 
  X, FileText, Scan, Camera, Download, Eye, Trash2, 
  Copy, Check, Sparkles, Calendar, DollarSign, ExternalLink
} from 'lucide-react';
import { DocumentAttachment } from '../types';

interface DocumentAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordTitle: string;
  attachments: DocumentAttachment[];
  onAddScanClick: () => void;
  onDeleteAttachment?: (attachmentId: string) => void;
}

export default function DocumentAttachmentsModal({
  isOpen,
  onClose,
  recordTitle,
  attachments,
  onAddScanClick,
  onDeleteAttachment
}: DocumentAttachmentsModalProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentAttachment | null>(
    attachments && attachments.length > 0 ? attachments[0] : null
  );
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDoc = selectedAttachment || (attachments.length > 0 ? attachments[0] : null);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right font-sans overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F4C81]/40 text-sky-300 flex items-center justify-center border border-sky-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                المستندات والمرفقات الممسوحة ضوئيًا
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {recordTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddScanClick}
              className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>مسح ضوئي جديد 📷</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {attachments.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Scan className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  لا توجد مستندات ورقية ممسوحة ضوئيًا لهذا السجل
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  يمكنك استخدام كاميرا الجهاز لمسح العقد أو الفاتورة الورقية وإلحاقها فورًا
                </p>
              </div>
              <button
                onClick={onAddScanClick}
                className="px-5 py-2.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-black rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>بدء المسح الضوئي للكاميرا الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Attachments List Sidebar */}
              <div className="lg:col-span-4 space-y-3 border-l border-slate-100 dark:border-slate-800 pl-4">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 block">
                  المرفقات المتاحة ({attachments.length})
                </span>

                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {attachments.map((att) => {
                    const isSelected = currentDoc?.id === att.id;
                    return (
                      <div
                        key={att.id}
                        onClick={() => setSelectedAttachment(att)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#0F4C81]/10 border-[#0F4C81] text-[#0F4C81] dark:text-sky-300 font-black'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img 
                            src={att.imageUrl} 
                            alt={att.name} 
                            className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0" 
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold truncate">{att.name}</p>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(att.scannedAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>

                        {onDeleteAttachment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAttachment(att.id);
                              if (currentDoc?.id === att.id) {
                                setSelectedAttachment(null);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="حذف المستند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Attachment Main Viewer */}
              <div className="lg:col-span-8 space-y-4">
                {currentDoc ? (
                  <div className="space-y-4">
                    
                    {/* Image Viewer */}
                    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
                      <img 
                        src={currentDoc.imageUrl} 
                        alt={currentDoc.name} 
                        className="max-h-[360px] object-contain rounded-xl"
                      />
                      <a
                        href={currentDoc.imageUrl}
                        download={`${currentDoc.name}.jpg`}
                        className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/80 hover:bg-black text-white text-[11px] font-bold rounded-xl backdrop-blur-xs flex items-center gap-1.5 border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل الصورة</span>
                      </a>
                    </div>

                    {/* Extracted Structured Data Badges */}
                    {currentDoc.extractedData && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                        <span className="text-[11px] font-black text-[#0F4C81] dark:text-sky-400 block flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>البيانات المستخرجة بالذكاء الاصطناعي (OCR Extracted Data)</span>
                        </span>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {currentDoc.extractedData.documentNo && (
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 block">رقم المستند</span>
                              <span className="font-mono font-black text-slate-800 dark:text-slate-100">
                                {currentDoc.extractedData.documentNo}
                              </span>
                            </div>
                          )}

                          {currentDoc.extractedData.customerName && (
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 col-span-2">
                              <span className="text-[10px] text-slate-400 block">العميل / الجهة</span>
                              <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                                {currentDoc.extractedData.customerName}
                              </span>
                            </div>
                          )}

                          {currentDoc.extractedData.amount !== undefined && (
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 block">القيمة الميدانية</span>
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {currentDoc.extractedData.amount.toLocaleString()} ج.م
                              </span>
                            </div>
                          )}
                        </div>

                        {currentDoc.extractedData.summary && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                            {currentDoc.extractedData.summary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* OCR Text Area */}
                    {currentDoc.extractedText && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                            النص الممسوح ضوئيًا (OCR Text)
                          </label>
                          <button
                            onClick={() => handleCopyText(currentDoc.extractedText || '')}
                            className="text-xs text-[#0F4C81] dark:text-sky-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'تم نسخ النص' : 'نسخ النص'}</span>
                          </button>
                        </div>

                        <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono leading-relaxed max-h-36 overflow-y-auto border border-slate-800">
                          {currentDoc.extractedText}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    اختر مستندًا من القائمة لعرض تفاصيله
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
