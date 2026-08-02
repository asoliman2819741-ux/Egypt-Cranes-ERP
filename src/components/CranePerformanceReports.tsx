import React, { useState } from 'react';
import { Crane } from '../types';
import { 
  BarChart2, Calendar, Clock, AlertTriangle, CheckCircle2, TrendingUp, 
  TrendingDown, ShieldAlert, Download, Printer, Filter, FileText,
  PieChart as PieIcon, RefreshCw, Zap, Wrench, ChevronDown, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

interface CranePerformanceReportsProps {
  cranes: Crane[];
}

export default function CranePerformanceReports({ cranes }: CranePerformanceReportsProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCraneId, setSelectedCraneId] = useState<string>('all');
  const [showExecutiveModal, setShowExecutiveModal] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'high_downtime' | 'optimal'>('all');

  // Multiplier for periods to adjust hours dynamically
  const periodMultiplier = period === 'weekly' ? 0.25 : period === 'monthly' ? 1 : period === 'quarterly' ? 3 : 12;

  // Enriched crane performance data
  const craneMetrics = cranes.map((crane, idx) => {
    // Base operating hours per month around 160-220h
    const baseOperating = [210, 195, 180, 85, 205][idx % 5] * periodMultiplier;
    // Base downtime hours around 10-120h
    const baseDowntime = [15, 20, 25, 115, 18][idx % 5] * periodMultiplier;
    const totalHours = baseOperating + baseDowntime;
    const availabilityRate = Math.round((baseOperating / totalHours) * 100);
    const downtimeRate = 100 - availabilityRate;
    const estimatedDowntimeLoss = baseDowntime * 1200; // 1200 EGP/SAR per hour downtime loss

    let statusClass = 'emerald';
    let recommendation = 'أداء ممتاز - مواصلة الإسناد للمشاريع الكبرى';
    let actionPriority = 'منخفضة';

    if (availabilityRate < 70) {
      statusClass = 'rose';
      recommendation = 'عمرة شاملة فورية وإيقاف الإسناد المؤقت لحين إصلاح العطل الميكانيكي';
      actionPriority = 'عالية جداً (حرجة)';
    } else if (availabilityRate < 85) {
      statusClass = 'amber';
      recommendation = 'صيانة وقائية مكثفة واستبدال قطع الغيار المستهلكة لرفع الكفاءة';
      actionPriority = 'متوسطة';
    }

    return {
      id: crane.id,
      code: crane.code,
      nameAr: crane.nameAr,
      capacity: crane.capacity,
      model: crane.model,
      operatorName: crane.operatorName,
      status: crane.status,
      operatingHours: Math.round(baseOperating),
      downtimeHours: Math.round(baseDowntime),
      totalHours: Math.round(totalHours),
      availabilityRate,
      downtimeRate,
      estimatedDowntimeLoss,
      statusClass,
      recommendation,
      actionPriority
    };
  });

  // Filtered metrics
  const filteredMetrics = craneMetrics.filter(m => {
    if (selectedCraneId !== 'all' && m.id !== selectedCraneId) return false;
    if (selectedCategory === 'heavy' && m.capacity < 200) return false;
    if (selectedCategory === 'medium' && (m.capacity >= 200 || m.capacity < 100)) return false;
    if (selectedCategory === 'light' && m.capacity >= 100) return false;
    
    if (filterType === 'high_downtime' && m.availabilityRate >= 80) return false;
    if (filterType === 'optimal' && m.availabilityRate < 85) return false;
    
    return true;
  });

  // Fleet Totals
  const totalOperatingHours = filteredMetrics.reduce((sum, m) => sum + m.operatingHours, 0);
  const totalDowntimeHours = filteredMetrics.reduce((sum, m) => sum + m.downtimeHours, 0);
  const grandTotalHours = totalOperatingHours + totalDowntimeHours || 1;
  const averageAvailability = Math.round((totalOperatingHours / grandTotalHours) * 100);
  const totalFinancialLoss = filteredMetrics.reduce((sum, m) => sum + m.estimatedDowntimeLoss, 0);
  const criticalCranesCount = filteredMetrics.filter(m => m.availabilityRate < 70).length;

  // Chart Data 1: Comparison Bar Chart (Operating vs Downtime per Crane)
  const chartCraneComparison = filteredMetrics.map(m => ({
    name: m.code,
    fullName: m.nameAr,
    'ساعات التشغيل': m.operatingHours,
    'ساعات التوقف (Downtime)': m.downtimeHours,
    'نسبة الجاهزية %': m.availabilityRate
  }));

  // Chart Data 2: Historical Trend Data over time
  const trendData = period === 'weekly' ? [
    { label: 'الأسبوع 1', operating: 410, downtime: 35, availability: 92 },
    { label: 'الأسبوع 2', operating: 430, downtime: 45, availability: 90 },
    { label: 'الأسبوع 3', operating: 390, downtime: 60, availability: 86 },
    { label: 'الأسبوع 4', operating: 445, downtime: 28, availability: 94 },
  ] : period === 'monthly' ? [
    { label: 'يناير', operating: 1520, downtime: 180, availability: 89 },
    { label: 'فبراير', operating: 1610, downtime: 140, availability: 92 },
    { label: 'مارس', operating: 1480, downtime: 210, availability: 87 },
    { label: 'أبريل', operating: 1590, downtime: 160, availability: 90 },
    { label: 'مايو', operating: 1650, downtime: 120, availability: 93 },
    { label: 'يونيو', operating: 1710, downtime: 190, availability: 90 },
    { label: 'يوليو الحالي', operating: totalOperatingHours, downtime: totalDowntimeHours, availability: averageAvailability },
  ] : [
    { label: 'الربع الأول 2025', operating: 4610, downtime: 530, availability: 89 },
    { label: 'الربع الثاني 2025', operating: 4950, downtime: 470, availability: 91 },
    { label: 'الربع الثالث 2025', operating: 4800, downtime: 510, availability: 90 },
    { label: 'الربع الرابع 2025', operating: 5100, downtime: 390, availability: 92 },
    { label: 'الربع الأول 2026', operating: 5250, downtime: 420, availability: 92 },
  ];

  // Chart Data 3: Downtime Reasons Breakdown
  const downtimeReasonsData = [
    { name: 'أعطال هيدروليكية وخراطيم', value: 38, color: '#EF4444' },
    { name: 'صيانة وقائية دورية مخطط لها', value: 28, color: '#3B82F6' },
    { name: 'تأخر وصول قطع الغيار', value: 18, color: '#F59E0B' },
    { name: 'أعطال كهربائية وحساسات', value: 11, color: '#8B5CF6' },
    { name: 'ظروف جوية ورياح شديدة', value: 5, color: '#6B7280' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F4C81] via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>مكافئ تقارير الكفاءة والجاهزية التشغيلية (OEE & Availability)</span>
            </div>
            <h2 className="text-xl font-black">تقارير أداء الأوناش تحليل (ساعات التشغيل vs ساعات التوقف)</h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              تحليل شامل ومفصل لكفاءة أسطول الأوناش، رصد ساعات العمل المباشر وتوقفات الصيانة، مع صياغة توصيات حاسمة لاتخاذ القرارات الإدارية والاستثمارية.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setShowExecutiveModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>التقرير التنفيذي للإدارة العليا</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-extrabold w-full lg:w-auto overflow-x-auto">
            {[
              { id: 'weekly', label: 'تقرير أسبوعي' },
              { id: 'monthly', label: 'تقرير شهري' },
              { id: 'quarterly', label: 'تقرير ربع سنوي' },
              { id: 'annual', label: 'تقرير سنوي' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  period === tab.id
                    ? 'bg-[#0F4C81] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="all">جميع فئات الحمولة</option>
              <option value="heavy">أوناش رفيعة ثقيلة (200+ طن)</option>
              <option value="medium">أوناش متوسطة (100 - 200 طن)</option>
              <option value="light">أوناش خفيفة (&lt; 100 طن)</option>
            </select>

            <select
              value={selectedCraneId}
              onChange={(e) => setSelectedCraneId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="all">جميع أوناش الأسطول</option>
              {cranes.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.nameAr}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="all">كل حالات الكفاءة</option>
              <option value="high_downtime">⚠️ أوناش بها توقفات عالية (&lt;80%)</option>
              <option value="optimal">✅ أوناش عالية الكفاءة (&gt;85%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Operating Availability */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>معدل الجاهزية التشغيلية للأسطول</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{averageAvailability}%</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              averageAvailability >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {averageAvailability >= 85 ? 'ممتاز' : 'تحت المتابعة'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            الهدف المحدد من الإدارة: <strong className="text-slate-800">85.0%</strong>
          </p>
        </div>

        {/* Card 2: Operating Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي ساعات التشغيل الفعلية</span>
            <div className="p-2 bg-blue-50 text-[#0F4C81] rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">
            {totalOperatingHours.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ساعة</span>
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            تغطي <strong className="text-slate-800">{filteredMetrics.length}</strong> رافعة عاملة بالمواقع
          </p>
        </div>

        {/* Card 3: Downtime Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي ساعات التوقف والصيانة (Downtime)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 font-mono">
            {totalDowntimeHours.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ساعة</span>
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            تتضمن <strong className="text-rose-700">{criticalCranesCount}</strong> رافعة في حالة صيانة حرجة
          </p>
        </div>

        {/* Card 4: Financial Downtime Impact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>تكلفة فرصة التوقف المفقودة التقديرية</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">
            {totalFinancialLoss.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">ريال</span>
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            احتساب تكلفة التوقف: <strong className="text-slate-800">1200 ريال/ساعة</strong>
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Operating Hours vs Downtime Hours per Crane (Stacked Bar Chart) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">مقارنة كفاءة الأوناش: ساعات التشغيل مقابل ساعات التوقف</h3>
              <p className="text-xs text-slate-400 mt-0.5">تحليل مباشر لكل ونش لتحديد الأوناش الأكثر إنتاجية والأكثر توقفاً</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600 self-start sm:self-auto">
              الفترة: {period === 'weekly' ? 'أسبوعي' : period === 'monthly' ? 'شهري' : period === 'quarterly' ? 'ربع سنوي' : 'سنوي'}
            </span>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCraneComparison} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [`${value} ساعة`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="ساعات التشغيل الفعلية" dataKey="ساعات التشغيل" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar name="ساعات التوقف والتعطل" dataKey="ساعات التوقف (Downtime)" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Downtime Breakdown Causes (Donut Chart) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">توزيع أسباب التوقف والأعطال</h3>
            <p className="text-xs text-slate-400 mt-0.5">نسب مئوية لأسباب توقف الأوناش بالمواقع</p>
          </div>

          <div className="h-[210px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={downtimeReasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {downtimeReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'النسبة']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-bold text-slate-400">السبب الرئيسي</span>
              <span className="text-sm font-black text-rose-600 font-mono">38% هيدروليك</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {downtimeReasonsData.map((item, i) => (
              <div key={i} className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Historical Availability & Operating Hours Trend (Area Chart) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">التطور الزمني لساعات التشغيل والإنتاجية للأسطول</h3>
            <p className="text-xs text-slate-400 mt-0.5">متابعة المنحنى الزمني لتأكيد الالتزام بالخطة التشغيلية</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="inline-block w-3 h-3 rounded bg-blue-600"></span> ساعات التشغيل
            <span className="inline-block w-3 h-3 rounded bg-rose-500"></span> ساعات التوقف
          </div>
        </div>

        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }} />
              <Area type="monotone" name="ساعات التشغيل" dataKey="operating" stroke="#0F4C81" fillOpacity={1} fill="url(#colorOp)" />
              <Area type="monotone" name="ساعات التوقف" dataKey="downtime" stroke="#EF4444" fillOpacity={1} fill="url(#colorDown)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Administrative Decision Matrix Section */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-base text-amber-300">مصفوفة القرارات الإدارية والتوصيات التنفيذية المقترحة</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold">
              <CheckCircle2 className="w-4 h-4" />
              <span>أوناش عالية الجاهزية (&gt;85%)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              توجيه الأوناش ذات الكفاءة المرتفعة لمشاريع الرفع الثقيل ذات الحوافز والمواعيد النهائية الصارمة (العاصمة الإدارية وموانئ السخنة).
            </p>
            <div className="text-[10px] text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/40 font-mono">
              توصية: استمرار خطة الصيانة الوقائية الحالية بدون تغيير.
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold">
              <Zap className="w-4 h-4" />
              <span>تحسين سلاسل إمداد قطع الغيار</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              38% من توقفات الأوناش تعود لأعطال الخراطيم والمكونات الهيدروليكية. يُوصى بإنشاء "مخزون حرج" مستعجل بالورشة المركزية للجيزة.
            </p>
            <div className="text-[10px] text-amber-300 bg-amber-950/60 p-2 rounded-lg border border-amber-800/40 font-mono">
              توصية: تخفيض زمن توقف انتظار القطع بنسبة 40%.
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold">
              <ShieldAlert className="w-4 h-4" />
              <span>أوناش تتطلب عمرات شاملة (&lt;70%)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              الرافعة <strong>Liebherr LR 1600/2</strong> سجلت 115 ساعة توقف شهرياً (تكلفة فرصة مفقودة 138,000 ريال). يتوجب إجراء عمرة هيدروليكية جسيمة.
            </p>
            <div className="text-[10px] text-rose-300 bg-rose-950/60 p-2 rounded-lg border border-rose-800/40 font-mono">
              توصية: إصدار أمر عمرة فورية أو دراسة جدوى استبدال.
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Crane Performance Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">الجدول التفصيلي لمؤشرات كفاءة الأوناش وتوصيات التشغيل</h3>
            <p className="text-xs text-slate-400">سجل كامل بساعات التشغيل والتوقف ونسب الجاهزية والتوصية الإدارية</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#0F4C81] bg-blue-50 px-3 py-1 rounded-full">
            عدد المعدات المسجلة: {filteredMetrics.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-extrabold">
                <th className="p-3">كود الونش</th>
                <th className="p-3">اسم الرافعة والموديل</th>
                <th className="p-3">الحمولة (طن)</th>
                <th className="p-3">ساعات التشغيل</th>
                <th className="p-3">ساعات التوقف (Downtime)</th>
                <th className="p-3">معدل الجاهزية (Availability)</th>
                <th className="p-3">التكلفة المفقودة</th>
                <th className="p-3">التوصية الإدارية واتخاذ القرار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {filteredMetrics.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#0F4C81]">{m.code}</td>
                  <td className="p-3">
                    <span className="block font-bold text-slate-900">{m.nameAr}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.model} | مشغل: {m.operatorName}</span>
                  </td>
                  <td className="p-3 font-mono font-bold">{m.capacity} طن</td>
                  <td className="p-3 font-mono text-emerald-700 font-black">{m.operatingHours} ساعة</td>
                  <td className="p-3 font-mono text-rose-600 font-black">{m.downtimeHours} ساعة</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-black text-sm ${
                        m.availabilityRate >= 85 ? 'text-emerald-700' :
                        m.availabilityRate >= 70 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {m.availabilityRate}%
                      </span>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full ${
                            m.availabilityRate >= 85 ? 'bg-emerald-500' :
                            m.availabilityRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${m.availabilityRate}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-900">{m.estimatedDowntimeLoss.toLocaleString()} ريال</td>
                  <td className="p-3 max-w-xs">
                    <span className={`inline-block p-2 rounded-xl text-[11px] leading-tight border ${
                      m.statusClass === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                      m.statusClass === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                      'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                    }`}>
                      {m.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Report Printable Modal */}
      {showExecutiveModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] text-right">
            <div className="bg-[#0F4C81] p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-lg">مذكرة تقرير أداء كفاءة الأوناش التنفيذي</h3>
                <p className="text-xs text-slate-200 mt-0.5">مرفوعة لمجلس الإدارة وقطاع التشغيل والعمليات - {period === 'weekly' ? 'تقرير أسبوعي' : period === 'monthly' ? 'تقرير شهري' : period === 'quarterly' ? 'تقرير ربع سنوي' : 'تقرير سنوي'}</p>
              </div>
              <button onClick={() => setShowExecutiveModal(false)} className="text-white hover:bg-white/10 rounded-lg p-1 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs leading-relaxed">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-semibold">
                <div>تاريخ التوليد: <span className="font-mono font-bold text-[#0F4C81]">{new Date().toLocaleDateString('ar-EG')}</span></div>
                <div>الجهة المصدرة: <span className="font-bold">إدارة اللوجستيات وهندسة صيانة الأوناش</span></div>
                <div>إجمالي أسطول الأوناش: <span className="font-mono font-bold">{cranes.length} رافعة</span></div>
                <div>معدل الجاهزية التشغيلية العام: <span className="font-mono font-black text-emerald-700">{averageAvailability}%</span></div>
              </div>

              {/* Text Summary */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm text-[#0F4C81] border-b pb-1">أولاً: الملخص التنفيذي للأداء</h4>
                <p>
                  خلال الفترة المحددة، بلغ إجمالي ساعات التشغيل المباشرة لأسطول الأوناش بالمواقع <strong>{totalOperatingHours.toLocaleString()} ساعة عمل</strong>، مقابل <strong>{totalDowntimeHours.toLocaleString()} ساعة توقف وركود</strong> لأغراض الصيانة الوقائية والإصلاحات الطارئة.
                </p>
                <p>
                  حققت الشركة معدل جاهزية عام بلغ <strong>{averageAvailability}%</strong>، وهو معدل ممتاز يتجاوز الحد الأدنى المستهدف لإنتاجية المشروعات.
                </p>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm text-[#0F4C81] border-b pb-1">ثانياً: التوصيات القرارات الإدارية الموصى بها</h4>
                <ul className="list-disc list-inside space-y-1.5 font-medium text-slate-700">
                  <li>الموافقة على طلب توريد قطع الغيار المباشرة للنظام الهيدروليكي للورشة المركزية بالجيزة.</li>
                  <li>تحديد موعد العمرة الجسيمة للرافعة الكبيرة (Liebherr LR 1600/2) خلال فترة هدوء الأعمال بمنتصف الشهر.</li>
                  <li>مكافأة مشغلي الأوناش الذين حققوا نسبة جاهزية أعلى من 92% بدون أعطال سوء استخدام.</li>
                </ul>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center font-bold">
                <div className="space-y-8">
                  <p>مدير هندسة الصيانة والتشغيل</p>
                  <p className="text-slate-400 font-mono">مهندس / ياسر حسن</p>
                </div>
                <div className="space-y-8">
                  <p>نائب رئيس مجلس الإدارة للعمليات</p>
                  <p className="text-slate-400 font-mono">أستاذ / أشرف سليمان</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة واعتماد المذكرة</span>
              </button>
              <button
                onClick={() => setShowExecutiveModal(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
