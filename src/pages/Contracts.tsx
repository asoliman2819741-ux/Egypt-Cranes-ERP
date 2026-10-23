import React, { useState } from 'react';
import { Contract, Crane, DocumentAttachment } from '../types';
import { initialContracts } from '../mockData';
import { 
  Plus, Search, FileSignature, Calendar, DollarSign, Briefcase, Trash2,
  Camera, Scan, FileText, CheckCircle2, Sparkles, Paperclip, Eye
} from 'lucide-react';
import ContractTimeline from '../components/ContractTimeline';
import DocumentScannerModal from '../components/DocumentScannerModal';
import DocumentAttachmentsModal from '../components/DocumentAttachmentsModal';

interface ContractsProps {
  cranes: Crane[];
  contracts: Contract[];
  onAddContract: (newContract: Contract) => void;
  onDeleteContract: (id: string) => void;
  onUpdateContract?: (updatedContract: Contract) => void;
}

export default function Contracts({ cranes, contracts, onAddContract, onDeleteContract, onUpdateContract }: ContractsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('timeline');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Document Scanner & Attachments Modals States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'create_autofill' | 'attach_existing'>('create_autofill');
  const [selectedContractForAttachment, setSelectedContractForAttachment] = useState<Contract | null>(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [selectedContractForViewAttachments, setSelectedContractForViewAttachments] = useState<Contract | null>(null);

  // Form states
  const [contractNo, setContractNo] = useState(`EC-CNT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
  const [customerName, setCustomerName] = useState('');
  const [craneId, setCraneId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [value, setValue] = useState('');
  const [scannedAttachments, setScannedAttachments] = useState<DocumentAttachment[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedCrane = cranes.find(c => c.id === craneId);
    if (!assignedCrane) {
      alert('يرجى اختيار الونش المخصص للتعاقد');
      return;
    }

    const newContract: Contract = {
      id: Math.random().toString(),
      contractNo,
      customerName,
      craneId,
      craneName: assignedCrane.nameAr,
      startDate,
      endDate,
      value: parseFloat(value) || 0,
      status: 'active',
      attachments: scannedAttachments
    };

    onAddContract(newContract);
    setShowAddForm(false);
    // Reset
    setContractNo(`EC-CNT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
    setCustomerName('');
    setCraneId('');
    setStartDate('');
    setEndDate('');
    setValue('');
    setScannedAttachments([]);
  };

  const handleScanCompleted = (attachment: DocumentAttachment, extractedData?: DocumentAttachment['extractedData']) => {
    if (scannerMode === 'create_autofill') {
      // Auto-fill form fields from OCR
      if (extractedData) {
        if (extractedData.documentNo) setContractNo(extractedData.documentNo);
        if (extractedData.customerName) setCustomerName(extractedData.customerName);
        if (extractedData.amount) setValue(String(extractedData.amount));
        if (extractedData.startDate) setStartDate(extractedData.startDate);
        if (extractedData.endDate) setEndDate(extractedData.endDate);

        // Try matching crane if craneName extracted
        if (extractedData.craneName) {
          const matchedCrane = cranes.find(c => 
            c.nameAr.toLowerCase().includes(extractedData.craneName!.toLowerCase()) ||
            c.model.toLowerCase().includes(extractedData.craneName!.toLowerCase())
          );
          if (matchedCrane) setCraneId(matchedCrane.id);
        }
      }

      setScannedAttachments(prev => [...prev, attachment]);
      setShowAddForm(true);
    } else if (scannerMode === 'attach_existing' && selectedContractForAttachment) {
      const updatedContract: Contract = {
        ...selectedContractForAttachment,
        attachments: [...(selectedContractForAttachment.attachments || []), attachment]
      };
      if (onUpdateContract) {
        onUpdateContract(updatedContract);
      }
      setSelectedContractForAttachment(updatedContract);
      if (selectedContractForViewAttachments?.id === updatedContract.id) {
        setSelectedContractForViewAttachments(updatedContract);
      }
    }
  };

  const handleDeleteAttachmentFromContract = (contract: Contract, attachmentId: string) => {
    const updatedAttachments = (contract.attachments || []).filter(a => a.id !== attachmentId);
    const updatedContract: Contract = {
      ...contract,
      attachments: updatedAttachments
    };
    if (onUpdateContract) {
      onUpdateContract(updatedContract);
    }
    if (selectedContractForViewAttachments?.id === contract.id) {
      setSelectedContractForViewAttachments(updatedContract);
    }
  };

  const filtered = contracts.filter(c => 
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.contractNo.toLowerCase().includes(search.toLowerCase()) ||
    c.craneName.toLowerCase().includes(search.toLowerCase())
  );

  const totalVal = contracts.reduce((sum, c) => sum + c.value, 0);
  const activeCount = contracts.filter(c => c.status === 'active').length;

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">سجل عقود تأجير الأوناش والمشاريع</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">متابعة شروط التعاقد والمسح الضوئي الذكي للوثائق الورقية للعملاء</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button 
            type="button"
            onClick={() => {
              setScannerMode('create_autofill');
              setIsScannerOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-[#0F4C81] text-white font-bold text-sm rounded-xl hover:opacity-95 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4 text-sky-200" />
            <span>مسح عقد ورقي بالكاميرا 📷</span>
          </button>

          <button 
            onClick={() => {
              setScannedAttachments([]);
              setShowAddForm(true);
            }}
            className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> توقيع عقد جديد
          </button>
        </div>
      </div>

      {/* Top metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">إجمالي القيمة التعاقدية</span>
            <p className="text-xl font-black text-[#0F4C81] dark:text-sky-400">{totalVal.toLocaleString()} ج.م</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0F4C81] dark:text-sky-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">العقود سارية المفعول</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{activeCount} عقد نشط</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">عقود مع وثائق ورقية ممسوحة</span>
            <p className="text-xl font-black text-[#F7941D]">
              {contracts.filter(c => c.attachments && c.attachments.length > 0).length} عقود
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/80 text-[#F7941D] flex items-center justify-center">
            <Scan className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Navigation for Contracts & Timeline */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-[#0F4C81] text-[#0F4C81] dark:text-sky-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>المخطط الزمني ومتابعة المشروعات (Gantt Chart)</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'list'
              ? 'border-[#0F4C81] text-[#0F4C81] dark:text-sky-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>عقود تأجير الأسطول والعملاء</span>
        </button>
      </div>

      {activeTab === 'timeline' ? (
        <ContractTimeline contracts={contracts} cranes={cranes} />
      ) : (
        <>
          {/* Filter Controls */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
            <div className="relative">
              <input 
                type="text" 
                placeholder="البحث باسم العميل، رقم العقد، أو الونش المخصص..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-800 dark:text-slate-100"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Contracts table/list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">رقم العقد</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">العميل والمشروع</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">الونش المستأجر</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">الفترة الزمنية</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">مرفقات ضوئية 📷</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">قيمة العقد</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">الحالة</th>
                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(contract => {
                    const hasAttachments = contract.attachments && contract.attachments.length > 0;
                    return (
                      <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#0F4C81] dark:text-sky-400">{contract.contractNo}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{contract.customerName}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">{contract.craneName}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>من: {contract.startDate}</span>
                            <span>إلى: {contract.endDate}</span>
                          </div>
                        </td>

                        {/* Attachments Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {hasAttachments ? (
                              <button
                                onClick={() => {
                                  setSelectedContractForViewAttachments(contract);
                                  setIsAttachmentsModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-[#0F4C81]" />
                                <span>{contract.attachments!.length} مستند ورقي</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedContractForAttachment(contract);
                                  setScannerMode('attach_existing');
                                  setIsScannerOpen(true);
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                                <span>مسح ضوئي</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100">{contract.value.toLocaleString()} ج.م</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            contract.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                            contract.status === 'completed' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {contract.status === 'active' ? 'ساري' :
                             contract.status === 'completed' ? 'مكتمل' : 'موقوف مؤقتاً'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedContractForAttachment(contract);
                                setScannerMode('attach_existing');
                                setIsScannerOpen(true);
                              }}
                              className="p-1.5 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded-lg transition-colors cursor-pointer"
                              title="إضافة مستند ممسوح ضوئيًا للكاميرا"
                            >
                              <Camera className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => onDeleteContract(contract.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="فسخ/حذف العقد"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Contract Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-100 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">تحرير عقد تأجير رافعة ثقيلة</h3>
                <p className="text-xs text-slate-200 mt-0.5">يمكنك كتابة البيانات أو مسح العقد الورقي بالكاميرا للاستخراج التلقائي</p>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Quick Camera Scan Banner in Modal */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F4C81] dark:text-sky-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  هل لديك النسخة الورقية الموقعة من العقد؟
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setScannerMode('create_autofill');
                  setIsScannerOpen(true);
                }}
                className="px-3 py-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>مسح العقد الآن 📷</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">رقم العقد التعاقدي</label>
                <input 
                  type="text" 
                  required
                  value={contractNo}
                  onChange={(e) => setContractNo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">اسم العميل والجهة المستأجرة</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: شركة بتروجيت للمشروعات البترولية"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">الونش / الرافعة المطلوبة</label>
                <select 
                  required
                  value={craneId}
                  onChange={(e) => setCraneId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="">اختر من الأسطول الحالي...</option>
                  {cranes.map(crane => (
                    <option key={crane.id} value={crane.id}>
                      {crane.nameAr} - (حمولة {crane.capacity} طن)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">تاريخ البدء</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">تاريخ الانتهاء</label>
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">قيمة العقد الإجمالية (ج.م)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    placeholder="مثال: 450000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">ج.م</span>
                </div>
              </div>

              {/* Scanned Attachments Preview inside creation form */}
              {scannedAttachments.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم إرفاق المستند الممسوح ضوئيًا ({scannedAttachments.length})</span>
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    {scannedAttachments.map(att => (
                      <img key={att.id} src={att.imageUrl} alt="Scan preview" className="w-12 h-12 object-cover rounded-lg border border-emerald-300" />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#0F4C81] text-white text-sm font-bold rounded-xl hover:bg-[#0c3d67] transition-colors cursor-pointer"
                >
                  حفظ وتوقيع العقد
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        documentType="contract"
        title="المسح الضوئي لعقد الورق بالكاميرا"
        onScanComplete={handleScanCompleted}
      />

      {/* Attachments Viewer Modal */}
      {selectedContractForViewAttachments && (
        <DocumentAttachmentsModal
          isOpen={isAttachmentsModalOpen}
          onClose={() => {
            setIsAttachmentsModalOpen(false);
            setSelectedContractForViewAttachments(null);
          }}
          recordTitle={`عقد رقم: ${selectedContractForViewAttachments.contractNo} - ${selectedContractForViewAttachments.customerName}`}
          attachments={selectedContractForViewAttachments.attachments || []}
          onAddScanClick={() => {
            setSelectedContractForAttachment(selectedContractForViewAttachments);
            setScannerMode('attach_existing');
            setIsAttachmentsModalOpen(false);
            setIsScannerOpen(true);
          }}
          onDeleteAttachment={(attId) => handleDeleteAttachmentFromContract(selectedContractForViewAttachments, attId)}
        />
      )}

    </div>
  );
}

