import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '../types';
import { initialInvoices } from '../mockData';
import { 
  Plus, Search, Eye, FileText, QrCode, Printer, Mail, Download, AlertTriangle,
  Coins, RefreshCw, Save, ArrowLeftRight, Check, Globe, HelpCircle, Settings
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

export default function SmartInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
      customerName,
      amount,
      tax,
      total,
      status: 'unpaid',
      items,
      currency: invoiceCurrency,
      exchangeRate: invoiceExchangeRate
    };

    setInvoices([newInvoice, ...invoices]);
    setShowAddForm(false);
    // Reset Form
    setInvoiceNo(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
    setCustomerName('');
    setInvoiceCurrency('EGP');
    setInvoiceExchangeRate(1.0);
    setItems([{ id: '1', description: 'إيجار ونش تلسكوبي ليبهير LTM 1100 بموقع الإسكندرية', qty: 1, unitPrice: 200000, total: 200000 }]);
  };

  const filtered = invoices.filter(inv => 
    inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 dir-rtl text-right font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">نظام الفواتير الذكية الرقمية (E-Invoicing)</h1>
          <p className="text-slate-500 mt-1 text-sm">إصدار ومتابعة الفاتورة الإلكترونية المعتمدة لشركة إيجيبت كرينز متوافقة مع مصلحة الضرائب المصرية</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-[#0F4C81] text-white font-bold text-sm rounded-xl hover:bg-[#0c3d67] transition-colors flex items-center gap-1.5 self-start"
        >
          <Plus className="w-5 h-5" /> إنشاء فاتورة إلكترونية
        </button>
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

      {/* Filter panel & Export PDF Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:flex-1">
          <input 
            type="text" 
            placeholder="البحث برقم الفاتورة، أو اسم الشركة المستأجرة..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <ExportPDFButton
          variant="primary"
          titleAr="تصدير جدول الفواتير PDF 📄"
          titleEn="Export Invoices Table PDF 📄"
          exportOptions={{
            titleAr: 'سجل الفواتير الضريبية الإلكترونية المعتمدة',
            titleEn: 'Approved E-Invoices Tax Register',
            filename: 'invoices_register_report',
            columns: [
              { headerAr: 'رقم الفاتورة', accessor: 'invoiceNo', align: 'right' },
              { headerAr: 'العميل', accessor: 'customerName', align: 'right' },
              { headerAr: 'التاريخ', accessor: (row) => new Date(row.date).toLocaleDateString('ar-EG'), align: 'right' },
              { headerAr: 'المبلغ الأساسي', accessor: (row) => `${row.amount.toLocaleString()} ${getCurrencySymbol(row.currency)}`, align: 'right' },
              { headerAr: 'الضريبة (14%)', accessor: (row) => `${row.tax.toLocaleString()} ${getCurrencySymbol(row.currency)}`, align: 'right' },
              { headerAr: 'الإجمالي الشامل', accessor: (row) => `${row.total.toLocaleString()} ${getCurrencySymbol(row.currency)}`, align: 'right' },
              { headerAr: 'حالة السداد', accessor: (row) => row.status === 'paid' ? 'مسددة بالكامل' : row.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة', align: 'right' }
            ],
            data: filtered,
            summaryItems: [
              { labelAr: 'إجمالي الفواتير المعروضة', value: `${filtered.length} فاتورة`, highlight: true },
              { labelAr: 'إجمالي المبالغ', value: `${filtered.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()} ج.م` }
            ]
          }}
        />
      </div>

      {/* Invoices Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-700">رقم الفاتورة</th>
                <th className="px-6 py-4 font-bold text-slate-700">العميل</th>
                <th className="px-6 py-4 font-bold text-slate-700">التاريخ</th>
                <th className="px-6 py-4 font-bold text-slate-700">القيمة الخاضعة للضريبة</th>
                <th className="px-6 py-4 font-bold text-slate-700">ضريبة القيمة المضافة (١٤٪)</th>
                <th className="px-6 py-4 font-bold text-slate-700">الإجمالي الشامل</th>
                <th className="px-6 py-4 font-bold text-slate-700">الحالة</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-[#0F4C81]">{invoice.invoiceNo}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{invoice.customerName}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(invoice.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">
                    <div>{invoice.amount.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoice.currency)}</div>
                    {invoice.currency && invoice.currency !== 'EGP' && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        يعادل {(invoice.amount * (invoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-500">
                    <div>{invoice.tax.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoice.currency)}</div>
                    {invoice.currency && invoice.currency !== 'EGP' && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        يعادل {(invoice.tax * (invoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-[#0F4C81]">
                    <div>{invoice.total.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoice.currency)}</div>
                    {invoice.currency && invoice.currency !== 'EGP' && (
                      <div className="text-[10px] text-indigo-600 font-mono font-bold mt-0.5">
                        يعادل {(invoice.total * (invoice.exchangeRate || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                      invoice.status === 'partially_paid' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {invoice.status === 'paid' ? 'مسددة بالكامل' :
                       invoice.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-1.5 bg-blue-50 text-[#0F4C81] hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-lg">معاينة الفاتورة الضريبية الإلكترونية</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-white hover:bg-white/10 rounded-lg p-1 font-bold">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Invoice Brand header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-lg">شركة إيجيبت كرينز لخدمات الرفع الثقيل</h4>
                  <p className="text-xs text-slate-400">سجل تجاري: ٢٣٤٨٢ | رقم ضريبي موحد: ٣٠٠١٢٣٤٥٦٧٠٠٠٠٣</p>
                  <p className="text-xs text-slate-400">العنوان: الدقي، الجيزة، مصر</p>
                </div>
                {/* QR code verification */}
                <div className="flex flex-col items-center gap-1 p-2 border rounded-xl bg-slate-50">
                  <QrCode className="w-16 h-16 text-slate-800" />
                  <span className="text-[9px] text-slate-500 font-bold">مصلحة الضرائب المصرية</span>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-400 block mb-1">العميل والمستفيد:</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedInvoice.customerName}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-left">
                  <span className="text-slate-400 block mb-1">رقم الفاتورة والتاريخ:</span>
                  <span className="text-slate-800 font-mono font-bold block">{selectedInvoice.invoiceNo}</span>
                  <span className="text-slate-500 font-medium block mt-1">{selectedInvoice.date}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50">
                    <tr className="border-b">
                      <th className="p-3 text-slate-700 font-bold">وصف الخدمة / البند</th>
                      <th className="p-3 text-slate-700 font-bold text-center w-20">الكمية</th>
                      <th className="p-3 text-slate-700 font-bold text-center w-32">سعر الوحدة</th>
                      <th className="p-3 text-slate-700 font-bold text-center w-32">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map(item => (
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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-right flex flex-col max-h-[90vh]">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg">تحرير فاتورة ضريبية إلكترونية</h3>
              <button onClick={() => setShowAddForm(false)} className="text-white hover:bg-white/10 rounded-lg p-1">×</button>
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

              {/* Items row editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs">تفاصيل الخدمات والبنود الضريبية</h4>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-xs text-[#F7941D] font-bold hover:underline"
                  >
                    + إضافة بند للخدمة
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="md:col-span-6">
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">وصف الخدمة</label>
                        <input 
                          type="text" 
                          required
                          value={item.description}
                          placeholder="مثال: إيجار ونش تلسكوبي"
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">الكمية</label>
                        <input 
                          type="number" 
                          required
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">سعر الوحدة ({getCurrencySymbol(invoiceCurrency)})</label>
                        <input 
                          type="number" 
                          required
                          min={0}
                          value={item.unitPrice || ''}
                          placeholder="0"
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center font-mono"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded disabled:opacity-30 mb-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automatic pricing calculations summary */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-bold text-[#0F4C81] border-b pb-1 mb-1">المجموع بالعملة المختارة ({invoiceCurrency}):</h5>
                  <div className="flex items-center justify-between">
                    <span>القيمة الخاضعة للضريبة:</span>
                    <span className="font-bold text-slate-700">{amount.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoiceCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ضريبة القيمة المضافة المصرية (١٤٪):</span>
                    <span className="font-bold text-slate-700">{tax.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoiceCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-sm font-black text-[#0F4C81]">
                    <span>الإجمالي الشامل:</span>
                    <span>{total.toLocaleString(undefined, {maximumFractionDigits: 2})} {getCurrencySymbol(invoiceCurrency)}</span>
                  </div>
                </div>

                {invoiceCurrency !== 'EGP' && (
                  <div className="space-y-2 border-r pr-4 border-slate-200">
                    <h5 className="font-bold text-indigo-700 border-b pb-1 mb-1">المعادل بالجنيه المصري لمصلحة الضرائب:</h5>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>القيمة الخاضعة للضريبة:</span>
                      <span className="font-bold">{(amount * invoiceExchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>ضريبة القيمة المضافة (١٤٪):</span>
                      <span className="font-bold">{(tax * invoiceExchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-sm font-black text-indigo-600">
                      <span>الإجمالي الشامل (EGP):</span>
                      <span>{(total * invoiceExchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 flex-shrink-0 justify-end">
                <button 
                  type="submit"
                  className="py-2.5 px-6 bg-[#0F4C81] text-white text-sm font-bold rounded-xl hover:bg-[#0c3d67] transition-colors"
                >
                  إصدار الفاتورة المعتمدة
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
