import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector 
} from 'recharts';
import { 
  Building2, DollarSign, Wallet, AlertTriangle, ArrowUpRight, 
  Search, Filter, FileSpreadsheet, X, ChevronRight, CheckCircle2,
  PieChart as PieChartIcon, TrendingUp, Info, User, Layers, Receipt, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostCenter } from '../types';
import { useLanguage } from './LanguageContext';

export interface ExpenseItem {
  id: string;
  refNo: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payee: string;
  status: 'approved' | 'pending';
}

export interface CostCenterExpensesDonutChartProps {
  costCenters: CostCenter[];
  className?: string;
  onNavigateToCostCenters?: () => void;
}

// Preset color palette for donut chart slices
const DONUT_COLORS = [
  '#0F4C81', // Deep Navy
  '#F7941D', // Amber Orange
  '#10B981', // Emerald Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F59E0B', // Warm Yellow
];

// Fallback / Initial Expense Breakdown generator per Cost Center
const generateDefaultExpenses = (center: CostCenter): ExpenseItem[] => {
  const code = center.code || 'CC';
  const total = center.usedBudget || 100000;

  if (code.includes('NC-01') || center.nameAr.includes('العاصمة')) {
    return [
      { id: 'exp-1', refNo: `EXP-2026-${code}-01`, date: '2026-07-02', category: 'صيانة وعمرات أوناش', description: 'عمرة هيدروليكية واستبدال مضخات ونش ديمباج 250 طن', amount: Math.round(total * 0.39), payee: 'شركة الهيدروليك الوطنية', status: 'approved' },
      { id: 'exp-2', refNo: `FUEL-2026-${code}-02`, date: '2026-07-05', category: 'سولار ووقود تشغيل', description: 'شحنة سولار للمحركات والجرارات بموقع البرج الأيقوني', amount: Math.round(total * 0.24), payee: 'شركة مصر للبترول', status: 'approved' },
      { id: 'exp-3', refNo: `PAY-2026-${code}-03`, date: '2026-07-10', category: 'أجور وإعاشة المشغلين', description: 'رواتب وبدل مخاطر وساعات إضافية لطاقم التشغيل', amount: Math.round(total * 0.18), payee: 'كادر مشغلي العاصمة', status: 'approved' },
      { id: 'exp-4', refNo: `TRP-2026-${code}-04`, date: '2026-07-12', category: 'نقل وتجميع المعدات', description: 'رسوم مقطورات نقل أجزاء الونش التلسكوبي بين المواقع', amount: Math.round(total * 0.12), payee: 'أسطول النقل الثقيل', status: 'approved' },
      { id: 'exp-5', refNo: `CERT-2026-${code}-05`, date: '2026-07-15', category: 'تصاريح واختبارات سلامة', description: 'شهادات فحص ومعايرة أجهزة السلامة والأوزان', amount: Math.round(total * 0.07), payee: 'المكتب الفني للتفتيش', status: 'approved' }
    ];
  }

  if (code.includes('ALX-02') || center.nameAr.includes('الإسكندرية')) {
    return [
      { id: 'exp-alx-1', refNo: `EXP-2026-${code}-01`, date: '2026-07-03', category: 'قطع غيار هيدروليكية', description: 'خراطيم وزيوت هيدروليك معالجة ضد الأملاح البحرية', amount: Math.round(total * 0.41), payee: 'مؤسسة السلام لمعدات الموانئ', status: 'approved' },
      { id: 'exp-alx-2', refNo: `FUEL-2026-${code}-02`, date: '2026-07-07', category: 'سولار ووقود تشغيل', description: 'توريد وقود لجميع أوناش رصيف 55 بميناء الدخيلة', amount: Math.round(total * 0.27), payee: 'التعاون للبترول', status: 'approved' },
      { id: 'exp-alx-3', refNo: `PAY-2026-${code}-03`, date: '2026-07-11', category: 'أجور ورواتب الطاقم', description: 'مكافآت الوردية الليلية وطاقم الصيانة البحرية', amount: Math.round(total * 0.20), payee: 'فنيي ميناء الإسكندرية', status: 'approved' },
      { id: 'exp-alx-4', refNo: `SEC-2026-${code}-04`, date: '2026-07-14', category: 'رسوم تصاريح وتأمين الميناء', description: 'تصاريح الدخول السنوية ورسوم التأمين البحري', amount: Math.round(total * 0.12), payee: 'هيئة ميناء الإسكندرية', status: 'approved' }
    ];
  }

  if (code.includes('YARD-GZ') || center.nameAr.includes('الجيزة') || center.nameAr.includes('الورشة')) {
    return [
      { id: 'exp-gz-1', refNo: `EXP-2026-${code}-01`, date: '2026-07-01', category: 'تطوير الورشة ومعداتها', description: 'صيانة خطوط الورشة ومعدات فحص المحركات', amount: Math.round(total * 0.42), payee: 'التوريدات الفنية للورش', status: 'approved' },
      { id: 'exp-gz-2', refNo: `INV-2026-${code}-02`, date: '2026-07-06', category: 'مخزون قطع الغيار', description: 'شراء فلاتر زيت ووايرات رفع فولاذية للمخزن الرئيسي', amount: Math.round(total * 0.28), payee: 'مستوردو قطع الأوناش', status: 'approved' },
      { id: 'exp-gz-3', refNo: `PAY-2026-${code}-03`, date: '2026-07-09', category: 'رواتب فنيي الورشة', description: 'مرتبات وحوافز المهندسين وفنيي الهيدروليك بالورشة', amount: Math.round(total * 0.19), payee: 'إدارة الورشة المركزية', status: 'approved' },
      { id: 'exp-gz-4', refNo: `UTIL-2026-${code}-04`, date: '2026-07-13', category: 'مرافق وفواتير كهرباء', description: 'استهلاك كهرباء الورشة ومياه الشرب والمشونات', amount: Math.round(total * 0.11), payee: 'شركة الكهرباء والمياه', status: 'approved' }
    ];
  }

  if (code.includes('ADMIN') || center.nameAr.includes('الدقي') || center.nameAr.includes('الإداري')) {
    return [
      { id: 'exp-adm-1', refNo: `PAY-2026-${code}-01`, date: '2026-07-01', category: 'رواتب الإدارة العامة', description: 'مرتبات الكادر الإداري والمالي وتقنية المعلومات', amount: Math.round(total * 0.46), payee: 'إدارة الموارد البشرية', status: 'approved' },
      { id: 'exp-adm-2', refNo: `IT-2026-${code}-02`, date: '2026-07-04', category: 'تكنولوجيا وشبكات', description: 'تراخيص السيرفرات والأنظمة السحابية والاتصالات', amount: Math.round(total * 0.24), payee: 'مزود خدمات السحابة والشبكات', status: 'approved' },
      { id: 'exp-adm-3', refNo: `RNT-2026-${code}-03`, date: '2026-07-08', category: 'إيجارات ومقرات', description: 'إيجار المقر الرئيسي بالدقي والمصاريف الإدارية', amount: Math.round(total * 0.19), payee: 'مالك عقار المقر', status: 'approved' },
      { id: 'exp-adm-4', refNo: `ADM-2026-${code}-04`, date: '2026-07-12', category: 'مستلزمات وضيافة', description: 'أدوات كتابية ومطبوعات وضيافة المكاتب', amount: Math.round(total * 0.11), payee: 'مكتبات وموردي الضيافة', status: 'approved' }
    ];
  }

  if (code.includes('SC-03') || center.nameAr.includes('قناة السويس') || center.nameAr.includes('بورسعيد')) {
    return [
      { id: 'exp-sc-1', refNo: `EXP-2026-${code}-01`, date: '2026-07-04', category: 'عمرات أوناش الجنزير', description: 'صيانة وقائية وعمرة هيدروليك ونش تيريكس CC 2400', amount: Math.round(total * 0.41), payee: 'مركز صيانة معدات الأنفاق', status: 'approved' },
      { id: 'exp-sc-2', refNo: `FUEL-2026-${code}-02`, date: '2026-07-08', category: 'سولار ومحروقات', description: 'تجهيز خزانات الوقود لمشروع أنفاق قناة السويس', amount: Math.round(total * 0.29), payee: 'شركة وقود القناة', status: 'approved' },
      { id: 'exp-sc-3', refNo: `PAY-2026-${code}-03`, date: '2026-07-12', category: 'أجور الوردية الليلية', description: 'بدل ورديات حفر وأنفاق ليلية لسائقي الأوناش', amount: Math.round(total * 0.18), payee: 'طاقم تشغيل أنفاق بورسعيد', status: 'approved' },
      { id: 'exp-sc-4', refNo: `LOG-2026-${code}-04`, date: '2026-07-15', category: 'خدمات دعم لوجستي', description: 'تجهيز مسارات العبور الخاصة وتصاريح أجهزة الأمن', amount: Math.round(total * 0.12), payee: 'خدمات النقل اللوجستي الخاص', status: 'approved' }
    ];
  }

  // General fallback
  return [
    { id: `exp-gen-1`, refNo: `EXP-2026-${code}-01`, date: '2026-07-05', category: 'صيانة وتشغيل', description: `مصروفات صيانة وتجهيز لمركز التكلفة ${center.nameAr}`, amount: Math.round(total * 0.45), payee: 'الموردين المعتمدين', status: 'approved' },
    { id: `exp-gen-2`, refNo: `FUEL-2026-${code}-02`, date: '2026-07-08', category: 'وقود ومحروقات', description: 'استهلاك المحروقات والسولار', amount: Math.round(total * 0.35), payee: 'شركات البترول', status: 'approved' },
    { id: `exp-gen-3`, refNo: `ADM-2026-${code}-03`, date: '2026-07-12', category: 'مصروفات إدارية وتشغيلية', description: 'رسوم تشغيل ومستلزمات عامة', amount: Math.round(total * 0.20), payee: 'المقاولين والعمالة', status: 'approved' }
  ];
};

