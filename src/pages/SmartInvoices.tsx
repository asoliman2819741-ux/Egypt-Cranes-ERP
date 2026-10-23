import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, DocumentAttachment } from '../types';
import { initialInvoices } from '../mockData';
import { 
  Plus, Search, Eye, FileText, QrCode, Printer, Mail, Download, AlertTriangle,
  Coins, RefreshCw, Save, ArrowLeftRight, Check, Globe, HelpCircle, Settings,
  Camera, Scan, Sparkles, CheckCircle2, Paperclip, Trash2, Filter, RotateCcw,
  UserCheck, Clock, SlidersHorizontal, X, ChevronDown, ChevronUp, Calendar, Building2, Tag
} from 'lucide-react';
import { 
  getSavedExchangeRates, 
  saveExchangeRates, 
  fetchLiveExchangeRates, 
  convertAmount, 
  ExchangeRates,
  getLastExchangeRateUpdate,
  DEFAULT_RATES
} from '../utils/currencyService';
import ExportPDFButton from '../components/ExportPDFButton';
import DocumentScannerModal from '../components/DocumentScannerModal';
import DocumentAttachmentsModal from '../components/DocumentAttachmentsModal';

export function getCurrencySymbol(currency?: string): string {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'SAR': return 'ر.س';
    case 'AED': return 'د.إ';
    case 'EGP':
    default: return 'ج.م';
  }
}

export function getCurrencyNameAr(currency?: string): string {
  switch (currency) {
    case 'USD': return 'دولار أمريكي';
    case 'EUR': return 'يورو';
    case 'SAR': return 'ريال سعودي';
    case 'AED': return 'درهم إماراتي';
    case 'EGP':
    default: return 'جنيه مصري';
  }
}

interface SmartInvoicesProps {
  invoices?: Invoice[];
  onAddInvoice?: (inv: Invoice) => void;
}

