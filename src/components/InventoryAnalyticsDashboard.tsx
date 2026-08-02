import React, { useState } from 'react';
import { InventoryItem, CostCenter } from '../types';
import { 
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Package, 
  ShoppingCart, RefreshCw, BarChart2, PieChart as PieIcon, ArrowDownRight, 
  ArrowUpRight, ShieldAlert, Filter, Calendar, Layers, DollarSign, Clock, 
  Zap, Plus, Search, FileText, Check, Warehouse
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, 
  ReferenceLine, ComposedChart 
} from 'recharts';

interface InventoryAnalyticsDashboardProps {
  inventoryItems: InventoryItem[];
  costCenters: CostCenter[];
  onQuickReorderRequest?: (itemId: string, requestedQty: number) => void;
}

export default function InventoryAnalyticsDashboard({ 
  inventoryItems, 
  costCenters,
  onQuickReorderRequest 
}: InventoryAnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'warning' | 'optimal'>('all');
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickOrderSuccessId, setQuickOrderSuccessId] = useState<string | null>(null);

  // Period multiplier for simulated consumption rates
  const periodMultiplier = period === 'monthly' ? 1 : period === 'quarterly' ? 3 : 12;

  // Enrich inventory items with movement & reorder metrics
  const enrichedItems = inventoryItems.map((item, index) => {
    // Generate logical monthly consumption rate based on category and minQty
    const baseMonthlyConsumption = Math.max(5, Math.round(item.minQty * 0.8 + (index % 4) * 8 + 12));
    const periodConsumption = baseMonthlyConsumption * periodMultiplier;
    const dailyConsumption = baseMonthlyConsumption / 30;
    
    // Days until depletion
    const daysUntilDepletion = dailyConsumption > 0 
      ? Math.max(0, Math.round(item.currentQty / dailyConsumption)) 
      : 999;

    // Safety stock & Reorder Point formula: Reorder Point = MinQty, Ideal Order Qty = MinQty * 2.5
    const reorderPoint = item.minQty;
    const recommendedOrderQty = Math.max(item.minQty * 2, (reorderPoint - item.currentQty) + item.minQty * 1.5);
    
    // Status
    let status: 'critical' | 'warning' | 'optimal' = 'optimal';
    let statusText = 'رصيد ممتاز وفي الحدود الآمنة';
    let statusColor = 'emerald';

    if (item.currentQty <= reorderPoint) {
      status = 'critical';
      statusText = '🚨 تحت حد الطلب الأدنى (طلب عاجل)';
      statusColor = 'rose';
    } else if (item.currentQty <= reorderPoint * 1.5) {
      status = 'warning';
      statusText = '⚠️ اقترب من نقطة إعادة الطلب';
      statusColor = 'amber';
    }

    const totalAssetValue = item.currentQty * item.unitPrice;
    const totalConsumedValue = periodConsumption * item.unitPrice;

    return {
      ...item,
      periodConsumption,
      baseMonthlyConsumption,
      dailyConsumption,
      daysUntilDepletion,
      reorderPoint,
      recommendedOrderQty: Math.round(recommendedOrderQty),
      status,
      statusText,
      statusColor,
      totalAssetValue,
      totalConsumedValue
    };
  });

  // Filter items
  const filteredItems = enrichedItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (stockStatusFilter === 'critical' && item.status !== 'critical') return false;
    if (stockStatusFilter === 'warning' && item.status !== 'warning') return false;
    if (stockStatusFilter === 'optimal' && item.status !== 'optimal') return false;
    if (searchQuery && !item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) && !item.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sorted by most consumed items
  const topConsumedItems = [...filteredItems].sort((a, b) => b.periodConsumption - a.periodConsumption);

  // Reorder alert items (critical & warning)
  const criticalReorderItems = enrichedItems.filter(i => i.status === 'critical');
  const warningReorderItems = enrichedItems.filter(i => i.status === 'warning');

  // Key performance indicators
  const totalItemsCount = inventoryItems.length;
  const criticalCount = criticalReorderItems.length;
  const warningCount = warningReorderItems.length;
  const totalInventoryValue = enrichedItems.reduce((sum, i) => sum + i.totalAssetValue, 0);
  const totalConsumptionValue = enrichedItems.reduce((sum, i) => sum + i.totalConsumedValue, 0);

  // Category breakdown data for charts
  const categoryMap: Record<string, { count: number; value: number; consumption: number }> = {};
  enrichedItems.forEach(i => {
    if (!categoryMap[i.category]) {
      categoryMap[i.category] = { count: 0, value: 0, consumption: 0 };
    }
    categoryMap[i.category].count += 1;
    categoryMap[i.category].value += i.totalAssetValue;
    categoryMap[i.category].consumption += i.totalConsumedValue;
  });

  const categoryChartData = Object.keys(categoryMap).map(catKey => ({
    name: catKey,
    'تكلفة المخزون الحالي': categoryMap[catKey].value,
    'التكلفة المنصرفة': categoryMap[catKey].consumption,
  }));

  // Reorder Point Comparison Chart Data (Current Qty vs Reorder Point Threshold)
  const reorderComparisonChartData = topConsumedItems.slice(0, 8).map(item => ({
    code: item.code,
    name: item.nameAr.length > 22 ? item.nameAr.substring(0, 20) + '...' : item.nameAr,
    'الرصيد الحالي': item.currentQty,
    'نقطة إعادة الطلب (Min)': item.reorderPoint,
    'الاستهلاك الدوري': item.periodConsumption,
    unit: item.unit,
    isCritical: item.currentQty <= item.reorderPoint
  }));

  // Simulated Monthly Consumption Trend over time
  const monthlyTrendData = [
    { month: 'يناير', 'قطع هيدروليكية': 120, 'فلاتر ومستهلكات': 85, 'زيوت وشحوم': 190, 'وايرات وحبال': 310 },
    { month: 'فبراير', 'قطع هيدروليكية': 145, 'فلاتر ومستهلكات': 92, 'زيوت وشحوم': 210, 'وايرات وحبال': 290 },
    { month: 'مارس', 'قطع هيدروليكية': 130, 'فلاتر ومستهلكات': 110, 'زيوت وشحوم': 185, 'وايرات وحبال': 340 },
    { month: 'أبريل', 'قطع هيدروليكية': 160, 'فلاتر ومستهلكات': 105, 'زيوت وشحوم': 230, 'وايرات وحبال': 380 },
    { month: 'مايو', 'قطع هيدروليكية': 175, 'فلاتر ومستهلكات': 130, 'زيوت وشحوم': 260, 'وايرات وحبال': 410 },
    { month: 'يونيو', 'قطع هيدروليكية': 190, 'فلاتر ومستهلكات': 140, 'زيوت وشحوم': 280, 'وايرات وحبال': 450 },
    { month: 'يوليو الحالي', 'قطع هيدروليكية': 210, 'فلاتر ومستهلكات': 155, 'زيوت وشحوم': 310, 'وايرات وحبال': 480 },
  ];

  // Cost center distribution of consumption
  const costCenterConsumptionData = [
    { name: 'مشروع العاصمة الإدارية', value: 38, color: '#0F4C81' },
    { name: 'ورشة الجيزة المركزية', value: 27, color: '#10B981' },
    { name: 'مشروع تطوير ميناء السخنة', value: 18, color: '#F59E0B' },
    { name: 'فرع الإسكندرية والساحل', value: 12, color: '#8B5CF6' },
    { name: 'مشروعات القناة وبورسعيد', value: 5, color: '#EF4444' },
  ];

  const handleTriggerQuickReorder = (item: any) => {
    if (onQuickReorderRequest) {
      onQuickReorderRequest(item.id, item.recommendedOrderQty);
    }
    setQuickOrderSuccessId(item.id);
    setTimeout(() => {
      setQuickOrderSuccessId(null);
    }, 3000);
  };

  const categoriesList = Array.from(new Set(inventoryItems.map(i => i.category)));

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F4C81] via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>نظام مراقبة المخزون الذكي وتنبهات إعادة الطلب التلقائية</span>
            </div>
            <h2 className="text-xl font-black">تحليلات المخزون وحركة الأصناف الأكثر استهلاكاً (Reorder Points & Analytics)</h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              شاشة تفاعلية لتحليل معدلات السحب اليومية والشهري للأصناف، ومراقبة الحدود الحرة للأرصدة مع رسوم بيانية تفاعلية للتنبيه الفوري قبل نفاد قطع الغيار الحساسة.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 block font-semibold">تنبيهات انخفاض المخزون</span>
              <span className="font-mono font-black text-rose-400 text-lg">{criticalCount} أصناف حرجة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner if items are below reorder point */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-rose-950 text-sm flex items-center gap-2">
                  <span>تنبيه عاجل: توجد عدد ({criticalCount}) أصناف انخفضت عن نقطة إعادة الطلب (Reorder Point)!</span>
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  يتوجب على مسؤول المشتريات إصدار طلبات توريد سريعة لتفادي توقف أعمال صيانة الأوناش بالمواقع.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStockStatusFilter('critical')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>عرض الأصناف الحرجة فوراً</span>
            </button>
          </div>

          {/* Mini list of critical items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-rose-200/60">
            {criticalReorderItems.slice(0, 3).map(item => (
              <div key={item.id} className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center justify-between text-xs font-bold">
                <div className="truncate pl-2">
                  <span className="text-rose-900 font-extrabold block truncate">{item.nameAr}</span>
                  <span className="text-[10px] text-slate-500 font-mono">الرصيد: <strong className="text-rose-700">{item.currentQty} {item.unit}</strong> | الحد: {item.reorderPoint}</span>
                </div>
                <button
                  onClick={() => handleTriggerQuickReorder(item)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all shrink-0 cursor-pointer ${
                    quickOrderSuccessId === item.id 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                  }`}
                >
                  {quickOrderSuccessId === item.id ? 'تم الطلب ✓' : 'طلب إعادة توريد 🛒'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Period Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-extrabold w-full lg:w-auto overflow-x-auto">
            {[
              { id: 'all', label: `جميع الأصناف (${totalItemsCount})` },
              { id: 'critical', label: `🚨 حرج - تحت حد الطلب (${criticalCount})` },
              { id: 'warning', label: `⚠️ تحذيري - قريب من الحد (${warningCount})` },
              { id: 'optimal', label: `✅ آمن وفي الحدود (${totalItemsCount - criticalCount - warningCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStockStatusFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === tab.id
                    ? 'bg-[#0F4C81] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Period & Category Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="monthly">فترة التحليل: شهرية</option>
              <option value="quarterly">فترة التحليل: ربع سنوية</option>
              <option value="annual">فترة التحليل: سنوية</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="all">جميع فئات الكتالوج</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم الصنف أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Items Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>أصناف تجاوزت نقطة إعادة الطلب</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">{criticalCount}</span>
            <span className="text-xs font-bold text-slate-500">من أصل {totalItemsCount} صنف</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            تتطلب موافقة شراء عاجلة للتوريد
          </p>
        </div>

        {/* Card 2: Total Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي تقييم الرصيد المخزني الحالي</span>
            <div className="p-2 bg-blue-50 text-[#0F4C81] rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalInventoryValue.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span>
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            محسوبة بسعر الوحدة المسجل بالكتالوج
          </p>
        </div>

        {/* Card 3: Total Consumption Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي التكلفة المنصرفة لقطع الغيار</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono">
            {totalConsumptionValue.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span>
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            الفترة: <strong className="text-slate-800">{period === 'monthly' ? 'شهرياً' : period === 'quarterly' ? 'ربع سنوي' : 'سنوياً'}</strong>
          </p>
        </div>

        {/* Card 4: Most Consumed Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>الفئة الأكثر سحباً بالمشاريع</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-extrabold text-slate-900 truncate">
            {categoryChartData[0]?.name || 'قطع غيار هيدروليكية'}
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium flex justify-between">
            <span>معدل الحركة:</span>
            <span className="font-mono font-bold text-emerald-700">مرتفع جداً</span>
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Reorder Point vs Current Qty for Top Items (Composed Bar Chart) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">مقارنة أرصدة المخزون الحالي بنقاط إعادة الطلب (Reorder Points)</h3>
              <p className="text-xs text-slate-400 mt-0.5">الرصيد المتاح مقابل الحد الأدنى المطلوب لضمان أمان التشغيل</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600 self-start sm:self-auto">
              أعلى 8 أصناف حركة
            </span>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reorderComparisonChartData} margin={{ top: 20, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [`${value}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="الرصيد المتاح حالياً" dataKey="الرصيد الحالي" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                <Bar name="نقطة إعادة الطلب (Min Qty)" dataKey="نقطة إعادة الطلب (Min)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cost Center Distribution Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">توزيع استهلاك القطع حسب مراكز التكلفة</h3>
            <p className="text-xs text-slate-400 mt-0.5">نسب الاستهلاك بالورش والمشاريع الميدانية</p>
          </div>

          <div className="h-[210px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costCenterConsumptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {costCenterConsumptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'النسبة من إجمالي الصرف']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-bold text-slate-400">أكبر مركز</span>
              <span className="text-sm font-black text-[#0F4C81] font-mono">38% العاصمة</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {costCenterConsumptionData.map((item, i) => (
              <div key={i} className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Monthly Consumption Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">معدلات السحب الشهري والتنبؤ بالاستهلاك بمرور الوقت</h3>
            <p className="text-xs text-slate-400 mt-0.5">تتبع الاتجاه العام لطلب قطع الغيار لمختلف الفئات الرئيسية</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> قطع هيدروليكية</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> فلاتر ومستهلكات</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> زيوت وشحوم</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> وايرات وحبال</span>
          </div>
        </div>

        <div className="h-[250px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }} />
              <Line type="monotone" name="قطع هيدروليكية" dataKey="قطع هيدروليكية" stroke="#0F4C81" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" name="فلاتر ومستهلكات" dataKey="فلاتر ومستهلكات" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" name="زيوت وشحوم" dataKey="زيوت وشحوم" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" name="وايرات وحبال" dataKey="وايرات وحبال" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Consumed Items Detailed Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">جدول تحليل حركة الأصناف الأكثر استهلاكاً ونقاط إعادة الطلب</h3>
            <p className="text-xs text-slate-400">مرتبة تنازلياً حسب أعلى معدل سحب واستخدام مع حساب أيام النفاد المقدرة</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#0F4C81] bg-blue-50 px-3 py-1 rounded-full">
            إجمالي الأصناف المعروضة: {topConsumedItems.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-extrabold">
                <th className="p-3">كود الصنف</th>
                <th className="p-3">اسم الصنف والفئة</th>
                <th className="p-3">الرصيد الحالي</th>
                <th className="p-3">نقطة إعادة الطلب (Min)</th>
                <th className="p-3">معدل السحب الدوري</th>
                <th className="p-3">أيام النفاد المقدرة</th>
                <th className="p-3">حالة الرصيد</th>
                <th className="p-3">الكمية المقترحة لإعادة الطلب</th>
                <th className="p-3">إجراء سريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {topConsumedItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#0F4C81]">{item.code}</td>
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">{item.nameAr}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.category} | {item.warehouseName}</span>
                  </td>
                  <td className="p-3 font-mono font-black text-slate-900">
                    <span className={item.status === 'critical' ? 'text-rose-600' : ''}>
                      {item.currentQty} {item.unit}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-600">
                    {item.reorderPoint} {item.unit}
                  </td>
                  <td className="p-3 font-mono text-amber-700 font-black">
                    {item.periodConsumption} {item.unit} / {period === 'monthly' ? 'شهر' : period === 'quarterly' ? 'ربع سنة' : 'سنة'}
                  </td>
                  <td className="p-3">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      item.daysUntilDepletion <= 15 ? 'bg-rose-100 text-rose-800 font-black' :
                      item.daysUntilDepletion <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.daysUntilDepletion > 300 ? 'وفرة ممتدة' : `${item.daysUntilDepletion} يوم`}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      item.status === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      item.status === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {item.statusText}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-black text-blue-700">
                    {item.recommendedOrderQty} {item.unit}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleTriggerQuickReorder(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                        quickOrderSuccessId === item.id 
                          ? 'bg-emerald-600 text-white' 
                          : item.status === 'critical'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-[#0F4C81] hover:bg-[#0c3d67] text-white'
                      }`}
                    >
                      {quickOrderSuccessId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم إصدار الطلب</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>إصدار طلب شراء</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
