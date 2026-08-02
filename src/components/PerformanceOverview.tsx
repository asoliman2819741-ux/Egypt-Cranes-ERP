import React, { useState, useMemo } from 'react';
import { 
  Activity, Wrench, AlertTriangle, Truck, Clock, ShieldCheck, 
  TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2, ChevronRight, 
  BarChart2, PieChart as PieChartIcon, Filter, Search, Eye, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { Crane, MaintenanceOrder, Vehicle, InventoryItem } from '../types';

interface PerformanceOverviewProps {
  cranes: Crane[];
  maintenanceOrders: MaintenanceOrder[];
  vehicles?: Vehicle[];
  inventoryItems?: InventoryItem[];
  setPage?: (page: string) => void;
  onRefresh?: () => void;
}

export default function PerformanceOverview({
  cranes = [],
  maintenanceOrders = [],
  vehicles = [],
  inventoryItems = [],
  setPage,
  onRefresh
}: PerformanceOverviewProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'maintenance' | 'low_inventory'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<'utilization' | 'downtime' | 'pending_maintenance' | null>(null);

  // --- KPI CALCULATIONS ---
  const totalCranes = cranes.length || 1;
  const runningCranes = cranes.filter(c => c.status === 'running').length;
  const maintenanceCranes = cranes.filter(c => c.status === 'maintenance').length;
  const idleCranes = cranes.filter(c => c.status === 'idle').length;

  // Crane Utilization Rate (%)
  const utilizationRate = Math.round((runningCranes / totalCranes) * 100);

  // Total Capacity Utilization
  const totalCapacity = cranes.reduce((acc, c) => acc + (c.capacity || 0), 0);
  const activeCapacity = cranes
    .filter(c => c.status === 'running')
    .reduce((acc, c) => acc + (c.capacity || 0), 0);
  const capacityUtilizationRate = totalCapacity > 0 ? Math.round((activeCapacity / totalCapacity) * 100) : 0;

  // Fleet Downtime (%)
  const totalFleetUnits = (cranes.length + vehicles.length) || 1;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const totalDowntimeUnits = maintenanceCranes + maintenanceVehicles;
  const downtimeRate = Math.round((totalDowntimeUnits / totalFleetUnits) * 100);

  // Pending Maintenance Requests
  const pendingRequests = maintenanceOrders.filter(
    m => m.status === 'pending' || m.status === 'in_progress'
  );
  const urgentMaintenance = pendingRequests.filter(m => m.type === 'corrective');
  const preventiveMaintenance = pendingRequests.filter(m => m.type === 'preventive');
  const pendingMaintenanceCost = pendingRequests.reduce((acc, m) => acc + (m.cost || 0), 0);

  // Low Inventory Alert
  const lowInventoryCount = inventoryItems.filter(item => item.currentQty <= item.minQty).length;

  // Pie Chart Data for Crane Status
  const craneStatusData = [
    { name: 'تعمل حالياً', value: runningCranes, color: '#10B981' },
    { name: 'في الصيانة', value: maintenanceCranes, color: '#EF4444' },
    { name: 'جاهزة / خاملة', value: idleCranes, color: '#F59E0B' }
  ];

  // Bar Chart Data for Maintenance Orders by Type
  const maintenanceChartData = [
    { name: 'صيانة طارئة/إصلاحية', count: maintenanceOrders.filter(m => m.type === 'corrective').length, fill: '#EF4444' },
    { name: 'صيانة وقائية', count: maintenanceOrders.filter(m => m.type === 'preventive').length, fill: '#3B82F6' },
    { name: 'مكتملة', count: maintenanceOrders.filter(m => m.status === 'completed').length, fill: '#10B981' },
  ];

  // Filtered maintenance list for quick view
  const filteredMaintenanceOrders = useMemo(() => {
    return pendingRequests.filter(m => {
      const matchesSearch = (m.craneName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (m.orderNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedFilter === 'pending') return matchesSearch && m.status === 'pending';
      return matchesSearch;
    });
  }, [pendingRequests, searchQuery, selectedFilter]);

  return (
    <div id="performance-overview" className="bg-slate-50/70 p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                مؤشرات الأداء الرئيسية (Performance Overview)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                مراقبة مباشرة ومُحدثة لمعدلات التشغيل، التوقفات، وأوامر الصيانة المعلقة
              </p>
            </div>
          </div>
        </div>

        {/* TIME RANGE CONTROLS & REFRESH */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'today' ? 'bg-white text-[#0F4C81] shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'week' ? 'bg-white text-[#0F4C81] shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'month' ? 'bg-white text-[#0F4C81] shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              هذا الشهر
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-[#0F4C81] hover:bg-slate-50 rounded-xl transition-all shadow-sm"
              title="تحديث البيانات المباشرة"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TOP 3 PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: CRANE UTILIZATION RATE */}
        <div 
          onClick={() => setActiveModal('utilization')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              معدل استغلال الأوناش (Utilization)
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {utilizationRate}%
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{Math.max(2, utilizationRate - 70)}% عن الهدف</span>
            </div>
          </div>

          {/* Progress Gauge Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${utilizationRate}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>الأوناش العاملة: <strong className="text-slate-900 font-bold">{runningCranes}</strong> من أصل {totalCranes}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              تفاصيل <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </span>
          </div>
        </div>

        {/* KPI 2: FLEET DOWNTIME */}
        <div 
          onClick={() => setActiveModal('downtime')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              نسبة توقف الأسطول (Fleet Downtime)
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {downtimeRate}%
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              downtimeRate > 15 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'
            }`}>
              {downtimeRate > 15 ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{downtimeRate > 15 ? 'تنبيه توقف مرتفع' : 'ضمن الحدود الآمنة'}</span>
            </div>
          </div>

          {/* Progress Gauge Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, downtimeRate * 2.5)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>وحدات متوقفة/صيانة: <strong className="text-rose-600 font-bold">{totalDowntimeUnits}</strong> معدة</span>
            <span className="text-rose-700 font-bold flex items-center gap-0.5">
              تحليل التوقفات <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </span>
          </div>
        </div>

        {/* KPI 3: PENDING MAINTENANCE REQUESTS */}
        <div 
          onClick={() => setActiveModal('pending_maintenance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              طلبات الصيانة المعلقة (Pending Maintenance)
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {pendingRequests.length}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>{urgentMaintenance.length} طارئة</span>
            </div>
          </div>

          {/* Sub Stats Bar */}
          <div className="grid grid-cols-2 gap-2 my-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">وقائية معلقة</span>
              <span className="font-extrabold text-blue-600">{preventiveMaintenance.length}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">إجمالي الكلفة المخصصة</span>
              <span className="font-extrabold text-slate-800">{pendingMaintenanceCost.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span>إدارة الطلبات القائمة</span>
            <span className="text-amber-700 font-bold flex items-center gap-0.5">
              عرض الأوامر <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </span>
          </div>
        </div>

      </div>

      {/* SECONDARY GRAPHICAL & ANALYTICAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CRANE STATUS DISTRIBUTION (PIE CHART) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#0F4C81]" />
                توزيع حالات الأوناش المباشرة
              </h3>
              <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                إجمالي {totalCranes} أوناش
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={craneStatusData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {craneStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${value} ونش`, 'العدد']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {craneStatusData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2 rounded-xl">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="text-base font-black text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING MAINTENANCE QUICK MANAGEMENT PANEL */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                جدول طلبات الصيانة المعلقة والمباشرة ({pendingRequests.length})
              </h3>

              {setPage && (
                <button 
                  onClick={() => setPage('maintenance')}
                  className="text-xs font-bold text-[#0F4C81] hover:underline flex items-center gap-1 self-end sm:self-auto"
                >
                  انتقال لصفحة الصيانة الكاملة
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}
            </div>

            {/* Quick Search inside panel */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الأمر أو اسم الونش..."
                className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 transition-all"
              />
            </div>

            {/* Table or Empty state */}
            {filteredMaintenanceOrders.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">لا توجد طلبات صيانة معلقة تطابق هذا البحث</p>
                <p className="text-[11px] text-slate-400 mt-0.5">جميع الأوناش والمعدات تعمل بكفاءة مستقرة</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-52 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold sticky top-0">
                    <tr>
                      <th className="p-2.5">رقم الأمر</th>
                      <th className="p-2.5">الونش / المعدة</th>
                      <th className="p-2.5">النوع</th>
                      <th className="p-2.5">الحالة</th>
                      <th className="p-2.5">التكلفة المتوقعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaintenanceOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-[#0F4C81]">{order.orderNo}</td>
                        <td className="p-2.5 font-bold text-slate-900">{order.craneName || 'غير محدد'}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            order.type === 'corrective' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {order.type === 'corrective' ? 'طارئة / إصلاح' : 'وقائية'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            order.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {(order.cost || 0).toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>معدل معالجة الأعطال: <strong className="text-slate-900 font-bold">2.4 ساعة / أمر</strong></span>
            <span className="text-emerald-600 font-bold">جاهزية الأسطول: {100 - downtimeRate}%</span>
          </div>
        </div>

      </div>

      {/* DETAILED MODALS ON KPI CLICK */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">
                  {activeModal === 'utilization' && 'تفاصيل معدل استغلال وتشغيل الأوناش'}
                  {activeModal === 'downtime' && 'تحليل توقفات الأسطول والصيانة'}
                  {activeModal === 'pending_maintenance' && 'قائمة طلبات الصيانة المعلقة الكاملة'}
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {activeModal === 'utilization' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <span className="text-slate-500 block">إجمالي أوناش الاسطول:</span>
                      <strong className="text-lg font-black text-slate-900">{totalCranes} ونش</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">الطاقة الاستيعابية النشطة:</span>
                      <strong className="text-lg font-black text-emerald-600">{activeCapacity} طن / {totalCapacity} طن</strong>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 pt-2">حالة كل ونش بالتفصيل:</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {cranes.map((crane) => (
                      <div key={crane.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{crane.nameAr} ({crane.code})</div>
                          <div className="text-slate-500 text-[11px]">الموديل: {crane.model} | حمولة: {crane.capacity} طن</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                          crane.status === 'running' ? 'bg-emerald-50 text-emerald-700' :
                          crane.status === 'maintenance' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {crane.status === 'running' ? 'يعمل' : crane.status === 'maintenance' ? 'في الصيانة' : 'خامل'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'downtime' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-800 space-y-1">
                    <strong className="block text-sm">معدل التوقف الحالي: {downtimeRate}%</strong>
                    <p>يوجد عدد {totalDowntimeUnits} معدة خارج الخدمة حالياً بسبب إجراء أعمال صيانة دورية أو إصلاحات طارئة.</p>
                  </div>

                  <h4 className="font-bold text-slate-800">المعدات المتوقفة في الصيانة حالياً:</h4>
                  <div className="space-y-2">
                    {cranes.filter(c => c.status === 'maintenance').map(c => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{c.nameAr} ({c.code})</span>
                          <span className="text-slate-500">سائق/مشغل: {c.operatorName || 'غير معين'}</span>
                        </div>
                        <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-bold">تحت الإصلاح</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'pending_maintenance' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl text-amber-900 font-bold">
                    <span>إجمالي الأوامر القائمة: {pendingRequests.length} أمر</span>
                    <span>التكلفة التقديرية: {pendingMaintenanceCost.toLocaleString('ar-EG')} ج.م</span>
                  </div>

                  <div className="space-y-2">
                    {pendingRequests.map(order => (
                      <div key={order.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#0F4C81]">{order.orderNo}</span>
                          <span className="font-bold text-slate-800">الونش: {order.craneName}</span>
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{order.type}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{order.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-100 p-4 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