export default function CostCenterExpensesDonutChart({
  costCenters = [],
  className = '',
  onNavigateToCostCenters
}: CostCenterExpensesDonutChartProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Selected Cost Center State
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Filters for Expense List
  const [expenseSearch, setExpenseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Chart Data preparation
  const chartData = useMemo(() => {
    return costCenters.map((cc, idx) => {
      const color = DONUT_COLORS[idx % DONUT_COLORS.length];
      const used = cc.usedBudget || 0;
      const budget = cc.budget || 0;
      const remaining = Math.max(0, budget - used);
      const usagePercent = budget > 0 ? Math.round((used / budget) * 100) : 0;

      return {
        id: cc.id,
        code: cc.code,
        name: isAr ? cc.nameAr : (cc.nameEn || cc.nameAr),
        department: cc.department,
        managerName: cc.managerName,
        value: used,
        budget,
        remaining,
        usagePercent,
        color,
        rawCC: cc
      };
    });
  }, [costCenters, isAr]);

  // Overall Company Financial Summary
  const grandTotalExpenses = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const grandTotalBudget = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.budget, 0);
  }, [chartData]);

  const grandUsagePercentage = useMemo(() => {
    if (grandTotalBudget === 0) return 0;
    return Math.round((grandTotalExpenses / grandTotalBudget) * 100);
  }, [grandTotalExpenses, grandTotalBudget]);

  // Currently Selected Cost Center Object
  const selectedCenterData = useMemo(() => {
    if (!selectedCenterId) return null;
    return chartData.find(c => c.id === selectedCenterId) || null;
  }, [chartData, selectedCenterId]);

  // Generate or retrieve Expense breakdown for the selected Cost Center
  const selectedExpenses = useMemo(() => {
    if (!selectedCenterData) return [];
    return generateDefaultExpenses(selectedCenterData.rawCC);
  }, [selectedCenterData]);

  // Filtered Expense items
  const filteredExpenses = useMemo(() => {
    return selectedExpenses.filter(exp => {
      const matchesSearch = 
        exp.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.refNo.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.payee.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        exp.category.toLowerCase().includes(expenseSearch.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [selectedExpenses, expenseSearch, categoryFilter]);

  // Unique Categories in selected Center
  const expenseCategories = useMemo(() => {
    const cats = new Set(selectedExpenses.map(e => e.category));
    return Array.from(cats);
  }, [selectedExpenses]);

  // Custom Active Sector Rendering for Donut Chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.15))' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 8}
          outerRadius={innerRadius - 4}
          fill="#38BDF8"
        />
      </g>
    );
  };

  // Handle Donut Slice Click
  const handlePieClick = (data: any, index: number) => {
    if (selectedCenterId === data.id) {
      // Toggle off
      setSelectedCenterId(null);
      setActiveIndex(null);
    } else {
      setSelectedCenterId(data.id);
      setActiveIndex(index);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-6 text-slate-800 dark:text-slate-100 transition-colors ${className}`}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0F4C81]/10 dark:bg-[#0F4C81]/30 text-[#0F4C81] dark:text-sky-400 flex items-center justify-center border border-[#0F4C81]/20 shadow-3xs">
            <PieChartIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isAr ? 'توزيع المصروفات حسب مراكز التكلفة' : 'Expenses Distribution by Cost Center'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-500/30">
                {isAr ? 'تفاعلي' : 'Interactive'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isAr ? 'اضغط على أي جزء من الرسم البياني لعرض القائمة التفصيلية للمصروفات المسجلة' : 'Click on any chart segment to view itemized expenses breakdown'}
            </p>
          </div>
        </div>

        {/* Global Action / Clear Selection */}
        <div className="flex items-center gap-2">
          {selectedCenterId && (
            <button
              onClick={() => {
                setSelectedCenterId(null);
                setActiveIndex(null);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200/80 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'إلغاء التحديد (عرض الكل)' : 'Clear Selection'}</span>
            </button>
          )}

          {onNavigateToCostCenters && (
            <button
              onClick={onNavigateToCostCenters}
              className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer"
            >
              <span>{isAr ? 'إدارة مراكز التكلفة' : 'Manage Cost Centers'}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Donut Chart + Summary / Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Interactive Donut Chart */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[320px] bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
          
          <div className="w-full h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={handlePieClick}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={selectedCenterId === entry.id ? '#000' : 'none'}
                      strokeWidth={selectedCenterId === entry.id ? 2 : 0}
                      className="transition-all hover:opacity-90"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[200px] dir-rtl text-right">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="font-mono text-[10px] text-amber-400 font-bold">{data.code}</span>
                            <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-md font-bold">{data.department}</span>
                          </div>
                          <p className="font-black text-white text-sm">{data.name}</p>
                          <div className="flex items-center justify-between font-mono font-bold text-emerald-400">
                            <span>المصروف الفعلي:</span>
                            <span>{(data.value || 0).toLocaleString('ar-EG')} ج.م</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-slate-300 text-[11px]">
                            <span>الميزانية المرصودة:</span>
                            <span>{(data.budget || 0).toLocaleString('ar-EG')} ج.م</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            <span>نسبة الاستهلاك:</span>
                            <span className={`font-black ${data.usagePercent >= 90 ? 'text-rose-400' : 'text-amber-300'}`}>
                              {data.usagePercent}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                {selectedCenterData ? (isAr ? 'المركز المحدد' : 'Selected Center') : (isAr ? 'إجمالي المصروفات' : 'Total Expenses')}
              </span>
              <p className="text-lg md:text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                {selectedCenterData
                  ? (selectedCenterData.value || 0).toLocaleString('ar-EG')
                  : grandTotalExpenses.toLocaleString('ar-EG')}
                <span className="text-xs font-bold text-slate-500 mr-1">ج.م</span>
              </p>
              <span className="text-[10px] font-extrabold text-[#0F4C81] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 mt-1">
                {selectedCenterData
                  ? `${selectedCenterData.code} (${selectedCenterData.usagePercent}%)`
                  : `${isAr ? 'نسبة الاستهلاك الكلي' : 'Overall Usage'} ${grandUsagePercentage}%`}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-bold text-center mt-2 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#0F4C81]" />
            <span>{isAr ? 'انقر على أي جزء ملون بالرسم البياني لتفحّص بنود المصروفات' : 'Click any donut segment to filter expenses below'}</span>
          </p>
        </div>

        {/* Right Column: Cost Centers List & Legend */}
        <div className="lg:col-span-6 space-y-3">
          
          {/* KPI Mini Header */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs font-bold">
            <div>
              <span className="text-slate-400 text-[10px] block">{isAr ? 'إجمالي ميزانيات المراكز' : 'Total Allocated Budget'}</span>
              <span className="text-slate-800 font-mono font-black text-sm">
                {grandTotalBudget.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-500">ج.م</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">{isAr ? 'المتبقي المتاح للتصرف' : 'Remaining Balance'}</span>
              <span className="text-emerald-700 font-mono font-black text-sm">
                {Math.max(0, grandTotalBudget - grandTotalExpenses).toLocaleString('ar-EG')} <span className="text-[10px] text-slate-500">ج.م</span>
              </span>
            </div>
          </div>

          {/* Interactive Cost Center Cards List */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {chartData.map((item) => {
              const isSelected = selectedCenterId === item.id;
              const percentOfTotal = grandTotalExpenses > 0 ? Math.round((item.value / grandTotalExpenses) * 100) : 0;

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.005, x: isAr ? -3 : 3 }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCenterId(null);
                      setActiveIndex(null);
                    } else {
                      setSelectedCenterId(item.id);
                      setActiveIndex(chartData.findIndex(c => c.id === item.id));
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-blue-50/90 border-[#0F4C81] ring-2 ring-[#0F4C81]/20 shadow-3xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-2xs" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</span>
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                          {item.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{item.department}</span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <p className="text-xs font-black text-slate-800">
                      {(item.value || 0).toLocaleString('ar-EG')} <span className="text-[9px] text-slate-500">ج.م</span>
                    </p>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {percentOfTotal}% {isAr ? 'من الإجمالي' : 'of total'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 📋 EXPENSE BREAKDOWN PANEL (Shown when a Cost Center is selected, or default prompt) */}
      <AnimatePresence mode="wait">
        {selectedCenterData ? (
          <motion.div
            key={selectedCenterData.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-200 pt-5 space-y-4"
          >
            {/* Selected Cost Center Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-[#0F4C81] to-[#125894] p-4 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 border border-white/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-amber-400 text-slate-900 px-2 py-0.5 rounded-md font-black">
                      {selectedCenterData.code}
                    </span>
                    <h3 className="text-base font-black text-white">
                      {selectedCenterData.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-3">
                    <span>القسم: {selectedCenterData.department}</span>
                    <span>•</span>
                    <span>المهندس المسؤول: {selectedCenterData.managerName || 'غير محدد'}</span>
                  </p>
                </div>
              </div>

              {/* Financial Metrics Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs">
                  <span className="text-[10px] text-slate-300 block">الميزانية المرصودة</span>
                  <span className="font-mono font-black text-white">{selectedCenterData.budget.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-400/30 text-xs">
                  <span className="text-[10px] text-emerald-200 block">المصروفات الفعلية</span>
                  <span className="font-mono font-black text-emerald-300">{selectedCenterData.value.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="bg-amber-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-400/30 text-xs">
                  <span className="text-[10px] text-amber-200 block">نسبة استهلاك الميزانية</span>
                  <span className="font-mono font-black text-amber-300">{selectedCenterData.usagePercent}%</span>
                </div>
              </div>
            </div>

            {/* Filter Controls for Expense List */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Receipt className="w-4 h-4 text-[#0F4C81]" />
                  <span>تفاصيل وسجل الفواتير والمصروفات ({filteredExpenses.length})</span>
                </div>

                {/* Category Dropdown */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">كل التصنيفات ({selectedExpenses.length})</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expense Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="البحث بالبيان، المورد، الرقم..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

            </div>

            {/* Itemized Expenses Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-xs font-black border-b border-slate-200">
                      <th className="px-4 py-3">رقم الإذن / التاريخ</th>
                      <th className="px-4 py-3">تصنيف المصروف</th>
                      <th className="px-4 py-3">البيان وتفاصيل الخدمة</th>
                      <th className="px-4 py-3">المورد / الجهة المستفيدة</th>
                      <th className="px-4 py-3 text-center">القيمة النقدية</th>
                      <th className="px-4 py-3 text-center">الحالة الاعتمادية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold">
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            <span className="text-slate-800 font-bold block">{exp.refNo}</span>
                            <span className="text-[10px] text-slate-400">{exp.date}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                              {exp.category}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-slate-800 font-medium">
                            <p className="line-clamp-1">{exp.description}</p>
                          </td>

                          <td className="px-4 py-3 text-slate-600 font-bold">
                            {exp.payee}
                          </td>

                          <td className="px-4 py-3 text-center font-mono font-black text-slate-900 text-sm">
                            {exp.amount.toLocaleString('ar-EG')} <span className="text-[9px] text-slate-500 font-normal">ج.م</span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>معتمد دفترياً</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                          لا توجد نتائج مصروفات مطابقة للبحث داخل هذا المركز
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-black text-slate-700">
                <span>إجمالي المصروفات المعروضة بالجدول:</span>
                <span className="font-mono text-sm text-[#0F4C81]">
                  {filteredExpenses.reduce((sum, item) => sum + item.amount, 0).toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

          </motion.div>
        ) : (
          <div className="border-t border-dashed border-slate-200 pt-4 text-center py-4 bg-slate-50/50 rounded-xl">
            <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0F4C81]" />
              <span>{isAr ? 'اضغط على أي شريحة في الرسم البياني الدائري لتفحّص قائمة المصروفات بالتفصيل' : 'Click on any pie segment above to review detailed expense items'}</span>
            </p>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
