import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Briefcase, 
  Award, ArrowUpRight, ArrowDownRight, Filter, Download, Printer, 
  RefreshCw, FileText, Calendar, Building2, CheckCircle2, ChevronDown, 
  ChevronRight, HelpCircle, AlertCircle, Layers, Check, Calculator, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CostCenter, Invoice, JournalEntry, AccountNode } from '../types';
import { initialAccounts } from '../mockData';
import { useLanguage } from '../components/LanguageContext';
import ExportPDFButton from '../components/ExportPDFButton';
import { exportTableToPDF, PDFExportOptions } from '../utils/pdfExport';

interface FinancialReportsProps {
  costCenters: CostCenter[];
  invoices: Invoice[];
  journalEntries: JournalEntry[];
}

export default function FinancialReports({
  costCenters = [],
  invoices = [],
  journalEntries = []
}: FinancialReportsProps) {
  const { language, t, dir } = useLanguage();
  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState<'pnl' | 'balance' | 'trial' | 'cashflow' | 'ledger'>('pnl');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // all, q1, q2, q3, q4
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({
    rev: true,
    exp: true,
    assets: true,
    liab: true
  });

  // General Ledger States
  const [ledgerAccountCode, setLedgerAccountCode] = useState<string>('121'); // default to cash in banks
  const [ledgerStartDate, setLedgerStartDate] = useState<string>('2026-07-01');
  const [ledgerEndDate, setLedgerEndDate] = useState<string>('2026-07-31');
  const [isRefreshingLedger, setIsRefreshingLedger] = useState<boolean>(false);

  // General Ledger Static Account List
  const ledgerAccounts = useMemo(() => [
    { code: '111', name: language === 'ar' ? 'أوناش ومعدات الرفع الثقيل' : 'Heavy Lift Cranes & Equipment', nameAr: 'أوناش ومعدات الرفع الثقيل', type: 'assets', baseBalance: 25000000 },
    { code: '112', name: language === 'ar' ? 'سيارات نقل ثقيل وجرارات ومقطورات' : 'Heavy Duty Trucks, Tractors & Trailers', nameAr: 'سيارات نقل ثقيل وجرارات ومقطورات', type: 'assets', baseBalance: 5000000 },
    { code: '121', name: language === 'ar' ? 'نقدية بالبنوك المحلية والمصارف' : 'Cash in Local Banks & Accounts', nameAr: 'نقدية بالبنوك المحلية والمصارف', type: 'assets', baseBalance: 8500000 },
    { code: '122', name: language === 'ar' ? 'ذمم وحسابات عملاء تأجير الأوناش' : 'Receivables & Crane Rental Accounts', nameAr: 'ذمم وحسابات عملاء تأجير الأوناش', type: 'assets', baseBalance: 3500000 },
    { code: '123', name: language === 'ar' ? 'مخازن قطع الغيار والمحركات والزيوت' : 'Spare Parts, Engines & Oil Stocks', nameAr: 'مخازن قطع الغيار والمحركات والزيوت', type: 'assets', baseBalance: 1000000 },
    { code: '211', name: language === 'ar' ? 'رأس المال المدفوع للمساهمين' : 'Paid-up Capital of Shareholders', nameAr: 'رأس المال المدفوع للمساهمين', type: 'equity', baseBalance: 25000000 },
    { code: '221', name: language === 'ar' ? 'مستحقات الموردين وشركات الدعم' : 'Payables to Suppliers & Support Companies', nameAr: 'مستحقات الموردين وشركات الدعم', type: 'liabilities', baseBalance: 2400000 },
    { code: '222', name: language === 'ar' ? 'مخصصات ضرائب ومستحقات حكومية' : 'Tax Provisions & Government Payables', nameAr: 'مخصصات ضرائب ومستحقات حكومية', type: 'liabilities', baseBalance: 950000 },
    { code: '223', name: language === 'ar' ? 'قروض طويلة وقصيرة الأجل' : 'Long & Short-Term Loans', nameAr: 'قروض طويلة وقصيرة الأجل', type: 'liabilities', baseBalance: 5650000 },
    { code: '311', name: language === 'ar' ? 'إيرادات تأجير الأوناش والمعدات' : 'Crane & Equipment Rental Revenues', nameAr: 'إيرادات تأجير الأوناش والمعدات', type: 'revenues', baseBalance: 18450000 },
    { code: '312', name: language === 'ar' ? 'إيرادات نقليات وخدمات لوجستية' : 'Transportation & Logistics Revenues', nameAr: 'إيرادات نقليات وخدمات لوجستية', type: 'revenues', baseBalance: 4120000 },
    { code: '411', name: language === 'ar' ? 'أجور ورواتب الموظفين والمهندسين' : 'Employees & Engineers Salaries', nameAr: 'أجور ورواتب الموظفين والمهندسين', type: 'expenses', baseBalance: 6200000 },
    { code: '412', name: language === 'ar' ? 'مصاريف وقود وسولار تشغيل الأوناش' : 'Crane Fuel & Diesel Expenses', nameAr: 'مصاريف وقود وسولار تشغيل الأوناش', type: 'expenses', baseBalance: 3150000 },
    { code: '413', name: language === 'ar' ? 'مصاريف صيانة وقطع غيار هيدروليكية' : 'Maintenance & Hydraulic Spare Parts', nameAr: 'مصاريف صيانة وقطع غيار هيدروليكية', type: 'expenses', baseBalance: 2840000 },
    { code: '414', name: language === 'ar' ? 'إيجارات واستهلاكات أصول ورش الجيزة' : 'Giza Workshop Rental & Depreciation', nameAr: 'إيجارات واستهلاكات أصول ورش الجيزة', type: 'expenses', baseBalance: 1950000 },
  ], [language]);

  // Predefined posting list representing real entries
  const predefinedPostings = useMemo(() => [
    // Account 121 (نقدية بالبنوك)
    { date: '2026-07-01', docNo: 'JV-2026-010', description: 'صرف دفعة عهدة نقدية لورشة الجيزة لشراء مستلزمات طارئة', debit: 0, credit: 50000, accountCode: '121', accountName: 'نقدية بالبنوك' },
    { date: '2026-07-02', docNo: 'JV-2026-002', description: 'صرف تكاليف صيانة طارئة وشراء قطع غيار هيدروليكية لونش CC 2400', debit: 0, credit: 125000, accountCode: '121', accountName: 'نقدية بالبنوك' },
    { date: '2026-07-04', docNo: 'JV-2026-011', description: 'تحصيل دفعة المقاولون العرب بموجب الفاتورة INV-2026-101 ورصيد الحساب', debit: 450000, credit: 0, accountCode: '121', accountName: 'نقدية بالبنوك' },
    { date: '2026-07-05', docNo: 'JV-2026-003', description: 'شراء وتوريد سولار تشغيل أوناش ومركبات الحركة لورشة الجيزة والمواقع', debit: 0, credit: 85000, accountCode: '121', accountName: 'نقدية بالبنوك' },
    { date: '2026-07-08', docNo: 'JV-2026-004', description: 'إثبات دفعة مقدمة من عقد تأجير ونش LR 1600 لموقع بورسعيد - أوراسكوم للإنشاءات', debit: 1200000, credit: 0, accountCode: '121', accountName: 'نقدية بالبنوك' },
    { date: '2026-07-09', docNo: 'JV-2026-014', description: 'تحصيل دفعة نقدية من شركة السويدي إليكتريك مشروعات خليج السويس', debit: 747500, credit: 0, accountCode: '121', accountName: 'نقدية بالبنوك' },
    
    // Account 122 (ذمم وحسابات عملاء)
    { date: '2026-07-01', docNo: 'JV-2026-001', description: 'إثبات فاتورة إيرادات تشغيل ونش ديمباج ٢٥٠ طن بموقع العاصمة الإدارية - شركة المقاولون العرب', debit: 450000, credit: 0, accountCode: '122', accountName: 'حسابات العملاء (تأجير معدات)' },
    { date: '2026-07-04', docNo: 'JV-2026-011', description: 'تحصيل دفعة المقاولون العرب بموجب الفاتورة INV-2026-101 ورصيد الحساب', debit: 0, credit: 450000, accountCode: '122', accountName: 'حسابات العملاء (تأجير معدات)' },
    { date: '2026-07-08', docNo: 'JV-2026-012', description: 'إثبات فاتورة تشغيل ونش جروف لشركة المقاولون العرب بموقع العلمين الجديدة', debit: 800000, credit: 0, accountCode: '122', accountName: 'حسابات العملاء (تأجير معدات)' },
    { date: '2026-07-08', docNo: 'JV-2026-004', description: 'إثبات دفعة مقدمة من عقد تأجير ونش LR 1600 لموقع بورسعيد - أوراسكوم للإنشاءات', debit: 0, credit: 1200000, accountCode: '122', accountName: 'حسابات العملاء (تأجير معدات)' },

    // Account 413 (مصاريف صيانة)
    { date: '2026-07-02', docNo: 'JV-2026-002', description: 'صرف تكاليف صيانة طارئة وشراء قطع غيار هيدروليكية لونش CC 2400', debit: 125000, credit: 0, accountCode: '413', accountName: 'مصاريف صيانة الأوناش والزيوت' },
    { date: '2026-07-03', docNo: 'JV-2026-018', description: 'صرف خامات تشحيم وفلاتر وقاية لونش ليبهير LTM 1100', debit: 35000, credit: 0, accountCode: '413', accountName: 'مصاريف صيانة الأوناش والزيوت' },
    { date: '2026-07-05', docNo: 'JV-2026-003', description: 'شراء وتوريد سولار تشغيل أوناش ومركبات الحركة لورشة الجيزة والمواقع', debit: 85000, credit: 0, accountCode: '413', accountName: 'مصاريف صيانة الأوناش والزيوت' },
    { date: '2026-07-07', docNo: 'JV-2026-019', description: 'شراء وتوريد خراطيم ضغط عالي إيطالي للمخزن الرئيسي بالجيزة', debit: 95000, credit: 0, accountCode: '413', accountName: 'مصاريف صيانة الأوناش والزيوت' },

    // Account 111 (أوناش ومعدات)
    { date: '2026-07-02', docNo: 'JV-2026-020', description: 'إثبات توريد كبينة ونش تلسكوبي ليبهير إضافية وتحديث الأصول', debit: 280000, credit: 0, accountCode: '111', accountName: 'أوناش ومعدات الرفع الثقيل' },
    { date: '2026-07-06', docNo: 'JV-2026-021', description: 'إهلاك ربع سنوي لأصول الرفع الثقيل والرافعات المجمعة', debit: 0, credit: 120000, accountCode: '111', accountName: 'أوناش ومعدات الرفع الثقيل' },

    // Account 123 (مخازن قطع الغيار)
    { date: '2026-07-03', docNo: 'JV-2026-018', description: 'صرف خامات تشحيم وفلاتر وقاية لونش ليبهير LTM 1100', debit: 0, credit: 35000, accountCode: '123', accountName: 'مخازن قطع الغيار والمستهلكات' },
    { date: '2026-07-07', docNo: 'JV-2026-019', description: 'شراء وتوريد خراطيم ضغط عالي إيطالي للمخزن الرئيسي بالجيزة', debit: 95000, credit: 0, accountCode: '123', accountName: 'مخازن قطع الغيار والمستهلكات' },

    // Account 311 (إيرادات تأجير الأوناش)
    { date: '2026-07-01', docNo: 'JV-2026-001', description: 'إثبات فاتورة إيرادات تشغيل ونش ديمباج ٢٥٠ طن بموقع العاصمة الإدارية - شركة المقاولون العرب', debit: 0, credit: 450000, accountCode: '311', accountName: 'إيرادات وعقود تأجير أسطول الأوناش الثقيلة' },
  ], []);

  // Combine predefined with user journal entries
  const allLedgerPostings = useMemo(() => {
    const postings = [...predefinedPostings];
    const existingDocNos = new Set(predefinedPostings.map(p => p.docNo));

    journalEntries.forEach(entry => {
      if (entry.status === 'approved' && !existingDocNos.has(entry.docNo)) {
        if (entry.lines && entry.lines.length > 0) {
          entry.lines.forEach(line => {
            postings.push({
              date: entry.date,
              docNo: entry.docNo,
              description: entry.description,
              debit: line.debit,
              credit: line.credit,
              accountCode: '',
              accountName: line.accountName
            });
          });
        }
      }
    });

    return postings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [predefinedPostings, journalEntries]);

  // Selected ledger account metadata
  const selectedLedgerAccount = useMemo(() => {
    return ledgerAccounts.find(acc => acc.code === ledgerAccountCode) || ledgerAccounts[2];
  }, [ledgerAccountCode, ledgerAccounts]);

  // Filter postings for selected account
  const accountPostings = useMemo(() => {
    if (!selectedLedgerAccount) return [];
    
    return allLedgerPostings.filter(posting => {
      const pName = posting.accountName.trim();
      const sNameAr = selectedLedgerAccount.nameAr.trim();
      
      const nameMatch = pName === sNameAr ||
                        (selectedLedgerAccount.code === '121' && pName.includes('نقدية')) ||
                        (selectedLedgerAccount.code === '122' && pName.includes('العملاء')) ||
                        (selectedLedgerAccount.code === '123' && pName.includes('مخازن')) ||
                        (selectedLedgerAccount.code === '413' && pName.includes('صيانة')) ||
                        (selectedLedgerAccount.code === '111' && pName.includes('أوناش')) ||
                        (selectedLedgerAccount.code === '311' && pName.includes('إيرادات'));
      
      return posting.accountCode === selectedLedgerAccount.code || nameMatch;
    });
  }, [selectedLedgerAccount, allLedgerPostings]);

  // Calculate ledger metrics, starting balance, movements, and ending balance
  const ledgerReportData = useMemo(() => {
    if (!selectedLedgerAccount) return { openingBalance: 0, movements: [], totalDebit: 0, totalCredit: 0, endingBalance: 0 };

    const isDebitAccount = selectedLedgerAccount.type === 'assets' || selectedLedgerAccount.type === 'expenses';
    const baseStarting = Math.round(selectedLedgerAccount.baseBalance * 0.85);

    // Filter postings before ledgerStartDate to compute Opening Balance
    const postingsBefore = accountPostings.filter(p => new Date(p.date) < new Date(ledgerStartDate));
    
    let openingBalance = baseStarting;
    postingsBefore.forEach(p => {
      if (isDebitAccount) {
        openingBalance += (p.debit - p.credit);
      } else {
        openingBalance += (p.credit - p.debit);
      }
    });

    // Filter postings during the selected date range
    const periodPostings = accountPostings.filter(p => {
      const d = new Date(p.date);
      return d >= new Date(ledgerStartDate) && d <= new Date(ledgerEndDate);
    });

    // Compute running balances and totals
    let currentBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const movements = periodPostings.map(p => {
      totalDebit += p.debit;
      totalCredit += p.credit;
      
      if (isDebitAccount) {
        currentBalance += (p.debit - p.credit);
      } else {
        currentBalance += (p.credit - p.debit);
      }

      return {
        ...p,
        runningBalance: currentBalance
      };
    });

    const endingBalance = currentBalance;

    return {
      openingBalance,
      movements,
      totalDebit,
      totalCredit,
      endingBalance
    };
  }, [selectedLedgerAccount, accountPostings, ledgerStartDate, ledgerEndDate]);

  // Calculate dynamic financial data based on filters
  const currentCostCenterObj = useMemo(() => {
    if (selectedCostCenter === 'all') return null;
    return costCenters.find(cc => cc.id === selectedCostCenter) || null;
  }, [selectedCostCenter, costCenters]);

  // Simulated base data (representing high-level aggregated values with modifiers based on selected filters)
  const filterModifier = useMemo(() => {
    let multiplier = 1.0;
    if (selectedCostCenter !== 'all') {
      // Scale down numbers proportional to the cost center budget
      const cc = costCenters.find(c => c.id === selectedCostCenter);
      if (cc) {
        multiplier = cc.budget / 42500000; // sum of budgets approx 42.5M
      } else {
        multiplier = 0.2;
      }
    }
    if (selectedPeriod === 'q1') multiplier *= 0.23;
    if (selectedPeriod === 'q2') multiplier *= 0.26;
    if (selectedPeriod === 'q3') multiplier *= 0.25;
    if (selectedPeriod === 'q4') multiplier *= 0.26;
    return multiplier;
  }, [selectedCostCenter, selectedPeriod, costCenters]);

  // Dynamic P&L Data
  const pnlData = useMemo(() => {
    const modifier = filterModifier;
    
    const revenues = {
      craneRental: Math.round(18450000 * modifier),
      logisticServices: Math.round(4120000 * modifier),
      externalMaintenance: Math.round(1680000 * modifier),
      otherRevenue: Math.round(450000 * modifier)
    };
    
    const expenses = {
      salaries: Math.round(6200000 * modifier),
      fuel: Math.round(3150000 * modifier),
      maintenanceSpareParts: Math.round(2840000 * modifier),
      rentDepreciation: Math.round(1950000 * modifier),
      insuranceSafety: Math.round(850000 * modifier),
      marketingGeneral: Math.round(620000 * modifier)
    };

    const totalRevenue = Object.values(revenues).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const grossProfit = totalRevenue - totalExpenses;
    const taxProvision = Math.round(grossProfit * 0.225); // 22.5% Egyptian corporate tax
    const netProfit = grossProfit - taxProvision;

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      grossProfit,
      taxProvision,
      netProfit
    };
  }, [filterModifier]);

  // Balance Sheet Data
  const balanceSheetData = useMemo(() => {
    // Assets are usually constant but slightly scaled for centers if filtered
    const modifier = selectedCostCenter === 'all' ? 1.0 : filterModifier * 2.5;

    const currentAssets = {
      cashBanks: Math.round(8500000 * modifier),
      receivables: Math.round(3500000 * modifier),
      inventory: Math.round(1000000 * modifier)
    };

    const fixedAssets = {
      cranesHeavyEquipment: Math.round(25000000 * modifier),
      vehiclesTrailers: Math.round(5000000 * modifier),
      officeAssets: Math.round(2000000 * modifier)
    };

    const currentLiabilities = {
      suppliersPayables: Math.round(2400000 * modifier),
      taxProvisions: Math.round(950000 * modifier),
      shortTermLoans: Math.round(1150000 * modifier)
    };

    const longTermLiabilities = {
      longTermLoans: Math.round(4500000 * modifier),
      employeeEndService: Math.round(800000 * modifier)
    };

    const equity = {
      paidCapital: Math.round(25000000 * modifier),
      retainedEarnings: Math.round(7100000 * modifier),
      currentYearEarnings: Math.round(3100000 * modifier)
    };

    const totalCurrentAssets = Object.values(currentAssets).reduce((a, b) => a + b, 0);
    const totalFixedAssets = Object.values(fixedAssets).reduce((a, b) => a + b, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = Object.values(currentLiabilities).reduce((a, b) => a + b, 0);
    const totalLongTermLiabilities = Object.values(longTermLiabilities).reduce((a, b) => a + b, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalEquity = Object.values(equity).reduce((a, b) => a + b, 0);
    
    // Balance check
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      currentAssets,
      fixedAssets,
      totalCurrentAssets,
      totalFixedAssets,
      totalAssets,
      currentLiabilities,
      longTermLiabilities,
      totalCurrentLiabilities,
      totalLongTermLiabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity
    };
  }, [selectedCostCenter, filterModifier]);

  // Trial Balance Accounts
  const trialBalanceAccounts = useMemo(() => {
    const modifier = filterModifier;
    return [
      { code: '111', name: language === 'ar' ? 'أوناش ومعدات الرفع الثقيل' : 'Heavy Lift Cranes & Equipment', debit: Math.round(25000000 * modifier), credit: 0 },
      { code: '112', name: language === 'ar' ? 'ناقلات وجرارات وسيارات صيانة' : 'Tractors & Maintenance Vehicles', debit: Math.round(5000000 * modifier), credit: 0 },
      { code: '121', name: language === 'ar' ? 'نقدية بالبنوك المحلية والمصارف' : 'Cash in Local Banks & Accounts', debit: Math.round(8500000 * modifier), credit: 0 },
      { code: '122', name: language === 'ar' ? 'ذمم وحسابات عملاء تأجير الأوناش' : 'Receivables & Crane Rental Accounts', debit: Math.round(3500000 * modifier), credit: 0 },
      { code: '123', name: language === 'ar' ? 'مخازن قطع الغيار والمحركات والزيوت' : 'Spare Parts, Engines & Oils Stocks', debit: Math.round(1000000 * modifier), credit: 0 },
      { code: '211', name: language === 'ar' ? 'رأس المال المدفوع للمساهمين' : 'Paid-up Capital of Shareholders', debit: 0, credit: Math.round(25000000 * modifier) },
      { code: '221', name: language === 'ar' ? 'مستحقات الموردين وشركات الدعم' : 'Payables to Suppliers & Support Companies', debit: 0, credit: Math.round(2400000 * modifier) },
      { code: '222', name: language === 'ar' ? 'مخصصات ضرائب ومستحقات حكومية' : 'Tax Provisions & Government Payables', debit: 0, credit: Math.round(950000 * modifier) },
      { code: '223', name: language === 'ar' ? 'قروض طويلة وقصيرة الأجل' : 'Long & Short-Term Loans', debit: 0, credit: Math.round(5650000 * modifier) },
      { code: '311', name: language === 'ar' ? 'إيرادات تأجير الأوناش والمعدات' : 'Crane & Equipment Rental Revenues', debit: 0, credit: Math.round(18450000 * modifier) },
      { code: '312', name: language === 'ar' ? 'إيرادات نقليات وخدمات لوجستية' : 'Transportation & Logistics Revenues', debit: 0, credit: Math.round(4120000 * modifier) },
      { code: '411', name: language === 'ar' ? 'أجور ورواتب الموظفين والمهندسين' : 'Employees & Engineers Salaries', debit: Math.round(6200000 * modifier), credit: 0 },
      { code: '412', name: language === 'ar' ? 'مصاريف وقود وسولار تشغيل الأوناش' : 'Crane Fuel & Diesel Expenses', debit: Math.round(3150000 * modifier), credit: 0 },
      { code: '413', name: language === 'ar' ? 'مصاريف صيانة وقطع غيار هيدروليكية' : 'Maintenance & Hydraulic Spare Parts', debit: Math.round(2840000 * modifier), credit: 0 },
      { code: '414', name: language === 'ar' ? 'إيجارات واستهلاكات أصول ورش الجيزة' : 'Giza Workshop Rental & Depreciation', debit: Math.round(1950000 * modifier), credit: 0 },
    ];
  }, [filterModifier, language]);

  const trialBalanceTotals = useMemo(() => {
    return trialBalanceAccounts.reduce((acc, current) => {
      acc.debit += current.debit;
      acc.credit += current.credit;
      return acc;
    }, { debit: 0, credit: 0 });
  }, [trialBalanceAccounts]);

  // Monthly Financial Trend for Charts (based on filters)
  const monthlyData = useMemo(() => {
    const baseRevenues = [1.2, 1.4, 1.6, 1.5, 1.8, 2.1, 2.3, 2.2, 2.0, 2.4, 2.6, 2.8];
    const baseExpenses = [0.8, 0.9, 1.1, 1.0, 1.1, 1.3, 1.4, 1.3, 1.2, 1.5, 1.6, 1.7];
    const months = language === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const modifier = filterModifier * (selectedCostCenter === 'all' ? 1.0 : 5.0);

    return months.map((month, idx) => {
      const rev = Math.round(baseRevenues[idx] * 1200000 * modifier);
      const exp = Math.round(baseExpenses[idx] * 1200000 * modifier);
      return {
        name: month,
        [language === 'ar' ? 'إيرادات' : 'Revenues']: rev,
        [language === 'ar' ? 'مصروفات' : 'Expenses']: exp,
        [language === 'ar' ? 'صافي الربح' : 'Net Profit']: rev - exp
      };
    });
  }, [selectedCostCenter, filterModifier, language]);

  // Cash Flow Data
  const cashFlowData = useMemo(() => {
    const modifier = filterModifier;
    const operatingInflows = Math.round(22500000 * modifier);
    const operatingOutflows = Math.round(12800000 * modifier);
    const netOperatingCash = operatingInflows - operatingOutflows;

    const investingOutflows = Math.round(4500000 * modifier); // purchasing cranes
    const investingInflows = Math.round(80000 * modifier); // scrap sale
    const netInvestingCash = investingInflows - investingOutflows;

    const financingInflows = Math.round(2000000 * modifier); // new bank loan
    const financingOutflows = Math.round(1200000 * modifier); // loan payoff
    const netFinancingCash = financingInflows - financingOutflows;

    const netChangeInCash = netOperatingCash + netInvestingCash + netFinancingCash;
    const cashAtBeginning = Math.round(6200000 * modifier);
    const cashAtEnd = cashAtBeginning + netChangeInCash;

    return {
      operatingInflows,
      operatingOutflows,
      netOperatingCash,
      investingInflows,
      investingOutflows,
      netInvestingCash,
      financingInflows,
      financingOutflows,
      netFinancingCash,
      netChangeInCash,
      cashAtBeginning,
      cashAtEnd
    };
  }, [filterModifier]);

  // Auditing / Operational Ratios
  const financialRatios = useMemo(() => {
    const { totalCurrentAssets, totalCurrentLiabilities, totalAssets, totalLiabilities, totalEquity } = balanceSheetData;
    const { totalRevenue, netProfit } = pnlData;

    const currentRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets / totalCurrentLiabilities) : 0;
    const debtToEquity = totalEquity > 0 ? (totalLiabilities / totalEquity) : 0;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const returnOnAssets = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;

    return {
      currentRatio,
      debtToEquity,
      netProfitMargin,
      returnOnAssets
    };
  }, [balanceSheetData, pnlData]);

  // Current Tab PDF Options generator
  const currentTabPDFOptions = useMemo<PDFExportOptions>(() => {
    const isAr = language === 'ar';
    const periodLabel = selectedPeriod === 'all' 
      ? (isAr ? 'العام المالي بالكامل' : 'Full Fiscal Year') 
      : selectedPeriod.toUpperCase();
    const costCenterLabel = currentCostCenterObj 
      ? (isAr ? currentCostCenterObj.nameAr : currentCostCenterObj.nameEn)
      : (isAr ? 'كافة مراكز التكلفة المجمعة' : 'Consolidated Cost Centers');

    if (activeTab === 'pnl') {
      const rows = [
        { itemAr: 'إيرادات تأجير الأوناش والمعدات الثقيلة', itemEn: 'Crane & Heavy Equipment Rental Revenues', category: isAr ? 'إيرادات تشغيلية' : 'Operating Revenue', amount: pnlData.revenues.craneRental, pct: ((pnlData.revenues.craneRental / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'إيرادات خدمات نقليات ولوجستيات الشحن', itemEn: 'Transportation & Logistics Revenues', category: isAr ? 'إيرادات تشغيلية' : 'Operating Revenue', amount: pnlData.revenues.logisticServices, pct: ((pnlData.revenues.logisticServices / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'إيرادات صيانة ودعم فني خارجي للأوناش', itemEn: 'External Maintenance & Support Revenues', category: isAr ? 'إيرادات تشغيلية' : 'Operating Revenue', amount: pnlData.revenues.externalMaintenance, pct: ((pnlData.revenues.externalMaintenance / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'إيرادات تشغيلية متنوعة وعوائد أخرى', itemEn: 'Other Operating Revenues', category: isAr ? 'إيرادات أخرى' : 'Other Revenue', amount: pnlData.revenues.otherRevenue, pct: ((pnlData.revenues.otherRevenue / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'أجور ورواتب مشغلي الأوناش والمهندسين والعمال', itemEn: 'Salaries of Operators, Engineers & Staff', category: isAr ? 'تكاليف تشغيل' : 'Operating Cost', amount: pnlData.expenses.salaries, pct: ((pnlData.expenses.salaries / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'مصاريف وقود وسولار تشغيل الأوناش ومعدات الحركة', itemEn: 'Fuel & Diesel Operating Expenses', category: isAr ? 'تكاليف تشغيل' : 'Operating Cost', amount: pnlData.expenses.fuel, pct: ((pnlData.expenses.fuel / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'مصاريف صيانة وقطع غيار هيدروليكية ومستهلكات', itemEn: 'Maintenance, Hydraulic Spares & Consumables', category: isAr ? 'تكاليف صيانة' : 'Maintenance Cost', amount: pnlData.expenses.maintenanceSpareParts, pct: ((pnlData.expenses.maintenanceSpareParts / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'إيجارات واستهلاكات ورش ومواقع الجيزة والمخازن', itemEn: 'Depreciation & Rent of Workshops/Sites', category: isAr ? 'إهلاك وإيجار' : 'Depreciation & Rent', amount: pnlData.expenses.rentDepreciation, pct: ((pnlData.expenses.rentDepreciation / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'تأمينات صناعية وتراخيص واشتراطات السلامة والبيئة', itemEn: 'Industrial Insurance, HSE & Licensing', category: isAr ? 'مصاريف سلامة' : 'Safety & HSE', amount: pnlData.expenses.insuranceSafety, pct: ((pnlData.expenses.insuranceSafety / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'مصاريف إدارية وتسويقية وعمومية', itemEn: 'General, Marketing & Administrative Expenses', category: isAr ? 'مصاريف إدارية' : 'Admin & General', amount: pnlData.expenses.marketingGeneral, pct: ((pnlData.expenses.marketingGeneral / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
        { itemAr: 'مخصص ضريبة الأرباح التجارية والصناعية (22.5%)', itemEn: 'Corporate Income Tax Provision (22.5%)', category: isAr ? 'ضرائب والتزامات' : 'Tax Provision', amount: pnlData.taxProvision, pct: ((pnlData.taxProvision / pnlData.totalRevenue) * 100).toFixed(1) + '%' },
      ];

      return {
        titleAr: `قائمة الأرباح والخسائر والدخل الشامل (${selectedYear})`,
        titleEn: `Income Statement & Comprehensive Income (${selectedYear})`,
        subtitleAr: `المركز: ${costCenterLabel} • الفترة: ${periodLabel}`,
        filename: `income_statement_${selectedYear}_${selectedPeriod}`,
        columns: [
          { headerAr: 'بند القائمة المالية', accessor: isAr ? 'itemAr' : 'itemEn', align: isAr ? 'right' : 'left' },
          { headerAr: 'التصنيف المحاسبي', accessor: 'category', align: 'center', width: '130px' },
          { headerAr: 'القيمة المقيدة', accessor: (r: any) => `${Number(r.amount).toLocaleString()} ج.م`, align: 'left', width: '150px' },
          { headerAr: 'النسبة من الإيراد', accessor: 'pct', align: 'center', width: '110px' }
        ],
        data: rows,
        summaryItems: [
          { labelAr: 'إجمالي الإيرادات التشغيلية', value: `${pnlData.totalRevenue.toLocaleString()} ج.م` },
          { labelAr: 'إجمالي المصروفات والتكاليف', value: `${pnlData.totalExpenses.toLocaleString()} ج.م` },
          { labelAr: 'مجمل الأرباح التشغيلية', value: `${pnlData.grossProfit.toLocaleString()} ج.م` },
          { labelAr: 'صافي الربح المحاسبي النهائي', value: `${pnlData.netProfit.toLocaleString()} ج.م`, highlight: true }
        ]
      };
    } else if (activeTab === 'balance') {
      const rows = [
        { itemAr: 'النقدية بالبنوك المحلية وحسابات الخزائن', itemEn: 'Cash in Local Banks & Treasury', type: isAr ? 'أصول متداولة' : 'Current Asset', amount: balanceSheetData.currentAssets.cashBanks },
        { itemAr: 'ذمم وحسابات عملاء تأجير الأوناش والمشروعات', itemEn: 'Trade Receivables & Clients', type: isAr ? 'أصول متداولة' : 'Current Asset', amount: balanceSheetData.currentAssets.receivables },
        { itemAr: 'مخازن قطع الغيار والمحركات والزيوت والمستهلكات', itemEn: 'Spare Parts, Engines & Oils Inventory', type: isAr ? 'أصول متداولة' : 'Current Asset', amount: balanceSheetData.currentAssets.inventory },
        { itemAr: 'أوناش ومعدات الرفع الثقيل (صافي القيمة)', itemEn: 'Heavy Lift Cranes Fleet (Net Value)', type: isAr ? 'أصول ثابتة' : 'Fixed Asset', amount: balanceSheetData.fixedAssets.cranesHeavyEquipment },
        { itemAr: 'ناقلات وجرارات وسيارات صيانة وحركة', itemEn: 'Tractors, Trucks & Service Vehicles', type: isAr ? 'أصول ثابتة' : 'Fixed Asset', amount: balanceSheetData.fixedAssets.vehiclesTrailers },
        { itemAr: 'أجهزة مكتبية ومعدات حاسوب وشبكات ومرافق', itemEn: 'Office Furniture, IT & Facilities', type: isAr ? 'أصول ثابتة' : 'Fixed Asset', amount: balanceSheetData.fixedAssets.officeAssets },
        { itemAr: 'مستحقات الموردين وشركات الدعم الفني', itemEn: 'Trade Payables & Suppliers', type: isAr ? 'خصوم متداولة' : 'Current Liability', amount: balanceSheetData.currentLiabilities.suppliersPayables },
        { itemAr: 'مخصصات ضرائب ومستحقات حكومية', itemEn: 'Tax Provisions & Government Dues', type: isAr ? 'خصوم متداولة' : 'Current Liability', amount: balanceSheetData.currentLiabilities.taxProvisions },
        { itemAr: 'قروض وتسهيلات ائتمانية قصيرة الأجل', itemEn: 'Short-term Bank Facilities', type: isAr ? 'خصوم متداولة' : 'Current Liability', amount: balanceSheetData.currentLiabilities.shortTermLoans },
        { itemAr: 'قروض تمويل أصول ومعدات طويلة الأجل', itemEn: 'Long-term Financing Loans', type: isAr ? 'خصوم طويلة الأجل' : 'Long-term Liability', amount: balanceSheetData.longTermLiabilities.longTermLoans },
        { itemAr: 'مخصص مكافأة نهاية الخدمة والالتزامات', itemEn: 'End of Service & Non-current Benefits', type: isAr ? 'خصوم طويلة الأجل' : 'Long-term Liability', amount: balanceSheetData.longTermLiabilities.employeeEndService },
        { itemAr: 'رأس المال المدفوع للمساهمين والشركاء', itemEn: 'Paid-up Capital of Shareholders', type: isAr ? 'حقوق ملكية' : 'Shareholders Equity', amount: balanceSheetData.equity.paidCapital },
        { itemAr: 'الأرباح المبقاة والمرحلة من الأعوام السابقة', itemEn: 'Retained & Carried Earnings', type: isAr ? 'حقوق ملكية' : 'Shareholders Equity', amount: balanceSheetData.equity.retainedEarnings },
        { itemAr: 'صافي أرباح العام المالي الجاري', itemEn: 'Current Year Retained Earnings', type: isAr ? 'حقوق ملكية' : 'Shareholders Equity', amount: balanceSheetData.equity.currentYearEarnings },
      ];

      return {
        titleAr: `الميزانية العمومية وقائمة المركز المالي (${selectedYear})`,
        titleEn: `Balance Sheet & Financial Position Statement (${selectedYear})`,
        subtitleAr: `المركز: ${costCenterLabel} • موازنة معتمدة ومطابقة بالدفاتر`,
        filename: `balance_sheet_${selectedYear}`,
        columns: [
          { headerAr: 'بند المركز المالي', accessor: isAr ? 'itemAr' : 'itemEn', align: isAr ? 'right' : 'left' },
          { headerAr: 'التبويب المحاسبي', accessor: 'type', align: 'center', width: '150px' },
          { headerAr: 'القيمة الدفترية', accessor: (r: any) => `${Number(r.amount).toLocaleString()} ج.م`, align: 'left', width: '160px' }
        ],
        data: rows,
        summaryItems: [
          { labelAr: 'إجمالي الأصول المتداولة', value: `${balanceSheetData.totalCurrentAssets.toLocaleString()} ج.م` },
          { labelAr: 'إجمالي الأصول الثابتة', value: `${balanceSheetData.totalFixedAssets.toLocaleString()} ج.م` },
          { labelAr: 'إجمالي الأصول (Assets)', value: `${balanceSheetData.totalAssets.toLocaleString()} ج.م`, highlight: true },
          { labelAr: 'إجمالي الخصوم وحقوق الملكية', value: `${balanceSheetData.totalLiabilitiesAndEquity.toLocaleString()} ج.م`, highlight: true }
        ]
      };
    } else if (activeTab === 'trial') {
      return {
        titleAr: `ميزان المراجعة بالأرصدة والمجاميع (${selectedYear})`,
        titleEn: `Trial Balance by Balances and Totals (${selectedYear})`,
        subtitleAr: `المركز: ${costCenterLabel} • حالة الاتزان: متزن 100%`,
        filename: `trial_balance_${selectedYear}`,
        columns: [
          { headerAr: 'كود الحساب', accessor: 'code', align: 'center', width: '90px' },
          { headerAr: 'اسم الحساب المحاسبي', accessor: 'name', align: isAr ? 'right' : 'left' },
          { headerAr: 'الرصيد المدين (Debit)', accessor: (r: any) => r.debit > 0 ? `${Number(r.debit).toLocaleString()} ج.م` : '-', align: 'left', width: '150px' },
          { headerAr: 'الرصيد الدائن (Credit)', accessor: (r: any) => r.credit > 0 ? `${Number(r.credit).toLocaleString()} ج.م` : '-', align: 'left', width: '150px' }
        ],
        data: trialBalanceAccounts,
        summaryItems: [
          { labelAr: 'إجمالي الأرصدة المدينة', value: `${trialBalanceTotals.debit.toLocaleString()} ج.م` },
          { labelAr: 'إجمالي الأرصدة الدائنة', value: `${trialBalanceTotals.credit.toLocaleString()} ج.م` },
          { labelAr: 'حالة توازن الميزان', value: 'متزن ومطابق بنسبة 100%', highlight: true },
          { labelAr: 'عدد الحسابات المفعلة', value: `${trialBalanceAccounts.length} حساب` }
        ]
      };
    } else if (activeTab === 'cashflow') {
      const rows = [
        { itemAr: 'التدفقات النقدية الداخلة من العمليات التشغيلية وتأجير الأوناش', itemEn: 'Operating Cash Inflows from Rentals', type: isAr ? 'أنشطة تشغيلية' : 'Operating', amount: `+${cashFlowData.operatingInflows.toLocaleString()} ج.م` },
        { itemAr: 'التدفقات النقدية الخارجة للمصروفات التشغيلية والرواتب والصيانة', itemEn: 'Operating Cash Outflows for Expenses', type: isAr ? 'أنشطة تشغيلية' : 'Operating', amount: `-${cashFlowData.operatingOutflows.toLocaleString()} ج.م` },
        { itemAr: 'صافي التدفق النقدي من الأنشطة التشغيلية (CFO)', itemEn: 'Net Operating Cash Flow (CFO)', type: isAr ? 'صافي تشغيلي' : 'Net Operating', amount: `${cashFlowData.netOperatingCash.toLocaleString()} ج.م` },
        { itemAr: 'مدفوعات رأسمالية لشراء أوناش وتحديث معدات الرفع', itemEn: 'Capital Expenditures on Cranes Fleet', type: isAr ? 'أنشطة استثمارية' : 'Investing', amount: `-${cashFlowData.investingOutflows.toLocaleString()} ج.م` },
        { itemAr: 'متحصلات بيع خردة وأصول مستهلكة خارج الخدمة', itemEn: 'Proceeds from Scrap & Used Equipment', type: isAr ? 'أنشطة استثمارية' : 'Investing', amount: `+${cashFlowData.investingInflows.toLocaleString()} ج.م` },
        { itemAr: 'صافي التدفق النقدي من الأنشطة الاستثمارية (CFI)', itemEn: 'Net Investing Cash Flow (CFI)', type: isAr ? 'صافي استثماري' : 'Net Investing', amount: `${cashFlowData.netInvestingCash.toLocaleString()} ج.م` },
        { itemAr: 'متحصلات تسهيلات ائتمانية وقروض بنكية جديدة', itemEn: 'Proceeds from New Credit Lines & Loans', type: isAr ? 'أنشطة تمويلية' : 'Financing', amount: `+${cashFlowData.financingInflows.toLocaleString()} ج.م` },
        { itemAr: 'سداد أقساط قروض وفوائد تمويلية', itemEn: 'Repayment of Loans & Financing Costs', type: isAr ? 'أنشطة تمويلية' : 'Financing', amount: `-${cashFlowData.financingOutflows.toLocaleString()} ج.م` },
        { itemAr: 'صافي التدفق النقدي من الأنشطة التمويلية (CFF)', itemEn: 'Net Financing Cash Flow (CFF)', type: isAr ? 'صافي تمويلي' : 'Net Financing', amount: `${cashFlowData.netFinancingCash.toLocaleString()} ج.م` },
      ];

      return {
        titleAr: `قائمة التدفقات النقدية والسيولة (${selectedYear})`,
        titleEn: `Cash Flow Statement (${selectedYear})`,
        subtitleAr: `المركز: ${costCenterLabel} • تحليل التدفقات التشغيلية والاستثمارية والتمويلية`,
        filename: `cash_flow_${selectedYear}`,
        columns: [
          { headerAr: 'بند التدفق النقدي', accessor: isAr ? 'itemAr' : 'itemEn', align: isAr ? 'right' : 'left' },
          { headerAr: 'نوع النشاط', accessor: 'type', align: 'center', width: '130px' },
          { headerAr: 'صافي التدفق', accessor: 'amount', align: 'left', width: '160px' }
        ],
        data: rows,
        summaryItems: [
          { labelAr: 'رصيد النقدية في بداية الفترة', value: `${cashFlowData.cashAtBeginning.toLocaleString()} ج.م` },
          { labelAr: 'صافي التغير في النقدية خلال الفترة', value: `${cashFlowData.netChangeInCash.toLocaleString()} ج.م` },
          { labelAr: 'رصيد النقدية والبنوك في نهاية الفترة', value: `${cashFlowData.cashAtEnd.toLocaleString()} ج.م`, highlight: true }
        ]
      };
    } else {
      // General Ledger
      return {
        titleAr: `كشف حساب الأستاذ العام - ${selectedLedgerAccount?.nameAr || selectedLedgerAccount?.name || ''}`,
        titleEn: `General Ledger Account Statement - ${selectedLedgerAccount?.code || ''}`,
        subtitleAr: `كود الحساب: [${selectedLedgerAccount?.code}] • الفترة: من ${ledgerStartDate} إلى ${ledgerEndDate}`,
        filename: `ledger_${selectedLedgerAccount?.code || '121'}`,
        columns: [
          { headerAr: 'التاريخ', accessor: 'date', align: 'center', width: '90px' },
          { headerAr: 'رقم السند', accessor: 'docNo', align: 'center', width: '100px' },
          { headerAr: 'البيان والتفاصيل المقيدة', accessor: 'description', align: isAr ? 'right' : 'left' },
          { headerAr: 'مدين (+)', accessor: (r: any) => r.debit > 0 ? `${Number(r.debit).toLocaleString()} ج.م` : '-', align: 'left', width: '120px' },
          { headerAr: 'دائن (-)', accessor: (r: any) => r.credit > 0 ? `${Number(r.credit).toLocaleString()} ج.م` : '-', align: 'left', width: '120px' },
          { headerAr: 'الرصيد التراكمي', accessor: (r: any) => `${Number(r.runningBalance).toLocaleString()} ج.م`, align: 'left', width: '130px' }
        ],
        data: ledgerReportData.movements,
        summaryItems: [
          { labelAr: 'الرصيد الافتتاحي للحساب', value: `${ledgerReportData.openingBalance.toLocaleString()} ج.م` },
          { labelAr: 'إجمالي الحركات المدينة', value: `${ledgerReportData.totalDebit.toLocaleString()} ج.م` },
          { labelAr: 'إجمالي الحركات الدائنة', value: `${ledgerReportData.totalCredit.toLocaleString()} ج.م` },
          { labelAr: 'الرصيد الختامي للحساب', value: `${ledgerReportData.endingBalance.toLocaleString()} ج.م`, highlight: true }
        ]
      };
    }
  }, [activeTab, pnlData, balanceSheetData, trialBalanceAccounts, trialBalanceTotals, cashFlowData, ledgerReportData, selectedLedgerAccount, selectedYear, selectedPeriod, currentCostCenterObj, language, ledgerStartDate, ledgerEndDate]);

  // Toggle sections expand/collapse
  const toggleSection = (section: string) => {
    setExpandedSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Trigger export feedback popup and download
  const handleExport = async (format: string) => {
    if (format === 'PDF') {
      try {
        await exportTableToPDF(currentTabPDFOptions);
      } catch (err) {
        console.error('PDF export failed:', err);
      }
    }
    setExportFormat(format);
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300" dir={dir}>
      
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#0F4C81]">
            <Layers className="w-5 h-5 text-[#F7941D]" />
            <span className="text-xs font-black uppercase tracking-wider">{t('reports_dept')}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{t('reports_title')}</h1>
          <p className="text-xs text-slate-400 mt-1">{t('reports_desc')}</p>
        </div>
        
        {/* Interactive Actions */}
        <div className="flex items-center gap-2">
          <ExportPDFButton
            variant="outline"
            titleAr="تصدير التقرير الفعلي PDF 📄"
            titleEn="Export Report PDF"
            exportOptions={currentTabPDFOptions}
          />
          <button 
            onClick={() => handleExport('Excel')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/10 rounded-xl text-xs font-bold hover:bg-[#0F4C81]/15 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('download_excel')}</span>
          </button>
        </div>
      </div>

      {/* Corporate Filter Panel (Google Stitch / Material Design Minimal Style) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Cost Center Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">{t('filter_cost_center')}</span>
            <select
              value={selectedCostCenter}
              onChange={e => setSelectedCostCenter(e.target.value)}
              className="border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="all">{t('all_cost_centers')}</option>
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.id}>{language === 'ar' ? cc.nameAr : cc.nameEn} ({cc.code})</option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">{t('filter_period')}</span>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="all">{language === 'ar' ? 'العام المالي بالكامل (المجمع)' : 'Full Fiscal Year (Consolidated)'}</option>
              <option value="q1">{t('period_q1')}</option>
              <option value="q2">{t('period_q2')}</option>
              <option value="q3">{t('period_q3')}</option>
              <option value="q4">{t('period_q4')}</option>
            </select>
          </div>

          {/* Fiscal Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">{t('filter_year')}</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="2026">2026 {language === 'ar' ? 'م' : 'AD'}</option>
              <option value="2025">2025 {language === 'ar' ? 'م' : 'AD'}</option>
            </select>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'ar' ? 'البيانات متطابقة ومحدثة مع مجمع الحسابات القيادي' : 'Data is synchronized and updated with the ledger consolidation host'}</span>
        </div>
      </div>

      {/* Main KPI Auditing Ratios (High End Analytics) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { 
            label: language === 'ar' ? 'هامش صافي الربح (%)' : 'Net Profit Margin (%)', 
            value: `${financialRatios.netProfitMargin.toFixed(1)}%`, 
            desc: language === 'ar' ? 'صافي الربح من إجمالي الإيرادات الكلية' : 'Net profit out of total operating revenues', 
            icon: TrendingUp, 
            status: 'positive',
            color: 'text-emerald-700 bg-emerald-50 border-emerald-100'
          },
          { 
            label: language === 'ar' ? 'نسبة السيولة السريعة (Current Ratio)' : 'Quick Liquidity Ratio (Current Ratio)', 
            value: `${financialRatios.currentRatio.toFixed(2)}`, 
            desc: language === 'ar' ? 'قدرة الأصول المتداولة على تغطية الديون قصيرة الأجل' : 'Ability of current assets to cover short term obligations', 
            icon: Calculator, 
            status: 'normal',
            color: 'text-blue-700 bg-blue-50 border-blue-100'
          },
          { 
            label: language === 'ar' ? 'معدل العائد على الأصول (ROA)' : 'Return on Assets (ROA)', 
            value: `${financialRatios.returnOnAssets.toFixed(2)}%`, 
            desc: language === 'ar' ? 'مدى كفاءة تشغيل أسطول الأوناش لتوليد أرباح' : 'Efficiency of using the crane fleet to generate profit', 
            icon: Award, 
            status: 'positive',
            color: 'text-purple-700 bg-purple-50 border-purple-100'
          },
          { 
            label: language === 'ar' ? 'نسبة الرافعة المالية (D/E Ratio)' : 'Debt-to-Equity Ratio (D/E Ratio)', 
            value: `${financialRatios.debtToEquity.toFixed(2)}`, 
            desc: language === 'ar' ? 'إجمالي المطلوبات والديون بالنسبة لحقوق الملكية' : 'Total liabilities and debt relative to shareholders equity', 
            icon: TrendingDown, 
            status: 'warning',
            color: 'text-amber-700 bg-amber-50 border-amber-100'
          },
        ].map((kpi, idx) => {
          const IconComponent = kpi.icon;
          return (
            <div key={idx} className={`rounded-2xl p-4 border bg-white shadow-sm flex flex-col justify-between ${kpi.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{kpi.label}</span>
                  <p className="text-2xl font-black mt-1">{kpi.value}</p>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-xs">
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] opacity-70 mt-2 leading-tight">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs Navigation (Google Stitch Modern Tabs styling) */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'pnl', label: t('tab_pnl') },
          { id: 'balance', label: t('tab_balance') },
          { id: 'trial', label: t('tab_trial') },
          { id: 'cashflow', label: t('tab_cashflow') },
          { id: 'ledger', label: t('tab_ledger') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3.5 text-xs font-black border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id 
                ? 'border-[#0F4C81] text-[#0F4C81] bg-[#0F4C81]/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Contents wrapper with Animated Transitions */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: P&L */}
          {activeTab === 'pnl' && (
            <motion.div
              key="pnl-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              
              {/* Detailed P&L statement table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">{t('pnl_title')}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t('pnl_subtitle')}</p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full font-bold text-slate-600">
                      {language === 'ar' ? 'للعام المالي' : 'For Fiscal Year'} {selectedYear}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    
                    {/* Revenues Section */}
                    <div>
                      <button 
                        onClick={() => toggleSection('rev')}
                        className="w-full flex items-center justify-between p-2 bg-[#0F4C81]/5 text-[#0F4C81] font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          {expandedSection.rev ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span>١. {t('group_revenues')}</span>
                        </span>
                        <span>{(pnlData.totalRevenue).toLocaleString()} {t('currency_egp')}</span>
                      </button>

                      {expandedSection.rev && (
                        <div className="mt-2 pr-6 pl-2 divide-y divide-slate-100 text-xs">
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('rev_crane_rental')}</span>
                            <span className="font-bold">{(pnlData.revenues.craneRental).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('rev_logistics')}</span>
                            <span className="font-bold">{(pnlData.revenues.logisticServices).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('rev_maintenance')}</span>
                            <span className="font-bold">{(pnlData.revenues.externalMaintenance).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('rev_other')}</span>
                            <span className="font-bold">{(pnlData.revenues.otherRevenue).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <button 
                        onClick={() => toggleSection('exp')}
                        className="w-full flex items-center justify-between p-2 bg-rose-50 text-rose-800 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          {expandedSection.exp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span>٢. {t('group_expenses')}</span>
                        </span>
                        <span>{(pnlData.totalExpenses).toLocaleString()} {t('currency_egp')}</span>
                      </button>

                      {expandedSection.exp && (
                        <div className="mt-2 pr-6 pl-2 divide-y divide-slate-100 text-xs">
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('exp_salaries')}</span>
                            <span className="font-bold">{(pnlData.expenses.salaries).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('exp_fuel')}</span>
                            <span className="font-bold">{(pnlData.expenses.fuel).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('exp_maintenance')}</span>
                            <span className="font-bold">{(pnlData.expenses.maintenanceSpareParts).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('exp_rent')}</span>
                            <span className="font-bold">{(pnlData.expenses.rentDepreciation).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('exp_insurance')}</span>
                            <span className="font-bold">{(pnlData.expenses.insuranceSafety).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                          <div className="py-2.5 flex justify-between text-slate-600">
                            <span>{t('exp_marketing')}</span>
                            <span className="font-bold">{(pnlData.expenses.marketingGeneral).toLocaleString()} {t('currency_egp')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Totals & Summary block */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-slate-700">
                    <span className="font-bold">{t('gross_profit')}</span>
                    <span className="font-extrabold font-mono">{(pnlData.grossProfit).toLocaleString()} {t('currency_egp')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{t('tax_provision')}</span>
                    <span className="font-bold font-mono">{(pnlData.taxProvision).toLocaleString()} {t('currency_egp')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black border-t border-slate-200 pt-2 text-[#0F4C81]">
                    <span>{t('net_profit_period')}</span>
                    <span className="font-black text-base font-mono text-[#F7941D]">{(pnlData.netProfit).toLocaleString()} {t('currency_egp')}</span>
                  </div>
                </div>

              </div>

              {/* Graphical Analysis for P&L */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{language === 'ar' ? 'أداء الدورة المالية والمصاريف' : 'Financial Cycle & Expenses Performance'}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? 'منحنيات الإيرادات المتراكمة مقابل تكلفة التشغيل الشهرية' : 'Cumulative revenues vs. monthly operating costs'}</p>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ${t('currency_egp')}`} />
                      <Area type="monotone" dataKey={language === 'ar' ? 'إيرادات' : 'Revenues'} stroke="#0F4C81" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey={language === 'ar' ? 'مصروفات' : 'Expenses'} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#1e293b] text-slate-300 rounded-xl p-4 space-y-2 text-xs">
                  <span className="font-black text-[#F7941D] block mb-1">{language === 'ar' ? '💡 تحليل الخبراء للميزانية الموحدة:' : '💡 Expert Consolidated Financial Analysis:'}</span>
                  <p className="leading-relaxed text-[11px]">
                    {language === 'ar' 
                      ? 'تبين المؤشرات وجود استقرار ممتاز في نسب التكاليف للمصروفات، حيث يمثل الوقود وقطع الغيار عصب مصاريف التشغيل بنسبة تقريبية تبلغ ٣٥٪. يوصى بمراقبة تكلفة صيانة ونش جنزير LR 1600 لتحسين عائد أصول الرفع الثقيل.' 
                      : 'Indicators show excellent stability in cost-to-expense ratios, with fuel and spare parts representing the backbone of operating expenses at approximately 35%. It is recommended to monitor the maintenance cost of the LR 1600 crawler crane to optimize heavy lift asset returns.'}
                  </p>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: BALANCE SHEET */}
          {activeTab === 'balance' && (
            <motion.div
              key="balance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in"
            >
              {/* Assets column */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">{t('bs_assets')}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? 'القيمة الدفترية لأصول أسطول Egypt Cranes' : 'Book value of Egypt Cranes fleet assets'}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    
                    {/* Fixed Assets */}
                    <div>
                      <button 
                        onClick={() => toggleSection('assets')}
                        className="w-full flex items-center justify-between p-2 bg-blue-50 text-blue-900 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <span>{t('bs_fixed_assets')}</span>
                        <span>{(balanceSheetData.totalFixedAssets).toLocaleString()} {t('currency_egp')}</span>
                      </button>
                      
                      <div className="mt-2 pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_heavy_equipment')}</span>
                          <span className="font-bold">{(balanceSheetData.fixedAssets.cranesHeavyEquipment).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_vehicles')}</span>
                          <span className="font-bold">{(balanceSheetData.fixedAssets.vehiclesTrailers).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{language === 'ar' ? 'معدات مكاتب ومقر الدقي الرئيسي والأجهزة والشبكات' : 'Office equipment, headquarters, devices & networks'}</span>
                          <span className="font-bold">{(balanceSheetData.fixedAssets.officeAssets).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Current Assets */}
                    <div className="pt-2">
                      <div className="p-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex justify-between">
                        <span>{t('bs_current_assets')}</span>
                        <span>{(balanceSheetData.totalCurrentAssets).toLocaleString()} {t('currency_egp')}</span>
                      </div>
                      <div className="mt-2 pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_cash_banks')}</span>
                          <span className="font-bold">{(balanceSheetData.currentAssets.cashBanks).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_receivables')}</span>
                          <span className="font-bold">{(balanceSheetData.currentAssets.receivables).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_inventory')}</span>
                          <span className="font-bold">{(balanceSheetData.currentAssets.inventory).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-[#0F4C81]/5 border-t border-[#0F4C81]/10 text-xs font-black text-[#0F4C81] flex justify-between">
                  <span>{t('bs_total_assets')}</span>
                  <span className="text-sm">{(balanceSheetData.totalAssets).toLocaleString()} {t('currency_egp')}</span>
                </div>
              </div>

              {/* Liabilities and Equity column */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">{t('bs_liab_equity')}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{language === 'ar' ? 'مطالبات الدائنين والتزامات البنوك وحقوق الشركاء المساهمين' : 'Creditor claims, bank obligations, and shareholders equity'}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    
                    {/* Current Liabilities */}
                    <div>
                      <button 
                        onClick={() => toggleSection('liab')}
                        className="w-full flex items-center justify-between p-2 bg-amber-50 text-amber-800 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <span>{t('bs_current_liabilities')}</span>
                        <span>{(balanceSheetData.totalCurrentLiabilities).toLocaleString()} {t('currency_egp')}</span>
                      </button>
                      
                      <div className="mt-2 pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_suppliers_payables')}</span>
                          <span className="font-bold">{(balanceSheetData.currentLiabilities.suppliersPayables).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_tax_provisions')}</span>
                          <span className="font-bold">{(balanceSheetData.currentLiabilities.taxProvisions).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_short_loans')}</span>
                          <span className="font-bold">{(balanceSheetData.currentLiabilities.shortTermLoans).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Long-Term Liabilities */}
                    <div className="pt-2">
                      <div className="p-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex justify-between">
                        <span>{t('bs_total_long_liabilities')}</span>
                        <span>{(balanceSheetData.totalLongTermLiabilities).toLocaleString()} {t('currency_egp')}</span>
                      </div>
                      <div className="mt-2 pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_long_loans')}</span>
                          <span className="font-bold">{(balanceSheetData.longTermLiabilities.longTermLoans).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_end_service')}</span>
                          <span className="font-bold">{(balanceSheetData.longTermLiabilities.employeeEndService).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="pt-2">
                      <div className="p-2 bg-purple-50 text-purple-900 font-bold text-xs rounded-xl flex justify-between">
                        <span>{t('bs_equity')}</span>
                        <span>{(balanceSheetData.totalEquity).toLocaleString()} {t('currency_egp')}</span>
                      </div>
                      <div className="mt-2 pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_paid_capital')}</span>
                          <span className="font-bold">{(balanceSheetData.equity.paidCapital).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_retained_earnings')}</span>
                          <span className="font-bold">{(balanceSheetData.equity.retainedEarnings).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                        <div className="py-2.5 flex justify-between text-slate-600">
                          <span>{t('bs_current_earnings')}</span>
                          <span className="font-bold">{(balanceSheetData.equity.currentYearEarnings).toLocaleString()} {t('currency_egp')}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-purple-50/20 border-t border-purple-100 text-xs font-black text-purple-900 flex justify-between">
                  <span>{t('bs_total_liab_equity')}</span>
                  <span className="text-sm">{(balanceSheetData.totalLiabilitiesAndEquity).toLocaleString()} {t('currency_egp')}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: TRIAL BALANCE */}
          {activeTab === 'trial' && (
            <motion.div
              key="trial-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{t('trial_title')}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('trial_subtitle')}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('trial_balance_matching')}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50/70 border-b border-slate-100">
                    <tr>
                      <th className={`px-6 py-3.5 text-xs font-bold text-slate-500 ${language === 'en' ? 'text-left' : 'text-right'}`}>{language === 'ar' ? 'رقم الحساب' : 'Account Code'}</th>
                      <th className={`px-4 py-3.5 text-xs font-bold text-slate-500 ${language === 'en' ? 'text-left' : 'text-right'}`}>{language === 'ar' ? 'اسم الحساب العام' : 'Account Name'}</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-500 text-center">{language === 'ar' ? 'أرصدة مدينة (Debit)' : 'Debit Balance (Debit)'}</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-500 text-center">{language === 'ar' ? 'أرصدة دائنة (Credit)' : 'Credit Balance (Credit)'}</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-500 text-center">{language === 'ar' ? 'الحالة المحاسبية' : 'Accounting Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {trialBalanceAccounts.map(acc => (
                      <tr key={acc.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className={`px-6 py-3 font-mono font-bold text-slate-500 ${language === 'en' ? 'text-left' : 'text-right'}`}>{acc.code}</td>
                        <td className={`px-4 py-3 font-bold text-slate-800 ${language === 'en' ? 'text-left' : 'text-right'}`}>{acc.name}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-[#0F4C81]">
                          {acc.debit > 0 ? `${acc.debit.toLocaleString()} ${t('currency_egp')}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-[#F7941D]">
                          {acc.credit > 0 ? `${acc.credit.toLocaleString()} ${t('currency_egp')}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                            acc.debit > 0 ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {acc.debit > 0 ? (language === 'ar' ? 'رصيد مدين' : 'Debit Balance') : (language === 'ar' ? 'رصيد دائن' : 'Credit Balance')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  
                  {/* Totals line */}
                  <tfoot className="bg-slate-50/70 border-t-2 border-slate-200">
                    <tr className="font-black text-xs text-slate-800">
                      <td colSpan={2} className={`px-6 py-4 font-black ${language === 'en' ? 'text-left' : 'text-right'}`}>{t('trial_total_label')}</td>
                      <td className="px-4 py-4 text-center font-mono text-sm text-[#0F4C81]">
                        {(trialBalanceTotals.debit).toLocaleString()} {t('currency_egp')}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-sm text-[#F7941D]">
                        {(trialBalanceTotals.credit).toLocaleString()} {t('currency_egp')}
                      </td>
                      <td className="px-4 py-4 text-center text-[10px] text-emerald-600 font-extrabold">{t('trial_balanced')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CASH FLOW */}
          {activeTab === 'cashflow' && (
            <motion.div
              key="cashflow-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in"
            >
              
              {/* Detailed statement */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">قائمة التدفقات النقدية (Cash Flow Statement)</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">متابعة حركة تحصيل السيولة النقدية والمصروفات النقدية الفعلية</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    
                    {/* Operating Activities */}
                    <div className="space-y-2">
                      <div className="p-2 bg-blue-50 text-blue-900 rounded-xl font-bold text-xs flex justify-between">
                        <span>الأنشطة التشغيلية (Operating Activities)</span>
                        <span>{(cashFlowData.netOperatingCash).toLocaleString()} ج.م</span>
                      </div>
                      <div className="pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2 flex justify-between text-slate-600">
                          <span>المقبوضات النقدية من تحصيل فواتير تأجير الأوناش والعملاء</span>
                          <span className="font-bold text-emerald-600">+{(cashFlowData.operatingInflows).toLocaleString()} ج.م</span>
                        </div>
                        <div className="py-2 flex justify-between text-slate-600">
                          <span>المدفوعات النقدية لتسديد أجور الموظفين والوقود والصيانة للموردين</span>
                          <span className="font-bold text-rose-600">-{(cashFlowData.operatingOutflows).toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Investing Activities */}
                    <div className="space-y-2 pt-2">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex justify-between">
                        <span>الأنشطة الاستثمارية (Investing Activities)</span>
                        <span>{(cashFlowData.netInvestingCash).toLocaleString()} ج.م</span>
                      </div>
                      <div className="pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2 flex justify-between text-slate-600">
                          <span>مدفوعات نقدية لشراء معدات رفع هيدروليكية وأوناش جديدة</span>
                          <span className="font-bold text-rose-600">-{(cashFlowData.investingOutflows).toLocaleString()} ج.م</span>
                        </div>
                        <div className="py-2 flex justify-between text-slate-600">
                          <span>متحصلات نقدية من بيع أصول قديمة وسيارات الدعم المستعملة</span>
                          <span className="font-bold text-emerald-600">+{(cashFlowData.investingInflows).toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Financing Activities */}
                    <div className="space-y-2 pt-2">
                      <div className="p-2 bg-purple-50 text-purple-900 rounded-xl font-bold text-xs flex justify-between">
                        <span>الأنشطة التمويلية (Financing Activities)</span>
                        <span>{(cashFlowData.netFinancingCash).toLocaleString()} ج.م</span>
                      </div>
                      <div className="pr-4 text-xs divide-y divide-slate-50">
                        <div className="py-2 flex justify-between text-slate-600">
                          <span>قروض وتسهيلات بنكية نقدية جديدة من البنك الأهلي</span>
                          <span className="font-bold text-emerald-600">+{(cashFlowData.financingInflows).toLocaleString()} ج.م</span>
                        </div>
                        <div className="py-2 flex justify-between text-slate-600">
                          <span>سداد أصل الأقساط والفوائد المستحقة للبنوك الشريكة</span>
                          <span className="font-bold text-rose-600">-{(cashFlowData.financingOutflows).toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>صافي التغير النقدي خلال الفترة المحددة</span>
                    <span className={`font-bold font-mono ${cashFlowData.netChangeInCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(cashFlowData.netChangeInCash).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>رصيد النقدية وما يعادلها في بداية العام المالي</span>
                    <span className="font-bold font-mono">{(cashFlowData.cashAtBeginning).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-[#0F4C81] border-t border-slate-200 pt-2 font-black">
                    <span>الرصيد النقدي الفعلي بالبنوك والخزينة في نهاية الفترة</span>
                    <span className="text-sm font-black font-mono text-[#F7941D]">{(cashFlowData.cashAtEnd).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Liquid asset pie chart representation */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">توزيع السيولة النقدية</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">توزيع التدفقات والسيولة المتوفرة بالبنوك</p>
                </div>

                <div className="h-60 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'البنك الأهلي المصري', value: Math.round(5500000 * filterModifier) },
                          { name: 'بنك مصر', value: Math.round(2000000 * filterModifier) },
                          { name: 'البنك التجاري الدولي CIB', value: Math.round(800000 * filterModifier) },
                          { name: 'خزينة الإدارة والمواقع والعهد النقدي', value: Math.round(200000 * filterModifier) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#0F4C81" />
                        <Cell fill="#F7941D" />
                        <Cell fill="#a855f7" />
                        <Cell fill="#64748b" />
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ج.م`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-[#0F4C81]" />
                    <span className="text-slate-600 flex-1">البنك الأهلي المصري (الرئيسي والاعتمادات المستندية)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-[#F7941D]" />
                    <span className="text-slate-600 flex-1">بنك مصر (صرف الرواتب والضرائب)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-purple-500" />
                    <span className="text-slate-600 flex-1">البنك التجاري الدولي CIB (الحركة والموردين)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-slate-500" />
                    <span className="text-slate-600 flex-1">خزينة الإدارة والمواقع والعهد النقدي</span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 5: GENERAL LEDGER ACCOUNT MOVEMENTS */}
          {activeTab === 'ledger' && (
            <motion.div
              key="ledger-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Filter Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-end justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full text-right">
                    
                    {/* Account Selector */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1 justify-end">
                        <Building2 className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>الحساب المالي المراد كشفه</span>
                      </label>
                      <div className="relative">
                        <select
                          value={ledgerAccountCode}
                          onChange={(e) => setLedgerAccountCode(e.target.value)}
                          className="w-full p-3 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all appearance-none text-right"
                        >
                          {ledgerAccounts.map(acc => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name} ({acc.type === 'assets' ? 'أصول' : acc.type === 'liabilities' ? 'خصوم' : acc.type === 'equity' ? 'حقوق ملكية' : acc.type === 'revenues' ? 'إيرادات' : 'مصروفات'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F7941D] absolute right-3.5 top-5" />
                      </div>
                    </div>

                    {/* From Date */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>من تاريخ</span>
                      </label>
                      <input
                        type="date"
                        value={ledgerStartDate}
                        onChange={(e) => setLedgerStartDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>إلى تاريخ</span>
                      </label>
                      <input
                        type="date"
                        value={ledgerEndDate}
                        onChange={(e) => setLedgerEndDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:bg-white transition-all"
                      />
                    </div>

                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap gap-2 justify-end w-full lg:w-auto mt-4 lg:mt-0">
                    <button
                      onClick={() => {
                        setIsRefreshingLedger(true);
                        setTimeout(() => setIsRefreshingLedger(false), 800);
                      }}
                      disabled={isRefreshingLedger}
                      className="px-4 py-3 bg-[#0F4C81] hover:bg-[#0c3c66] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-55"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshingLedger ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingLedger ? 'جاري التحديث...' : 'تحديث الحركة'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة التقرير</span>
                    </button>

                    <button
                      onClick={() => handleExport('Excel')}
                      className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* 1. Opening Balance */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start text-right">
                    <div className="p-2.5 bg-blue-50 text-[#0F4C81] rounded-xl">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">الرصيد الافتتاحي المقيد</span>
                      <span className="text-xs text-slate-400 block mt-0.5">ما قبل {ledgerStartDate}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="font-mono text-lg font-black text-[#0F4C81] block">
                      {ledgerReportData.openingBalance.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
                    <Calculator className="w-20 h-20 text-[#0F4C81]" />
                  </div>
                </div>

                {/* 2. Total Debit */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start text-right">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">إجمالي حركات مدين (Debit)</span>
                      <span className="text-xs text-slate-400 block mt-0.5">خلال الفترة المحددة</span>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="font-mono text-lg font-black text-emerald-600 block">
                      +{ledgerReportData.totalDebit.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
                    <TrendingUp className="w-20 h-20 text-emerald-600" />
                  </div>
                </div>

                {/* 3. Total Credit */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start text-right">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">إجمالي حركات دائن (Credit)</span>
                      <span className="text-xs text-slate-400 block mt-0.5">خلال الفترة المحددة</span>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="font-mono text-lg font-black text-rose-600 block">
                      -{ledgerReportData.totalCredit.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
                    <TrendingDown className="w-20 h-20 text-rose-600" />
                  </div>
                </div>

                {/* 4. Ending Balance */}
                <div className="bg-white border border-[#0F4C81]/10 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/20">
                  <div className="flex justify-between items-start text-right">
                    <div className="p-2.5 bg-amber-50 text-[#F7941D] rounded-xl">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">الرصيد الختامي الفعلي</span>
                      <span className="text-xs text-slate-400 block mt-0.5">كما في {ledgerEndDate}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="font-mono text-lg font-black text-[#F7941D] block">
                      {ledgerReportData.endingBalance.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
                    <DollarSign className="w-20 h-20 text-[#F7941D]" />
                  </div>
                </div>

              </div>

              {/* Graphical Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Running Balance Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="text-right mb-4">
                    <h4 className="font-extrabold text-xs text-slate-800">منحنى سيولة ورصيد الحساب الجاري</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">تتبع تراكم رصيد الحساب مع كل حركة مالية تمت في الفترة المحددة</p>
                  </div>
                  
                  <div className="h-64">
                    {ledgerReportData.movements.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { date: 'البداية', balance: ledgerReportData.openingBalance },
                            ...ledgerReportData.movements.map(m => ({
                              date: m.date,
                              balance: m.runningBalance
                            }))
                          ]}
                          margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorLedger" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ج.م`, 'الرصيد الجاري']} />
                          <Area type="monotone" dataKey="balance" stroke="#0F4C81" strokeWidth={2} fillOpacity={1} fill="url(#colorLedger)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400">
                        لا توجد حركات بيانية لتمثيلها في هذه الفترة
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Daily flow Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="text-right mb-4">
                    <h4 className="font-extrabold text-xs text-slate-800">حجم التدفق مدين / دائن</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">مقارنة مبالغ العمليات المسجلة على الحساب خلال الفترة</p>
                  </div>

                  <div className="h-64">
                    {ledgerReportData.movements.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ledgerReportData.movements.map(m => ({
                            date: m.date,
                            'مدين (Debit)': m.debit,
                            'دائن (Credit)': m.credit
                          }))}
                          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ج.م`} />
                          <Bar dataKey="مدين (Debit)" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="دائن (Credit)" fill="#F7941D" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400">
                        لا توجد حركات لتمثيل المقارنة
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Detailed Movements Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-right">
                    <h3 className="font-extrabold text-sm text-slate-800">دفتر الأستاذ التفصيلي وكشف الحساب التحليلي</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      حركة حساب: <span className="text-[#0F4C81] font-bold">"{selectedLedgerAccount.name}"</span> من {ledgerStartDate} إلى {ledgerEndDate}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] text-[#0F4C81] font-black text-center">
                    تمت الموازنة والتجميع آلياً
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3.5 text-xs font-black text-slate-500 text-center">التاريخ</th>
                        <th className="px-4 py-3.5 text-xs font-black text-slate-500 text-center">رقم السند</th>
                        <th className="px-6 py-3.5 text-xs font-black text-slate-500">البيان والشارح التفصيلي</th>
                        <th className="px-4 py-3.5 text-xs font-black text-slate-500 text-center">مدين (Debit)</th>
                        <th className="px-4 py-3.5 text-xs font-black text-slate-500 text-center">دائن (Credit)</th>
                        <th className="px-5 py-3.5 text-xs font-black text-slate-500 text-center">الرصيد المتراكم</th>
                        <th className="px-4 py-3.5 text-xs font-black text-slate-500 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      
                      {/* RENDER OPENING BALANCE LINE */}
                      <tr className="bg-slate-50/40 font-bold text-slate-600">
                        <td className="px-5 py-3.5 text-center font-mono text-slate-400">{ledgerStartDate}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-400">—</td>
                        <td className="px-6 py-3.5 text-slate-600">رصيد افتتاحي منقول من الفترة السابقة (Opening Balance)</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-300">—</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-300">—</td>
                        <td className="px-5 py-3.5 text-center font-mono font-black text-slate-800">
                          {ledgerReportData.openingBalance.toLocaleString()} ج.م
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-lg text-[9px] bg-slate-100 text-slate-500 font-bold">رحّل</span>
                        </td>
                      </tr>

                      {/* RENDER PERIOD MOVEMENTS */}
                      {ledgerReportData.movements.length > 0 ? (
                        ledgerReportData.movements.map((mov, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-500">{mov.date}</td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                              <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] text-slate-600 border border-slate-200">{mov.docNo}</span>
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-slate-700 max-w-xs sm:max-w-md truncate" title={mov.description}>
                              {mov.description}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-black text-emerald-600">
                              {mov.debit > 0 ? `+${mov.debit.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-black text-rose-600">
                              {mov.credit > 0 ? `-${mov.credit.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono font-black text-[#0F4C81]">
                              {mov.runningBalance.toLocaleString()} ج.م
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded-lg text-[9px] bg-emerald-50 text-emerald-700 font-bold">معتمد</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold">لا توجد حركات أو قيود مضافة لهذا الحساب خلال الفترة المحددة</p>
                            <p className="text-[10px] text-slate-400 mt-1">الرصيد الافتتاحي هو رصيد الحساب المتاح للفترة الحالية</p>
                          </td>
                        </tr>
                      )}

                      {/* TOTALS & CLOSING BALANCE */}
                      <tr className="bg-[#0F4C81]/5 font-black text-xs text-slate-800 border-t-2 border-slate-200">
                        <td colSpan={3} className="px-6 py-4 font-black text-right text-slate-800">إجمالي الحركات والرصيد الختامي المتوازن:</td>
                        <td className="px-4 py-4 text-center font-mono text-sm text-emerald-600">
                          +{ledgerReportData.totalDebit.toLocaleString()} ج.م
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-sm text-rose-600">
                          -{ledgerReportData.totalCredit.toLocaleString()} ج.م
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-sm text-[#F7941D]">
                          {ledgerReportData.endingBalance.toLocaleString()} ج.م
                        </td>
                        <td className="px-4 py-4 text-center text-[10px] text-emerald-700 font-black">متطابق</td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Seal / Authorized Stamp */}
                <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4 text-right">
                  <div className="text-xs text-slate-400">
                    <p className="font-extrabold text-slate-500">مؤسسة مصر للأوناش والرافعات الثقيلة (Egypt Cranes)</p>
                    <p className="mt-1">تقرير مستخرج محاسبياً من نظام الحوكمة الموحد. التوقيع الرقمي معتمد قانوناً.</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="border border-slate-200 rounded-xl p-3 bg-white text-center min-w-[120px]">
                      <p className="text-[9px] text-slate-400 font-bold">المراجع المالي والتدقيق</p>
                      <p className="text-[10px] font-black text-slate-800 mt-1.5">أ. حامد عبد العزيز</p>
                    </div>
                    <div className="border border-dashed border-[#0F4C81]/30 rounded-xl p-3 bg-blue-50/50 text-center min-w-[120px] relative">
                      <p className="text-[9px] text-[#0F4C81] font-bold">خاتم الإدارة والاعتماد المالي</p>
                      <p className="text-[9px] font-bold text-slate-800 mt-1">EGYPT CRANES ERP</p>
                      <div className="w-3.5 h-3.5 bg-[#F7941D] rounded-full absolute -top-1 -right-1" />
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Export Popup Feedback */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 bg-[#1e293b] text-white px-5 py-3.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div>
              <p className="text-xs font-black">جاري تحضير ملف {exportFormat} وتصديره...</p>
              <p className="text-[10px] text-slate-400 mt-0.5">يرجى الانتظار لحين انتهاء تجميع البيانات المالية وتوقيعها محاسبياً</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
