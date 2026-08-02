import React, { useState, useEffect } from 'react';
import { TreasuryTransaction, CheckRecord, User, CostCenter } from '../types';
import { 
  Wallet, Landmark, Plus, Search, Filter, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, AlertTriangle, Clock, XCircle, FileSpreadsheet, RefreshCw,
  Coins, FileText, Check, ShieldCheck, BarChart2, PieChart, TrendingUp, Info, ArrowLeftRight,
  Download, Calendar, Activity, Layers, TrendingDown, Building2, Upload, FileCheck, CheckCheck, Scale, Sparkles,
  Receipt, Briefcase, Percent, SlidersHorizontal, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';

interface TreasuryChecksProps {
  currentUser: User;
  costCenters?: CostCenter[];
  onUpdateCostCenters?: (items: CostCenter[]) => void;
  onAddNotification?: (msg: { title: string; message: string; category: 'alert' | 'task' | 'reply' | 'order' }) => void;
}

export interface BankStatementLine {
  id: string;
  date: string;
  refNo: string;
  description: string;
  deposit: number;
  withdrawal: number;
  bankName: string;
  matchedJournalId?: string;
  matchStatus: 'matched' | 'unmatched' | 'suggested';
  matchType?: 'auto' | 'manual' | 'adjusted';
}

export interface ContractMilestone {
  id: string;
  contractCode: string;
  title: string;
  partnerName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  type: 'inflow' | 'outflow'; // 'inflow' = مستخلص مقبوضات, 'outflow' = التزام صادر
  probability: 'high' | 'medium' | 'low';
  notes?: string;
  status: 'pending' | 'received' | 'paid';
  costCenterName?: string;
}

export interface PendingInvoice {
  id: string;
  invoiceNo: string;
  partnerName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  type: 'receivable' | 'payable'; // 'receivable' = فواتير مستحقة (+), 'payable' = فواتير موردين (-)
  probability: 'high' | 'medium' | 'low';
  notes?: string;
  status: 'unpaid' | 'partially_paid';
  costCenterName?: string;
}

export interface InterTreasuryTransfer {
  id: string;
  transferNo: string;
  date: string;
  fromVaultId: string;
  fromVaultName: string;
  toVaultId: string;
  toVaultName: string;
  amount: number;
  currency: string;
  notes: string;
  referenceVoucher: string;
  createdBy: string;
  journalVoucherNo: string;
  status: 'completed' | 'pending';
}

export interface JournalEntry {
  id: string;
  entryNo: string;
  date: string;
  description: string;
  sourceDocType: 'inter_treasury_transfer' | 'cash_receipt' | 'cash_payment' | 'check';
  sourceDocNo: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  costCenter?: string;
  createdBy: string;
}

// Initial Mock Data
const initialVaults = [
  { id: 'v1', nameAr: 'الخزينة الرئيسية - فرع الجيزة', nameEn: 'Main Treasury - Giza Branch', balance: 1450000, currency: 'EGP', type: 'main', manager: 'أحمد سليمان', code: 'VLT-001', location: 'المقر الرئيسي - الجيزة' },
  { id: 'v2', nameAr: 'خزينة مكتب الدقي الإداري', nameEn: 'Dokki Administrative Office Treasury', balance: 320000, currency: 'EGP', type: 'branch', manager: 'م. شريف عبد الخالق', code: 'VLT-002', location: 'مكتب الدقي الإداري' },
  { id: 'v3', nameAr: 'خزينة موقع العاصمة الإدارية', nameEn: 'New Capital Site Treasury', balance: 185000, currency: 'EGP', type: 'project', manager: 'م. هاني متولي', code: 'VLT-003', location: 'موقع العاصمة الإدارية' },
  { id: 'v4', nameAr: 'خزينة موقع ميناء بورسعيد', nameEn: 'Port Said Port Site Treasury', balance: 410000, currency: 'EGP', type: 'project', manager: 'م. محمود طاهر', code: 'VLT-004', location: 'ميناء شرق بورسعيد' },
  { id: 'v5', nameAr: 'خزينة العهدة والمصاريف النثرية', nameEn: 'Petty Cash & Custody Vault', balance: 95000, currency: 'EGP', type: 'petty_cash', manager: 'أستاذ سامح علي', code: 'VLT-005', location: 'الإدارة المالية' },
  { id: 'v6', nameAr: 'خزينة النقد الأجنبي (دولار أمريكي)', nameEn: 'USD Foreign Currency Vault', balance: 65000, currency: 'USD', type: 'foreign', manager: 'أحمد سليمان', code: 'VLT-006', location: 'المقر الرئيسي - الجيزة' },
];

const initialTransfers: InterTreasuryTransfer[] = [
  {
    id: 'tr-vlt-101',
    transferNo: 'TRF-2026-001',
    date: '2026-07-14',
    fromVaultId: 'v1',
    fromVaultName: 'الخزينة الرئيسية - فرع الجيزة',
    toVaultId: 'v3',
    toVaultName: 'خزينة موقع العاصمة الإدارية',
    amount: 150000,
    currency: 'EGP',
    notes: 'تغذية سريعة لسيولة موقع العاصمة الإدارية لشراء محروقات وصرف حوافز العمال',
    referenceVoucher: 'VCH-TRF-8812',
    createdBy: 'أحمد سليمان (مدير الخزينة)',
    journalVoucherNo: 'JV-2026-0714',
    status: 'completed'
  },
  {
    id: 'tr-vlt-102',
    transferNo: 'TRF-2026-002',
    date: '2026-07-16',
    fromVaultId: 'v1',
    fromVaultName: 'الخزينة الرئيسية - فرع الجيزة',
    toVaultId: 'v5',
    toVaultName: 'خزينة العهدة والمصاريف النثرية',
    amount: 50000,
    currency: 'EGP',
    notes: 'استعاضة عهدة النثريات والإداريات النصف شهرية',
    referenceVoucher: 'VCH-TRF-8819',
    createdBy: 'سامح علي (أمين العهدة)',
    journalVoucherNo: 'JV-2026-0716',
    status: 'completed'
  },
  {
    id: 'tr-vlt-103',
    transferNo: 'TRF-2026-003',
    date: '2026-07-19',
    fromVaultId: 'v2',
    fromVaultName: 'خزينة مكتب الدقي الإداري',
    toVaultId: 'v1',
    toVaultName: 'الخزينة الرئيسية - فرع الجيزة',
    amount: 100000,
    currency: 'EGP',
    notes: 'ترحيل فائض تحصيلات مكتب الدقي إلى الخزينة الرئيسية',
    referenceVoucher: 'VCH-TRF-8825',
    createdBy: 'م. شريف عبد الخالق',
    journalVoucherNo: 'JV-2026-0719',
    status: 'completed'
  }
];

const initialJournalEntries: JournalEntry[] = [
  {
    id: 'jv-101',
    entryNo: 'JV-2026-0714',
    date: '2026-07-14',
    description: 'إثبات تحويل سيولة نقدي بين الخزائن (من الرئيسية إلى موقع العاصمة)',
    sourceDocType: 'inter_treasury_transfer',
    sourceDocNo: 'TRF-2026-001',
    debitAccount: 'حـ/ خزينة موقع العاصمة الإدارية (110103)',
    debitAmount: 150000,
    creditAccount: 'حـ/ الخزينة الرئيسية - الجيزة (110101)',
    creditAmount: 150000,
    costCenter: 'مشروع العاصمة الإدارية الجديدة',
    createdBy: 'أحمد سليمان'
  },
  {
    id: 'jv-102',
    entryNo: 'JV-2026-0716',
    date: '2026-07-16',
    description: 'إثبات استعاضة العهدة النثرية من الخزينة الرئيسية',
    sourceDocType: 'inter_treasury_transfer',
    sourceDocNo: 'TRF-2026-002',
    debitAccount: 'حـ/ خزينة العهدة والمصاريف النثرية (110105)',
    debitAmount: 50000,
    creditAccount: 'حـ/ الخزينة الرئيسية - الجيزة (110101)',
    creditAmount: 50000,
    costCenter: 'الإدارة المالية المركزية',
    createdBy: 'سامح علي'
  },
  {
    id: 'jv-103',
    entryNo: 'JV-2026-0719',
    date: '2026-07-19',
    description: 'إثبات تحويل فائض نقدية مكتب الدقي إلى الخزينة الرئيسية',
    sourceDocType: 'inter_treasury_transfer',
    sourceDocNo: 'TRF-2026-003',
    debitAccount: 'حـ/ الخزينة الرئيسية - الجيزة (110101)',
    debitAmount: 100000,
    creditAccount: 'حـ/ خزينة مكتب الدقي الإداري (110102)',
    creditAmount: 100000,
    costCenter: 'الإدارة العامة',
    createdBy: 'م. شريف عبد الخالق'
  }
];

const initialTransactions: TreasuryTransaction[] = [
  { id: 't1', docNo: 'TR-REC-2026-001', date: '2026-07-10', type: 'cash_in', amount: 150000, vaultId: 'v1', vaultName: 'الخزينة الرئيسية - فرع الجيزة', recipientOrPayer: 'المقاولون العرب', description: 'دفعة نقدية تحت الحساب - عقد ونش ديمباج العاصمة الإدارية', category: 'customer_payment', costCenterId: 'cc1', costCenterName: 'مشروع العاصمة الإدارية الجديدة - الأيقوني' },
  { id: 't2', docNo: 'TR-PAY-2026-001', date: '2026-07-11', type: 'cash_out', amount: 25000, vaultId: 'v1', vaultName: 'الخزينة الرئيسية - فرع الجيزة', recipientOrPayer: 'المهندس ياسر حسن', description: 'سلفة صيانة عاجلة لشراء قطع غيار هيدروليكية', category: 'expense', costCenterId: 'cc3', costCenterName: 'ورشة ومخازن الشركة الرئيسية بالجيزة' },
  { id: 't3', docNo: 'TR-REC-2026-002', date: '2026-07-12', type: 'cash_in', amount: 80000, vaultId: 'v2', vaultName: 'خزينة مكتب الدقي الإداري', recipientOrPayer: 'أوراسكوم للإنشاءات', description: 'تحصيل نقدي قيمة تقديم دراسات مناقصة بورسعيد', category: 'customer_payment', costCenterId: 'cc5', costCenterName: 'مشروع توسعة أنفاق قناة السويس وبورسعيد' },
  { id: 't4', docNo: 'TR-PAY-2026-002', date: '2026-07-13', type: 'cash_out', amount: 12000, vaultId: 'v3', vaultName: 'خزينة موقع العاصمة الإدارية', recipientOrPayer: 'سائق ونش ديمباج', description: 'شراء سولار تشغيل اضطراري بالموقع', category: 'expense', costCenterId: 'cc1', costCenterName: 'مشروع العاصمة الإدارية الجديدة - الأيقوني' },
];

const initialChecks: CheckRecord[] = [
  { id: 'chk1', checkNo: 'PDC-7821459', bankName: 'البنك الأهلي المصري', dueDate: '2026-07-26', amount: 450000, type: 'received', partnerName: 'شركة المقاولون العرب', status: 'portfolio', notes: 'شيك آجل سداد مستخلص شهر يوليو', costCenterId: 'cc1', costCenterName: 'مشروع العاصمة الإدارية الجديدة - الأيقوني', issueDate: '2026-06-15', accountNo: 'EG12000200150009821', autoCollect: true, targetVaultId: 'v1', targetVaultName: 'الخزينة الرئيسية - فرع الجيزة', drawerName: 'شركة المقاولون العرب', beneficiaryName: 'شركة مصر للأوناش' },
  { id: 'chk2', checkNo: 'PDC-9014523', bankName: 'بنك مصر', dueDate: '2026-07-27', amount: 120000, type: 'issued', partnerName: 'الشركة المتحدة للمعدات والقطع الغيار', status: 'portfolio', notes: 'شيك صادر آجل سداد توريد فلاتر', costCenterId: 'cc3', costCenterName: 'ورشة ومخازن الشركة الرئيسية بالجيزة', issueDate: '2026-06-20', accountNo: 'EG99000100223001145', autoCollect: true, targetVaultId: 'v1', targetVaultName: 'الخزينة الرئيسية - فرع الجيزة', drawerName: 'شركة مصر للأوناش', beneficiaryName: 'الشركة المتحدة للمعدات' },
  { id: 'chk3', checkNo: 'PDC-6541289', bankName: 'البنك التجاري الدولي CIB', dueDate: '2026-07-25', amount: 750000, type: 'received', partnerName: 'شركة أوراسكوم للإنشاءات', status: 'deposited', notes: 'دفعة تعاقد ونش جنزير بورسعيد - تستحق اليوم', costCenterId: 'cc5', costCenterName: 'مشروع توسعة أنفاق قناة السويس وبورسعيد', issueDate: '2026-05-10', accountNo: 'EG45000300112233445', autoCollect: true, targetVaultId: 'v2', targetVaultName: 'خزينة مكتب الدقي الإداري', drawerName: 'شركة أوراسكوم للإنشاءات', beneficiaryName: 'شركة مصر للأوناش' },
  { id: 'chk4', checkNo: 'CK-3214590', bankName: 'بنك القاهرة', dueDate: '2026-07-05', amount: 85000, type: 'issued', partnerName: 'مصر للبترول (تأمين سولار ورشة الجيزة)', status: 'cashed', notes: 'تم صرفه وسداده بالكامل من حساب البنك', costCenterId: 'cc3', costCenterName: 'ورشة ومخازن الشركة الرئيسية بالجيزة', autoCollect: false },
  { id: 'chk5', checkNo: 'CK-8821452', bankName: 'البنك العربي الأفريقي', dueDate: '2026-07-08', amount: 300000, type: 'received', partnerName: 'شركة السويدي إلكتريك', status: 'bounced', notes: 'مرفوض لعدم مطابقة التوقيع - جاري استبداله نقداً أو بشيك آخر', costCenterId: 'cc2', costCenterName: 'مشروع تطوير ميناء الإسكندرية الأرصفة الجديدة', autoCollect: false },
  { id: 'chk6', checkNo: 'PDC-5511200', bankName: 'بنك الإسكندرية', dueDate: '2026-07-28', amount: 320000, type: 'received', partnerName: 'شركة السويدي لتطوير البنية التحتية', status: 'portfolio', notes: 'شيك مؤجل دفعة أعمال رافعة الإسكندرية', costCenterId: 'cc2', costCenterName: 'مشروع تطوير ميناء الإسكندرية الأرصفة الجديدة', issueDate: '2026-06-01', autoCollect: true, targetVaultId: 'v1' },
  { id: 'chk7', checkNo: 'PDC-4412990', bankName: 'البنك الأهلي القطري QNB', dueDate: '2026-08-05', amount: 600000, type: 'received', partnerName: 'شركة بكتل العالمية للهندسة', status: 'portfolio', notes: 'شيك آجل دفعة بداية مشروع الأنفاق', costCenterId: 'cc5', costCenterName: 'مشروع توسعة أنفاق قناة السويس وبورسعيد', issueDate: '2026-07-01', autoCollect: true, targetVaultId: 'v2' },
  { id: 'chk8', checkNo: 'PDC-1100223', bankName: 'بنك فيصل الإسلامي', dueDate: '2026-08-12', amount: 210000, type: 'issued', partnerName: 'شركة بترومين للزيوت والشحومات', status: 'portfolio', notes: 'شيك صادر مؤجل سداد طلبية زيوت ثقيلة', costCenterId: 'cc3', costCenterName: 'ورشة ومخازن الشركة الرئيسية بالجيزة', issueDate: '2026-07-10', autoCollect: false, targetVaultId: 'v1' },
];

export default function TreasuryChecks({ currentUser, costCenters = [], onUpdateCostCenters, onAddNotification }: TreasuryChecksProps) {
  // Persistence states
  const [vaults, setVaults] = useState(() => {
    const saved = localStorage.getItem('egypt_cranes_vaults');
    return saved ? JSON.parse(saved) : initialVaults;
  });

  const [transactions, setTransactions] = useState<TreasuryTransaction[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_treasury_txs');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [checks, setChecks] = useState<CheckRecord[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_checks');
    return saved ? JSON.parse(saved) : initialChecks;
  });

  const [interVaultTransfers, setInterVaultTransfers] = useState<InterTreasuryTransfer[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_inter_vault_transfers');
    return saved ? JSON.parse(saved) : initialTransfers;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_journal_entries');
    return saved ? JSON.parse(saved) : initialJournalEntries;
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
    localStorage.setItem('egypt_cranes_vaults', JSON.stringify(vaults));
  }, [vaults]);

  useEffect(() => {
    localStorage.setItem('egypt_cranes_treasury_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('egypt_cranes_checks', JSON.stringify(checks));
  }, [checks]);

  useEffect(() => {
    localStorage.setItem('egypt_cranes_inter_vault_transfers', JSON.stringify(interVaultTransfers));
  }, [interVaultTransfers]);

  useEffect(() => {
    localStorage.setItem('egypt_cranes_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Helper to calculate days remaining until a check's due date
  const getDaysDiff = (dateStr: string) => {
    const todayDate = new Date();
    const anchorDate = (todayDate.getFullYear() === 2026) ? todayDate : new Date("2026-07-25");
    anchorDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - anchorDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Automated background scanner for due-date checks and notifications
  useEffect(() => {
    if (!onAddNotification) return;

    const notifiedStr = localStorage.getItem('egypt_cranes_notified_checks') || '[]';
    let notifiedIds: string[] = JSON.parse(notifiedStr);
    let updated = false;

    checks.forEach(chk => {
      if (chk.status === 'cashed' || chk.status === 'bounced') return;
      if (notifiedIds.includes(chk.id)) return;

      const diffDays = getDaysDiff(chk.dueDate);

      let title = '';
      let message = '';
      let category: 'alert' | 'task' = 'alert';

      if (diffDays < 0) {
        title = lang === 'ar' ? `تنبيه: شيك متأخر الاستحقاق! ⚠️` : `Overdue Check Alert! ⚠️`;
        message = lang === 'ar' 
          ? `الشيك رقم ${chk.checkNo} بقيمة ${chk.amount.toLocaleString()} ج.م يستحق في ${chk.dueDate} (متأخر بـ ${Math.abs(diffDays)} أيام) لـ ${chk.partnerName}`
          : `Check No ${chk.checkNo} for EGP ${chk.amount.toLocaleString()} was due on ${chk.dueDate} (${Math.abs(diffDays)} days overdue) for ${chk.partnerName}`;
        category = 'alert';
      } else if (diffDays === 0) {
        title = lang === 'ar' ? `تنبيه: شيك يستحق اليوم! 🔔` : `Check Due Today! 🔔`;
        message = lang === 'ar'
          ? `الشيك رقم ${chk.checkNo} بقيمة ${chk.amount.toLocaleString()} ج.م يستحق اليوم لـ ${chk.partnerName}`
          : `Check No ${chk.checkNo} for EGP ${chk.amount.toLocaleString()} is due today for ${chk.partnerName}`;
        category = 'alert';
      } else if (diffDays > 0 && diffDays <= 3) {
        title = lang === 'ar' ? `تنبيه: اقتراب موعد استحقاق شيك ⏳` : `Approaching Check Due Date ⏳`;
        message = lang === 'ar'
          ? `اقتراب تاريخ استحقاق الشيك رقم ${chk.checkNo} بقيمة ${chk.amount.toLocaleString()} ج.م خلال ${diffDays} أيام (${chk.dueDate})`
          : `Check No ${chk.checkNo} for EGP ${chk.amount.toLocaleString()} is due in ${diffDays} days (${chk.dueDate})`;
        category = 'task';
      }

      if (title && message) {
        onAddNotification({ title, message, category });
        notifiedIds.push(chk.id);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('egypt_cranes_notified_checks', JSON.stringify(notifiedIds));
    }
  }, [checks, onAddNotification, lang]);

  // UI States
  const [activeTab, setActiveTab] = useState<'treasury' | 'multi_treasury' | 'checks' | 'cost_centers' | 'trial_balance' | 'liquidity_forecast' | 'bank_reconciliation'>('treasury');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddCheckModal, setShowAddCheckModal] = useState(false);

  // Multi-Treasury Dashboard States
  const [multiSearchTerm, setMultiSearchTerm] = useState('');
  const [multiTypeFilter, setMultiTypeFilter] = useState('all');
  const [multiViewMode, setMultiViewMode] = useState<'cards' | 'table'>('cards');

  // Multi-Treasury Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromVaultId: 'v1',
    toVaultId: 'v3',
    amount: '',
    date: '2026-07-25',
    notes: '',
    referenceVoucher: ''
  });

  const [showAddVaultModal, setShowAddVaultModal] = useState(false);
  const [addVaultForm, setAddVaultForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
    type: 'project' as 'main' | 'branch' | 'project' | 'petty_cash' | 'foreign',
    currency: 'EGP',
    initialBalance: '',
    manager: '',
    location: ''
  });

  const [showJournalSlipModal, setShowJournalSlipModal] = useState(false);
  const [selectedTransferForSlip, setSelectedTransferForSlip] = useState<InterTreasuryTransfer | null>(null);

  // Expected Liquidity Forecast States
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [forecastSearch, setForecastSearch] = useState('');
  const [forecastTypeFilter, setForecastTypeFilter] = useState<'all' | 'received' | 'issued'>('all');
  const [reschedulingCheck, setReschedulingCheck] = useState<CheckRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Post-Dated Checks (PDC) System States
  const [pdcSubTab, setPdcSubTab] = useState<'all' | 'due_48h' | 'incoming' | 'outgoing' | 'schedule'>('all');
  const [showPdcRegisterModal, setShowPdcRegisterModal] = useState(false);
  const [showPdcRescheduleModal, setShowPdcRescheduleModal] = useState(false);
  const [selectedPdcForReschedule, setSelectedPdcForReschedule] = useState<CheckRecord | null>(null);
  const [pdcRescheduleDate, setPdcRescheduleDate] = useState('2026-08-10');
  const [pdcRescheduleReason, setPdcRescheduleReason] = useState('');

  const [pdcRegisterForm, setPdcRegisterForm] = useState({
    checkNo: '',
    bankName: 'البنك الأهلي المصري',
    accountNo: '',
    issueDate: '2026-07-25',
    dueDate: '2026-08-10',
    amount: '',
    type: 'received' as 'received' | 'issued',
    partnerName: '',
    drawerName: '',
    beneficiaryName: '',
    targetVaultId: 'v1',
    autoCollect: true,
    costCenterId: 'cc1',
    notes: ''
  });

  // Future Cash Projection States (Contracts & Invoices - Next 3 Months)
  const initialContractMilestones: ContractMilestone[] = [
    {
      id: 'cnt-1',
      contractCode: 'CNT-2026-081',
      title: 'مستخلص رقم 3 - مشروع برج العاصمة الإدارية',
      partnerName: 'شركة المقاولون العرب',
      amount: 650000,
      dueDate: '2026-08-15',
      type: 'inflow',
      probability: 'high',
      status: 'pending',
      costCenterName: 'مشروع العاصمة الإدارية',
      notes: 'استحقاق تسليم مرحلة الأوناش الكبيرة'
    },
    {
      id: 'cnt-2',
      contractCode: 'CNT-2026-042',
      title: 'دفعة إنجاز تركيب أوناش ساحلية - ميناء بورسعيد',
      partnerName: 'شركة أوراسكوم للإنشاءات',
      amount: 920000,
      dueDate: '2026-08-28',
      type: 'inflow',
      probability: 'high',
      status: 'pending',
      costCenterName: 'موقع شرق بورسعيد',
      notes: 'مستخلص التركيب والاختبارات الأخير'
    },
    {
      id: 'cnt-3',
      contractCode: 'CNT-2026-105',
      title: 'قسط توريد محركات أوناش هيدروليكية',
      partnerName: 'شركة ليبهر - ألمانيا (Liebherr)',
      amount: 280000,
      dueDate: '2026-08-20',
      type: 'outflow',
      probability: 'high',
      status: 'pending',
      costCenterName: 'الورشة المركزية للجيزة',
      notes: 'دفعة الالتزام التعاقدي السنوية'
    },
    {
      id: 'cnt-4',
      contractCode: 'CNT-2026-092',
      title: 'مستخلص إيجار أوناش ثقيلة - مشروع حقل ظهر',
      partnerName: 'شركة بتروبل (بترول الشروق)',
      amount: 850000,
      dueDate: '2026-09-10',
      type: 'inflow',
      probability: 'high',
      status: 'pending',
      costCenterName: 'موقع بورسعيد البحري',
      notes: 'عقد إيجار ونش 500 طن'
    },
    {
      id: 'cnt-5',
      contractCode: 'CNT-2026-114',
      title: 'سداد القسط التعاقدي للتأمين الشامل على المعدات',
      partnerName: 'شركة مصر للتأمين',
      amount: 150000,
      dueDate: '2026-09-25',
      type: 'outflow',
      probability: 'medium',
      status: 'pending',
      costCenterName: 'الإدارة المالية المركزية',
      notes: 'تأمين أسطول الأوناش والرافعات'
    },
    {
      id: 'cnt-6',
      contractCode: 'CNT-2026-130',
      title: 'مستخلص نهائي رفع كمرات كوبري قناة السويس',
      partnerName: 'الهيئة الهندسية للقوات المسلحة',
      amount: 1200000,
      dueDate: '2026-10-15',
      type: 'inflow',
      probability: 'medium',
      status: 'pending',
      costCenterName: 'مشروع محور الإسماعيلية',
      notes: 'مستخلص التصفية النهائية والاختبارات'
    },
    {
      id: 'cnt-7',
      contractCode: 'CNT-2026-145',
      title: 'دفعة صيانة وش عمرة أوناش تلسكوبية',
      partnerName: 'شركة مانتراك (Mantrac CAT)',
      amount: 210000,
      dueDate: '2026-10-28',
      type: 'outflow',
      probability: 'high',
      status: 'pending',
      costCenterName: 'الورشة المركزية للجيزة',
      notes: 'عقد صيانة الوقاية الدورية'
    }
  ];

  const initialPendingInvoices: PendingInvoice[] = [
    {
      id: 'inv-1',
      invoiceNo: 'INV-2026-401',
      partnerName: 'شركة السويدي إلكتريك',
      amount: 180000,
      dueDate: '2026-08-05',
      type: 'receivable',
      probability: 'high',
      status: 'unpaid',
      costCenterName: 'مشروع العاشر من رمضان',
      notes: 'فاتورة إيجار ونش 250 طن لمدة أسبوعين'
    },
    {
      id: 'inv-2',
      invoiceNo: 'INV-2026-409',
      partnerName: 'شركة مصر للبترول',
      amount: 65000,
      dueDate: '2026-08-12',
      type: 'payable',
      probability: 'high',
      status: 'unpaid',
      costCenterName: 'الورشة المركزية للجيزة',
      notes: 'فاتورة توريد زيوت وشحومات أوناش'
    },
    {
      id: 'inv-3',
      invoiceNo: 'INV-2026-455',
      partnerName: 'شركة ريدكون للتعمير',
      amount: 240000,
      dueDate: '2026-09-05',
      type: 'receivable',
      probability: 'high',
      status: 'unpaid',
      costCenterName: 'موقع العلمين الجديدة',
      notes: 'فاتورة مبيعات قطع غيار واير صلب'
    },
    {
      id: 'inv-4',
      invoiceNo: 'INV-2026-480',
      partnerName: 'شركة الإسكندرية لتداول الحاويات',
      amount: 95000,
      dueDate: '2026-09-18',
      type: 'payable',
      probability: 'high',
      status: 'unpaid',
      costCenterName: 'موقع ميناء الدخيلة',
      notes: 'فاتورة خدمات نقل وتعتيق أوناش'
    },
    {
      id: 'inv-5',
      invoiceNo: 'INV-2026-512',
      partnerName: 'شركة حسن علام للمقاولات',
      amount: 310000,
      dueDate: '2026-10-08',
      type: 'receivable',
      probability: 'medium',
      status: 'unpaid',
      costCenterName: 'مشروع محطة الضبعة',
      notes: 'فاتورة اختبارات أحمال وشهادات معايرة'
    },
    {
      id: 'inv-6',
      invoiceNo: 'INV-2026-530',
      partnerName: 'شركة بريدجستون مصر للإطارات',
      amount: 120000,
      dueDate: '2026-10-22',
      type: 'payable',
      probability: 'high',
      status: 'unpaid',
      costCenterName: 'الورشة المركزية للجيزة',
      notes: 'فاتورة إطارات أوناش ساحلية مقاس كبير'
    }
  ];

  const [contractMilestones, setContractMilestones] = useState<ContractMilestone[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_contract_milestones');
    return saved ? JSON.parse(saved) : initialContractMilestones;
  });

  useEffect(() => {
    localStorage.setItem('egypt_cranes_contract_milestones', JSON.stringify(contractMilestones));
  }, [contractMilestones]);

  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_pending_invoices');
    return saved ? JSON.parse(saved) : initialPendingInvoices;
  });

  useEffect(() => {
    localStorage.setItem('egypt_cranes_pending_invoices', JSON.stringify(pendingInvoices));
  }, [pendingInvoices]);

  // Projection View Toggles & Filters
  const [projectionTab, setProjectionTab] = useState<'snapshot' | '3month' | 'quick'>('snapshot');
  const [snapshotHours, setSnapshotHours] = useState<24 | 48 | 72>(24);
  const [snapshotSafetyBuffer, setSnapshotSafetyBuffer] = useState<number>(200000);
  const [showAddEmergencyObligationModal, setShowAddEmergencyObligationModal] = useState<boolean>(false);
  const [emergencyObligationForm, setEmergencyObligationForm] = useState({
    title: '',
    partnerName: '',
    amount: '',
    type: 'check_issued' as 'check_issued' | 'invoice_payable' | 'contract_outflow',
    dueDate: '2026-07-25',
    notes: ''
  });
  const [useWeightedProbability, setUseWeightedProbability] = useState<boolean>(true);
  const [includeContracts, setIncludeContracts] = useState<boolean>(true);
  const [includeInvoices, setIncludeInvoices] = useState<boolean>(true);
  const [includeChecksIn3Month, setIncludeChecksIn3Month] = useState<boolean>(true);

  const [projSearch, setProjSearch] = useState('');
  const [projMonthFilter, setProjMonthFilter] = useState<'all' | '2026-08' | '2026-09' | '2026-10'>('all');
  const [projSourceFilter, setProjSourceFilter] = useState<'all' | 'contract' | 'invoice'>('all');

  // New Contract & Invoice Modals
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [newContractForm, setNewContractForm] = useState({
    contractCode: '',
    title: '',
    partnerName: '',
    amount: '',
    dueDate: '',
    type: 'inflow' as 'inflow' | 'outflow',
    probability: 'high' as 'high' | 'medium' | 'low',
    notes: '',
    costCenterName: ''
  });

  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNo: '',
    partnerName: '',
    amount: '',
    dueDate: '',
    type: 'receivable' as 'receivable' | 'payable',
    probability: 'high' as 'high' | 'medium' | 'low',
    notes: '',
    costCenterName: ''
  });

  // Bank Reconciliation States
  const initialBankStatementLines: BankStatementLine[] = [
    { id: 'bs-1', date: '2026-07-10', refNo: 'TR-REC-2026-001', description: 'تحويل المقاولون العرب - العاصمة الإدارية', deposit: 150000, withdrawal: 0, bankName: 'البنك التجاري الدولي CIB', matchedJournalId: 'TR-REC-2026-001', matchStatus: 'matched', matchType: 'auto' },
    { id: 'bs-2', date: '2026-07-15', refNo: 'CK-6541289', description: 'إيداع شيك أوراسكوم - تعاقد ونش بورسعيد', deposit: 750000, withdrawal: 0, bankName: 'البنك التجاري الدولي CIB', matchedJournalId: 'CK-6541289', matchStatus: 'matched', matchType: 'auto' },
    { id: 'bs-3', date: '2026-07-05', refNo: 'CK-3214590', description: 'صرف شيك شركة مصر للبترول - ورشة الجيزة', deposit: 0, withdrawal: 85000, bankName: 'البنك التجاري الدولي CIB', matchedJournalId: 'CK-3214590', matchStatus: 'matched', matchType: 'auto' },
    { id: 'bs-4', date: '2026-07-18', refNo: 'BS-FEE-2026-09', description: 'مصاريف إدارية وعمولات تحويل بنكي وحفظ شيكات - CIB', deposit: 0, withdrawal: 1250, bankName: 'البنك التجاري الدولي CIB', matchStatus: 'unmatched' },
    { id: 'bs-5', date: '2026-07-19', refNo: 'BS-INT-2026-02', description: 'عائد فائدة استثمارية حساب الوديعة - CIB', deposit: 18500, withdrawal: 0, bankName: 'البنك التجاري الدولي CIB', matchStatus: 'unmatched' },
    { id: 'bs-6', date: '2026-07-20', refNo: 'TR-PAY-2026-001', description: 'تحويل نقدي صيانة - م. ياسر حسن', deposit: 0, withdrawal: 25000, bankName: 'البنك التجاري الدولي CIB', matchedJournalId: 'TR-PAY-2026-001', matchStatus: 'matched', matchType: 'auto' },
  ];

  const [bankStatementLines, setBankStatementLines] = useState<BankStatementLine[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_bank_statement_lines');
    return saved ? JSON.parse(saved) : initialBankStatementLines;
  });

  useEffect(() => {
    localStorage.setItem('egypt_cranes_bank_statement_lines', JSON.stringify(bankStatementLines));
  }, [bankStatementLines]);

  const [selectedReconBank, setSelectedReconBank] = useState('البنك التجاري الدولي CIB');
  const [reconSearch, setReconSearch] = useState('');
  const [reconFilterStatus, setReconFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  const [selectedLineForAdjustment, setSelectedLineForAdjustment] = useState<BankStatementLine | null>(null);
  const [adjCostCenterId, setAdjCostCenterId] = useState('');
  const [adjCategory, setAdjCategory] = useState<'expense' | 'customer_payment' | 'supplier_payment' | 'other'>('expense');
  const [adjNotes, setAdjNotes] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importBankName, setImportBankName] = useState('البنك التجاري الدولي CIB');

  // Trial Balance & Periodical Reconciliation States
  const [trialStartDate, setTrialStartDate] = useState('2026-07-01');
  const [trialEndDate, setTrialEndDate] = useState('2026-07-31');
  const [trialVaultId, setTrialVaultId] = useState('all');
  const [trialPartnerName, setTrialPartnerName] = useState('all');
  const [showApproveReconModal, setShowApproveReconModal] = useState(false);
  const [reconNotes, setReconNotes] = useState('');
  const [reconPeriodName, setReconPeriodName] = useState('');
  const [reconciledPeriods, setReconciledPeriods] = useState<{ id: string; periodName: string; dateApproved: string; approvedBy: string; notes: string; vaultName: string }[]>(() => {
    const saved = localStorage.getItem('egypt_cranes_reconciled_periods');
    return saved ? JSON.parse(saved) : [
      { id: 'rec-1', periodName: 'مطابقة النصف الأول من يوليو 2026', dateApproved: '2026-07-15', approvedBy: 'أحمد سليمان (مدير الخزينة)', notes: 'تمت مطابقة أرصدة كافة الخزائن الفرعية والدفاتر بالكامل وتصفية كافة الفروقات بنجاح.', vaultName: 'كافة الخزائن الموحدة' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('egypt_cranes_reconciled_periods', JSON.stringify(reconciledPeriods));
  }, [reconciledPeriods]);

  // States for cashing/clearing confirmation with targeted vault selection
  const [showCashConfirmModal, setShowCashConfirmModal] = useState(false);
  const [selectedCheckForCashing, setSelectedCheckForCashing] = useState<CheckRecord | null>(null);
  const [cashConfirmVaultId, setCashConfirmVaultId] = useState(vaults[0]?.id || '');
  const [cashConfirmDate, setCashConfirmDate] = useState('2026-07-18');

  // New Transaction Form State
  const [newTx, setNewTx] = useState({
    type: 'cash_in' as 'cash_in' | 'cash_out',
    amount: '',
    vaultId: vaults[0]?.id || '',
    recipientOrPayer: '',
    description: '',
    category: 'customer_payment' as any,
    costCenterId: ''
  });

  // New Check Form State
  const [newCheck, setNewCheck] = useState({
    checkNo: '',
    bankName: '',
    dueDate: '',
    amount: '',
    type: 'received' as 'received' | 'issued',
    partnerName: '',
    notes: '',
    costCenterId: ''
  });

  // New Cost Center Form States
  const [showAddCostCenterModal, setShowAddCostCenterModal] = useState(false);
  const [newCC, setNewCC] = useState({
    nameAr: '',
    nameEn: '',
    budget: '',
  });

  const handleAddCostCenterLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCC.nameAr || !newCC.nameEn || !newCC.budget) return;

    const id = `cc-${Date.now()}`;
    const newCostCenterObj = {
      id,
      code: `CC-${Math.floor(100 + Math.random() * 900)}`,
      nameAr: newCC.nameAr,
      nameEn: newCC.nameEn,
      department: 'الخزينة والمالية',
      budget: parseFloat(newCC.budget),
      usedBudget: 0,
      isActive: true,
      managerName: currentUser.fullName || 'المدير المالي'
    };

    onUpdateCostCenters([newCostCenterObj, ...costCenters]);
    setShowAddCostCenterModal(false);
    setNewCC({ nameAr: '', nameEn: '', budget: '' });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم إنشاء مركز تكلفة جديد 📁' : 'New Cost Center Created 📁',
        message: lang === 'ar'
          ? `تمت إضافة مركز التكلفة "${newCC.nameAr}" بنجاح بموازنة ${parseFloat(newCC.budget).toLocaleString()} ج.م`
          : `Added cost center "${newCC.nameEn}" with budget EGP ${parseFloat(newCC.budget).toLocaleString()}`,
        category: 'reply'
      });
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<'ar' | 'en', string>> = {
      title: { ar: 'وحدة الخزينة والشيكات الموحدة', en: 'Treasury & Checks Unified Module' },
      subtitle: { ar: 'الإشراف على حركة السيولة النقدية والودائع ومتابعة الشيكات المصرفية الصادرة والواردة', en: 'Oversee cash liquidity, vaults and monitor issued & received bank checks' },
      treasury_tab: { ar: 'إدارة الخزائن والحركة النقدية 💵', en: 'Vaults & Cash Flow' },
      checks_tab: { ar: 'الشيكات وحركة المقاصة البنكية 🏦', en: 'Checks & Bank Clearing' },
      total_liquidity: { ar: 'إجمالي السيولة المتوفرة بالخزائن', en: 'Total Available Vault Cash' },
      total_in: { ar: 'إجمالي المقبوضات النقدية (سندات القبض)', en: 'Total Cash Receipts' },
      total_out: { ar: 'إجمالي المدفوعات النقدية (سندات الصرف)', en: 'Total Cash Payments' },
      checks_portfolio: { ar: 'شيكات في المحفظة (قيد الانتظار)', en: 'Checks in Portfolio' },
      checks_cashed: { ar: 'شيكات تم تحصيلها بنجاح', en: 'Successfully Cashed Checks' },
      checks_bounced: { ar: 'شيكات مرفوضة (تحت التسوية)', en: 'Bounced Checks' },
      add_tx: { ar: 'إنشاء سند مالي (قبض / صرف)', en: 'Create Cash Voucher (In/Out)' },
      add_check: { ar: 'تسجيل شيك جديد بالدفاتر', en: 'Register New Bank Check' },
      vault_name: { ar: 'الخزينة المستهدفة', en: 'Target Vault' },
      amount_label: { ar: 'المبلغ المالي', en: 'Financial Amount' },
      type_label: { ar: 'نوع العملية', en: 'Transaction Type' },
      cash_in: { ar: 'سند قبض (توريد نقدي)', en: 'Cash Receipt (In)' },
      cash_out: { ar: 'سند صرف (دفع نقدي)', en: 'Cash Payment (Out)' },
      payer_label: { ar: 'الطرف الثاني (المسدد / المستلم)', en: 'Second Party (Payer/Payee)' },
      desc_label: { ar: 'بيان الحركة والتفاصيل', en: 'Voucher Statement & Details' },
      cat_label: { ar: 'التصنيف المحاسبي', en: 'Accounting Category' },
      save_btn: { ar: 'حفظ واعتماد الحركة في السجلات', en: 'Save & Approve in Registers' },
      cancel_btn: { ar: 'إلغاء الأمر', en: 'Cancel Order' },
      check_no: { ar: 'رقم الشيك', en: 'Check Number' },
      bank_name: { ar: 'البنك المسحوب عليه', en: 'Drawee Bank' },
      due_date: { ar: 'تاريخ الاستحقاق', en: 'Due Date' },
      check_type: { ar: 'اتجاه الشيك', en: 'Check Direction' },
      received_check: { ar: 'شيك وارد (من عميل)', en: 'Received Check (from Customer)' },
      issued_check: { ar: 'شيك صادر (إلى مورد)', en: 'Issued Check (to Supplier)' },
      partner_label: { ar: 'الساحب / المستفيد', en: 'Drawer / Beneficiary' },
      notes_label: { ar: 'ملاحظات إضافية', en: 'Additional Notes' },
      filter_all: { ar: 'كل الفئات', en: 'All Categories' },
      filter_cust: { ar: 'مقبوضات عملاء', en: 'Customer Receipts' },
      filter_supp: { ar: 'مدفوعات موردين', en: 'Supplier Payments' },
      filter_exp: { ar: 'مصاريف تشغيلية', en: 'Operating Expenses' },
      filter_rev: { ar: 'إيرادات أخرى', en: 'Other Revenues' },
      search_placeholder: { ar: 'ابحث برقم السند، الطرف الآخر، أو الملاحظات...', en: 'Search by voucher No, partner, or description...' },
      check_search_placeholder: { ar: 'ابحث برقم الشيك، البنك، أو الساحب...', en: 'Search by check No, bank or drawer...' },
      status_portfolio: { ar: 'في المحفظة', en: 'In Portfolio' },
      status_deposited: { ar: 'برسم التحصيل', en: 'Deposited for Clearing' },
      status_cashed: { ar: 'تم تحصيله', en: 'Cashed / Cleared' },
      status_bounced: { ar: 'مرفوض', en: 'Bounced / Rejected' },
      no_data: { ar: 'لا توجد بيانات تطابق تصفيتك الحالية.', en: 'No data matches your current filters.' }
    };
    return translations[key]?.[lang] || key;
  };

  // Stats
  const totalVaultCash = vaults.reduce((acc, v) => acc + v.balance, 0);
  const totalCashIn = transactions.filter(t => t.type === 'cash_in').reduce((acc, t) => acc + t.amount, 0);
  const totalCashOut = transactions.filter(t => t.type === 'cash_out').reduce((acc, t) => acc + t.amount, 0);

  const checksPortfolioCount = checks.filter(c => c.status === 'portfolio').length;
  const checksCashedCount = checks.filter(c => c.status === 'cashed').length;
  const checksBouncedCount = checks.filter(c => c.status === 'bounced').length;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newTx.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const selectedVault = vaults.find(v => v.id === newTx.vaultId);
    if (!selectedVault) return;

    // Check balance if cash out
    if (newTx.type === 'cash_out' && selectedVault.balance < amountNum) {
      alert(lang === 'ar' ? 'رصيد الخزينة لا يكفي لإتمام عملية الصرف!' : 'Insufficient vault balance for cash payment!');
      return;
    }

    const docPrefix = newTx.type === 'cash_in' ? 'TR-REC' : 'TR-PAY';
    const txId = `t-${Date.now()}`;
    const docNo = `${docPrefix}-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;

    const targetCc = costCenters.find(c => c.id === newTx.costCenterId);

    const txRecord: TreasuryTransaction = {
      id: txId,
      docNo,
      date: new Date().toISOString().split('T')[0],
      type: newTx.type,
      amount: amountNum,
      vaultId: newTx.vaultId,
      vaultName: lang === 'ar' ? selectedVault.nameAr : selectedVault.nameEn,
      recipientOrPayer: newTx.recipientOrPayer,
      description: newTx.description,
      category: newTx.category,
      costCenterId: newTx.costCenterId || undefined,
      costCenterName: targetCc ? (lang === 'ar' ? targetCc.nameAr : targetCc.nameEn) : undefined
    };

    // Update Vault balance
    const updatedVaults = vaults.map(v => {
      if (v.id === newTx.vaultId) {
        return {
          ...v,
          balance: v.balance + (newTx.type === 'cash_in' ? amountNum : -amountNum)
        };
      }
      return v;
    });

    // Update Cost Center budget if cash out
    if (newTx.type === 'cash_out' && newTx.costCenterId && onUpdateCostCenters) {
      const updatedCcs = costCenters.map(cc => {
        if (cc.id === newTx.costCenterId) {
          return { ...cc, usedBudget: cc.usedBudget + amountNum };
        }
        return cc;
      });
      onUpdateCostCenters(updatedCcs);
    }

    setTransactions([txRecord, ...transactions]);
    setVaults(updatedVaults);
    setShowAddTxModal(false);

    // Trigger user notification/alert through standard channel
    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'حركة نقدية جديدة معتمدة' : 'New Cash Voucher Approved',
        message: lang === 'ar'
          ? `تم اعتماد سند مالي ${docNo} بقيمة ${amountNum.toLocaleString()} ج.م من خزينة (${selectedVault.nameAr})${targetCc ? ` ومربوط بمركز تكلفة: ${targetCc.nameAr}` : ''}`
          : `Approved cash voucher ${docNo} for EGP ${amountNum.toLocaleString()} in vault (${selectedVault.nameEn})${targetCc ? ` linked to cost center: ${targetCc.nameEn}` : ''}`,
        category: 'order'
      });
    }

    // Reset Form
    setNewTx({
      type: 'cash_in',
      amount: '',
      vaultId: vaults[0]?.id || '',
      recipientOrPayer: '',
      description: '',
      category: 'customer_payment',
      costCenterId: ''
    });
  };

  const handleAddCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newCheck.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const targetCc = costCenters.find(c => c.id === newCheck.costCenterId);

    const checkRecord: CheckRecord = {
      id: `chk-${Date.now()}`,
      checkNo: newCheck.checkNo,
      bankName: newCheck.bankName,
      dueDate: newCheck.dueDate,
      amount: amountNum,
      type: newCheck.type,
      partnerName: newCheck.partnerName,
      status: 'portfolio',
      notes: newCheck.notes,
      costCenterId: newCheck.costCenterId || undefined,
      costCenterName: targetCc ? (lang === 'ar' ? targetCc.nameAr : targetCc.nameEn) : undefined
    };

    setChecks([checkRecord, ...checks]);
    setShowAddCheckModal(false);

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'شيك جديد مدخل بالدفاتر' : 'New Check Registered',
        message: lang === 'ar'
          ? `تم تسجيل شيك رقم ${newCheck.checkNo} مسحوب على ${newCheck.bankName} بمبلغ ${amountNum.toLocaleString()} ج.م${targetCc ? ` ومربوط بمركز تكلفة: ${targetCc.nameAr}` : ''}`
          : `Registered check No ${newCheck.checkNo} drawn on ${newCheck.bankName} for EGP ${amountNum.toLocaleString()}${targetCc ? ` linked to cost center: ${targetCc.nameEn}` : ''}`,
        category: 'task'
      });
    }

    // Reset Form
    setNewCheck({
      checkNo: '',
      bankName: '',
      dueDate: '',
      amount: '',
      type: 'received',
      partnerName: '',
      notes: '',
      costCenterId: ''
    });
  };

  const handleConfirmCashing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckForCashing) return;

    const targetCheck = selectedCheckForCashing;
    const selectedVault = vaults.find((v: any) => v.id === cashConfirmVaultId);
    if (!selectedVault) return;

    // Verify that we have sufficient balance for cashing issued checks
    if (targetCheck.type === 'issued' && selectedVault.balance < targetCheck.amount) {
      alert(lang === 'ar' ? 'رصيد الخزينة المحددة لا يكفي لصرف الشيك الصادر!' : 'Selected vault has insufficient balance to cash this issued check!');
      return;
    }

    const updatedChecks = checks.map(c => {
      if (c.id === targetCheck.id) {
        return { ...c, status: 'cashed' as const };
      }
      return c;
    });

    setChecks(updatedChecks);

    const docNo = `TR-CHK-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
    const autoTx: TreasuryTransaction = {
      id: `t-auto-${Date.now()}`,
      docNo,
      date: cashConfirmDate || new Date().toISOString().split('T')[0],
      type: targetCheck.type === 'received' ? 'cash_in' : 'cash_out',
      amount: targetCheck.amount,
      vaultId: selectedVault.id,
      vaultName: lang === 'ar' ? selectedVault.nameAr : selectedVault.nameEn,
      recipientOrPayer: targetCheck.partnerName,
      description: lang === 'ar' 
        ? `تسوية وصرف الشيك رقم ${targetCheck.checkNo} - مسحوب على ${targetCheck.bankName}`
        : `Settlement and cashing for check No ${targetCheck.checkNo} - drawn on ${targetCheck.bankName}`,
      category: targetCheck.type === 'received' ? 'customer_payment' : 'supplier_payment',
      costCenterId: targetCheck.costCenterId,
      costCenterName: targetCheck.costCenterName
    };

    const updatedVaults = vaults.map(v => {
      if (v.id === selectedVault.id) {
        return {
          ...v,
          balance: v.balance + (targetCheck.type === 'received' ? targetCheck.amount : -targetCheck.amount)
        };
      }
      return v;
    });

    // Update Cost Center budget if check is issued (expensed)
    if (targetCheck.type === 'issued' && targetCheck.costCenterId && onUpdateCostCenters) {
      const updatedCcs = costCenters.map(cc => {
        if (cc.id === targetCheck.costCenterId) {
          return { ...cc, usedBudget: cc.usedBudget + targetCheck.amount };
        }
        return cc;
      });
      onUpdateCostCenters(updatedCcs);
    }

    setTransactions([autoTx, ...transactions]);
    setVaults(updatedVaults);

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تمت تسوية الشيك وتحديث رصيد الخزينة' : 'Check Settled & Vault Updated',
        message: lang === 'ar'
          ? `تم إثبات صرف الشيك رقم ${targetCheck.checkNo} بقيمة ${targetCheck.amount.toLocaleString()} ج.م وقيد المعاملة في (${selectedVault.nameAr})${targetCheck.costCenterName ? ` ومربوط بمركز تكلفة: ${targetCheck.costCenterName}` : ''}`
          : `Check No ${targetCheck.checkNo} for EGP ${targetCheck.amount.toLocaleString()} was successfully cashed and recorded in (${selectedVault.nameEn})${targetCheck.costCenterName ? ` linked to cost center: ${targetCheck.costCenterName}` : ''}`,
        category: 'reply'
      });
    }

    setShowCashConfirmModal(false);
    setSelectedCheckForCashing(null);
  };

  const updateCheckStatus = (checkId: string, newStatus: 'portfolio' | 'deposited' | 'cashed' | 'bounced') => {
    const targetCheck = checks.find(c => c.id === checkId);
    if (!targetCheck) return;

    const updatedChecks = checks.map(c => {
      if (c.id === checkId) {
        return { ...c, status: newStatus };
      }
      return c;
    });

    setChecks(updatedChecks);

    // If check status becomes 'cashed', trigger cash transaction automatically in Giza Main Treasury if received, or deduct if issued!
    if (newStatus === 'cashed') {
      const selectedVault = vaults[0]; // main vault
      if (selectedVault) {
        const docNo = `TR-CHK-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
        const autoTx: TreasuryTransaction = {
          id: `t-auto-${Date.now()}`,
          docNo,
          date: new Date().toISOString().split('T')[0],
          type: targetCheck.type === 'received' ? 'cash_in' : 'cash_out',
          amount: targetCheck.amount,
          vaultId: selectedVault.id,
          vaultName: lang === 'ar' ? selectedVault.nameAr : selectedVault.nameEn,
          recipientOrPayer: targetCheck.partnerName,
          description: lang === 'ar' 
            ? `تحصيل تلقائي للشيك رقم ${targetCheck.checkNo} - مسحوب على ${targetCheck.bankName}`
            : `Auto clearing for check No ${targetCheck.checkNo} - drawn on ${targetCheck.bankName}`,
          category: targetCheck.type === 'received' ? 'customer_payment' : 'supplier_payment',
          costCenterId: targetCheck.costCenterId,
          costCenterName: targetCheck.costCenterName
        };

        const updatedVaults = vaults.map(v => {
          if (v.id === selectedVault.id) {
            return {
              ...v,
              balance: v.balance + (targetCheck.type === 'received' ? targetCheck.amount : -targetCheck.amount)
            };
          }
          return v;
        });

        // Update Cost Center budget if check is issued (expensed)
        if (targetCheck.type === 'issued' && targetCheck.costCenterId && onUpdateCostCenters) {
          const updatedCcs = costCenters.map(cc => {
            if (cc.id === targetCheck.costCenterId) {
              return { ...cc, usedBudget: cc.usedBudget + targetCheck.amount };
            }
            return cc;
          });
          onUpdateCostCenters(updatedCcs);
        }

        setTransactions([autoTx, ...transactions]);
        setVaults(updatedVaults);

        if (onAddNotification) {
          onAddNotification({
            title: lang === 'ar' ? 'تمت تسوية المقاصة البنكية للشيك' : 'Check Cleared Successfully',
            message: lang === 'ar'
              ? `تم صرف قيمة الشيك رقم ${targetCheck.checkNo} تلقائياً وإضافته لـ ${selectedVault.nameAr}${targetCheck.costCenterName ? ` ومربوط بمركز تكلفة: ${targetCheck.costCenterName}` : ''}`
              : `Cleared check No ${targetCheck.checkNo} and auto recorded in ${selectedVault.nameEn}${targetCheck.costCenterName ? ` linked to cost center: ${targetCheck.costCenterName}` : ''}`,
            category: 'reply'
          });
        }
      }
    } else if (newStatus === 'bounced') {
      // Bounced check notification
      if (onAddNotification) {
        onAddNotification({
          title: lang === 'ar' ? 'تحذير: شيك مرتجع ومرفوض' : 'Warning: Bounced Check',
          message: lang === 'ar'
            ? `تم تسجيل ارتجاع الشيك رقم ${targetCheck.checkNo} بقيمة ${targetCheck.amount.toLocaleString()} ج.م من ${targetCheck.partnerName}`
            : `Check No ${targetCheck.checkNo} for EGP ${targetCheck.amount.toLocaleString()} from ${targetCheck.partnerName} has bounced`,
          category: 'alert'
        });
      }
    }
  };

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.docNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.recipientOrPayer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Filter Checks
  const filteredChecks = checks.filter(c => {
    const matchesSearch = searchTerm === '' || 
      c.checkNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partnerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = categoryFilter === 'all' || c.status === categoryFilter;
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'incoming' ? c.type === 'received' : typeFilter === 'outgoing' ? c.type === 'issued' : c.type === typeFilter);

    // PDC SubTab Filtering
    let matchesSubTab = true;
    if (pdcSubTab === 'due_48h') {
      matchesSubTab = (c.status === 'portfolio' || c.status === 'deposited') && getDaysDiff(c.dueDate) <= 2;
    } else if (pdcSubTab === 'incoming') {
      matchesSubTab = c.type === 'received';
    } else if (pdcSubTab === 'outgoing') {
      matchesSubTab = c.type === 'issued';
    } else if (pdcSubTab === 'schedule') {
      matchesSubTab = c.status !== 'cashed' && c.autoCollect === true;
    }

    return matchesSearch && matchesStatus && matchesType && matchesSubTab;
  });

  // Unique Partners derived from transactions and checks
  const uniquePartners = Array.from(new Set([
    ...transactions.map(t => t.recipientOrPayer),
    ...checks.map(c => c.partnerName)
  ])).filter(Boolean);

  // Filter Transactions for Trial Balance
  const filteredTrialTransactions = transactions.filter(t => {
    const inDateRange = (!trialStartDate || t.date >= trialStartDate) && 
                        (!trialEndDate || t.date <= trialEndDate);
    const matchesVault = trialVaultId === 'all' || t.vaultId === trialVaultId;
    const matchesPartner = trialPartnerName === 'all' || t.recipientOrPayer === trialPartnerName;
    return inDateRange && matchesVault && matchesPartner;
  }).sort((a, b) => a.date.localeCompare(b.date)); // Oldest to newest for ledger

  // Calculate opening balance trace-back
  const getOpeningBalance = () => {
    let currentRefBalance = 0;
    if (trialVaultId === 'all') {
      currentRefBalance = vaults.reduce((acc: number, v: any) => acc + v.balance, 0);
    } else {
      const v = vaults.find((v: any) => v.id === trialVaultId);
      currentRefBalance = v ? v.balance : 0;
    }

    // Sum all subsequent transactions (on/after trialStartDate) to trace back
    let netSubsequentChange = 0;
    transactions.forEach(t => {
      if (trialStartDate && t.date >= trialStartDate) {
        if (trialVaultId === 'all' || t.vaultId === trialVaultId) {
          if (t.type === 'cash_in') {
            netSubsequentChange += t.amount;
          } else {
            netSubsequentChange -= t.amount;
          }
        }
      }
    });

    return currentRefBalance - netSubsequentChange;
  };

  const trialOpeningBalance = getOpeningBalance();
  const trialPeriodDebits = filteredTrialTransactions.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
  const trialPeriodCredits = filteredTrialTransactions.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
  const trialEndingBalance = trialOpeningBalance + trialPeriodDebits - trialPeriodCredits;

  // Filter outstanding checks for this partner or date
  const outstandingChecks = checks.filter(c => {
    const matchesPartner = trialPartnerName === 'all' || c.partnerName === trialPartnerName;
    const isPending = c.status === 'portfolio' || c.status === 'deposited';
    return matchesPartner && isPending;
  });

  const handleApproveReconciliationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconPeriodName) return;

    let targetVaultLabel = lang === 'ar' ? 'كافة الخزائن الموحدة' : 'All Vaults';
    if (trialVaultId !== 'all') {
      const v = vaults.find((v: any) => v.id === trialVaultId);
      if (v) {
        targetVaultLabel = lang === 'ar' ? v.nameAr : v.nameEn;
      }
    }

    const newPeriod = {
      id: `rec-${Date.now()}`,
      periodName: reconPeriodName,
      dateApproved: new Date().toISOString().split('T')[0],
      approvedBy: `${currentUser.fullName || currentUser.username} (مدير الخزينة والتحصيل)`,
      notes: reconNotes || (lang === 'ar' ? 'تمت مطابقة الأرصدة الدفترية مع السيولة النقدية الفعلية بنجاح.' : 'Successfully reconciled ledger book balances with physical cash.'),
      vaultName: targetVaultLabel
    };

    setReconciledPeriods([newPeriod, ...reconciledPeriods]);
    setShowApproveReconModal(false);
    setReconPeriodName('');
    setReconNotes('');

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم اعتماد مطابقة دورية وميزان مراجعة ⚖️' : 'Reconciliation Approved ⚖️',
        message: lang === 'ar'
          ? `تم اعتماد ميزان المراجعة والمطابقة للفترة (${reconPeriodName}) بنجاح بقيمة رصيد ختامي ${trialEndingBalance.toLocaleString()} ج.م`
          : `Reconciliation period (${reconPeriodName}) approved with ending balance of EGP ${trialEndingBalance.toLocaleString()}`,
        category: 'reply'
      });
    }
  };

  // Bank Reconciliation Handlers & Calculations
  const handleRunAutoMatch = () => {
    setIsAutoMatching(true);
    setTimeout(() => {
      let matchCount = 0;
      const updatedLines = bankStatementLines.map(line => {
        if (line.matchStatus === 'matched') return line;

        // Try matching with transactions
        const txMatch = transactions.find(t => 
          (t.amount === line.deposit || t.amount === line.withdrawal) &&
          (line.refNo && (t.docNo.toLowerCase().includes(line.refNo.toLowerCase()) || line.refNo.toLowerCase().includes(t.docNo.toLowerCase())))
        );

        if (txMatch) {
          matchCount++;
          return {
            ...line,
            matchedJournalId: txMatch.docNo,
            matchStatus: 'matched' as const,
            matchType: 'auto' as const
          };
        }

        // Try matching with checks
        const chkMatch = checks.find(c =>
          (c.amount === line.deposit || c.amount === line.withdrawal) &&
          (line.refNo && (c.checkNo.toLowerCase().includes(line.refNo.toLowerCase()) || line.refNo.toLowerCase().includes(c.checkNo.toLowerCase())))
        );

        if (chkMatch) {
          matchCount++;
          return {
            ...line,
            matchedJournalId: chkMatch.checkNo,
            matchStatus: 'matched' as const,
            matchType: 'auto' as const
          };
        }

        return line;
      });

      setBankStatementLines(updatedLines);
      setIsAutoMatching(false);

      if (onAddNotification) {
        onAddNotification({
          title: lang === 'ar' ? 'اكتملت المطابقة البنكية الآلية 🤖' : 'Auto Bank Matching Completed 🤖',
          message: lang === 'ar' 
            ? `تمت مطابقة الحركات البنكية بنجاح مع قيود دفتر اليومية والشيكات المسجلة.` 
            : `Auto-matched bank statement transactions with journal entries.`,
          category: 'alert'
        });
      }
    }, 700);
  };

  const handleCreateAdjustmentEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLineForAdjustment) return;

    const line = selectedLineForAdjustment;
    const isDeposit = line.deposit > 0;
    const amount = isDeposit ? line.deposit : line.withdrawal;
    const newDocNo = `TR-ADJ-${Date.now().toString().slice(-4)}`;

    const selectedCC = costCenters.find(c => c.id === adjCostCenterId);

    const newTxObj: TreasuryTransaction = {
      id: `adj-tx-${Date.now()}`,
      docNo: newDocNo,
      date: line.date,
      type: isDeposit ? 'cash_in' : 'cash_out',
      amount: amount,
      vaultId: vaults[0]?.id || 'v1',
      vaultName: vaults[0]?.nameAr || 'الخزينة الرئيسية - فرع الجيزة',
      recipientOrPayer: line.bankName,
      description: adjNotes || `تسوية بنكية عن: ${line.description}`,
      category: adjCategory as any,
      costCenterId: adjCostCenterId,
      costCenterName: selectedCC ? (lang === 'ar' ? selectedCC.nameAr : selectedCC.nameEn) : 'تسويات بنكية ومصروفات'
    };

    setTransactions([newTxObj, ...transactions]);

    // Update bank statement line
    setBankStatementLines(prev => prev.map(l => l.id === line.id ? {
      ...l,
      matchedJournalId: newDocNo,
      matchStatus: 'matched' as const,
      matchType: 'adjusted' as const
    } : l));

    setSelectedLineForAdjustment(null);
    setAdjNotes('');
    setAdjCostCenterId('');

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم إنشاء قيد التسوية البنكية 📝' : 'Bank Adjustment Entry Created 📝',
        message: lang === 'ar'
          ? `تم إنشاء القيد رقم ${newDocNo} بمبلغ ${amount.toLocaleString()} ج.م ومطابقة الحركة البنكية بالدفاتر.`
          : `Created adjustment entry ${newDocNo} for EGP ${amount.toLocaleString()} and matched line.`,
        category: 'reply'
      });
    }
  };

  const handleImportSampleBankStatement = () => {
    const sampleImportLines: BankStatementLine[] = [
      { id: `bs-imp-${Date.now()}-1`, date: '2026-07-21', refNo: 'BS-POS-998', description: 'مقبوضات مبيعات POS شبكة البنك - فرع الدقي', deposit: 42500, withdrawal: 0, bankName: importBankName, matchStatus: 'unmatched' },
      { id: `bs-imp-${Date.now()}-2`, date: '2026-07-22', refNo: 'BS-[#3390]', description: 'سداد فاتورة هاتف وإنترنت فرع الجيزة - سداد مباشر', deposit: 0, withdrawal: 3800, bankName: importBankName, matchStatus: 'unmatched' },
      { id: `bs-imp-${Date.now()}-3`, date: '2026-07-23', refNo: 'TR-REC-2026-002', description: 'إيداع نقدي أوراسكوم للإنشاءات - بورسعيد', deposit: 80000, withdrawal: 0, bankName: importBankName, matchStatus: 'unmatched' },
    ];

    setBankStatementLines([...sampleImportLines, ...bankStatementLines]);
    setShowImportModal(false);

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم استيراد كشف حساب البنك 📄' : 'Bank Statement Imported 📄',
        message: lang === 'ar'
          ? `تم استيراد ${sampleImportLines.length} حركات بنكية جديدة من ملف كشف حساب ${importBankName} بنجاح.`
          : `Imported ${sampleImportLines.length} new bank statement transactions for ${importBankName}.`,
        category: 'reply'
      });
    }
  };

  // Handlers for Future Cash Projection (Contracts & Invoices)
  const handleAddContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.title || !newContractForm.amount || !newContractForm.dueDate) return;

    const amt = parseFloat(newContractForm.amount);
    if (isNaN(amt) || amt <= 0) return;

    const newMilestone: ContractMilestone = {
      id: `cnt-${Date.now()}`,
      contractCode: newContractForm.contractCode || `CNT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newContractForm.title,
      partnerName: newContractForm.partnerName || 'عميل / مورد تعاقدي',
      amount: amt,
      dueDate: newContractForm.dueDate,
      type: newContractForm.type,
      probability: newContractForm.probability,
      status: 'pending',
      notes: newContractForm.notes,
      costCenterName: newContractForm.costCenterName
    };

    setContractMilestones([newMilestone, ...contractMilestones]);
    setShowAddContractModal(false);
    setNewContractForm({
      contractCode: '',
      title: '',
      partnerName: '',
      amount: '',
      dueDate: '',
      type: 'inflow',
      probability: 'high',
      notes: '',
      costCenterName: ''
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم إضافة استحقاق عقد جديد 📜' : 'New Contract Milestone Added 📜',
        message: lang === 'ar' 
          ? `تم إضافة مستخلص/دفعة عقد (${newMilestone.title}) بقيمة ${amt.toLocaleString()} ج.م بتاريخ استحقاق ${newMilestone.dueDate}`
          : `Added contract milestone (${newMilestone.title}) for EGP ${amt.toLocaleString()} due on ${newMilestone.dueDate}`,
        category: 'order'
      });
    }
  };

  const handleAddInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.partnerName || !newInvoiceForm.amount || !newInvoiceForm.dueDate) return;

    const amt = parseFloat(newInvoiceForm.amount);
    if (isNaN(amt) || amt <= 0) return;

    const newInv: PendingInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: newInvoiceForm.invoiceNo || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      partnerName: newInvoiceForm.partnerName,
      amount: amt,
      dueDate: newInvoiceForm.dueDate,
      type: newInvoiceForm.type,
      probability: newInvoiceForm.probability,
      status: 'unpaid',
      notes: newInvoiceForm.notes,
      costCenterName: newInvoiceForm.costCenterName
    };

    setPendingInvoices([newInv, ...pendingInvoices]);
    setShowAddInvoiceModal(false);
    setNewInvoiceForm({
      invoiceNo: '',
      partnerName: '',
      amount: '',
      dueDate: '',
      type: 'receivable',
      probability: 'high',
      notes: '',
      costCenterName: ''
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم تسجيل فاتورة جديدة بالتوقعات 🧾' : 'New Invoice Registered 🧾',
        message: lang === 'ar'
          ? `تم تسجيل فاتورة (${newInv.invoiceNo}) للشريك ${newInv.partnerName} بقيمة ${amt.toLocaleString()} ج.م بتاريخ ${newInv.dueDate}`
          : `Registered invoice (${newInv.invoiceNo}) for EGP ${amt.toLocaleString()} due on ${newInv.dueDate}`,
        category: 'order'
      });
    }
  };

  const handleDeleteContractMilestone = (id: string) => {
    setContractMilestones(contractMilestones.filter(c => c.id !== id));
  };

  const handleDeletePendingInvoice = (id: string) => {
    setPendingInvoices(pendingInvoices.filter(i => i.id !== id));
  };

  // Bank Reconciliation Calculations
  const filteredBankLines = bankStatementLines.filter(line => {
    const matchesBank = !selectedReconBank || line.bankName === selectedReconBank;
    const matchesSearch = !reconSearch || 
      line.refNo.toLowerCase().includes(reconSearch.toLowerCase()) ||
      line.description.toLowerCase().includes(reconSearch.toLowerCase());
    const matchesStatus = reconFilterStatus === 'all' || 
      (reconFilterStatus === 'matched' && line.matchStatus === 'matched') ||
      (reconFilterStatus === 'unmatched' && line.matchStatus === 'unmatched');

    return matchesBank && matchesSearch && matchesStatus;
  });

  const totalBankDeposits = filteredBankLines.reduce((acc, l) => acc + l.deposit, 0);
  const totalBankWithdrawals = filteredBankLines.reduce((acc, l) => acc + l.withdrawal, 0);
  const totalMatchedCount = filteredBankLines.filter(l => l.matchStatus === 'matched').length;
  const totalUnmatchedCount = filteredBankLines.filter(l => l.matchStatus === 'unmatched').length;
  const reconMatchPercentage = filteredBankLines.length > 0 ? Math.round((totalMatchedCount / filteredBankLines.length) * 100) : 100;

  // Cash Flow Forecast & Analysis calculations
  const todayStr = "2026-07-18";
  const todayDate = new Date(todayStr);
  const targetForecastDate = new Date(todayDate);
  targetForecastDate.setDate(targetForecastDate.getDate() + forecastDays);
  const targetDateStr = targetForecastDate.toISOString().split('T')[0];

  const pendingForecastChecks = checks.filter(c => {
    const isPending = c.status === 'portfolio' || c.status === 'deposited';
    const inRange = c.dueDate >= todayStr && c.dueDate <= targetDateStr;
    return isPending && inRange;
  });

  const forecastInflowChecks = pendingForecastChecks.filter(c => c.type === 'received').reduce((sum, c) => sum + c.amount, 0);
  const forecastOutflowChecks = pendingForecastChecks.filter(c => c.type === 'issued').reduce((sum, c) => sum + c.amount, 0);

  const forecastInflowTotal = totalCashIn + forecastInflowChecks;
  const forecastOutflowTotal = totalCashOut + forecastOutflowChecks;
  const forecastEndingCash = totalVaultCash + forecastInflowChecks - forecastOutflowChecks;
  const netGap = forecastInflowChecks - forecastOutflowChecks;

  // -------------------------------------------------------------
  // FUTURE CASH PROJECTION (NEXT 3 MONTHS: Aug, Sep, Oct 2026)
  // -------------------------------------------------------------
  const getWeighted = (amt: number, prob: 'high' | 'medium' | 'low') => {
    if (!useWeightedProbability) return amt;
    if (prob === 'high') return amt * 0.95;
    if (prob === 'medium') return amt * 0.75;
    return amt * 0.50;
  };

  const monthsList = [
    { key: '2026-08', labelAr: 'شهر أغسطس 2026 (M1)', labelEn: 'August 2026 (M1)' },
    { key: '2026-09', labelAr: 'شهر سبتمبر 2026 (M2)', labelEn: 'September 2026 (M2)' },
    { key: '2026-10', labelAr: 'شهر أكتوبر 2026 (M3)', labelEn: 'October 2026 (M3)' },
  ];

  let cumulativeCashPos = totalVaultCash;

  const monthlyProjectionSummary = monthsList.map(m => {
    // Contracts
    const mContractsIn = contractMilestones
      .filter(c => c.type === 'inflow' && c.dueDate.startsWith(m.key) && c.status === 'pending')
      .reduce((sum, c) => sum + getWeighted(c.amount, c.probability), 0);

    const mContractsOut = contractMilestones
      .filter(c => c.type === 'outflow' && c.dueDate.startsWith(m.key) && c.status === 'pending')
      .reduce((sum, c) => sum + getWeighted(c.amount, c.probability), 0);

    // Invoices
    const mInvoicesIn = pendingInvoices
      .filter(i => i.type === 'receivable' && i.dueDate.startsWith(m.key) && i.status === 'unpaid')
      .reduce((sum, i) => sum + getWeighted(i.amount, i.probability), 0);

    const mInvoicesOut = pendingInvoices
      .filter(i => i.type === 'payable' && i.dueDate.startsWith(m.key) && i.status === 'unpaid')
      .reduce((sum, i) => sum + getWeighted(i.amount, i.probability), 0);

    // Checks
    const mChecksIn = checks
      .filter(c => c.type === 'received' && (c.status === 'portfolio' || c.status === 'deposited') && c.dueDate.startsWith(m.key))
      .reduce((sum, c) => sum + c.amount, 0);

    const mChecksOut = checks
      .filter(c => c.type === 'issued' && (c.status === 'portfolio' || c.status === 'deposited') && c.dueDate.startsWith(m.key))
      .reduce((sum, c) => sum + c.amount, 0);

    const totalIn = (includeContracts ? mContractsIn : 0) + (includeInvoices ? mInvoicesIn : 0) + (includeChecksIn3Month ? mChecksIn : 0);
    const totalOut = (includeContracts ? mContractsOut : 0) + (includeInvoices ? mInvoicesOut : 0) + (includeChecksIn3Month ? mChecksOut : 0);

    const netMonth = totalIn - totalOut;
    cumulativeCashPos += netMonth;

    return {
      monthKey: m.key,
      monthLabelAr: m.labelAr,
      monthLabelEn: m.labelEn,
      contractsIn: mContractsIn,
      contractsOut: mContractsOut,
      invoicesIn: mInvoicesIn,
      invoicesOut: mInvoicesOut,
      checksIn: mChecksIn,
      checksOut: mChecksOut,
      totalIn,
      totalOut,
      netMonth,
      endingCash: cumulativeCashPos
    };
  });

  const total3MonthInflow = monthlyProjectionSummary.reduce((sum, m) => sum + m.totalIn, 0);
  const total3MonthOutflow = monthlyProjectionSummary.reduce((sum, m) => sum + m.totalOut, 0);
  const grand3MonthNet = total3MonthInflow - total3MonthOutflow;
  const grand3MonthEndingCash = totalVaultCash + grand3MonthNet;

  // -------------------------------------------------------------
  // DAILY LIQUIDITY SNAPSHOT (24H / 48H / 72H)
  // -------------------------------------------------------------
  const snapshotDaysLimit = snapshotHours === 24 ? 1 : snapshotHours === 48 ? 2 : 3;

  const snapshotObligations = checks
    .filter(c => c.type === 'issued' && c.status === 'portfolio' && getDaysDiff(c.dueDate) <= snapshotDaysLimit)
    .map(c => ({
      id: c.id,
      title: `شيك صادر برقم ${c.checkNo} - ${c.bankName}`,
      partner: c.partnerName,
      amount: c.amount,
      dueDate: c.dueDate,
      typeCategory: 'check_issued' as const,
      diffDays: getDaysDiff(c.dueDate),
      rawItem: c
    }))
    .concat(
      pendingInvoices
        .filter(inv => inv.type === 'payable' && inv.status === 'unpaid' && getDaysDiff(inv.dueDate) <= snapshotDaysLimit)
        .map(inv => ({
          id: inv.id,
          title: `فاتورة سداد/مشتريات رقم ${inv.invoiceNo}`,
          partner: inv.partnerName,
          amount: inv.amount,
          dueDate: inv.dueDate,
          typeCategory: 'invoice_payable' as const,
          diffDays: getDaysDiff(inv.dueDate),
          rawItem: inv
        }))
    )
    .concat(
      contractMilestones
        .filter(cnt => cnt.type === 'outflow' && cnt.status === 'pending' && getDaysDiff(cnt.dueDate) <= snapshotDaysLimit)
        .map(cnt => ({
          id: cnt.id,
          title: `التزام تعاقدي/مستخلص: ${cnt.title}`,
          partner: cnt.partnerName,
          amount: cnt.amount,
          dueDate: cnt.dueDate,
          typeCategory: 'contract_outflow' as const,
          diffDays: getDaysDiff(cnt.dueDate),
          rawItem: cnt
        }))
    );

  const snapshotReceipts = checks
    .filter(c => c.type === 'received' && (c.status === 'portfolio' || c.status === 'deposited') && getDaysDiff(c.dueDate) <= snapshotDaysLimit)
    .map(c => ({
      id: c.id,
      title: `شيك وارد رقم ${c.checkNo} (${c.status === 'deposited' ? 'برسم المقاصة' : 'في المحفظة'})`,
      partner: c.partnerName,
      amount: c.amount,
      dueDate: c.dueDate,
      typeCategory: 'check_received' as const,
      diffDays: getDaysDiff(c.dueDate),
      rawItem: c
    }))
    .concat(
      pendingInvoices
        .filter(inv => inv.type === 'receivable' && inv.status === 'unpaid' && getDaysDiff(inv.dueDate) <= snapshotDaysLimit)
        .map(inv => ({
          id: inv.id,
          title: `فاتورة تحصيل مبيعات رقم ${inv.invoiceNo}`,
          partner: inv.partnerName,
          amount: inv.amount,
          dueDate: inv.dueDate,
          typeCategory: 'invoice_receivable' as const,
          diffDays: getDaysDiff(inv.dueDate),
          rawItem: inv
        }))
    )
    .concat(
      contractMilestones
        .filter(cnt => cnt.type === 'inflow' && cnt.status === 'pending' && getDaysDiff(cnt.dueDate) <= snapshotDaysLimit)
        .map(cnt => ({
          id: cnt.id,
          title: `مستخلص تعاقدي وارد: ${cnt.title}`,
          partner: cnt.partnerName,
          amount: cnt.amount,
          dueDate: cnt.dueDate,
          typeCategory: 'contract_inflow' as const,
          diffDays: getDaysDiff(cnt.dueDate),
          rawItem: cnt
        }))
    );

  const totalSnapshotObligations = snapshotObligations.reduce((acc, i) => acc + i.amount, 0);
  const totalSnapshotReceipts = snapshotReceipts.reduce((acc, i) => acc + i.amount, 0);

  const effectiveAvailableCash = totalVaultCash;
  const netSnapshotPosition = effectiveAvailableCash + totalSnapshotReceipts - totalSnapshotObligations;
  const netLiquidityAfterBuffer = netSnapshotPosition - snapshotSafetyBuffer;
  const coverageRatio = totalSnapshotObligations > 0 ? (effectiveAvailableCash / totalSnapshotObligations) * 100 : 100;

  const isDeficit = netSnapshotPosition < 0 || coverageRatio < 100;
  const isWarning = !isDeficit && (coverageRatio < 125 || netLiquidityAfterBuffer < 0);

  const handleTriggerInstantAlert = () => {
    if (!onAddNotification) return;

    if (isDeficit) {
      onAddNotification({
        title: lang === 'ar' ? `🚨 تنبيه حرج: عجز سيولة متوقع خلال ${snapshotHours} ساعة!` : `🚨 CRITICAL: Liquidity Deficit in ${snapshotHours}h!`,
        message: lang === 'ar'
          ? `رصيد الخزينة المتاح (${effectiveAvailableCash.toLocaleString()} ج.م) غير كافٍ لتغطية الالتزامات المستحقة خلال الـ ${snapshotHours} ساعة القادمة (${totalSnapshotObligations.toLocaleString()} ج.م). العجز المرتقب: ${Math.abs(netSnapshotPosition).toLocaleString()} ج.م!`
          : `Available vault cash (${effectiveAvailableCash.toLocaleString()} EGP) is insufficient for ${snapshotHours}h obligations (${totalSnapshotObligations.toLocaleString()} EGP). Shortfall: ${Math.abs(netSnapshotPosition).toLocaleString()} EGP!`,
        category: 'alert'
      });
    } else if (isWarning) {
      onAddNotification({
        title: lang === 'ar' ? `⚠️ تحذير سيولة: هامش التغطية ضيق للـ ${snapshotHours} ساعة القادمة` : `⚠️ Liquidity Notice: Tight Margin for ${snapshotHours}h`,
        message: lang === 'ar'
          ? `نسبة تغطية السيولة هي ${coverageRatio.toFixed(1)}%. صافي الفائض المتبقي بعد هامش الأمان (${snapshotSafetyBuffer.toLocaleString()} ج.م) هو ${netLiquidityAfterBuffer.toLocaleString()} ج.م.`
          : `Coverage ratio is ${coverageRatio.toFixed(1)}%. Net surplus after safety buffer (${snapshotSafetyBuffer.toLocaleString()} EGP) is ${netLiquidityAfterBuffer.toLocaleString()} EGP.`,
        category: 'task'
      });
    } else {
      onAddNotification({
        title: lang === 'ar' ? `🟢 تقرير لقطة السيولة: حالة ممتازة ومغطاة بالكامل` : `🟢 Daily Liquidity Snapshot: Full Coverage`,
        message: lang === 'ar'
          ? `رصيد الخزينة (${effectiveAvailableCash.toLocaleString()} ج.م) يغطي كافة التزامات الـ ${snapshotHours} ساعة القادمة بالكامل مع صافي فائض مريح قدره ${netSnapshotPosition.toLocaleString()} ج.م.`
          : `Available cash (${effectiveAvailableCash.toLocaleString()} EGP) fully covers all ${snapshotHours}h obligations with a surplus of ${netSnapshotPosition.toLocaleString()} EGP.`,
        category: 'reply'
      });
    }
  };

  const handleQuickDeferObligation = (item: { id: string; typeCategory: string; dueDate: string }) => {
    const current = new Date(item.dueDate);
    current.setDate(current.getDate() + 3);
    const newDueDateStr = current.toISOString().split('T')[0];

    if (item.typeCategory === 'check_issued' || item.typeCategory === 'check_received') {
      setChecks(prev => prev.map(c => c.id === item.id ? { ...c, dueDate: newDueDateStr } : c));
    } else if (item.typeCategory === 'invoice_payable' || item.typeCategory === 'invoice_receivable') {
      setPendingInvoices(prev => prev.map(inv => inv.id === item.id ? { ...inv, dueDate: newDueDateStr } : inv));
    } else if (item.typeCategory === 'contract_outflow' || item.typeCategory === 'contract_inflow') {
      setContractMilestones(prev => prev.map(cnt => cnt.id === item.id ? { ...cnt, dueDate: newDueDateStr } : cnt));
    }

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تمت إعادة جدولة الالتزام 🗓️' : 'Obligation Rescheduled 🗓️',
        message: lang === 'ar'
          ? `تم ترحيل تاريخ استحقاق البند إلى ${newDueDateStr} لتفادي الضغط النقدي اليومي بنجاح.`
          : `Deferred due date to ${newDueDateStr} to relieve daily cash pressure.`,
        category: 'reply'
      });
    }
  };

  const handleAddEmergencyObligationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(emergencyObligationForm.amount);
    if (!emergencyObligationForm.title || isNaN(amt) || amt <= 0) return;

    if (emergencyObligationForm.type === 'check_issued') {
      const newChk: CheckRecord = {
        id: `chk-${Date.now()}`,
        checkNo: `CK-URG-${Math.floor(1000 + Math.random() * 9000)}`,
        bankName: 'البنك الأهلي المصري',
        dueDate: emergencyObligationForm.dueDate || '2026-07-25',
        amount: amt,
        type: 'issued',
        partnerName: emergencyObligationForm.partnerName || 'التزام طوارئ تشغيلي',
        status: 'portfolio',
        notes: emergencyObligationForm.notes || 'شيك طوارئ 24 ساعة',
        costCenterName: 'الخزينة والسيولة المركزية'
      };
      setChecks(prev => [newChk, ...prev]);
    } else if (emergencyObligationForm.type === 'invoice_payable') {
      const newInv: PendingInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNo: `INV-URG-${Math.floor(100 + Math.random() * 900)}`,
        partnerName: emergencyObligationForm.partnerName || 'مورد طوارئ',
        amount: amt,
        dueDate: emergencyObligationForm.dueDate || '2026-07-25',
        type: 'payable',
        probability: 'high',
        status: 'unpaid',
        notes: emergencyObligationForm.notes || 'فاتورة مستحقة الدفع 24 ساعة',
        costCenterName: 'الخزينة والسيولة المركزية'
      };
      setPendingInvoices(prev => [newInv, ...prev]);
    } else {
      const newCnt: ContractMilestone = {
        id: `cnt-${Date.now()}`,
        contractCode: `CNT-URG-${Math.floor(100 + Math.random() * 900)}`,
        title: emergencyObligationForm.title,
        partnerName: emergencyObligationForm.partnerName || 'مقاول / شريك',
        amount: amt,
        dueDate: emergencyObligationForm.dueDate || '2026-07-25',
        type: 'outflow',
        probability: 'high',
        status: 'pending',
        notes: emergencyObligationForm.notes || 'مستخلص مستحق خلال 24 ساعة',
        costCenterName: 'الخزينة والسيولة المركزية'
      };
      setContractMilestones(prev => [newCnt, ...prev]);
    }

    setShowAddEmergencyObligationModal(false);
    setEmergencyObligationForm({
      title: '',
      partnerName: '',
      amount: '',
      type: 'check_issued',
      dueDate: '2026-07-25',
      notes: ''
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم إضافة التزام طوارئ جديد ⚠️' : 'Emergency Obligation Added ⚠️',
        message: lang === 'ar'
          ? `تم إدراج التزام بقيمة ${amt.toLocaleString()} ج.م يستحق خلال الـ 24 ساعة القادمة.`
          : `Added emergency obligation of EGP ${amt.toLocaleString()} due in 24 hours.`,
        category: 'alert'
      });
    }
  };

  // Multi-Treasury Inter-Vault Transfer Handler
  const handleExecuteInterVaultTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert(lang === 'ar' ? 'برجاء إدخال مبلغ تحويل صحيح أكبر من الصفر' : 'Please enter a valid transfer amount');
      return;
    }

    if (transferForm.fromVaultId === transferForm.toVaultId) {
      alert(lang === 'ar' ? 'لا يمكن التحويل من وإلى نفس الخزينة!' : 'Source and destination treasury cannot be the same!');
      return;
    }

    const sourceVault = vaults.find((v: any) => v.id === transferForm.fromVaultId);
    const targetVault = vaults.find((v: any) => v.id === transferForm.toVaultId);

    if (!sourceVault || !targetVault) {
      alert(lang === 'ar' ? 'الخزينة غير موجودة!' : 'Treasury not found!');
      return;
    }

    if (sourceVault.balance < amt) {
      alert(lang === 'ar' 
        ? `عفواً، رصيد الخزينة المصدر (${sourceVault.nameAr}) البالغ (${sourceVault.balance.toLocaleString()} ج.م) لا يكفي لإتمام تحويل (${amt.toLocaleString()} ج.م)`
        : `Insufficient balance in ${sourceVault.nameAr}! Available: ${sourceVault.balance.toLocaleString()}`
      );
      return;
    }

    const transferNo = `TRF-2026-${Math.floor(100 + Math.random() * 900)}`;
    const journalNo = `JV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update Vault Balances
    setVaults((prev: any[]) => prev.map(v => {
      if (v.id === sourceVault.id) {
        return { ...v, balance: v.balance - amt };
      }
      if (v.id === targetVault.id) {
        return { ...v, balance: v.balance + amt };
      }
      return v;
    }));

    // Record double transactions in general treasury statement
    const txOut: TreasuryTransaction = {
      id: `tx-out-${Date.now()}`,
      docNo: `${transferNo}-OUT`,
      date: transferForm.date || '2026-07-25',
      type: 'cash_out',
      amount: amt,
      vaultId: sourceVault.id,
      vaultName: sourceVault.nameAr,
      recipientOrPayer: targetVault.nameAr,
      description: `تحويل نقدي صادر بين الخزائن إلى ${targetVault.nameAr} - ${transferForm.notes || ''}`,
      category: 'expense',
      costCenterName: 'الإدارة المالية المركزية'
    };

    const txIn: TreasuryTransaction = {
      id: `tx-in-${Date.now()}`,
      docNo: `${transferNo}-IN`,
      date: transferForm.date || '2026-07-25',
      type: 'cash_in',
      amount: amt,
      vaultId: targetVault.id,
      vaultName: targetVault.nameAr,
      recipientOrPayer: sourceVault.nameAr,
      description: `تحويل نقدي وارد بين الخزائن من ${sourceVault.nameAr} - ${transferForm.notes || ''}`,
      category: 'revenue',
      costCenterName: 'الإدارة المالية المركزية'
    };

    setTransactions(prev => [txOut, txIn, ...prev]);

    // Record Inter-Treasury Transfer
    const newTransfer: InterTreasuryTransfer = {
      id: `trf-${Date.now()}`,
      transferNo,
      date: transferForm.date || '2026-07-25',
      fromVaultId: sourceVault.id,
      fromVaultName: sourceVault.nameAr,
      toVaultId: targetVault.id,
      toVaultName: targetVault.nameAr,
      amount: amt,
      currency: sourceVault.currency || 'EGP',
      notes: transferForm.notes || 'تحويل نقدية بين الخزائن',
      referenceVoucher: transferForm.referenceVoucher || `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
      createdBy: currentUser?.fullName || 'أحمد سليمان (مدير الخزينة)',
      journalVoucherNo: journalNo,
      status: 'completed'
    };

    setInterVaultTransfers(prev => [newTransfer, ...prev]);

    // Record Journal Voucher Entry (توثيق القيد المزدوَج في دفتر اليومية)
    const newJournal: JournalEntry = {
      id: `jv-${Date.now()}`,
      entryNo: journalNo,
      date: transferForm.date || '2026-07-25',
      description: `إثبات تحويل نقدية بين الخزائن من (${sourceVault.nameAr}) إلى (${targetVault.nameAr})`,
      sourceDocType: 'inter_treasury_transfer',
      sourceDocNo: transferNo,
      debitAccount: `حـ/ ${targetVault.nameAr} (${targetVault.code || '1101'})`,
      debitAmount: amt,
      creditAccount: `حـ/ ${sourceVault.nameAr} (${sourceVault.code || '1101'})`,
      creditAmount: amt,
      costCenter: 'الإدارة المالية المركزية',
      createdBy: currentUser?.fullName || 'مدير الخزينة'
    };

    setJournalEntries(prev => [newJournal, ...prev]);

    setShowTransferModal(false);
    setTransferForm({
      fromVaultId: 'v1',
      toVaultId: 'v3',
      amount: '',
      date: '2026-07-25',
      notes: '',
      referenceVoucher: ''
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم تحويل النقدية وتوثيق القيد بنجاح 🔄' : 'Transfer & Journal Entry Logged 🔄',
        message: lang === 'ar'
          ? `تم تحويل مبلغ ${amt.toLocaleString()} ج.م من (${sourceVault.nameAr}) إلى (${targetVault.nameAr}) وتوثيق القيد المحاسبي رقم ${journalNo} في دفتر اليومية.`
          : `Transferred EGP ${amt.toLocaleString()} from ${sourceVault.nameAr} to ${targetVault.nameAr}. Journal Voucher No: ${journalNo}`,
        category: 'reply'
      });
    }
  };

  // Add Vault Handler
  const handleAddVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVaultForm.nameAr) return;

    const initialBal = parseFloat(addVaultForm.initialBalance) || 0;
    const newVault = {
      id: `v-${Date.now()}`,
      nameAr: addVaultForm.nameAr,
      nameEn: addVaultForm.nameEn || addVaultForm.nameAr,
      balance: initialBal,
      currency: addVaultForm.currency || 'EGP',
      type: addVaultForm.type || 'project',
      manager: addVaultForm.manager || currentUser?.fullName || 'أمين الخزينة',
      code: addVaultForm.code || `VLT-${Math.floor(100 + Math.random() * 900)}`,
      location: addVaultForm.location || 'موقع الشركة'
    };

    setVaults((prev: any[]) => [...prev, newVault]);
    setShowAddVaultModal(false);
    setAddVaultForm({
      nameAr: '',
      nameEn: '',
      code: '',
      type: 'project',
      currency: 'EGP',
      initialBalance: '',
      manager: '',
      location: ''
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تمت إضافة خزينة / عهدة جديدة 🏛️' : 'New Vault Created 🏛️',
        message: lang === 'ar'
          ? `تم اعتماد الخزينة (${newVault.nameAr}) برصيد افتتاحي قدره ${initialBal.toLocaleString()} ج.م`
          : `Created vault ${newVault.nameAr} with opening balance EGP ${initialBal.toLocaleString()}`,
        category: 'reply'
      });
    }
  };

  // Handler for registration of new post-dated check
  const handlePdcRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(pdcRegisterForm.amount);
    if (!pdcRegisterForm.checkNo || !pdcRegisterForm.partnerName || isNaN(amt) || amt <= 0) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم الشيك، اسم الطرف الآخر، والمبلغ بشكل صحيح' : 'Please enter valid check number, partner name and amount');
      return;
    }

    const targetVaultObj = vaults.find((v: any) => v.id === pdcRegisterForm.targetVaultId);
    const ccObj = costCenters.find((c: any) => c.id === pdcRegisterForm.costCenterId);

    const newPdc: CheckRecord = {
      id: `chk-pdc-${Date.now()}`,
      checkNo: pdcRegisterForm.checkNo,
      bankName: pdcRegisterForm.bankName,
      dueDate: pdcRegisterForm.dueDate,
      amount: amt,
      type: pdcRegisterForm.type,
      partnerName: pdcRegisterForm.partnerName,
      status: 'portfolio',
      notes: pdcRegisterForm.notes || 'شيك آجل مسجل بمحفظة الشركة',
      issueDate: pdcRegisterForm.issueDate,
      accountNo: pdcRegisterForm.accountNo,
      autoCollect: pdcRegisterForm.autoCollect,
      targetVaultId: pdcRegisterForm.targetVaultId,
      targetVaultName: targetVaultObj?.nameAr || 'الخزينة الرئيسية',
      drawerName: pdcRegisterForm.drawerName || pdcRegisterForm.partnerName,
      beneficiaryName: pdcRegisterForm.beneficiaryName || 'شركة مصر للأوناش',
      costCenterId: pdcRegisterForm.costCenterId,
      costCenterName: ccObj?.nameAr || ''
    };

    setChecks(prev => [newPdc, ...prev]);
    setShowPdcRegisterModal(false);

    setPdcRegisterForm({
      checkNo: '',
      bankName: 'البنك الأهلي المصري',
      accountNo: '',
      issueDate: '2026-07-25',
      dueDate: '2026-08-10',
      amount: '',
      type: 'received',
      partnerName: '',
      drawerName: '',
      beneficiaryName: '',
      targetVaultId: vaults[0]?.id || 'v1',
      autoCollect: true,
      costCenterId: costCenters[0]?.id || '',
      notes: ''
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم تسجيل شيك آجل جديد بنجاح 📑' : 'New Post-Dated Check Registered 📑',
        message: lang === 'ar'
          ? `تم تسليم وتسجيل شيك آجل رقم ${newPdc.checkNo} بقيمة ${amt.toLocaleString()} ج.م يستحق في ${newPdc.dueDate} لـ ${newPdc.partnerName}`
          : `Registered PDC No ${newPdc.checkNo} for EGP ${amt.toLocaleString()} due on ${newPdc.dueDate}`,
        category: 'reply'
      });
    }
  };

  // Handler for running automated check collection engine
  const handleRunAutoCollection = () => {
    // Finds active checks that are due on/before today or flagged autoCollect
    const dueForAutoCollect = checks.filter(c => 
      (c.status === 'portfolio' || c.status === 'deposited') &&
      (c.autoCollect || getDaysDiff(c.dueDate) <= 0)
    );

    if (dueForAutoCollect.length === 0) {
      alert(lang === 'ar' ? 'لا توجد شيكات مؤجلة مستحقة للتحصيل التلقائي اليوم!' : 'No post-dated checks due for auto-collection today!');
      return;
    }

    let totalCollected = 0;
    const nowStr = new Date().toISOString().split('T')[0];

    // Update checks status to cashed
    setChecks(prev => prev.map(c => {
      if (dueForAutoCollect.some(d => d.id === c.id)) {
        totalCollected += c.amount;
        return { 
          ...c, 
          status: 'cashed', 
          notes: (c.notes ? c.notes + ' - ' : '') + '(تم التحصيل والتسوية آلياً بموعد الاستحقاق 🤖)' 
        };
      }
      return c;
    }));

    // Create Treasury Transactions & Update Vaults
    dueForAutoCollect.forEach(chk => {
      const targetVault = vaults.find((v: any) => v.id === chk.targetVaultId) || vaults[0];
      const isIncoming = chk.type === 'received';

      const newTx: TreasuryTransaction = {
        id: `tx-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        docNo: `TR-AUTO-${chk.checkNo}`,
        date: nowStr,
        type: isIncoming ? 'cash_in' : 'cash_out',
        amount: chk.amount,
        vaultId: targetVault?.id || 'v1',
        vaultName: targetVault?.nameAr || 'الخزينة الرئيسية',
        recipientOrPayer: chk.partnerName,
        description: isIncoming 
          ? `تحصيل تلقائي آلي لشيك آجل رقم ${chk.checkNo} مسحوب على ${chk.bankName}`
          : `صرف تلقائي آلي لشيك آجل مسحوب رقم ${chk.checkNo} لصالح ${chk.partnerName}`,
        category: isIncoming ? 'customer_payment' : 'supplier_payment',
        costCenterName: chk.costCenterName || 'الخزينة والسيولة المركزية'
      };

      setTransactions(tPrev => [newTx, ...tPrev]);

      if (targetVault) {
        setVaults((vPrev: any[]) => vPrev.map(v => {
          if (v.id === targetVault.id) {
            return {
              ...v,
              balance: isIncoming ? v.balance + chk.amount : v.balance - chk.amount
            };
          }
          return v;
        }));
      }

      // Generate Journal Entry
      const journalNo = `JV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
      const newJournal: JournalEntry = {
        id: `jv-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        entryNo: journalNo,
        date: nowStr,
        description: `تسوية وتحصيل تلقائي شيك آجل رقم ${chk.checkNo} - ${chk.partnerName}`,
        sourceDocType: 'check',
        sourceDocNo: chk.checkNo,
        debitAccount: isIncoming ? `حـ/ ${targetVault?.nameAr} (تحصيل شيك)` : `حـ/ الموردين والتزامات الشيكات`,
        debitAmount: chk.amount,
        creditAccount: isIncoming ? `حـ/ أوراق القبض والشيكات الآجلة` : `حـ/ ${targetVault?.nameAr} (صرف شيك)`,
        creditAmount: chk.amount,
        costCenter: chk.costCenterName || 'الإدارة المالية المركزية',
        createdBy: 'نظام التحصيل الآلي التلقائي 🤖'
      };

      setJournalEntries(jPrev => [newJournal, ...jPrev]);
    });

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تم تشغيل محرك التحصيل التلقائي للشيكات الآجلة 🤖' : 'Auto-Collection Engine Executed 🤖',
        message: lang === 'ar'
          ? `تم تحصيل وصرف ${dueForAutoCollect.length} شيكات آجلة بقيمة إجمالية ${totalCollected.toLocaleString()} ج.م وتحديث الخزائن والقيود المحاسبية.`
          : `Auto-collected ${dueForAutoCollect.length} checks totaling EGP ${totalCollected.toLocaleString()}.`,
        category: 'reply'
      });
    }

    alert(lang === 'ar'
      ? `🎉 تم تنفيذ التحصيل التلقائي بنجاح!\n• عدد الشيكات المحصلة: ${dueForAutoCollect.length}\n• المبلغ الإجمالي: ${totalCollected.toLocaleString()} ج.م\n• تم القيد في الخزينة واليومية العامة تلقائياً.`
      : `🎉 Auto-collection executed successfully for ${dueForAutoCollect.length} checks totaling EGP ${totalCollected.toLocaleString()}!`
    );
  };

  // Handler for Rescheduling PDC Due Date
  const handlePdcRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdcForReschedule) return;

    const oldDate = selectedPdcForReschedule.dueDate;
    const newDate = pdcRescheduleDate;
    const reason = pdcRescheduleReason || 'تأجيل وتمديد تاريخ التحصيل بناءً على اتفاق الشريكين';

    setChecks(prev => prev.map(c => {
      if (c.id === selectedPdcForReschedule.id) {
        const history = c.postponedHistory || [];
        return {
          ...c,
          dueDate: newDate,
          postponedHistory: [
            ...history,
            { oldDate, newDate, reason, date: new Date().toISOString().split('T')[0] }
          ]
        };
      }
      return c;
    }));

    setShowPdcRescheduleModal(false);
    setSelectedPdcForReschedule(null);
    setPdcRescheduleReason('');

    if (onAddNotification) {
      onAddNotification({
        title: lang === 'ar' ? 'تمت إعادة جدولة تاريخ استحقاق الشيك الآجل 🗓️' : 'PDC Rescheduled 🗓️',
        message: lang === 'ar'
          ? `تم تمديد تاريخ تحصيل الشيك رقم ${selectedPdcForReschedule.checkNo} من ${oldDate} إلى ${newDate}. السبب: ${reason}`
          : `Rescheduled PDC #${selectedPdcForReschedule.checkNo} from ${oldDate} to ${newDate}`,
        category: 'task'
      });
    }
  };

  // Monthly Projection Chart Data
  const monthlyChartData = monthlyProjectionSummary.map(m => ({
    name: lang === 'ar' ? m.monthLabelAr.split(' ')[1] + ' ' + m.monthLabelAr.split(' ')[2] : m.monthLabelEn,
    contractsIn: Math.round(m.contractsIn),
    contractsOut: Math.round(m.contractsOut),
    invoicesIn: Math.round(m.invoicesIn),
    invoicesOut: Math.round(m.invoicesOut),
    checksIn: Math.round(m.checksIn),
    checksOut: Math.round(m.checksOut),
    totalIn: Math.round(m.totalIn),
    totalOut: Math.round(m.totalOut),
    endingCash: Math.round(m.endingCash)
  }));

  // Consolidated Register Items for 3-Month Table
  const allProjectionItems = [
    ...contractMilestones.map(c => ({
      id: c.id,
      code: c.contractCode,
      title: c.title,
      partner: c.partnerName,
      amount: c.amount,
      weightedAmount: getWeighted(c.amount, c.probability),
      dueDate: c.dueDate,
      monthKey: c.dueDate.substring(0, 7),
      type: c.type === 'inflow' ? ('inflow' as const) : ('outflow' as const),
      source: 'contract' as const,
      sourceLabelAr: 'عقد / مستخلص 📜',
      sourceLabelEn: 'Contract Milestone',
      probability: c.probability,
      notes: c.notes || '',
      costCenter: c.costCenterName || '',
      status: c.status
    })),
    ...pendingInvoices.map(i => ({
      id: i.id,
      code: i.invoiceNo,
      title: `فاتورة ${i.type === 'receivable' ? 'مستحقة' : 'مورد'} - ${i.invoiceNo}`,
      partner: i.partnerName,
      amount: i.amount,
      weightedAmount: getWeighted(i.amount, i.probability),
      dueDate: i.dueDate,
      monthKey: i.dueDate.substring(0, 7),
      type: i.type === 'receivable' ? ('inflow' as const) : ('outflow' as const),
      source: 'invoice' as const,
      sourceLabelAr: 'فاتورة حالمة 🧾',
      sourceLabelEn: 'Active Invoice',
      probability: i.probability,
      notes: i.notes || '',
      costCenter: i.costCenterName || '',
      status: i.status
    }))
  ];

  const filteredProjectionItems = allProjectionItems.filter(item => {
    const matchesSearch = !projSearch || 
      item.code.toLowerCase().includes(projSearch.toLowerCase()) ||
      item.partner.toLowerCase().includes(projSearch.toLowerCase()) ||
      item.title.toLowerCase().includes(projSearch.toLowerCase());

    const matchesMonth = projMonthFilter === 'all' || item.monthKey === projMonthFilter;
    const matchesSource = projSourceFilter === 'all' || item.source === projSourceFilter;

    return matchesSearch && matchesMonth && matchesSource;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const export3MonthProjectionToCSV = () => {
    const headers = ['شهر الاستحقاق', 'نوع المصدر', 'كود/رقم المرجع', 'اسم المستخلص/الفاتورة', 'الشريك/العميل', 'تاريخ الاستحقاق', 'الاتجاه', 'نسبة الاحتمالية', 'المبلغ الاسمي (ج.م)', 'المبلغ الترجيحي (ج.م)', 'مركز التكلفة / الملاحظات'];
    const rows: string[][] = [];

    filteredProjectionItems.forEach(item => {
      rows.push([
        item.monthKey,
        item.sourceLabelAr,
        item.code,
        item.title.replace(/,/g, ' '),
        item.partner.replace(/,/g, ' '),
        item.dueDate,
        item.type === 'inflow' ? 'تدفق وارد (+)' : 'تدفق خارج (-)',
        item.probability === 'high' ? 'عالية (95%)' : item.probability === 'medium' ? 'متوسطة (75%)' : 'منخفضة (50%)',
        item.amount.toString(),
        item.weightedAmount.toString(),
        `${item.costCenter} - ${item.notes.replace(/,/g, ' ')}`
      ]);
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Future_Cash_Projection_3Months_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data generator for Recharts
  const chartFlowMap: Record<string, { date: string; displayDate: string; actualIn: number; actualOut: number; expectedIn: number; expectedOut: number; totalIn: number; totalOut: number; cumulative: number }> = {};
  
  let runningVal = totalVaultCash;
  for (let i = -3; i <= forecastDays; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const disp = `${d.getMonth() + 1}/${d.getDate()}`;
    chartFlowMap[dStr] = {
      date: dStr,
      displayDate: disp,
      actualIn: 0,
      actualOut: 0,
      expectedIn: 0,
      expectedOut: 0,
      totalIn: 0,
      totalOut: 0,
      cumulative: 0
    };
  }

  transactions.forEach(tx => {
    if (chartFlowMap[tx.date]) {
      if (tx.type === 'cash_in') chartFlowMap[tx.date].actualIn += tx.amount;
      else chartFlowMap[tx.date].actualOut += tx.amount;
    }
  });

  checks.forEach(chk => {
    if (chartFlowMap[chk.dueDate]) {
      if (chk.status === 'cashed') {
        if (chk.type === 'received') chartFlowMap[chk.dueDate].actualIn += chk.amount;
        else chartFlowMap[chk.dueDate].actualOut += chk.amount;
      } else if (chk.status === 'portfolio' || chk.status === 'deposited') {
        if (chk.type === 'received') chartFlowMap[chk.dueDate].expectedIn += chk.amount;
        else chartFlowMap[chk.dueDate].expectedOut += chk.amount;
      }
    }
  });

  const chartFlowData = Object.keys(chartFlowMap).sort().map(dateKey => {
    const item = chartFlowMap[dateKey];
    item.totalIn = item.actualIn + item.expectedIn;
    item.totalOut = item.actualOut + item.expectedOut;
    runningVal += (item.totalIn - item.totalOut);
    item.cumulative = runningVal;
    return item;
  });

  // Pie chart categories breakdown for Recharts
  const customerReceipts = transactions.filter(t => t.type === 'cash_in' && t.category === 'customer_payment').reduce((sum, t) => sum + t.amount, 0);
  const supplierPayments = transactions.filter(t => t.type === 'cash_out' && t.category === 'supplier_payment').reduce((sum, t) => sum + t.amount, 0);
  const opExpenses = transactions.filter(t => t.type === 'cash_out' && t.category === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const pieBreakdownData = [
    { name: lang === 'ar' ? 'تحصيلات عملاء فعلية' : 'Customer Receipts', value: customerReceipts || 150000, color: '#10b981' },
    { name: lang === 'ar' ? 'شيكات واردة متوقعة' : 'Expected Check In', value: forecastInflowChecks || 1200000, color: '#0F4C81' },
    { name: lang === 'ar' ? 'مدفوعات موردين' : 'Supplier Payments', value: supplierPayments || 25000, color: '#f59e0b' },
    { name: lang === 'ar' ? 'مصروفات وسلف مواقع' : 'Site Expenses', value: opExpenses || 37000, color: '#8b5cf6' },
    { name: lang === 'ar' ? 'شيكات صادرة متوقعة' : 'Expected Check Out', value: forecastOutflowChecks || 120000, color: '#f43f5e' }
  ];

  // Export CSV function
  const exportCashFlowToCSV = () => {
    const headers = ['التاريخ', 'رقم السند/الشيك', 'الجهة/الطرف', 'النوع', 'الحالة', 'الوارد (ج.م)', 'المنصرف (ج.م)', 'ملاحظات/مركز التكلفة'];
    const rows: string[][] = [];

    transactions.forEach(t => {
      rows.push([
        t.date,
        t.docNo,
        t.recipientOrPayer.replace(/,/g, ' '),
        t.type === 'cash_in' ? 'سند قبض نقدي' : 'سند صرف نقدي',
        'فعلي بالخزينة',
        t.type === 'cash_in' ? t.amount.toString() : '0',
        t.type === 'cash_out' ? t.amount.toString() : '0',
        `${t.costCenterName || ''} - ${t.description.replace(/,/g, ' ')}`
      ]);
    });

    checks.forEach(c => {
      rows.push([
        c.dueDate,
        `شيك ${c.checkNo}`,
        c.partnerName.replace(/,/g, ' '),
        c.type === 'received' ? 'شيك وارد (قبض)' : 'شيك صادر (دفع)',
        c.status === 'cashed' ? 'تم تحصيله (فعلي)' : c.status === 'portfolio' ? 'بالمحفظة (متوقع)' : c.status === 'deposited' ? 'برسم التحصيل (متوقع)' : 'مرفوض',
        c.type === 'received' ? c.amount.toString() : '0',
        c.type === 'issued' ? c.amount.toString() : '0',
        `${c.bankName} - ${c.notes ? c.notes.replace(/,/g, ' ') : ''}`
      ]);
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cash_Flow_Analysis_${forecastDays}Days_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detailed Table Rows
  const forecastCombinedRows: any[] = [];

  transactions.forEach(t => {
    forecastCombinedRows.push({
      id: t.id,
      date: t.date,
      typeLabel: t.type === 'cash_in' ? (lang === 'ar' ? 'سند قبض نقدي' : 'Cash Receipt') : (lang === 'ar' ? 'سند صرف نقدي' : 'Cash Payment'),
      refNo: t.docNo,
      partner: t.recipientOrPayer,
      statusText: lang === 'ar' ? 'فعلي بالخزينة' : 'Actual Vault',
      statusClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      flowType: t.type === 'cash_in' ? 'in' : 'out',
      amount: t.amount,
      costCenter: t.costCenterName,
      notes: t.description,
      isCheck: false
    });
  });

  checks.forEach(c => {
    const isCheckIn = c.type === 'received';
    let stText = lang === 'ar' ? 'بالمحفظة (متوقع)' : 'Portfolio (Expected)';
    let stClass = 'bg-amber-50 text-amber-700 border border-amber-100';

    if (c.status === 'deposited') {
      stText = lang === 'ar' ? 'برسم التحصيل (متوقع)' : 'Deposited (Expected)';
      stClass = 'bg-blue-50 text-blue-700 border border-blue-100';
    } else if (c.status === 'cashed') {
      stText = lang === 'ar' ? 'تم تحصيله (فعلي)' : 'Cashed (Actual)';
      stClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    } else if (c.status === 'bounced') {
      stText = lang === 'ar' ? 'مرفوض (معلق)' : 'Bounced (Pending)';
      stClass = 'bg-rose-50 text-rose-700 border border-rose-100';
    }

    forecastCombinedRows.push({
      id: c.id,
      date: c.dueDate,
      typeLabel: isCheckIn ? (lang === 'ar' ? 'شيك وارد (قبض)' : 'Received Check') : (lang === 'ar' ? 'شيك صادر (دفع)' : 'Issued Check'),
      refNo: c.checkNo,
      partner: c.partnerName,
      statusText: stText,
      statusClass: stClass,
      flowType: isCheckIn ? 'in' : 'out',
      amount: c.amount,
      costCenter: c.costCenterName,
      notes: `${c.bankName} - ${c.notes || ''}`,
      isCheck: true
    });
  });

  const forecastTableRows = forecastCombinedRows.filter(r => {
    const matchesSearch = !forecastSearch || 
      r.refNo.toLowerCase().includes(forecastSearch.toLowerCase()) ||
      r.partner.toLowerCase().includes(forecastSearch.toLowerCase()) ||
      r.notes.toLowerCase().includes(forecastSearch.toLowerCase());

    const matchesType = forecastTypeFilter === 'all' || 
      (forecastTypeFilter === 'received' && r.flowType === 'in') ||
      (forecastTypeFilter === 'issued' && r.flowType === 'out');

    return matchesSearch && matchesType;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 font-sans text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Landmark className="w-6.5 h-6.5 text-[#0F4C81]" />
            <span>{t('title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
          <button
            onClick={() => { setActiveTab('treasury'); setSearchTerm(''); setCategoryFilter('all'); setTypeFilter('all'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'treasury' 
                ? 'bg-white text-[#0F4C81] shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {t('treasury_tab')}
          </button>
          <button
            onClick={() => { setActiveTab('multi_treasury'); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'multi_treasury' 
                ? 'bg-[#0F4C81] text-white shadow-xs' 
                : 'text-slate-700 hover:text-slate-900 font-extrabold'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'لوحة الخزائن والتحويلات 🏛️' : 'Multi-Treasury Dashboard 🏛️'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('checks'); setSearchTerm(''); setCategoryFilter('all'); setTypeFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'checks' 
                ? 'bg-white text-[#0F4C81] shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {t('checks_tab')}
          </button>
          <button
            onClick={() => { setActiveTab('cost_centers'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cost_centers' 
                ? 'bg-white text-[#0F4C81] shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {lang === 'ar' ? 'ربحية مراكز التكلفة 📊' : 'Cost Centers Profitability 📊'}
          </button>
          <button
            onClick={() => { setActiveTab('trial_balance'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'trial_balance' 
                ? 'bg-white text-[#0F4C81] shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {lang === 'ar' ? 'ميزان المراجعة والمطابقة ⚖️' : 'Trial Balance & Reconciliation ⚖️'}
          </button>
          <button
            onClick={() => { setActiveTab('liquidity_forecast'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'liquidity_forecast' 
                ? 'bg-white text-[#0F4C81] shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {lang === 'ar' ? 'توقعات تدفقات السيولة 📈' : 'Liquidity Flow Forecast 📈'}
          </button>
          <button
            onClick={() => { setActiveTab('bank_reconciliation'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bank_reconciliation' 
                ? 'bg-white text-[#0F4C81] shadow-xs' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {lang === 'ar' ? 'مطابقة كشوف البنوك 🏦' : 'Bank Reconciliation 🏦'}
          </button>
        </div>
      </div>

      {/* STATS BARS */}
      {activeTab === 'treasury' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-700">{t('total_liquidity')}</span>
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-950 mt-2 font-mono">
              {totalVaultCash.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700">{t('total_in')}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-950 mt-2 font-mono">
              + {totalCashIn.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-700">{t('total_out')}</span>
              <ArrowDownLeft className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-950 mt-2 font-mono">
              - {totalCashOut.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
          </div>
        </div>
      ) : activeTab === 'checks' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-2xl border border-amber-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-700">{t('checks_portfolio')}</span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-950 mt-2 font-mono">
              {checksPortfolioCount} <span className="text-xs text-slate-500">{lang === 'ar' ? 'شيكات' : 'Checks'}</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-2xl border border-emerald-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700">{t('checks_cashed')}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-950 mt-2 font-mono">
              {checksCashedCount} <span className="text-xs text-slate-500">{lang === 'ar' ? 'شيكات' : 'Checks'}</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-700">{t('checks_bounced')}</span>
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-950 mt-2 font-mono">
              {checksBouncedCount} <span className="text-xs text-slate-500">{lang === 'ar' ? 'شيكات' : 'Checks'}</span>
            </p>
          </div>
        </div>
      ) : activeTab === 'cost_centers' ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-50/50 to-white p-4 rounded-2xl border border-indigo-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-700">{lang === 'ar' ? 'إجمالي الموازنة العامة' : 'Total Budget'}</span>
              <Coins className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-950 mt-1 font-mono">
              {costCenters.reduce((sum, cc) => sum + cc.budget, 0).toLocaleString()} <span className="text-[10px] text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-indigo-600/75 block mt-1">
              {lang === 'ar' ? 'لكافة المشاريع ووحدات العمل' : 'For all units & projects'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-rose-50/50 to-white p-4 rounded-2xl border border-rose-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-700">{lang === 'ar' ? 'إجمالي المصروفات الفوقية' : 'Total Expenses / Outflow'}</span>
              <ArrowDownLeft className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-950 mt-1 font-mono">
              {costCenters.map(cc => {
                const cashOutLinked = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
                const checksOutLinked = checks.filter(c => c.costCenterId === cc.id && c.type === 'issued' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                return cashOutLinked + checksOutLinked;
              }).reduce((sum, val) => sum + val, 0).toLocaleString()} <span className="text-[10px] text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-rose-600/75 block mt-1">
              {lang === 'ar' ? 'المسحوبات النقدية والشيكات المصروفة' : 'Cash withdrawals & paid checks'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/50 to-white p-4 rounded-2xl border border-emerald-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700">{lang === 'ar' ? 'إجمالي التدفقات الواردة' : 'Total Revenues / Inflow'}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-emerald-950 mt-1 font-mono">
              {costCenters.map(cc => {
                const cashInLinked = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
                const checksInLinked = checks.filter(c => c.costCenterId === cc.id && c.type === 'received' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                return cashInLinked + checksInLinked;
              }).reduce((sum, val) => sum + val, 0).toLocaleString()} <span className="text-[10px] text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-emerald-600/75 block mt-1">
              {lang === 'ar' ? 'المقبوضات والشيكات المحصلة' : 'Receipts & cashed checks'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-blue-50/50 to-white p-4 rounded-2xl border border-blue-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-700">{lang === 'ar' ? 'صافي أرباح المشاريع' : 'Net Project Profits'}</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-blue-950 mt-1 font-mono">
              {(() => {
                let totalIn = 0;
                let totalOut = 0;
                costCenters.forEach(cc => {
                  const cashInLinked = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
                  const checksInLinked = checks.filter(c => c.costCenterId === cc.id && c.type === 'received' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                  totalIn += (cashInLinked + checksInLinked);

                  const cashOutLinked = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
                  const checksOutLinked = checks.filter(c => c.costCenterId === cc.id && c.type === 'issued' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                  totalOut += (cashOutLinked + checksOutLinked);
                });
                const net = totalIn - totalOut;
                return (
                  <span className={net >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {net.toLocaleString()} <span className="text-[10px] text-slate-500">ج.م</span>
                  </span>
                );
              })()}
            </p>
            <span className="text-[9px] text-blue-600/75 block mt-1">
              {lang === 'ar' ? 'الربح التشغيلي المباشر' : 'Direct operating profit'}
            </span>
          </div>
        </div>
      ) : activeTab === 'trial_balance' ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-50/80 to-white p-4 rounded-2xl border border-slate-200 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500">{lang === 'ar' ? 'الرصيد الافتتاحي (مدوّر)' : 'Opening Balance'}</span>
              <Coins className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">
              {trialOpeningBalance.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-slate-400 block mt-1">
              {lang === 'ar' ? `الرصيد الدفتري قبل تاريخ ${trialStartDate}` : `Before ${trialStartDate}`}
            </span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/80 to-white p-4 rounded-2xl border border-emerald-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700">{lang === 'ar' ? 'إجمالي المقبوضات (مدين)' : 'Total Debit'}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-950 mt-1 font-mono">
              + {trialPeriodDebits.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-emerald-600/75 block mt-1">
              {lang === 'ar' ? `خلال الفترة المحددة للتسوية` : `During selected range`}
            </span>
          </div>

          <div className="bg-gradient-to-br from-rose-50/80 to-white p-4 rounded-2xl border border-rose-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-700">{lang === 'ar' ? 'إجمالي المدفوعات (دائن)' : 'Total Credit'}</span>
              <ArrowDownLeft className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-xl font-black text-rose-950 mt-1 font-mono">
              - {trialPeriodCredits.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-rose-600/75 block mt-1">
              {lang === 'ar' ? `خلال الفترة المحددة للتسوية` : `During selected range`}
            </span>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/80 to-white p-4 rounded-2xl border border-indigo-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-700">{lang === 'ar' ? 'الرصيد الختامي للفترة' : 'Book Ending Balance'}</span>
              <Check className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">
              {trialEndingBalance.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-indigo-700/80 block mt-1">
              {lang === 'ar' ? `مطابق للدفاتر الإلكترونية` : `Fully reconciled book value`}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#0F4C81]/5 to-white p-4 rounded-2xl border border-[#0F4C81]/15 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#0F4C81]">{lang === 'ar' ? 'السيولة الحالية المتاحة' : 'Current Cash Liquidity'}</span>
              <Wallet className="w-5 h-5 text-[#0F4C81]" />
            </div>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">
              {totalVaultCash.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-[#0F4C81]/80 block mt-1">
              {lang === 'ar' ? 'إجمالي الأرصدة النقدية الفعلية بالخزائن' : 'Actual total physical cash on hand'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700">{lang === 'ar' ? 'مقبوضات شيكات متوقعة' : 'Expected Inflow (Checks)'}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-950 mt-1 font-mono">
              + {checks
                .filter(c => c.type === 'received' && (c.status === 'portfolio' || c.status === 'deposited'))
                .filter(c => {
                  const diff = getDaysDiff(c.dueDate);
                  return diff >= 0 && diff <= forecastDays;
                })
                .reduce((sum, c) => sum + c.amount, 0).toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-emerald-600 block mt-1">
              {lang === 'ar' ? `خلال الـ ${forecastDays} يوماً القادمة` : `Within next ${forecastDays} days`}
            </span>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-100 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-700">{lang === 'ar' ? 'مدفوعات شيكات متوقعة' : 'Expected Outflow (Checks)'}</span>
              <ArrowDownLeft className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-xl font-black text-rose-950 mt-1 font-mono">
              - {checks
                .filter(c => c.type === 'issued' && c.status === 'portfolio')
                .filter(c => {
                  const diff = getDaysDiff(c.dueDate);
                  return diff >= 0 && diff <= forecastDays;
                })
                .reduce((sum, c) => sum + c.amount, 0).toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
            </p>
            <span className="text-[9px] text-rose-600 block mt-1">
              {lang === 'ar' ? `تستحق خلال الـ ${forecastDays} يوماً القادمة` : `Due within next ${forecastDays} days`}
            </span>
          </div>

          {(() => {
            const dataList = (() => {
              const data = [];
              const start = new Date('2026-07-18');
              let cumulativeCash = totalVaultCash;
              for (let i = 0; i <= forecastDays; i++) {
                const current = new Date(start);
                current.setDate(start.getDate() + i);
                const dateStr = current.toISOString().split('T')[0];
                const dayInflows = checks
                  .filter(c => c.dueDate === dateStr && c.type === 'received' && (c.status === 'portfolio' || c.status === 'deposited'))
                  .reduce((sum, c) => sum + c.amount, 0);
                const dayOutflows = checks
                  .filter(c => c.dueDate === dateStr && c.type === 'issued' && c.status === 'portfolio')
                  .reduce((sum, c) => sum + c.amount, 0);
                cumulativeCash = cumulativeCash + dayInflows - dayOutflows;
                data.push({ projectedBalance: cumulativeCash });
              }
              return data;
            })();
            const minCash = dataList.length > 0 ? Math.min(...dataList.map(d => d.projectedBalance)) : totalVaultCash;
            const hasRisk = minCash < 0;

            return (
              <div className={`bg-gradient-to-br ${hasRisk ? 'from-amber-50 to-white border-amber-200' : 'from-blue-50 to-white border-blue-150'} p-4 rounded-2xl border shadow-3xs`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-black ${hasRisk ? 'text-amber-700' : 'text-blue-700'}`}>
                    {lang === 'ar' ? 'أدنى مستوى سيولة متوقع' : 'Min Projected Cash'}
                  </span>
                  <AlertTriangle className={`w-5 h-5 ${hasRisk ? 'text-amber-600 animate-pulse' : 'text-blue-500'}`} />
                </div>
                <p className={`text-xl font-black mt-1 font-mono ${minCash < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {minCash.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className={`text-[9px] font-bold block mt-1 ${hasRisk ? 'text-rose-600' : 'text-blue-600/75'}`}>
                  {hasRisk 
                    ? (lang === 'ar' ? '⚠️ خطر عجز نقدي مؤقت!' : '⚠️ Potential Cash Deficit!') 
                    : (lang === 'ar' ? '✅ السيولة آمنة ومستقرة' : '✅ Liquidity safe and stable')}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* DUE DATE ALERTS PANEL (ONLY ON CHECKS TAB) */}
      {activeTab === 'checks' && (() => {
        const alertsList = checks
          .filter(c => c.status !== 'cashed' && c.status !== 'bounced')
          .map(c => {
            const daysDiff = getDaysDiff(c.dueDate);
            return { check: c, daysDiff };
          })
          .filter(item => item.daysDiff <= 5)
          .sort((a, b) => a.daysDiff - b.daysDiff);

        if (alertsList.length === 0) return null;

        return (
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl shadow-3xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <h3 className="text-xs font-black text-slate-800">
                  {lang === 'ar' ? 'مركز مراقبة وإشعارات استحقاقات الشيكات العاجلة ⚠️' : 'Urgent Check Due Monitoring Center ⚠️'}
                </h3>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold px-2 py-0.5 rounded-md border border-rose-100">
                {lang === 'ar' ? `يوجد ${alertsList.length} شيكات تحتاج متابعة فورية` : `${alertsList.length} checks require immediate follow-up`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alertsList.map(({ check: chk, daysDiff }) => {
                const isOverdue = daysDiff < 0;
                const isToday = daysDiff === 0;

                let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                let badgeText = lang === 'ar' ? `يستحق خلال ${daysDiff} أيام` : `Due in ${daysDiff} days`;
                
                if (isOverdue) {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse';
                  badgeText = lang === 'ar' ? `متأخر بـ ${Math.abs(daysDiff)} يوم! 🚨` : `${Math.abs(daysDiff)} days overdue! 🚨`;
                } else if (isToday) {
                  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 animate-bounce';
                  badgeText = lang === 'ar' ? `يستحق اليوم! 🔔` : `Due Today! 🔔`;
                }

                return (
                  <div 
                    key={chk.id} 
                    className="bg-white p-3.5 rounded-xl border border-slate-150 flex flex-col justify-between space-y-3 shadow-3xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black font-mono block mb-1">
                          #{chk.checkNo} | {chk.bankName}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800">
                          {chk.partnerName}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/70">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'القيمة المالية:' : 'Check Value:'}</span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {chk.amount.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCheckForCashing(chk);
                            setCashConfirmVaultId(vaults[0]?.id || '');
                            setCashConfirmDate('2026-07-18');
                            setShowCashConfirmModal(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                        >
                          {lang === 'ar' ? 'صرف/تحصيل' : 'Cash'}
                        </button>
                        <button
                          onClick={() => updateCheckStatus(chk.id, 'bounced')}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer"
                        >
                          {lang === 'ar' ? 'رفض' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* MAIN CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* PDC SUB-TABS & ACTIONS HEADER BAR (WHEN IN CHECKS TAB) */}
        {activeTab === 'checks' && (
          <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPdcSubTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdcSubTab === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>كافة الشيكات الآجلة</span>
              </button>

              <button
                onClick={() => setPdcSubTab('due_48h')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  pdcSubTab === 'due_48h'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>تنبيهات الاستحقاق (خلال 48h)</span>
                {(() => {
                  const cnt = checks.filter(c => (c.status === 'portfolio' || c.status === 'deposited') && getDaysDiff(c.dueDate) <= 2).length;
                  if (cnt === 0) return null;
                  return (
                    <span className="px-1.5 py-0.2 bg-rose-700 text-white font-mono text-[10px] rounded-full font-black animate-pulse">
                      {cnt}
                    </span>
                  );
                })()}
              </button>

              <button
                onClick={() => setPdcSubTab('incoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdcSubTab === 'incoming'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                <span>شيكات مقبوضة (واردة)</span>
              </button>

              <button
                onClick={() => setPdcSubTab('outgoing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdcSubTab === 'outgoing'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-300" />
                <span>شيكات صادرة (التزامات)</span>
              </button>

              <button
                onClick={() => setPdcSubTab('schedule')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pdcSubTab === 'schedule'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>جدول التحصيل التلقائي 🤖</span>
              </button>
            </div>

            {/* Action Trigger Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPdcRegisterModal(true)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل شيك آجل جديد 📑</span>
              </button>

              <button
                onClick={handleRunAutoCollection}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>تشغيل التحصيل التلقائي الآن 🤖</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters and Control Area */}
        {activeTab !== 'trial_balance' && (
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'treasury' ? t('search_placeholder') : t('check_search_placeholder')}
                className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0F4C81] text-right"
              />
            </div>

            {/* Sub-Filters */}
            <div className="flex gap-2">
              {activeTab === 'treasury' ? (
                <>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="all">{t('filter_all')}</option>
                    <option value="customer_payment">{t('filter_cust')}</option>
                    <option value="supplier_payment">{t('filter_supp')}</option>
                    <option value="expense">{t('filter_exp')}</option>
                    <option value="revenue">{t('filter_rev')}</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="all">كل السندات</option>
                    <option value="cash_in">سند قبض فقط</option>
                    <option value="cash_out">سند صرف فقط</option>
                  </select>
                </>
              ) : (
                <>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="all">كل حالات الشيكات</option>
                    <option value="portfolio">{t('status_portfolio')}</option>
                    <option value="deposited">{t('status_deposited')}</option>
                    <option value="cashed">{t('status_cashed')}</option>
                    <option value="bounced">{t('status_bounced')}</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="all">كل الأنواع</option>
                    <option value="incoming">شيكات واردة</option>
                    <option value="outgoing">شيكات صادرة</option>
                  </select>
                </>
              )}
            </div>
          </div>
          </div>
        )}

        {/* MAIN DATA TABLES & DYNAMIC VIEWS */}
        {(activeTab === 'treasury' || activeTab === 'checks') ? (
          <div className="overflow-x-auto">
            {activeTab === 'treasury' ? (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">رقم السند</th>
                    <th className="px-5 py-3">التاريخ</th>
                    <th className="px-5 py-3">نوع الحركة</th>
                    <th className="px-5 py-3">الخزينة</th>
                    <th className="px-5 py-3">الطرف الثاني</th>
                    <th className="px-5 py-3">المبلغ مالي</th>
                    <th className="px-5 py-3">التصنيف المحاسبي</th>
                    <th className="px-5 py-3">البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                        {t('no_data')}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold font-mono text-[#0F4C81]">{tx.docNo}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{tx.date}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'cash_in' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {tx.type === 'cash_in' ? 'قبض 📥' : 'صرف 📤'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-extrabold text-slate-800">{tx.vaultName}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-700">{tx.recipientOrPayer}</td>
                        <td className="px-5 py-3.5 font-black font-mono text-slate-900">{tx.amount.toLocaleString()} ج.م</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1 items-start justify-center">
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100">
                              {tx.category === 'customer_payment' ? 'مقبوضات عملاء' :
                               tx.category === 'supplier_payment' ? 'مدفوعات موردين' :
                               tx.category === 'expense' ? 'مصروفات تشغيل' :
                               tx.category === 'revenue' ? 'إيرادات تشغيل' : 'أخرى'}
                            </span>
                            {tx.costCenterId && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-100">
                                🎯 {tx.costCenterName || costCenters.find(c => c.id === tx.costCenterId)?.nameAr || tx.costCenterId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">رقم الشيك والمعلومات</th>
                    <th className="px-5 py-3">البنك والخاصية</th>
                    <th className="px-5 py-3">تاريخ الاستحقاق والإنذار</th>
                    <th className="px-5 py-3">الاتجاه</th>
                    <th className="px-5 py-3">الطرف الآخر (العميل/المورد)</th>
                    <th className="px-5 py-3">قيمة الشيك</th>
                    <th className="px-5 py-3">حالة الشيك</th>
                    <th className="px-5 py-3">الإجراءات والتحصيل والجدولة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChecks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                        {t('no_data')}
                      </td>
                    </tr>
                  ) : (
                    filteredChecks.map(chk => {
                      const daysLeft = getDaysDiff(chk.dueDate);
                      const isDueAlert = (chk.status === 'portfolio' || chk.status === 'deposited') && daysLeft <= 2;

                      return (
                        <tr key={chk.id} className={`hover:bg-slate-50 transition-colors ${isDueAlert ? 'bg-rose-50/40' : ''}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-black font-mono text-[#F7941D] text-xs">{chk.checkNo}</span>
                              {chk.issueDate && (
                                <span className="text-[9px] text-slate-400 font-mono">تاريخ الإصدار: {chk.issueDate}</span>
                              )}
                              {chk.postponedHistory && chk.postponedHistory.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold border border-amber-200">
                                  🗓️ تم تأجيله ({chk.postponedHistory.length}x)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-extrabold text-slate-800">{chk.bankName}</span>
                              {chk.autoCollect ? (
                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-black border border-emerald-200">
                                  🤖 تحصيل تلقائي
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-bold">
                                  ✋ تحصيل يدوي
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-black text-slate-800">{chk.dueDate}</span>
                              {chk.status !== 'cashed' && (
                                isDueAlert ? (
                                  <span className="text-[9px] px-2 py-0.5 bg-rose-600 text-white font-bold rounded-md animate-pulse flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-300" />
                                    <span>مستحق الآن / خلال 48h ({daysLeft < 0 ? 'متأخر' : daysLeft === 0 ? 'اليوم' : `باقي ${daysLeft} يوم`})</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-bold">
                                    باقي {daysLeft} يوم على الموعد
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              chk.type === 'received' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}>
                              {chk.type === 'received' ? 'وارد (قبض)' : 'صادر (دفع)'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 items-start justify-center">
                              <span className="font-bold text-slate-700">{chk.partnerName}</span>
                              {chk.costCenterId && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-100">
                                  🎯 {chk.costCenterName || costCenters.find(c => c.id === chk.costCenterId)?.nameAr || chk.costCenterId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-black font-mono text-slate-900">{chk.amount.toLocaleString()} ج.م</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 w-28 ${
                              chk.status === 'portfolio' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              chk.status === 'deposited' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                              chk.status === 'cashed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {chk.status === 'portfolio' ? <Clock className="w-3 h-3" /> :
                               chk.status === 'deposited' ? <RefreshCw className="w-3 h-3" /> :
                               chk.status === 'cashed' ? <CheckCircle2 className="w-3 h-3" /> :
                               <AlertTriangle className="w-3 h-3" />}
                              {chk.status === 'portfolio' ? t('status_portfolio') :
                               chk.status === 'deposited' ? t('status_deposited') :
                               chk.status === 'cashed' ? t('status_cashed') :
                               t('status_bounced')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {chk.status !== 'cashed' ? (
                              <div className="flex flex-wrap gap-1">
                                {chk.status === 'portfolio' && (
                                  <button
                                    onClick={() => updateCheckStatus(chk.id, 'deposited')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                                  >
                                    إيداع بنكي
                                  </button>
                                )}
                                {(chk.status === 'portfolio' || chk.status === 'deposited' || chk.status === 'bounced') && (
                                  <button
                                    onClick={() => {
                                      setSelectedCheckForCashing(chk);
                                      setCashConfirmVaultId(chk.targetVaultId || vaults[0]?.id || '');
                                      setCashConfirmDate('2026-07-18');
                                      setShowCashConfirmModal(true);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                                  >
                                    صرف/تحصيل 💵
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedPdcForReschedule(chk);
                                    setPdcRescheduleDate(chk.dueDate);
                                    setPdcRescheduleReason('');
                                    setShowPdcRescheduleModal(true);
                                  }}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <Calendar className="w-3 h-3 text-amber-300" />
                                  <span>تأجيل 🗓️</span>
                                </button>
                                {chk.status !== 'bounced' && (
                                  <button
                                    onClick={() => updateCheckStatus(chk.id, 'bounced')}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                                  >
                                    رفض ❌
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4" />
                                <span>تمت التسوية بنجاح</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === 'multi_treasury' ? (
          <div className="space-y-6 text-right font-sans" dir="rtl">
            {/* Header Banner & Intro */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0F4C81] p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900">
                    {lang === 'ar' ? 'موديول الخزينة الموحد 🏛️' : 'Unified Treasury Engine'}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">| {vaults.length} {lang === 'ar' ? 'خزينة وعهدة نشطة' : 'Active Vaults'}</span>
                </div>
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                  <span>{lang === 'ar' ? 'لوحة تحكم وتحليل الخزائن المتعددة والتحويلات الفورية' : 'Multi-Treasury Dashboard & Inter-Vault Transfer System'}</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {lang === 'ar' 
                    ? 'رصد متكامل لأرصدة الخزينة الرئيسية، الفروع الإقليمية، مواقع المشاريع والأوناش، والعهد النثرية والنقد الأجنبي، مع تنفيذ تحويلات مالية فورية وتوثيقها تلقائياً بآلية القيد المزدوَج في دفتر اليومية.'
                    : 'Unified control panel for main, branch, site, and petty cash vaults with immediate transfers and auto double-entry journal documentation.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-slate-900" />
                  <span>{lang === 'ar' ? 'إجراء تحويل مالي بين الخزائن 🔄' : 'New Inter-Vault Transfer 🔄'}</span>
                </button>
                <button
                  onClick={() => setShowAddVaultModal(true)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'ar' ? 'إضافة خزينة / عهدة جديدة' : 'Add New Treasury'}</span>
                </button>
              </div>
            </div>

            {/* KPI Cards (4 Summary Metric Cards) */}
            {(() => {
              const totalEgpBalance = vaults.reduce((sum: number, v: any) => v.currency === 'EGP' ? sum + v.balance : sum + (v.balance * 50), 0);
              const totalUsdBalance = vaults.filter((v: any) => v.currency === 'USD').reduce((sum: number, v: any) => sum + v.balance, 0);
              const totalTransfersVal = interVaultTransfers.reduce((sum, tr) => sum + tr.amount, 0);

              const mainVaultCount = vaults.filter((v: any) => v.type === 'main').length;
              const branchVaultCount = vaults.filter((v: any) => v.type === 'branch').length;
              const projectVaultCount = vaults.filter((v: any) => v.type === 'project').length;
              const pettyVaultCount = vaults.filter((v: any) => v.type === 'petty_cash').length;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Consolidated Total Cash */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'إجمالي السيولة المجمعة (معادلة بالجنيه)' : 'Total Consolidated Cash'}</span>
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        {totalEgpBalance.toLocaleString()} <span className="text-xs font-bold text-emerald-600">ج.م</span>
                      </div>
                      {totalUsdBalance > 0 && (
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          تتضمن {totalUsdBalance.toLocaleString()} $ دولار بالخزينة الأجنبية
                        </p>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 flex items-center justify-between">
                      <span>مطابقة حية للأرصدة</span>
                      <span className="text-emerald-600 font-bold">100% محدثة</span>
                    </div>
                  </div>

                  {/* KPI 2: Active Vaults Breakdown */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'عدد الخزائن والعهد الفعالة' : 'Active Vaults & Custodies'}</span>
                      <div className="p-2 bg-blue-50 rounded-xl text-[#0F4C81]">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        {vaults.length} <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'خزائن' : 'vaults'}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 mt-1">
                        {mainVaultCount} رئيسية • {branchVaultCount} فرع • {projectVaultCount} مواقع • {pettyVaultCount} عهدة
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 flex items-center justify-between">
                      <span>توزيع متوازن للسيولة</span>
                      <span className="text-blue-600 font-bold">نشط بالكامل</span>
                    </div>
                  </div>

                  {/* KPI 3: Inter-Vault Transfers Summary */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'حجم التحويلات البينية المحولة' : 'Inter-Vault Transfers Value'}</span>
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                        <ArrowLeftRight className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        {totalTransfersVal.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
                      </div>
                      <p className="text-[10px] font-bold text-amber-700 mt-1">
                        إجمالي {interVaultTransfers.length} تحويلات موثقة بالكامل
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 flex items-center justify-between">
                      <span>قيود يومية مزدوجة</span>
                      <span className="text-emerald-600 font-bold">موثقة 100%</span>
                    </div>
                  </div>

                  {/* KPI 4: Highest Liquidity Vault */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'أعلى خزينة ملاءة نقدية' : 'Highest Liquidity Vault'}</span>
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                        <Landmark className="w-5 h-5" />
                      </div>
                    </div>
                    {(() => {
                      const highestVault = [...vaults].sort((a: any, b: any) => b.balance - a.balance)[0];
                      return (
                        <div>
                          <div className="text-sm font-black text-slate-800 truncate">
                            {highestVault?.nameAr || 'الخزينة الرئيسية'}
                          </div>
                          <p className="text-lg font-black text-purple-700 font-mono mt-0.5">
                            {highestVault?.balance.toLocaleString()} <span className="text-xs text-slate-500">{highestVault?.currency}</span>
                          </p>
                          <div className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 flex items-center justify-between mt-1">
                            <span>أمين الخزينة:</span>
                            <span className="text-slate-700 font-bold">{highestVault?.manager || 'أحمد سليمان'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Visual Analytics Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* BarChart: Balances comparison across all treasuries */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-[#0F4C81]" />
                      <span>{lang === 'ar' ? 'مقارنة أرصدة الخزائن والعهد المالية الحالية' : 'Vaults Current Balance Comparison'}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">تحليل مرئي مباشر لقيم الملاءة النقدية المتاحة بكل موقع وخزينة</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                    {vaults.length} خزينة
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vaults.map((v: any) => ({
                      name: v.nameAr.split('-')[0].replace('خزينة', '').trim(),
                      fullName: v.nameAr,
                      balance: v.currency === 'EGP' ? v.balance : v.balance * 50,
                      rawBalance: v.balance,
                      currency: v.currency,
                      type: v.type
                    }))} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${item.payload.rawBalance.toLocaleString()} ${item.payload.currency}`,
                          'الرصيد المتاح'
                        ]}
                        labelFormatter={(label, items: any) => items[0]?.payload?.fullName || label}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', direction: 'rtl' }}
                      />
                      <Bar dataKey="balance" radius={[8, 8, 0, 0]}>
                        {vaults.map((v: any, index: number) => {
                          const colors = {
                            main: '#0F4C81',
                            branch: '#10b981',
                            project: '#f59e0b',
                            petty_cash: '#8b5cf6',
                            foreign: '#3b82f6'
                          };
                          return <Cell key={`cell-${index}`} fill={(colors as any)[v.type] || '#0F4C81'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PieChart: Liquidity distribution by treasury type */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'توزيع السيولة حسب تصنيف الخزينة' : 'Liquidity Share by Vault Category'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">نسب الاستحواذ بين الرئيسية والمواقع والعهد</p>
                </div>

                {(() => {
                  const typeTotals: Record<string, number> = {
                    'خزائن رئيسية': 0,
                    'فروع إدارية': 0,
                    'مواقع مشاريع': 0,
                    'عهده نقدية': 0,
                    'عملات أجنبية': 0
                  };

                  vaults.forEach((v: any) => {
                    const egpVal = v.currency === 'EGP' ? v.balance : v.balance * 50;
                    if (v.type === 'main') typeTotals['خزائن رئيسية'] += egpVal;
                    else if (v.type === 'branch') typeTotals['فروع إدارية'] += egpVal;
                    else if (v.type === 'project') typeTotals['مواقع مشاريع'] += egpVal;
                    else if (v.type === 'petty_cash') typeTotals['عهده نقدية'] += egpVal;
                    else if (v.type === 'foreign') typeTotals['عملات أجنبية'] += egpVal;
                  });

                  const pieData = Object.keys(typeTotals)
                    .map(key => ({ name: key, value: typeTotals[key] }))
                    .filter(item => item.value > 0);

                  const pieColors = ['#0F4C81', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

                  return (
                    <div className="h-64 w-full flex flex-col items-center justify-center">
                      <ResponsiveContainer width="100%" height="80%">
                        <RePieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={`pie-cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'إجمالي السيولة']}
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', direction: 'rtl' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-2 text-[10px] font-bold">
                        {pieData.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                            <span className="text-slate-600">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Vault Balances Cards / Table View Header Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0F4C81]/10 rounded-xl text-[#0F4C81]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {lang === 'ar' ? 'دليل وكروت الخزائن والعهد المالية النشطة' : 'Active Vaults & Custody Register'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      عرض الأرصدة الحالية وأمناء الخزائن مع أزرار التحويل السريع
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={multiSearchTerm}
                      onChange={e => setMultiSearchTerm(e.target.value)}
                      placeholder="بحث باسم الخزينة أو الأمين..."
                      className="bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs font-bold w-48 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Filter Pills */}
                  <select
                    value={multiTypeFilter}
                    onChange={e => setMultiTypeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">كل تصنيفات الخزائن</option>
                    <option value="main">الخزائن الرئيسية</option>
                    <option value="branch">الفروع الإدارية</option>
                    <option value="project">مواقع المشاريع</option>
                    <option value="petty_cash">العهد النثرية</option>
                    <option value="foreign">النقد الأجنبي</option>
                  </select>

                  {/* View Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setMultiViewMode('cards')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${multiViewMode === 'cards' ? 'bg-white text-[#0F4C81] shadow-xs' : 'text-slate-500'}`}
                    >
                      كروت 🎴
                    </button>
                    <button
                      onClick={() => setMultiViewMode('table')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${multiViewMode === 'table' ? 'bg-white text-[#0F4C81] shadow-xs' : 'text-slate-500'}`}
                    >
                      جدول 📋
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtered Vault List */}
              {(() => {
                const filteredVaults = vaults.filter((v: any) => {
                  const matchSearch = !multiSearchTerm ||
                    v.nameAr.toLowerCase().includes(multiSearchTerm.toLowerCase()) ||
                    (v.manager && v.manager.toLowerCase().includes(multiSearchTerm.toLowerCase())) ||
                    (v.code && v.code.toLowerCase().includes(multiSearchTerm.toLowerCase()));

                  const matchType = multiTypeFilter === 'all' || v.type === multiTypeFilter;
                  return matchSearch && matchType;
                });

                const totalCoCash = vaults.reduce((sum: number, v: any) => sum + (v.currency === 'EGP' ? v.balance : v.balance * 50), 0);

                if (filteredVaults.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-bold">لم يتم العثور على أي خزائن مطابقة لمعايير البحث</p>
                    </div>
                  );
                }

                if (multiViewMode === 'cards') {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredVaults.map((v: any) => {
                        const pctShare = totalCoCash > 0 ? ((v.currency === 'EGP' ? v.balance : v.balance * 50) / totalCoCash) * 100 : 0;
                        const typeBadges: Record<string, { label: string; bg: string; text: string }> = {
                          main: { label: 'خزينة رئيسية', bg: 'bg-blue-100', text: 'text-[#0F4C81]' },
                          branch: { label: 'فرع إداري', bg: 'bg-emerald-100', text: 'text-emerald-800' },
                          project: { label: 'موقع مشروع', bg: 'bg-amber-100', text: 'text-amber-800' },
                          petty_cash: { label: 'عهدة نثرية', bg: 'bg-purple-100', text: 'text-purple-800' },
                          foreign: { label: 'عملات أجنبية', bg: 'bg-sky-100', text: 'text-sky-800' }
                        };

                        const badge = typeBadges[v.type] || { label: 'خزينة', bg: 'bg-slate-100', text: 'text-slate-800' };

                        return (
                          <div key={v.id} className="bg-slate-50/80 hover:bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${badge.bg} ${badge.text}`}>
                                  {badge.label}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-slate-400 font-bold">{v.code || 'VLT'}</span>
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                                    {v.currency}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-black text-slate-900 leading-snug">{v.nameAr}</h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                  <span>👤 الأمين: {v.manager || 'أمين الخزينة'}</span>
                                  <span>•</span>
                                  <span>📍 {v.location || 'الشركة'}</span>
                                </p>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-slate-150 flex justify-between items-baseline">
                                <span className="text-[11px] font-bold text-slate-400">الرصيد المتاح:</span>
                                <div className="text-xl font-black text-slate-900 font-mono">
                                  {v.balance.toLocaleString()} <span className="text-xs font-bold text-[#0F4C81]">{v.currency}</span>
                                </div>
                              </div>

                              {/* Progress share of total liquidity */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                  <span>حصة السيولة بالمؤسسة</span>
                                  <span className="text-slate-700 font-mono">{pctShare.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#0F4C81] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(3, pctShare))}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-2.5">
                              <button
                                onClick={() => {
                                  setTransferForm(prev => ({ ...prev, fromVaultId: v.id }));
                                  setShowTransferModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                <span>تحويل منها 📤</span>
                              </button>
                              <button
                                onClick={() => {
                                  setTransferForm(prev => ({ ...prev, toVaultId: v.id }));
                                  setShowTransferModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                <span>تحويل إليها 📥</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <tr>
                          <th className="p-3">الكود</th>
                          <th className="p-3">اسم الخزينة / العهدة</th>
                          <th className="p-3">التصنيف</th>
                          <th className="p-3">العملة</th>
                          <th className="p-3">أمين الخزينة</th>
                          <th className="p-3">الموقع / المقر</th>
                          <th className="p-3">الرصيد المتاح</th>
                          <th className="p-3">حصة السيولة</th>
                          <th className="p-3 text-center">إجراء تحويل سريـع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-bold text-slate-800">
                        {filteredVaults.map((v: any) => {
                          const pctShare = totalCoCash > 0 ? ((v.currency === 'EGP' ? v.balance : v.balance * 50) / totalCoCash) * 100 : 0;
                          return (
                            <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono text-slate-500">{v.code || 'VLT'}</td>
                              <td className="p-3 font-black text-slate-900">{v.nameAr}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
                                  {v.type === 'main' ? 'رئيسية' : v.type === 'branch' ? 'فرع' : v.type === 'project' ? 'موقع' : v.type === 'petty_cash' ? 'عهدة' : 'أجنبية'}
                                </span>
                              </td>
                              <td className="p-3 font-mono">{v.currency}</td>
                              <td className="p-3 text-slate-600">{v.manager || 'أحمد سليمان'}</td>
                              <td className="p-3 text-slate-500">{v.location || 'الشركة'}</td>
                              <td className="p-3 font-mono text-emerald-700 font-extrabold text-sm">
                                {v.balance.toLocaleString()} {v.currency}
                              </td>
                              <td className="p-3 font-mono text-slate-600">{pctShare.toFixed(1)}%</td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setTransferForm(prev => ({ ...prev, fromVaultId: v.id }));
                                      setShowTransferModal(true);
                                    }}
                                    className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold hover:bg-rose-100 cursor-pointer"
                                  >
                                    تحويل منها 📤
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTransferForm(prev => ({ ...prev, toVaultId: v.id }));
                                      setShowTransferModal(true);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                                  >
                                    تحويل إليها 📥
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Inter-Treasury Transfers History & Journal Documentation Register */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-[#0F4C81]" />
                    <span>سجل التحويلات المالية بين الخزائن وتوثيق دفتر اليومية العامة</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                      {interVaultTransfers.length} عملية موثقة ⚖️
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    توثيق لكافة تحويلات السيولة بين الخزائن والمواقع مع إثبات القيود المحاسبية المزدوَجة وطباعة السندات
                  </p>
                </div>

                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>تحويل جديد بين الخزائن</span>
                </button>
              </div>

              {/* Transfers Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <tr>
                      <th className="p-3">رقم التحويل</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الخزينة المحوّل منها (المصدر)</th>
                      <th className="p-3">الخزينة المحوّل إليها (الهدف)</th>
                      <th className="p-3">المبلغ المحول</th>
                      <th className="p-3">البيان والسبب</th>
                      <th className="p-3">رقم قيد اليومية</th>
                      <th className="p-3">حالة القيد</th>
                      <th className="p-3 text-center">طباعة وسند القيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-bold text-slate-800">
                    {interVaultTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          لا توجد تحويلات بينية مسجلة حتى الآن
                        </td>
                      </tr>
                    ) : (
                      interVaultTransfers.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-[#0F4C81] font-black">{tr.transferNo}</td>
                          <td className="p-3 font-mono text-slate-600">{tr.date}</td>
                          <td className="p-3 text-rose-700 font-bold">{tr.fromVaultName}</td>
                          <td className="p-3 text-emerald-700 font-bold">{tr.toVaultName}</td>
                          <td className="p-3 font-mono font-black text-slate-900 text-sm">
                            {tr.amount.toLocaleString()} <span className="text-[10px] text-slate-500">{tr.currency}</span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{tr.notes}</td>
                          <td className="p-3 font-mono text-purple-700 font-bold">{tr.journalVoucherNo}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>مقيّد بالدفتر ⚖️</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedTransferForSlip(tr);
                                setShowJournalSlipModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer border border-slate-300"
                            >
                              <FileText className="w-3 h-3 text-[#0F4C81]" />
                              <span>سند التحويل والقيد 🧾</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'cost_centers' ? (
          <div className="p-6 space-y-6 text-right font-sans" dir="rtl">
            {/* Cost Centers Profitability & Budget Utilization Dashboard */}
            
            {/* Header / Intro Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81] animate-pulse"></span>
                  <span>{lang === 'ar' ? 'نظام تحليل ربحية مراكز التكلفة والموازنات' : 'Cost Centers Profitability & Budget Analysis'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ar' ? 'تتبع فوري ومطابقة حية للتدفقات النقدية (المقبوضات والمصروفات) لكل مشروع أو وحدة تشغيل مع احتساب هوامش الربحية.' : 'Real-time tracking of cash inflows and outflows per unit/project with precise margin calculation.'}
                </p>
              </div>

              {/* Add Cost Center Trigger */}
              <button
                onClick={() => setShowAddCostCenterModal(true)}
                className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-[#0F4C81]/10"
              >
                <span>+</span>
                <span>{lang === 'ar' ? 'إنشاء مركز تكلفة جديد' : 'New Cost Center'}</span>
              </button>
            </div>

            {/* Visual Charts & KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cost Center Performance List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-700">
                  {lang === 'ar' ? '📁 كشف الموازنات والأرباح التفصيلي لكافة الوحدات' : 'Detailed Unit Budget & Profit Statement'}
                </h4>
                
                <div className="space-y-4">
                  {costCenters.map(cc => {
                    // Calculate real-time inflows & outflows linked to this specific costCenter
                    const ccCashIn = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0);
                    const ccChecksIn = checks.filter(c => c.costCenterId === cc.id && c.type === 'received' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                    const ccInflow = ccCashIn + ccChecksIn;

                    const ccCashOut = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
                    const ccChecksOut = checks.filter(c => c.costCenterId === cc.id && c.type === 'issued' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                    const ccOutflow = ccCashOut + ccChecksOut;

                    const ccNetProfit = ccInflow - ccOutflow;
                    const ccProfitMargin = ccInflow > 0 ? (ccNetProfit / ccInflow) * 100 : 0;
                    const ccBudgetPercent = cc.budget > 0 ? (ccOutflow / cc.budget) * 100 : 0;

                    let progressColor = 'bg-[#0F4C81]';
                    let progressBg = 'bg-slate-100';
                    if (ccBudgetPercent >= 100) {
                      progressColor = 'bg-rose-600 animate-pulse';
                      progressBg = 'bg-rose-100';
                    } else if (ccBudgetPercent >= 80) {
                      progressColor = 'bg-amber-500';
                      progressBg = 'bg-amber-100';
                    }

                    return (
                      <div key={cc.id} className="p-4 rounded-xl border border-slate-150 hover:border-[#0F4C81]/40 hover:bg-slate-50/50 transition-all space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold font-mono">
                              ID: {cc.id}
                            </span>
                            <h5 className="text-xs font-black text-slate-800 mt-1">
                              {lang === 'ar' ? cc.nameAr : cc.nameEn}
                            </h5>
                          </div>

                          <div className="flex gap-2 items-center">
                            {/* Net Profit Badge */}
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                              ccNetProfit >= 0 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {lang === 'ar' ? 'صافي الربح:' : 'Net Profit:'} {ccNetProfit.toLocaleString()} ج.م 
                              ({ccProfitMargin.toFixed(0)}%)
                            </span>

                            {/* Budget Status Badge */}
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                              ccBudgetPercent >= 100 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : ccBudgetPercent >= 80 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {lang === 'ar' ? 'نسبة استهلاك الموازنة:' : 'Budget Utilization:'} {ccBudgetPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Budget Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{lang === 'ar' ? `المصروف الفعلي: ${ccOutflow.toLocaleString()} ج.م` : `Actual Spent: ${ccOutflow.toLocaleString()}`}</span>
                            <span>{lang === 'ar' ? `الموازنة المقدرة: ${cc.budget.toLocaleString()} ج.م` : `Budget Limit: ${cc.budget.toLocaleString()}`}</span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${progressBg}`}>
                            <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(ccBudgetPercent, 100)}%` }}></div>
                          </div>
                        </div>

                        {/* Financial Flow Split */}
                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                          <div className="bg-emerald-50/30 p-2 rounded-lg">
                            <span className="text-[9px] text-slate-400 block">{lang === 'ar' ? 'مقبوضات واردة 📥' : 'Inflow'}</span>
                            <span className="text-xs font-black text-emerald-700 font-mono">{ccInflow.toLocaleString()} ج.م</span>
                          </div>

                          <div className="bg-rose-50/30 p-2 rounded-lg">
                            <span className="text-[9px] text-slate-400 block">{lang === 'ar' ? 'مصروفات خارجة 📤' : 'Outflow'}</span>
                            <span className="text-xs font-black text-rose-700 font-mono">{ccOutflow.toLocaleString()} ج.م</span>
                          </div>

                          <div className="bg-slate-50/50 p-2 rounded-lg">
                            <span className="text-[9px] text-slate-400 block">{lang === 'ar' ? 'المتبقي بالموازنة 🛡️' : 'Remaining Budget'}</span>
                            <span className={`text-xs font-black font-mono ${(cc.budget - ccOutflow) >= 0 ? 'text-[#0F4C81]' : 'text-rose-700'}`}>
                              {(cc.budget - ccOutflow).toLocaleString()} ج.م
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart Side panel */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-700">
                    {lang === 'ar' ? '📊 مقارنة بيانية للمركز المالي للأقسام' : 'Departmental Financial Comparison Chart'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'مقارنة بصرية دقيقة بين الموازنة المرصودة والاستهلاك والربح التشغيلي.' : 'Visual comparison of limits, spending, and profits.'}
                  </p>
                </div>

                {/* Legend explanation for custom chart */}
                <div className="space-y-3 py-4">
                  {costCenters.map(cc => {
                    const ccCashOut = transactions.filter(t => t.costCenterId === cc.id && t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0);
                    const ccChecksOut = checks.filter(c => c.costCenterId === cc.id && c.type === 'issued' && c.status === 'cashed').reduce((sum, c) => sum + c.amount, 0);
                    const totalSpent = ccCashOut + ccChecksOut;
                    const percent = cc.budget > 0 ? (totalSpent / cc.budget) * 100 : 0;

                    return (
                      <div key={cc.id} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-extrabold text-slate-700">
                          <span>{lang === 'ar' ? cc.nameAr : cc.nameEn}</span>
                          <span className="font-mono text-[#0F4C81]">{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#0F4C81] h-full rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-2">
                  <h5 className="text-[11px] font-black text-blue-800">
                    {lang === 'ar' ? '💡 مؤشر جودة الإنفاق' : '💡 Spending Quality Index'}
                  </h5>
                  <p className="text-[10px] text-blue-950 leading-relaxed">
                    {lang === 'ar'
                      ? 'يُنصح بالإبقاء على معدلات استهلاك الموازنة دون 85% لضمان عدم حدوث عجز نقدي مفاجئ بالمشاريع، مع ضرورة ربط المقبوضات فوراً بمراكزها لضمان حساب الربحية بدقة.'
                      : 'Keep budget consumption below 85% to ensure cash liquidity buffer. Always tie invoices and check cashings back to units.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'trial_balance' ? (
          <div className="p-6 space-y-6 text-right" dir="rtl">
            {/* Filter controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/80 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">
                  {lang === 'ar' ? 'من تاريخ:' : 'Start Date:'}
                </label>
                <input
                  type="date"
                  value={trialStartDate}
                  onChange={(e) => setTrialStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">
                  {lang === 'ar' ? 'إلى تاريخ:' : 'End Date:'}
                </label>
                <input
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">
                  {lang === 'ar' ? 'الخزينة المحددة للتسوية:' : 'Select Vault:'}
                </label>
                <select
                  value={trialVaultId}
                  onChange={(e) => setTrialVaultId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                >
                  <option value="all">{lang === 'ar' ? 'كافة الخزائن الموحدة' : 'All Vaults'}</option>
                  {vaults.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {lang === 'ar' ? v.nameAr : v.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">
                  {lang === 'ar' ? 'الحساب / الطرف المرتبط:' : 'Associated Partner/Account:'}
                </label>
                <select
                  value={trialPartnerName}
                  onChange={(e) => setTrialPartnerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                >
                  <option value="all">{lang === 'ar' ? 'كافة الحسابات والأطراف' : 'All Partners'}</option>
                  {uniquePartners.map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets row */}
            <div className="flex gap-2 justify-start">
              <button
                onClick={() => { setTrialStartDate('2026-07-01'); setTrialEndDate('2026-07-31'); }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                {lang === 'ar' ? '📅 شهر يوليو 2026 (الفترة الحالية)' : 'July 2026 (Current)'}
              </button>
              <button
                onClick={() => { setTrialStartDate('2026-07-01'); setTrialEndDate('2026-07-15'); }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                {lang === 'ar' ? '📅 النصف الأول من يوليو' : 'First Half of July'}
              </button>
              <button
                onClick={() => { setTrialStartDate(''); setTrialEndDate(''); }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                {lang === 'ar' ? '📅 كل الأوقات (سجل الدفاتر كاملاً)' : 'All Time Ledger'}
              </button>
            </div>

            {/* Reconciliation Status Panel */}
            <div className="bg-[#0F4C81]/5 border border-[#0F4C81]/10 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0F4C81]" />
                  <h3 className="text-xs font-black text-[#0F4C81]">
                    {lang === 'ar' ? 'حالة المطابقة وإغلاق الفترة وميزان المراجعة ⚖️' : 'Reconciliation & Period Close Status ⚖️'}
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <span>●</span>
                  <span>{lang === 'ar' ? 'ميزان المراجعة متطابق ومتزن بالكامل' : 'Trial balance matches and is fully balanced'}</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ar' 
                  ? `بناءً على التصفية النشطة: الرصيد الافتتاحي المدور قبل تاريخ ${trialStartDate || 'البداية'} هو (${trialOpeningBalance.toLocaleString()} ج.م). تم احتساب مجموع حركات المقبوضات بقيمة (${trialPeriodDebits.toLocaleString()} ج.م) والمدفوعات بقيمة (${trialPeriodCredits.toLocaleString()} ج.م)، ليكون الرصيد الدفتري الختامي المستهدف هو (${trialEndingBalance.toLocaleString()} ج.م).`
                  : `Based on active filters: The opening balance before ${trialStartDate || 'start'} was (${trialOpeningBalance.toLocaleString()} EGP). Receipts total (${trialPeriodDebits.toLocaleString()} EGP) and payments total (${trialPeriodCredits.toLocaleString()} EGP), resulting in a closed book ending balance of (${trialEndingBalance.toLocaleString()} EGP).`
                }
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                <button
                  onClick={() => {
                    setReconPeriodName(lang === 'ar' ? `تسوية ومطابقة الفترة من ${trialStartDate || 'البداية'} إلى ${trialEndDate || 'النهاية'}` : `Reconcile from ${trialStartDate || 'start'} to ${trialEndDate || 'end'}`);
                    setShowApproveReconModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'اعتماد محضر مطابقة الرصيد دفترياً' : 'Approve & Reconcile Period'}</span>
                </button>
              </div>
            </div>

            {/* Detailed Ledger Table with Running Balance */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0F4C81]" />
                  <span>{lang === 'ar' ? 'دفتر الأستاذ التفصيلي وحركة الرصيد المتراكم:' : 'Detailed Treasury Ledger & Running Balance:'}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-extrabold font-mono">
                  {filteredTrialTransactions.length} {lang === 'ar' ? 'حركات مالية' : 'transactions'}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-3xs">
                <table className="w-full text-right text-xs bg-white">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">رقم السند</th>
                      <th className="px-4 py-3">التاريخ</th>
                      <th className="px-4 py-3">الخزينة</th>
                      <th className="px-4 py-3">الطرف الثاني</th>
                      <th className="px-4 py-3">البيان</th>
                      <th className="px-4 py-3 text-emerald-700">مدين (+) مقبوضات</th>
                      <th className="px-4 py-3 text-rose-700">دائن (-) مدفوعات</th>
                      <th className="px-4 py-3 text-indigo-700">الرصيد الجاري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/50 font-bold text-slate-700">
                      <td className="px-4 py-3 text-slate-400 font-mono">-</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{trialStartDate || 'البداية'}</td>
                      <td className="px-4 py-3 text-slate-400">-</td>
                      <td className="px-4 py-3">{lang === 'ar' ? 'رصيد مرحل / افتتاحي مدور' : 'Carried Forward Opening Balance'}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] font-normal">{lang === 'ar' ? 'السيولة النقدية المتوفرة بالخزائن قبل مستهل الفترة' : 'Cash liquidity available before period start'}</td>
                      <td className="px-4 py-3 text-slate-400">-</td>
                      <td className="px-4 py-3 text-slate-400">-</td>
                      <td className="px-4 py-3 font-mono text-indigo-700 font-bold">{trialOpeningBalance.toLocaleString()} ج.م</td>
                    </tr>

                    {/* Transaction Rows */}
                    {(() => {
                      let currentBal = trialOpeningBalance;
                      if (filteredTrialTransactions.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="px-4 py-6 text-center text-slate-400 font-bold">
                              {lang === 'ar' ? 'لا توجد حركات مالية مسجلة خلال الفترة المحددة.' : 'No financial movements registered during selected range.'}
                            </td>
                          </tr>
                        );
                      }

                      return filteredTrialTransactions.map(tx => {
                        if (tx.type === 'cash_in') {
                          currentBal += tx.amount;
                        } else {
                          currentBal -= tx.amount;
                        }

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-[#0F4C81]">{tx.docNo}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{tx.date}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{tx.vaultName}</td>
                            <td className="px-4 py-3 font-extrabold text-slate-800">{tx.recipientOrPayer}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                            <td className="px-4 py-3 font-mono text-emerald-600 font-bold">
                              {tx.type === 'cash_in' ? `+ ${tx.amount.toLocaleString()} ج.م` : '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-rose-600 font-bold">
                              {tx.type === 'cash_out' ? `- ${tx.amount.toLocaleString()} ج.م` : '-'}
                            </td>
                            <td className="px-4 py-3 font-mono font-black text-indigo-700 bg-slate-50/30">
                              {currentBal.toLocaleString()} ج.م
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outstanding Checks Adjustment */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F7941D]" />
                <span>{lang === 'ar' ? 'شيكات معلقة وغير مسواة (عناصر مطابقة وتسوية فارقة):' : 'Outstanding Checks Pending Settlement (Reconciliation Items):'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'ar' 
                  ? '💡 الشيكات الواردة أو الصادرة قيد المقاصة والانتظار لم تصرف بعد بالخزينة، وهي تفسر أي فروق محتملة مع كشوفات الحساب المصرفي لتسهيل تتبع الفروقات الدورية.'
                  : '💡 Pending received/issued checks not yet cashed in the treasury explain any discrepancies with the official bank statement to facilitate trace auditing.'
                }
              </p>

              <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-3xs">
                <table className="w-full text-right text-xs bg-white">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">رقم الشيك</th>
                      <th className="px-4 py-3">البنك</th>
                      <th className="px-4 py-3">تاريخ الاستحقاق</th>
                      <th className="px-4 py-3">الاتجاه</th>
                      <th className="px-4 py-3">الطرف الآخر</th>
                      <th className="px-4 py-3">القيمة المالية</th>
                      <th className="px-4 py-3">حالة الشيك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {outstandingChecks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-5 text-center text-slate-400 font-bold">
                          {lang === 'ar' ? 'لا توجد شيكات معلقة مرتبطة للساحب المختار حالياً.' : 'No outstanding checks for the selected partner/filters.'}
                        </td>
                      </tr>
                    ) : (
                      outstandingChecks.map(chk => (
                        <tr key={chk.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-[#F7941D]">{chk.checkNo}</td>
                          <td className="px-4 py-3">{chk.bankName}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{chk.dueDate}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              chk.type === 'received' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                            }`}>
                              {chk.type === 'received' ? 'وارد (قبض)' : 'صادر (دفع)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{chk.partnerName}</td>
                          <td className="px-4 py-3 font-black font-mono text-slate-900">{chk.amount.toLocaleString()} ج.م</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold">
                              {chk.status === 'portfolio' ? 'بالمحفظة' : 'برسم التحصيل'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Reconciliations History Log */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'سجل محاضر التسويات والمطابقات التاريخية المعتمدة لدفاتر الخزينة:' : 'Approved Reconciliation Sessions Log:'}</span>
              </h3>

              <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-3xs">
                <table className="w-full text-right text-xs bg-white">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">اسم فترة التسوية</th>
                      <th className="px-4 py-3">الخزينة المشمولة</th>
                      <th className="px-4 py-3">تاريخ الاعتماد ومطابقة الأرصدة</th>
                      <th className="px-4 py-3">المسؤول المدقق المعتمِد</th>
                      <th className="px-4 py-3">ملاحظات وقرارات التسوية والمطابقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reconciledPeriods.map(period => (
                      <tr key={period.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-black text-slate-800">{period.periodName}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-600">{period.vaultName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{period.dateApproved}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{period.approvedBy}</td>
                        <td className="px-4 py-3 text-slate-500 text-[11px] leading-relaxed">{period.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'liquidity_forecast' ? (
          <div className="p-6 space-y-6 text-right font-sans" dir="rtl">
            {/* Header & Controls Panel with Sub-Tab Switcher */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#0F4C81] text-white rounded-lg">
                      <Activity className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-black text-slate-800">
                      {lang === 'ar' ? 'موديول تحليل حركة التدفقات النقدية والسيولة (Cash Flow Analysis)' : 'Cash Flow & Liquidity Analysis Module'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === 'ar' 
                      ? 'رسوم بيانية وتحليلات تفاعلية تقارن بين السيولة الفعلية، الشيكات الآجلة، وتوقعات السيولة المستقبليـة بناءً على استحقاقات العقود والفواتير الحالية.'
                      : 'Interactive analytics comparing actual liquidity, pending checks, and 3-month future cash projection.'
                    }
                  </p>
                </div>

                {/* Sub-Tab Navigation Switcher */}
                <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-bold self-start lg:self-auto overflow-x-auto max-w-full">
                  <button
                    onClick={() => setProjectionTab('snapshot')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer relative ${
                      projectionTab === 'snapshot'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>{lang === 'ar' ? '⚡ لقطة السيولة اليومية (24 ساعة)' : '⚡ Daily Liquidity Snapshot (24h)'}</span>
                    {isDeficit && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute top-1.5 left-1.5" />
                    )}
                  </button>

                  <button
                    onClick={() => setProjectionTab('3month')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                      projectionTab === '3month'
                        ? 'bg-[#0F4C81] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>{lang === 'ar' ? '🔮 توقع السيولة (3 أشهر قادمة)' : '🔮 3-Month Cash Projection'}</span>
                  </button>

                  <button
                    onClick={() => setProjectionTab('quick')}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                      projectionTab === 'quick'
                        ? 'bg-[#0F4C81] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>{lang === 'ar' ? '📊 التقرير والمخطط اليومي' : '📊 Daily Cash Forecast'}</span>
                  </button>
                </div>
              </div>

              {/* Toolbar Controls per active sub-tab */}
              {projectionTab === 'snapshot' ? (
                <div className="border-t border-slate-200/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold">
                      <span className="text-[10px] text-slate-400 px-2">{lang === 'ar' ? 'المدى الزمني:' : 'Window:'}</span>
                      {[24, 48, 72].map(hrs => (
                        <button
                          key={hrs}
                          onClick={() => setSnapshotHours(hrs as any)}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            snapshotHours === hrs
                              ? 'bg-rose-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {hrs} ساعة
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold">
                      <span className="text-[10px] text-slate-400 px-2">{lang === 'ar' ? 'هامش الأمان:' : 'Buffer:'}</span>
                      {[100000, 200000, 500000].map(buf => (
                        <button
                          key={buf}
                          onClick={() => setSnapshotSafetyBuffer(buf)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            snapshotSafetyBuffer === buf
                              ? 'bg-slate-800 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {(buf / 1000).toLocaleString()} ألف
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleTriggerInstantAlert}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إرسال تنبيه فورى للسيولة 🚨' : 'Trigger Instant Alert 🚨'}</span>
                    </button>

                    <button
                      onClick={() => setShowAddEmergencyObligationModal(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? '+ إدراج التزام طوارئ (24h)' : '+ Insert Emergency Obligation'}</span>
                    </button>
                  </div>
                </div>
              ) : projectionTab === '3month' ? (
                <div className="border-t border-slate-200/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                    <button
                      onClick={() => setUseWeightedProbability(!useWeightedProbability)}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                        useWeightedProbability
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={lang === 'ar' ? 'ترجيح المبالغ حسب نسبة الاحتمالية (عالية 95% - متوسطة 75% - منخفضة 50%)' : 'Weight amounts by probability rating'}
                    >
                      <Percent className="w-3.5 h-3.5 text-amber-600" />
                      <span>{useWeightedProbability ? (lang === 'ar' ? 'موزون بالاحتمالية 🎯' : 'Weighted Probability 🎯') : (lang === 'ar' ? 'مبالغ اسمية 100%' : 'Nominal Face Value')}</span>
                    </button>

                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px]">
                      <span className="text-slate-400 font-extrabold">{lang === 'ar' ? 'مصادِر التوقع:' : 'Sources:'}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeContracts}
                          onChange={(e) => setIncludeContracts(e.target.checked)}
                          className="rounded text-[#0F4C81] focus:ring-0"
                        />
                        <span>📜 العقود والمستخلصات</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeInvoices}
                          onChange={(e) => setIncludeInvoices(e.target.checked)}
                          className="rounded text-[#0F4C81] focus:ring-0"
                        />
                        <span>🧾 الفواتير الحالية</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeChecksIn3Month}
                          onChange={(e) => setIncludeChecksIn3Month(e.target.checked)}
                          className="rounded text-[#0F4C81] focus:ring-0"
                        />
                        <span>🎟️ الشيكات الآجلة</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowAddContractModal(true)}
                      className="px-3 py-1.5 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? '+ إضافة مستخلص عقد' : '+ Add Contract Milestone'}</span>
                    </button>

                    <button
                      onClick={() => setShowAddInvoiceModal(true)}
                      className="px-3 py-1.5 bg-[#F7941D] hover:bg-[#e08316] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? '+ تسجيل فاتورة حالمة' : '+ Register Invoice'}</span>
                    </button>

                    <button
                      onClick={export3MonthProjectionToCSV}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تصدير التوقع (Excel)' : 'Export Projection'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200/80 pt-3 flex items-center justify-between">
                  <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold">
                    {[7, 15, 30, 60].map(days => (
                      <button
                        key={days}
                        onClick={() => setForecastDays(days)}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          forecastDays === days 
                            ? 'bg-[#0F4C81] text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lang === 'ar' ? `${days} يوم` : `${days} Days`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={exportCashFlowToCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تصدير التتقرير (Excel / CSV)' : 'Export Report (Excel/CSV)'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* MAIN CONTENT VIEW: DAILY LIQUIDITY SNAPSHOT vs 3-MONTH FUTURE CASH PROJECTION vs QUICK FORECAST */}
            {projectionTab === 'snapshot' ? (
              <div className="space-y-6 font-sans">
                {/* 1. TOP STATUS & ALERT BANNER */}
                <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                  isDeficit
                    ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-800 text-white border-rose-700'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 text-white border-amber-600'
                    : 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white border-emerald-700'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
                      isDeficit ? 'bg-rose-500/30 text-rose-200 animate-pulse' : isWarning ? 'bg-amber-500/30 text-amber-200' : 'bg-emerald-500/30 text-emerald-200'
                    }`}>
                      {isDeficit ? <AlertTriangle className="w-7 h-7" /> : isWarning ? <Clock className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs">
                          {snapshotHours}h Liquidity Snapshot
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isDeficit ? 'bg-rose-400 text-slate-950' : isWarning ? 'bg-amber-300 text-slate-950' : 'bg-emerald-300 text-slate-950'
                        }`}>
                          {isDeficit ? '🚨 عجز متوقع' : isWarning ? '⚠️ حظر هامش الأمان' : '🟢 مغطى بالكامل'}
                        </span>
                      </div>
                      <h4 className="text-lg font-black mt-1">
                        {isDeficit
                          ? `عجز سيولة متوقع خلال الـ ${snapshotHours} ساعة القادمة بقيمة (${Math.abs(netSnapshotPosition).toLocaleString()} ج.م)`
                          : isWarning
                          ? `سيولة مغطاة لكنها تقل عن هامش الأمان المستهدف (${snapshotSafetyBuffer.toLocaleString()} ج.م)`
                          : `السيولة المتاحة بالخزينة تغطي كافة التزامات الـ ${snapshotHours} ساعة القادمة مع فائض مريح`
                        }
                      </h4>
                      <p className="text-xs text-slate-200 mt-0.5 opacity-90">
                        {isDeficit
                          ? 'يتطلب ذلك اتخاذ إجراء فوري بترحيل بعض الشيكات الصادرة أو سداد جزء من الفواتير أو تسريع تحصيل الشيكات الواردة.'
                          : `نسبة تغطية السيولة الفعلية هي ${coverageRatio.toFixed(1)}% من إجمالي التزامات الـ ${snapshotHours} ساعة القادمة.`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 bg-black/20 p-3 rounded-xl border border-white/10 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-300 font-bold">نسبة التغطية (Coverage):</span>
                      <span className={`text-xl font-mono font-black ${
                        isDeficit ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-emerald-300'
                      }`}>
                        {coverageRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div>
                      <span className="block text-[10px] text-slate-300 font-bold">صافي الفائض / العجز:</span>
                      <span className={`text-xl font-mono font-black ${
                        netSnapshotPosition < 0 ? 'text-rose-300' : 'text-emerald-300'
                      }`}>
                        {netSnapshotPosition >= 0 ? `+${netSnapshotPosition.toLocaleString()}` : netSnapshotPosition.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. FOUR KPI CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Available Vault Cash */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-slate-500">رصيد الخزينة المتاح الفعلي</span>
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-xl font-mono font-black text-slate-900">
                      {effectiveAvailableCash.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>إجمالي السيولة النقدية بالبنوك والخزائن</span>
                      <span className="text-emerald-600 font-extrabold">متاح فوراً</span>
                    </div>
                  </div>

                  {/* Card 2: Next 24h Obligations */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-rose-700">الالتزامات المستحقة ({snapshotHours} ساعة)</span>
                      <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-xl font-mono font-black text-rose-700">
                      {totalSnapshotObligations.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>شيكات صادرة + فواتير + مستخلصات</span>
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full font-bold">
                        {snapshotObligations.length} بنود
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Expected Inflows */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-emerald-700">المتحصلات المرتقبة ({snapshotHours} ساعة)</span>
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-xl font-mono font-black text-emerald-700">
                      {totalSnapshotReceipts.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>شيكات واردة + تحصيلات مبيعات</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                        {snapshotReceipts.length} بنود
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Net Position After Safety Buffer */}
                  <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
                    netLiquidityAfterBuffer < 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-slate-700">صافي الموقف بعد هامش الأمان</span>
                      <div className="p-2 bg-slate-200/80 text-slate-800 rounded-xl">
                        <Scale className="w-5 h-5" />
                      </div>
                    </div>
                    <div className={`text-xl font-mono font-black ${
                      netLiquidityAfterBuffer < 0 ? 'text-rose-700' : 'text-slate-900'
                    }`}>
                      {netLiquidityAfterBuffer >= 0 ? `+${netLiquidityAfterBuffer.toLocaleString()}` : netLiquidityAfterBuffer.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between border-t border-slate-200/80 pt-2">
                      <span>مخصوم هامش الاحتياطي الطارئ</span>
                      <span className="font-mono text-slate-700">{snapshotSafetyBuffer.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>

                {/* 3. COVERAGE PROGRESS GAUGE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#0F4C81]" />
                      <span>مؤشر الكفاية والتغطية للالتزامات اليومية (Liquidity Coverage Gauge)</span>
                    </span>
                    <span className="font-mono">{effectiveAvailableCash.toLocaleString()} / {totalSnapshotObligations.toLocaleString()} ج.م</span>
                  </div>

                  <div className="w-full bg-slate-150 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        coverageRatio >= 125
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          : coverageRatio >= 100
                          ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                          : 'bg-gradient-to-r from-rose-500 to-rose-700'
                      }`}
                      style={{ width: `${Math.min(coverageRatio, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                    <span className="text-rose-600 font-extrabold">0% (عجز حرج)</span>
                    <span className="text-amber-600 font-extrabold">100% (تغطية حرجة)</span>
                    <span className="text-emerald-600 font-extrabold">125%+ (حد الأمان الممتاز)</span>
                  </div>
                </div>

                {/* 4. TWO SIDE-BY-SIDE DETAILED BREAKDOWN TABLES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Right Column: Obligations due in 24h */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
                    <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-rose-600 text-white rounded-lg">
                          <ArrowDownLeft className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-rose-950">
                            الالتزامات والتعهدات المستحقة خلال الـ {snapshotHours} ساعة القادمة
                          </h4>
                          <span className="text-[10px] text-rose-700 font-bold">
                            إجمالي المطلوب سداده: {totalSnapshotObligations.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>
                      <span className="bg-rose-200 text-rose-900 text-xs px-2.5 py-0.5 rounded-full font-extrabold font-mono">
                        {snapshotObligations.length} بنود
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                      {snapshotObligations.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-bold">
                          لا توجد أي التزامات سداد أو شيكات صادرة مستحقة خلال الـ {snapshotHours} ساعة القادمة ✨
                        </div>
                      ) : (
                        snapshotObligations.map(item => (
                          <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  item.typeCategory === 'check_issued'
                                    ? 'bg-purple-100 text-purple-800'
                                    : item.typeCategory === 'invoice_payable'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {item.typeCategory === 'check_issued' ? 'شيك صادر' : item.typeCategory === 'invoice_payable' ? 'فاتورة مستحقة' : 'مستخلص صادر'}
                                </span>
                                <span className="font-extrabold text-slate-800">{item.title}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-3">
                                <span>المستفيد: <strong className="text-slate-700">{item.partner}</strong></span>
                                <span className="font-mono text-slate-400">تاريخ الاستحقاق: {item.dueDate}</span>
                              </div>
                            </div>

                            <div className="text-left shrink-0 space-y-1">
                              <div className="font-mono font-extrabold text-rose-700 text-sm">
                                -{item.amount.toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span>
                              </div>
                              <button
                                onClick={() => handleQuickDeferObligation(item)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 rounded text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                                title="إعادة جدولة هذا البند وتأخيره 3 أيام لتخفيف الضغط النقدي اليومي"
                              >
                                <Clock className="w-3 h-3" />
                                <span>تأجيل 3 أيام 🗓️</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Left Column: Receipts due in 24h */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
                    <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">
                            التدفقات والمتحصلات المتوقعة خلال الـ {snapshotHours} ساعة القادمة
                          </h4>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            إجمالي المتوقع تحصيله: {totalSnapshotReceipts.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>
                      <span className="bg-emerald-200 text-emerald-900 text-xs px-2.5 py-0.5 rounded-full font-extrabold font-mono">
                        {snapshotReceipts.length} بنود
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                      {snapshotReceipts.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-bold">
                          لا توجد شيكات تحصيل أو متحصلات واردة مسجلة للـ {snapshotHours} ساعة القادمة.
                        </div>
                      ) : (
                        snapshotReceipts.map(item => (
                          <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  item.typeCategory === 'check_received'
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.typeCategory === 'invoice_receivable'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {item.typeCategory === 'check_received' ? 'شيك وارد' : item.typeCategory === 'invoice_receivable' ? 'تحصيل مبيعات' : 'مستخلص وارد'}
                                </span>
                                <span className="font-extrabold text-slate-800">{item.title}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-3">
                                <span>العميل/الجهة: <strong className="text-slate-700">{item.partner}</strong></span>
                                <span className="font-mono text-slate-400">تاريخ الاستحقاق: {item.dueDate}</span>
                              </div>
                            </div>

                            <div className="text-left shrink-0">
                              <div className="font-mono font-extrabold text-emerald-700 text-sm">
                                +{item.amount.toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span>
                              </div>
                              <span className="text-[10px] text-emerald-600 font-bold block">متحصل متوقع</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : projectionTab === '3month' ? (
              <div className="space-y-6">
                {/* 3 Monthly Projection Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {monthlyProjectionSummary.map((m, idx) => (
                    <div 
                      key={m.monthKey} 
                      className={`p-4 rounded-2xl border shadow-3xs transition-all ${
                        idx === 0 
                          ? 'bg-gradient-to-br from-blue-50/60 via-white to-white border-blue-200' 
                          : idx === 1 
                          ? 'bg-gradient-to-br from-indigo-50/60 via-white to-white border-indigo-200' 
                          : 'bg-gradient-to-br from-slate-50 via-white to-white border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0F4C81]" />
                          <span>{lang === 'ar' ? m.monthLabelAr : m.monthLabelEn}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-slate-200 text-slate-600">
                          M{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span className="font-sans text-[11px] font-semibold text-slate-500">وارد متوقع (+):</span>
                          <span>+ {m.totalIn.toLocaleString()} <span className="text-[10px] font-sans text-slate-400">ج.م</span></span>
                        </div>
                        <div className="flex justify-between text-rose-700 font-bold">
                          <span className="font-sans text-[11px] font-semibold text-slate-500">صادر متوقع (-):</span>
                          <span>- {m.totalOut.toLocaleString()} <span className="text-[10px] font-sans text-slate-400">ج.م</span></span>
                        </div>
                        <div className="border-t border-slate-100 pt-1.5 flex justify-between font-extrabold text-slate-900">
                          <span className="font-sans text-[11px]">صافي الحركة الشهرية:</span>
                          <span className={m.netMonth >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {m.netMonth >= 0 ? `+${m.netMonth.toLocaleString()}` : m.netMonth.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 bg-slate-50 p-2 rounded-xl border border-slate-150 flex justify-between items-center text-xs font-extrabold">
                        <span className="text-[10px] text-slate-500 font-sans">الرصيد التقديري بنهاية الشهر:</span>
                        <span className="font-mono text-[#0F4C81]">{m.endingCash.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  ))}

                  {/* Grand 3-Month Projection Summary Card */}
                  <div className="p-4 rounded-2xl border border-[#0F4C81]/30 bg-gradient-to-br from-[#0F4C81]/10 via-[#0F4C81]/5 to-white shadow-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-[#0F4C81]/20 pb-2">
                      <span className="text-xs font-black text-[#0F4C81] flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#0F4C81]" />
                        <span>{lang === 'ar' ? 'إجمالي التوقع التراكمي (3 أشهر)' : '3-Month Grand Projection'}</span>
                      </span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#0F4C81] text-white">
                        SUMMARY
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-emerald-800 font-extrabold">
                        <span className="font-sans text-[11px]">مجموع المقبوضات:</span>
                        <span>+ {total3MonthInflow.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-rose-800 font-extrabold">
                        <span className="font-sans text-[11px]">مجموع المدفوعات:</span>
                        <span>- {total3MonthOutflow.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-indigo-900 font-black border-t border-[#0F4C81]/15 pt-1 mt-1">
                        <span className="font-sans text-[11px]">الفجوة النقدية الإجمالية:</span>
                        <span className={grand3MonthNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {grand3MonthNet >= 0 ? `+${grand3MonthNet.toLocaleString()}` : grand3MonthNet.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#0F4C81] text-white rounded-xl shadow-2xs space-y-0.5">
                      <span className="text-[10px] opacity-80 block font-bold">{lang === 'ar' ? 'رصيد الخزينة المترقب بنهاية أكتوبر 2026:' : 'Projected Treasury Balance End of Oct 2026:'}</span>
                      <p className="text-base font-black font-mono">{grand3MonthEndingCash.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
                    </div>
                  </div>
                </div>

                {/* 3-Month Projection Chart using Recharts */}
                <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-[#0F4C81]" />
                        <span>{lang === 'ar' ? 'مخطط التدفقات النقدية والمسار التراكمي للسيولة للأشهر الثلاثة القادمة' : '3-Month Future Cash Flow & Cumulative Liquidity Trajectory'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {lang === 'ar' ? 'يعرض إجمالي المقبوضات المتوقعة والالتزامات لكل شهر مع الخط البياني لمسار رصيد الخزينة التراكمي.' : 'Shows expected inflows vs obligations per month along with cumulative cash curve.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-extrabold">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                        <span>مقبوضات متوقعة (+)</span>
                      </span>
                      <span className="flex items-center gap-1 text-rose-700">
                        <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
                        <span>مدفوعات ملتزم بها (-)</span>
                      </span>
                      <span className="flex items-center gap-1 text-[#0F4C81]">
                        <span className="w-2.5 h-1 bg-[#0F4C81] inline-block"></span>
                        <span>رصيد السيولة التراكمي</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value: any, name: any) => [
                            `${Number(value).toLocaleString()} ج.م`,
                            name === 'totalIn' ? 'المقبوضات المترقبة' : name === 'totalOut' ? 'الالتزامات الصادرة' : 'رصيد السيولة التراكمي'
                          ]}
                        />
                        <Bar dataKey="totalIn" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36} />
                        <Bar dataKey="totalOut" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={36} />
                        <Line type="monotone" dataKey="endingCash" stroke="#0F4C81" strokeWidth={3} dot={{ r: 5, fill: '#0F4C81', strokeWidth: 2, stroke: '#fff' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Contracts & Active Invoices Maturity Register Table */}
                <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-3xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#0F4C81]" />
                        <span>{lang === 'ar' ? 'جدول استحقاقات العقود والفواتير الحالية للأشهر الثلاثة القادمة:' : 'Active Contracts & Pending Invoices Maturity Schedule:'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'ar' ? 'سجل شامل لجميع مستخلصات العقود والفواتير المستحقة مع إمكانية الفلترة وتحديث حالة الاستحقاق.' : 'Full log of contract milestones and open invoices with probability and filters.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search Filter */}
                      <input
                        type="text"
                        value={projSearch}
                        onChange={(e) => setProjSearch(e.target.value)}
                        placeholder="بحث برقم العقد/الفاتورة أو الشريك..."
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold w-48 focus:bg-white transition-colors"
                      />

                      {/* Month Filter */}
                      <select
                        value={projMonthFilter}
                        onChange={(e) => setProjMonthFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="all">كل الأشهر (3M)</option>
                        <option value="2026-08">أغسطس 2026 (M1)</option>
                        <option value="2026-09">سبتمبر 2026 (M2)</option>
                        <option value="2026-10">أكتوبر 2026 (M3)</option>
                      </select>

                      {/* Source Filter */}
                      <select
                        value={projSourceFilter}
                        onChange={(e) => setProjSourceFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="all">كل المصادر (عقود وفواتير)</option>
                        <option value="contract">العقود والمستخلصات فقط</option>
                        <option value="invoice">الفواتير الحالية فقط</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-3xs">
                    <table className="w-full text-right text-xs bg-white">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">شهر الاستحقاق</th>
                          <th className="px-4 py-3">المصدر / الكود</th>
                          <th className="px-4 py-3">العنوان / المرجع</th>
                          <th className="px-4 py-3">الشريك / الجهة</th>
                          <th className="px-4 py-3">تاريخ الاستحقاق</th>
                          <th className="px-4 py-3">نسبة التحقق</th>
                          <th className="px-4 py-3 text-emerald-700">مقبوضات (+)</th>
                          <th className="px-4 py-3 text-rose-700">مدفوعات (-)</th>
                          <th className="px-4 py-3 font-mono text-indigo-700">المبلغ الترجيحي</th>
                          <th className="px-4 py-3">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredProjectionItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-slate-400 font-bold">
                              {lang === 'ar' ? 'لا توجد مستخلصات عقود أو فواتير تطابق شروط الفلترة الحالية.' : 'No contract milestones or invoices match active filters.'}
                            </td>
                          </tr>
                        ) : (
                          filteredProjectionItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-[#0F4C81]">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px]">
                                  {item.monthKey}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-extrabold text-slate-800 font-mono block">{item.code}</span>
                                <span className="text-[10px] text-slate-400">{item.sourceLabelAr}</span>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate" title={item.title}>
                                {item.title}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-700">{item.partner}</td>
                              <td className="px-4 py-3 font-mono text-slate-500">{item.dueDate}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  item.probability === 'high' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : item.probability === 'medium'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {item.probability === 'high' ? '🟢 عالية (95%)' : item.probability === 'medium' ? '🟡 متوسطة (75%)' : '🔴 منخفضة (50%)'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                                {item.type === 'inflow' ? `+ ${item.amount.toLocaleString()} ج.م` : '-'}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-rose-600">
                                {item.type === 'outflow' ? `- ${item.amount.toLocaleString()} ج.م` : '-'}
                              </td>
                              <td className="px-4 py-3 font-mono font-black text-indigo-700 bg-slate-50/50">
                                {item.weightedAmount.toLocaleString()} ج.م
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => item.source === 'contract' ? handleDeleteContractMilestone(item.id) : handleDeletePendingInvoice(item.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                  title="حذف من جدول التوقعات"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#0F4C81]/10 via-white to-white p-4.5 rounded-2xl border border-[#0F4C81]/20 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#0F4C81]">
                    {lang === 'ar' ? 'السيولة الحالية المتاحة بالخزائن' : 'Current Available Cash'}
                  </span>
                  <Wallet className="w-5 h-5 text-[#0F4C81]" />
                </div>
                <p className="text-xl font-black text-slate-950 mt-2 font-mono">
                  {totalVaultCash.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {lang === 'ar' ? 'أرصدة الخزائن الرئيسية والفرعية والمواقع' : 'Main & site vault balances'}
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 via-white to-white p-4.5 rounded-2xl border border-emerald-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-700">
                    {lang === 'ar' ? 'التدفقات الواردة المتوقعة' : 'Expected Inflows'}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-emerald-950 mt-2 font-mono">
                  + {forecastInflowTotal.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className="text-[10px] text-emerald-600/80 block mt-1">
                  {lang === 'ar' ? `شيكات قيد التحصيل (${forecastDays} يوم) + تحصيلات` : `Checks & receipts (${forecastDays}d)`}
                </span>
              </div>

              <div className="bg-gradient-to-br from-rose-50 via-white to-white p-4.5 rounded-2xl border border-rose-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-700">
                    {lang === 'ar' ? 'التدفقات الخارجة المتوقعة' : 'Expected Outflows'}
                  </span>
                  <ArrowDownLeft className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-xl font-black text-rose-950 mt-2 font-mono">
                  - {forecastOutflowTotal.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className="text-[10px] text-rose-600/80 block mt-1">
                  {lang === 'ar' ? `شيكات صادرة ومصروفات مستحقة` : `Issued checks & expenses`}
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 via-white to-white p-4.5 rounded-2xl border border-indigo-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-700">
                    {lang === 'ar' ? 'الرصيد الصافي المتوقع' : 'Forecasted Ending Cash'}
                  </span>
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xl font-black text-indigo-950 mt-2 font-mono">
                  {forecastEndingCash.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className="text-[10px] text-indigo-600/80 block mt-1">
                  {lang === 'ar' 
                    ? (netGap >= 0 ? `فائض سيولة متوقع: +${netGap.toLocaleString()} ج.م` : `عجز سيولة متوقع: ${netGap.toLocaleString()} ج.م`)
                    : `Net Gap: ${netGap.toLocaleString()} EGP`
                  }
                </span>
              </div>
            </div>

            {/* Interactive Charts Section using Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Composed Chart: Expected vs Actual Cash Flow Movement */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#0F4C81]" />
                      <span>{lang === 'ar' ? 'مخطط حركة التدفقات النقدية المتوقعة والفعلية (Recharts Cash Flow Chart)' : 'Expected vs Actual Cash Flow Movement Chart'}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'ar' ? 'يقارن بين التوريدات الفعلية، الشيكات المتوقع استحقاقها، والمسار التراكمي للسيولة بالخزائن.' : 'Compares actual cash receipts/payments with expected check due dates.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-extrabold">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>مقبوضات واردة</span>
                    </span>
                    <span className="flex items-center gap-1 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>مدفوعات خارجة</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#0F4C81]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F4C81]"></span>
                      <span>السيولة المتراكمة</span>
                    </span>
                  </div>
                </div>

                {/* Recharts ResponsiveContainer */}
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`, '']}
                        labelFormatter={(label) => `التاريخ: ${label}`}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="totalIn" name={lang === 'ar' ? 'إجمالي التدفق الوارد (فعلي + متوقع)' : 'Total Inflow'} fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="totalOut" name={lang === 'ar' ? 'إجمالي التدفق الخارج (فعلي + متوقع)' : 'Total Outflow'} fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                      <Line type="monotone" dataKey="cumulative" name={lang === 'ar' ? 'مسار رصيد السيولة المتراكم' : 'Cumulative Cash Balance'} stroke="#0F4C81" strokeWidth={3} dot={{ r: 3, fill: '#0F4C81' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart / Breakdown Panel */}
              <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 flex flex-col justify-between">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#F7941D]" />
                    <span>{lang === 'ar' ? 'توزيع التدفقات حسب الفئات' : 'Cash Flow Category Breakdown'}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'نسبة الشيكات المقبوضة مقابل المصروفات والمدفوعات' : 'Distribution of cash flows by type'}
                  </p>
                </div>

                <div className="h-52 w-full my-auto flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => `${Number(val).toLocaleString()} ج.م`} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart Custom Legend */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {pieBreakdownData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-extrabold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-900">{item.value.toLocaleString()} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Expected vs Actual Cash Flow Register Table */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#0F4C81]" />
                  <h4 className="text-xs font-black text-slate-800">
                    {lang === 'ar' ? 'جدول تفاصيل حركة السيولة والشيكات المتوقعة والفعلية:' : 'Detailed Cash Flow & Check Schedule Register:'}
                  </h4>
                </div>

                {/* Search & Type Filter inside table */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      type="text"
                      value={forecastSearch}
                      onChange={(e) => setForecastSearch(e.target.value)}
                      placeholder={lang === 'ar' ? 'ابحث برقم الشيك أو السند أو الجهة...' : 'Search check/voucher/partner...'}
                      className="bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs font-bold w-52"
                    />
                  </div>

                  <select
                    value={forecastTypeFilter}
                    onChange={(e: any) => setForecastTypeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                  >
                    <option value="all">{lang === 'ar' ? 'كل الاتجاهات' : 'All Directions'}</option>
                    <option value="received">{lang === 'ar' ? 'مقبوضات ووارد (+) ' : 'Inflows (+)'}</option>
                    <option value="issued">{lang === 'ar' ? 'مدفوعات وصادر (-)' : 'Outflows (-)'}</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">تاريخ الاستحقاق / الحركة</th>
                      <th className="px-4 py-3">نوع السند / الشيك</th>
                      <th className="px-4 py-3">رقم المرجع / الشيك</th>
                      <th className="px-4 py-3">الطرف الثاني / الشريك</th>
                      <th className="px-4 py-3">حالة السيولة</th>
                      <th className="px-4 py-3 text-emerald-700">التدفق الوارد (+)</th>
                      <th className="px-4 py-3 text-rose-700">التدفق الخارج (-)</th>
                      <th className="px-4 py-3">مركز التكلفة / الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {forecastTableRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                          {lang === 'ar' ? 'لا توجد حركات طابق شروط التصفية الحالية.' : 'No rows match active forecast filters.'}
                        </td>
                      </tr>
                    ) : (
                      forecastTableRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.date}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              row.isCheck 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {row.typeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#0F4C81]">{row.refNo}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{row.partner}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${row.statusClass}`}>
                              {row.statusText}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-emerald-600">
                            {row.flowType === 'in' ? `+ ${row.amount.toLocaleString()} ج.م` : '-'}
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-rose-600">
                            {row.flowType === 'out' ? `- ${row.amount.toLocaleString()} ج.م` : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={row.notes}>
                            {row.costCenter ? `🎯 ${row.costCenter} | ${row.notes}` : row.notes}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
            )}
          </div>
        ) : activeTab === 'bank_reconciliation' ? (
          <div className="p-6 space-y-6 text-right" dir="rtl">
            {/* Top Action & Bank Selector Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Building2 className="w-5 h-5 text-[#0F4C81]" />
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-0.5">
                    {lang === 'ar' ? 'اختر حساب البنك للمطابقة:' : 'Select Bank Account:'}
                  </label>
                  <select
                    value={selectedReconBank}
                    onChange={(e) => setSelectedReconBank(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    <option value="البنك التجاري الدولي CIB">البنك التجاري الدولي CIB - (حساب 100029384)</option>
                    <option value="البنك الأهلي المصري">البنك الأهلي المصري NBE - (حساب 500129482)</option>
                    <option value="بنك مصر">بنك مصر BM - (حساب 882019481)</option>
                    <option value="QNB الأهلي">بنك QNB الأهلي - (حساب 400192831)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>{lang === 'ar' ? 'استيراد كشف حساب (CSV/Excel)' : 'Import Statement (CSV/Excel)'}</span>
                </button>

                <button
                  onClick={handleRunAutoMatch}
                  disabled={isAutoMatching}
                  className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAutoMatching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{lang === 'ar' ? 'جاري الفحص والمطابقة...' : 'Auto-matching...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{lang === 'ar' ? 'تشغيل المطابقة الآلية 🤖' : 'Run Auto-Match Engine 🤖'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Reconciliation KPI Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 via-white to-white p-4.5 rounded-2xl border border-indigo-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-700">
                    {lang === 'ar' ? 'إجمالي مقبوضات كشف البنك' : 'Bank Statement Deposits'}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xl font-black text-slate-950 mt-2 font-mono">
                  + {totalBankDeposits.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className="text-[10px] text-indigo-600/80 block mt-1">
                  {lang === 'ar' ? 'تحويلات وإيداعات واردة بالبنك' : 'Deposits & Inflows'}
                </span>
              </div>

              <div className="bg-gradient-to-br from-rose-50 via-white to-white p-4.5 rounded-2xl border border-rose-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-700">
                    {lang === 'ar' ? 'إجمالي مدفوعات كشف البنك' : 'Bank Statement Withdrawals'}
                  </span>
                  <ArrowDownLeft className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-xl font-black text-rose-950 mt-2 font-mono">
                  - {totalBankWithdrawals.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                </p>
                <span className="text-[10px] text-rose-600/80 block mt-1">
                  {lang === 'ar' ? 'عمولات وسحوبات وشيكات مصروفة' : 'Withdrawals & Fees'}
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 via-white to-white p-4.5 rounded-2xl border border-emerald-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-700">
                    {lang === 'ar' ? 'نسبة المطابقة التلقائية' : 'Reconciliation Match Rate'}
                  </span>
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xl font-black text-emerald-950 mt-2 font-mono">
                  {reconMatchPercentage}%
                </p>
                {/* Progress bar */}
                <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${reconMatchPercentage}%` }}></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 via-white to-white p-4.5 rounded-2xl border border-amber-100 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-700">
                    {lang === 'ar' ? 'حركات غير مطابقة (فروقات)' : 'Unmatched Discrepancies'}
                  </span>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xl font-black text-amber-950 mt-2 font-mono">
                  {totalUnmatchedCount} <span className="text-xs text-slate-500">{lang === 'ar' ? 'حركات' : 'lines'}</span>
                </p>
                <span className="text-[10px] text-amber-700 block mt-1">
                  {lang === 'ar' ? 'تحتاج إنشاء قيود تسوية بالدفاتر' : 'Require adjustment journal entry'}
                </span>
              </div>
            </div>

            {/* Reconciliation Guidance Banner */}
            <div className="bg-[#0F4C81]/5 border border-[#0F4C81]/15 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0F4C81] text-white rounded-xl shadow-xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#0F4C81]">
                    {lang === 'ar' ? 'نظام المطابقة الآلية وإدارة تسوية الفروقات البنكية 🏦' : 'Automated Bank Reconciliation & Discrepancy Engine 🏦'}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {lang === 'ar' 
                      ? `يقوم النظام بمقارنة أرقام المراجع والمبالغ الواردة بكشف حساب البنك مع القيود اليومية والشيكات. قم بالنقر على "إنشاء قيد تسوية" أمام أي حركة بنكية غير مطابقة لتوليد قيد دفتر يومية فورياً بالخزينة.`
                      : `The system compares statement reference numbers and amounts with journal entries. Click "Create Adjustment" next to unmatched bank lines to generate journal entries instantly.`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{totalMatchedCount} {lang === 'ar' ? 'حركات مطابقة' : 'Matched'}</span>
                </span>
                <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{totalUnmatchedCount} {lang === 'ar' ? 'حركات معلقة / فروقات' : 'Unmatched'}</span>
                </span>
              </div>
            </div>

            {/* Filters & Table */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={reconSearch}
                    onChange={(e) => setReconSearch(e.target.value)}
                    placeholder={lang === 'ar' ? 'بحث برقم المرجع أو البيان...' : 'Search ref or description...'}
                    className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'تصفية الحالة:' : 'Filter Status:'}</span>
                  <button
                    onClick={() => setReconFilterStatus('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      reconFilterStatus === 'all' ? 'bg-[#0F4C81] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'ar' ? 'الكشف كامل' : 'All Lines'} ({filteredBankLines.length})
                  </button>
                  <button
                    onClick={() => setReconFilterStatus('matched')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      reconFilterStatus === 'matched' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'ar' ? 'المطابق فقط' : 'Matched'} ({totalMatchedCount})
                  </button>
                  <button
                    onClick={() => setReconFilterStatus('unmatched')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      reconFilterStatus === 'unmatched' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'ar' ? 'غير المطابق (الفروقات)' : 'Unmatched'} ({totalUnmatchedCount})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-3xs">
                <table className="w-full text-right text-xs bg-white">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">تاريخ الحركة</th>
                      <th className="px-4 py-3">البنك</th>
                      <th className="px-4 py-3">رقم المرجع / الشيك</th>
                      <th className="px-4 py-3">البيان الوارد بكشف الحساب</th>
                      <th className="px-4 py-3 text-emerald-700">إيداع (+)</th>
                      <th className="px-4 py-3 text-rose-700">سحب (-)</th>
                      <th className="px-4 py-3">حالة المطابقة</th>
                      <th className="px-4 py-3">رقم المستند/القيد بالدفاتر</th>
                      <th className="px-4 py-3 text-center">الإجراء / التسوية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredBankLines.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400 font-bold">
                          {lang === 'ar' ? 'لا توجد حركات بنكية تطابق البحث الحالي.' : 'No bank statement lines match the search criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredBankLines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{line.date}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{line.bankName}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#0F4C81]">{line.refNo}</td>
                          <td className="px-4 py-3 font-medium text-slate-700 max-w-xs">{line.description}</td>
                          <td className="px-4 py-3 font-mono font-extrabold text-emerald-600">
                            {line.deposit > 0 ? `+ ${line.deposit.toLocaleString()} ج.م` : '-'}
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-rose-600">
                            {line.withdrawal > 0 ? `- ${line.withdrawal.toLocaleString()} ج.م` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {line.matchStatus === 'matched' ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-full text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>{line.matchType === 'adjusted' ? 'تمت التسوية بالدفاتر' : 'متطابق تلقائياً'}</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold rounded-full text-[10px] border border-amber-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>غير مسجل (فارق بنكي)</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 font-bold">
                            {line.matchedJournalId ? (
                              <span className="text-[#0F4C81] bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                📄 {line.matchedJournalId}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {line.matchStatus === 'matched' ? (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>مطابق 100%</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedLineForAdjustment(line)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
                              >
                                <Plus className="w-3 h-3" />
                                <span>إنشاء قيد تسوية ⚡</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ADD CASH TX MODAL */}
      <AnimatePresence>
        {showAddTxModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Coins className="text-[#0F4C81] w-5 h-5" />
                  <span>{t('add_tx')}</span>
                </h3>
                <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('type_label')}</label>
                    <select
                      value={newTx.type}
                      onChange={(e) => setNewTx({ ...newTx, type: e.target.value as any, category: e.target.value === 'cash_in' ? 'customer_payment' : 'expense' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    >
                      <option value="cash_in">{t('cash_in')}</option>
                      <option value="cash_out">{t('cash_out')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('vault_name')}</label>
                    <select
                      value={newTx.vaultId}
                      onChange={(e) => setNewTx({ ...newTx, vaultId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    >
                      {vaults.map((v: any) => (
                        <option key={v.id} value={v.id}>{lang === 'ar' ? v.nameAr : v.nameEn}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('amount_label')} (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={newTx.amount}
                      onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                      placeholder="أدخل القيمة النقدية..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('cat_label')}</label>
                    <select
                      value={newTx.category}
                      onChange={(e) => setNewTx({ ...newTx, category: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    >
                      {newTx.type === 'cash_in' ? (
                        <>
                          <option value="customer_payment">مقبوضات وحسابات عملاء</option>
                          <option value="revenue">إيراد تشغيل آخر</option>
                          <option value="other">عمليات تمويلية وتوريدات أخرى</option>
                        </>
                      ) : (
                        <>
                          <option value="supplier_payment">دفع للموردين والشركاء</option>
                          <option value="expense">سلف، صيانة، وأجور تشغيل</option>
                          <option value="other">مصروفات أخرى متنوعة</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{t('payer_label')}</label>
                  <input
                    type="text"
                    required
                    value={newTx.recipientOrPayer}
                    onChange={(e) => setNewTx({ ...newTx, recipientOrPayer: e.target.value })}
                    placeholder="اسم العميل، المورد، المهندس، أو الجهة المسلمة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'ربط بمركز التكلفة (اختياري):' : 'Link Cost Center (Optional):'}
                  </label>
                  <select
                    value={newTx.costCenterId}
                    onChange={(e) => setNewTx({ ...newTx, costCenterId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="">{lang === 'ar' ? '-- بدون ربط بمركز تكلفة --' : '-- No Cost Center --'}</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {lang === 'ar' ? cc.nameAr : cc.nameEn} ({lang === 'ar' ? 'المتبقي:' : 'Rem:'} {(cc.budget - cc.usedBudget).toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{t('desc_label')}</label>
                  <textarea
                    required
                    rows={2}
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                    placeholder="يرجى كتابة بيان كامل ومفصل لغرض السند لمطابقته محاسبياً..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTxModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    {t('cancel_btn')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('save_btn')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CHECK RECORD MODAL */}
      <AnimatePresence>
        {showAddCheckModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Landmark className="text-[#F7941D] w-5 h-5" />
                  <span>{t('add_check')}</span>
                </h3>
                <button onClick={() => setShowAddCheckModal(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddCheck} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('check_type')}</label>
                    <select
                      value={newCheck.type}
                      onChange={(e) => setNewCheck({ ...newCheck, type: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    >
                      <option value="received">{t('received_check')}</option>
                      <option value="issued">{t('issued_check')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('check_no')}</label>
                    <input
                      type="text"
                      required
                      value={newCheck.checkNo}
                      onChange={(e) => setNewCheck({ ...newCheck, checkNo: e.target.value })}
                      placeholder="رقم الشيك المطبوع..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('amount_label')} (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={newCheck.amount}
                      onChange={(e) => setNewCheck({ ...newCheck, amount: e.target.value })}
                      placeholder="مبلغ الشيك..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('due_date')}</label>
                    <input
                      type="date"
                      required
                      value={newCheck.dueDate}
                      onChange={(e) => setNewCheck({ ...newCheck, dueDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('bank_name')}</label>
                    <input
                      type="text"
                      required
                      value={newCheck.bankName}
                      onChange={(e) => setNewCheck({ ...newCheck, bankName: e.target.value })}
                      placeholder="البنك المسحوب عليه الشيك..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">{t('partner_label')}</label>
                    <input
                      type="text"
                      required
                      value={newCheck.partnerName}
                      onChange={(e) => setNewCheck({ ...newCheck, partnerName: e.target.value })}
                      placeholder="الجهة المصدرة أو المستفيدة..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'ربط بمركز التكلفة (اختياري):' : 'Link Cost Center (Optional):'}
                  </label>
                  <select
                    value={newCheck.costCenterId}
                    onChange={(e) => setNewCheck({ ...newCheck, costCenterId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="">{lang === 'ar' ? '-- بدون ربط بمركز تكلفة --' : '-- No Cost Center --'}</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {lang === 'ar' ? cc.nameAr : cc.nameEn} ({lang === 'ar' ? 'المتبقي:' : 'Rem:'} {(cc.budget - cc.usedBudget).toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{t('notes_label')}</label>
                  <textarea
                    rows={2}
                    value={newCheck.notes}
                    onChange={(e) => setNewCheck({ ...newCheck, notes: e.target.value })}
                    placeholder="سند فاتورة رقم، شيك صمان، أو أي ملاحظات هامة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCheckModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    {t('cancel_btn')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#F7941D] hover:bg-[#e08316] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('save_btn')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CASH/CLEAR CONFIRMATION MODAL WITH VAULT SELECTION */}
      <AnimatePresence>
        {showCashConfirmModal && selectedCheckForCashing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Wallet className="text-[#0F4C81] w-5 h-5" />
                  <span>{lang === 'ar' ? 'تأكيد تسوية وصرف الشيك' : 'Confirm Check Settlement & Cashing'}</span>
                </h3>
                <button 
                  onClick={() => { setShowCashConfirmModal(false); setSelectedCheckForCashing(null); }} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">{lang === 'ar' ? 'رقم الشيك:' : 'Check No:'}</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCheckForCashing.checkNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{lang === 'ar' ? 'البنك المسحوب عليه:' : 'Drawee Bank:'}</span>
                    <span className="font-bold text-slate-800">{selectedCheckForCashing.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{lang === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCheckForCashing.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{lang === 'ar' ? 'الجهة:' : 'Partner:'}</span>
                    <span className="font-bold text-slate-800">{selectedCheckForCashing.partnerName}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700">{lang === 'ar' ? 'إجمالي قيمة الشيك:' : 'Total Amount:'}</span>
                  <span className="text-sm font-black text-slate-950 font-mono">
                    {selectedCheckForCashing.amount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmCashing} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'حدد الخزينة المستهدفة للتحديث التلقائي:' : 'Select Target Vault for Auto Balance Update:'}
                  </label>
                  <select
                    required
                    value={cashConfirmVaultId}
                    onChange={(e) => setCashConfirmVaultId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  >
                    {vaults.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {lang === 'ar' ? v.nameAr : v.nameEn} (رصيد: {v.balance.toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {selectedCheckForCashing.type === 'received' 
                      ? (lang === 'ar' ? '💡 سيتم إضافة المبلغ تلقائياً لخزينة الإيداع المحددة فور التأكيد.' : '💡 Value will be automatically deposited to the selected vault.')
                      : (lang === 'ar' ? '⚠️ سيتم سحب وخصم المبلغ تلقائياً من خزينة الدفع المحددة فور التأكيد.' : '⚠️ Value will be automatically deducted from the selected vault.')
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'تاريخ التسوية الفعلي بالخزينة:' : 'Actual Settlement Date:'}
                  </label>
                  <input
                    type="date"
                    required
                    value={cashConfirmDate}
                    onChange={(e) => setCashConfirmDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => { setShowCashConfirmModal(false); setSelectedCheckForCashing(null); }}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تأكيد الصرف وتحديث الرصيد' : 'Confirm & Update Balance'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD COST CENTER MODAL */}
      <AnimatePresence>
        {showAddCostCenterModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <FileText className="text-[#0F4C81] w-5 h-5" />
                  <span>{lang === 'ar' ? 'إنشاء مركز تكلفة جديد' : 'Create New Cost Center'}</span>
                </h3>
                <button 
                  onClick={() => setShowAddCostCenterModal(false)} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddCostCenterLocal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'اسم مركز التكلفة (عربي):' : 'Cost Center Name (Arabic):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCC.nameAr}
                    onChange={(e) => setNewCC({ ...newCC, nameAr: e.target.value })}
                    placeholder="مثال: قطاع اوناش الموانئ السخنة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'اسم مركز التكلفة (إنجليزي):' : 'Cost Center Name (English):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCC.nameEn}
                    onChange={(e) => setNewCC({ ...newCC, nameEn: e.target.value })}
                    placeholder="e.g. Sokhna Port Cranes division..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-left"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'الموازنة التقديرية المرصودة (ج.م):' : 'Allocated Budget Estimate (EGP):'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newCC.budget}
                    onChange={(e) => setNewCC({ ...newCC, budget: e.target.value })}
                    placeholder="مثال: 500000..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-left"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCostCenterModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'حفظ واعتماد مركز التكلفة' : 'Save Cost Center'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BANK STATEMENT IMPORT MODAL */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Upload className="text-[#0F4C81] w-5 h-5" />
                  <span>{lang === 'ar' ? 'استيراد كشف حساب البنك (ملف CSV / Excel)' : 'Import Bank Statement (CSV/Excel File)'}</span>
                </h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'اختر بنك كشف الحساب المستورد:' : 'Select Target Bank Account:'}
                  </label>
                  <select
                    value={importBankName}
                    onChange={(e) => setImportBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  >
                    <option value="البنك التجاري الدولي CIB">البنك التجاري الدولي CIB - (حساب 100029384)</option>
                    <option value="البنك الأهلي المصري">البنك الأهلي المصري NBE - (حساب 500129482)</option>
                    <option value="بنك مصر">بنك مصر BM - (حساب 882019481)</option>
                    <option value="QNB الأهلي">بنك QNB الأهلي - (حساب 400192831)</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer space-y-2">
                  <FileSpreadsheet className="w-10 h-10 text-[#0F4C81] mx-auto" />
                  <p className="text-xs font-bold text-slate-800">
                    {lang === 'ar' ? 'اسحب ملف كشف الحساب (.csv أو .xlsx) هنا' : 'Drag & drop bank statement file (.csv or .xlsx)'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'ar' ? 'يدعم تنسيق كشوف CIB, الأهلي, QNB, مصر مباشرة' : 'Supports standard online banking export format'}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 font-medium leading-relaxed">
                  💡 {lang === 'ar' 
                    ? 'يمكنك ضغط "تحميل كشف عينات توضيحي" لتجربة معالجة الحركات والمطابقة الآلية فوراً بنفس تنسيق البنك.' 
                    : 'Click "Load Sample Statement" to test automated matching immediately.'}
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportSampleBankStatement}
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{lang === 'ar' ? 'تحميل واستيراد كشف العينات الآلي' : 'Load & Import Sample Statement'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE ADJUSTMENT ENTRY MODAL */}
      <AnimatePresence>
        {selectedLineForAdjustment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-amber-500 w-5 h-5" />
                  <span>{lang === 'ar' ? 'إنشاء قيد تسوية بنكية وتوليد سند دفتر اليومية' : 'Create Bank Adjustment & Journal Entry'}</span>
                </h3>
                <button onClick={() => setSelectedLineForAdjustment(null)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              {/* Line Details summary card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-bold">{lang === 'ar' ? 'تاريخ الحركة بالبنك:' : 'Bank Date:'}</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLineForAdjustment.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-bold">{lang === 'ar' ? 'رقم المرجع بالبنك:' : 'Bank Reference:'}</span>
                  <span className="font-mono font-bold text-[#0F4C81]">{selectedLineForAdjustment.refNo}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-bold">{lang === 'ar' ? 'بيان كشف الحساب:' : 'Statement Description:'}</span>
                  <span className="font-bold text-slate-900">{selectedLineForAdjustment.description}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-700 font-black">{lang === 'ar' ? 'المبلغ المستهدف بالتسوية:' : 'Amount to Adjust:'}</span>
                  <span className={`font-mono font-extrabold text-sm ${selectedLineForAdjustment.deposit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedLineForAdjustment.deposit > 0 ? `+ ${selectedLineForAdjustment.deposit.toLocaleString()} ج.م` : `- ${selectedLineForAdjustment.withdrawal.toLocaleString()} ج.م`}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCreateAdjustmentEntry} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'تصنيف حركة التسوية:' : 'Adjustment Category:'}
                  </label>
                  <select
                    value={adjCategory}
                    onChange={(e) => setAdjCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  >
                    <option value="expense">{lang === 'ar' ? 'عمولات ومصروفات بنكية (Bank Fees & Charges)' : 'Bank Fees & Expenses'}</option>
                    <option value="customer_payment">{lang === 'ar' ? 'عائد فائدة / تحصيل مباشر (Interest / Direct Receipt)' : 'Interest / Receipt'}</option>
                    <option value="supplier_payment">{lang === 'ar' ? 'سداد مباشر / خصم تلقائي (Direct Debit / Payment)' : 'Direct Debit'}</option>
                    <option value="other">{lang === 'ar' ? 'تسويات وتأمينات أخرى (Other Adjustments)' : 'Other Adjustment'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'ربط بمركز التكلفة:' : 'Cost Center Assignment:'}
                  </label>
                  <select
                    value={adjCostCenterId}
                    onChange={(e) => setAdjCostCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                  >
                    <option value="">{lang === 'ar' ? '-- تسويات عامة / الإدارة المالية --' : '-- General Finance --'}</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {lang === 'ar' ? cc.nameAr : cc.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">
                    {lang === 'ar' ? 'ملاحظات وبيان القيد بالدفاتر:' : 'Journal Entry Description:'}
                  </label>
                  <textarea
                    rows={2}
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب ملاحظات قيد التسوية الدفترية...' : 'Write adjustment description...'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLineForAdjustment(null)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إنشاء القيد ومطابقة الحركة فوراً' : 'Create Entry & Match Now'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CONTRACT MILESTONE MODAL */}
      <AnimatePresence>
        {showAddContractModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Briefcase className="text-[#0F4C81] w-5 h-5" />
                  <span>{lang === 'ar' ? 'تسجيل مستخلص / مرحلة عقد للتوقعات المستقبليـة' : 'Register Contract Milestone for Projection'}</span>
                </h3>
                <button onClick={() => setShowAddContractModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddContractSubmit} className="space-y-3 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">رقم/كود العقد:</label>
                    <input
                      type="text"
                      required
                      value={newContractForm.contractCode}
                      onChange={e => setNewContractForm({...newContractForm, contractCode: e.target.value})}
                      placeholder="CNT-2026-088"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">نوع الحركة:</label>
                    <select
                      value={newContractForm.type}
                      onChange={e => setNewContractForm({...newContractForm, type: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    >
                      <option value="inflow">مقبوضات واردة (+) (عميل)</option>
                      <option value="outflow">مدفوعات صادرة (-) (مورد/مقاول)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">عنوان العقد / المستخلص:</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.title}
                    onChange={e => setNewContractForm({...newContractForm, title: e.target.value})}
                    placeholder="مستخلص تسليم المرحلة الثالثة - مشروع الأبراج"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">العميل / المورد الشريك:</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.partnerName}
                    onChange={e => setNewContractForm({...newContractForm, partnerName: e.target.value})}
                    placeholder="شركة إعمار مصر للتطوير"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ الاستحقاق بالتحديد:</label>
                    <input
                      type="date"
                      required
                      value={newContractForm.dueDate}
                      onChange={e => setNewContractForm({...newContractForm, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">احتمالية التحقق النقدية:</label>
                    <select
                      value={newContractForm.probability}
                      onChange={e => setNewContractForm({...newContractForm, probability: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    >
                      <option value="high">🟢 عالية (95%)</option>
                      <option value="medium">🟡 متوسطة (75%)</option>
                      <option value="low">🔴 منخفضة (50%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">المبلغ الإجمالي الاسمية (ج.م):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newContractForm.amount}
                    onChange={e => setNewContractForm({...newContractForm, amount: e.target.value})}
                    placeholder="500000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-emerald-700 font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">ملاحظات العقد / المشروع:</label>
                  <input
                    type="text"
                    value={newContractForm.notes}
                    onChange={e => setNewContractForm({...newContractForm, notes: e.target.value})}
                    placeholder="ملاحظات تفصيلية حول دفعة المستخلص..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddContractModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ إضافة العقد</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD PENDING INVOICE MODAL */}
      <AnimatePresence>
        {showAddInvoiceModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Receipt className="text-[#F7941D] w-5 h-5" />
                  <span>{lang === 'ar' ? 'تسجيل فاتورة قائمة للتوقعات المستقبليـة' : 'Register Pending Invoice for Projection'}</span>
                </h3>
                <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddInvoiceSubmit} className="space-y-3 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">رقم الفاتورة:</label>
                    <input
                      type="text"
                      required
                      value={newInvoiceForm.invoiceNo}
                      onChange={e => setNewInvoiceForm({...newInvoiceForm, invoiceNo: e.target.value})}
                      placeholder="INV-2026-901"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">نوع الحركة:</label>
                    <select
                      value={newInvoiceForm.type}
                      onChange={e => setNewInvoiceForm({...newInvoiceForm, type: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    >
                      <option value="receivable">فاتورة مبيعات / تحصيل (+)</option>
                      <option value="payable">فاتورة مشتريات / سداد (-)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">اسم الشريك / العميل / المورد:</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.partnerName}
                    onChange={e => setNewInvoiceForm({...newInvoiceForm, partnerName: e.target.value})}
                    placeholder="شركة النيل للتقنية"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ الاستحقاق:</label>
                    <input
                      type="date"
                      required
                      value={newInvoiceForm.dueDate}
                      onChange={e => setNewInvoiceForm({...newInvoiceForm, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">احتمالية التحصيل/السداد:</label>
                    <select
                      value={newInvoiceForm.probability}
                      onChange={e => setNewInvoiceForm({...newInvoiceForm, probability: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    >
                      <option value="high">🟢 عالية (95%)</option>
                      <option value="medium">🟡 متوسطة (75%)</option>
                      <option value="low">🔴 منخفضة (50%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">مبلغ الفاتورة (ج.م):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInvoiceForm.amount}
                    onChange={e => setNewInvoiceForm({...newInvoiceForm, amount: e.target.value})}
                    placeholder="150000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-amber-700 font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">ملاحظات / أسطول المعدات:</label>
                  <input
                    type="text"
                    value={newInvoiceForm.notes}
                    onChange={e => setNewInvoiceForm({...newInvoiceForm, notes: e.target.value})}
                    placeholder="ملاحظات تفصيلية حول الفاتورة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddInvoiceModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#F7941D] hover:bg-[#e08316] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ إضافة الفاتورة</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD EMERGENCY OBLIGATION MODAL (24H SNAPSHOT) */}
      <AnimatePresence>
        {showAddEmergencyObligationModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="text-rose-600 w-5 h-5" />
                  <span>{lang === 'ar' ? 'إدراج التزام طوارئ / مصاريف عاجلة (24 ساعة)' : 'Insert Emergency 24h Obligation'}</span>
                </h3>
                <button onClick={() => setShowAddEmergencyObligationModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddEmergencyObligationSubmit} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">نوع الحركة / السند:</label>
                  <select
                    value={emergencyObligationForm.type}
                    onChange={e => setEmergencyObligationForm({...emergencyObligationForm, type: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  >
                    <option value="check_issued">شيك صادر طوارئ (-)</option>
                    <option value="invoice_payable">فاتورة مشتريات / سداد مستحقة (-)</option>
                    <option value="contract_outflow">مستخلص تعاقدي صادر (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">عنوان الالتزام / البيان:</label>
                  <input
                    type="text"
                    required
                    value={emergencyObligationForm.title}
                    onChange={e => setEmergencyObligationForm({...emergencyObligationForm, title: e.target.value})}
                    placeholder="شراء سولار اضطراري / قطع غيار ورشة الجيزة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">اسم المستفيد / الجهة:</label>
                  <input
                    type="text"
                    value={emergencyObligationForm.partnerName}
                    onChange={e => setEmergencyObligationForm({...emergencyObligationForm, partnerName: e.target.value})}
                    placeholder="شركة مصر للبترول"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">المبلغ المطلوب (ج.م):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={emergencyObligationForm.amount}
                      onChange={e => setEmergencyObligationForm({...emergencyObligationForm, amount: e.target.value})}
                      placeholder="250000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-rose-700 font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ الاستحقاق:</label>
                    <input
                      type="date"
                      required
                      value={emergencyObligationForm.dueDate}
                      onChange={e => setEmergencyObligationForm({...emergencyObligationForm, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">ملاحظات / سبب العجلة:</label>
                  <input
                    type="text"
                    value={emergencyObligationForm.notes}
                    onChange={e => setEmergencyObligationForm({...emergencyObligationForm, notes: e.target.value})}
                    placeholder="تغذية طارئة لأوناش موقع العاصمة الإدارية"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddEmergencyObligationModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إدراج وتحديث السيولة</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. INTER-TREASURY TRANSFER MODAL */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <ArrowLeftRight className="text-[#0F4C81] w-5 h-5" />
                  <span>{lang === 'ar' ? 'تحويل سيولة فوري بين الخزائن والعهد' : 'Execute Immediate Inter-Vault Transfer'}</span>
                </h3>
                <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleExecuteInterVaultTransfer} className="space-y-4 text-xs font-bold">
                {/* Source Treasury */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">الخزينة المحوّل منها (المصدر / خصم -):</label>
                  <select
                    value={transferForm.fromVaultId}
                    onChange={e => setTransferForm({ ...transferForm, fromVaultId: e.target.value })}
                    className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    {vaults.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.nameAr} (الرصيد المتاح: {v.balance.toLocaleString()} {v.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Treasury */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">الخزينة المحوّل إليها (الهدف / إضافة +):</label>
                  <select
                    value={transferForm.toVaultId}
                    onChange={e => setTransferForm({ ...transferForm, toVaultId: e.target.value })}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    {vaults.map((v: any) => (
                      <option key={v.id} value={v.id} disabled={v.id === transferForm.fromVaultId}>
                        {v.nameAr} (الرصيد المتاح: {v.balance.toLocaleString()} {v.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">المبلغ المحول (ج.م):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={transferForm.amount}
                      onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                      placeholder="مثال: 50000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-emerald-700 font-extrabold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ التحويل:</label>
                    <input
                      type="date"
                      required
                      value={transferForm.date}
                      onChange={e => setTransferForm({ ...transferForm, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                    />
                  </div>
                </div>

                {/* Notes & Voucher Reference */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">رقم الإذن / المرجع المستندي (اختياري):</label>
                  <input
                    type="text"
                    value={transferForm.referenceVoucher}
                    onChange={e => setTransferForm({ ...transferForm, referenceVoucher: e.target.value })}
                    placeholder="مثال: VCH-TRF-2026-99"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">السبب والبيان المحاسبي:</label>
                  <textarea
                    rows={2}
                    value={transferForm.notes}
                    onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
                    placeholder="سبب التحويل (تغذية سيولة الموقع / استعاضة عهدة نثرية)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>

                {/* Auto Journal Notice */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10px] text-amber-800 font-bold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>سيتم توليد قيد يومية مزدوَج تلقائياً (مدين الخزينة المستلمة / دائن الخزينة المحولة) وتوثيقه بسجل القيود المعتمدة.</span>
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-amber-300" />
                    <span>تأكيد التحويل وتوثيق القيد ⚖️</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD NEW VAULT MODAL */}
      <AnimatePresence>
        {showAddVaultModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Building2 className="text-[#0F4C81] w-5 h-5" />
                  <span>{lang === 'ar' ? 'إضافة خزينة أو عهدة موقع جديدة' : 'Add New Vault or Project Custody'}</span>
                </h3>
                <button onClick={() => setShowAddVaultModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddVaultSubmit} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">اسم الخزينة / العهدة (بالعربية):</label>
                  <input
                    type="text"
                    required
                    value={addVaultForm.nameAr}
                    onChange={e => setAddVaultForm({ ...addVaultForm, nameAr: e.target.value })}
                    placeholder="مثال: خزينة موقع مشروع ميناء بورسعيد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تصنيف الخزينة:</label>
                    <select
                      value={addVaultForm.type}
                      onChange={e => setAddVaultForm({ ...addVaultForm, type: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      <option value="main">خزينة رئيسية</option>
                      <option value="branch">فرع إداري</option>
                      <option value="project">موقع مشروع / أوناش</option>
                      <option value="petty_cash">عهدة نقدية نثرية</option>
                      <option value="foreign">حساب عملات أجنبية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">العملة:</label>
                    <select
                      value={addVaultForm.currency}
                      onChange={e => setAddVaultForm({ ...addVaultForm, currency: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">الرصيد الافتتاحي:</label>
                    <input
                      type="number"
                      value={addVaultForm.initialBalance}
                      onChange={e => setAddVaultForm({ ...addVaultForm, initialBalance: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-emerald-700 font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">كود الخزينة (Code):</label>
                    <input
                      type="text"
                      value={addVaultForm.code}
                      onChange={e => setAddVaultForm({ ...addVaultForm, code: e.target.value })}
                      placeholder="VLT-007"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">اسم أمين الخزينة / العهدة:</label>
                    <input
                      type="text"
                      value={addVaultForm.manager}
                      onChange={e => setAddVaultForm({ ...addVaultForm, manager: e.target.value })}
                      placeholder="م. أحمد حسن"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">الموقع / العنوان:</label>
                    <input
                      type="text"
                      value={addVaultForm.location}
                      onChange={e => setAddVaultForm({ ...addVaultForm, location: e.target.value })}
                      placeholder="موقع العاصمة / فرع الجيزة"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddVaultModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F4C81] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>حفظ وإنشاء الخزينة 🏛️</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PRINTABLE VOUCHER & JOURNAL SLIP MODAL */}
      <AnimatePresence>
        {showJournalSlipModal && selectedTransferForSlip && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden text-right p-8 font-sans space-y-6"
            >
              {/* Header Document Brand */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-[#0F4C81]" />
                    <h2 className="text-base font-black text-slate-900">شركة مصر للأوناش والمعدات الثقيلة (ش.م.م)</h2>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">الإدارة المالية المركزية - قسم الحسابات والخزينة</p>
                </div>
                <div className="text-left font-mono space-y-1">
                  <div className="text-xs font-black bg-slate-100 px-3 py-1 rounded-lg border border-slate-300 text-[#0F4C81]">
                    سند تحويل خزينة رقم: {selectedTransferForSlip.transferNo}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">التاريخ: {selectedTransferForSlip.date}</p>
                </div>
              </div>

              {/* Title Badge */}
              <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-sm font-black text-slate-800">
                  سند تحويل نقدية بين الخزائن وقيد يومية مزدوَج معتمد
                </h3>
                <p className="text-[10px] text-slate-500 font-bold">رقم قيد اليومية العامة: <span className="font-mono text-purple-700">{selectedTransferForSlip.journalVoucherNo}</span></p>
              </div>

              {/* Transfer Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs font-bold">
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[10px]">الخزينة المحوّل منها (الطرف الدائن -):</span>
                  <p className="text-rose-700 font-black text-sm">{selectedTransferForSlip.fromVaultName}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[10px]">الخزينة المحوّل إليها (الطرف المدين +):</span>
                  <p className="text-emerald-700 font-black text-sm">{selectedTransferForSlip.toVaultName}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[10px]">المبلغ المحول رقماً:</span>
                  <p className="text-slate-900 font-mono text-base font-black">
                    {selectedTransferForSlip.amount.toLocaleString()} {selectedTransferForSlip.currency}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-slate-400 text-[10px]">رقم الإذن / السند المرجعي:</span>
                  <p className="text-slate-700 font-mono">{selectedTransferForSlip.referenceVoucher}</p>
                </div>
                <div className="col-span-2 space-y-1.5 border-t border-slate-200 pt-2">
                  <span className="text-slate-400 text-[10px]">البيان والسبب:</span>
                  <p className="text-slate-800">{selectedTransferForSlip.notes}</p>
                </div>
              </div>

              {/* Double-Entry Journal Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-600" />
                  <span>جدول قيد اليومية العامة المزدوج (Double-Entry Log):</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-300 text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-900 text-white font-black">
                      <tr>
                        <th className="p-2.5">اسم الحساب / دليل الحسابات</th>
                        <th className="p-2.5">مدين (+)</th>
                        <th className="p-2.5">دائن (-)</th>
                        <th className="p-2.5">مركز التكلفة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold">
                      <tr className="bg-emerald-50/50">
                        <td className="p-2.5 text-emerald-900">حـ/ {selectedTransferForSlip.toVaultName} (خزينة استلام)</td>
                        <td className="p-2.5 font-mono text-emerald-700 font-black">{selectedTransferForSlip.amount.toLocaleString()} ج.م</td>
                        <td className="p-2.5 font-mono text-slate-400">0.00</td>
                        <td className="p-2.5 text-slate-600">الإدارة المالية المركزية</td>
                      </tr>
                      <tr className="bg-rose-50/50">
                        <td className="p-2.5 text-rose-900">حـ/ {selectedTransferForSlip.fromVaultName} (خزينة تحويل)</td>
                        <td className="p-2.5 font-mono text-slate-400">0.00</td>
                        <td className="p-2.5 font-mono text-rose-700 font-black">{selectedTransferForSlip.amount.toLocaleString()} ج.م</td>
                        <td className="p-2.5 text-slate-600">الإدارة المالية المركزية</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300">
                      <tr>
                        <td className="p-2.5">الإجمالي المتوازن</td>
                        <td className="p-2.5 font-mono text-emerald-700">{selectedTransferForSlip.amount.toLocaleString()} ج.م</td>
                        <td className="p-2.5 font-mono text-rose-700">{selectedTransferForSlip.amount.toLocaleString()} ج.م</td>
                        <td className="p-2.5 text-emerald-600 text-[10px]">✅ القيد متوازن 100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-200 text-center text-[10px] font-bold text-slate-600">
                <div className="space-y-6">
                  <span>أمين الخزينة المحولة:</span>
                  <div className="border-b border-dashed border-slate-300 pt-2"></div>
                </div>
                <div className="space-y-6">
                  <span>استلام أمين الخزينة:</span>
                  <div className="border-b border-dashed border-slate-300 pt-2"></div>
                </div>
                <div className="space-y-6">
                  <span>المراجع المحاسبي:</span>
                  <div className="border-b border-dashed border-slate-300 pt-2"></div>
                </div>
                <div className="space-y-6">
                  <span>اعتماد مدير الخزينة:</span>
                  <div className="border-b border-dashed border-slate-300 pt-2"></div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJournalSlipModal(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0F4C81] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-300" />
                  <span>طباعة سند التحويل وقيد اليومية 🖨️</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. REGISTER POST-DATED CHECK (PDC) MODAL */}
        {showPdcRegisterModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <FileCheck className="text-amber-500 w-5 h-5" />
                  <span>{lang === 'ar' ? 'تسجيل وتوثيق شيك آجل / مؤجل جديد' : 'Register New Post-Dated Check (PDC)'}</span>
                </h3>
                <button onClick={() => setShowPdcRegisterModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handlePdcRegisterSubmit} className="space-y-3.5 text-xs font-bold">
                {/* Type & Auto-Collect */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">نوع الشيك الآجل:</label>
                    <select
                      value={pdcRegisterForm.type}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, type: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold cursor-pointer"
                    >
                      <option value="received">شيك وارد (أوراق قبض +)</option>
                      <option value="issued">شيك صادر (التزامات أوراق دفع -)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">آلية التحصيل التلقائي:</label>
                    <select
                      value={pdcRegisterForm.autoCollect ? 'true' : 'false'}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, autoCollect: e.target.value === 'true'})}
                      className="w-full bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 font-extrabold text-emerald-900 cursor-pointer"
                    >
                      <option value="true">🤖 تحصيل وقيد تلقائي بموعد الاستحقاق</option>
                      <option value="false">✋ تحصيل يدوي بموافقة أمين الخزينة</option>
                    </select>
                  </div>
                </div>

                {/* Check Number & Bank Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">رقم الشيك البنكي:</label>
                    <input
                      type="text"
                      required
                      value={pdcRegisterForm.checkNo}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, checkNo: e.target.value})}
                      placeholder="PDC-2026-9901"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-amber-600 font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">اسم البنك المسحوب عليه:</label>
                    <select
                      value={pdcRegisterForm.bankName}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, bankName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      <option value="البنك الأهلي المصري">البنك الأهلي المصري</option>
                      <option value="بنك مصر">بنك مصر</option>
                      <option value="البنك التجاري الدولي CIB">البنك التجاري الدولي CIB</option>
                      <option value="بنك القاهرة">بنك القاهرة</option>
                      <option value="البنك العربي الأفريقي الدولي">البنك العربي الأفريقي الدولي</option>
                      <option value="بنك الإسكندرية">بنك الإسكندرية</option>
                    </select>
                  </div>
                </div>

                {/* Partner Name & Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">اسم العميل / المورد / الشريك:</label>
                    <input
                      type="text"
                      required
                      value={pdcRegisterForm.partnerName}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, partnerName: e.target.value})}
                      placeholder="شركة المقاولون العرب"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">مبلغ الشيك (ج.م):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pdcRegisterForm.amount}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, amount: e.target.value})}
                      placeholder="250000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-emerald-700 font-extrabold"
                    />
                  </div>
                </div>

                {/* Dates: Issue Date & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ تحرير الشيك (الإصدار):</label>
                    <input
                      type="date"
                      required
                      value={pdcRegisterForm.issueDate}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, issueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ الاستحقاق والتحصيل:</label>
                    <input
                      type="date"
                      required
                      value={pdcRegisterForm.dueDate}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, dueDate: e.target.value})}
                      className="w-full bg-amber-50/60 border border-amber-300 rounded-xl p-2 font-mono font-extrabold text-slate-900"
                    />
                  </div>
                </div>

                {/* Target Vault & Cost Center */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">الخزينة المستهدفة عند الإيداع:</label>
                    <select
                      value={pdcRegisterForm.targetVaultId}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, targetVaultId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      {vaults.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">مركز التكلفة المربوط:</label>
                    <select
                      value={pdcRegisterForm.costCenterId}
                      onChange={e => setPdcRegisterForm({...pdcRegisterForm, costCenterId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      {costCenters.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account No & Notes */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">رقم الحساب المصرفي / IBAN (اختياري):</label>
                  <input
                    type="text"
                    value={pdcRegisterForm.accountNo}
                    onChange={e => setPdcRegisterForm({...pdcRegisterForm, accountNo: e.target.value})}
                    placeholder="EG1200020015000982100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">ملاحظات / الغرض من الشيك:</label>
                  <input
                    type="text"
                    value={pdcRegisterForm.notes}
                    onChange={e => setPdcRegisterForm({...pdcRegisterForm, notes: e.target.value})}
                    placeholder="دفعة إيجار أوناش موقع العاصمة - مستخلص شهر يوليو"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPdcRegisterModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حفظ وتسجيل الشيك الآجل 📑</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 5. RESCHEDULE PDC DUE DATE MODAL */}
        {showPdcRescheduleModal && selectedPdcForReschedule && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-right p-6 font-sans space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-md font-black text-slate-800 flex items-center gap-2">
                  <Calendar className="text-indigo-600 w-5 h-5" />
                  <span>تأجيل وإعادة جدولة تاريخ تحصيل الشيك الآجل</span>
                </h3>
                <button onClick={() => setShowPdcRescheduleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              {/* Check Details Summary Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم الشيك:</span>
                  <span className="font-mono font-black text-amber-600">{selectedPdcForReschedule.checkNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الطرف الآخر:</span>
                  <span className="text-slate-900">{selectedPdcForReschedule.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المبلغ المالي:</span>
                  <span className="font-mono text-emerald-700 font-extrabold">{selectedPdcForReschedule.amount.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">التاريخ الحالي للاستحقاق:</span>
                  <span className="font-mono text-rose-600">{selectedPdcForReschedule.dueDate}</span>
                </div>
              </div>

              <form onSubmit={handlePdcRescheduleSubmit} className="space-y-3.5 text-xs font-bold">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">تاريخ الاستحقاق الجديد (المؤجل):</label>
                  <input
                    type="date"
                    required
                    value={pdcRescheduleDate}
                    onChange={e => setPdcRescheduleDate(e.target.value)}
                    className="w-full bg-indigo-50/60 border border-indigo-200 rounded-xl p-2.5 font-mono text-indigo-900 font-extrabold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">سبب التمديد / التوجيه الإداري:</label>
                  <textarea
                    rows={2}
                    required
                    value={pdcRescheduleReason}
                    onChange={e => setPdcRescheduleReason(e.target.value)}
                    placeholder="اتفاق مع الشريك على مهلة إضافية 15 يوماً لحين صرف المستخلص..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  />
                </div>

                {/* History of Postponements if any */}
                {selectedPdcForReschedule.postponedHistory && selectedPdcForReschedule.postponedHistory.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-100 pt-2">
                    <span className="text-[10px] text-slate-500 font-bold block">سجل التأجيلات السابقة:</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {selectedPdcForReschedule.postponedHistory.map((h, i) => (
                        <div key={i} className="text-[10px] bg-amber-50/80 p-2 rounded-lg border border-amber-100 text-amber-900">
                          <span>من {h.oldDate} ⬅️ إلى {h.newDate} | السبب: {h.reason} ({h.date})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPdcRescheduleModal(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-300" />
                    <span>تأكيد التأجيل وحفظ الموعد 🗓️</span>
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
