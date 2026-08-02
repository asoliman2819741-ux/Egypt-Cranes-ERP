import React, { useState } from 'react';
import { Crane, MaintenanceOrder } from '../types';
import { 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Wrench, Activity, AlertTriangle, ShieldCheck, 
  CheckCircle2, Clock, Play, Pause, Settings, RefreshCw, 
  Sparkles, ListFilter, RotateCcw, Building, Brain, HelpCircle,
  Coins, ArrowUpRight, Sliders, FileText, Download, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceDashboardProps {
  cranes: Crane[];
  orders?: MaintenanceOrder[];
  onUpdateCraneStatus?: (craneId: string, status: 'running' | 'idle' | 'maintenance') => void;
  cranesHours?: Record<string, number>;
  onAddPredictiveOrder?: (orderData: {
    craneId: string;
    type: 'preventive' | 'corrective';
    description: string;
    cost: number;
  }) => void;
}

export default function MaintenanceDashboard({ 
  cranes, 
  orders, 
  onUpdateCraneStatus,
  cranesHours,
  onAddPredictiveOrder
}: MaintenanceDashboardProps) {
  // Filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive prediction sliders states
  const [adherenceRate, setAdherenceRate] = useState<number>(100); // 50% to 150%
  const [aiEfficiency, setAiEfficiency] = useState<number>(85); // 50% to 100%
  const [costTab, setCostTab] = useState<'forecast' | 'historical'>('forecast');

  // Operating hours next maintenance prediction states
  const [dailyWorkHours, setDailyWorkHours] = useState<number>(8);
  const [operatingIntensity, setOperatingIntensity] = useState<'normal' | 'heavy' | 'extreme'>('normal');
  const [successScheduledMsg, setSuccessScheduledMsg] = useState<string | null>(null);

  // Periodic Performance Report states
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [targetOperatingRate, setTargetOperatingRate] = useState<number>(85);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [generatedReportDetails, setGeneratedReportDetails] = useState<any>(null);

  // Fallback historical orders if none provided
  const historicalOrders = orders || [
    { id: 'mo1', orderNo: 'WO-2026-001', craneId: 'c4', craneName: 'Liebherr LR 1600/2', type: 'corrective', cost: 180000, description: 'عمرة هيدروليكية كاملة للمحركات والوصلات التلسكوبية بسبب تسريب زيت بمسارات الضغط العالي', date: '2026-07-02', status: 'in_progress' },
    { id: 'mo2', orderNo: 'WO-2026-002', craneId: 'c1', craneName: 'Demag AC 250-5', type: 'preventive', cost: 12000, description: 'صيانة دورية مجدولة وفحص حبال الرفع الفولاذية والتشحيم واستبدال فلاتر السولار والزيت', date: '2026-07-06', status: 'completed' },
    { id: 'mo3', orderNo: 'WO-2026-003', craneId: 'c3', craneName: 'Terex CC 2400-1', type: 'preventive', cost: 35000, description: 'معايرة أجهزة السلامة والأوزان وحساسات الحمل والرياح الإلكترونية بالكبينة لترخيص الونش سنويًا', date: '2026-07-10', status: 'pending' },
  ];

  // Map database status to readable Arabic labels & colors
  const statusMapping = {
    running: { label: 'تعمل حالياً', color: '#10b981', hoverColor: '#059669', bgLight: '#ecfdf5', textDark: '#065f46', icon: Activity },
    maintenance: { label: 'تحت الصيانة', color: '#f59e0b', hoverColor: '#d97706', bgLight: '#fffbeb', textDark: '#92400e', icon: Wrench },
    idle: { label: 'متوقفة / معطلة', color: '#ef4444', hoverColor: '#dc2626', bgLight: '#fef2f2', textDark: '#991b1b', icon: AlertTriangle }
  };

  // Calculate stats based on current cranes array
  const totalCranes = cranes.length;
  const runningCount = cranes.filter(c => c.status === 'running').length;
  const maintenanceCount = cranes.filter(c => c.status === 'maintenance').length;
  const idleCount = cranes.filter(c => c.status === 'idle').length;

  // Dynamic Fleet Availability: (Running + Idle) / Total * 100
  const availabilityRate = totalCranes > 0 ? Math.round(((runningCount + idleCount) / totalCranes) * 100) : 0;
  
  // Total active capacity currently operational
  const totalActiveCapacity = cranes
    .filter(c => c.status === 'running')
    .reduce((sum, c) => sum + c.capacity, 0);

  // 1. Data Prep for Pie Chart (Counts of cranes)
  const statusPieData = [
    { name: 'تعمل حالياً', value: runningCount, statusKey: 'running', color: '#10b981' },
    { name: 'تحت الصيانة', value: maintenanceCount, statusKey: 'maintenance', color: '#f59e0b' },
    { name: 'متوقفة / معطلة', value: idleCount, statusKey: 'idle', color: '#ef4444' }
  ].filter(item => item.value > 0); // Hide 0-value items to clean up Recharts rendering

  // 2. Data Prep for Bar Chart (Lifting capacity in tons per status category)
  const capacityData = [
    {
      name: 'تعمل حالياً',
      'إجمالي القدرة (طن)': cranes.filter(c => c.status === 'running').reduce((sum, c) => sum + c.capacity, 0),
      color: '#10b981'
    },
    {
      name: 'تحت الصيانة',
      'إجمالي القدرة (طن)': cranes.filter(c => c.status === 'maintenance').reduce((sum, c) => sum + c.capacity, 0),
      color: '#f59e0b'
    },
    {
      name: 'متوقفة / معطلة',
      'إجمالي القدرة (طن)': cranes.filter(c => c.status === 'idle').reduce((sum, c) => sum + c.capacity, 0),
      color: '#ef4444'
    }
  ];

  // Handle Chart Slice/Segment Click for Interactive Filtering
  const handleChartClick = (data: any) => {
    if (!data) return;
    const statusKey = data.statusKey || (data.activePayload && data.activePayload[0]?.payload?.statusKey);
    
    if (statusKey) {
      setSelectedStatusFilter(prev => prev === statusKey ? null : statusKey);
    }
  };

  // Filter cranes list based on chart interactions or search query
  const filteredCranes = cranes.filter(crane => {
    const matchesStatus = !selectedStatusFilter || crane.status === selectedStatusFilter;
    const matchesSearch = 
      crane.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crane.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crane.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crane.operatorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // PREDICTIVE MAINTENANCE COST CALCULATIONS
  // Sum actual historical costs
  const actualPreventiveCost = historicalOrders
    .filter(o => o.type === 'preventive')
    .reduce((sum, o) => sum + o.cost, 0);

  const actualCorrectiveCost = historicalOrders
    .filter(o => o.type === 'corrective')
    .reduce((sum, o) => sum + o.cost, 0);

  const totalHistoricalCost = actualPreventiveCost + actualCorrectiveCost;

  // 6-Month Cost Forecast Projections (July - December 2026)
  const forecastMonths = [
    { name: 'يوليو', basePM: 24000, baseCM: 80000 },
    { name: 'أغسطس', basePM: 26000, baseCM: 75000 },
    { name: 'سبتمبر', basePM: 25000, baseCM: 90000 },
    { name: 'أكتوبر', basePM: 30000, baseCM: 85000 },
    { name: 'نوفمبر', basePM: 28000, baseCM: 70000 },
    { name: 'ديسمبر', basePM: 32000, baseCM: 95000 },
  ];

  const forecastData = forecastMonths.map((m, index) => {
    const timeFactor = 1 + index * 0.04; // Slight increase over time for parts inflation
    
    // PM costs rise linearly with PM adherence rate
    const pmProjected = Math.round(m.basePM * (adherenceRate / 100) * timeFactor);
    
    // CM (Breakdowns) costs decrease exponentially as PM adherence increases
    // If adherence is 50%, CM goes through the roof. If 150%, CM is nearly 0.
    const cmBaseMultiplier = Math.pow(2.4, (100 - adherenceRate) / 45); 
    const cmUnoptimized = m.baseCM * cmBaseMultiplier * timeFactor;
    
    // AI Efficiency helps avoid major corrective repair costs by pre-detecting faults early
    // Early fault preemption saves up to 55% of full failure repairs
    const aiSavingFactor = (aiEfficiency / 100) * 0.55;
    const pmBonus = (adherenceRate / 100) * 0.12; // PM and AI combined have compound benefits
    const optimizedCMMultiplier = Math.max(0.12, 1 - (aiSavingFactor + pmBonus));
    
    const cmOptimized = Math.round(cmUnoptimized * optimizedCMMultiplier);
    const totalOptimized = pmProjected + cmOptimized;

    // Run-to-failure cost scenario (no AI, low PM adherence = 50%)
    const runToFailureMultiplier = Math.pow(2.4, (100 - 50) / 45);
    const cmRunToFailure = Math.round(m.baseCM * runToFailureMultiplier * timeFactor);
    const pmRunToFailure = Math.round(m.basePM * 0.5 * timeFactor); // Minimal preventive maintenance done
    const totalRunToFailure = pmRunToFailure + cmRunToFailure;

    return {
      month: m.name,
      'الصيانة الوقائية (مخططة)': pmProjected,
      'أعطال وإصلاحات تنبؤية (ذكية)': cmOptimized,
      'إجمالي النفقات (مع الذكاء الاصطناعي)': totalOptimized,
      'سيناريو التشغيل التقليدي المجهد': totalRunToFailure,
      'الوفر المالي التقديري': totalRunToFailure - totalOptimized
    };
  });

  // Calculate dynamic summary stats based on forecast
  const totalForecastOptimized = forecastData.reduce((sum, item) => sum + item['إجمالي النفقات (مع الذكاء الاصطناعي)'], 0);
  const totalForecastTraditional = forecastData.reduce((sum, item) => sum + item['سيناريو التشغيل التقليدي المجهد'], 0);
  const totalEstimatedSavings = totalForecastTraditional - totalForecastOptimized;

  // Percentage of PM to CM ratio
  const projectedPMSum = forecastData.reduce((sum, item) => sum + item['الصيانة الوقائية (مخططة)'], 0);
  const projectedCMSum = forecastData.reduce((sum, item) => sum + item['أعطال وإصلاحات تنبؤية (ذكية)'], 0);
  const pmPercentageOfTotal = totalForecastOptimized > 0 ? Math.round((projectedPMSum / totalForecastOptimized) * 100) : 0;

  // Calculate dynamic operating vs maintenance hours for each crane based on status
  const performanceData = cranes.map(c => {
    // Determine base hours based on crane status and capacity
    let opHours = 180;
    let maintHours = 12;

    if (c.status === 'running') {
      opHours = Math.round(180 + (c.capacity * 0.1));
      maintHours = Math.round(8 + (c.capacity * 0.01));
    } else if (c.status === 'maintenance') {
      opHours = Math.round(60 + (c.capacity * 0.05));
      maintHours = Math.round(55 + (c.capacity * 0.15));
    } else { // idle
      opHours = Math.round(110 + (c.capacity * 0.08));
      maintHours = Math.round(20 + (c.capacity * 0.05));
    }

    // Multiply hours depending on the selected periodic report timeframe
    let multiplier = 1;
    if (reportPeriod === 'weekly') {
      multiplier = 0.25;
    } else if (reportPeriod === 'quarterly') {
      multiplier = 3;
    }

    const finalOp = Math.round(opHours * multiplier);
    const finalMaint = Math.round(maintHours * multiplier);
    const total = finalOp + finalMaint;
    const rate = total > 0 ? Math.round((finalOp / total) * 100) : 0;

    return {
      id: c.id,
      code: c.code,
      name: c.nameAr,
      model: c.model,
      'ساعات التشغيل': finalOp,
      'ساعات الصيانة': finalMaint,
      'معدل التشغيل %': rate,
      status: c.status
    };
  });

  // Calculate high-level metrics for performance reports
  const avgFleetOperatingRate = performanceData.length > 0 
    ? Math.round(performanceData.reduce((sum, item) => sum + item['معدل التشغيل %'], 0) / performanceData.length)
    : 0;
  
  const totalOpHoursAll = performanceData.reduce((sum, item) => sum + item['ساعات التشغيل'], 0);
  const totalMaintHoursAll = performanceData.reduce((sum, item) => sum + item['ساعات الصيانة'], 0);

  const highestPerformer = [...performanceData].sort((a, b) => b['معدل التشغيل %'] - a['معدل التشغيل %'])[0];
  const lowestPerformer = [...performanceData].sort((a, b) => a['معدل التشغيل %'] - b['معدل التشغيل %'])[0];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedReportDetails({
        avgFleetOperatingRate,
        totalOpHoursAll,
        totalMaintHoursAll,
        highestPerformerName: highestPerformer?.name || '',
        highestPerformerRate: highestPerformer?.['معدل التشغيل %'] || 0,
        lowestPerformerName: lowestPerformer?.name || '',
        lowestPerformerRate: lowestPerformer?.['معدل التشغيل %'] || 0,
        periodText: reportPeriod === 'weekly' ? 'أسبوعي' : reportPeriod === 'monthly' ? 'شهري' : 'ربع سنوي',
        date: new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('ar-EG'),
      });
      setShowReportModal(true);
    }, 1000);
  };

  // Historical Subsystem Failure Modes & Average Cost distribution
  const historicalFailureModes = [
    { name: 'أنظمة الهيدروليك والضغوط', 'نسبة تكرار الأعطال %': 42, 'متوسط كلفة الإصلاح (جنيه)': 165000, color: '#ef4444' },
    { name: 'الأجهزة والحساسات الذكية', 'نسبة تكرار الأعطال %': 28, 'متوسط كلفة الإصلاح (جنيه)': 30000, color: '#f59e0b' },
    { name: 'الوايرات والمنظومة الميكانيكية', 'نسبة تكرار الأعطال %': 18, 'متوسط كلفة الإصلاح (جنيه)': 85000, color: '#3b82f6' },
    { name: 'محركات الديزل وأنظمة الحركة', 'نسبة تكرار الأعطال %': 12, 'متوسط كلفة الإصلاح (جنيه)': 210000, color: '#8b5cf6' }
  ];

  // Custom tooltips to maintain beautiful design language
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-right dir-rtl font-sans text-xs space-y-1">
          <p className="font-extrabold">{data.name}</p>
          <p className="text-[#0F4C81] font-black">
            القيمة: <span className="text-white font-mono">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header with Reset Filter and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-[#0F4C81]/10 rounded-xl">
              <Activity className="w-5 h-5 text-[#0F4C81] animate-pulse" />
            </span>
            <span>لوحة مؤشرات الأداء وجاهزية الأوناش</span>
          </h3>
          <p className="text-xs text-slate-400 font-bold">إحصائيات تفاعلية حية لتوزيع أسطول الرافعات الثقيلة وحالتها الفنية في الميدان</p>
        </div>

        {selectedStatusFilter && (
          <button
            onClick={() => setSelectedStatusFilter(null)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>عرض كل الحالات (إلغاء تصفية المخطط)</span>
          </button>
        )}
      </div>

      {/* 2. Responsive KPI Dashboard Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* KPI 1: Fleet Count */}
        <div 
          onClick={() => setSelectedStatusFilter(null)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${!selectedStatusFilter ? 'border-l-4 border-l-[#0F4C81] shadow-xs ring-1 ring-slate-100' : 'border-slate-100 hover:border-slate-200'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي أسطول الأوناش</span>
            <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-2xl font-black text-slate-800">{totalCranes}</span>
            <span className="text-[10px] text-slate-400 font-bold mr-1">وحدات</span>
          </div>
        </div>

        {/* KPI 2: Running Count */}
        <div 
          onClick={() => setSelectedStatusFilter('running')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${selectedStatusFilter === 'running' ? 'border-l-4 border-l-emerald-500 shadow-xs ring-1 ring-emerald-50' : 'border-slate-100 hover:border-emerald-100'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold block">تعمل بالمواقع (نشط)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg animate-pulse">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-2xl font-black text-emerald-600">{runningCount}</span>
            <span className="text-[10px] text-emerald-500 font-bold mr-1">أوناش</span>
          </div>
        </div>

        {/* KPI 3: Under Maintenance */}
        <div 
          onClick={() => setSelectedStatusFilter('maintenance')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${selectedStatusFilter === 'maintenance' ? 'border-l-4 border-l-amber-500 shadow-xs ring-1 ring-amber-50' : 'border-slate-100 hover:border-amber-100'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold block">خاضعة للصيانة الدورية</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-2xl font-black text-amber-600">{maintenanceCount}</span>
            <span className="text-[10px] text-amber-500 font-bold mr-1">بالورشة</span>
          </div>
        </div>

        {/* KPI 4: Idle / Off-duty */}
        <div 
          onClick={() => setSelectedStatusFilter('idle')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${selectedStatusFilter === 'idle' ? 'border-l-4 border-l-rose-500 shadow-xs ring-1 ring-rose-50' : 'border-slate-100 hover:border-rose-100'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold block">متوقفة / معطلة فجأة</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-2xl font-black text-rose-600">{idleCount}</span>
            <span className="text-[10px] text-rose-500 font-bold mr-1">بدون حركة</span>
          </div>
        </div>

        {/* KPI 5: Fleet Availability Rate */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-950 text-white md:col-span-1 col-span-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold block">معدل جاهزية الأسطول</span>
            <div className="p-1 bg-white/10 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400 font-mono">{availabilityRate}%</span>
            <span className="text-[9px] text-slate-400 font-bold">جاهز فنيًا للتشغيل</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full w-full overflow-hidden mt-1.5">
            <div 
              className={`h-full rounded-full ${availabilityRate >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${availabilityRate}%` }}
            />
          </div>
        </div>

      </div>

      {/* 3. Graphical Displays using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Pie Chart displaying distribution of cranes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-slate-800">توزيع الأوناش حسب الحالة الفنية</h4>
              <p className="text-[10px] text-slate-400 font-bold">انقر على أي جزء من الرسم البياني لتصفية قائمة الأوناش بالأسفل</p>
            </div>
            <span className="p-1 bg-slate-50 text-[#0F4C81] rounded-lg">
              <Sparkles className="w-4 h-4 text-[#0F4C81]" />
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={handleChartClick}
                  cursor="pointer"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={selectedStatusFilter === entry.statusKey ? '#1e293b' : '#fff'}
                      strokeWidth={selectedStatusFilter === entry.statusKey ? 3 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value, entry: any) => {
                    const raw = entry.payload;
                    return (
                      <span className="text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer">
                        {value} ({raw.value} ونش)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total counts inside the pie */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
              <span className="text-[10px] text-slate-400 font-bold">إجمالي الأوناش</span>
              <span className="text-xl font-mono font-black text-slate-800">{totalCranes}</span>
            </div>
          </div>
        </div>

        {/* Chart B: Bar Chart displaying total lifting capacity (in tons) per status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-slate-800">إجمالي طاقة الرفع الموزعة بالموقع (بالطن)</h4>
              <p className="text-[10px] text-slate-400 font-bold">توضح طاقة الرفع المتوفرة للإنتاج مقابل تلك المعطلة أو تحت الصيانة</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-lg text-[9px]">
              طاقة فعالة: {totalActiveCapacity} طن
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 9, fontStyle: 'normal', fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  unit=" طن" 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-right dir-rtl font-sans text-xs space-y-1">
                          <p className="font-extrabold">{data.payload.name}</p>
                          <p className="text-emerald-400 font-black">
                            القدرة الإجمالية: <span className="font-mono text-white">{data.value} طن</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="إجمالي القدرة (طن)" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={45}
                >
                  {capacityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3.5. NEW Predictive Maintenance Cost Analysis Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        
        {/* Cost Analysis Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm md:text-base text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-[#0F4C81]/10 rounded-xl">
                <Brain className="w-5 h-5 text-[#0F4C81] animate-pulse" />
              </span>
              <span>تحليل وتوقع تكاليف الصيانة التنبؤية (Cost Forecasting Engine) 🧠⚡</span>
            </h4>
            <p className="text-xs text-slate-400 font-bold">محاكاة تفاعلية لتأثير كفاءة التنبؤ والالتزام بالصيانة الاستباقية على ضغط المصاريف وحماية الأصول</p>
          </div>

          {/* Sub-tab controllers */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold self-start md:self-auto">
            <button
              onClick={() => setCostTab('forecast')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${costTab === 'forecast' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              تنبؤات المصاريف (٦ أشهر) 📈
            </button>
            <button
              onClick={() => setCostTab('historical')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${costTab === 'historical' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              تحليل مسببات الأعطال وتكاليفها 🔍
            </button>
          </div>
        </div>

        {/* Multi-column grid: Controls & Insights (Left) vs Chart (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Column (4 cols) */}
          <div className="lg:col-span-4 space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            
            <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
              <Sliders className="w-4 h-4 text-[#0F4C81]" />
              <span>معايير نمذجة الميزانية التنبؤية</span>
            </div>

            {/* Slider 1: Adherence Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">معدل الالتزام بالصيانة الوقائية:</span>
                <span className="font-mono text-[#0F4C81]">{adherenceRate}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="150" 
                value={adherenceRate} 
                onChange={(e) => setAdherenceRate(Number(e.target.value))}
                className="w-full accent-[#0F4C81] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>تخفيض (أعطال عالية ⚠️)</span>
                <span>مثالي (١٠٠%)</span>
                <span>وقائي مكثف (حماية فائقة 🛡️)</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 leading-relaxed">
                {adherenceRate < 80 ? (
                  <span className="text-rose-600">❌ إهمال الصيانة الوقائية يوفر بالبداية، لكنه يضاعف الأعطال الطارئة بمعدل ٢.٤ ضعف ويسبب خسائر باهظة بالمواقع.</span>
                ) : adherenceRate > 110 ? (
                  <span className="text-emerald-700">🛡️ تكثيف الصيانة الاستباقية يرفع المصروف المجدول بشكل طفيف لكنه يخفض الأعطال والتعطل المفاجئ لنسب تقترب من الصفر.</span>
                ) : (
                  <span className="text-indigo-700">✅ معدل قياسي متوازن يضمن كفاءة ميكانيكية آمنة ومصروفات تشغيلية مستقرة وضمن الحدود المخططة.</span>
                )}
              </div>
            </div>

            {/* Slider 2: AI Predictive Efficiency */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">حساسية التنبؤ المبكر (الذكاء الاصطناعي):</span>
                <span className="font-mono text-indigo-600">{aiEfficiency}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="100" 
                value={aiEfficiency} 
                onChange={(e) => setAiEfficiency(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>تحليل مبدئي (٥٠%)</span>
                <span>تنبؤ متقدم (٨٥%)</span>
                <span>معايرة دقيقة (١٠٠%)</span>
              </div>
              <p className="p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500">
                🚀 زيادة كفاءة التنبؤ الذكي بمقدار <span className="font-mono text-indigo-600 font-extrabold">{aiEfficiency}%</span> يمنع <span className="text-indigo-600 font-black">{Math.round(aiEfficiency * 0.55)}%</span> من تكاليف العمرات الجسيمة والتوقف المفاجئ.
              </p>
            </div>

            {/* AI Optimization Summary Stats Card */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-md">
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wide">الوفورات المالية المقدرة بالذكاء الاصطناعي</span>
              
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {totalEstimatedSavings.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold">جنيه مصري</span>
              </div>

              <div className="text-[10px] text-slate-300 font-semibold space-y-1 divide-y divide-slate-800 pt-1">
                <div className="flex justify-between py-1">
                  <span>إجمالي المخطط الذكي المقترح:</span>
                  <span className="font-mono text-white">{totalForecastOptimized.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>إجمالي في سيناريو الإهمال والتوقف:</span>
                  <span className="font-mono text-rose-300">{totalForecastTraditional.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>نسبة الصيانة المخططة/الإجمالية:</span>
                  <span className="font-bold text-indigo-300">{pmPercentageOfTotal}% (مثالي 30-40%)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Graphical Display Column (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-4">
            
            {costTab === 'forecast' ? (
              <div className="space-y-4">
                
                {/* Forecast explanation */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pb-2 border-b border-slate-50">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">التنبؤ المالي للنصف الثاني من عام ٢٠٢٦</h5>
                    <p className="text-[10px] text-slate-400 font-bold">مقارنة بين إجمالي المصاريف بوجود التنبؤ الذكي والوقاية مقابل الإستراتيجية التقليدية غير المنظمة</p>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-extrabold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      الذكاء الاصطناعي والوقاية
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      التشغيل المجهد (أعطال عالية)
                    </span>
                  </div>
                </div>

                {/* Composed Chart representing forecast */}
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorPM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0F4C81" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorCM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" ج.م" />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xl text-right dir-rtl font-sans text-xs space-y-1.5 min-w-[220px]">
                                <p className="font-black border-b border-slate-800 pb-1 text-[#0F4C81]">{payload[0].payload.month} ٢٠٢٦</p>
                                {payload.map((p, idx) => (
                                  <p key={idx} className="flex justify-between items-center gap-4 text-[11px]">
                                    <span style={{ color: p.color }}>{p.name}:</span>
                                    <span className="font-mono font-bold text-white">{(p.value as number).toLocaleString()} ج.م</span>
                                  </p>
                                ))}
                                <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex justify-between items-center text-[10px] text-emerald-400 font-extrabold">
                                  <span>صافي الوفر المقدر:</span>
                                  <span className="font-mono">{(payload[0].payload['الوفر المالي التقديري'] as number).toLocaleString()} ج.م</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* Area of planned preventive cost */}
                      <Area type="monotone" name="الصيانة الوقائية (مخططة)" dataKey="الصيانة الوقائية (مخططة)" stroke="#0F4C81" fillOpacity={1} fill="url(#colorPM)" strokeWidth={2} />
                      
                      {/* Area of predicted breakdown cost */}
                      <Area type="monotone" name="أعطال وإصلاحات تنبؤية (ذكية)" dataKey="أعطال وإصلاحات تنبؤية (ذكية)" stroke="#eab308" fillOpacity={1} fill="url(#colorCM)" strokeWidth={2} />
                      
                      {/* Line of estimated unoptimized run-to-failure scenario */}
                      <Line type="monotone" name="سيناريو التشغيل التقليدي المجهد" dataKey="سيناريو التشغيل التقليدي المجهد" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" activeDot={{ r: 6 }} />
                      
                      {/* Line showing optimized sum cost */}
                      <Line type="monotone" name="إجمالي النفقات (مع الذكاء الاصطناعي)" dataKey="إجمالي النفقات (مع الذكاء الاصطناعي)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-indigo-50/40 p-3 rounded-lg border border-indigo-50/80 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>تؤكد تحليلات الذكاء الاصطناعي أن <span className="font-black text-indigo-700">الأعطال الكبرى (Catastrophic Failures)</span> الناتجة عن تآكل حبال الرفع الفولاذية أو تهريب ضغوط الهيدروليك تكلف <span className="text-rose-600 font-black">٨ أضعاف</span> الصيانة الدورية المنتظمة، وتتسبب بمتوسط توقف يبلغ <span className="font-black text-rose-600">٤ أيام</span> للمعدّة بالعمليات.</span>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Historical Breakdown Analysis Title */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">تحليل المكونات ومسببات الأعطال تاريخيًا بالورشة</h5>
                    <p className="text-[10px] text-slate-400 font-bold">بناءً على تكرار ورود الأوناش لقسم الصيانة وأوامر الشغل الصادرة</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">إجمالي المصاريف المسجلة: <strong className="font-mono text-slate-900">{totalHistoricalCost.toLocaleString()} ج.م</strong></span>
                </div>

                {/* Subsystem breakdown chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalFailureModes} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#475569' }} axisLine={false} tickLine={false} width={150} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-right dir-rtl font-sans text-xs space-y-1">
                                <p className="font-extrabold">{d.name}</p>
                                <p className="text-amber-400">تكرار العطل: <span className="font-mono text-white font-bold">{d['نسبة تكرار الأعطال %']}%</span></p>
                                <p className="text-rose-400">كلفة الإصلاح: <span className="font-mono text-white font-bold">{d['متوسط كلفة الإصلاح (جنيه)'].toLocaleString()} ج.م</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="نسبة تكرار الأعطال %" name="معدل الحدوث %" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {historicalFailureModes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Insight block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[10px] font-bold">
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-1 text-right">
                    <span className="text-rose-800 block font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      الأنظمة الهيدروليكية هي الأعلى كلفة وتكراراً
                    </span>
                    <span className="text-slate-500 leading-relaxed block">
                      مسؤولة عن ٤٢% من تعطل الرافعات. يتطلب ذلك إضافة مرشحات إضافية ومراقبة دورية لضغط ولزوجة الزيت في لوحة التحكم التنبؤية.
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1 text-right">
                    <span className="text-amber-800 block font-extrabold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      الأجهزة والحساسات: أسرع عطل وأدنى كلفة
                    </span>
                    <span className="text-slate-500 leading-relaxed block">
                      تتكرر بنسبة ٢٨% من إجمالي التوقفات ولكن كلفة تغييرها وضبطها ضئيلة، وتعتبر المرشح الأول المفضل لصيانات مجدولة وسريعة.
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* 3.6. NEW Periodic Performance & Maintenance Hours Report Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm md:text-base text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-[#0F4C81]/10 rounded-xl">
                <FileText className="w-5 h-5 text-[#0F4C81]" />
              </span>
              <span>منظومة توليد تقارير الأداء ومعدلات التشغيل الدورية 📊📋</span>
            </h4>
            <p className="text-xs text-slate-400 font-bold">مقارنة آلية تفاعلية لساعات التشغيل الميدانية للأوناش مقابل ساعات الصيانة وتحليل مستويات الفاقد الزمني</p>
          </div>

          {/* Quick config options */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
              <button
                onClick={() => setReportPeriod('weekly')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${reportPeriod === 'weekly' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                دورية أسبوعية 📅
              </button>
              <button
                onClick={() => setReportPeriod('monthly')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${reportPeriod === 'monthly' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                دورية شهرية 🗓️
              </button>
              <button
                onClick={() => setReportPeriod('quarterly')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${reportPeriod === 'quarterly' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                دورية ربع سنوية 📊
              </button>
            </div>
          </div>
        </div>

        {/* Form panel & Chart panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Controls & Recommendations (5 cols) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
              <Sliders className="w-4 h-4 text-[#0F4C81]" />
              <span>معايير الأداء والجاهزية المستهدفة</span>
            </div>

            {/* Slider for target operating rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">الحد الأدنى المقبول لمعدل التشغيل:</span>
                <span className="font-mono text-[#0F4C81]">{targetOperatingRate}%</span>
              </div>
              <input 
                type="range" 
                min="70" 
                max="95" 
                value={targetOperatingRate} 
                onChange={(e) => setTargetOperatingRate(Number(e.target.value))}
                className="w-full accent-[#0F4C81] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>اقتصادي (70%)</span>
                <span>قياسي (85%)</span>
                <span>فائق (95%)</span>
              </div>
            </div>

            {/* Microstats inside column */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">متوسط كفاءة الأسطول</span>
                <span className="text-lg font-black text-[#0F4C81] font-mono">{avgFleetOperatingRate}%</span>
                <span className="text-[9px] text-slate-400 font-bold block">معدل تشغيل فعلي</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي الساعات</span>
                <span className="text-lg font-black text-slate-800 font-mono">{(totalOpHoursAll + totalMaintHoursAll).toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 font-bold block">تشغيل وصيانة</span>
              </div>
            </div>

            {/* Report Generator triggers */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-600 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer text-center text-wrap"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري تجميع وحساب أداء الأوناش...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>توليد وتصدير التقرير الفني الشامل ({reportPeriod === 'weekly' ? 'الأسبوعي' : reportPeriod === 'monthly' ? 'الشهري' : 'الربع سنوي'}) 📄</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed">
                * يقوم النظام بسحب قراءات العدادات الرقمية وتتبع ساعات العمل مباشرة من الحقل ومقارنتها بسجلات تذاكر الصيانة المفتوحة بالورشة.
              </p>
            </div>

            {/* Smart recommendations based on rates */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5 shadow-sm">
              <span className="text-[10px] text-amber-400 font-black block flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                توصيات تحليل الهيكل الفني للأسطول 💡
              </span>
              <div className="text-[10px] text-slate-300 font-bold space-y-2 leading-relaxed">
                <p>
                  • الونش الأعلى كفاءة تشغيلية هو <span className="text-emerald-300 font-extrabold">{highestPerformer?.name}</span> بمعدل تشغيل يبلغ <span className="text-emerald-400 font-mono font-black">{highestPerformer?.['معدل التشغيل %']}%</span>.
                </p>
                <p>
                  • الونش الأكثر استهلاكاً لساعات الصيانة هو <span className="text-rose-300 font-extrabold">{lowestPerformer?.name}</span> بمعدل جاهزية <span className="text-rose-400 font-mono font-black">{lowestPerformer?.['معدل التشغيل %']}%</span>. نوصي بجدولة فحص وقائي فوري لمنع انهيار منظومته الهيدروليكية.
                </p>
              </div>
            </div>

          </div>

          {/* Right panel: Recharts Chart showing comparing Operating Hours vs Maintenance Hours (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-50 pb-2">
              <div>
                <h5 className="font-extrabold text-xs text-slate-800">مخطط ساعات التشغيل الفعلية مقابل ساعات الصيانة</h5>
                <p className="text-[10px] text-slate-400 font-bold">مقارنة ساعات الإنتاج في الميدان (بار) مقابل فترات التوقف للصيانة (بار) ومعدل الجاهزية % (خطي)</p>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-extrabold flex-wrap">
                <span className="flex items-center gap-1 text-[#0F4C81]">
                  <span className="w-2 h-2 rounded bg-[#0F4C81]" />
                  ساعات تشغيل (ساعة)
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="w-2 h-2 rounded bg-amber-500" />
                  ساعات صيانة (ساعة)
                </span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2 h-0.5 bg-emerald-500 inline-block" />
                  معدل الجاهزية %
                </span>
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceData} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="code" 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#475569' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  {/* Left YAxis for Hours */}
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                    unit=" س" 
                  />
                  {/* Right YAxis for rate % */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 9, fill: '#10b981' }} 
                    axisLine={false} 
                    tickLine={false} 
                    unit=" %"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-right dir-rtl font-sans text-xs space-y-1">
                            <p className="font-extrabold text-white border-b border-slate-800 pb-1">{d.name}</p>
                            <p className="text-[11px] text-slate-300 font-bold flex justify-between gap-4">
                              <span>الموديل:</span>
                              <span className="font-mono text-white">{d.model}</span>
                            </p>
                            <p className="text-[11px] text-[#0F4C81] font-bold flex justify-between gap-4">
                              <span>ساعات التشغيل الفعلي:</span>
                              <span className="font-mono text-white">{d['ساعات التشغيل']} ساعة</span>
                            </p>
                            <p className="text-[11px] text-amber-400 font-bold flex justify-between gap-4">
                              <span>ساعات الصيانة والتوقف:</span>
                              <span className="font-mono text-white">{d['ساعات الصيانة']} ساعة</span>
                            </p>
                            <p className="text-[11px] text-emerald-400 font-bold flex justify-between gap-4 border-t border-slate-800 pt-1 mt-1">
                              <span>معدل التشغيل والكفاءة:</span>
                              <span className="font-mono text-white">{d['معدل التشغيل %']}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" name="ساعات التشغيل" dataKey="ساعات التشغيل" fill="#0F4C81" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar yAxisId="left" name="ساعات الصيانة" dataKey="ساعات الصيانة" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Line yAxisId="right" name="معدل التشغيل %" type="monotone" dataKey="معدل التشغيل %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Grid of details comparing each item */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-2xs">
              <table className="w-full text-right border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2 font-bold text-slate-600">كود الونش</th>
                    <th className="px-3 py-2 font-bold text-slate-600">الاسم الفني</th>
                    <th className="px-3 py-2 text-center font-bold text-slate-600">ساعات العمل</th>
                    <th className="px-3 py-2 text-center font-bold text-slate-600">ساعات الصيانة</th>
                    <th className="px-3 py-2 text-center font-bold text-slate-600">معدل التشغيل الفعلي</th>
                    <th className="px-3 py-2 text-center font-bold text-slate-600">التقييم الفني</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {performanceData.map((row) => {
                    const isBelowTarget = row['معدل التشغيل %'] < targetOperatingRate;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 font-mono text-slate-900">{row.code}</td>
                        <td className="px-3 py-1.5 text-slate-700">{row.name}</td>
                        <td className="px-3 py-1.5 text-center font-mono text-slate-800">{row['ساعات التشغيل']} ساعة</td>
                        <td className="px-3 py-1.5 text-center font-mono text-amber-600">{row['ساعات الصيانة']} ساعة</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`font-mono ${isBelowTarget ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {row['معدل التشغيل %']}%
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {isBelowTarget ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>متدني (⚠️ صيانة فورية)</span>
                            </span>
                          ) : row['معدل التشغيل %'] >= 90 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>ممتاز (🛡️ كفاءة عالية)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] rounded-full">
                              <Clock className="w-2.5 h-2.5" />
                              <span>مستقر (متوازن)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* 3.7. Comprehensive Performance Report Overlay Modal */}
      <AnimatePresence>
        {showReportModal && generatedReportDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-sans text-right dir-rtl"
            >
              
              {/* Modal Header Controls */}
              <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0F4C81]" />
                  <span className="font-black text-sm">تقرير الأداء الدوري المعتمد لأسطول أوناش مصر</span>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors text-xs font-black bg-slate-800 rounded-lg cursor-pointer px-3"
                >
                  إغلاق نافذة التقرير ✕
                </button>
              </div>

              {/* Printable Area */}
              <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0" id="printable-report-area">
                
                {/* Document Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#0F4C81] pb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900">مجموعة أوناش مصر للتجارة والهندسة 🇪🇬</h2>
                    <p className="text-xs text-slate-500 font-extrabold">القسم الفني ووحدات الدعم الهندسي - إدارة هندسة الحركة والصيانة</p>
                    <p className="text-[10px] text-slate-400 font-black">رمز تصديق النظام: <span className="font-mono">EC-REP-2026-{Math.floor(Math.random() * 9000) + 1000}</span></p>
                  </div>
                  <div className="bg-[#0F4C81]/5 p-3 rounded-2xl border border-[#0F4C81]/15 flex items-center gap-2 self-start sm:self-auto text-left">
                    <div className="space-y-0.5 text-right">
                      <span className="text-[9px] text-[#0F4C81] font-black uppercase tracking-wide block">حالة التقرير</span>
                      <span className="text-xs font-black text-[#0F4C81] block">مستخرج تلقائي معتمد ✅</span>
                    </div>
                  </div>
                </div>

                {/* Report Metadata Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">دورية التقرير:</span>
                    <span className="text-slate-800">تقرير فني {generatedReportDetails.periodText}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">تاريخ الاستخراج:</span>
                    <span className="text-slate-800">{generatedReportDetails.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">توقيت الاستخراج:</span>
                    <span className="text-slate-800 font-mono">{generatedReportDetails.time}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">مسؤول الأنظمة والمصادقة:</span>
                    <span className="text-[#0F4C81]">مهندس الصيانة المناوب 👨‍💻</span>
                  </div>
                </div>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-800 font-extrabold block">معدل تشغيل الأسطول الكلي</span>
                    <span className="text-2xl font-black text-emerald-700 font-mono">{generatedReportDetails.avgFleetOperatingRate}%</span>
                    <p className="text-[9px] text-emerald-600 font-bold leading-normal">يتخطى الحد الأدنى المستهدف ({targetOperatingRate}%) ومستوى جاهزية فنية مستقر للعمل الميداني.</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                    <span className="text-[10px] text-[#0F4C81] font-extrabold block">ساعات العمل المنتجة</span>
                    <span className="text-2xl font-black text-[#0F4C81] font-mono">{generatedReportDetails.totalOpHoursAll.toLocaleString()} ساعة</span>
                    <p className="text-[9px] text-[#0F4C81] font-bold">ساعات تشغيل مسجلة ومكتسبة ميدانياً عبر حساسات الرافعات بالمشاريع الإنشائية.</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                    <span className="text-[10px] text-amber-800 font-extrabold block">ساعات الصيانة الموثقة</span>
                    <span className="text-2xl font-black text-amber-700 font-mono">{generatedReportDetails.totalMaintHoursAll.toLocaleString()} ساعة</span>
                    <p className="text-[9px] text-amber-600 font-bold">تشمل أعمال الصيانة الوقائية والطارئة المسجلة بالورش في فترة المراجعة.</p>
                  </div>
                </div>

                {/* Crane detailed table for printout */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-slate-800">تفاصيل أداء وحدات أسطول الأوناش</h3>
                  <table className="w-full text-right border-collapse text-xs border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-3 py-2 font-bold border-l border-slate-200">كود الونش</th>
                        <th className="px-3 py-2 font-bold border-l border-slate-200">الاسم الفني والموديل</th>
                        <th className="px-3 py-2 text-center font-bold border-l border-slate-200">ساعات التشغيل</th>
                        <th className="px-3 py-2 text-center font-bold border-l border-slate-200">ساعات الصيانة</th>
                        <th className="px-3 py-2 text-center">معدل التشغيل %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {performanceData.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 font-mono font-black border-l border-slate-100">{row.code}</td>
                          <td className="px-3 py-2 border-l border-slate-100">{row.name} - <span className="text-[10px] text-slate-400 font-mono">{row.model}</span></td>
                          <td className="px-3 py-2 text-center font-mono border-l border-slate-100">{row['ساعات التشغيل']} ساعة</td>
                          <td className="px-3 py-2 text-center font-mono border-l border-slate-100 text-amber-600">{row['ساعات الصيانة']} ساعة</td>
                          <td className="px-3 py-2 text-center font-mono font-extrabold">
                            <span className={row['معدل التشغيل %'] < targetOperatingRate ? 'text-rose-600' : 'text-emerald-600'}>
                              {row['معدل التشغيل %']}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detailed analysis report text */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                  <p className="font-black text-slate-800 text-xs">📝 الملخص الهندسي والتحليل الفني لتوازن الأداء:</p>
                  <p className="text-slate-600">
                    بناءً على تتبع منظومة قراءات الأجهزة الإلكترونية وحساسات الأوناش بالمواقع ومقارنتها بقسم الورشة، تبين أن الأسطول يحقق كفاءة إجمالية مستقرة تبلغ <strong className="text-slate-800">{generatedReportDetails.avgFleetOperatingRate}%</strong>. يسجل المعدل الأعلى في الكفاءة لدى <strong className="text-emerald-700">{generatedReportDetails.highestPerformerName}</strong> بمعدل <strong className="text-emerald-700 font-mono">{generatedReportDetails.highestPerformerRate}%</strong>، بينما يسجل الونش <strong className="text-rose-700">{generatedReportDetails.lowestPerformerName}</strong> انخفاضاً ملحوظاً في الإنتاجية بمعدل <strong className="text-rose-700 font-mono">{generatedReportDetails.lowestPerformerRate}%</strong> نتيجة خضوعه لأعمال صيانة مكثفة بالهيدروليك.
                  </p>
                  <p className="text-slate-600">
                    <strong>التوصية الفنية المعتمدة:</strong> يوصى بنقل جزئي للأحمال الثقيلة إلى الرافعات ذات معامل الكفاءة الأعلى لتخفيف الإجهاد على الروافع المتدنية، مع تكثيف عمليات فحص لزوجة الهيدروليك وتغير فلاتر الديزل لتلافي التآكل الميكانيكي المستمر والارتقاء بالمعدلات الفنية.
                  </p>
                </div>

                {/* Signature and Stamps Block */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-xs font-bold border-t border-slate-100">
                  <div className="space-y-8">
                    <p className="text-slate-400">اعتماد مدير الإدارة الفنية والصيانة:</p>
                    <div className="space-y-0.5">
                      <p className="text-slate-800">م. ياسر حسن ✍️</p>
                      <p className="text-[10px] text-slate-400 font-bold">رئيس قسم هندسة الرافعات الثقيلة</p>
                    </div>
                  </div>
                  <div className="space-y-8 text-left">
                    <p className="text-slate-400 text-right">أختام وتصديق الأنظمة الرقمية:</p>
                    <div className="inline-flex flex-col items-center p-2 border-2 border-dashed border-[#0F4C81]/40 rounded-xl bg-[#0F4C81]/5">
                      <span className="text-[10px] text-[#0F4C81] font-black tracking-wide">EGYPT CRANES APPROVED</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">SYSTEM SEAL #EC-7729</span>
                      <span className="text-[8px] text-slate-300 font-bold">منظومة المصادقة السحابية</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <p className="text-[10px] text-slate-400 font-bold">يمكنك طباعة هذا التقرير مباشرة كنسخة ورقية معتمدة أو حفظه كملف PDF رقمي.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] hover:bg-[#0c3e6a] text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة التقرير الفني 🖨️</span>
                  </button>
                  <button
                    onClick={() => {
                      alert('تمت محاكاة تحميل التقرير بصيغة PDF بنجاح وحفظه في سجل تقارير الصيانة الرقمية!');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير PDF 💾</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.8. Operating Hours Analysis & Next Maintenance Date Prediction Engine */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-right dir-rtl" dir="rtl">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm md:text-base text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
              </span>
              <span>محرك التحليل والتنبؤ بمواعيد الصيانة القادمة بناءً على ساعات التشغيل 🧠🔮</span>
            </h4>
            <p className="text-xs text-slate-400 font-bold">يقوم النظام بتحليل معدل التشغيل اليومي وتطبيق معادلات محاكاة متقدمة لتحديد الموعد المتوقع للصيانة القادمة لكل ونش بدقة متناهية</p>
          </div>
          
          <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2.5 py-1 rounded-full font-black self-start md:self-auto">
            ميزة تنبؤية نشطة ⚡
          </span>
        </div>

        {/* Success Alert */}
        {successScheduledMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-center justify-between">
            <span>{successScheduledMsg}</span>
            <button 
              onClick={() => setSuccessScheduledMsg(null)}
              className="text-emerald-500 hover:text-emerald-800 text-[11px] font-black cursor-pointer px-2"
            >
              إغلاق ✕
            </button>
          </div>
        )}

        {/* Grid layout: Simulation Parameters (Left - 4 columns) vs Prediction List (Right - 8 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Columns (Parameters Controller) */}
          <div className="lg:col-span-4 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            
            <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>معايير نمذجة الموعد المتوقع</span>
            </div>

            {/* Parameter 1: Daily Working Hours */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">متوسط ساعات العمل اليومية للونش:</span>
                <span className="font-mono text-indigo-600">{dailyWorkHours} ساعات / يوم</span>
              </div>
              <input 
                type="range" 
                min="4" 
                max="16" 
                value={dailyWorkHours} 
                onChange={(e) => setDailyWorkHours(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>تخفيف (٤ ساعات)</span>
                <span>متوسط وردية (٨)</span>
                <span>أقصى طاقة (١٦ ساعة)</span>
              </div>
            </div>

            {/* Parameter 2: Operating Intensity */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block">شدة وظروف التشغيل بالموقع:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOperatingIntensity('normal')}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                    operatingIntensity === 'normal'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-3xs'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  أحمال عادية (١.٠)
                </button>
                <button
                  type="button"
                  onClick={() => setOperatingIntensity('heavy')}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                    operatingIntensity === 'heavy'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-3xs'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  أحمال شاقة (١.٢)
                </button>
                <button
                  type="button"
                  onClick={() => setOperatingIntensity('extreme')}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                    operatingIntensity === 'extreme'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-3xs'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  قاسية جداً (١.٤)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                {operatingIntensity === 'normal' && '✓ تشغيل مستقر بحمولات اعتيادية ومعدل اهتراء منخفض.'}
                {operatingIntensity === 'heavy' && '⚠️ تشغيل مستمر مع أحمال تفوق ٨٠% من الطاقة في بيئة رملية (+٢٠% استهلاك للزيت).'}
                {operatingIntensity === 'extreme' && '🚨 تشغيل في درجات حرارة فائقة أو رطوبة مالحة بالبحر الأحمر (+٤٠% تسارع في اهتراء القطع).'}
              </p>
            </div>

            {/* Explanation box */}
            <div className="bg-indigo-900 text-white p-4 rounded-xl space-y-2.5 shadow-md">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] text-slate-200 font-extrabold uppercase tracking-wide">الخوارزمية التنبؤية للتشغيل</span>
              </div>
              <p className="text-[10px] text-slate-200 font-bold leading-relaxed">
                يتم تحديد حد الصيانة القادم بمضاعفات <span className="text-amber-300 font-black">٢٥٠ ساعة تشغيل</span>. يتناقص الموعد المتوقع طردياً بزيادة متوسط ساعات العمل اليومية أو شدة ظروف الموقع، مما ينبه المشغل لحجز ورشة الفحص مبكراً وتجنب حدوث ععل مفاجئ.
              </p>
              <div className="border-t border-indigo-850 pt-2 flex justify-between text-[10px] font-bold text-slate-300">
                <span>معدل الاستهلاك المطبق:</span>
                <span className="font-black text-amber-300">
                  {dailyWorkHours * (operatingIntensity === 'normal' ? 1.0 : operatingIntensity === 'heavy' ? 1.2 : 1.4)} ساعة / يومياً
                </span>
              </div>
            </div>

          </div>

          {/* Right Columns (Predictions List & Grid) */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>قائمة تنبؤات الأسطول بناءً على فلترة البحث: ({filteredCranes.length} أوناش)</span>
              <span className="text-[10px] text-slate-400">تاريخ اليوم المرجعي للنموذج: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <div className="space-y-3">
              {filteredCranes.map(crane => {
                // Get current hours
                const hoursMap = cranesHours || { c1: 482, c2: 238, c3: 741, c4: 989, c5: 242 };
                const currentHours = hoursMap[crane.id] || 320;

                // Calculate milestone
                let nextMilestone = Math.ceil(currentHours / 250) * 250;
                if (nextMilestone === currentHours) {
                  nextMilestone += 250;
                }
                const remainingHours = Math.max(0, nextMilestone - currentHours);

                // Compute predicted date
                const usagePerDay = dailyWorkHours * (operatingIntensity === 'normal' ? 1.0 : operatingIntensity === 'heavy' ? 1.2 : 1.4);
                const daysToMilestone = usagePerDay > 0 ? remainingHours / usagePerDay : 30;
                const predictedDate = new Date(Date.now() + daysToMilestone * 24 * 60 * 60 * 1000);

                // Urgency level
                const isUrgent = remainingHours <= 15;
                const isMedium = remainingHours > 15 && remainingHours <= 40;

                // Milestone details & recommendations
                let milestoneTitle = '';
                let milestoneAction = '';
                let estimatedCost = 3000;
                
                const mMod = nextMilestone % 1000;
                if (mMod === 250) {
                  milestoneTitle = 'صيانة وقائية الـ ٢٥٠ ساعة المحدودة';
                  milestoneAction = 'تشحيم جميع الوصلات الهيدروليكية، غسيل وفحص فلاتر الهواء بورشة غبريال، واختبار ضغط الخراطيم.';
                  estimatedCost = 4500;
                } else if (mMod === 500) {
                  milestoneTitle = 'صيانة وقائية الـ ٥٠٠ ساعة الدورية';
                  milestoneAction = 'تغيير فلاتر زيت المحرك، استبدال فلاتر ديزل ألمانية أصلية، فحص لزوجة الهيدروليك ومعايرة الحساسات الكهروميكانيكية.';
                  estimatedCost = 12000;
                } else if (mMod === 750) {
                  milestoneTitle = 'صيانة وقائية الـ ٧٥٠ ساعة الهيكلية';
                  milestoneAction = 'فحص سلامة حبال الواير والخطاف الرئيسي، مراجعة فرامل التثبيت والاتزان، ومعايرة حساس الرياح والأوزان.';
                  estimatedCost = 18500;
                } else {
                  milestoneTitle = 'صيانة كبرى الـ ١٠٠٠ ساعة / عمرة هيدروليكية';
                  milestoneAction = 'عمرة كاملة لمنظومة الضغط وصمامات الأمان، استبدال الوايرات التالفة، فحص شروخ الهيكل واختبار حمل معتمد.';
                  estimatedCost = 45000;
                }

                return (
                  <div 
                    key={crane.id} 
                    className={`p-4 rounded-2xl border transition-all bg-white shadow-3xs flex flex-col gap-4 hover:border-indigo-200 ${
                      isUrgent 
                        ? 'border-l-4 border-l-rose-500 border-slate-100 bg-rose-50/10' 
                        : isMedium
                          ? 'border-l-4 border-l-amber-500 border-slate-100 bg-amber-50/10'
                          : 'border-l-4 border-l-emerald-500 border-slate-100'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-black">
                            {crane.code}
                          </span>
                          <span className="text-[11px] text-slate-500 font-bold">
                            {crane.model}
                          </span>
                        </div>
                        <h5 className="font-black text-slate-800 text-xs sm:text-sm">{crane.nameAr}</h5>
                      </div>

                      {/* Remaining badges */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border tracking-wide flex items-center gap-1 ${
                          isUrgent 
                            ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' 
                            : isMedium 
                              ? 'bg-amber-100 text-amber-800 border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {isUrgent ? '🚨 حرج جداً (صيانة عاجلة)' : isMedium ? '⚠️ انتباه: موعد قريب' : '✓ مستقر وآمن'}
                        </span>
                        
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1 rounded-xl text-[10px] font-black">
                          {Math.round(currentHours)} س تشغيل
                        </span>
                      </div>
                    </div>

                    {/* Progress to next milestone */}
                    <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                        <span>الهدف القادم: <strong className="text-slate-800 font-mono font-black">{nextMilestone} ساعة</strong> ({milestoneTitle})</span>
                        <span>متبقي: <strong className={isUrgent ? 'text-rose-600 font-mono font-black' : 'text-indigo-600 font-mono font-black'}>{Math.round(remainingHours * 10) / 10} ساعة تشغيل</strong></span>
                      </div>
                      
                      {/* Bar */}
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-full relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUrgent ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, ((250 - remainingHours) / 250) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Prediction Results Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                      
                      {/* Date details (8 cols) */}
                      <div className="sm:col-span-8 bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-3 flex flex-col justify-between space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-700 leading-normal font-medium">
                            <span className="font-extrabold text-slate-800 block text-xs">توصية الصيانة الذكية:</span>
                            {milestoneAction}
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-1.5 flex justify-between">
                          <span>معدل التشغيل الافتراضي: <strong className="font-mono text-slate-700">{Math.round(usagePerDay * 10) / 10} س / يوم</strong></span>
                          <span>التكلفة المقدرة: <strong className="font-mono text-indigo-700">{estimatedCost.toLocaleString()} ج.م</strong></span>
                        </div>
                      </div>

                      {/* Predicted date badge (4 cols) */}
                      <div className="sm:col-span-4 bg-indigo-900 text-white rounded-xl p-3 text-center flex flex-col justify-center items-center relative overflow-hidden group">
                        <div className="absolute top-[-20px] left-[-20px] w-12 h-12 rounded-full bg-white/5 group-hover:scale-150 transition-transform pointer-events-none" />
                        <span className="text-[9px] text-indigo-200 block font-bold uppercase tracking-wide">الموعد المتوقع للصيانة</span>
                        
                        <p className="font-black text-sm mt-1">
                          {predictedDate.toLocaleDateString('ar-EG', { weekday: 'long' })}
                        </p>
                        <p className="font-bold text-[10px] text-amber-300">
                          {predictedDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[9px] text-indigo-200 font-mono font-bold mt-1.5">
                          أي بعد {Math.round(daysToMilestone)} أيام تقريباً
                        </p>
                      </div>

                    </div>

                    {/* Schedule Action Button */}
                    <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddPredictiveOrder) {
                            onAddPredictiveOrder({
                              craneId: crane.id,
                              type: 'preventive',
                              description: `[صيانة تنبؤية بناءً على ساعات التشغيل]: ${milestoneTitle} الموصى بها عند ${nextMilestone} ساعة تشغيل. متبقي ${Math.round(remainingHours)} ساعة عمل فنية.`,
                              cost: estimatedCost
                            });
                            setSuccessScheduledMsg(`تم بنجاح إرسال نموذج جدولة الصيانة الوقائية الاستباقية للونش ${crane.nameAr} (${crane.code}) لاستكمال الاعتماد المالي ومصادقة الورشة!`);
                          } else {
                            alert(`تمت محاكاة جدولة أمر صيانة وقائية للونش ${crane.nameAr} عند حاجز ${nextMilestone} ساعة بنجاح!`);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>جدولة الصيانة الاستباقية للـ {nextMilestone} ساعة ⚡</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* 4. Interactive Crane Status Manager List */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        
        {/* Table Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-50">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-[#0F4C81]" />
              <span>التحكم وتعديل حالات الأوناش بالمواقع</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">تغيير حالة أي ونش بالأسفل لتحديث الإحصائيات والرسوم البيانية السابقة تلقائياً ومباشرة</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Quick search input */}
            <input 
              type="text" 
              placeholder="البحث بالرمز، الاسم أو المشغل..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] w-48"
            />

            {/* Quick status filter select */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter(null)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${!selectedStatusFilter ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('running')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${selectedStatusFilter === 'running' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                تعمل
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('maintenance')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${selectedStatusFilter === 'maintenance' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                صيانة
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('idle')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${selectedStatusFilter === 'idle' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                متوقفة
              </button>
            </div>

          </div>
        </div>

        {/* Cranes Table with Quick Action Controllers */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-bold text-slate-600">كود الونش</th>
                <th className="px-4 py-3 font-bold text-slate-600">اسم وموديل الونش</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-center">القدرة الاستيعابية</th>
                <th className="px-4 py-3 font-bold text-slate-600">قائد الونش (المشغل)</th>
                <th className="px-4 py-3 font-bold text-slate-600">الحالة الحالية</th>
                <th className="px-4 py-3 font-bold text-slate-600 text-center">تعديل الحالة التفاعلية السريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCranes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                    لا توجد أوناش مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredCranes.map((crane) => {
                  const mapped = statusMapping[crane.status];
                  const StatusIcon = mapped.icon;

                  return (
                    <tr key={crane.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Code */}
                      <td className="px-4 py-3 font-mono font-black text-slate-900">
                        {crane.code}
                      </td>

                      {/* Name & model */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 block">{crane.nameAr}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{crane.model}</span>
                          </div>
                          {(() => {
                            const hoursMap = cranesHours || { c1: 482, c2: 238, c3: 741, c4: 989, c5: 242 };
                            const currentHours = hoursMap[crane.id] || 320;
                            const milestoneInterval = 250;
                            let nextMilestone = Math.ceil(currentHours / milestoneInterval) * milestoneInterval;
                            if (nextMilestone === currentHours) {
                              nextMilestone += milestoneInterval;
                            }
                            const remainingHours = Math.max(0, nextMilestone - currentHours);
                            
                            if (remainingHours <= 40) {
                              return (
                                <span 
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                                    remainingHours <= 15
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}
                                  title={`يقترب من صيانة الـ ${nextMilestone} ساعة (متبقي ${Math.round(remainingHours * 10) / 10} ساعة)`}
                                >
                                  <AlertTriangle className={`w-3 h-3 shrink-0 ${remainingHours <= 15 ? 'text-rose-500' : 'text-amber-500'}`} />
                                  <span>{remainingHours <= 15 ? 'صيانة حرجة' : 'اقترب الموعد'} ({Math.round(remainingHours)}س)</span>
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>

                      {/* Capacity */}
                      <td className="px-4 py-3 text-center font-bold text-slate-700 font-mono">
                        {crane.capacity} طن
                      </td>

                      {/* Operator */}
                      <td className="px-4 py-3 text-slate-500 font-bold">
                        {crane.operatorName || 'لم يحدد بعد'}
                      </td>

                      {/* Status pill */}
                      <td className="px-4 py-3">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-all"
                          style={{ backgroundColor: mapped.bgLight, color: mapped.textDark }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: mapped.color }} />
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{mapped.label}</span>
                        </span>
                      </td>

                      {/* Quick Interactive Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {onUpdateCraneStatus ? (
                            <>
                              <button
                                onClick={() => onUpdateCraneStatus(crane.id, 'running')}
                                disabled={crane.status === 'running'}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                                  crane.status === 'running'
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                                title="تعيين كـ تعمل بالميدان"
                              >
                                <Play className="w-3 h-3" />
                                <span>تعمل</span>
                              </button>

                              <button
                                onClick={() => onUpdateCraneStatus(crane.id, 'maintenance')}
                                disabled={crane.status === 'maintenance'}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                                  crane.status === 'maintenance'
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                                title="إرسال لورشة الصيانة"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>صيانة</span>
                              </button>

                              <button
                                onClick={() => onUpdateCraneStatus(crane.id, 'idle')}
                                disabled={crane.status === 'idle'}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                                  crane.status === 'idle'
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                                }`}
                                title="إيقاف الونش عن العمل"
                              >
                                <Pause className="w-3 h-3" />
                                <span>متوقفة</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 font-bold text-[10px]">تعديل الحالة متاح عبر لوحة التشغيل</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
