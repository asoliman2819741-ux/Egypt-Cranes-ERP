import React, { useState, useEffect } from 'react';
import { PartnerAccount, PartnerTransaction, User } from '../types';
import { 
  Users, UserCheck, Plus, Search, Filter, Phone, Mail, MapPin, 
  ArrowUpRight, ArrowDownLeft, FileText, Download, Printer, 
  Coins, Check, RefreshCw, Layers, ShieldCheck, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExportPDFButton from '../components/ExportPDFButton';

interface PartnersAccountsProps {
  currentUser: User;
  onAddNotification?: (msg: { title: string; message: string; category: 'alert' | 'task' | 'reply' | 'order' }) => void;
}

// Initial Partners
const initialPartners: PartnerAccount[] = [
  { id: 'p1', name: 'شركة المقاولون العرب (عثمان أحمد عثمان)', type: 'customer', phone: '01001234567', email: 'arab.contractors@gmail.com', balance: 350000, taxNumber: '100-245-812', commercialRegister: 'CR-89412', address: 'شارع عدلي يكن، القاهرة' },
  { id: 'p2', name: 'شركة أوراسكوم للإنشاءات', type: 'customer', phone: '01229876543', email: 'info@orascom.com', balance: 1200000, taxNumber: '210-983-512', commercialRegister: 'CR-32145', address: 'برج النيل الإداري، جاردن سيتي، القاهرة' },
  { id: 'p3', name: 'شركة السويدي إلكتريك', type: 'customer', phone: '01115554433', email: 'egypt@elsewedy.com', balance: -150000, taxNumber: '341-902-124', commercialRegister: 'CR-65412', address: 'المنطقة الصناعية الخامسة، السادس من أكتوبر' },
  { id: 'p4', name: 'الشركة المتحدة لقطع الغيار والمحركات', type: 'supplier', phone: '01552221100', email: 'united.parts@supplier.com', balance: -240000, taxNumber: '445-120-998', commercialRegister: 'CR-90412', address: 'السبتية، وسط البلد، القاهرة' },
  { id: 'p5', name: 'الشركة العامة للبترول ومصر للبترول', type: 'supplier', phone: '01009998877', email: 'gpc.fuel@egypt.gov.eg', balance: -85000, taxNumber: '500-112-402', commercialRegister: 'CR-11024', address: 'ميدان التحرير، القاهرة' },
];

// Initial Transactions (Statement details)
const initialPartnerTransactions: PartnerTransaction[] = [
  { id: 'pt1', partnerId: 'p1', date: '2026-07-01', type: 'invoice', reference: 'INV-2026-101', debit: 450000, credit: 0, runningBalance: 450000, description: 'فاتورة مبيعات رقم INV-2026-101 - إيجار ونش ديمباج ٢٥٠ طن بقيمة 450,000 ج.م' },
  { id: 'pt2', partnerId: 'p1', date: '2026-07-05', type: 'payment', reference: 'REC-78912', debit: 0, credit: 100000, runningBalance: 350000, description: 'سند قبض نقدي دفعة أولى من الحساب' },
  
  { id: 'pt3', partnerId: 'p2', date: '2026-07-04', type: 'invoice', reference: 'INV-2026-102', debit: 1200000, credit: 0, runningBalance: 1200000, description: 'فاتورة مبيعات رقم INV-2026-102 - دفعة مقدمة بموجب العقد لنش LR 1600' },
  
  { id: 'pt4', partnerId: 'p3', date: '2026-07-01', type: 'payment', reference: 'REC-32145', debit: 0, credit: 150000, runningBalance: -150000, description: 'دفعة مقدمة من الحساب لتأمين نقل توربينات الرياح بخليج السويس' },

  { id: 'pt5', partnerId: 'p4', date: '2026-07-02', type: 'invoice', reference: 'SUP-INV-9901', debit: 0, credit: 300000, runningBalance: -300000, description: 'فاتورة توريد قطع غيار هيدروليكية وفلاتر سولار لونش ديمباج' },
  { id: 'pt6', partnerId: 'p4', date: '2026-07-08', type: 'payment', reference: 'PAY-88123', debit: 60000, credit: 0, runningBalance: -240000, description: 'سداد دفعة نقدية بموجب شيك أو تحويل مصرفي' },

  { id: 'pt7', partnerId: 'p5', date: '2026-07-03', type: 'invoice', reference: 'SUP-INV-8120', debit: 0, credit: 85000, runningBalance: -85000, description: 'فاتورة توريد سولار تشغيل أوناش وسيارات بورشة الجيزة' },
];

export default function PartnersAccounts({ currentUser, onAddNotification }: PartnersAccountsProps) {
  // Persistence State
  const [partners, setPartners] = useState<PartnerAccount[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_partners');
    return saved ? JSON.parse(saved) : initialPartners;
  });

  const [transactions, setTransactions] = useState<PartnerTransaction[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_partner_txs');
    return saved ? JSON.parse(saved) : initialPartnerTransactions;
  });

  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  useEffect(() => {
    const savedLang = localStorage.getItem('egypt_cranes_lang');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLang(savedLang);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('egypt_cranes_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('egypt_cranes_partner_txs', JSON.stringify(transactions));
  }, [transactions]);

  // UI States
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || '');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New Partner Form
  const [newPartner, setNewPartner] = useState({
    name: '',
    type: 'customer' as 'customer' | 'supplier',
    phone: '',
    email: '',
    taxNumber: '',
    commercialRegister: '',
    address: ''
  });

  // Payment/Receipt Form
  const [paymentForm, setPaymentForm] = useState({
    type: 'receipt' as 'receipt' | 'payment', // receipt = قبض (from customer), payment = صرف (to supplier)
    amount: '',
    reference: '',
    description: ''
  });

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  // Filter partners
  const filteredPartners = partners.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.taxNumber && p.taxNumber.includes(searchTerm));
    return matchesType && matchesSearch;
  });

  // Partner Statement of Account Ledger
  const partnerStatement = transactions
    .filter(t => t.partnerId === selectedPartnerId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Handle Add Partner
  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const partnerId = `p-${Date.now()}`;
    const record: PartnerAccount = {
      id: partnerId,
      name: newPartner.name,
      type: newPartner.type,
      phone: newPartner.phone,
      email: newPartner.email,
      balance: 0,
      taxNumber: newPartner.taxNumber,
      commercialRegister: newPartner.commercialRegister,
      address: newPartner.address
    };

    setPartners([...partners, record]);
    setSelectedPartnerId(partnerId);
    setShowAddPartnerModal(false);

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'إضافة شريك نجاح جديد بالمنظومة' : 'New Partner Registered',
        message: lang === 'ar'
          ? `تم تسجيل ${newPartner.type === 'customer' ? 'العميل' : 'المورد'} الجديد (${newPartner.name}) في سجلات الحسابات المعتمدة`
          : `Registered new ${newPartner.type} (${newPartner.name}) in authorized account ledger`,
        category: 'reply'
      });
    }

    // Reset Form
    setNewPartner({
      name: '',
      type: 'customer',
      phone: '',
      email: '',
      taxNumber: '',
      commercialRegister: '',
      address: ''
    });
  };

  // Handle Recording Payment / Receipt against statement
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentForm.amount);
    if (isNaN(amountNum) || amountNum <= 0 || !selectedPartner) return;

    const refDoc = paymentForm.reference || `REF-${Date.now().toString().slice(-5)}`;
    
    // In accounting:
    // For Customer (Outstanding Balance is positive i.e. Debit):
    // - Receipt (قبض) reduces balance (Credit)
    // - Payment (صرف/إرجاع) increases balance (Debit)
    // For Supplier (Outstanding Balance is negative i.e. Credit):
    // - Payment (دفع) reduces liability (Debit, increases outstanding balance towards positive/closer to 0)
    // - Bill/Invoice (فاتورة) increases liability (Credit, decreases balance)

    const isReceipt = paymentForm.type === 'receipt';
    const debit = isReceipt ? 0 : amountNum;
    const credit = isReceipt ? amountNum : 0;

    // Balance impact
    // If we receive money from customer: credit, balance decreases
    // If we pay supplier: debit, liability decreases, balance increases closer to 0
    const balanceImpact = debit - credit;
    const newBalance = selectedPartner.balance + balanceImpact;

    const txRecord: PartnerTransaction = {
      id: `pt-${Date.now()}`,
      partnerId: selectedPartner.id,
      date: new Date().toISOString().split('T')[0],
      type: isReceipt ? 'payment' : 'payment',
      reference: refDoc,
      debit,
      credit,
      runningBalance: newBalance,
      description: paymentForm.description || (isReceipt ? 'مقبوضات نقدية من الحساب' : 'دفعة مدفوعة من الحساب')
    };

    // Update partner balance
    const updatedPartners = partners.map(p => {
      if (p.id === selectedPartner.id) {
        return {
          ...p,
          balance: newBalance
        };
      }
      return p;
    });

    setTransactions([...transactions, txRecord]);
    setPartners(updatedPartners);
    setShowPaymentModal(false);

    // Sync vault or treasury automatically in background for realism!
    const savedVaults = localStorage.getItem('egypt_cranes_vaults');
    if (savedVaults) {
      const parsedVaults = JSON.parse(savedVaults);
      if (parsedVaults[0]) {
        // adjust main vault balance
        parsedVaults[0].balance += (isReceipt ? amountNum : -amountNum);
        localStorage.setItem('egypt_cranes_vaults', JSON.stringify(parsedVaults));

        // Append to treasury transaction ledger as well!
        const savedTxs = localStorage.getItem('egypt_cranes_treasury_txs');
        const parsedTxs = savedTxs ? JSON.parse(savedTxs) : [];
        const autoDoc = isReceipt ? `TR-REC-${refDoc}` : `TR-PAY-${refDoc}`;
        const autoVaultTx = {
          id: `t-auto-p-${Date.now()}`,
          docNo: autoDoc,
          date: new Date().toISOString().split('T')[0],
          type: isReceipt ? 'cash_in' : 'cash_out',
          amount: amountNum,
          vaultId: parsedVaults[0].id,
          vaultName: parsedVaults[0].nameAr,
          recipientOrPayer: selectedPartner.name,
          description: paymentForm.description || (isReceipt ? `تحصيل دفعة من حساب العميل` : `سداد دفعة لحساب المورد`),
          category: selectedPartner.type === 'customer' ? 'customer_payment' : 'supplier_payment'
        };
        localStorage.setItem('egypt_cranes_treasury_txs', JSON.stringify([autoVaultTx, ...parsedTxs]));
      }
    }

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'دفعة مالية مقيدة بالحساب' : 'Payment Posted to Account',
        message: lang === 'ar'
          ? `تم قيد مبلغ ${amountNum.toLocaleString()} ج.م في حساب شريك الاستثمار (${selectedPartner.name}) بنجاح`
          : `Posted EGP ${amountNum.toLocaleString()} successfully to ${selectedPartner.name}'s account statement`,
        category: 'order'
      });
    }

    // Reset Form
    setPaymentForm({
      type: 'receipt',
      amount: '',
      reference: '',
      description: ''
    });
  };

  const getPartnerTypeBadge = (type: 'customer' | 'supplier') => {
    return type === 'customer' ? (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100">
        {lang === 'ar' ? 'عميل 👤' : 'Customer 👤'}
      </span>
    ) : (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-100">
        {lang === 'ar' ? 'مورد 🏭' : 'Supplier 🏭'}
      </span>
    );
  };

  const getBalanceStyle = (balance: number) => {
    if (balance > 0) return 'text-emerald-700 font-extrabold'; // customer owes us
    if (balance < 0) return 'text-rose-700 font-extrabold'; // we owe supplier
    return 'text-slate-500 font-medium';
  };

  return (
    <div className="space-y-6 font-sans text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6.5 h-6.5 text-[#0F4C81]" />
            <span>{lang === 'ar' ? 'إدارة العملاء والموردين وكشوف الحسابات المعتمدة' : 'Customers & Suppliers Account Statement Management'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' 
              ? 'مراقبة أرصدة الشركاء التجاريين، سحب كشوف الحسابات المساعدة، وتسجيل عمليات الدفع والتحصيل من الدفاتر الموحدة'
              : 'Track partner balances, extract ledgers & subsidiary statements, post payments and receipts instantly.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportPDFButton
            variant="outline"
            titleAr="تصدير سجل الشركاء PDF 📄"
            titleEn="Export Partners Register PDF"
            exportOptions={{
              titleAr: 'سجل الشركاء التجاريين (العملاء والموردين) - إيجيبت كرينز',
              titleEn: 'Commercial Partners Register - Egypt Cranes',
              subtitleAr: `تقرير إجمالي لأرصدة وبيانات (${filteredPartners.length}) شريك تجاري معتمد`,
              filename: 'partners_register',
              columns: [
                { headerAr: 'اسم الشريك / المؤسسة', accessor: 'name', align: 'right' },
                { headerAr: 'النوع', accessor: (r: any) => r.type === 'customer' ? 'عميل' : 'مورد', align: 'center', width: '90px' },
                { headerAr: 'الهاتف', accessor: 'phone', align: 'center', width: '120px' },
                { headerAr: 'السجل التجاري', accessor: (r: any) => r.commercialRegister || '-', align: 'center', width: '120px' },
                { headerAr: 'الرصيد الدفتري (ج.م)', accessor: (r: any) => `${Number(r.balance).toLocaleString()} ج.م`, align: 'left', width: '150px' }
              ],
              data: filteredPartners,
              summaryItems: [
                { labelAr: 'إجمالي الشركاء', value: `${filteredPartners.length} شريك` },
                { labelAr: 'إجمالي مستحقات العملاء (لنا)', value: `${filteredPartners.filter(p => p.type === 'customer' && p.balance > 0).reduce((a, b) => a + b.balance, 0).toLocaleString()} ج.م`, highlight: true },
                { labelAr: 'إجمالي مستحقات الموردين (علينا)', value: `${Math.abs(filteredPartners.filter(p => p.type === 'supplier' && p.balance < 0).reduce((a, b) => a + b.balance, 0)).toLocaleString()} ج.م` }
              ]
            }}
          />
          <button
            onClick={() => setShowAddPartnerModal(true)}
            className="px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تسجيل شريك تجاري جديد (عميل / مورد)' : 'Register New Commercial Partner'}</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD SPLIT-PANE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PARTNER LISTING PANEL */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden flex flex-col max-h-[700px]">
          {/* Header & Filter Controls */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
            <h2 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#F7941D]" />
              <span>دليل الشركاء التجاريين المسجلين:</span>
            </h2>

            {/* Type toggles */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              {[
                { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
                { id: 'customer', label: lang === 'ar' ? 'العملاء' : 'Customers' },
                { id: 'supplier', label: lang === 'ar' ? 'الموردين' : 'Suppliers' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition-all ${
                    filterType === tab.id 
                      ? 'bg-[#0F4C81] text-white shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute right-3 top-2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم الشريك أو رقم الهاتف...' : 'Search by partner name or phone...'}
                className="w-full pr-8 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
            {filteredPartners.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-extrabold text-xs">
                {lang === 'ar' ? 'لا يوجد شركاء يطابقون البحث حالياً' : 'No commercial partners found'}
              </div>
            ) : (
              filteredPartners.map(partner => (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartnerId(partner.id)}
                  className={`p-3 rounded-xl transition-all duration-200 cursor-pointer border flex flex-col gap-2 ${
                    selectedPartnerId === partner.id 
                      ? 'bg-slate-50 border-indigo-200 shadow-3xs ring-1 ring-[#0F4C81]/15' 
                      : 'bg-white border-transparent hover:bg-slate-50/55'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-xs font-black text-slate-800 leading-tight">{partner.name}</h3>
                    {getPartnerTypeBadge(partner.type)}
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>الهاتف: {partner.phone}</span>
                    <span className="font-mono">{partner.taxNumber ? `ضريبي: ${partner.taxNumber}` : ''}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100/50 pt-2 mt-1">
                    <span className="text-[10px] font-extrabold text-slate-400">{lang === 'ar' ? 'الرصيد القائم:' : 'Outstanding Balance:'}</span>
                    <span className={`text-xs font-mono font-black ${getBalanceStyle(partner.balance)}`}>
                      {partner.balance.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: STATEMENT OF ACCOUNTS & POSTING CONTROLS */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {selectedPartner ? (
            <>
              {/* Partner Information Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-md font-black text-slate-900">{selectedPartner.name}</h2>
                      {getPartnerTypeBadge(selectedPartner.type)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedPartner.address || 'القاهرة، جمهورية مصر العربية'}</span>
                    </p>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPaymentForm({
                          ...paymentForm,
                          type: selectedPartner.type === 'customer' ? 'receipt' : 'payment'
                        });
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Coins className="w-4 h-4" />
                      <span>
                        {selectedPartner.type === 'customer' ? 'سند تحصيل قبض 📥' : 'سند دفع صرف 📤'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block">البريد الإلكتروني</span>
                    <span className="text-xs font-extrabold text-slate-800 break-all mt-1 block leading-tight">{selectedPartner.email}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block">السجل التجاري</span>
                    <span className="text-xs font-mono font-extrabold text-slate-800 mt-1 block">{selectedPartner.commercialRegister || 'غير متوفر'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block">الرقم الضريبي الموحد</span>
                    <span className="text-xs font-mono font-extrabold text-slate-800 mt-1 block">{selectedPartner.taxNumber || 'غير متوفر'}</span>
                  </div>

                  <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 block">الرصيد الإجمالي القائم</span>
                    <span className={`text-sm font-mono font-black mt-2 ${
                      selectedPartner.balance > 0 ? 'text-emerald-400' : selectedPartner.balance < 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {selectedPartner.balance.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* STATEMENT OF ACCOUNT LEDGER TABLE */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden flex-1">
                {/* Header Controls */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0F4C81]" />
                    <span>كشف حساب الأستاذ المساعد التفصيلي (Ledger Account Statement):</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <ExportPDFButton
                      size="sm"
                      variant="outline"
                      titleAr="طباعة كشف الحساب PDF 📄"
                      titleEn="Print Statement PDF"
                      exportOptions={{
                        titleAr: `كشف حساب أستاذ مساعد - ${selectedPartner.name}`,
                        titleEn: `Subsidiary Ledger Account Statement - ${selectedPartner.name}`,
                        subtitleAr: `نوع الشريك: ${selectedPartner.type === 'customer' ? 'عميل' : 'مورد'} • السجل: ${selectedPartner.commercialRegister || '-'} • الضريبي: ${selectedPartner.taxNumber || '-'}`,
                        filename: `statement_${selectedPartner.id}_${selectedPartner.name.replace(/\s+/g, '_')}`,
                        columns: [
                          { headerAr: 'تاريخ الحركة', accessor: 'date', align: 'center', width: '90px' },
                          { headerAr: 'المرجع والنوع', accessor: 'reference', align: 'center', width: '110px' },
                          { headerAr: 'البيان والتفاصيل', accessor: 'description', align: 'right' },
                          { headerAr: 'مدين (+)', accessor: (r: any) => r.debit > 0 ? `${Number(r.debit).toLocaleString()} ج.م` : '-', align: 'left', width: '120px' },
                          { headerAr: 'دائن (-)', accessor: (r: any) => r.credit > 0 ? `${Number(r.credit).toLocaleString()} ج.م` : '-', align: 'left', width: '120px' },
                          { headerAr: 'الرصيد التراكمي', accessor: (r: any) => `${Number(r.runningBalance).toLocaleString()} ج.م`, align: 'left', width: '130px' }
                        ],
                        data: partnerStatement,
                        summaryItems: [
                          { labelAr: 'إجمالي الحركات المدينة', value: `${partnerStatement.reduce((a, b) => a + b.debit, 0).toLocaleString()} ج.م` },
                          { labelAr: 'إجمالي الحركات الدائنة', value: `${partnerStatement.reduce((a, b) => a + b.credit, 0).toLocaleString()} ج.م` },
                          { labelAr: 'الرصيد النهائي المستحق', value: `${selectedPartner.balance.toLocaleString()} ج.م`, highlight: true }
                        ]
                      }}
                    />
                    <button
                      onClick={() => alert(lang === 'ar' ? 'تم تنزيل الكشف لـ Excel بنجاح.' : 'Downloaded Excel datasheet successfully.')}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-[10px] font-black cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تحميل ورقة عمل (Excel)</span>
                    </button>
                  </div>
                </div>

                {/* Table Statement */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3">تاريخ الحركة</th>
                        <th className="px-5 py-3">النوع والمرجع</th>
                        <th className="px-5 py-3">مدين (Debit)</th>
                        <th className="px-5 py-3">دائن (Credit)</th>
                        <th className="px-5 py-3">الرصيد الجاري (Balance)</th>
                        <th className="px-5 py-3">شرح وتفصيل الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partnerStatement.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-bold">
                            {lang === 'ar' ? 'لا توجد حركات محاسبية مقيدة بحساب هذا الشريك بعد.' : 'No account transactions recorded for this partner yet.'}
                          </td>
                        </tr>
                      ) : (
                        partnerStatement.map((tx, idx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-slate-500">{tx.date}</td>
                            <td className="px-5 py-3.5 font-bold">
                              <span className="block text-[#0F4C81]">{tx.reference}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-mono">{tx.type}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono font-extrabold text-emerald-600">
                              {tx.debit > 0 ? `+${tx.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-extrabold text-rose-600">
                              {tx.credit > 0 ? `-${tx.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-black text-slate-900">
                              {tx.runningBalance.toLocaleString()} ج.م
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate" title={tx.description}>
                              {tx.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white py-16 px-4 rounded-2xl border border-slate-100 text-center text-slate-400 font-bold shadow-3xs flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-slate-300 mb-2 animate-pulse" />
              <p className="text-sm">يرجى تحديد شريك تجاري من القائمة اليسرى لعرض كشف حسابه وإجراء حركات الدفع والتحصيل.</p>
            </div>
          )}
        </div>
      </div>

      {/* NEW PARTNER MODAL */}
      <AnimatePresence>
        {showAddPartnerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Users className="text-[#0F4C81] w-5 h-5" />
                  <span>تسجيل شريك تجاري جديد</span>
                </h3>
                <button onClick={() => setShowAddPartnerModal(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddPartner} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">نوع الشريك</label>
                    <select
                      value={newPartner.type}
                      onChange={(e) => setNewPartner({ ...newPartner, type: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    >
                      <option value="customer">عميل مبيعات / تأجير أوناش</option>
                      <option value="supplier">مورد قطع غيار / وقود / خدمات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">اسم الشركة / المؤسسة بالكامل</label>
                    <input
                      type="text"
                      required
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      placeholder="اسم المؤسسة التجاري الرسمي..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">رقم الهاتف الجوال</label>
                    <input
                      type="tel"
                      required
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                      placeholder="رقم الهاتف للاتصال والتحصيل..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">البريد الإلكتروني الرسمي</label>
                    <input
                      type="email"
                      required
                      value={newPartner.email}
                      onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                      placeholder="example@partner.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">الرقم الضريبي الموحد</label>
                    <input
                      type="text"
                      value={newPartner.taxNumber}
                      onChange={(e) => setNewPartner({ ...newPartner, taxNumber: e.target.value })}
                      placeholder="رقم البطاقة الضريبية..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">رقم السجل التجاري</label>
                    <input
                      type="text"
                      value={newPartner.commercialRegister}
                      onChange={(e) => setNewPartner({ ...newPartner, commercialRegister: e.target.value })}
                      placeholder="رقم السجل التجاري المصدر..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">العنوان والمقر الرئيسي</label>
                  <input
                    type="text"
                    value={newPartner.address}
                    onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                    placeholder="رقم البناية، اسم الشارع، المدينة، المحافظة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPartnerModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ واعتماد الشريك الجديد</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD PAYMENT/RECEIPT MODAL */}
      <AnimatePresence>
        {showPaymentModal && selectedPartner && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Coins className="text-emerald-600 w-5 h-5" />
                  <span>
                    {selectedPartner.type === 'customer' ? 'تسجيل دفعة قبض / تحصيل من عميل' : 'تسجيل دفعة صرف / دفع لمورد'}
                  </span>
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">الشريك التجاري المستهدف</span>
                    <span className="text-xs font-black text-[#0F4C81] mt-0.5 block">{selectedPartner.name}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block font-bold">الرصيد الحالي القائم</span>
                    <span className="text-xs font-mono font-black text-slate-800 mt-0.5 block">{selectedPartner.balance.toLocaleString()} ج.م</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">نوع السند</label>
                    <select
                      value={paymentForm.type}
                      onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    >
                      {selectedPartner.type === 'customer' ? (
                        <>
                          <option value="receipt">تحصيل نقدية / قبض (Credit) 📥</option>
                          <option value="payment">دفع مرتجع أو خطأ تصفية (Debit) 📤</option>
                        </>
                      ) : (
                        <>
                          <option value="payment">سداد نقدية للمورد / صرف (Debit) 📤</option>
                          <option value="receipt">تحصيل مرتجع من مورد (Credit) 📥</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">المبلغ المالي المعتمد (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">المرجع المصرفي / رقم السند الورقي</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="رقم السند المالي، رقم التحويل، أو شيك رقم..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">البيان والشرح الكامل للقيد</label>
                  <textarea
                    required
                    rows={2}
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    placeholder="مثال: سداد دفعة من كشف حساب المورد بموجب تحويل بنكي على حساب البنك الأهلي..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>قيد واعتماد السند بالحساب</span>
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