export default function SmartInvoices({ invoices: propInvoices, onAddInvoice }: SmartInvoicesProps = {}) {
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(initialInvoices);
  const invoicesList = propInvoices && propInvoices.length > 0 ? propInvoices : localInvoices;

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Advanced Search & Multi-Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'unpaid' | 'overdue'>('all');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [attachmentFilter, setAttachmentFilter] = useState<'all' | 'has_attachments' | 'no_attachments'>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue' | 'foreign' | 'scanned'>('all');
  const [isAdvancedFiltersExpanded, setIsAdvancedFiltersExpanded] = useState(true);

  // Document Scanner & Attachments Modals States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'create_autofill' | 'attach_existing'>('create_autofill');
  const [selectedInvoiceForAttachment, setSelectedInvoiceForAttachment] = useState<Invoice | null>(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [selectedInvoiceForViewAttachments, setSelectedInvoiceForViewAttachments] = useState<Invoice | null>(null);
  const [scannedAttachments, setScannedAttachments] = useState<DocumentAttachment[]>([]);

  // Currency & Exchange Rates Control States
  const [rates, setRates] = useState<ExchangeRates>(getSavedExchangeRates());
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string | null>(getLastExchangeRateUpdate());
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [showRatesConfig, setShowRatesConfig] = useState(false);
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [manualRates, setManualRates] = useState<ExchangeRates>({ ...DEFAULT_RATES });

  useEffect(() => {
    setManualRates(rates);
  }, [rates]);

  // Sync rates when storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedRates = getSavedExchangeRates();
      setRates(savedRates);
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

  // New Invoice form state
  const [invoiceNo, setInvoiceNo] = useState(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [customerName, setCustomerName] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>('EGP');
  const [invoiceExchangeRate, setInvoiceExchangeRate] = useState<number>(1.0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'إيجار ونش تلسكوبي ليبهير LTM 1100 بموقع الإسكندرية', qty: 1, unitPrice: 200000, total: 200000 }
  ]);

  // Update default rate when currency changes
  useEffect(() => {
    if (invoiceCurrency === 'EGP') {
      setInvoiceExchangeRate(1.0);
    } else {
      setInvoiceExchangeRate(rates[invoiceCurrency as keyof ExchangeRates] || 1.0);
    }
  }, [invoiceCurrency, rates]);

  // Automatically adjust due date when invoice date changes
  useEffect(() => {
    if (date) {
      const d = new Date(date);
      d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [date]);

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', qty: 1, unitPrice: 0, total: 0 }]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(items.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          updated.total = updated.qty * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const amount = items.reduce((sum, item) => sum + item.total, 0);
  const tax = amount * 0.14; // 14% Egyptian VAT
  const total = amount + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoice: Invoice = {
      id: Math.random().toString(),
      invoiceNo,
      date,
      dueDate: dueDate || date,
      customerName,
      amount,
      tax,
      total,
      status: 'unpaid',
      items,
      currency: invoiceCurrency,
      exchangeRate: invoiceExchangeRate,
      attachments: scannedAttachments
    };

    setLocalInvoices([newInvoice, ...localInvoices]);
    if (onAddInvoice) {
      onAddInvoice(newInvoice);
    }
    setShowAddForm(false);
    // Reset Form
    setInvoiceNo(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setCustomerName('');
    setInvoiceCurrency('EGP');
    setInvoiceExchangeRate(1.0);
    setItems([{ id: '1', description: 'إيجار ونش تلسكوبي ليبهير LTM 1100 بموقع الإسكندرية', qty: 1, unitPrice: 200000, total: 200000 }]);
    setScannedAttachments([]);
  };

  const handleScanCompleted = (attachment: DocumentAttachment, extractedData?: DocumentAttachment['extractedData']) => {
    if (scannerMode === 'create_autofill') {
      if (extractedData) {
        if (extractedData.documentNo) setInvoiceNo(extractedData.documentNo);
        if (extractedData.customerName) setCustomerName(extractedData.customerName);
        if (extractedData.date) setDate(extractedData.date);

        if (extractedData.items && extractedData.items.length > 0) {
          setItems(extractedData.items.map((it, i) => ({
            id: String(i + 1),
            description: it.description || 'خدمات ورقية ممسوحة ضوئيًا',
            qty: it.qty || 1,
            unitPrice: it.unitPrice || extractedData.amount || 100000,
            total: it.total || (it.qty || 1) * (it.unitPrice || extractedData.amount || 100000)
          })));
        } else if (extractedData.amount) {
          setItems([{
            id: '1',
            description: `خدمات ونقل واستئجار معدات بموجب الفاتورة الورقية الممسوحة ${extractedData.documentNo || ''}`,
            qty: 1,
            unitPrice: extractedData.amount,
            total: extractedData.amount
          }]);
        }
      }

      setScannedAttachments(prev => [...prev, attachment]);
      setShowAddForm(true);
    } else if (scannerMode === 'attach_existing' && selectedInvoiceForAttachment) {
      const updatedInvoice: Invoice = {
        ...selectedInvoiceForAttachment,
        attachments: [...(selectedInvoiceForAttachment.attachments || []), attachment]
      };
      setLocalInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
      setSelectedInvoiceForAttachment(updatedInvoice);
      if (selectedInvoice?.id === updatedInvoice.id) {
        setSelectedInvoice(updatedInvoice);
      }
      if (selectedInvoiceForViewAttachments?.id === updatedInvoice.id) {
        setSelectedInvoiceForViewAttachments(updatedInvoice);
      }
    }
  };

  const handleDeleteAttachmentFromInvoice = (invoice: Invoice, attachmentId: string) => {
    const updatedAttachments = (invoice.attachments || []).filter(a => a.id !== attachmentId);
    const updatedInvoice: Invoice = {
      ...invoice,
      attachments: updatedAttachments
    };
    setLocalInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice(updatedInvoice);
    }
    if (selectedInvoiceForViewAttachments?.id === invoice.id) {
      setSelectedInvoiceForViewAttachments(updatedInvoice);
    }
  };

  // Helper date reference for overdue calculation
  const todayStr = '2026-08-07';

  // Dynamic set of unique customers
  const uniqueCustomers = Array.from(
    new Set(invoicesList.map(inv => inv.customerName ? inv.customerName.trim() : '').filter(Boolean))
  ).sort();

  // Quick Filter Handler
  const handleApplyQuickFilter = (tag: 'all' | 'paid' | 'unpaid' | 'overdue' | 'foreign' | 'scanned') => {
    setQuickFilter(tag);
    if (tag === 'all') {
      setStatusFilter('all');
      setCurrencyFilter('all');
      setAttachmentFilter('all');
    } else if (tag === 'paid') {
      setStatusFilter('paid');
      setCurrencyFilter('all');
      setAttachmentFilter('all');
    } else if (tag === 'unpaid') {
      setStatusFilter('unpaid');
      setCurrencyFilter('all');
      setAttachmentFilter('all');
    } else if (tag === 'overdue') {
      setStatusFilter('overdue');
      setCurrencyFilter('all');
      setAttachmentFilter('all');
    } else if (tag === 'foreign') {
      setStatusFilter('all');
      setCurrencyFilter('foreign');
      setAttachmentFilter('all');
    } else if (tag === 'scanned') {
      setStatusFilter('all');
      setCurrencyFilter('all');
      setAttachmentFilter('has_attachments');
    }
  };

  // Reset Filters Function
  const handleResetFilters = () => {
    setSearchQuery('');
    setCustomerFilter('all');
    setStatusFilter('all');
    setDueDateFrom('');
    setDueDateTo('');
    setCurrencyFilter('all');
    setAttachmentFilter('all');
    setQuickFilter('all');
  };

  // Live Counts for Quick Filters
  const counts = {
    all: invoicesList.length,
    paid: invoicesList.filter(i => i.status === 'paid').length,
    unpaid: invoicesList.filter(i => i.status === 'unpaid' || i.status === 'partially_paid').length,
    overdue: invoicesList.filter(i => i.status !== 'paid' && (i.dueDate ? i.dueDate < todayStr : i.date < todayStr)).length,
    scanned: invoicesList.filter(i => i.attachments && i.attachments.length > 0).length,
    foreign: invoicesList.filter(i => i.currency && i.currency !== 'EGP').length,
  };

  // Multi-criteria Filtering Logic
  const filtered = invoicesList.filter(inv => {
    // 1. Text Search (Invoice No, Customer Name, Item Description, Amount)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNo = inv.invoiceNo.toLowerCase().includes(q);
      const matchCustomer = inv.customerName.toLowerCase().includes(q);
      const matchItem = inv.items?.some(it => it.description.toLowerCase().includes(q));
      const matchAmount = inv.total.toString().includes(q);
      if (!matchNo && !matchCustomer && !matchItem && !matchAmount) {
        return false;
      }
    }

    // 2. Customer Filter
    if (customerFilter !== 'all' && inv.customerName !== customerFilter) {
      return false;
    }

    // 3. Status Filter (paid, partially_paid, unpaid, overdue)
    const isOverdue = inv.status !== 'paid' && (inv.dueDate ? inv.dueDate < todayStr : inv.date < todayStr);
    if (statusFilter === 'paid' && inv.status !== 'paid') return false;
    if (statusFilter === 'partially_paid' && inv.status !== 'partially_paid') return false;
    if (statusFilter === 'unpaid' && inv.status !== 'unpaid' && inv.status !== 'partially_paid') return false;
    if (statusFilter === 'overdue' && !isOverdue) return false;

    // 4. Due Date Range Filter (checking dueDate or date)
    const targetDate = inv.dueDate || inv.date;
    if (dueDateFrom && targetDate < dueDateFrom) return false;
    if (dueDateTo && targetDate > dueDateTo) return false;

    // 5. Currency Filter
    if (currencyFilter === 'EGP' && inv.currency && inv.currency !== 'EGP') return false;
    if (currencyFilter === 'foreign' && (!inv.currency || inv.currency === 'EGP')) return false;
    if (currencyFilter !== 'all' && currencyFilter !== 'EGP' && currencyFilter !== 'foreign' && inv.currency !== currencyFilter) return false;

    // 6. Attachment Filter
    if (attachmentFilter === 'has_attachments' && (!inv.attachments || inv.attachments.length === 0)) return false;
    if (attachmentFilter === 'no_attachments' && inv.attachments && inv.attachments.length > 0) return false;

    return true;
  });

  // Calculate totals for filtered list
  const filteredTotalValueEgp = filtered.reduce((acc, curr) => {
    const valInEgp = curr.currency && curr.currency !== 'EGP' ? curr.total * (curr.exchangeRate || 1) : curr.total;
    return acc + valInEgp;
  }, 0);

  const filteredUnpaidValueEgp = filtered
    .filter(i => i.status !== 'paid')
    .reduce((acc, curr) => {
      const valInEgp = curr.currency && curr.currency !== 'EGP' ? curr.total * (curr.exchangeRate || 1) : curr.total;
      return acc + valInEgp;
    }, 0);

  const hasActiveFilters = searchQuery !== '' || customerFilter !== 'all' || statusFilter !== 'all' || dueDateFrom !== '' || dueDateTo !== '' || currencyFilter !== 'all' || attachmentFilter !== 'all';

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">نظام الفواتير الذكية الرقمية (E-Invoicing)</h1>
          <p className="text-slate-500 mt-1 text-sm">إصدار ومتابعة الفاتورة الإلكترونية المعتمدة لشركة إيجيبت كرينز متوافقة مع مصلحة الضرائب المصرية</p>
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
            <span>مسح فاتورة ورقية بالكاميرا 📷</span>
          </button>

          <button 
            onClick={() => {
              setScannedAttachments([]);
              setShowAddForm(true);
            }}
            className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> إنشاء فاتورة إلكترونية
          </button>
        </div>
      </div>

      {/* Exchange Rates Control Center */}
      <div className="bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#F7941D]/15 text-[#F7941D] rounded-xl border border-[#F7941D]/25">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>لوحة التحكم في أسعار صرف العملات الأجنبية اليومية</span>
                <span className="text-[10px] bg-[#0F4C81] text-white px-1.5 py-0.5 rounded font-normal">تحديث يومي</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد أسعار الصرف مقابل الجنيه المصري (EGP) لدعم الفواتير وقيود اليومية متعددة العملات.
                {ratesLastUpdated && (
                  <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                    آخر تحديث: {new Date(ratesLastUpdated).toLocaleString('ar-EG')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleFetchLiveRates}
              disabled={isFetchingRates}
              className="px-3 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] disabled:opacity-55 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin' : ''}`} />
              <span>جلب الأسعار تلقائياً من البنك المركزي (API)</span>
            </button>
            
            <button
              onClick={() => {
                setIsEditingRates(!isEditingRates);
                setManualRates(rates);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              {isEditingRates ? 'إلغاء التعديل اليدوي' : 'تحديث يدوي للأسعار'}
            </button>
          </div>
        </div>

        {/* Feedback states */}
        {rateFeedback && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 border-t ${
            rateFeedback.startsWith('success') 
              ? 'bg-emerald-950/45 text-emerald-300 border-emerald-800' 
              : 'bg-rose-950/45 text-rose-300 border-rose-800'
          }`}>
            <Check className="w-4 h-4" />
            <span>
              {rateFeedback === 'success-fetch' && 'تم جلب وتحديث أسعار الصرف الحية من API بنجاح وحفظها كقيم يومية معتمدة.'}
              {rateFeedback === 'success-save' && 'تم حفظ تعديلات أسعار الصرف اليدوية بنجاح وتحديث النظام بالكامل.'}
              {rateFeedback === 'error-fetch' && 'فشل جلب الأسعار تلقائياً. يرجى التحقق من الاتصال بالإنترنت أو إدخالها يدوياً.'}
            </span>
          </div>
        )}

        {/* Edit or display rates strip */}
        <div className="border-t border-slate-800 bg-slate-950/30 p-4">
          {isEditingRates ? (
            <form onSubmit={handleSaveManualRates} className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
              {[
                { key: 'USD', name: 'الدولار الأمريكي ($)' },
                { key: 'EUR', name: 'اليورو (€)' },
                { key: 'SAR', name: 'الريال السعودي (ر.س)' },
                { key: 'AED', name: 'الدرهم الإماراتي (د.إ)' }
              ].map(curr => (
                <div key={curr.key} className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-bold">{curr.name}</label>
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
                      className="w-full pl-12 pr-3 py-1.5 bg-slate-900 border border-slate-750 text-white rounded-lg text-xs font-mono font-bold text-left focus:border-[#F7941D] focus:ring-1 focus:ring-[#F7941D]"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500">ج.م</span>
                  </div>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الأسعار اليدوية</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'USD', name: 'الدولار الأمريكي', symbol: '$', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { key: 'EUR', name: 'اليورو', symbol: '€', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                { key: 'SAR', name: 'الريال السعودي', symbol: 'ر.س', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { key: 'AED', name: 'الدرهم الإماراتي', symbol: 'د.إ', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
              ].map(curr => {
                const value = rates[curr.key as keyof ExchangeRates] || DEFAULT_RATES[curr.key as keyof ExchangeRates];
                return (
                  <div key={curr.key} className={`p-3 rounded-xl border flex items-center justify-between ${curr.bg}`}>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">{curr.name}</span>
                      <span className="text-sm font-black font-mono tracking-tight mt-0.5 block">
                        {value.toFixed(2)} <span className="text-[10px] font-sans">ج.م</span>
                      </span>
                    </div>
                    <span className="text-xl font-extrabold opacity-75">{curr.symbol}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 QUICK FILTER BUTTONS (أزرار التصفية السريعة) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-[#0F4C81]" />
            <span>أزرار التصفية السريعة للفواتير (Quick Filter Presets):</span>
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-700 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط كافة الفلاتر</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'كافة الفواتير', icon: FileText, count: counts.all, bg: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200', activeBg: 'bg-[#0F4C81] text-white border-[#0F4C81]' },
            { id: 'paid', label: 'مدفوعة بالكامل', icon: CheckCircle2, count: counts.paid, bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200', activeBg: 'bg-emerald-600 text-white border-emerald-600' },
            { id: 'unpaid', label: 'غير مسددة / معلقة', icon: Clock, count: counts.unpaid, bg: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200', activeBg: 'bg-amber-600 text-white border-amber-600' },
            { id: 'overdue', label: 'متأخرة عن الاستحقاق ⚠️', icon: AlertTriangle, count: counts.overdue, bg: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200', activeBg: 'bg-rose-600 text-white border-rose-600' },
            { id: 'scanned', label: 'مرفق بها مستند ورقي 📷', icon: Paperclip, count: counts.scanned, bg: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200', activeBg: 'bg-sky-600 text-white border-sky-600' },
            { id: 'foreign', label: 'عملات أجنبية 💱', icon: Coins, count: counts.foreign, bg: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200', activeBg: 'bg-indigo-600 text-white border-indigo-600' },
          ].map(btn => {
            const Icon = btn.icon;
            const isActive = quickFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleApplyQuickFilter(btn.id as any)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                  isActive ? btn.activeBg : btn.bg
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{btn.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-800 border border-slate-200'
                }`}>
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔍 ADVANCED MULTI-CRITERIA SEARCH PANEL (شريط البحث المتقدم) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] rounded-xl">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">شريط البحث والتصفية المتقدم (Advanced Filter Panel)</h3>
              <p className="text-[11px] text-slate-500">تصفية دقيقة حسب العميل، تاريخ الاستحقاق، حالة السداد، المرفقات، والعملة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdvancedFiltersExpanded(!isAdvancedFiltersExpanded)}
              className="text-xs font-bold text-slate-600 hover:text-[#0F4C81] flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs cursor-pointer"
            >
              <span>{isAdvancedFiltersExpanded ? 'طي الفلاتر' : 'توسيع الفلاتر'}</span>
              {isAdvancedFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Body */}
        {isAdvancedFiltersExpanded && (
          <div className="p-4 space-y-4">
            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. General Text Search Input */}
              <div className="space-y-1.5 lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>بحث عام برقم الفاتورة أو العميل أو البيان</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="ادخل رقم الفاتورة (مثال: INV-2026)، اسم العميل، أو وصف الخدمة..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-9 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] bg-slate-50/50 focus:bg-white"
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Customer Filter (تصفية حسب العميل) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>العميل المستأجر (Customer)</span>
                </label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="all">كافة العملاء والشركات ({uniqueCustomers.length})</option>
                  {uniqueCustomers.map(cust => (
                    <option key={cust} value={cust}>{cust}</option>
                  ))}
                </select>
              </div>

              {/* 3. Payment Status Filter (حالة الدفع) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>حالة الدفع والسداد (Status)</span>
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setQuickFilter('all');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="all">كافة حالات السداد</option>
                  <option value="paid">مدفوعة بالكامل (Paid)</option>
                  <option value="partially_paid">مسددة جزئياً (Partially Paid)</option>
                  <option value="unpaid">غير مسددة / معلقة (Unpaid / Pending)</option>
                  <option value="overdue">متأخرة عن تاريخ الاستحقاق ⚠️ (Overdue)</option>
                </select>
              </div>

              {/* 4. Due Date Range Filter (تاريخ الاستحقاق من - إلى) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>تاريخ الاستحقاق / الفاتورة (من)</span>
                </label>
                <input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>تاريخ الاستحقاق / الفاتورة (إلى)</span>
                </label>
                <input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              {/* 5. Currency Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>تصفية حسب العملة (Currency)</span>
                </label>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="all">كافة العملات</option>
                  <option value="EGP">بالجنيه المصري فقط (EGP)</option>
                  <option value="foreign">كافة العملات الأجنبية (USD / EUR / SAR)</option>
                  <option value="USD">USD - الدولار الأمريكي</option>
                  <option value="EUR">EUR - اليورو</option>
                  <option value="SAR">SAR - الريال السعودي</option>
                </select>
              </div>

              {/* 6. Attachments Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-[#0F4C81]" />
                  <span>المستندات الورقية المرفقة</span>
                </label>
                <select
                  value={attachmentFilter}
                  onChange={(e) => setAttachmentFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="all">كافة الفواتير (مرفقة وبدون)</option>
                  <option value="has_attachments">تضم مستندات ممسوحة ضوئياً 📷</option>
                  <option value="no_attachments">بدون مستندات ضوئية مرفقة</option>
                </select>
              </div>
            </div>

            {/* Quick Presets Buttons for Due Date */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">تحديد سريع للنطاق الزمني:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDueDateFrom('2026-08-01');
                    setDueDateTo('2026-08-31');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  مستحقات أغسطس 2026 📅
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDueDateFrom('2026-07-01');
                    setDueDateTo('2026-07-31');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  الشهر الماضي (يوليو) 📅
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDueDateFrom('');
                    setDueDateTo('2026-08-07');
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-rose-200"
                >
                  المستحقات حتى اليوم ⚠️
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الفلاتر</span>
                </button>

                <ExportPDFButton
                  variant="primary"
                  titleAr="تصدير النتائج PDF 📄"
                  titleEn="Export Filtered PDF 📄"
                  exportOptions={{
                    titleAr: 'تقرير الفواتير المصفاة حسب المعايير المختارة',
                    titleEn: 'Filtered Invoices Search Report',
                    filename: 'filtered_invoices_report',
                    columns: [
                      { headerAr: 'رقم الفاتورة', accessor: 'invoiceNo', align: 'right' },
                      { headerAr: 'العميل', accessor: 'customerName', align: 'right' },
                      { headerAr: 'تاريخ الفاتورة', accessor: (row) => new Date(row.date).toLocaleDateString('ar-EG'), align: 'right' },
                      { headerAr: 'تاريخ الاستحقاق', accessor: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString('ar-EG') : 'غير محدد', align: 'right' },
                      { headerAr: 'المبلغ الأساسي', accessor: (row) => `${row.amount.toLocaleString()} ${getCurrencySymbol(row.currency)}`, align: 'right' },
                      { headerAr: 'الضريبة (14%)', accessor: (row) => `${row.tax.toLocaleString()} ${getCurrencySymbol(row.currency)}`, align: 'right' },
                      { headerAr: 'الإجمالي الشامل', accessor: (row) => `${row.total.toLocaleString()} ${getCurrencySymbol(row.currency)}`, align: 'right' },
                      { headerAr: 'حالة السداد', accessor: (row) => row.status === 'paid' ? 'مسددة بالكامل' : row.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة', align: 'right' }
                    ],
                    data: filtered,
                    summaryItems: [
                      { labelAr: 'عدد الفواتير المصفاة', value: `${filtered.length} فاتورة`, highlight: true },
                      { labelAr: 'إجمالي المبالغ بالجنيه', value: `${filteredTotalValueEgp.toLocaleString()} ج.م` },
                      { labelAr: 'إجمالي الرصيد غير المسدد', value: `${filteredUnpaidValueEgp.toLocaleString()} ج.م` }
                    ]
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🏷️ ACTIVE FILTERS CHIPS & LIVE RESULTS SUMMARY */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#0F4C81]" />
            <span>معايير البحث النشطة:</span>
          </span>

          {!hasActiveFilters && (
            <span className="text-xs font-semibold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              جميع الفواتير معروضة بدون قيود
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#0F4C81] border border-sky-200 rounded-lg text-xs font-bold shadow-2xs">
              <span>نص البحث: "{searchQuery}"</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}

          {customerFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs">
              <span>العميل: {customerFilter}</span>
              <button onClick={() => setCustomerFilter('all')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}

          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-amber-800 border border-amber-200 rounded-lg text-xs font-bold shadow-2xs">
              <span>الحالة: {
                statusFilter === 'paid' ? 'مدفوعة بالكامل' :
                statusFilter === 'partially_paid' ? 'مسددة جزئياً' :
                statusFilter === 'unpaid' ? 'غير مسددة' : 'متأخرة ⚠️'
              }</span>
              <button onClick={() => setStatusFilter('all')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}

          {(dueDateFrom || dueDateTo) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shadow-2xs">
              <span>التاريخ: {dueDateFrom || 'الداية'} ⬅️ {dueDateTo || 'اليوم'}</span>
              <button onClick={() => { setDueDateFrom(''); setDueDateTo(''); }} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}

          {currencyFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-blue-700 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs">
              <span>العملة: {currencyFilter === 'foreign' ? 'عملات أجنبية' : currencyFilter}</span>
              <button onClick={() => setCurrencyFilter('all')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}

          {attachmentFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-sky-700 border border-sky-200 rounded-lg text-xs font-bold shadow-2xs">
              <span>المستندات: {attachmentFilter === 'has_attachments' ? 'تضم مرفق ضوئي' : 'بدون مرفق'}</span>
              <button onClick={() => setAttachmentFilter('all')} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>

        {/* Live Filter Summary Indicators */}
        <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-r border-slate-200 pt-3 md:pt-0 md:pr-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">الفواتير المعروضة</span>
            <span className="text-xs font-black text-[#0F4C81]">
              {filtered.length} <span className="text-[10px] text-slate-500 font-normal">من أصل {invoicesList.length}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي القيمة المصفاة</span>
            <span className="text-xs font-black text-slate-800 font-mono">
              {filteredTotalValueEgp.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] font-sans">ج.م</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold block">المبالغ غير المسددة</span>
            <span className="text-xs font-black text-rose-600 font-mono">
              {filteredUnpaidValueEgp.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] font-sans">ج.م</span>
            </span>
          </div>
        </div>
      </div>

      {/* 📊 INVOICES GRID & ENHANCED TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 font-bold text-slate-700">رقم الفاتورة</th>
                <th className="px-5 py-4 font-bold text-slate-700">العميل المستأجر</th>
                <th className="px-5 py-4 font-bold text-slate-700">تاريخ الفاتورة</th>
                <th className="px-5 py-4 font-bold text-slate-700">تاريخ الاستحقاق (Due Date)</th>
                <th className="px-5 py-4 font-bold text-slate-700">القيمة الأساسية</th>
                <th className="px-5 py-4 font-bold text-slate-700">الضريبة (١٤٪)</th>
                <th className="px-5 py-4 font-bold text-slate-700">الإجمالي الشامل</th>
                <th className="px-5 py-4 font-bold text-slate-700">حالة الدفع والسداد</th>
                <th className="px-5 py-4 font-bold text-slate-700 text-center">المستند الورقي</th>
                <th className="px-5 py-4 font-bold text-slate-700 text-center">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map(invoice => {
                  const targetDueDate = invoice.dueDate || invoice.date;
                  const isOverdue = invoice.status !== 'paid' && targetDueDate < todayStr;

                  return (
                    <tr 
                      key={invoice.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isOverdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-[#0F4C81]">
                        {invoice.invoiceNo}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {invoice.customerName}
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                        {new Date(invoice.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-mono text-xs font-bold ${
                            isOverdue ? 'text-rose-600' : 'text-slate-700'
                          }`}>
                            {targetDueDate ? new Date(targetDueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'غير محدد'}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded w-max mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> متأخرة عن الاستحقاق
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600 whitespace-nowrap">
                        <div>{invoice.amount.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoice.currency)}</div>
                        {invoice.currency && invoice.currency !== 'EGP' && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            يعادل {(invoice.amount * (invoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-500 whitespace-nowrap">
                        <div>{invoice.tax.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoice.currency)}</div>
                        {invoice.currency && invoice.currency !== 'EGP' && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            يعادل {(invoice.tax * (invoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-black text-[#0F4C81] whitespace-nowrap">
                        <div>{invoice.total.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoice.currency)}</div>
                        {invoice.currency && invoice.currency !== 'EGP' && (
                          <div className="text-[10px] text-indigo-600 font-mono font-bold mt-0.5">
                            يعادل {(invoice.total * (invoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          invoice.status === 'partially_paid' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {invoice.status === 'paid' ? 'مسددة بالكامل' :
                           invoice.status === 'partially_paid' ? 'مسددة جزئياً' :
                           isOverdue ? 'متأخرة عن الاستحقاق ⚠️' : 'غير مسددة'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {invoice.attachments && invoice.attachments.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForViewAttachments(invoice);
                              setIsAttachmentsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold hover:bg-sky-100 transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>مرفق ({invoice.attachments.length})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForAttachment(invoice);
                              setScannerMode('attach_existing');
                              setIsScannerOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                            title="مسح الفاتورة الورقية بالكاميرا وإرفاقها"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>مسح ضوئي</span>
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-1.5 bg-blue-50 text-[#0F4C81] hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="عرض تفاصيل الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-12 px-4 bg-slate-50/50">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="p-3 bg-slate-200/60 text-slate-500 rounded-full w-max mx-auto">
                        <Filter className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">لا توجد فواتير تطابق معايير البحث الحالية</h4>
                      <p className="text-xs text-slate-500">
                        جرب جلب نتائج أكثر أو تعديل خيارات البحث مثل اسم العميل، نطاق تاريخ الاستحقاق، أو اضغط زر إعادة ضبط الفلاتر.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-[#0F4C81] text-white text-xs font-bold rounded-xl hover:bg-[#0c3d67] transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>إعادة ضبط الفلاتر وإظهار الكل</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 dir-rtl">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg">معاينة الفاتورة الضريبية رقم ({selectedInvoice.invoiceNo})</h3>
                  <p className="text-xs opacity-80 mt-0.5">صادرة للعميل: {selectedInvoice.customerName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold">تاريخ الفاتورة:</span>
                  <span className="font-bold text-slate-800">{new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold">تاريخ الاستحقاق (Due Date):</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold">حالة الفاتورة:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    selectedInvoice.status === 'partially_paid' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedInvoice.status === 'paid' ? 'مسددة بالكامل' :
                     selectedInvoice.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">وصف الخدمة / البند</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-center">سعر الوحدة</th>
                      <th className="p-3 text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center font-mono">{item.qty}</td>
                        <td className="p-3 text-center font-mono">
                          {item.unitPrice.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(selectedInvoice.currency)}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {item.total.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(selectedInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Currency Details info strip */}
              {selectedInvoice.currency && selectedInvoice.currency !== 'EGP' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex justify-between items-center text-slate-600 font-bold">
                  <span>عملة الفاتورة الأساسية: {getCurrencyNameAr(selectedInvoice.currency)} ({selectedInvoice.currency})</span>
                  <span className="font-mono text-[#0F4C81]">سعر الصرف المعتمد: 1 {selectedInvoice.currency} = {selectedInvoice.exchangeRate?.toFixed(2)} EGP</span>
                </div>
              )}

              {/* Financial calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedInvoice.currency && selectedInvoice.currency !== 'EGP' && (
                  <div className="border rounded-xl p-4 space-y-2 text-xs bg-indigo-50/50 border-indigo-150">
                    <h5 className="font-bold text-indigo-900 border-b pb-1 mb-2">القيمة المعادلة بالجنيه المصري لمصلحة الضرائب:</h5>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>القيمة الخاضعة للضريبة:</span>
                      <span className="font-bold">{(selectedInvoice.amount * (selectedInvoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة (١٤٪):</span>
                      <span className="font-bold">{(selectedInvoice.tax * (selectedInvoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-xs text-indigo-950 font-extrabold">
                      <span>الإجمالي الشامل (EGP):</span>
                      <span className="text-[#0F4C81] font-black">{(selectedInvoice.total * (selectedInvoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</span>
                    </div>
                  </div>
                )}
                
                <div className={`mr-auto border rounded-xl p-4 space-y-2 text-xs bg-slate-50 ${selectedInvoice.currency && selectedInvoice.currency !== 'EGP' ? 'w-full' : 'w-1/2'}`}>
                  <h5 className="font-bold text-slate-700 border-b pb-1 mb-2">
                    {selectedInvoice.currency && selectedInvoice.currency !== 'EGP' ? 'القيمة بعملة الفاتورة الأصلية:' : 'تفاصيل القيم المالية:'}
                  </h5>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">القيمة الخاضعة للضريبة:</span>
                    <span className="font-bold text-slate-700">{selectedInvoice.amount.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ضريبة القيمة المضافة (١٤٪):</span>
                    <span className="font-bold text-slate-700">{selectedInvoice.tax.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-[#0F4C81] font-extrabold">المبلغ الشامل المعتمد:</span>
                    <span className="text-[#0F4C81] font-black">{selectedInvoice.total.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(selectedInvoice.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Document Attachments Section in Invoice View Modal */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-[#0F4C81]" />
                    <span>المستندات والنسخ الورقية المنسوخة ضوئياً ({selectedInvoice.attachments?.length || 0})</span>
                  </h5>
                  <button
                    onClick={() => {
                      setSelectedInvoiceForAttachment(selectedInvoice);
                      setScannerMode('attach_existing');
                      setIsScannerOpen(true);
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>إضافة مسح ضوئي جديد</span>
                  </button>
                </div>

                {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedInvoice.attachments.map((att) => (
                      <div key={att.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-xs">
                        {att.fileUrl.startsWith('data:image/') ? (
                          <img src={att.fileUrl} alt={att.fileName} className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-sky-50 text-sky-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-sky-100">
                            {att.fileType.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-xs font-bold text-slate-800 truncate">{att.fileName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{att.scannedAt}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                            title="معاينة المستند"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteAttachmentFromInvoice(selectedInvoice, att.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف المرفق"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2 bg-white rounded-lg border border-dashed border-slate-200">
                    لا توجد مرفقات ضوئية لهذه الفاتورة بعد. استخدم زر المسح أعلاه لإرفاق الفاتورة الورقية.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
              <ExportPDFButton
                variant="primary"
                titleAr="تصدير الفاتورة PDF 📄"
                titleEn="Export Invoice PDF 📄"
                exportOptions={{
                  titleAr: `فاتورة ضريبية إلكترونية رقم (${selectedInvoice.invoiceNo})`,
                  titleEn: `Tax E-Invoice No. ${selectedInvoice.invoiceNo}`,
                  subtitleAr: `العميل: ${selectedInvoice.customerName}`,
                  filename: `invoice_${selectedInvoice.invoiceNo}`,
                  columns: [
                    { headerAr: 'وصف الخدمة / البند', accessor: 'description', align: 'right' },
                    { headerAr: 'الكمية', accessor: (row) => `${row.qty}`, align: 'center' },
                    { headerAr: 'سعر الوحدة', accessor: (row) => `${row.unitPrice.toLocaleString()} ${getCurrencySymbol(selectedInvoice.currency)}`, align: 'right' },
                    { headerAr: 'الإجمالي', accessor: (row) => `${row.total.toLocaleString()} ${getCurrencySymbol(selectedInvoice.currency)}`, align: 'right' }
                  ],
                  data: selectedInvoice.items,
                  summaryItems: [
                    { labelAr: 'المبلغ الخاضع للضريبة', value: `${selectedInvoice.amount.toLocaleString()} ${getCurrencySymbol(selectedInvoice.currency)}` },
                    { labelAr: 'ضريبة القيمة المضافة (14%)', value: `${selectedInvoice.tax.toLocaleString()} ${getCurrencySymbol(selectedInvoice.currency)}` },
                    { labelAr: 'المبلغ الإجمالي الشامل', value: `${selectedInvoice.total.toLocaleString()} ${getCurrencySymbol(selectedInvoice.currency)}`, highlight: true }
                  ]
                }}
              />
              <button 
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" /> طباعة الفاتورة
              </button>
              <button className="px-4 py-2 bg-[#0F4C81] text-white rounded-xl hover:bg-[#0c3d67] font-bold text-xs flex items-center gap-1 cursor-pointer">
                <Mail className="w-4 h-4" /> إرسال للعميل (Email)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 dir-rtl">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg">تحرير فاتورة ضريبية إلكترونية</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 rounded-lg p-1">×</button>
            </div>

            {/* OCR Banner */}
            <div className="bg-sky-50 border-b border-sky-100 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-600 text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-900">تعبئة تلقائية عبر الكاميرا والذكاء الاصطناعي (OCR)</p>
                  <p className="text-[11px] text-sky-700">التقاط صورة الفاتورة الورقية لاستخراج البيانات والبنود فورياً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setScannerMode('create_autofill');
                  setIsScannerOpen(true);
                }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>مسح ضوئي الآن</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم الفاتورة الإلكترونية التلقائي</label>
                <input 
                  type="text" 
                  required
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم العميل المستأجر للأوناش</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: شركة المقاولون العرب"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ الإصدار</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ الاستحقاق (Due Date)</label>
                  <input 
                    type="date" 
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono"
                  />
                </div>
              </div>

              {/* Multi-currency support controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#0F4C81]" />
                    <span>عملة الفاتورة</span>
                  </label>
                  <select
                    value={invoiceCurrency}
                    onChange={(e) => setInvoiceCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-bold"
                  >
                    <option value="EGP">EGP - الجنيه المصري</option>
                    <option value="USD">USD - الدولار الأمريكي</option>
                    <option value="EUR">EUR - اليورو</option>
                    <option value="SAR">SAR - الريال السعودي</option>
                    <option value="AED">AED - الدرهم الإماراتي</option>
                  </select>
                </div>

                {invoiceCurrency !== 'EGP' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7941D]" />
                      <span>سعر الصرف المعتمد للفاتورة (مقابل ج.م)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      min="0.1"
                      value={invoiceExchangeRate}
                      onChange={(e) => setInvoiceExchangeRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Scanned Attachments Preview inside form */}
              {scannedAttachments.length > 0 && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-sky-900 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>المستندات الورقية الممسوحة ضوئياً والمرفقة بهذه الفاتورة:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scannedAttachments.map((att) => (
                      <div key={att.id} className="bg-white px-2.5 py-1.5 rounded-lg border border-sky-200 text-xs flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{att.fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items row editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs">تفاصيل الخدمات والبنود الضريبية</h4>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-xs text-[#F7941D] font-bold hover:underline cursor-pointer"
                  >
                    + إضافة بند للخدمة
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="col-span-6">
                      <input 
                        type="text" 
                        required
                        placeholder="وصف خدمة تأجير الونش والموقع..." 
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="الكمية" 
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(index, 'qty', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="number" 
                        required
                        min="0"
                        placeholder="السعر" 
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-left font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-rose-500 font-bold text-lg"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary box */}
              <div className="border border-slate-100 rounded-xl p-4 space-y-2 bg-slate-50 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>المبلغ الخاضع للضريبة:</span>
                  <span className="font-bold">{amount.toLocaleString()} {getCurrencySymbol(invoiceCurrency)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة (١٤٪):</span>
                  <span className="font-bold">{tax.toLocaleString()} {getCurrencySymbol(invoiceCurrency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#0F4C81] font-black border-t border-slate-200 pt-2">
                  <span>الإجمالي الشامل بالعملة:</span>
                  <span>{total.toLocaleString()} {getCurrencySymbol(invoiceCurrency)}</span>
                </div>
                {invoiceCurrency !== 'EGP' && (
                  <div className="flex items-center justify-between text-xs text-indigo-900 font-bold pt-1 border-t border-indigo-100">
                    <span>الإجمالي بالجنيه المصري (EGP):</span>
                    <span className="font-mono">{(total * invoiceExchangeRate).toLocaleString()} ج.م</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#0F4C81] text-white rounded-xl hover:bg-[#0c3d67] font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> حفظ وإصدار الفاتورة
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
        documentType="invoice"
        title={`مسح ضوئي لملحق الفاتورة - ${selectedInvoiceForAttachment?.invoiceNo || invoiceNo}`}
        onScanComplete={handleScanCompleted}
      />

      {/* Document Attachments View/Manage Modal */}
      <DocumentAttachmentsModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => {
          setIsAttachmentsModalOpen(false);
          setSelectedInvoiceForViewAttachments(null);
        }}
        recordTitle={selectedInvoiceForViewAttachments ? `فاتورة رقم ${selectedInvoiceForViewAttachments.invoiceNo} - ${selectedInvoiceForViewAttachments.customerName}` : ''}
        attachments={selectedInvoiceForViewAttachments?.attachments || []}
        onDeleteAttachment={(attId) => {
          if (selectedInvoiceForViewAttachments) {
            handleDeleteAttachmentFromInvoice(selectedInvoiceForViewAttachments, attId);
          }
        }}
        onAddScanClick={() => {
          if (selectedInvoiceForViewAttachments) {
            setSelectedInvoiceForAttachment(selectedInvoiceForViewAttachments);
            setScannerMode('attach_existing');
            setIsAttachmentsModalOpen(false);
            setIsScannerOpen(true);
          }
        }}
      />
    </div>
  );
}
