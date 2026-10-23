import React, { useState, useEffect } from 'react';
import { JournalEntry, CostCenter } from '../types';
import { initialJournalEntries } from '../mockData';
import { 
  Plus, Search, Trash2, CheckCircle2, AlertTriangle, FileText, 
  Calendar, PlusCircle, Building2, ChevronDown, Sparkles,
  Coins, RefreshCw, Save, ArrowLeftRight, Check, Globe, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExportPDFButton from '../components/ExportPDFButton';
import { 
  getSavedExchangeRates, 
  saveExchangeRates, 
  fetchLiveExchangeRates, 
  convertAmount, 
  ExchangeRates,
  getLastExchangeRateUpdate,
  DEFAULT_RATES
} from '../utils/currencyService';
import { getCurrencySymbol, getCurrencyNameAr } from './SmartInvoices';

// Custom Interactive, Searchable Dropdown styled with Glassmorphism
interface CostCenterDropdownProps {
  costCenters: CostCenter[];
  selectedId: string;
  onSelect: (id: string, nameAr: string) => void;
  placeholder?: string;
  className?: string;
}

function CostCenterDropdown({
  costCenters,
  selectedId,
  onSelect,
  placeholder = "اختر مركز التكلفة...",
  className = ""
}: CostCenterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCC = costCenters.find(cc => cc.id === selectedId);

  const filtered = costCenters.filter(cc => 
    cc.nameAr.toLowerCase().includes(search.toLowerCase()) ||
    cc.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-xl text-xs text-right font-bold text-slate-800 flex items-center justify-between shadow-3xs hover:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81] focus:bg-white transition-all cursor-pointer min-h-[38px]"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Building2 className="w-3.5 h-3.5 text-[#0F4C81]" />
          {selectedCC ? (
            <span className="font-mono text-slate-900 font-extrabold">{selectedCC.code} - {selectedCC.nameAr}</span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/85 rounded-2xl shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in-50 zoom-in-95 duration-100 text-right">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="البحث بالاسم أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white text-right"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  onSelect('', '');
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer block"
              >
                -- بدون مركز تكلفة --
              </button>
              {filtered.map(cc => {
                const isSelected = cc.id === selectedId;
                const remaining = cc.budget - cc.usedBudget;
                return (
                  <button
                    key={cc.id}
                    type="button"
                    onClick={() => {
                      onSelect(cc.id, cc.nameAr);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-right px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer block ${
                      isSelected 
                        ? 'bg-[#0F4C81] text-white' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black">{cc.code}</span>
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-white/80' : remaining >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        وفر: {remaining.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className={`mt-0.5 font-extrabold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {cc.nameAr}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-4 text-[10px] text-slate-400 font-bold">
                  لا توجد نتائج مطابقة
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function JournalEntries({
  entries: propEntries,
  onAddEntry,
  onUpdateEntries,
  costCenters = [],
  onUpdateCostCenters
}: {
  entries?: JournalEntry[];
  onAddEntry?: (newItem: JournalEntry) => void;
  onUpdateEntries?: (items: JournalEntry[]) => void;
  costCenters?: CostCenter[];
  onUpdateCostCenters?: (items: CostCenter[]) => void;
}) {
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const entries = propEntries || localEntries;

  const setEntries = (val: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => {
    const nextVal = typeof val === 'function' ? val(entries) : val;
    if (onUpdateEntries) {
      onUpdateEntries(nextVal);
    } else {
      setLocalEntries(nextVal);
    }
  };

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Daily Exchange Rates Sync
  const [rates, setRates] = useState<ExchangeRates>(getSavedExchangeRates());
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string | null>(getLastExchangeRateUpdate());
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [manualRates, setManualRates] = useState<ExchangeRates>({ ...DEFAULT_RATES });

  useEffect(() => {
    setManualRates(rates);
  }, [rates]);

  // Sync on local storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      setRates(getSavedExchangeRates());
      setRatesLastUpdated(getLastExchangeRateUpdate());
    };
    window.addEventListener('storage_exchange_rates_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage_exchange_rates_updated', handleStorageChange);
    };
  }, []);

  const handleFetchLiveRates = async () => {
    setIsFetchingRates(true);
    setRateFeedback(null);
    try {
      const newRates = await fetchLiveExchangeRates();
      setRates(newRates);
      setRatesLastUpdated(new Date().toISOString());
      setRateFeedback('success-fetch');
      setTimeout(() => setRateFeedback(null), 4000);
    } catch (err) {
      console.error(err);
      setRateFeedback('error-fetch');
      setTimeout(() => setRateFeedback(null), 4000);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleSaveManualRates = (e: React.FormEvent) => {
    e.preventDefault();
    saveExchangeRates(manualRates);
    setRates(manualRates);
    setRatesLastUpdated(new Date().toISOString());
    setIsEditingRates(false);
    setRateFeedback('success-save');
    setTimeout(() => setRateFeedback(null), 4000);
  };

  // New entry form state
  const [docNo, setDocNo] = useState(`JV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [entryStatus, setEntryStatus] = useState<'pending' | 'approved'>('pending');
  const [entryCurrency, setEntryCurrency] = useState<string>('EGP');
  const [entryExchangeRate, setEntryExchangeRate] = useState<number>(1.0);

  // Update exchange rate based on currency selection
  useEffect(() => {
    if (entryCurrency === 'EGP') {
      setEntryExchangeRate(1.0);
    } else {
      setEntryExchangeRate(rates[entryCurrency as keyof ExchangeRates] || 1.0);
    }
  }, [entryCurrency, rates]);
  
  // Rows for debit and credit
  const [rows, setRows] = useState<Array<{ account: string; debit: number; credit: number; costCenterId?: string; costCenterName?: string }>>([
    { account: 'أوناش ومعدات الرفع الثقيل', debit: 0, credit: 0, costCenterId: '', costCenterName: '' },
    { account: 'حسابات العملاء (تأجير معدات)', debit: 0, credit: 0, costCenterId: '', costCenterName: '' },
  ]);

  const addRow = () => {
    setRows([...rows, { account: 'نقدية بالبنوك', debit: 0, credit: 0, costCenterId: '', costCenterName: '' }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const updateRow = (index: number, field: 'account' | 'debit' | 'credit' | 'costCenterId' | 'costCenterName', value: any) => {
    setRows(rows.map((row, idx) => {
      if (idx === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const balanceError = totalDebit !== totalCredit;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (balanceError) {
      alert('خطأ: يجب أن يتساوى إجمالي المدين مع الدائن لحفظ قيد اليومية!');
      return;
    }

    const selectedCC = costCenters.find(cc => cc.id === selectedCostCenterId);

    const newEntry: JournalEntry = {
      id: Math.random().toString(),
      docNo,
      date,
      description,
      debit: totalDebit,
      credit: totalCredit,
      status: entryStatus,
      costCenterId: selectedCostCenterId || undefined,
      costCenterName: selectedCC ? selectedCC.nameAr : undefined,
      currency: entryCurrency,
      exchangeRate: entryExchangeRate,
      lines: rows.map(r => ({
        accountName: r.account,
        debit: r.debit,
        credit: r.credit,
        costCenterId: r.costCenterId || undefined,
        costCenterName: r.costCenterName || undefined
      }))
    };

    if (onAddEntry) {
      onAddEntry(newEntry);
    } else {
      setLocalEntries([newEntry, ...localEntries]);
    }

    // If entry is approved immediately, update the budget of all linked cost centers (overall + rows)
    if (entryStatus === 'approved' && costCenters && onUpdateCostCenters) {
      const updates: { [id: string]: number } = {};
      
      if (selectedCostCenterId) {
        updates[selectedCostCenterId] = (updates[selectedCostCenterId] || 0) + (totalDebit * entryExchangeRate);
      }
      
      rows.forEach(r => {
        if (r.costCenterId) {
          const amount = r.debit > 0 ? r.debit : r.credit;
          updates[r.costCenterId] = (updates[r.costCenterId] || 0) + (amount * entryExchangeRate);
        }
      });

      if (Object.keys(updates).length > 0) {
        const updatedCCs = costCenters.map(cc => {
          if (updates[cc.id]) {
            return { ...cc, usedBudget: cc.usedBudget + updates[cc.id] };
          }
          return cc;
        });
        onUpdateCostCenters(updatedCCs);
      }
    }

    setShowAddForm(false);
    // Reset form
    setDocNo(`JV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setDescription('');
    setSelectedCostCenterId('');
    setEntryStatus('pending');
    setEntryCurrency('EGP');
    setEntryExchangeRate(1.0);
    setRows([
      { account: 'أوناش ومعدات الرفع الثقيل', debit: 0, credit: 0, costCenterId: '', costCenterName: '' },
      { account: 'حسابات العملاء (تأجير معدات)', debit: 0, credit: 0, costCenterId: '', costCenterName: '' },
    ]);
  };

  const handleApproveEntry = (entry: JournalEntry) => {
    const updated = entries.map(e => e.id === entry.id ? { ...e, status: 'approved' as const } : e);
    setEntries(updated);

    // Update cost center budgets upon approval (overall and line level) - converting to EGP
    if (costCenters && onUpdateCostCenters) {
      const updates: { [id: string]: number } = {};
      const rate = entry.exchangeRate || 1.0;
      
      if (entry.costCenterId) {
        updates[entry.costCenterId] = (updates[entry.costCenterId] || 0) + (entry.debit * rate);
      }
      
      entry.lines?.forEach(line => {
        if (line.costCenterId) {
          const amount = line.debit > 0 ? line.debit : line.credit;
          updates[line.costCenterId] = (updates[line.costCenterId] || 0) + (amount * rate);
        }
      });
      
      if (Object.keys(updates).length > 0) {
        const updatedCCs = costCenters.map(cc => {
          if (updates[cc.id]) {
            return { ...cc, usedBudget: cc.usedBudget + updates[cc.id] };
          }
          return cc;
        });
        onUpdateCostCenters(updatedCCs);
      }
    }
  };

  const filteredEntries = entries.filter(e => 
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.docNo.toLowerCase().includes(search.toLowerCase()) ||
    (e.costCenterName && e.costCenterName.toLowerCase().includes(search.toLowerCase())) ||
    e.lines?.some(l => l.costCenterName && l.costCenterName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans" dir="rtl">
      
      {/* Header Container styled with Glassmorphism */}
      <div className="relative overflow-hidden bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#0F4C81]/5 blur-xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] rounded-2xl border border-[#0F4C81]/20 shadow-3xs flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#0F4C81]" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">دفتر قيود اليومية المحاسبية</h1>
          </div>
          <p className="text-sm text-slate-500 font-bold">
            إدخال واعتماد المعاملات المالية المباشرة والتشغيلية في مصر بالجنيه المصري (EGP) مع ربط تفاعلي بمراكز التكلفة والمشاريع.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ExportPDFButton
            variant="outline"
            titleAr="تصدير دفتر القيود PDF 📄"
            titleEn="Export Journal Register PDF"
            exportOptions={{
              titleAr: 'دفتر قيود اليومية المحاسبية المعتمدة - إيجيبت كرينز',
              titleEn: 'General Journal Entries Register - Egypt Cranes',
              subtitleAr: `سجل حركة القيود اليومية المحاسبية لعدد (${filteredEntries.length}) قيد مالي`,
              filename: 'journal_entries_register',
              columns: [
                { headerAr: 'رقم السند', accessor: 'docNo', align: 'center', width: '100px' },
                { headerAr: 'التاريخ', accessor: (r: any) => new Date(r.date).toLocaleDateString('ar-EG'), align: 'center', width: '100px' },
                { headerAr: 'البيان والشرح التفصيلي', accessor: 'description', align: 'right' },
                { headerAr: 'مركز التكلفة', accessor: (r: any) => r.costCenterName || 'عام', align: 'center', width: '130px' },
                { headerAr: 'المدين (EGP)', accessor: (r: any) => `${Number(r.debit * (r.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م`, align: 'left', width: '140px' },
                { headerAr: 'الدائن (EGP)', accessor: (r: any) => `${Number(r.credit * (r.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م`, align: 'left', width: '140px' },
                { headerAr: 'الحالة', accessor: (r: any) => r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة', align: 'center', width: '90px' }
              ],
              data: filteredEntries,
              summaryItems: [
                { labelAr: 'عدد القيود المشمولة', value: `${filteredEntries.length} قيد` },
                { labelAr: 'إجمالي الحركات المدينة', value: `${filteredEntries.reduce((acc, curr) => acc + (curr.debit * (curr.exchangeRate || 1)), 0).toLocaleString()} ج.م` },
                { labelAr: 'إجمالي الحركات الدائنة', value: `${filteredEntries.reduce((acc, curr) => acc + (curr.credit * (curr.exchangeRate || 1)), 0).toLocaleString()} ج.م` },
                { labelAr: 'حالة التوازن', value: 'متوازن 100%', highlight: true }
              ]
            }}
          />
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white font-extrabold text-xs rounded-2xl transition-all duration-300 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة قيد يومية مزدوج
          </button>
        </div>
      </div>

      {/* Exchange Rates Control Center */}
      <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#F7941D]/10 text-[#F7941D] rounded-2xl border border-[#F7941D]/20 shadow-3xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <span>مركز إدارة أسعار الصرف اليومية (Multi-currency)</span>
                <span className="text-[10px] bg-[#0F4C81]/10 text-[#0F4C81] px-1.5 py-0.5 rounded font-black">تحديث مركزي</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد أسعار الصرف مقابل الجنيه المصري (EGP) لمختلف قيود اليومية والفواتير والعمليات بالعملات الأجنبية.
                {ratesLastUpdated && (
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    آخر تحديث معتمد للأسعار: {new Date(ratesLastUpdated).toLocaleString('ar-EG')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleFetchLiveRates}
              disabled={isFetchingRates}
              className="px-3 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] disabled:opacity-55 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin' : ''}`} />
              <span>جلب الأسعار تلقائياً من البنك المركزي (API)</span>
            </button>
            
            <button
              onClick={() => {
                setIsEditingRates(!isEditingRates);
                setManualRates(rates);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {isEditingRates ? 'إلغاء التعديل اليدوي' : 'تحديث يدوي للأسعار'}
            </button>
          </div>
        </div>

        {/* Feedback states */}
        {rateFeedback && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 border-t ${
            rateFeedback.startsWith('success') 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              {rateFeedback === 'success-fetch' && 'تم جلب وتحديث أسعار الصرف الحية من API بنجاح وحفظها كقيم يومية معتمدة.'}
              {rateFeedback === 'success-save' && 'تم حفظ تعديلات أسعار الصرف اليدوية بنجاح وتحديث النظام بالكامل.'}
              {rateFeedback === 'error-fetch' && 'فشل جلب الأسعار تلقائياً. يرجى التحقق من الاتصال بالإنترنت أو إدخالها يدوياً.'}
            </span>
          </div>
        )}

        {/* Edit or display rates strip */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          {isEditingRates ? (
            <form onSubmit={handleSaveManualRates} className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
              {[
                { key: 'USD', name: 'الدولار الأمريكي ($)' },
                { key: 'EUR', name: 'اليورو (€)' },
                { key: 'SAR', name: 'الريال السعودي (ر.س)' },
                { key: 'AED', name: 'الدرهم الإماراتي (د.إ)' }
              ].map(curr => (
                <div key={curr.key} className="space-y-1.5">
                  <label className="block text-[11px] text-slate-500 font-bold">{curr.name}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      min="0.1"
                      required
                      value={manualRates[curr.key as keyof ExchangeRates] || ''}
                      onChange={(e) => setManualRates({
                        ...manualRates,
                        [curr.key]: parseFloat(e.target.value) || 0
                      })}
                      className="w-full pl-12 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-left focus:border-[#F7941D] focus:ring-1 focus:ring-[#F7941D]"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">ج.م</span>
                  </div>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  حفظ أسعار الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRates(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {[
                { key: 'USD', name: 'الدولار الأمريكي ($)', rate: rates.USD },
                { key: 'EUR', name: 'اليورو (€)', rate: rates.EUR },
                { key: 'SAR', name: 'الريال السعودي (ر.س)', rate: rates.SAR },
                { key: 'AED', name: 'الدرهم الإماراتي (د.إ)', rate: rates.AED }
              ].map(curr => (
                <div key={curr.key} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-slate-600">{curr.name}</span>
                  <span className="font-mono font-black text-[#0F4C81]">{curr.rate.toFixed(2)} ج.م</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Controls Card with Glassmorphism */}
      <div className="bg-white/45 backdrop-blur-xl border border-white/60 p-4 rounded-3xl shadow-sm flex items-center">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="البحث بالبيان، رقم السند، أو اسم مركز التكلفة..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 bg-white/70 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white text-right"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Grid of Journal entries */}
      <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/30 border-b border-slate-100/60">
                <th className="px-6 py-4 text-xs font-black text-slate-700">رقم السند</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700">التاريخ</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700">البيان والتفاصيل المقيدة</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700">مراكز التكلفة</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700">المدين (Debit)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700">الدائن (Credit)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700">الحالة</th>
                <th className="px-6 py-4 text-xs font-black text-slate-700 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-white/20 transition-all duration-200">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{entry.docNo}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                    {new Date(entry.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-700 font-bold max-w-md">
                    <div className="font-extrabold text-slate-800" title={entry.description}>{entry.description}</div>
                    {/* Detailed Lines preview inside the list row */}
                    {entry.lines && entry.lines.length > 0 && (
                      <div className="mt-2 space-y-1 bg-slate-50/55 p-2 rounded-xl border border-slate-100/40">
                        {entry.lines.map((line, lIdx) => (
                          <div key={lIdx} className="text-[10px] text-slate-500 font-normal flex flex-wrap items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C81]" />
                            <span className="font-bold text-slate-600">{line.accountName}:</span>
                            {line.debit > 0 && (
                              <span className="font-mono text-[#0F4C81] font-black">
                                {line.debit.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(entry.currency)} {entry.currency && entry.currency !== 'EGP' && `(${ (line.debit * (entry.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2}) } ج.م)`} مدين
                              </span>
                            )}
                            {line.credit > 0 && (
                              <span className="font-mono text-amber-600 font-black">
                                {line.credit.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(entry.currency)} {entry.currency && entry.currency !== 'EGP' && `(${ (line.credit * (entry.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2}) } ج.م)`} دائن
                              </span>
                            )}
                            {line.costCenterName && (
                              <span className="bg-slate-100 border border-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded font-black text-[9px] flex items-center gap-0.5">
                                <Building2 className="w-2.5 h-2.5" />
                                {line.costCenterName}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-[#0F4C81]">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {entry.costCenterName && (
                        <span className="inline-flex items-center gap-1 bg-[#0F4C81]/10 text-[#0F4C81] px-2.5 py-1 rounded-xl border border-[#0F4C81]/20 shadow-3xs">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{entry.costCenterName} (عام)</span>
                        </span>
                      )}
                      {entry.lines?.filter(line => line.costCenterName && line.costCenterName !== entry.costCenterName).map((line, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-[#F7941D]/10 text-[#F7941D] px-2 py-0.5 rounded-lg border border-[#F7941D]/20 text-[10px] font-black">
                          <Building2 className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[80px]">{line.costCenterName}</span>
                        </span>
                      ))}
                      {!entry.costCenterName && !entry.lines?.some(l => l.costCenterName) && (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-[#0F4C81] font-mono">
                    {entry.debit > 0 ? (
                      <div>
                        <div>{entry.debit.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(entry.currency)}</div>
                        {entry.currency && entry.currency !== 'EGP' && (
                          <div className="text-[10px] text-slate-400 font-medium">{(entry.debit * (entry.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</div>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-amber-600 font-mono">
                    {entry.credit > 0 ? (
                      <div>
                        <div>{entry.credit.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(entry.currency)}</div>
                        {entry.currency && entry.currency !== 'EGP' && (
                          <div className="text-[10px] text-slate-400 font-medium">{(entry.credit * (entry.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</div>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-[10px] ${
                      entry.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      entry.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        entry.status === 'approved' ? 'bg-emerald-600' :
                        entry.status === 'rejected' ? 'bg-rose-600' : 'bg-amber-500'
                      }`} />
                      {entry.status === 'approved' ? 'معتمد' :
                       entry.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ExportPDFButton
                        size="sm"
                        variant="ghost"
                        titleAr="طباعة السند PDF"
                        titleEn="Print Voucher PDF"
                        exportOptions={{
                          titleAr: `سند قيد يومية محاسبي - ${entry.docNo}`,
                          titleEn: `Journal Entry Voucher - ${entry.docNo}`,
                          subtitleAr: `التاريخ: ${new Date(entry.date).toLocaleDateString('ar-EG')} • البيان: ${entry.description}`,
                          filename: `journal_voucher_${entry.docNo}`,
                          columns: [
                            { headerAr: 'اسم الحساب المحاسبي', accessor: 'accountName', align: 'right' },
                            { headerAr: 'مركز التكلفة المرتبط', accessor: (r: any) => r.costCenterName || entry.costCenterName || 'عام', align: 'center', width: '130px' },
                            { headerAr: 'مدين (Debit)', accessor: (r: any) => r.debit > 0 ? `${Number(r.debit).toLocaleString(undefined, {maximumFractionDigits: 2})} ${getCurrencySymbol(entry.currency)}` : '-', align: 'left', width: '130px' },
                            { headerAr: 'دائن (Credit)', accessor: (r: any) => r.credit > 0 ? `${Number(r.credit).toLocaleString(undefined, {maximumFractionDigits: 2})} ${getCurrencySymbol(entry.currency)}` : '-', align: 'left', width: '130px' }
                          ],
                          data: entry.lines || [
                            { accountName: 'حساب المدين', debit: entry.debit, credit: 0, costCenterName: entry.costCenterName },
                            { accountName: 'حساب الدائن', debit: 0, credit: entry.credit, costCenterName: entry.costCenterName }
                          ],
                          summaryItems: [
                            { labelAr: 'إجمالي طرف المدين', value: `${entry.debit.toLocaleString()} ${getCurrencySymbol(entry.currency)}` },
                            { labelAr: 'إجمالي طرف الدائن', value: `${entry.credit.toLocaleString()} ${getCurrencySymbol(entry.currency)}` },
                            { labelAr: 'حالة اعتماد السند', value: entry.status === 'approved' ? 'معتمد ومرحل للحسابات' : 'قيد المراجعة', highlight: true }
                          ]
                        }}
                      />
                      {entry.status === 'pending' && (
                        <button 
                          onClick={() => handleApproveEntry(entry)}
                          className="text-[10px] font-black text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors shadow-3xs cursor-pointer whitespace-nowrap"
                        >
                          اعتماد القيد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glassmorphic Modal Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-5xl w-full border border-white/60 overflow-hidden text-right my-8"
            >
              {/* Modal Header */}
              <div className="bg-[#0F4C81]/90 backdrop-blur-md p-6 text-white flex items-center justify-between border-b border-white/10">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-white animate-pulse" />
                    <span>تحرير قيد يومية مزدوج جديد</span>
                  </h3>
                  <p className="text-[11px] text-white/70 font-bold">أنشئ معاملة مالية متزنة واربط الحسابات بمراكز التكلفة المناسبة لتعقب الموازنة والمشاريع</p>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-extrabold transition-all duration-200 cursor-pointer text-sm"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddEntry} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {/* Meta Fields block */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">رقم السند التلقائي</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={docNo}
                        onChange={(e) => setDocNo(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white font-mono font-black text-slate-800"
                      />
                      <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">تاريخ المعاملة المالية</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white font-bold text-slate-800"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">البيان الرئيسي للقيد</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: صرف عهدة بترول ونش 250 طن بمشروع بورسعيد"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Status and Overall Cost Center integration */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">الحالة الابتدائية للسند</label>
                    <select
                      value={entryStatus}
                      onChange={(e) => setEntryStatus(e.target.value as 'pending' | 'approved')}
                      className="w-full px-4 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white text-slate-800 font-bold h-[38px] cursor-pointer"
                    >
                      <option value="pending">قيد الانتظار (تتطلب مراجعة واعتماد لاحق)</option>
                      <option value="approved">معتمد فوراً ورحل الحسابات والموازنة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">مركز التكلفة العام للسند</label>
                    <CostCenterDropdown
                      costCenters={costCenters}
                      selectedId={selectedCostCenterId}
                      onSelect={(id, nameAr) => {
                        setSelectedCostCenterId(id);
                      }}
                      placeholder="-- بدون مركز تكلفة عام --"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>عملة المعاملة والقيود</span>
                    </label>
                    <select
                      value={entryCurrency}
                      onChange={(e) => setEntryCurrency(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white text-slate-800 font-bold h-[38px] cursor-pointer"
                    >
                      <option value="EGP">EGP - الجنيه المصري</option>
                      <option value="USD">USD - الدولار الأمريكي</option>
                      <option value="EUR">EUR - اليورو</option>
                      <option value="SAR">SAR - الريال السعودي</option>
                      <option value="AED">AED - الدرهم الإماراتي</option>
                    </select>
                  </div>

                  {entryCurrency !== 'EGP' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7941D]" />
                        <span>سعر صرف القيد (مقابل ج.م)</span>
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        min="0.1"
                        value={entryExchangeRate}
                        onChange={(e) => setEntryExchangeRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-white/80 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:bg-white text-slate-800 font-mono font-bold h-[38px]"
                      />
                    </div>
                  )}

                  {selectedCostCenterId && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        سيتم ترحيل مبلغ <strong>{totalDebit.toLocaleString()} {getCurrencySymbol(entryCurrency)}</strong> {entryCurrency !== 'EGP' && <span>(المعادل: <strong>{(totalDebit * entryExchangeRate).toLocaleString()} ج.م</strong>)</span>} تلقائياً لمركز تكلفة: <strong>{costCenters.find(cc => cc.id === selectedCostCenterId)?.nameAr}</strong> عند تعميد القيد.
                      </span>
                    </div>
                  )}
                </div>

                {/* Row-level Cost Centers and Double Entry Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-xs">البنود والحسابات المقيدة وتوزيعات مراكز التكلفة الفرعية</h4>
                    <button 
                      type="button" 
                      onClick={addRow}
                      className="text-xs font-black text-[#0F4C81] hover:text-[#0c3d67] flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100/60 px-3 py-1.5 rounded-xl transition-all border border-blue-100/50"
                    >
                      <PlusCircle className="w-4 h-4" /> إضافة سطر مقاصة
                    </button>
                  </div>

                  <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-3xs">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 text-slate-700 font-extrabold">الحساب المقيد</th>
                          <th className="p-3 text-slate-700 font-extrabold w-64">مركز التكلفة الفرعي للمشروع</th>
                          <th className="p-3 text-slate-700 font-extrabold w-36">مدين ({getCurrencySymbol(entryCurrency)})</th>
                          <th className="p-3 text-slate-700 font-extrabold w-36">دائن ({getCurrencySymbol(entryCurrency)})</th>
                          <th className="p-3 text-slate-700 font-extrabold w-12 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-2">
                              <select 
                                value={row.account}
                                onChange={(e) => updateRow(idx, 'account', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl text-slate-800 font-bold h-[38px] cursor-pointer"
                              >
                                <option value="أوناش ومعدات الرفع الثقيل">أوناش ومعدات الرفع الثقيل</option>
                                <option value="حسابات العملاء (تأجير معدات)">حسابات العملاء (تأجير معدات)</option>
                                <option value="نقدية بالبنوك">نقدية بالبنوك (البنك الأهلي المصري)</option>
                                <option value="مخازن قطع الغيار والمستهلكات">مخازن قطع الغيار والمستهلكات</option>
                                <option value="مصاريف صيانة الأوناش والزيوت">مصاريف صيانة الأوناش والزيوت</option>
                                <option value="مصاريف رواتب وأجور موظفي التشغيل">مصاريف رواتب وأجور موظفي التشغيل</option>
                              </select>
                            </td>
                            <td className="p-2">
                              {/* Integrated Interactive Dropdown for each row */}
                              <CostCenterDropdown
                                costCenters={costCenters}
                                selectedId={row.costCenterId || ''}
                                onSelect={(id, nameAr) => {
                                  updateRow(idx, 'costCenterId', id);
                                  updateRow(idx, 'costCenterName', nameAr);
                                }}
                                placeholder="-- بدون مركز تكلفة --"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number"
                                min={0}
                                value={row.debit || ''}
                                onChange={(e) => updateRow(idx, 'debit', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200/80 rounded-xl text-center font-mono font-black text-slate-800 h-[38px]"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number"
                                min={0}
                                value={row.credit || ''}
                                onChange={(e) => updateRow(idx, 'credit', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-200/80 rounded-xl text-center font-mono font-black text-slate-800 h-[38px]"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button 
                                type="button" 
                                onClick={() => removeRow(idx)}
                                disabled={rows.length <= 2}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Validation Status Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200/50 rounded-2xl gap-4">
                  <div className="flex flex-col gap-1 text-xs font-black text-slate-700">
                    <div className="flex flex-wrap gap-4">
                      <span>إجمالي المدين: <strong className="text-[#0F4C81]">{totalDebit.toLocaleString()} {getCurrencySymbol(entryCurrency)}</strong></span>
                      <span>إجمالي الدائن: <strong className="text-amber-600">{totalCredit.toLocaleString()} {getCurrencySymbol(entryCurrency)}</strong></span>
                    </div>
                    {entryCurrency !== 'EGP' && (
                      <div className="text-[10px] text-slate-500 font-medium">
                        المعادل بالجنيه المصري (EGP): مدين <strong className="text-slate-700">{(totalDebit * entryExchangeRate).toLocaleString()} ج.م</strong> | دائن <strong className="text-slate-700">{(totalCredit * entryExchangeRate).toLocaleString()} ج.م</strong>
                      </div>
                    )}
                  </div>
                  
                  {balanceError ? (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>غير متزن! الفارق: {(totalDebit - totalCredit).toLocaleString()} {getCurrencySymbol(entryCurrency)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>القيد متزن وجاهز للحفظ والتطبيق</span>
                    </div>
                  )}
                </div>

                {/* Modal footer controls */}
                <div className="flex gap-2 pt-4 justify-end border-t border-slate-100">
                  <button 
                    type="submit"
                    disabled={balanceError}
                    className="py-2.5 px-6 bg-[#0F4C81] hover:bg-[#0c3d67] disabled:bg-slate-200 text-white text-xs font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  >
                    حفظ واعتماد السند المحاسبي
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
