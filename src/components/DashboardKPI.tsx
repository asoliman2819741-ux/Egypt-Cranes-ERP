import React, { useMemo } from 'react';
import { 
  Truck, Wrench, Compass, Activity, 
  AlertTriangle, CheckCircle2, Clock, TrendingUp, 
  ArrowUpRight, ShieldCheck, Sparkles, BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Crane, MaintenanceOrder, Trip } from '../types';
import { useLanguage } from './LanguageContext';

export interface DashboardKPIProps {
  cranes: Crane[];
  maintenanceOrders: MaintenanceOrder[];
  trips: Trip[];
  onCardClick?: (metric: 'active_cranes' | 'pending_maintenance' | 'today_trips' | 'fleet_utilization') => void;
  className?: string;
}

export default function DashboardKPI({
  cranes = [],
  maintenanceOrders = [],
  trips = [],
  onCardClick,
  className = ''
}: DashboardKPIProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // 1. Calculate Active Cranes Metrics
  const totalCranes = cranes.length;
  const activeCranesCount = useMemo(() => {
    return cranes.filter(c => c.status === 'running').length;
  }, [cranes]);

  const idleCranesCount = useMemo(() => {
    return cranes.filter(c => c.status === 'idle').length;
  }, [cranes]);

  const maintenanceCranesCount = useMemo(() => {
    return cranes.filter(c => c.status === 'maintenance').length;
  }, [cranes]);

  const fleetUtilizationRate = useMemo(() => {
    if (totalCranes === 0) return 0;
    return Math.round((activeCranesCount / totalCranes) * 100);
  }, [activeCranesCount, totalCranes]);

  // 2. Calculate Pending Maintenance Orders Metrics
  const pendingMaintenanceCount = useMemo(() => {
    return maintenanceOrders.filter(m => m.status === 'pending').length;
  }, [maintenanceOrders]);

  const inProgressMaintenanceCount = useMemo(() => {
    return maintenanceOrders.filter(m => m.status === 'in_progress').length;
  }, [maintenanceOrders]);

  const completedMaintenanceCount = useMemo(() => {
    return maintenanceOrders.filter(m => m.status === 'completed').length;
  }, [maintenanceOrders]);

  const correctivePendingCount = useMemo(() => {
    return maintenanceOrders.filter(m => m.status === 'pending' && m.type === 'corrective').length;
  }, [maintenanceOrders]);

  // 3. Calculate Today's Total Trips Metrics
  const todayDateStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  }, []);

  // Find trips that depart today, or fall back to active/latest date trips in mock data if today has none
  const todaysTripsList = useMemo(() => {
    const todayMatches = trips.filter(t => t.departureTime && t.departureTime.startsWith(todayDateStr));
    if (todayMatches.length > 0) return todayMatches;

    // Find latest date present in trips dataset
    const dates = trips.map(t => t.departureTime ? t.departureTime.substring(0, 10) : '').filter(Boolean);
    if (dates.length === 0) return trips;
    const latestDate = dates.sort().reverse()[0];
    return trips.filter(t => t.departureTime && t.departureTime.startsWith(latestDate));
  }, [trips, todayDateStr]);

  const todaysTotalTripsCount = todaysTripsList.length;

  const activeTripsNowCount = useMemo(() => {
    return trips.filter(t => t.status === 'active').length;
  }, [trips]);

  const completedTripsTodayCount = useMemo(() => {
    return todaysTripsList.filter(t => t.status === 'completed').length;
  }, [todaysTripsList]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#0F4C81] to-[#125894] p-4 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[#F7941D] border border-white/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-wide">
                {isAr ? 'مؤشرات الأداء اللحظية (Real-time Dashboard KPIs)' : 'Real-time Dashboard KPIs'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ● {isAr ? 'مباشر' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {isAr ? 'متابعة لحظية لحالة الأوناش النشطة، أوامر الصيانة، ورحلات التشغيل' : 'Live tracking of active cranes, pending maintenance, and trip logistics'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
          <Clock className="w-3.5 h-3.5 text-[#F7941D]" />
          <span>{isAr ? 'تحديث تلقائي مستمر' : 'Auto-refreshed metrics'}</span>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Cranes */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onCardClick && onCardClick('active_cranes')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-3xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div>
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                {isAr ? 'الأوناش النشطة (العاملة)' : 'Active Cranes'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100/80 dark:border-emerald-800/80 group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {activeCranesCount}
              </span>
              <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">
                / {totalCranes} {isAr ? 'ونش إجمالي' : 'total'}
              </span>
            </div>

            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isAr ? `كفاءة التشغيل ${fleetUtilizationRate}%` : `Fleet efficiency ${fleetUtilizationRate}%`}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold border border-amber-100 dark:border-amber-800">
                {idleCranesCount} {isAr ? 'جاهز' : 'idle'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-extrabold border border-rose-100 dark:border-rose-800">
                {maintenanceCranesCount} {isAr ? 'صيانة' : 'maint'}
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </motion.div>

        {/* Card 2: Pending Maintenance Orders */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onCardClick && onCardClick('pending_maintenance')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-3xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
          <div>
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                {isAr ? 'أوامر الصيانة المعلقة' : 'Pending Maintenance'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100/80 dark:border-amber-800/80 group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {pendingMaintenanceCount}
              </span>
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                {isAr ? 'قيد الانتظار' : 'Awaiting action'}
              </span>
            </div>

            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                {isAr ? `${inProgressMaintenanceCount} أمر صيانة جارٍ التنفيذ بالورشة` : `${inProgressMaintenanceCount} orders in progress`}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              {correctivePendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-black flex items-center gap-1 border border-rose-200 dark:border-rose-800 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>{correctivePendingCount} {isAr ? 'عاجل طارئ' : 'urgent'}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold border border-emerald-100 dark:border-emerald-800">
                  ✓ {isAr ? 'لا يوجد صيانة عاجلة' : 'No critical faults'}
                </span>
              )}
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </motion.div>

        {/* Card 3: Today's Total Trips */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onCardClick && onCardClick('today_trips')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-3xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-sky-400" />
          <div>
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                {isAr ? 'إجمالي رحلات اليوم' : "Today's Total Trips"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0F4C81] dark:text-sky-400 flex items-center justify-center border border-blue-100/80 dark:border-blue-800/80 group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {todaysTotalTripsCount}
              </span>
              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                {isAr ? 'رحلة تشغيلية' : 'Trips'}
              </span>
            </div>

            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#F7941D]" />
              <span>
                {isAr ? `${activeTripsNowCount} رحلة جارية بالطريق حالياً` : `${activeTripsNowCount} trips currently active`}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold border border-emerald-100 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{completedTripsTodayCount} {isAr ? 'مكتملة' : 'completed'}</span>
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0F4C81] dark:group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </motion.div>

        {/* Card 4: Fleet Utilization Rate */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => onCardClick && onCardClick('fleet_utilization')}
          className={`p-5 rounded-2xl bg-white dark:bg-slate-900 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-3xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div>
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                {isAr ? 'نسبة استغلال الأسطول' : 'Fleet Utilization Rate'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/80 dark:border-indigo-800/80 group-hover:scale-110 transition-transform">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {fleetUtilizationRate}%
              </span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+4%</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
              <div 
                className="bg-gradient-to-r from-[#0F4C81] to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, fleetUtilizationRate))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isAr ? 'إنتاجية مثالية للأسطول' : 'Optimal operational state'}</span>
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
